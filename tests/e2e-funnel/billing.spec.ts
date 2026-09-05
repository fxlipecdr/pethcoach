import { createHmac, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./magic-link";

/**
 * P15 — a metade do billing que não depende de conta Stripe.
 *
 * Não há como abrir um checkout real sem chaves, mas o ponto crítico de
 * segurança é o outro: o acesso pago só pode nascer de um webhook com
 * assinatura válida. Isso é verificável localmente, porque `constructEvent` do
 * Stripe é HMAC puro — não chama a API deles.
 *
 * Cobre assinatura inválida, concessão do entitlement, idempotência por id de
 * evento e o reflexo disso na conta do tutor.
 */
const webhookSecret =
  process.env.FUNNEL_STRIPE_WEBHOOK_SECRET ?? "whsec_funil_local_de_teste";
const supabaseUrl = process.env.FUNNEL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const secretKey =
  process.env.FUNNEL_SUPABASE_SECRET_KEY ??
  "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

/** Reproduz o cabeçalho `stripe-signature` como o Stripe o monta. */
function signPayload(payload: string, secret: string, timestamp: number) {
  const assinatura = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");
  return `t=${timestamp},v1=${assinatura}`;
}

/** Evento de assinatura, no formato que o Stripe entrega ao webhook. */
function eventoDeAssinatura(
  tipo: string,
  eventId: string,
  assinatura: Record<string, unknown>,
) {
  return JSON.stringify({
    id: eventId,
    object: "event",
    type: tipo,
    created: Math.floor(Date.now() / 1000),
    data: { object: { object: "subscription", ...assinatura } },
  });
}

function checkoutCompleto(userId: string, eventId: string) {
  return JSON.stringify({
    id: eventId,
    object: "event",
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: `cs_test_${randomUUID().replace(/-/g, "")}`,
        object: "checkout.session",
        client_reference_id: userId,
        customer: `cus_test_${randomUUID().slice(0, 8)}`,
        customer_details: { email: "tutor@funil.local" },
        // `single_program` é a compra avulsa; o handler a mapeia para o
        // escopo `full_program`, que é o acesso vitalício ao programa.
        metadata: { userId, planType: "single_program" },
        mode: "payment",
        payment_status: "paid",
        status: "complete",
      },
    },
  });
}

/** Consulta administrativa, fora da RLS, só para conferir o efeito no banco. */
async function adminQuery(path: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
  });
  expect(response.ok, `consulta administrativa falhou: ${path}`).toBe(true);
  return (await response.json()) as Record<string, unknown>[];
}

/**
 * Resolve o usuário pelo e-mail na API administrativa do Auth.
 *
 * `auth.users` não é exposto pela REST API do PostgREST, e depender do "perfil
 * mais recente" quebraria assim que dois testes rodassem em paralelo.
 */
async function userIdPorEmail(address: string) {
  const response = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?per_page=200`,
    { headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` } },
  );
  expect(response.ok, "não foi possível listar usuários do Auth").toBe(true);
  const { users } = (await response.json()) as {
    users: { id: string; email: string }[];
  };
  const encontrado = users.find(
    (user) => user.email?.toLowerCase() === address.toLowerCase(),
  );
  expect(encontrado, `usuário ${address} não encontrado no Auth`).toBeTruthy();
  return encontrado!.id;
}

test("acesso pago só nasce de webhook com assinatura válida", async ({
  page,
  request,
}) => {
  const address = uniqueEmail("billing");
  await signIn(page, address);
  const userId = await userIdPorEmail(address);

  const eventId = `evt_test_${randomUUID().replace(/-/g, "")}`;
  const payload = checkoutCompleto(userId, eventId);

  // 1. Assinatura forjada é recusada e nada é concedido.
  const forjado = await request.post("/api/webhooks/stripe", {
    headers: {
      "stripe-signature": signPayload(payload, "whsec_chave_errada", Math.floor(Date.now() / 1000)),
      "content-type": "application/json",
    },
    data: payload,
  });
  expect(forjado.status()).toBe(400);
  expect(await adminQuery(`entitlements?user_id=eq.${userId}&select=id`)).toHaveLength(0);

  // 2. Assinatura válida concede o acesso.
  const valido = await request.post("/api/webhooks/stripe", {
    headers: {
      "stripe-signature": signPayload(payload, webhookSecret, Math.floor(Date.now() / 1000)),
      "content-type": "application/json",
    },
    data: payload,
  });
  expect(valido.status()).toBe(200);

  const entitlements = await adminQuery(
    `entitlements?user_id=eq.${userId}&select=id,scope,status`,
  );
  expect(entitlements).toHaveLength(1);
  expect(entitlements[0]).toMatchObject({
    scope: "full_program",
    status: "active",
  });

  // 3. Reenvio do mesmo evento não duplica o acesso.
  const repetido = await request.post("/api/webhooks/stripe", {
    headers: {
      "stripe-signature": signPayload(payload, webhookSecret, Math.floor(Date.now() / 1000)),
      "content-type": "application/json",
    },
    data: payload,
  });
  expect(repetido.status()).toBe(200);
  expect(
    await adminQuery(`entitlements?user_id=eq.${userId}&select=id`),
  ).toHaveLength(1);

  // 4. O tutor vê o acesso liberado na própria conta.
  await page.goto("/app/conta");
  await expect(page.getByText(/Programa Completo/i).first()).toBeVisible();
});

