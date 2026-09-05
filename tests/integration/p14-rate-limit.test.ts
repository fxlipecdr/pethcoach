import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { rateLimitRules } from "@/lib/security/rate-limit-rules";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

let db: PGlite;

async function consume(userId: string | null, action: string) {
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
    const result = await db.query<{ allowed: boolean }>(
      "select public.consume_action_rate_limit($1) as allowed",
      [action],
    );
    return result.rows[0]?.allowed ?? null;
  } finally {
    await db.exec("reset role");
  }
}

describe("P14 — limite de requisições compartilhado", () => {
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
      "20260910000000_p14_shared_rate_limit.sql",
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

  it("mantém as regras do banco iguais às do código", async () => {
    const result = await db.query<{
      action: string;
      max_requests: number;
      window_seconds: number;
    }>("select action, max_requests, window_seconds from private.rate_limit_rules");

    const fromDatabase = Object.fromEntries(
      result.rows.map((row) => [
        row.action,
        { maxRequests: row.max_requests, windowSeconds: row.window_seconds },
      ]),
    );
    expect(fromDatabase).toEqual(rateLimitRules);
  });

  it("conta por usuário e nega ao estourar a janela", async () => {
    const rule = rateLimitRules.account_delete;
    for (let attempt = 0; attempt < rule.maxRequests; attempt += 1)
      expect(await consume(userA, "account_delete")).toBe(true);

    expect(await consume(userA, "account_delete")).toBe(false);
    // O balde do outro usuário não foi tocado.
    expect(await consume(userB, "account_delete")).toBe(true);
  });

  it("nega ação desconhecida em vez de liberar sem contagem", async () => {
    expect(await consume(userA, "acao_inexistente")).toBe(false);
  });

  it("não expõe a função para quem não está autenticado", async () => {
    // `anon` não tem grant de execução: a recusa vem antes do corpo da função.
    await expect(consume(null, "account_delete")).rejects.toThrow(
      /permission denied/i,
    );
  });

  it("mantém contadores separados por ação", async () => {
    // `account_delete` de userA já está esgotado pelo caso anterior.
    expect(await consume(userA, "profile_write")).toBe(true);
    expect(await consume(userA, "account_delete")).toBe(false);
  });
});
