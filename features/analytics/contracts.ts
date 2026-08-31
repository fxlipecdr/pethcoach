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
export interface AnalyticsProvider {
  capture(
    event: ClientProductEvent,
    properties: Record<string, string | number | boolean>,
  ): Promise<void>;
}
