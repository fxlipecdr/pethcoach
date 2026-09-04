import { describe, expect, it } from "vitest";
import {
  sendEmailInputSchema,
  emailPreferencesSchema,
  unsubscribeInputSchema,
  EMAIL_TEMPLATE_KEYS,
  TEMPLATE_TO_CATEGORY,
} from "@/features/emails/contracts";
import { renderEmailTemplate } from "@/features/emails/templates";
import { ResendEmailProvider } from "@/lib/email/provider";
import { dispatchTransactionalEmail } from "@/features/emails/dispatcher";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("P12 Email Contracts and Validation", () => {
  it("validates sendEmailInputSchema strictly", () => {
    const valid = sendEmailInputSchema.safeParse({
      recipientEmail: "tutor@exemplo.com.br",
      userId: "11111111-1111-4111-8111-111111111111",
      templateKey: "welcome",
      idempotencyKey: "welcome:11111111-1111-4111-8111-111111111111",
      templateData: { dogName: "Pipoca" },
    });
    expect(valid.success).toBe(true);

    const invalidEmail = sendEmailInputSchema.safeParse({
      recipientEmail: "not-an-email",
      templateKey: "welcome",
      idempotencyKey: "welcome:12345",
    });
    expect(invalidEmail.success).toBe(false);

    const invalidKey = sendEmailInputSchema.safeParse({
      recipientEmail: "tutor@exemplo.com.br",
      templateKey: "welcome",
      idempotencyKey: "123", // too short (< 6 chars)
    });
    expect(invalidKey.success).toBe(false);
  });

  it("validates emailPreferencesSchema defaults correctly", () => {
    const parsed = emailPreferencesSchema.parse({});
    expect(parsed.trainingReminders).toBe(true);
    expect(parsed.milestoneCelebrations).toBe(true);
    expect(parsed.billingNotifications).toBe(true);
    expect(parsed.marketingTips).toBe(false); // Opt-in by default
    expect(parsed.unsubscribedAll).toBe(false);
  });

  it("validates unsubscribeInputSchema tokens", () => {
    const validToken = "a".repeat(32);
    expect(
      unsubscribeInputSchema.safeParse({
        token: validToken,
        category: "training_reminders",
      }).success,
    ).toBe(true);

    expect(
      unsubscribeInputSchema.safeParse({
        token: "too-short",
      }).success,
    ).toBe(false);
  });
});

describe("P12 Email Templates — Respectful, No-Guilt, WCAG 2.2 AA", () => {
  it("renders all 7 templates without guilt mechanisms or streak threats", () => {
    const dummyToken = "abcdef1234567890abcdef1234567890";
    const siteUrl = "https://coach.peth.com.br";

    for (const templateKey of EMAIL_TEMPLATE_KEYS) {
      const rendered = renderEmailTemplate(
        templateKey,
        {
          dogName: "Thor",
          milestoneTitle: "Primeiro Treino Concluído",
          milestoneDescription: "Primeiro passo com reforço positivo",
          planName: "Programa Completo",
        },
        {
          siteUrl,
          unsubscribeToken: dummyToken,
        },
      );

      // 1. Structure
      expect(rendered.subject).toBeTruthy();
      expect(rendered.html).toContain("<!DOCTYPE html>");
      expect(rendered.text).toBeTruthy();

      // 2. Unsubscribe links and LGPD compliance
      expect(rendered.html).toContain(
        `${siteUrl}/unsubscribe?token=${dummyToken}`,
      );
      expect(rendered.html).toContain("Cancelar esta categoria");
      expect(rendered.html).toContain("Cancelar todos");
      expect(rendered.html).toContain(`${siteUrl}/politica-de-privacidade`);
      expect(rendered.html).toContain("PethCoach Tecnologia Ltda.");

      // 3. No guilt patterns, no punishment, no streak threats
      const lowerHtml = rendered.html.toLowerCase();
      expect(lowerHtml).not.toContain("perdeu sua sequência");
      expect(lowerHtml).not.toContain("perder sua ofensiva");
      expect(lowerHtml).not.toContain("castigo");
      expect(lowerHtml).not.toContain("punição");
      expect(lowerHtml).not.toContain("bronca");
      expect(lowerHtml).not.toContain("urgente! corra");

      // 4. Category mapping matches
      const expectedCategory = TEMPLATE_TO_CATEGORY[templateKey];
      expect(rendered.html).toContain(expectedCategory);
    }
  });
});

