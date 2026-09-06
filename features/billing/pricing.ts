import "server-only";
import { paymentProvider } from "@/lib/stripe/provider";
import { BILLING_PLANS_CATALOG, type BillingPlanType } from "./contracts";

/**
 * Preços exibidos ao tutor, lidos do Stripe.
 *
 * O catálogo em `contracts.ts` descreve o que cada plano entrega; o **valor**
 * vem daqui, do Stripe, que é quem de fato cobra. Enquanto o número vivia fixo
 * no código, mudar o preço no painel fazia a página anunciar um valor e o
 * checkout cobrar outro — divergência que o Código de Defesa do Consumidor
 * trata como propaganda enganosa, e que ninguém percebe até um cliente
 * reclamar.
 *
 * Se o Stripe não responder, cai para o texto do catálogo: a página continua
 * de pé, apenas com o valor de referência.
 */
export interface ResolvedPlanPrice {
  priceFormatted: string;
  period: string;
  /** Falso quando o valor veio do catálogo, não do Stripe. */
  live: boolean;
  /**
   * Se o plano pode ser exibido e comprado.
   *
   * Plano sem preço cadastrado no Stripe não pode ser vendido: exibi-lo com o
   * valor de referência do código anuncia uma oferta que o checkout recusa. Só
   * fica visível sem preço vivo quando o Stripe inteiro não está configurado —
   * ambiente de desenvolvimento, onde a tela existe para revisar layout.
   */
  available: boolean;
  /**
   * Por que o preço não pôde ser lido, quando não pôde. Serve ao diagnóstico
   * em `/api/ready`: cada motivo aponta para uma correção diferente.
   */
  motivo?: string;
}

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function periodoDe(interval: string | undefined, planType: BillingPlanType) {
  if (interval === "month") return "/mês";
  if (interval === "year") return "/ano";
  return planType === "single_program" ? "pagamento único" : "";
}

export async function resolvePlanPrices(): Promise<
  Record<BillingPlanType, ResolvedPlanPrice>
> {
  // Sem Stripe configurado a tela é prévia de layout, e o catálogo basta.
  const stripeConfigurado = paymentProvider.isConfigured();

  const entradas = await Promise.all(
    BILLING_PLANS_CATALOG.map(async (plano) => {
      const resultado = await paymentProvider.getLivePrice(plano.id);
      if (resultado.estado !== "ok") {
        return [
          plano.id,
          {
            priceFormatted: plano.priceFormatted,
            period: plano.period,
            live: false,
            available: !stripeConfigurado,
            motivo: resultado.estado,
          },
        ] as const;
      }
      const vivo = resultado.preco;
      return [
        plano.id,
        {
          priceFormatted:
            vivo.currency.toLowerCase() === "brl"
              ? moeda.format(vivo.unitAmount / 100)
              : `${vivo.currency.toUpperCase()} ${(vivo.unitAmount / 100).toFixed(2)}`,
          period: periodoDe(vivo.interval, plano.id),
          live: true,
          available: true,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entradas) as Record<
    BillingPlanType,
    ResolvedPlanPrice
  >;
}
