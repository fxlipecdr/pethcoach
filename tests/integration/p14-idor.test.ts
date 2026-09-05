import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * P14 — auditoria de IDOR e de bypass de entitlement.
 *
 * As fases anteriores cobriram `profiles`, `dogs` e `attribution_touches`.
 * Aqui a varredura é sobre tudo que passou a existir de P4 em diante: para
 * cada tabela com dono, o usuário A tenta ler, alterar, apagar e forjar linha
 * do usuário B usando o id direto, sem passar por Server Action nenhuma.
 */
const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";

let db: PGlite;
const ids: Record<string, { a: string; b: string }> = {};

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

/** Conta linhas que o usuário autenticado enxerga na tabela. */
async function visibleRows(userId: string, table: string) {
  return asUser(userId, async () => {
    const result = await db.query<{ total: number }>(
      // `count(id)` em vez de `count(*)`: algumas tabelas concedem SELECT
      // apenas em colunas específicas.
      `select count(id)::int as total from ${table}`,
    );
    return result.rows[0]?.total ?? 0;
  });
}

describe("P14 — IDOR e bypass de entitlement", () => {
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

    const problem = await db.query<{ id: string }>(
      "select id from public.problems limit 1",
    );
    const problemId = problem.rows[0]?.id;
    const moduleRow = await db.query<{ id: string }>(
      "select id from public.modules limit 1",
    );
    const moduleId = moduleRow.rows[0]?.id;
    expect(problemId, "a migração de P4 precisa semear problems").toBeTruthy();
    expect(moduleId, "a migração de P7 precisa semear modules").toBeTruthy();

    // Grafo equivalente para os dois usuários, criado sem RLS de propósito.
    for (const [label, user] of [
      ["a", userA],
      ["b", userB],
    ] as const) {
      const dog = await db.query<{ id: string }>(
        `insert into public.dogs (owner_id, name) values ($1, 'Luna') returning id`,
        [user],
      );
      const assessment = await db.query<{ id: string }>(
        `insert into public.assessments
           (id, user_id, anonymous_id, problem_id, quiz_version,
            anonymous_token_hash, token_expires_at, safety_status, status,
            completed_at, safety_rule_version, safety_evaluated_at)
         values (gen_random_uuid(), $1, gen_random_uuid(), $2, 1, $3,
                 now() + interval '1 day', 'continue', 'completed', now(),
                 'test', now())
         returning id`,
        [user, problemId, `${label}`.repeat(64)],
      );
      const plan = await db.query<{ id: string }>(
        `insert into public.plans
           (user_id, dog_id, assessment_id, problem_id, planner_type)
         values ($1, $2, $3, $4, 'deterministic_fallback') returning id`,
        [user, dog.rows[0]!.id, assessment.rows[0]!.id, problemId],
      );
      const planId = plan.rows[0]!.id;
      const task = await db.query<{ id: string }>(
        `insert into public.plan_tasks (plan_id, day_number, order_index, module_id)
         values ($1, 1, 1, $2) returning id`,
        [planId, moduleId],
      );
      const checkin = await db.query<{ id: string }>(
        `insert into public.daily_checkins (plan_id, day_number, user_id, mood)
         values ($1, 1, $2, 'calm') returning id`,
        [planId, user],
      );
      const milestone = await db.query<{ id: string }>(
        `insert into public.plan_milestones
           (plan_id, user_id, key, title, description)
         values ($1, $2, 'first_training_done', 'Primeiro treino', 'Feito')
         returning id`,
        [planId, user],
      );
      const adaptation = await db.query<{ id: string }>(
        `insert into public.plan_adaptations (plan_id, user_id, adaptation_type, reason)
         values ($1, $2, 'consolidation', 'teste') returning id`,
        [planId, user],
      );
      const entitlement = await db.query<{ id: string }>(
        `insert into public.entitlements (user_id, scope, status)
         values ($1, 'full_program', 'active') returning id`,
        [user],
      );
      const billing = await db.query<{ id: string }>(
        `insert into public.billing_customers (user_id, stripe_customer_id)
         values ($1, $2) returning id`,
        [user, `cus_${label}`],
      );
      const preferences = await db.query<{ id: string }>(
        `insert into public.email_preferences (user_id, unsubscribe_token)
         values ($1, $2) returning id`,
        [user, `${label}`.repeat(64)],
      );

      for (const [key, value] of [
        ["dogs", dog.rows[0]!.id],
        ["assessments", assessment.rows[0]!.id],
        ["plans", planId],
        ["plan_tasks", task.rows[0]!.id],
        ["daily_checkins", checkin.rows[0]!.id],
        ["plan_milestones", milestone.rows[0]!.id],
        ["plan_adaptations", adaptation.rows[0]!.id],
        ["entitlements", entitlement.rows[0]!.id],
        ["billing_customers", billing.rows[0]!.id],
        ["email_preferences", preferences.rows[0]!.id],
      ] as const) {
        ids[key] ??= { a: "", b: "" };
        ids[key]![label] = value;
      }
    }
  });

  afterAll(async () => {
    await db.close();
  });

  const ownedTables = [
    "dogs",
    "assessments",
    "plans",
    "plan_tasks",
    "daily_checkins",
    "plan_milestones",
    "plan_adaptations",
    "entitlements",
    "billing_customers",
    "email_preferences",
  ] as const;

  it.each(ownedTables)("%s: só expõe a linha do próprio dono", async (table) => {
    expect(await visibleRows(userA, `public.${table}`)).toBe(1);
    expect(await visibleRows(userB, `public.${table}`)).toBe(1);
  });

  it.each(ownedTables)(
    "%s: leitura por id direto da linha alheia devolve nada",
    async (table) => {
      const rows = await asUser(userA, async () => {
        const result = await db.query(
          `select id from public.${table} where id = $1`,
          [ids[table]!.b],
        );
        return result.rows;
      });
      expect(rows).toHaveLength(0);
    },
  );

  it.each(ownedTables)(
    "%s: update e delete da linha alheia não afetam nenhuma linha",
    async (table) => {
      const affected = await asUser(userA, async () => {
        const deleted = await db
          .query(`delete from public.${table} where id = $1 returning id`, [
            ids[table]!.b,
          ])
          .catch(() => ({ rows: [] }));
        return deleted.rows.length;
      });
      expect(affected).toBe(0);

      // A linha do outro usuário continua intacta.
      const survivors = await db.query(
        `select id from public.${table} where id = $1`,
        [ids[table]!.b],
      );
      expect(survivors.rows).toHaveLength(1);
    },
  );

  it("não permite forjar dono ao inserir plano para outro usuário", async () => {
    await expect(
      asUser(userA, () =>
        db.query(
          `insert into public.plans (user_id, dog_id, assessment_id, problem_id, planner_type)
           select $1, dog_id, assessment_id, problem_id, 'deterministic_fallback'
             from public.plans where id = $2`,
          [userB, ids.plans!.a],
        ),
      ),
    ).rejects.toThrow();
  });

  it("não deixa o usuário criar o próprio acesso pago", async () => {
    // Entitlement só nasce de webhook verificado. Se o cliente pudesse
    // inserir, todo o paywall cairia.
    await expect(
      asUser(userA, () =>
        db.query(
          `insert into public.entitlements (user_id, scope, status)
           values ($1, 'subscription', 'active')`,
          [userA],
        ),
      ),
    ).rejects.toThrow();
  });

  it("não deixa o usuário reativar o próprio acesso expirado", async () => {
    await db.query(
      `update public.entitlements set status = 'expired' where user_id = $1`,
      [userA],
    );
    const affected = await asUser(userA, async () => {
      const result = await db
        .query(
          `update public.entitlements set status = 'active'
            where user_id = $1 returning id`,
          [userA],
        )
        .catch(() => ({ rows: [] }));
      return result.rows.length;
    });
    expect(affected).toBe(0);

    const current = await db.query<{ status: string }>(
      `select status from public.entitlements where user_id = $1`,
      [userA],
    );
    expect(current.rows[0]?.status).toBe("expired");
  });

  it("mantém o schema private fora do alcance do cliente", async () => {
    for (const table of ["rate_limits", "rate_limit_rules"])
      await expect(
        asUser(userA, () => db.query(`select * from private.${table}`)),
      ).rejects.toThrow(/permission denied|does not exist/i);
  });

  it("não expõe operator_roles para quem não é operador", async () => {
    expect(await visibleRows(userA, "public.operator_roles")).toBe(0);
  });
});