describe("P12 Email Provider Fallback", () => {
  it("fails closed with unavailable when credentials are not configured", async () => {
    const provider = new ResendEmailProvider();
    // Default server env in test mode does not have RESEND_API_KEY
    const res = await provider.send({
      to: "tutor@exemplo.com.br",
      subject: "Teste",
      html: "<p>Teste</p>",
      idempotencyKey: "test:key:123",
    });

    expect(res).toEqual({ ok: false, code: "NOT_IMPLEMENTED" });
  });
});

describe("P12 Transactional Email Dispatcher Logic", () => {
  it("skips duplicate idempotency keys without sending", async () => {
    const mockClient = {
      from: (table: string) => {
        if (table === "email_delivery_logs") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: "existing-log-id",
                    status: "sent",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as SupabaseClient<Database>;

    const result = await dispatchTransactionalEmail(
      {
        recipientEmail: "tutor@exemplo.com.br",
        userId: "11111111-1111-4111-8111-111111111111",
        templateKey: "welcome",
        idempotencyKey: "welcome:duplicate-test",
        templateData: {},
      },
      { client: mockClient },
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.reason).toBe("duplicate_idempotency");
    }
  });

  it("skips delivery when user unsubscribed from that category", async () => {
    let recordedStatus = "";
    let recordedSkipReason = "";

    const mockClient = {
      from: (table: string) => {
        if (table === "email_delivery_logs") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
            insert: (data: Record<string, unknown>) => {
              recordedStatus = data.status as string;
              recordedSkipReason = data.skip_reason as string;
              return {
                select: () => ({
                  single: async () => ({
                    data: { id: "log-unsub-cat" },
                    error: null,
                  }),
                }),
              };
            },
          };
        }
        if (table === "email_preferences") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    user_id: "11111111-1111-4111-8111-111111111111",
                    training_reminders: false, // Category unsubscribed
                    milestone_celebrations: true,
                    billing_notifications: true,
                    marketing_tips: false,
                    unsubscribed_all: false,
                    unsubscribe_token: "token-123456789012345678901234567890",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as SupabaseClient<Database>;

    const result = await dispatchTransactionalEmail(
      {
        recipientEmail: "tutor@exemplo.com.br",
        userId: "11111111-1111-4111-8111-111111111111",
        templateKey: "checkin_reminder", // belongs to training_reminders
        idempotencyKey: "checkin:user-1:test",
        templateData: {},
      },
      { client: mockClient },
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.reason).toBe("unsubscribed_category");
    }
    expect(recordedStatus).toBe("skipped");
    expect(recordedSkipReason).toBe("unsubscribed_category");
  });

  it("skips delivery when user unsubscribed from all emails", async () => {
    const mockClient = {
      from: (table: string) => {
        if (table === "email_delivery_logs") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
            insert: () => ({
              select: () => ({
                single: async () => ({
                  data: { id: "log-unsub-all" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "email_preferences") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    user_id: "11111111-1111-4111-8111-111111111111",
                    unsubscribed_all: true,
                    unsubscribe_token: "token-123456789012345678901234567890",
                  },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      },
    } as unknown as SupabaseClient<Database>;

    const result = await dispatchTransactionalEmail(
      {
        recipientEmail: "tutor@exemplo.com.br",
        userId: "11111111-1111-4111-8111-111111111111",
        templateKey: "payment_confirmed",
        idempotencyKey: "payment:user-1:test",
        templateData: {},
      },
      { client: mockClient },
    );

    expect(result.ok).toBe(true);
    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.reason).toBe("unsubscribed_all");
    }
  });
});
