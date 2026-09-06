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
  badge?: string;
  priceFormatted: string;
  period: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export const BILLING_PLANS_CATALOG: PlanPricingItem[] = [
  {
    id: "monthly",
    title: "Assinatura Mensal",
    priceFormatted: "R$ 49,90",
    period: "/mês",
    description: "Acompanhamento flexível com renovação mensal cancelável a qualquer momento.",
    features: [
      "Acesso completo aos 14 dias de treino",
      "Check-ins diários e adaptação de ritmo",
      "Histórico de sessões e marcos comportamentais",
      "Suporte a múltiplos cães no perfil",
    ],
  },
  {
    id: "annual",
    title: "Assinatura Anual",
    badge: "Mais Econômico",
    priceFormatted: "R$ 34,90",
    period: "/mês (cobrado anualmente R$ 418,80)",
    description: "O melhor custo-benefício para manter o bem-estar e o manejo contínuo durante todo o ano.",
    features: [
      "Economia de 30% em relação ao plano mensal",
      "Acesso completo aos 14 dias e novos módulos",
      "Check-ins diários com histórico permanente",
      "Linha do tempo e todos os marcos comportamentais",
    ],
    recommended: true,
  },
  {
    id: "single_program",
    title: "Programa Completo Avulso",
    priceFormatted: "R$ 147,00",
    period: "pagamento único",
    description: "Acesso vitalício à jornada estruturada de 14 dias para resolver o comportamento do seu cão.",
    features: [
      "Acesso vitalício ao plano de 14 dias gerado",
      "Sem cobranças recorrentes ou renovações",
      "Check-ins diários e marcos comportamentais",
      "Garantia de 7 dias incondicional",
    ],
  },
];
