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

async function count(table: string, column: string, userId: string) {
  const result = await db.query<{ total: number }>(
    `select count(*)::int as total from ${table} where ${column} = $1`,
    [userId],
  );
  return result.rows[0]?.total ?? 0;
}

describe("P14 — exclusão de conta por anonimização (LGPD)", () => {
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
      "20260908000000_p13_admin_and_content.sql",
      "20260909000000_p14_lgpd_data_rights.sql",
    ]) {
      await db.exec(
        await readFile(
          new URL(`../../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    }

    // Dado equivalente para os dois usuários, para provar o isolamento.
    for (const [index, user] of [userA, userB].entries()) {
      // A migração de P2 já cria o perfil para todo auth.users existente.
      await db.query(
        `update public.profiles set name = 'Tutor de teste' where id = $1`,
        [user],
      );
      await db.query(
        `insert into public.dogs (id, owner_id, name) values (gen_random_uuid(), $1, 'Luna')`,
        [user],
      );
      await db.query(
        `insert into public.email_preferences (user_id, unsubscribe_token)
         values ($1, $2)`,
        [user, String(index === 0 ? "a" : "b").repeat(64)],
      );
      await db.query(
        `insert into public.entitlements (user_id, scope, status)
         values ($1, 'full_program', 'active')`,
        [user],
      );
      await db.query(
        `insert into public.billing_customers (user_id, stripe_customer_id)
         values ($1, $2)`,
        [user, `cus_${index === 0 ? "a" : "b"}`],
      );
    }
  });

  afterAll(async () => {
    await db.close();
  });

  it("exige um usuário autenticado", async () => {
    await expect(
      asUser(null, () => db.query("select public.anonymize_account()")),
    ).rejects.toThrow();
  });

  it("remove o dado pessoal do titular e preserva o registro de cobrança", async () => {
    await asUser(userA, () => db.query("select public.anonymize_account()"));

    expect(await count("public.dogs", "owner_id", userA)).toBe(0);
    expect(await count("public.email_preferences", "user_id", userA)).toBe(0);
    expect(await count("public.assessments", "user_id", userA)).toBe(0);
    expect(await count("public.plans", "user_id", userA)).toBe(0);
    expect(await count("public.attribution_touches", "user_id", userA)).toBe(0);

    // Obrigação fiscal: a transação permanece, sem identificação.
    expect(await count("public.entitlements", "user_id", userA)).toBe(1);
    expect(await count("public.billing_customers", "user_id", userA)).toBe(1);

    const profile = await db.query<{
      name: string | null;
      deleted_at: string | null;
    }>(`select name, deleted_at from public.profiles where id = $1`, [userA]);
    expect(profile.rows[0]?.name).toBeNull();
    expect(profile.rows[0]?.deleted_at).not.toBeNull();
  });

  it("não alcança o dado de outro usuário", async () => {
    expect(await count("public.dogs", "owner_id", userB)).toBe(1);
    expect(await count("public.email_preferences", "user_id", userB)).toBe(1);
    expect(await count("public.entitlements", "user_id", userB)).toBe(1);

    const profile = await db.query<{
      name: string | null;
      deleted_at: string | null;
    }>(`select name, deleted_at from public.profiles where id = $1`, [userB]);
    expect(profile.rows[0]?.name).toBe("Tutor de teste");
    expect(profile.rows[0]?.deleted_at).toBeNull();
  });
});
