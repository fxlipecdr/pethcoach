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

describe("P12 Email Retention, Preferences, and Delivery Logs Integration Tests", () => {
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
      "20260907000000_p12_email_retention.sql",
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

  it("enforces RLS on email_preferences: user can only access their own record", async () => {
    // 1. Service role inserts preferences for User A and User B
    const tokenA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const tokenB = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    await db.query(
      `insert into public.email_preferences (user_id, unsubscribe_token, training_reminders, marketing_tips)
       values ($1, $2, true, false), ($3, $4, true, false)`,
      [userA, tokenA, userB, tokenB],
    );

    // 2. User A can read their own preferences
    const resA = await asUser(userA, async () => {
      const q = await db.query(
        `select user_id, training_reminders, marketing_tips from public.email_preferences`,
      );
      return q.rows;
    });

    expect(resA).toHaveLength(1);
    expect(resA[0]).toMatchObject({
      user_id: userA,
      training_reminders: true,
      marketing_tips: false,
    });

    // 3. User A cannot update User B's preferences
    await asUser(userA, async () => {
      await db.query(
        `update public.email_preferences set training_reminders = false where user_id = $1`,
        [userB],
      );
    });

    // Check that User B's record is unchanged
    const checkB = await db.query<{ training_reminders: boolean }>(
      `select training_reminders from public.email_preferences where user_id = $1`,
      [userB],
    );
    expect(checkB.rows[0]?.training_reminders).toBe(true);

    // 4. Anonymous cannot read or update email_preferences (permission denied)
    await expect(
      asUser(null, async () => {
        await db.query(`select * from public.email_preferences`);
      }),
    ).rejects.toThrow(/permission denied/);
  });

  it("blocks direct access to email_delivery_logs from anon and authenticated users", async () => {
    // 1. Insert an email log via service role
    await db.query(
      `insert into public.email_delivery_logs
       (user_id, recipient_email, template_key, idempotency_key, status)
       values ($1, 'tutor@exemplo.com.br', 'welcome', 'welcome:userA:1', 'sent')`,
      [userA],
    );

    // 2. Authenticated user cannot select from email_delivery_logs
    await expect(
      asUser(userA, async () => {
        await db.query(`select * from public.email_delivery_logs`);
      }),
    ).rejects.toThrow();

    // 3. Anonymous user cannot select from email_delivery_logs
    await expect(
      asUser(null, async () => {
        await db.query(`select * from public.email_delivery_logs`);
      }),
    ).rejects.toThrow();
  });

  it("enforces unique constraint on idempotency_key in email_delivery_logs", async () => {
    const key = "checkin:userA:2026-09-04";

    await db.query(
      `insert into public.email_delivery_logs
       (user_id, recipient_email, template_key, idempotency_key, status)
       values ($1, 'tutor@exemplo.com.br', 'checkin_reminder', $2, 'sent')`,
      [userA, key],
    );

    // Attempting to insert another log with the same idempotency_key must fail
    await expect(
      db.query(
        `insert into public.email_delivery_logs
         (user_id, recipient_email, template_key, idempotency_key, status)
         values ($1, 'tutor@exemplo.com.br', 'checkin_reminder', $2, 'sent')`,
        [userA, key],
      ),
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });
});
