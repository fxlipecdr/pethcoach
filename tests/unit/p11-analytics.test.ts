import { describe, expect, it, beforeEach } from "vitest";
import {
  eventSchemas,
  productEventSchema,
  consentStatusSchema,
  ALLOWED_CLICK_IDS,
  attributionTouchInputSchema,
} from "@/features/analytics/contracts";
import {
  parseAttributionParams,
  sanitizeReferrer,
} from "@/features/analytics/attribution";
import {
  getStoredConsent,
  setConsent,
  CONSENT_STORAGE_KEY,
  CONSENT_COOKIE_NAME,
} from "@/features/analytics/consent";
import {
  analytics,
  hasAnalyticsConsent,
  setAnalyticsConsent,
} from "@/lib/posthog/client";
import { captureServerEvent } from "@/lib/posthog/server";

describe("P11 Analytics Contracts and Schemas", () => {
  it("validates all 12 product events from blueprint", () => {
    const events = productEventSchema.options;
    expect(events).toHaveLength(12);
    expect(events).toContain("landing_view");
    expect(events).toContain("quiz_started");
    expect(events).toContain("quiz_completed");
    expect(events).toContain("result_viewed");
    expect(events).toContain("account_created");
    expect(events).toContain("day1_started");
    expect(events).toContain("paywall_viewed");
    expect(events).toContain("checkout_started");
    expect(events).toContain("purchase_completed");
    expect(events).toContain("task_completed");
    expect(events).toContain("checkin_submitted");
    expect(events).toContain("plan_adjusted");

    expect(consentStatusSchema.options).toEqual(["pending", "granted", "denied"]);
    expect(ALLOWED_CLICK_IDS).toEqual(["gclid", "fbclid", "ttclid"]);
    expect(CONSENT_STORAGE_KEY).toBe("peth_analytics_consent");
    expect(CONSENT_COOKIE_NAME).toBe("peth_consent");
  });

  it("validates landing_view props schema strictly without PII", () => {
    const valid = {
      slug: "filhote-mordendo",
      utm_source: "instagram",
      utm_medium: "cpc",
      utm_campaign: "primavera_2026",
      referrer: "https://instagram.com/pethcoach",
    };
    expect(eventSchemas.landing_view.parse(valid)).toEqual(valid);

    // Rejects oversized slug
    expect(() =>
      eventSchemas.landing_view.parse({ slug: "a".repeat(150) }),
    ).toThrow();
  });

  it("validates quiz_started and quiz_completed schemas", () => {
    const anonId = "12345678-1234-4234-8234-123456789abc";
    expect(
      eventSchemas.quiz_started.parse({
        problem_slug: "cachorro-puxa-guia",
        anonymous_id: anonId,
      }),
    ).toBeTruthy();

    expect(
      eventSchemas.quiz_completed.parse({
        problem_slug: "cachorro-puxa-guia",
        duration_s: 45,
        safety_status: "CONTINUE",
      }),
    ).toBeTruthy();

    // Invalid safety status throws
    expect(() =>
      eventSchemas.quiz_completed.parse({
        problem_slug: "cachorro-puxa-guia",
        duration_s: 45,
        safety_status: "INVALID",
      }),
    ).toThrow();
  });

  it("validates purchase_completed server-only event schema", () => {
    const valid = {
      amount: 197.0,
      currency: "BRL",
      product: "full_program",
    };
    expect(eventSchemas.purchase_completed.parse(valid)).toEqual(valid);

    // Negative amount fails
    expect(() =>
      eventSchemas.purchase_completed.parse({
        amount: -10,
        currency: "BRL",
        product: "full_program",
      }),
    ).toThrow();
  });

  it("validates task_completed and checkin_submitted schemas", () => {
    expect(
      eventSchemas.task_completed.parse({
        task_id: "mod-01-t1",
        day_number: 1,
        difficulty: "adequate",
      }),
    ).toBeTruthy();

    expect(
      eventSchemas.checkin_submitted.parse({
        day_number: 1,
        difficulty: "adequate",
        mood: "calm",
      }),
    ).toBeTruthy();
  });

  it("validates attributionTouchInputSchema", () => {
    const input = {
      anonymousId: "12345678-1234-4234-8234-123456789abc",
      touchType: "first" as const,
      source: "google",
      medium: "organic",
      landing: "https://coach.peth.com.br",
      clickIds: { gclid: "abc123xyz" },
    };
    expect(attributionTouchInputSchema.parse(input)).toEqual(input);
  });
});

