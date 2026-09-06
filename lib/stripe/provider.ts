import "server-only";
import Stripe from "stripe";
import { unavailable, type Unavailable } from "@/lib/providers";
import { getServerEnv } from "@/lib/env/server";
import type { BillingPlanType } from "@/features/billing/contracts";

export type CreateCheckoutResult =
  | { ok: true; url: string; sessionId: string }
  | { ok: false; error: string }
  | Unavailable;

/** Preço vivo, lido do Stripe. */
export interface LivePrice {
  /** Valor em centavos, como o Stripe guarda. */
  unitAmount: number;
  currency: string;
  /** "month" | "year" quando recorrente; ausente em pagamento único. */
  interval?: string;
}

/**
 * Por que um preço não pôde ser usado.
 *
 * Cada motivo aponta para uma correção diferente, e sem essa distinção o
 * sintoma — "o plano não aparece" — é idêntico nos quatro casos:
 *
 * - `sem_id`: a variável `STRIPE_PRICE_*` está vazia no ambiente. Na Vercel,
 *   isso acontece quando a variável não foi marcada para **Production**, ou
 *   quando não houve redeploy depois de criá-la.
 * - `nao_encontrado`: o ID não existe nesta conta. Normalmente é ID de produto
 *   (`prod_…`) no lugar do ID de preço (`price_…`).
 * - `modo_errado`: o preço existe, mas no outro modo. Chave de produção com
 *   preço de teste, ou o contrário.
 * - `arquivado`: o preço existe e está desativado. É o que acontece com o
 *   preço antigo depois de "alterar o valor" de um plano.
 */
export type LivePriceFailure =
  | "sem_id"
  | "nao_encontrado"
  | "modo_errado"
  | "arquivado"
  | "sem_valor"
  | "erro";

export type LivePriceResult =
  | { estado: "ok"; preco: LivePrice }
  | { estado: LivePriceFailure };

export type CreatePortalResult =
  | { ok: true; url: string }
  | { ok: false; error: string }
  | Unavailable;

export interface CreateCheckoutInput {
  userId: string;
  userEmail?: string;
  planType?: BillingPlanType;
  priceId?: string;
  successUrl?: string;
  cancelUrl?: string;
  stripeCustomerId?: string | null;
  metadata?: Record<string, string>;
}

export interface CreatePortalInput {
  userId?: string;
  stripeCustomerId?: string;
  returnUrl?: string;
}

export interface PaymentProvider {
  isConfigured(): boolean;
  getPriceId(planType: BillingPlanType): string | null;
  getLivePrice(planType: BillingPlanType): Promise<LivePriceResult>;
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
  createPortal(input: CreatePortalInput): Promise<CreatePortalResult>;
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): Stripe.Event;
}

class StripePaymentProvider implements PaymentProvider {
  private client: Stripe | null = null;

