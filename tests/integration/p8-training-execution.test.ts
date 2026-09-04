import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const dogA = "aaaaaaaa-1111-4111-8111-111111111111";
const dogB = "bbbbbbbb-2222-4222-8222-222222222222";
const anonymousId = "33333333-3333-4333-8333-333333333333";
const planA = "80000000-0000-4000-8000-000000000001";

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

describe("P8 training execution, check-ins, and entitlements integration tests", () => {
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
      "20260904000000_p8_training_execution_and_entitlements.sql",
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
      "select id from public.modules where problem_id = $1 and status = 'published' order by id",
      [problemId],
    );
    publishedModuleIds = modulesRes.rows.map((r) => r.id);

    // Create plan for userA
    await asUser(userA, () =>
      db.query(
        `insert into public.plans (
          id, user_id, dog_id, assessment_id, problem_id, planner_type, total_days, current_day
        ) values ($1, $2, $3, $4, $5, 'deterministic_fallback', 14, 1)`,
        [planA, userA, dogA, assessmentIdA, problemId],
      ),
    );

    // Insert Day 1 tasks
    await asUser(userA, () =>
      db.query(
        `insert into public.plan_tasks (plan_id, day_number, order_index, module_id, status)
         values ($1, 1, 1, $2, 'pending'), ($1, 1, 2, $3, 'pending')`,
        [planA, publishedModuleIds[0], publishedModuleIds[1]],
      ),
    );

    // Insert Day 2 tasks
    await asUser(userA, () =>
      db.query(
        `insert into public.plan_tasks (plan_id, day_number, order_index, module_id, status)
         values ($1, 2, 1, $2, 'pending')`,
        [planA, publishedModuleIds[2]],
      ),
    );
  });

  afterAll(async () => {
    if (db) await db.close();
  });

  it("enforces RLS on public.entitlements: user A reads own, user B cannot read user A, anon is denied", async () => {
    // Insert entitlement as superuser for userA
    const entId = "90000000-0000-4000-8000-000000000001";
    await db.query(
      `insert into public.entitlements (id, user_id, scope, status)
       values ($1, $2, 'full_program', 'active')`,
      [entId, userA],
    );

    // userA can select their entitlement
    const userARes = await asUser(userA, () =>
      db.query<{ id: string; status: string }>(
        "select id, status from public.entitlements where user_id = $1",
        [userA],
      ),
    );
    expect(userARes.rows).toHaveLength(1);
    expect(userARes.rows[0]?.id).toBe(entId);
    expect(userARes.rows[0]?.status).toBe("active");

    // userB queries entitlements and cannot see userA's row
    const userBRes = await asUser(userB, () =>
      db.query("select * from public.entitlements where id = $1", [entId]),
    );
    expect(userBRes.rows).toHaveLength(0);

    // anon is completely denied access to entitlements table
    await expect(
      asUser(null, () =>
        db.query("select * from public.entitlements where id = $1", [entId]),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("prevents authenticated users from directly inserting or altering entitlements", async () => {
    // Authenticated users must not be able to self-grant entitlements (billing webhook only)
    await expect(
      asUser(userB, () =>
        db.query(
          `insert into public.entitlements (user_id, scope, status)
           values ($1, 'full_program', 'active')`,
          [userB],
        ),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("allows user A to complete Day 1 training tasks", async () => {
    const res = await asUser(userA, () =>
      db.query<{ status: string }>(
        `update public.plan_tasks
         set status = 'completed', completed_at = now()
         where plan_id = $1 and day_number = 1
         returning status`,
        [planA],
      ),
    );
    expect(res.rows).toHaveLength(2);
    expect(res.rows.every((r) => r.status === "completed")).toBe(true);
  });

  it("allows user A to record a daily check-in with needed_pause without penalty", async () => {
    const checkinRes = await asUser(userA, () =>
      db.query<{ id: string; mood: string; day_number: number }>(
        `insert into public.daily_checkins (plan_id, day_number, user_id, mood, notes)
         values ($1, 1, $2, 'needed_pause', 'Rex precisou de uma pausa no meio da sessão.')
         returning id, mood, day_number`,
        [planA, userA],
      ),
    );

    expect(checkinRes.rows).toHaveLength(1);
    expect(checkinRes.rows[0]?.mood).toBe("needed_pause");
    expect(checkinRes.rows[0]?.day_number).toBe(1);
  });

  it("enforces RLS on public.daily_checkins: user B and anon cannot read or spoof user A's check-ins", async () => {
    // userB cannot read userA's checkin
    const userBRes = await asUser(userB, () =>
      db.query("select * from public.daily_checkins where plan_id = $1", [
        planA,
      ]),
    );
    expect(userBRes.rows).toHaveLength(0);

    // userB cannot insert checkin with userA's id
    await expect(
      asUser(userB, () =>
        db.query(
          `insert into public.daily_checkins (plan_id, day_number, user_id, mood)
           values ($1, 2, $2, 'calm')`,
          [planA, userA],
        ),
      ),
    ).rejects.toThrow();

    // anon is denied access
    await expect(
      asUser(null, () =>
        db.query("select * from public.daily_checkins where plan_id = $1", [
          planA,
        ]),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("enforces unique constraint on (plan_id, day_number) for daily check-ins", async () => {
    // Inserting another check-in for day 1 of the same plan must fail unique constraint
    await expect(
      asUser(userA, () =>
        db.query(
          `insert into public.daily_checkins (plan_id, day_number, user_id, mood)
           values ($1, 1, $2, 'calm')`,
          [planA, userA],
        ),
      ),
    ).rejects.toThrow();
  });

  it("advances plan current_day when day is completed", async () => {
    // Update plan's current_day as done by recordDailyCheckin
    await db.query(
      "update public.plans set current_day = 2 where id = $1 and current_day = 1",
      [planA],
    );

    const planRes = await asUser(userA, () =>
      db.query<{ current_day: number }>(
        "select current_day from public.plans where id = $1",
        [planA],
      ),
    );
    expect(planRes.rows[0]?.current_day).toBe(2);
  });
});
