import { z } from "zod";

export const EMAIL_CATEGORIES = [
  "training_reminders",
  "milestone_celebrations",
  "billing_notifications",
  "marketing_tips",
] as const;

export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];

export const EMAIL_TEMPLATE_KEYS = [
  "welcome",
  "day1_incomplete",
  "checkin_reminder",
  "milestone",
  "payment_confirmed",
  "payment_failed",
  "re_engagement",
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export const TEMPLATE_TO_CATEGORY: Record<EmailTemplateKey, EmailCategory> = {
  welcome: "training_reminders",
  day1_incomplete: "training_reminders",
  checkin_reminder: "training_reminders",
  milestone: "milestone_celebrations",
  payment_confirmed: "billing_notifications",
  payment_failed: "billing_notifications",
  re_engagement: "training_reminders",
};

export const CATEGORY_LABELS: Record<EmailCategory, { title: string; description: string }> = {
  training_reminders: {
    title: "Lembretes e Rotina de Treino",
    description: "Notificações do plano do seu cão, lembretes suaves de check-in e continuidade.",
  },
  milestone_celebrations: {
    title: "Conquistas e Marcos",
    description: "Celebração calorosa de avanços comportamentais e marcos alcançados.",
  },
  billing_notifications: {
    title: "Pagamento e Assinatura",
    description: "Avisos essenciais sobre liberação de acesso, recibos e alertas de renovação.",
  },
  marketing_tips: {
    title: "Dicas Comportamentais e Novidades",
    description: "Artigos práticos de adestramento positivo e atualizações do PethCoach (opt-in).",
  },
};

export const emailPreferencesSchema = z.object({
  trainingReminders: z.boolean().default(true),
  milestoneCelebrations: z.boolean().default(true),
  billingNotifications: z.boolean().default(true),
  marketingTips: z.boolean().default(false),
  unsubscribedAll: z.boolean().default(false),
});

export type EmailPreferences = z.infer<typeof emailPreferencesSchema>;

export const sendEmailInputSchema = z.object({
  recipientEmail: z.string().email("Endereço de e-mail inválido."),
  userId: z.string().uuid("ID de usuário inválido.").optional().nullable(),
  templateKey: z.enum(EMAIL_TEMPLATE_KEYS),
  idempotencyKey: z
    .string()
    .min(6, "Chave de idempotência muito curta.")
    .max(255, "Chave de idempotência muito longa."),
  templateData: z.record(z.string(), z.unknown()).default({}),
});

export type SendEmailInput = z.infer<typeof sendEmailInputSchema>;

export const unsubscribeInputSchema = z.object({
  token: z.string().min(32).max(255),
  category: z.enum(EMAIL_CATEGORIES).optional(),
  all: z.boolean().optional(),
});

export type UnsubscribeInput = z.infer<typeof unsubscribeInputSchema>;
