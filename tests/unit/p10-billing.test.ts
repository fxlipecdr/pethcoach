import { describe, expect, it } from "vitest";
import {
  BILLING_PLANS_CATALOG,
  billingCustomerSchema,
  billingPlanTypeSchema,
  createCheckoutInputSchema,
  userBillingStatusSchema,
} from "@/features/billing/contracts";
import { paymentProvider } from "@/lib/stripe/provider";

describe("P10 Billing Contracts & Schemas", () => {
  it("validates billingPlanTypeSchema values strictly", () => {
    expect(billingPlanTypeSchema.safeParse("monthly").success).toBe(true);
    expect(billingPlanTypeSchema.safeParse("annual").success).toBe(true);
    expect(billingPlanTypeSchema.safeParse("single_program").success).toBe(true);

    expect(billingPlanTypeSchema.safeParse("lifetime").success).toBe(false);
    expect(billingPlanTypeSchema.safeParse("weekly").success).toBe(false);
    expect(billingPlanTypeSchema.safeParse("free").success).toBe(false);
    expect(billingPlanTypeSchema.safeParse("").success).toBe(false);
  });

  it("validates createCheckoutInputSchema with and without dogId", () => {
    const withDog = {
      planType: "monthly",
      dogId: "aaaaaaaa-1111-4111-8111-111111111111",
    };
    expect(createCheckoutInputSchema.safeParse(withDog).success).toBe(true);

    const withoutDog = {
      planType: "annual",
    };
    expect(createCheckoutInputSchema.safeParse(withoutDog).success).toBe(true);

    const invalidDog = {
      planType: "single_program",
      dogId: "not-a-uuid",
    };
    expect(createCheckoutInputSchema.safeParse(invalidDog).success).toBe(false);
  });

  it("validates billingCustomerSchema correctly", () => {
    const valid = {
      id: "10000000-0000-4000-8000-000000000001",
      userId: "20000000-0000-4000-8000-000000000001",
      stripeCustomerId: "cus_test123456",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expect(billingCustomerSchema.safeParse(valid).success).toBe(true);
  });

  it("validates userBillingStatusSchema with various subscription states", () => {
    const activeSub = {
      hasActiveSubscription: true,
      hasFullProgram: false,
      hasAccess: true,
      scope: "subscription",
      status: "active",
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      stripeCustomerId: "cus_test123",
      stripeSubscriptionId: "sub_test123",
    };
    expect(userBillingStatusSchema.safeParse(activeSub).success).toBe(true);

    const freeUser = {
      hasActiveSubscription: false,
      hasFullProgram: false,
      hasAccess: false,
      scope: null,
      status: null,
      expiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
    expect(userBillingStatusSchema.safeParse(freeUser).success).toBe(true);
  });

  it("ensures BILLING_PLANS_CATALOG has exactly 3 coherent plans and 1 recommended", () => {
    expect(BILLING_PLANS_CATALOG).toHaveLength(3);
    const planIds = BILLING_PLANS_CATALOG.map((p) => p.id);
    expect(planIds).toContain("monthly");
    expect(planIds).toContain("annual");
    expect(planIds).toContain("single_program");

    const recommendedPlans = BILLING_PLANS_CATALOG.filter((p) => p.recommended);
    expect(recommendedPlans).toHaveLength(1);
    expect(recommendedPlans[0]?.id).toBe("annual");

    for (const plan of BILLING_PLANS_CATALOG) {
      expect(plan.title.length).toBeGreaterThan(0);
      expect(plan.priceFormatted.startsWith("R$")).toBe(true);
      expect(plan.features.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("P10 Stripe PaymentProvider Default Safe Fallback", () => {
  it("returns unavailable when stripe credentials are not configured", async () => {
    const checkoutResult = await paymentProvider.createCheckout({
      userId: "11111111-1111-4111-8111-111111111111",
      userEmail: "test@peth.com.br",
      planType: "monthly",
      successUrl: "http://127.0.0.1:3000/checkout/sucesso",
      cancelUrl: "http://127.0.0.1:3000/app/conta",
    });

    // In unit test environment without real STRIPE_SECRET_KEY, must return unavailable
    expect(checkoutResult.ok).toBe(false);
  });

  it("returns unavailable for customer portal when stripe is not configured", async () => {
    const portalResult = await paymentProvider.createPortal({
      stripeCustomerId: "cus_test123",
      returnUrl: "http://127.0.0.1:3000/app/conta",
    });

    expect(portalResult.ok).toBe(false);
  });
});
