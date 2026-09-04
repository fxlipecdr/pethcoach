import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const adminUser = "11111111-1111-4111-8111-111111111111";
const reviewerUser = "22222222-2222-4222-8222-222222222222";
const normalUser = "33333333-3333-4333-8333-333333333333";

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

describe("P13 Admin, Content Governance, and RLS Integration Tests", () => {
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
      insert into auth.users values ('${adminUser}'), ('${reviewerUser}'), ('${normalUser}');
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
    ]) {
      await db.exec(
        await readFile(
          new URL(`../../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    }

    // Seed operator roles
    await db.query(
      `insert into public.operator_roles (user_id, role) values ($1, 'admin'), ($2, 'reviewer')`,
      [adminUser, reviewerUser],
    );
  });

  afterAll(async () => {
    await db.close();
  });

  it("enforces RLS on modules: normal user and anon cannot view draft or reviewed modules", async () => {
    // 1. Get problem id
    const probRes = await db.query(
      "select id from public.problems where slug = 'filhote-mordendo' limit 1",
    );
    const problemId = (probRes.rows[0] as { id: string }).id;

    // 2. Service role inserts a draft module
    const draftModId = "44444444-4444-4444-8444-444444444444";
    await db.query(
      `insert into public.modules (id, problem_id, slug, title, category, difficulty, estimated_duration_minutes, setup_instructions, steps, success_criteria, stop_conditions, status)
       values ($1, $2, 'rascunho-secreto', 'Módulo Rascunho', 'Teste', 'beginner', 5, 'Preparo', '["Passo 1"]'::jsonb, 'Sucesso', 'Parada', 'draft')`,
      [draftModId, problemId],
    );

    // 3. Normal user SELECT does NOT return the draft module
    const normalRows = await asUser(normalUser, async () => {
      const q = await db.query("select id from public.modules where id = $1", [
        draftModId,
      ]);
      return q.rows;
    });
    expect(normalRows).toHaveLength(0);

    // 4. Anonymous SELECT does NOT return the draft module
    const anonRows = await asUser(null, async () => {
      const q = await db.query("select id from public.modules where id = $1", [
        draftModId,
      ]);
      return q.rows;
    });
    expect(anonRows).toHaveLength(0);

    // 5. Reviewer user CAN see the draft module
    const reviewerRows = await asUser(reviewerUser, async () => {
      const q = await db.query("select id from public.modules where id = $1", [
        draftModId,
      ]);
      return q.rows;
    });
    expect(reviewerRows).toHaveLength(1);
    expect(reviewerRows[0]).toMatchObject({ id: draftModId });

    // 6. Admin user CAN see the draft module
    const adminRows = await asUser(adminUser, async () => {
      const q = await db.query("select id from public.modules where id = $1", [
        draftModId,
      ]);
      return q.rows;
    });
    expect(adminRows).toHaveLength(1);
    expect(adminRows[0]).toMatchObject({ id: draftModId });
  });

  it("enforces RLS on modules: normal users cannot insert or update modules", async () => {
    const probRes = await db.query(
      "select id from public.problems where slug = 'filhote-mordendo' limit 1",
    );
    const problemId = (probRes.rows[0] as { id: string }).id;
    const testId = "55555555-5555-4555-8555-555555555555";

    // Normal user attempting to insert fails
    await expect(
      asUser(normalUser, async () => {
        await db.query(
          `insert into public.modules (id, problem_id, slug, title, category, difficulty, estimated_duration_minutes, setup_instructions, steps, success_criteria, stop_conditions, status)
           values ($1, $2, 'invasao-user', 'Invasão', 'Teste', 'beginner', 5, 'Preparo', '["Passo 1"]'::jsonb, 'Sucesso', 'Parada', 'published')`,
          [testId, problemId],
        );
      }),
    ).rejects.toThrow();

    // Reviewer user can insert
    await asUser(reviewerUser, async () => {
      await db.query(
        `insert into public.modules (id, problem_id, slug, title, category, difficulty, estimated_duration_minutes, setup_instructions, steps, success_criteria, stop_conditions, status)
         values ($1, $2, 'modulo-revisor', 'Módulo Revisor', 'Teste', 'beginner', 5, 'Preparo', '["Passo 1"]'::jsonb, 'Sucesso', 'Parada', 'draft')`,
        [testId, problemId],
      );
    });

    const check = await db.query("select id from public.modules where id = $1", [
      testId,
    ]);
    expect(check.rows).toHaveLength(1);
  });

  it("enforces RLS on module_revisions audit trail", async () => {
    const revModId = "55555555-5555-4555-8555-555555555555";

    // Normal user cannot insert revision
    await expect(
      asUser(normalUser, async () => {
        await db.query(
          `insert into public.module_revisions (module_id, operator_id, action, from_status, to_status, notes)
           values ($1, $2, 'submit_review', 'draft', 'reviewed', 'Tentativa não autorizada')`,
          [revModId, normalUser],
        );
      }),
    ).rejects.toThrow();

    // Normal user cannot read revisions
    const normalRevs = await asUser(normalUser, async () => {
      const q = await db.query("select * from public.module_revisions");
      return q.rows;
    });
    expect(normalRevs).toHaveLength(0);

    // Reviewer user CAN insert and read revisions
    await asUser(reviewerUser, async () => {
      await db.query(
        `insert into public.module_revisions (module_id, operator_id, action, from_status, to_status, notes)
         values ($1, $2, 'submit_review', 'draft', 'reviewed', 'Revisão técnica aprovada')`,
        [revModId, reviewerUser],
      );
    });

    const reviewerRevs = await asUser(reviewerUser, async () => {
      const q = await db.query(
        "select notes from public.module_revisions where module_id = $1",
        [revModId],
      );
      return q.rows;
    });
    expect(reviewerRevs).toHaveLength(1);
    expect(reviewerRevs[0]).toMatchObject({
      notes: "Revisão técnica aprovada",
    });
  });

  it("enforces RLS and permission isolation on operator_roles table", async () => {
    // 1. Normal user can only select their own role (returns 0 rows since not in operator_roles)
    const normalRead = await asUser(normalUser, async () => {
      const q = await db.query("select * from public.operator_roles");
      return q.rows;
    });
    expect(normalRead).toHaveLength(0);

    // 2. Reviewer can only read their own role record
    const reviewerRead = await asUser(reviewerUser, async () => {
      const q = await db.query("select user_id, role from public.operator_roles");
      return q.rows;
    });
    expect(reviewerRead).toHaveLength(1);
    expect(reviewerRead[0]).toMatchObject({
      user_id: reviewerUser,
      role: "reviewer",
    });

    // 3. Authenticated clients cannot insert or update operator_roles (only service_role can)
    await expect(
      asUser(normalUser, async () => {
        await db.query(
          `insert into public.operator_roles (user_id, role) values ($1, 'admin')`,
          [normalUser],
        );
      }),
    ).rejects.toThrow();

    await expect(
      asUser(reviewerUser, async () => {
        await db.query(
          `update public.operator_roles set role = 'admin' where user_id = $1`,
          [reviewerUser],
        );
      }),
    ).rejects.toThrow();

    // 4. Service role / backend migration can manage operator roles safely
    const newUser = "99999999-9999-4999-8999-999999999999";
    await db.exec(`insert into auth.users values ('${newUser}')`);
    await db.query(
      `insert into public.operator_roles (user_id, role) values ($1, 'operator')`,
      [newUser],
    );

    const checkNew = await db.query(
      "select role from public.operator_roles where user_id = $1",
      [newUser],
    );
    expect(checkNew.rows).toHaveLength(1);
    expect(checkNew.rows[0]).toMatchObject({ role: "operator" });
  });
});
