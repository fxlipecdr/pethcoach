import { z } from "zod";

export const productEventSchema = z.enum([
  "landing_view",
  "quiz_started",
  "quiz_completed",
  "result_viewed",
  "account_created",
  "day1_started",
  "paywall_viewed",
  "checkout_started",
  "purchase_completed",
  "task_completed",
  "checkin_submitted",
  "plan_adjusted",
]);

export type ProductEvent = z.infer<typeof productEventSchema>;
export type ClientProductEvent = Exclude<ProductEvent, "purchase_completed">;

export const consentStatusSchema = z.enum(["pending", "granted", "denied"]);
export type ConsentStatus = z.infer<typeof consentStatusSchema>;

// Allowed click ID parameters for traffic attribution
// Reexportado para não quebrar quem já importava daqui. Código de cliente
// deve importar direto de "./click-ids" para não arrastar o Zod.
export { ALLOWED_CLICK_IDS, type AllowedClickId } from "./click-ids";

// Event property schemas with strict allowlists (Zero PII)
export const landingViewPropsSchema = z.object({
  slug: z.string().max(120),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(200).optional(),
  referrer: z.string().max(500).optional(),
  first_touch_id: z.string().uuid().optional(),
});

export const quizStartedPropsSchema = z.object({
  problem_slug: z.string().max(120),
  anonymous_id: z.string().uuid(),
});

export const quizCompletedPropsSchema = z.object({
  problem_slug: z.string().max(120),
  duration_s: z.number().int().nonnegative(),
  safety_status: z.enum([
    "CONTINUE",
    "REFER",
    "BLOCK",
    "continue",
    "refer",
    "block",
  ]),
});

export const resultViewedPropsSchema = z.object({
  segment: z.string().max(60),
  plan_eligible: z.boolean(),
});

export const accountCreatedPropsSchema = z.object({
  source: z.string().max(60),
  first_touch_id: z.string().uuid().optional(),
  last_touch_id: z.string().uuid().optional(),
});

export const day1StartedPropsSchema = z.object({
  program_slug: z.string().max(120),
  exercise_id: z.string().max(120),
});

export const paywallViewedPropsSchema = z.object({
  variant: z.string().max(60).optional(),
  plan_type: z.string().max(60),
});

export const checkoutStartedPropsSchema = z.object({
  price_id: z.string().max(120),
  offer_variant: z.string().max(60).optional(),
});

export const purchaseCompletedPropsSchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().max(10),
  product: z.string().max(120),
  attribution_id: z.string().uuid().optional(),
});

export const taskCompletedPropsSchema = z.object({
  task_id: z.string().max(120),
  day_number: z.number().int().positive(),
  difficulty: z.string().max(60),
  confidence: z.number().int().min(1).max(5).optional(),
  duration_s: z.number().int().nonnegative().optional(),
});

export const checkinSubmittedPropsSchema = z.object({
  day_number: z.number().int().positive(),
  difficulty: z.enum(["easy", "adequate", "challenging"]),
  mood: z.string().max(60),
  improvement_score: z.number().int().min(1).max(5).optional(),
  issue_tags: z.string().max(200).optional(),
});

export const planAdjustedPropsSchema = z.object({
  reason_code: z.string().max(120),
  ai_run_id: z.string().max(120).optional(),
});

// Event properties map
export type EventPropertiesMap = {
  landing_view: z.infer<typeof landingViewPropsSchema>;
  quiz_started: z.infer<typeof quizStartedPropsSchema>;
  quiz_completed: z.infer<typeof quizCompletedPropsSchema>;
  result_viewed: z.infer<typeof resultViewedPropsSchema>;
  account_created: z.infer<typeof accountCreatedPropsSchema>;
  day1_started: z.infer<typeof day1StartedPropsSchema>;
  paywall_viewed: z.infer<typeof paywallViewedPropsSchema>;
  checkout_started: z.infer<typeof checkoutStartedPropsSchema>;
  purchase_completed: z.infer<typeof purchaseCompletedPropsSchema>;
  task_completed: z.infer<typeof taskCompletedPropsSchema>;
  checkin_submitted: z.infer<typeof checkinSubmittedPropsSchema>;
  plan_adjusted: z.infer<typeof planAdjustedPropsSchema>;
};

export const eventSchemas = {
  landing_view: landingViewPropsSchema,
  quiz_started: quizStartedPropsSchema,
  quiz_completed: quizCompletedPropsSchema,
  result_viewed: resultViewedPropsSchema,
  account_created: accountCreatedPropsSchema,
  day1_started: day1StartedPropsSchema,
  paywall_viewed: paywallViewedPropsSchema,
  checkout_started: checkoutStartedPropsSchema,
  purchase_completed: purchaseCompletedPropsSchema,
  task_completed: taskCompletedPropsSchema,
  checkin_submitted: checkinSubmittedPropsSchema,
  plan_adjusted: planAdjustedPropsSchema,
} as const;

export interface AnalyticsProvider {
  capture<E extends ClientProductEvent>(
    event: E,
    properties: EventPropertiesMap[E],
  ): Promise<void>;
}

// Attribution touch schema matching public.attribution_touches table
export const attributionTouchInputSchema = z.object({
  anonymousId: z.string().uuid(),
  userId: z.string().uuid().nullable().optional(),
  touchType: z.enum(["first", "last"]),
  source: z.string().max(120).nullable().optional(),
  medium: z.string().max(120).nullable().optional(),
  campaign: z.string().max(200).nullable().optional(),
  referrer: z.string().max(500).nullable().optional(),
  landing: z.string().max(500).nullable().optional(),
  clickIds: z.record(z.string(), z.string()).optional(),
});

export type AttributionTouchInput = z.infer<typeof attributionTouchInputSchema>;
