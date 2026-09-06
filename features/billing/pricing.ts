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

/**
 * Preços para a página pública.
 *
 * Regra diferente da tela logada, e de propósito. Lá, plano sem preço vivo
 * desaparece, porque o clique cairia direto num checkout que o Stripe recusa.
 * Aqui não há checkout imediato — o botão leva ao acesso — e uma página de
 * planos sem nenhum preço é pior por três motivos: o revisor do Stripe abre o
 * site justamente para ver o que é vendido e por quanto, quem chega de anúncio
 * desiste sem saber o preço, e o CDC exige informação clara e ostensiva do
 * valor antes da contratação.
 *
 * Então o valor de referência do catálogo aparece quando o Stripe não responde
 * — e o erro é registrado, alto, porque significa que a vitrine está exibindo
 * um número que ninguém confirmou contra a cobrança.
 */
export async function resolvePublicPlanPrices(): Promise<
  Record<BillingPlanType, ResolvedPlanPrice>
> {
  const precos = await resolvePlanPrices();
  for (const [plano, preco] of Object.entries(precos)) {
    if (!preco.live) {
      console.error(
        `[precos] vitrine pública exibindo valor de referência para "${plano}": ` +
          `${preco.motivo ?? "desconhecido"}. Confira /api/ready.`,
      );
    }
  }
  return precos;
}

export async function resolvePlanPrices(): Promise<
  Record<BillingPlanType, ResolvedPlanPrice>
> {
  /**
   * Ler o ambiente não pode derrubar a página.
   *
   * A home passou a exibir preço, e com isso a renderização dela passou a
   * depender do ambiente do servidor. Uma variável mal configurada — no caso
   * real, a da IA — fez a build inteira falhar em `Error occurred prerendering
   * page "/"`. Preço é conteúdo importante, mas nunca ao ponto de tirar o
   * produto do ar: qualquer falha aqui cai para o catálogo.
   */
  let stripeConfigurado = false;
  try {
    stripeConfigurado = paymentProvider.isConfigured();
  } catch (err) {
    console.error(
      `[precos] ambiente ilegível ao montar a vitrine: ${err instanceof Error ? err.message : "desconhecido"}`,
    );
    return Object.fromEntries(
      BILLING_PLANS_CATALOG.map((plano) => [
        plano.id,
        {
          priceFormatted: plano.priceFormatted,
          period: plano.period,
          live: false,
          available: true,
          motivo: "ambiente_ilegivel",
        },
      ]),
    ) as Record<BillingPlanType, ResolvedPlanPrice>;
  }

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
