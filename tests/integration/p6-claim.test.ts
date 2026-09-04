import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const userA = "11111111-1111-4111-8111-111111111111";
const userB = "22222222-2222-4222-8222-222222222222";
const anonymousId = "33333333-3333-4333-8333-333333333333";
const dogA = "aaaaaaaa-1111-4111-8111-111111111111";
const dogB = "bbbbbbbb-2222-4222-8222-222222222222";

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
    id: `60000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
    tokenHash: index.toString(16).padStart(64, "0"),
    rateKey: (index + 200).toString(16).padStart(64, "0"),
  };
}

async function createAndCompleteAssessment(
  index: number,
  problemSlug: string,
  overrides: Record<string, string> = {},
) {
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
        [
          id,
          tokenHash,
          question.key,
          overrides[question.key] ?? question.option_key,
        ],
      ),
    );
  }

  await asUser(null, () =>
    db.query("select * from complete_anonymous_assessment($1, $2)", [
      id,
      tokenHash,
    ]),
  );

  return { id, tokenHash };
}

describe("P6 assessment claim and authenticated ownership RLS", () => {
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
    ]) {
      await db.exec(
        await readFile(
          new URL(`../../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
    }

    // Create a dog for userA and a dog for userB
    await asUser(userA, () =>
      db.query("insert into dogs (id, owner_id, name) values ($1, $2, $3)", [
        dogA,
        userA,
        "Rex",
      ]),
    );
    await asUser(userB, () =>
      db.query("insert into dogs (id, owner_id, name) values ($1, $2, $3)", [
        dogB,
        userB,
        "Thor",
      ]),
    );
  });

  afterAll(async () => {
    await db?.close();
  });

  it("claims a CONTINUE assessment for an authenticated user with a dog", async () => {
    const { id, tokenHash } = await createAndCompleteAssessment(
      1,
      "cachorro-puxa-guia",
    );

    const claimResult = await asUser(userA, () =>
      db.query<{
        assessment_id: string;
        user_id: string;
        dog_id: string;
        problem_slug: string;
        safety_status: string;
      }>("select * from claim_assessment($1, $2, $3)", [id, tokenHash, dogA]),
    );

    expect(claimResult.rows[0]).toMatchObject({
      assessment_id: id,
      user_id: userA,
      dog_id: dogA,
      problem_slug: "cachorro-puxa-guia",
      safety_status: "continue",
    });
  });

  it("denies claim attempt by anonymous callers", async () => {
    const { id, tokenHash } = await createAndCompleteAssessment(
      2,
      "cachorro-puxa-guia",
    );

    await expect(
      asUser(null, () =>
        db.query("select * from claim_assessment($1, $2, $3)", [
          id,
          tokenHash,
          null,
        ]),
      ),
    ).rejects.toThrow(/claim_unauthorized|permission denied/i);
  });

  it("denies claim with invalid token hash", async () => {
    const { id } = await createAndCompleteAssessment(
      3,
      "cachorro-puxa-guia",
    );

    await expect(
      asUser(userA, () =>
        db.query("select * from claim_assessment($1, $2, $3)", [
          id,
          "f".repeat(64),
          null,
        ]),
      ),
    ).rejects.toThrow(/assessment_not_available/i);
  });

  it("prevents hijacking an assessment already claimed by another user", async () => {
    const { id, tokenHash } = await createAndCompleteAssessment(
      4,
      "cachorro-puxa-guia",
    );

    // User A claims it first
    await asUser(userA, () =>
      db.query("select * from claim_assessment($1, $2, $3)", [
        id,
        tokenHash,
        null,
      ]),
    );

    // User B attempts to claim the same assessment
    await expect(
      asUser(userB, () =>
        db.query("select * from claim_assessment($1, $2, $3)", [
          id,
          tokenHash,
          null,
        ]),
      ),
    ).rejects.toThrow(/assessment_already_claimed/i);
  });

  it("strictly refuses claiming an assessment with BLOCK outcome", async () => {
    const { id, tokenHash } = await createAndCompleteAssessment(
      5,
      "filhote-mordendo",
      {
        bite_intensity: "injury",
        biting_change: "pain",
      },
    );

    await expect(
      asUser(userA, () =>
        db.query("select * from claim_assessment($1, $2, $3)", [
          id,
          tokenHash,
          null,
        ]),
      ),
    ).rejects.toThrow(/assessment_not_claimable/i);
  });

  it("strictly refuses attaching a dog belonging to another user", async () => {
    const { id, tokenHash } = await createAndCompleteAssessment(
      6,
      "cachorro-puxa-guia",
    );

    await expect(
      asUser(userA, () =>
        db.query("select * from claim_assessment($1, $2, $3)", [
          id,
          tokenHash,
          dogB, // belongs to userB!
        ]),
      ),
    ).rejects.toThrow(/dog_not_found/i);
  });

  it("enforces RLS: users can only read their own claimed assessments", async () => {
    // User A should only see assessments claimed by User A
    const userAAssessments = await asUser(userA, () =>
      db.query<{ id: string }>("select id from assessments"),
    );

    // User A claimed assessment 1 and assessment 4
    const ids = userAAssessments.rows.map((r) => r.id);
    expect(ids).toContain(identifiers(1).id);
    expect(ids).toContain(identifiers(4).id);

    // Unclaimed assessments or assessments with block outcome should not appear for User A
    expect(ids).not.toContain(identifiers(5).id);

    // User B should not see User A's assessments
    const userBAssessments = await asUser(userB, () =>
      db.query<{ id: string }>("select id from assessments"),
    );
    expect(userBAssessments.rows.map((r) => r.id)).not.toContain(
      identifiers(1).id,
    );

    // Anonymous direct SELECT on assessments is completely denied
    await expect(
      asUser(null, () => db.query("select * from assessments")),
    ).rejects.toThrow(/permission denied/i);
  });

  it("enforces RLS update: users can only update dog_id to their own dogs", async () => {
    const assessmentAId = identifiers(4).id;

    // User A updates dog_id to dogA (owned by user A) -> succeeds
    await asUser(userA, () =>
      db.query("update assessments set dog_id = $1 where id = $2", [
        dogA,
        assessmentAId,
      ]),
    );

    // User A attempts to update dog_id to dogB (owned by user B) -> fails RLS check
    await expect(
      asUser(userA, () =>
        db.query("update assessments set dog_id = $1 where id = $2", [
          dogB,
          assessmentAId,
        ]),
      ),
    ).rejects.toThrow();
  });
});
