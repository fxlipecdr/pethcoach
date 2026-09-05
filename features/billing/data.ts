import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { UserBillingStatus } from "./contracts";

export async function getBillingCustomer(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{ stripeCustomerId: string } | null> {
  const { data, error } = await client
    .from("billing_customers")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return { stripeCustomerId: data.stripe_customer_id };
}

export async function upsertBillingCustomer(
  client: SupabaseClient<Database>,
  input: {
    userId: string;
    stripeCustomerId: string;
  },
): Promise<void> {
  const { error } = await client.from("billing_customers").upsert(
    {
      user_id: input.userId,
      stripe_customer_id: input.stripeCustomerId,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(`Erro ao registrar cliente Stripe: ${error.message}`);
  }
}

export async function isWebhookEventProcessed(
  client: SupabaseClient<Database>,
  eventId: string,
): Promise<boolean> {
  const { data } = await client
    .from("processed_webhook_events")
    .select("id")
    .eq("event_id", eventId)
    .maybeSingle();

  return Boolean(data);
}

export async function recordProcessedWebhookEvent(
  client: SupabaseClient<Database>,
  input: {
    eventId: string;
    eventType: string;
  },
): Promise<void> {
  const { error } = await client.from("processed_webhook_events").insert({
    event_id: input.eventId,
    event_type: input.eventType,
  });

  if (error) {
    throw new Error(`Erro ao registrar evento de webhook: ${error.message}`);
  }
}

export async function grantOrUpdateEntitlement(
  client: SupabaseClient<Database>,
  input: {
    userId: string;
    scope: "full_program" | "subscription";
    status: "active" | "past_due" | "canceled" | "expired";
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    expiresAt?: string | null;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<void> {
  // If subscription ID is provided, check if it already exists to update
  if (input.stripeSubscriptionId) {
    const { data: existing } = await client
      .from("entitlements")
      .select("id")
      .eq("stripe_subscription_id", input.stripeSubscriptionId)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await client
        .from("entitlements")
        .update({
          status: input.status,
          expires_at: input.expiresAt ?? null,
          cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateErr) {
        throw new Error(
          `Erro ao atualizar direito de acesso: ${updateErr.message}`,
        );
      }
      return;
    }
  }

  // Otherwise, insert new entitlement
  const { error } = await client.from("entitlements").insert({
    user_id: input.userId,
    scope: input.scope,
    status: input.status,
    stripe_customer_id: input.stripeCustomerId ?? null,
    stripe_subscription_id: input.stripeSubscriptionId ?? null,
    expires_at: input.expiresAt ?? null,
    cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
  });

  if (error) {
    throw new Error(`Erro ao conceder direito de acesso: ${error.message}`);
  }
}

export async function getUserBillingStatus(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<UserBillingStatus> {
  const customer = await getBillingCustomer(client, userId);

  const { data: entitlements, error } = await client
    .from("entitlements")
    .select(
      "id, scope, status, expires_at, cancel_at_period_end, stripe_customer_id, stripe_subscription_id",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !entitlements || entitlements.length === 0) {
    return {
      hasActiveSubscription: false,
      hasFullProgram: false,
      hasAccess: false,
      scope: null,
      status: null,
      expiresAt: null,
      cancelAtPeriodEnd: false,
      stripeCustomerId: customer?.stripeCustomerId ?? null,
      stripeSubscriptionId: null,
    };
  }

  const activeEntitlement = entitlements.find((e) => {
    if (e.status !== "active") return false;
    if (e.expires_at && new Date(e.expires_at).getTime() < Date.now()) {
      return false;
    }
    return true;
  });

  const hasFullProgram = entitlements.some(
    (e) => e.scope === "full_program" && e.status === "active",
  );
  const hasActiveSubscription = entitlements.some((e) => {
    if (e.scope !== "subscription" || e.status !== "active") return false;
    if (e.expires_at && new Date(e.expires_at).getTime() < Date.now()) {
      return false;
    }
    return true;
  });

  const latest = entitlements[0];

  return {
    hasActiveSubscription,
    hasFullProgram,
    hasAccess: Boolean(activeEntitlement),
    scope: activeEntitlement?.scope ?? latest?.scope ?? null,
    status: activeEntitlement?.status ?? latest?.status ?? null,
    expiresAt: activeEntitlement?.expires_at ?? latest?.expires_at ?? null,
    cancelAtPeriodEnd: Boolean(
      activeEntitlement?.cancel_at_period_end ?? latest?.cancel_at_period_end,
    ),
    stripeCustomerId:
      activeEntitlement?.stripe_customer_id ??
      customer?.stripeCustomerId ??
      null,
    stripeSubscriptionId:
      activeEntitlement?.stripe_subscription_id ??
      latest?.stripe_subscription_id ??
      null,
  };
}
