import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const userId = "11111111-1111-4111-8111-111111111111";
const anonymousId = "33333333-3333-4333-8333-333333333333";
const assessmentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const otherAssessmentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const tokenHash = "a".repeat(64);
const otherTokenHash = "b".repeat(64);
const createRateKey = "c".repeat(64);
let db: PGlite;

async function asRole<T>(role: "anon" | "authenticated", operation: () => Promise<T>) {
  await db.exec(`set role ${role}`);
  if (role === "authenticated")
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
      userId,
    ]);
  try {
    return await operation();
  } finally {
    await db.exec("reset role");
  }
}

async function createAssessment(
  id = assessmentId,
  hash = tokenHash,
  rateKey = createRateKey,
) {
  return asRole("anon", () =>
    db.query(
      `select * from create_anonymous_assessment(
        $1, $2, 'cachorro-puxa-guia', $3, now() + interval '7 days', $4
      )`,
      [id, anonymousId, hash, rateKey],
    ),
  );
}

describe("P4 anonymous assessments and published quiz RLS", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;
      insert into auth.users values ('${userId}');`);
    for (const file of [
      "20260831000000_profiles_baseline.sql",
      "20260831010000_p2_auth_dogs_attribution.sql",
      "20260901010000_p4_quiz_assessments.sql",
    ])
      await db.exec(
        await readFile(
          new URL(`../../supabase/migrations/${file}`, import.meta.url),
          "utf8",
        ),
      );
  });

  afterAll(async () => {
    await db?.close();
  });

  it("publishes exactly three versioned quizzes with eight ordered questions", async () => {
    const result = await asRole("anon", () =>
      db.query<{ slug: string; count: bigint }>(
        `select p.slug, count(q.id)
         from problems p join quiz_questions q
           on q.problem_id = p.id and q.version = p.quiz_version
         group by p.slug order by p.slug`,
      ),
    );
    expect(result.rows.map((row) => ({ ...row, count: Number(row.count) }))).toEqual([
      { slug: "cachorro-puxa-guia", count: 8 },
      { slug: "filhote-mordendo", count: 8 },
      { slug: "xixi-lugar-errado", count: 8 },
    ]);
    await expect(
      asRole("anon", () => db.query("select rules_json from quiz_questions")),
    ).rejects.toThrow(/permission denied/i);
  });

  it("creates through the guarded RPC and denies every direct assessment read", async () => {
    const created = await createAssessment();
    expect(created.rows[0]).toMatchObject({
      assessment_id: assessmentId,
      problem_slug: "cachorro-puxa-guia",
      quiz_version: 1,
    });
    await expect(
      asRole("anon", () => db.query("select * from assessments")),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      asRole("authenticated", () => db.query("select * from assessments")),
    ).rejects.toThrow(/permission denied/i);
    expect(
      (
        await asRole("anon", () =>
          db.query("select * from read_anonymous_assessment($1, $2)", [
            assessmentId,
            otherTokenHash,
          ]),
        )
      ).rows,
    ).toEqual([]);
  });

  it("validates question/option pairs, persists navigation-safe answers and completes once", async () => {
    await expect(
      asRole("anon", () =>
        db.query(
          "select * from update_anonymous_assessment_answer($1, $2, 'forged', 'forged')",
          [assessmentId, tokenHash],
        ),
      ),
    ).rejects.toThrow(/assessment_answer_invalid/i);

    const questions = await db.query<{ key: string; option_key: string }>(
      `select q.key, q.options_json->0->>'key' as option_key
       from quiz_questions q join problems p on p.id = q.problem_id
       where p.slug = 'cachorro-puxa-guia' and q.version = p.quiz_version
       order by q.order_index`,
    );
    for (const question of questions.rows)
      await asRole("anon", () =>
        db.query(
          "select * from update_anonymous_assessment_answer($1, $2, $3, $4)",
          [assessmentId, tokenHash, question.key, question.option_key],
        ),
      );

    const snapshot = await asRole("anon", () =>
      db.query<{ answers_json: Record<string, string> }>(
        "select answers_json from read_anonymous_assessment($1, $2)",
        [assessmentId, tokenHash],
      ),
    );
    expect(Object.keys(snapshot.rows[0]!.answers_json)).toHaveLength(8);
    const completed = await asRole("anon", () =>
      db.query("select * from complete_anonymous_assessment($1, $2)", [
        assessmentId,
        tokenHash,
      ]),
    );
    expect(completed.rows[0]).toMatchObject({ assessment_status: "completed" });
    expect(
      (
        await asRole("anon", () =>
          db.query("select * from complete_anonymous_assessment($1, $2)", [
            assessmentId,
            tokenHash,
          ]),
        )
      ).rows[0],
    ).toMatchObject({ assessment_status: "completed" });
  });

  it("fails closed for cross-token mutation, incomplete completion and expired creation", async () => {
    await createAssessment(otherAssessmentId, otherTokenHash, "d".repeat(64));
    await expect(
      asRole("anon", () =>
        db.query(
          "select * from update_anonymous_assessment_answer($1, $2, 'pulling_moment', 'door')",
          [otherAssessmentId, tokenHash],
        ),
      ),
    ).rejects.toThrow(/assessment_not_available/i);
    await expect(
      asRole("anon", () =>
        db.query("select * from complete_anonymous_assessment($1, $2)", [
          otherAssessmentId,
          otherTokenHash,
        ]),
      ),
    ).rejects.toThrow(/assessment_incomplete/i);
    await expect(
      asRole("anon", () =>
        db.query(
          `select * from create_anonymous_assessment(
            gen_random_uuid(), $1, 'cachorro-puxa-guia', $2,
            now() - interval '1 minute', $3
          )`,
          [anonymousId, "e".repeat(64), "f".repeat(64)],
        ),
      ),
    ).rejects.toThrow(/assessment_request_rejected/i);
  });

  it("enforces the distributed creation limit atomically", async () => {
    const rateKey = "9".repeat(64);
    for (let index = 0; index < 10; index += 1)
      await createAssessment(
        `90000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
        index.toString(16).padStart(64, "0"),
        rateKey,
      );
    await expect(
      createAssessment(
        "90000000-0000-4000-8000-999999999999",
        "8".repeat(64),
        rateKey,
      ),
    ).rejects.toThrow(/assessment_request_rejected/i);
  });
});