/**
 * Regressão do bug encontrado em produção em 05/09/2026.
 *
 * Cancelar pelo portal do Stripe não encerra o acesso na hora: a assinatura
 * segue `active` até o fim do período pago, e só então vem o `deleted`. Sem
 * guardar `cancel_at_period_end`, uma assinatura cancelada ficava idêntica no
 * banco a uma que ia renovar — e a conta anunciava "próxima renovação" para
 * quem tinha acabado de cancelar.
 */
test("ciclo de vida da assinatura: renovação, cancelamento e falha de pagamento", async ({
  page,
  request,
}) => {
  const address = uniqueEmail("assinatura");
  await signIn(page, address);
  const userId = await userIdPorEmail(address);
  const subscriptionId = `sub_test_${randomUUID().replace(/-/g, "")}`;
  const customerId = `cus_test_${randomUUID().slice(0, 8)}`;
  const fimDoPeriodo = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;

  async function enviar(tipo: string, assinatura: Record<string, unknown>) {
    const eventId = `evt_test_${randomUUID().replace(/-/g, "")}`;
    const payload = eventoDeAssinatura(tipo, eventId, {
      id: subscriptionId,
      customer: customerId,
      metadata: { userId },
      current_period_end: fimDoPeriodo,
      ...assinatura,
    });
    const resposta = await request.post("/api/webhooks/stripe", {
      headers: {
        "stripe-signature": signPayload(
          payload,
          webhookSecret,
          Math.floor(Date.now() / 1000),
        ),
        "content-type": "application/json",
      },
      data: payload,
    });
    expect(resposta.status()).toBe(200);
  }

  async function entitlement() {
    const linhas = await adminQuery(
      `entitlements?user_id=eq.${userId}&scope=eq.subscription&select=status,cancel_at_period_end,expires_at`,
    );
    expect(linhas).toHaveLength(1);
    return linhas[0]!;
  }

  // 1. Assinatura criada e ativa: renova normalmente.
  await enviar("customer.subscription.created", {
    status: "active",
    cancel_at_period_end: false,
  });
  expect(await entitlement()).toMatchObject({
    status: "active",
    cancel_at_period_end: false,
  });

  // 2. Cancelada no portal: continua com acesso, mas sem renovação.
  //    É este o estado que a interface anunciava errado.
  await enviar("customer.subscription.updated", {
    status: "active",
    cancel_at_period_end: true,
  });
  const cancelada = await entitlement();
  expect(cancelada).toMatchObject({
    status: "active",
    cancel_at_period_end: true,
  });
  expect(cancelada.expires_at).not.toBeNull();

  // 3. A conta precisa dizer a verdade: sem nova cobrança, com prazo.
  await page.goto("/app/conta");
  await expect(page.getByText(/Não haverá nova cobrança/i)).toBeVisible();
  await expect(page.getByText(/Próxima renovação/i)).toBeHidden();

  // 4. Falha de pagamento derruba para past_due.
  await enviar("customer.subscription.updated", {
    status: "past_due",
    cancel_at_period_end: false,
  });
  expect(await entitlement()).toMatchObject({ status: "past_due" });

  // 5. Fim do período: o acesso encerra de fato.
  await enviar("customer.subscription.deleted", { status: "canceled" });
  expect(await entitlement()).toMatchObject({ status: "canceled" });
});
