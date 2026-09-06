import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolvePlanPrices } from "@/features/billing/pricing";
import { BILLING_PLANS_CATALOG } from "@/features/billing/contracts";

export const dynamic = "force-dynamic";

/**
 * Readiness protegido — P15.
 *
 * `/api/health` responde apenas que o processo HTTP está de pé. Isto aqui diz
 * se as dependências respondem, que é o que decide se vale enviar tráfego para
 * a instância depois de um deploy ou de um rollback.
 *
 * A resposta nunca revela configuração: sem URL, sem chave, sem nome de host.
 * Cada dependência sai como `ok`, `degradado` ou `ausente`, mais a latência.
 * Sem `CRON_SECRET` configurado a rota devolve 404, para não virar um
 * inventário público de fornecedores em ambiente sem segredo definido.
 */
type Estado = "ok" | "degradado" | "ausente";

interface Dependencia {
  nome: string;
  estado: Estado;
  latencia_ms?: number;
}

async function verificarBanco(): Promise<Dependencia> {
  const client = createSupabaseAdminClient();
  if (!client) return { nome: "banco", estado: "ausente" };
  const inicio = Date.now();
  try {
    // Consulta trivial em catálogo público: não toca dado pessoal.
    const { error } = await client
      .from("problems")
      .select("id", { count: "exact", head: true })
      .limit(1);
    return {
      nome: "banco",
      estado: error ? "degradado" : "ok",
      latencia_ms: Date.now() - inicio,
    };
  } catch {
    return { nome: "banco", estado: "degradado", latencia_ms: Date.now() - inicio };
  }
}

export async function GET(request: Request) {
  let env;
  try {
    env = getServerEnv();
  } catch {
    return NextResponse.json(
      { pronto: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!env.CRON_SECRET) return new NextResponse(null, { status: 404 });

  const authorization = request.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;
  const fornecido = bearer ?? request.headers.get("x-cron-secret");
  if (!fornecido || fornecido !== env.CRON_SECRET)
    return NextResponse.json(
      { pronto: false },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );

  /**
   * Situação de cada plano, para responder sem adivinhação por que um card não
   * aparece na tela.
   *
   * Preço no Stripe é imutável: alterar o valor cria um preço novo, com ID
   * novo, e arquiva o antigo. É por isso que uma variável `STRIPE_PRICE_*`
   * deixa de resolver depois de "atualizar o plano" no painel. Aqui fica
   * visível qual delas parou de responder.
   *
   * Nenhum ID nem valor é revelado: só se o plano está vendável.
   */
  const precos = await resolvePlanPrices();
  const planos = BILLING_PLANS_CATALOG.map((plano) => ({
    plano: plano.id,
    estado: precos[plano.id].live
      ? ("ok" as const)
      : (precos[plano.id].motivo ?? "ausente"),
    visivel_na_loja: precos[plano.id].available,
  }));

  const dependencias: Dependencia[] = [
    await verificarBanco(),
    {
      nome: "pagamentos",
      estado: env.STRIPE_WEBHOOK_SECRET ? "ok" : "ausente",
    },
    { nome: "email", estado: env.RESEND_API_KEY ? "ok" : "ausente" },
    {
      nome: "planner_ia",
      // Sem chave o planner usa o fallback determinístico: degradado, não fora.
      estado: env.OPENAI_API_KEY ? "ok" : "degradado",
    },
  ];

  // Só o banco impede servir tráfego; o resto tem caminho de contingência.
  const pronto = dependencias[0]?.estado === "ok";

  // Qual versão está no ar. É o que responde "o rollback pegou?" sem depender
  // do painel da hospedagem, e fica atrás do segredo por não ser informação
  // de visitante. A variável é preenchida pela Vercel durante a build.
  const commit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

  return NextResponse.json(
    {
      pronto,
      commit,
      verificado_em: new Date().toISOString(),
      dependencias,
      planos,
    },
    {
      status: pronto ? 200 : 503,
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    },
  );
}
