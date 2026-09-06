import { z } from "zod";

export const billingPlanTypeSchema = z.enum([
  "monthly",
  "annual",
  "single_program",
]);
export type BillingPlanType = z.infer<typeof billingPlanTypeSchema>;

/**
 * Sinal de anúncio enviado junto do checkout.
 *
 * Vem do navegador, então é entrada não confiável e passa por schema como
 * qualquer outra. Serve para o webhook do Stripe saber, na hora da compra, se
 * pode enviar a conversão à Meta e com quais identificadores — sem isso o
 * servidor não tem como recuperar o aceite nem os cookies de primeira parte.
 */
export const metaSignalSchema = z.object({
  /** Aceite de cookies no momento do checkout. Só "granted" libera envio. */
  consent: z.enum(["granted", "denied", "pending"]).optional(),
  fbp: z
    .string()
    .max(200)
    .regex(/^[A-Za-z0-9._-]+$/)
    .optional(),
  fbc: z
    .string()
    .max(200)
    .regex(/^[A-Za-z0-9._-]+$/)
    .optional(),
});
export type MetaSignal = z.infer<typeof metaSignalSchema>;

export const createCheckoutInputSchema = z.object({
  planType: billingPlanTypeSchema,
  dogId: z.string().uuid().optional(),
  meta: metaSignalSchema.optional(),
});
export type CreateCheckoutInput = z.infer<typeof createCheckoutInputSchema>;

export const billingCustomerSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  stripeCustomerId: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type BillingCustomer = z.infer<typeof billingCustomerSchema>;

export const userBillingStatusSchema = z.object({
  hasActiveSubscription: z.boolean(),
  hasFullProgram: z.boolean(),
  hasAccess: z.boolean(),
  scope: z.enum(["full_program", "subscription"]).nullable(),
  status: z.enum(["active", "past_due", "canceled", "expired"]).nullable(),
  expiresAt: z.string().nullable(),
  /** Cancelada no portal: mantém acesso até expiresAt e não renova. */
  cancelAtPeriodEnd: z.boolean(),
  stripeCustomerId: z.string().nullable(),
  stripeSubscriptionId: z.string().nullable(),
});
export type UserBillingStatus = z.infer<typeof userBillingStatusSchema>;

export interface PlanPricingItem {
  id: BillingPlanType;
  title: string;
  /** Selo comparativo. Só aparece se `comparesTo` estiver visível na tela. */
  badge?: string;
  priceFormatted: string;
  period: string;
  description: string;
  features: string[];
  /**
   * Plano usado como referência nas afirmações comparativas deste card.
   *
   * Dizer "mais econômico" ou "com desconto" exige que o preço comparado
   * esteja à vista: anunciar vantagem sem mostrar a referência é publicidade
   * enganosa (CDC, art. 37). Quando o plano de referência não está sendo
   * vendido, todo o comparativo desaparece.
   */
  comparesTo?: BillingPlanType;
  /** Afirmações que só fazem sentido ao lado de `comparesTo`. */
  comparativeFeatures?: string[];
  recommended?: boolean;
}

/**
 * Descrição dos planos. O **valor** exibido ao tutor vem do Stripe, via
 * `features/billing/pricing.ts` — é o Stripe quem cobra, e anunciar um número
 * diferente do cobrado é propaganda enganosa. Os valores abaixo são só
 * referência para prévia de desenvolvimento, quando não há Stripe configurado.
 *
 * O plano anual fica descrito aqui, mas só aparece na tela quando existir um
 * preço anual cadastrado no Stripe.
 *
 * Sobre a comparação entre os planos: hoje o acesso é um booleano — qualquer
 * compra ativa libera os 7 programas, todos os dias, todos os cães. Então a
 * diferença **não** é quantidade de conteúdo, e dizer que é empurraria alguém
 * a pagar mais caro por uma distinção inexistente.
 *
 * A diferença real é permanência, e a conta é objetiva: R$ 97 ÷ R$ 39,90 dá
 * pouco menos de dois meses e meio. Até dois meses, a assinatura sai mais
 * barata; do terceiro em diante, o avulso. É isso que o texto abaixo diz.
 */
export const BILLING_PLANS_CATALOG: PlanPricingItem[] = [
  {
    id: "monthly",
    title: "Assinatura Mensal",
    priceFormatted: "R$ 39,90",
    period: "/mês",
    description:
      "Para resolver uma questão pontual agora, sem compromisso longo.",
    comparesTo: "single_program",
    comparativeFeatures: [
      "Sai mais barato que o vitalício se você usar por até dois meses",
    ],
    features: [
      "Todos os 7 programas enquanto a assinatura estiver ativa",
      "Check-ins diários, histórico e marcos comportamentais",
      "Cancele sozinho, sem falar com atendimento",
    ],
  },
  {
    id: "annual",
    title: "Assinatura Anual",
    badge: "Mais Econômico",
    priceFormatted: "R$ 34,90",
    period: "/mês (cobrado anualmente R$ 418,80)",
    description: "O melhor custo-benefício para manter o bem-estar e o manejo contínuo durante todo o ano.",
    comparesTo: "monthly",
    comparativeFeatures: ["Economia em relação ao plano mensal"],
    features: [
      "Acesso completo aos 14 dias e novos módulos",
      "Check-ins diários com histórico permanente",
      "Linha do tempo e todos os marcos comportamentais",
    ],
    recommended: true,
  },
  {
    id: "single_program",
    title: "Acesso Completo Vitalício",
    priceFormatted: "R$ 97,00",
    period: "pagamento único",
    description:
      "Para acompanhar o cão ao longo da vida. Paga uma vez, e continua seu quando aparecer um problema novo daqui a um ano.",
    comparesTo: "monthly",
    comparativeFeatures: ["Compensa a partir do terceiro mês de uso"],
    features: [
      "Todos os 7 programas, para sempre",
      "Novos programas incluídos conforme entram no catálogo",
      "Sem mensalidade e sem renovação",
    ],
  },
];
