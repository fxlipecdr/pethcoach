import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

let db: PGlite;

async function asUser<T>(userId: string | null, operation: () => Promise<T>) {
  if (userId) {
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
      userId,
    ]);
  } else {
    await db.exec("set role anon");
    await db.query("select set_config('request.jwt.claim.sub', '', false)");
  }
  try {
    return await operation();
  } finally {
    await db.exec("reset role");
  }
}

describe("P10 Billing, Webhooks, and Entitlements Integration Tests", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values ('${userA}'), ('${userB}');
    `);

    for (const file of [
      "20260831000000_profiles_baseline.sql",
      "20260831010000_p2_auth_dogs_attribution.sql",
      "20260901010000_p4_quiz_assessments.sql",
      "20260901020000_p5_safety_gate.sql",
      "20260901021000_p5_quiz_option_contract_fix.sql",
      "20260902000000_p6_assessment_claim.sql",
      "20260903000000_p7_catalog_and_plans.sql",
      "20260904000000_p8_training_execution_and_entitlements.sql",
      "20260905000000_p9_adaptation_and_milestones.sql",
      "20260906000000_p10_billing_and_webhooks.sql",
    ]) {
      await db.exec(
        await readFile(
          new URL(`../../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    }
  });

  afterAll(async () => {
    await db.close();
  });

  it("allows authenticated owner to read their billing_customer record and enforces RLS isolation", async () => {
    // Insert billing customer via internal/service role
    await db.query(
      `insert into public.billing_customers (user_id, stripe_customer_id)
       values ($1, 'cus_userA_123')`,
      [userA],
    );

    // User A can read their own stripe customer ID
    const userARead = await asUser(userA, () =>
      db.query<{ stripe_customer_id: string }>(
        "select stripe_customer_id from public.billing_customers where user_id = $1",
        [userA],
      ),
    );
    expect(userARead.rows).toHaveLength(1);
    expect(userARead.rows[0]?.stripe_customer_id).toBe("cus_userA_123");

    // User B cannot see User A's stripe customer record via RLS
    const userBRead = await asUser(userB, () =>
      db.query("select * from public.billing_customers where user_id = $1", [
        userA,
      ]),
    );
    expect(userBRead.rows).toHaveLength(0);

    // Anonymous is denied access
    await expect(
      asUser(null, () =>
        db.query("select * from public.billing_customers where user_id = $1", [
          userA,
        ]),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("enforces unique constraints on billing_customers", async () => {
    // Cannot insert duplicate user_id
    await expect(
      db.query(
        `insert into public.billing_customers (user_id, stripe_customer_id)
         values ($1, 'cus_userA_456')`,
        [userA],
      ),
    ).rejects.toThrow();

    // Cannot insert duplicate stripe_customer_id for different user
    await expect(
      db.query(
        `insert into public.billing_customers (user_id, stripe_customer_id)
         values ($1, 'cus_userA_123')`,
        [userB],
      ),
    ).rejects.toThrow();
  });

  it("revokes all access on processed_webhook_events from authenticated and anonymous users", async () => {
    // Service role records event
    await db.query(
      `insert into public.processed_webhook_events (event_id, event_type)
       values ('evt_test_123', 'checkout.session.completed')`,
    );

    // Authenticated users cannot read processed webhook events
    await expect(
      asUser(userA, () =>
        db.query("select * from public.processed_webhook_events"),
      ),
    ).rejects.toThrow(/permission denied/i);

    // Anonymous users cannot read processed webhook events
    await expect(
      asUser(null, () =>
        db.query("select * from public.processed_webhook_events"),
      ),
    ).rejects.toThrow(/permission denied/i);

    // Duplicate event_id must fail unique constraint (idempotency ledger)
    await expect(
      db.query(
        `insert into public.processed_webhook_events (event_id, event_type)
         values ('evt_test_123', 'checkout.session.completed')`,
      ),
    ).rejects.toThrow();
  });

  it("grants and updates entitlements with stripe_customer_id and stripe_subscription_id", async () => {
    // Grant initial subscription entitlement
    await db.query(
      `insert into public.entitlements (
        user_id, scope, status, stripe_customer_id, stripe_subscription_id
      ) values ($1, 'subscription', 'active', 'cus_userA_123', 'sub_userA_999')`,
      [userA],
    );

    const userAEntitlement = await asUser(userA, () =>
      db.query<{
        scope: string;
        status: string;
        stripe_subscription_id: string;
      }>(
        "select scope, status, stripe_subscription_id from public.entitlements where user_id = $1",
        [userA],
      ),
    );
    expect(userAEntitlement.rows).toHaveLength(1);
    expect(userAEntitlement.rows[0]?.scope).toBe("subscription");
    expect(userAEntitlement.rows[0]?.status).toBe("active");
    expect(userAEntitlement.rows[0]?.stripe_subscription_id).toBe(
      "sub_userA_999",
    );

    // Update status to past_due on invoice payment failure
    await db.query(
      `update public.entitlements
       set status = 'past_due', updated_at = now()
       where stripe_subscription_id = 'sub_userA_999'`,
    );

    const updatedEntitlement = await asUser(userA, () =>
      db.query<{ status: string }>(
        "select status from public.entitlements where stripe_subscription_id = 'sub_userA_999'",
      ),
    );
    expect(updatedEntitlement.rows[0]?.status).toBe("past_due");
  });
});
