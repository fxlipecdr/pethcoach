import { describe, expect, it } from "vitest";
import { aiProvider } from "@/lib/ai/provider";
import { paymentProvider } from "@/lib/stripe/provider";
import { emailProvider } from "@/lib/email/provider";
import { scrubDiagnosticEvent } from "@/lib/observability/scrub";

describe("foundation fails closed", () => {
  it("does not fabricate a plan, checkout, portal or sent email", async () => {
    const results = await Promise.all([
      aiProvider.generatePlan({
        assessmentId: "test",
        eligibleModuleIds: [],
        promptVersion: "unreviewed",
      }),
      paymentProvider.createCheckout({ userId: "test", priceId: "test" }),
      paymentProvider.createPortal({ userId: "test" }),
      emailProvider.send({
        recipientId: "test",
        templateId: "test",
        idempotencyKey: "test",
      }),
    ]);
    for (const result of results)
      expect(result).toEqual({ ok: false, code: "NOT_IMPLEMENTED" });
  });
  it("strips PII and arbitrary diagnostic data by allowlist", () => {
    const input = {
      event_id: "event-1",
      message: "tutor@example.test",
      request: { cookies: "secret" },
      user: { email: "private" },
      exception: { values: [] },
    };
    const result = scrubDiagnosticEvent(input);
    expect(result.event_id).toBe("event-1");
    expect(JSON.stringify(result)).not.toMatch(
      /secret|private|example|request|exception/,
    );
  });
});
