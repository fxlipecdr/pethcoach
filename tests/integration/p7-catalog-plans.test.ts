import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const dogA = "aaaaaaaa-1111-4111-8111-111111111111";
const dogB = "bbbbbbbb-2222-4222-8222-222222222222";
const anonymousId = "33333333-3333-4333-8333-333333333333";

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

function identifiers(index: number) {
  return {
    id: `71000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
    tokenHash: index.toString(16).padStart(64, "0"),
    rateKey: (index + 300).toString(16).padStart(64, "0"),
  };
}

async function createAndClaimAssessment(index: number, problemSlug: string) {
  const { id, tokenHash, rateKey } = identifiers(index);
  await asUser(null, () =>
    db.query(
      `select * from create_anonymous_assessment(
        $1, $2, $3, $4, now() + interval '7 days', $5
      )`,
      [id, anonymousId, problemSlug, tokenHash, rateKey],
    ),
  );

  const questions = await db.query<{ key: string; option_key: string }>(
    `select q.key, q.options_json->0->>'key' as option_key
     from quiz_questions q join problems p on p.id = q.problem_id
     where p.slug = $1 and q.version = p.quiz_version
     order by q.order_index`,
    [problemSlug],
  );

  for (const question of questions.rows) {
    await asUser(null, () =>
      db.query(
        "select * from update_anonymous_assessment_answer($1, $2, $3, $4)",
        [id, tokenHash, question.key, question.option_key],
      ),
    );
  }

  await asUser(null, () =>
    db.query("select * from complete_anonymous_assessment($1, $2)", [
      id,
      tokenHash,
    ]),
  );

  await asUser(userA, () =>
    db.query("select * from claim_assessment($1, $2, $3)", [
      id,
      tokenHash,
      dogA,
    ]),
  );

  return { id };
}

describe("P7 catalog and plans integration tests", () => {
  let assessmentIdA: string;
  let problemId: string;
  let publishedModuleIds: string[];

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
    ]) {
      await db.exec(
        await readFile(
          new URL(`../../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    }

    // Insert dogs for userA and userB
    await asUser(userA, () =>
      db.query(
        "insert into public.dogs (id, owner_id, name) values ($1, $2, 'Rex')",
        [dogA, userA],
      ),
    );
    await asUser(userB, () =>
      db.query(
        "insert into public.dogs (id, owner_id, name) values ($1, $2, 'Thor')",
        [dogB, userB],
      ),
    );

    const created = await createAndClaimAssessment(1, "cachorro-puxa-guia");
    assessmentIdA = created.id;

    const probRes = await db.query<{ id: string }>(
      "select id from public.problems where slug = 'cachorro-puxa-guia'",
    );
    const probRow = probRes.rows[0];
    if (!probRow) throw new Error("Problem not found");
    problemId = probRow.id;

    const modulesRes = await db.query<{ id: string }>(
      "select id from public.modules where problem_id = $1 and status = 'published'",
      [problemId],
    );
    publishedModuleIds = modulesRes.rows.map((r) => r.id);
  });

  afterAll(async () => {
    if (db) await db.close();
  });

  it("allows anon and authenticated to read 12 seeded published modules", async () => {
    const anonRes = await asUser(null, () =>
      db.query<{ cnt: string }>("select count(*) as cnt from public.modules"),
    );
    expect(Number(anonRes.rows[0]?.cnt)).toBe(12);

    const authRes = await asUser(userA, () =>
      db.query<{ cnt: string }>("select count(*) as cnt from public.modules"),
    );
    expect(Number(authRes.rows[0]?.cnt)).toBe(12);
  });

  it("hides draft or archived modules from client users via RLS", async () => {
    // Insert a draft module as superuser
    const draftId = "79999999-0000-4000-8000-000000000001";
    await db.query(
      `insert into public.modules (
        id, problem_id, slug, title, category, difficulty,
        estimated_duration_minutes, setup_instructions, steps,
        success_criteria, stop_conditions, status
      ) values (
        $1, $2, 'draft-test-module', 'Módulo Rascunho', 'teste', 'beginner',
        5, 'Instruções', '["passo 1"]'::jsonb, 'critério', 'parada', 'draft'
      )`,
      [draftId, problemId],
    );

    // Anon and authenticated cannot see the draft module
    const anonCheck = await asUser(null, () =>
      db.query<{ cnt: string }>(
        "select count(*) as cnt from public.modules where id = $1",
        [draftId],
      ),
    );
    expect(Number(anonCheck.rows[0]?.cnt)).toBe(0);

    const authCheck = await asUser(userA, () =>
      db.query<{ cnt: string }>(
        "select count(*) as cnt from public.modules where id = $1",
        [draftId],
      ),
    );
    expect(Number(authCheck.rows[0]?.cnt)).toBe(0);
  });

  it("prevents anon and authenticated from mutating the modules catalog", async () => {
    const targetModuleId = publishedModuleIds[0];
    expect(targetModuleId).toBeDefined();

    await expect(
      asUser(userA, () =>
        db.query(
          "delete from public.modules where id = $1",
          [targetModuleId],
        ),
      ),
    ).rejects.toThrow();

    await expect(
      asUser(null, () =>
        db.query(
          "delete from public.modules where id = $1",
          [targetModuleId],
        ),
      ),
    ).rejects.toThrow();
  });

  it("allows user A to create a plan and plan tasks for their dog", async () => {
    const planId = "80000000-0000-4000-8000-000000000001";
    const planInsert = await asUser(userA, () =>
      db.query<{ id: string; status: string }>(
        `insert into public.plans (
          id, user_id, dog_id, assessment_id, problem_id, planner_type, total_days
        ) values ($1, $2, $3, $4, $5, 'deterministic_fallback', 14)
        returning id, status`,
        [planId, userA, dogA, assessmentIdA, problemId],
      ),
    );

    const insertedPlan = planInsert.rows[0];
    expect(insertedPlan?.id).toBe(planId);
    expect(insertedPlan?.status).toBe("active");

    // Insert task 1 for day 1
    const taskInsert = await asUser(userA, () =>
      db.query<{ id: string; status: string }>(
        `insert into public.plan_tasks (
          plan_id, day_number, order_index, module_id
        ) values ($1, 1, 1, $2)
        returning id, status`,
        [planId, publishedModuleIds[0]],
      ),
    );

    expect(taskInsert.rows[0]?.status).toBe("pending");
  });

  it("enforces RLS isolation: user B and anon cannot see or modify user A's plan or tasks", async () => {
    const planId = "80000000-0000-4000-8000-000000000001";

    // User B query
    const userBPlans = await asUser(userB, () =>
      db.query("select * from public.plans where id = $1", [planId]),
    );
    expect(userBPlans.rows).toHaveLength(0);

    const userBTasks = await asUser(userB, () =>
      db.query("select * from public.plan_tasks where plan_id = $1", [planId]),
    );
    expect(userBTasks.rows).toHaveLength(0);

    // User B update attempt
    const updateRes = await asUser(userB, () =>
      db.query(
        "update public.plan_tasks set status = 'completed' where plan_id = $1",
        [planId],
      ),
    );
    expect(updateRes.rowCount).toBe(0);

    // Anon access
    await expect(
      asUser(null, () =>
        db.query("select * from public.plans where id = $1", [planId]),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("allows user A to update their task status to completed", async () => {
    const planId = "80000000-0000-4000-8000-000000000001";

    const updateRes = await asUser(userA, () =>
      db.query<{ status: string }>(
        `update public.plan_tasks
         set status = 'completed', completed_at = now()
         where plan_id = $1 and day_number = 1 and order_index = 1
         returning status`,
        [planId],
      ),
    );

    expect(updateRes.rows[0]?.status).toBe("completed");
  });

  it("enforces unique constraint on (plan_id, day_number, order_index)", async () => {
    const planId = "80000000-0000-4000-8000-000000000001";

    // Inserting a second task with day_number = 1 and order_index = 1 should fail
    await expect(
      asUser(userA, () =>
        db.query(
          `insert into public.plan_tasks (
            plan_id, day_number, order_index, module_id
          ) values ($1, 1, 1, $2)`,
          [planId, publishedModuleIds[1]],
        ),
      ),
    ).rejects.toThrow();
  });

  it("cascades deletion of plan tasks when plan is deleted", async () => {
    const planId = "80000000-0000-4000-8000-000000000001";

    await asUser(userA, () =>
      db.query("delete from public.plans where id = $1", [planId]),
    );

    const remainingTasks = await db.query(
      "select * from public.plan_tasks where plan_id = $1",
      [planId],
    );
    expect(remainingTasks.rows).toHaveLength(0);
  });
});
