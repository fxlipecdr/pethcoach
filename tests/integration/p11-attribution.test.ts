import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const anonymousA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

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

describe("P11 Attribution Touches and RLS Integration Tests", () => {
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

  it("revokes direct insert from anon and authenticated users (RLS + Grants)", async () => {
    // Anon direct write must fail
    await expect(
      asUser(null, async () => {
        await db.query(
          "insert into public.attribution_touches (anonymous_id, touch_type) values ($1, 'first')",
          [anonymousA],
        );
      }),
    ).rejects.toThrow();

    // Authenticated direct write must also fail
    await expect(
      asUser(userA, async () => {
        await db.query(
          "insert into public.attribution_touches (user_id, touch_type) values ($1, 'first')",
          [userA],
        );
      }),
    ).rejects.toThrow();
  });

  it("allows backend service-role to record first touch and last touch with click_ids", async () => {
    // Service role (unrestricted by RLS) records the first touch
    const firstRes = await db.query<{ id: string }>(
      `insert into public.attribution_touches (
        anonymous_id, touch_type, source, medium, campaign, referrer, landing, click_ids
      ) values ($1, 'first', $2, $3, $4, $5, $6, $7) returning id`,
      [
        anonymousA,
        "instagram",
        "cpc",
        "campanha_filhotes",
        "https://instagram.com/ad",
        "https://coach.peth.com.br/problemas/filhote-mordendo",
        JSON.stringify({ fbclid: "fb_token_123" }),
      ],
    );
    expect(firstRes.rows).toHaveLength(1);

    // Records last touch
    const lastRes = await db.query<{ id: string }>(
      `insert into public.attribution_touches (
        anonymous_id, touch_type, source, medium, campaign, landing
      ) values ($1, 'last', $2, $3, $4, $5) returning id`,
      [
        anonymousA,
        "google",
        "cpc",
        "campanha_retargeting",
        "https://coach.peth.com.br/app",
      ],
    );
    expect(lastRes.rows).toHaveLength(1);
  });

  it("links anonymous touches to authenticated user upon conversion", async () => {
    // Backend updates touches for anonymousA to userA
    const linkRes = await db.query<{ id: string }>(
      `update public.attribution_touches
       set user_id = $1
       where anonymous_id = $2 and user_id is null
       returning id`,
      [userA, anonymousA],
    );
    expect(linkRes.rows.length).toBeGreaterThanOrEqual(2);

    // Now User A can select their own attribution touches
    const userAView = await asUser(userA, async () => {
      const { rows } = await db.query(
        "select * from public.attribution_touches where user_id = $1",
        [userA],
      );
      return rows;
    });
    expect(userAView.length).toBeGreaterThanOrEqual(2);

    // User B cannot see User A's attribution touches (Strict Isolation)
    const userBView = await asUser(userB, async () => {
      const { rows } = await db.query("select * from public.attribution_touches");
      return rows;
    });
    expect(userBView).toHaveLength(0);
  });
});