describe("P11 Traffic Attribution and URL Sanitization", () => {
  it("sanitizes referrer removing sensitive query params and tokens", () => {
    const raw =
      "https://example.com/checkout?token=secret123&user_email=tutor@test.com#card-details";
    const sanitized = sanitizeReferrer(raw);
    expect(sanitized).toBe("https://example.com/checkout");

    // Invalid protocol is stripped
    expect(sanitizeReferrer("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeReferrer("not-a-url")).toBeUndefined();
    expect(sanitizeReferrer("")).toBeUndefined();
  });

  it("parses UTMs and allowed click IDs while dropping unknown params", () => {
    const url =
      "https://coach.peth.com.br/problemas/filhote-mordendo?utm_source=meta&utm_medium=paid&utm_campaign=filhotes_sp&fbclid=fb123456&gclid=g987654&malicious_param=evil&email=admin@test.com";
    const ref = "https://facebook.com/ad-story?click=999";

    const parsed = parseAttributionParams(url, ref);
    expect(parsed.source).toBe("meta");
    expect(parsed.medium).toBe("paid");
    expect(parsed.campaign).toBe("filhotes_sp");
    expect(parsed.landing).toBe(
      "https://coach.peth.com.br/problemas/filhote-mordendo",
    );
    expect(parsed.referrer).toBe("https://facebook.com/ad-story");
    expect(parsed.clickIds).toEqual({
      fbclid: "fb123456",
      gclid: "g987654",
    });

    // Verify unallowed params are NOT present
    expect(parsed.clickIds).not.toHaveProperty("malicious_param");
    expect(parsed.clickIds).not.toHaveProperty("email");
  });
});

describe("P11 Consent Governance", () => {
  let mockStorage: Record<string, string> = {};
  let mockCookie = "";

  beforeEach(() => {
    mockStorage = {};
    mockCookie = "";

    globalThis.window = {
      localStorage: {
        getItem: (k: string) => mockStorage[k] ?? null,
        setItem: (k: string, v: string) => {
          mockStorage[k] = v;
        },
        removeItem: (k: string) => {
          delete mockStorage[k];
        },
        clear: () => {
          mockStorage = {};
        },
        key: () => null,
        length: 0,
      } as unknown as Storage,
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as Window & typeof globalThis;

    globalThis.document = {
      get cookie() {
        return mockCookie;
      },
      set cookie(v: string) {
        mockCookie = v;
      },
    } as unknown as Document;
  });

  it("defaults consent to pending when not set", () => {
    expect(getStoredConsent()).toBe("pending");
  });

  it("persists granted consent to localStorage and cookie", () => {
    setConsent("granted");
    expect(getStoredConsent()).toBe("granted");
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("persists denied consent and opts out tracking", () => {
    setConsent("denied");
    expect(getStoredConsent()).toBe("denied");
    expect(hasAnalyticsConsent()).toBe(false);
  });
});

describe("P11 Analytics Provider and Server Capture", () => {
  it("suppresses capture when consent is not granted", async () => {
    await setAnalyticsConsent(false);
    // Should not throw or fail
    await expect(
      analytics.capture("landing_view", {
        slug: "home",
      }),
    ).resolves.toBeUndefined();
  });

  it("captureServerEvent returns missing_credentials when env is empty", async () => {
    const result = await captureServerEvent(
      "purchase_completed",
      {
        amount: 197,
        currency: "BRL",
        product: "full_program",
      },
      "user-123",
    );
    expect(result).toEqual({ ok: false, reason: "missing_credentials" });
  });
});