  private getClient(): Stripe | null {
    if (this.client) return this.client;
    const env = getServerEnv();
    if (!env.STRIPE_SECRET_KEY) return null;
    this.client = new Stripe(env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
    return this.client;
  }

  isConfigured(): boolean {
    const env = getServerEnv();
    return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
  }

  getPriceId(planType: BillingPlanType): string | null {
    const env = getServerEnv();
    switch (planType) {
      case "monthly":
        return env.STRIPE_PRICE_MONTHLY ?? null;
      case "annual":
        return env.STRIPE_PRICE_ANNUAL ?? null;
      case "single_program":
        return env.STRIPE_PRICE_SINGLE_PROGRAM ?? null;
      default:
        return null;
    }
  }

  /**
   * Lê o preço direto do Stripe.
   *
   * O que o site anuncia e o que o Stripe cobra precisam ser o mesmo número.
   * Enquanto o valor exibido vivia fixo no código, bastava alterar o preço no
   * painel para a página passar a mentir — e anunciar um preço e cobrar outro
   * é propaganda enganosa perante o Código de Defesa do Consumidor.
   *
   * Falha aqui não derruba a página: quem chama cai para o texto do catálogo,
   * que passa a ser apenas um último recurso visual.
   */
  async getLivePrice(planType: BillingPlanType): Promise<LivePriceResult> {
    const stripe = this.getClient();
    const priceId = this.getPriceId(planType);
    if (!stripe || !priceId) return { estado: "sem_id" };

    try {
      const price = await stripe.prices.retrieve(priceId);
      /**
       * Preço arquivado ainda responde na API, mas o checkout o recusa.
       * Acontece toda vez que se "altera o valor" de um plano: o Stripe não
       * edita preço, cria um novo e arquiva o antigo. Sem esta verificação, a
       * variável apontando para o preço velho exibiria um card que dá erro no
       * clique — pior do que não exibir nada.
       */
      if (!price.active) return { estado: "arquivado" };
      if (typeof price.unit_amount !== "number") return { estado: "sem_valor" };
      return {
        estado: "ok",
        preco: {
          unitAmount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
        },
      };
    } catch (err) {
      /**
       * A mensagem do Stripe distingue "não existe" de "existe no outro modo",
       * e essa diferença aponta para correções opostas. Só o veredito é
       * propagado: a mensagem original contém o ID e não sai daqui.
       */
      const mensagem = err instanceof Error ? err.message : "";
      if (/similar object exists in (live|test) mode/i.test(mensagem))
        return { estado: "modo_errado" };
      if (/no such price|resource_missing/i.test(mensagem))
        return { estado: "nao_encontrado" };
      return { estado: "erro" };
    }
  }

  async createCheckout(
    input: CreateCheckoutInput,
  ): Promise<CreateCheckoutResult> {
    const stripe = this.getClient();
    if (!stripe) return unavailable;

    const priceId =
      input.priceId ??
      (input.planType ? this.getPriceId(input.planType) : null);
    if (!priceId) {
      return {
        ok: false,
        error: "Identificador de preço não configurado para este plano.",
      };
    }

    const mode =
      input.planType === "single_program" ? "payment" : "subscription";

    try {
      /**
       * `payment_method_types` é deliberadamente omitido.
       *
       * Quando o campo é enviado, o Stripe exige que **todos** os métodos
       * listados estejam ativos na conta e **rejeita a criação da sessão** se
       * algum não estiver. Fixar `["card", "pix"]` no código quebraria o
       * checkout inteiro enquanto o Pix não estivesse aprovado — e no Brasil o
       * Pix é liberado só por convite, após no mínimo 60 dias processando
       * pagamentos.
       *
       * Omitindo o campo, o Stripe usa os métodos configurados no Dashboard e
       * escolhe os relevantes para o cliente. O Pix passa a aparecer sozinho no
       * dia em que for aprovado, sem tocar em código e sem risco de derrubar a
       * venda enquanto não for.
       */
      const session = await stripe.checkout.sessions.create({
        customer: input.stripeCustomerId ?? undefined,
        customer_email: input.stripeCustomerId ? undefined : input.userEmail,
        client_reference_id: input.userId,
        mode,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url:
          input.successUrl ?? "http://127.0.0.1:3000/checkout/sucesso",
        cancel_url: input.cancelUrl ?? "http://127.0.0.1:3000/app/conta",
        metadata: {
          userId: input.userId,
          ...(input.planType ? { planType: input.planType } : {}),
          ...input.metadata,
        },
        subscription_data:
          mode === "subscription"
            ? {
                metadata: {
                  userId: input.userId,
                  ...(input.planType ? { planType: input.planType } : {}),
                },
              }
            : undefined,
      });

      if (!session.url) {
        return { ok: false, error: "Stripe não retornou URL de checkout." };
      }

      return {
        ok: true,
        url: session.url,
        sessionId: session.id,
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Erro ao criar sessão de checkout.",
      };
    }
  }

  async createPortal(input: CreatePortalInput): Promise<CreatePortalResult> {
    const stripe = this.getClient();
    if (!stripe) return unavailable;

    if (!input.stripeCustomerId || !input.returnUrl) {
      return {
        ok: false,
        error:
          "ID de cliente e URL de retorno são obrigatórios para o portal.",
      };
    }

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: input.stripeCustomerId,
        return_url: input.returnUrl,
      });

      return {
        ok: true,
        url: session.url,
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : "Erro ao criar sessão do portal Stripe.",
      };
    }
  }

  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): Stripe.Event {
    const stripe =
      this.getClient() ?? new Stripe("dummy_key", { typescript: true });
    return stripe.webhooks.constructEvent(payload, signature, secret);
  }
}

export const paymentProvider: PaymentProvider = new StripePaymentProvider();
