import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const dogA = "aaaaaaaa-1111-4111-8111-111111111111";
const dogB = "bbbbbbbb-2222-4222-8222-222222222222";
const anonymousId = "33333333-3333-4333-8333-333333333333";
const planA = "80000000-0000-4000-8000-000000000001";
const planB = "80000000-0000-4000-8000-000000000002";

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
    id: `72000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
    tokenHash: index.toString(16).padStart(64, "0"),
    rateKey: (index + 400).toString(16).padStart(64, "0"),
  };
}

async function createAndClaimAssessment(
  index: number,
  userId: string,
  dogId: string,
) {
  const { id, tokenHash, rateKey } = identifiers(index);
  await asUser(null, () =>
    db.query(
      `select * from create_anonymous_assessment(
        $1, $2, 'cachorro-puxa-guia', $3, now() + interval '7 days', $4
      )`,
      [id, anonymousId, tokenHash, rateKey],
    ),
  );

  const questions = await db.query<{ key: string; option_key: string }>(
    `select q.key, q.options_json->0->>'key' as option_key
     from quiz_questions q join problems p on p.id = q.problem_id
     where p.slug = 'cachorro-puxa-guia' and q.version = p.quiz_version
     order by q.order_index`,
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

  await asUser(userId, () =>
    db.query("select * from claim_assessment($1, $2, $3)", [
      id,
      tokenHash,
      dogId,
    ]),
  );

  return { id };
}

describe("P9 Adaptation and Milestones - Migration, Constraints, and RLS Integration", () => {
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
        "insert into public.dogs (id, owner_id, name) values ($1, $2, 'Pipoca')",
        [dogA, userA],
      ),
    );
    await asUser(userB, () =>
      db.query(
        "insert into public.dogs (id, owner_id, name) values ($1, $2, 'Bidu')",
        [dogB, userB],
      ),
    );

    const createdA = await createAndClaimAssessment(1, userA, dogA);
    const createdB = await createAndClaimAssessment(2, userB, dogB);

    const probRes = await db.query<{ id: string }>(
      "select id from public.problems where slug = 'cachorro-puxa-guia'",
    );
    const problemId = probRes.rows[0]?.id;
    if (!problemId) throw new Error("Problem not found");

    // Insert plans for userA and userB
    await asUser(userA, () =>
      db.query(
        `insert into public.plans (
          id, user_id, dog_id, assessment_id, problem_id, planner_type, total_days, current_day
        ) values ($1, $2, $3, $4, $5, 'deterministic_fallback', 14, 1)`,
        [planA, userA, dogA, createdA.id, problemId],
      ),
    );

    await asUser(userB, () =>
      db.query(
        `insert into public.plans (
          id, user_id, dog_id, assessment_id, problem_id, planner_type, total_days, current_day
        ) values ($1, $2, $3, $4, $5, 'deterministic_fallback', 14, 1)`,
        [planB, userB, dogB, createdB.id, problemId],
      ),
    );
  });

  afterAll(async () => {
    await db.close();
  });

  it("adds difficulty_rating and safety_flag columns to daily_checkins with valid defaults", async () => {
    const insertRes = await asUser(userA, () =>
      db.query<{
        difficulty_rating: string;
        safety_flag: string;
      }>(
        `insert into public.daily_checkins (
          plan_id, day_number, user_id, mood, difficulty_rating, safety_flag
        ) values ($1, 1, $2, 'calm', 'adequate', 'none')
        returning difficulty_rating, safety_flag`,
        [planA, userA],
      ),
    );

    expect(insertRes.rows).toHaveLength(1);
    expect(insertRes.rows[0]?.difficulty_rating).toBe("adequate");
    expect(insertRes.rows[0]?.safety_flag).toBe("none");
  });

  it("enforces check constraints on daily_checkins difficulty_rating and safety_flag", async () => {
    await expect(
      asUser(userA, () =>
        db.query(
          `insert into public.daily_checkins (
            plan_id, day_number, user_id, mood, difficulty_rating, safety_flag
          ) values ($1, 2, $2, 'calm', 'invalid_diff', 'none')`,
          [planA, userA],
        ),
      ),
    ).rejects.toThrow();

    await expect(
      asUser(userA, () =>
        db.query(
          `insert into public.daily_checkins (
            plan_id, day_number, user_id, mood, difficulty_rating, safety_flag
          ) values ($1, 2, $2, 'calm', 'adequate', 'invalid_flag')`,
          [planA, userA],
        ),
      ),
    ).rejects.toThrow();
  });

  it("allows authenticated owner to read their plan milestones and enforces RLS isolation", async () => {
    // Insert milestone for userA
    await db.query(
      `insert into public.plan_milestones (plan_id, user_id, key, title, description)
       values ($1, $2, 'first_training_done', 'Primeiro Passo', 'Primeira sessão concluída.')`,
      [planA, userA],
    );

    // User A can read their own milestones
    const userARead = await asUser(userA, () =>
      db.query<{ key: string }>(
        "select key from public.plan_milestones where plan_id = $1",
        [planA],
      ),
    );
    expect(userARead.rows).toHaveLength(1);
    expect(userARead.rows[0]?.key).toBe("first_training_done");

    // User B cannot see User A's milestones via RLS
    const userBRead = await asUser(userB, () =>
      db.query("select * from public.plan_milestones where plan_id = $1", [
        planA,
      ]),
    );
    expect(userBRead.rows).toHaveLength(0);

    // Anonymous is denied access
    await expect(
      asUser(null, () =>
        db.query("select * from public.plan_milestones where plan_id = $1", [
          planA,
        ]),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("enforces unique constraint on (plan_id, key) for plan_milestones", async () => {
    // Attempting to insert duplicate first_training_done for planA should be rejected
    await expect(
      db.query(
        `insert into public.plan_milestones (plan_id, user_id, key, title, description)
         values ($1, $2, 'first_training_done', 'Primeiro Passo Duplicado', 'Tentativa duplicada')`,
        [planA, userA],
      ),
    ).rejects.toThrow();
  });

  it("allows authenticated owner to read their plan adaptations and enforces RLS isolation", async () => {
    // Insert adaptation for userA
    await db.query(
      `insert into public.plan_adaptations (plan_id, user_id, adaptation_type, reason)
       values ($1, $2, 'consolidation', 'Ritmo consolidado para conforto.')`,
      [planA, userA],
    );

    // User A can read their own adaptations
    const userARead = await asUser(userA, () =>
      db.query<{ adaptation_type: string }>(
        "select adaptation_type from public.plan_adaptations where plan_id = $1",
        [planA],
      ),
    );
    expect(userARead.rows).toHaveLength(1);
    expect(userARead.rows[0]?.adaptation_type).toBe("consolidation");

    // User B cannot read User A's adaptations
    const userBRead = await asUser(userB, () =>
      db.query("select * from public.plan_adaptations where plan_id = $1", [
        planA,
      ]),
    );
    expect(userBRead.rows).toHaveLength(0);

    // Anonymous is denied access
    await expect(
      asUser(null, () =>
        db.query("select * from public.plan_adaptations where plan_id = $1", [
          planA,
        ]),
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("supports safety pause by recording safety_pause adaptation and updating plan status to paused", async () => {
    // Record safety pause adaptation
    await db.query(
      `insert into public.plan_adaptations (plan_id, user_id, adaptation_type, reason)
       values ($1, $2, 'safety_pause', 'Pausa por dor suspeita')`,
      [planA, userA],
    );

    // Update plan status to paused
    await db.query(
      "update public.plans set status = 'paused', updated_at = now() where id = $1",
      [planA],
    );

    const planRes = await asUser(userA, () =>
      db.query<{ status: string }>(
        "select status from public.plans where id = $1",
        [planA],
      ),
    );
    expect(planRes.rows[0]?.status).toBe("paused");
  });
});
