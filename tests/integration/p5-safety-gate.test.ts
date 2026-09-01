import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const anonymousId = "33333333-3333-4333-8333-333333333333";
let db: PGlite;

async function asAnon<T>(operation: () => Promise<T>) {
  await db.exec("set role anon");
  try {
    return await operation();
  } finally {
    await db.exec("reset role");
  }
}

function identifiers(index: number) {
  return {
    id: `50000000-0000-4000-8000-${index.toString().padStart(12, "0")}`,
    tokenHash: index.toString(16).padStart(64, "0"),
    rateKey: (index + 100).toString(16).padStart(64, "0"),
  };
}

async function completeAssessment(
  index: number,
  problemSlug: string,
  overrides: Record<string, string> = {},
) {
  const { id, tokenHash, rateKey } = identifiers(index);
  await asAnon(() =>
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
  for (const question of questions.rows)
    await asAnon(() =>
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
  return {
    id,
    tokenHash,
    completed: await asAnon(() =>
      db.query<{
        assessment_status: string;
        safety_status: string;
        safety_codes: string[];
        safety_rule_version: string;
      }>("select * from complete_anonymous_assessment($1, $2)", [
        id,
        tokenHash,
      ]),
    ),
  };
}

describe("P5 deterministic safety gate and audit trail", () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth, public to authenticated, anon;
      grant execute on function auth.uid() to authenticated, anon;`);
    for (const file of [
      "20260831000000_profiles_baseline.sql",
      "20260831010000_p2_auth_dogs_attribution.sql",
      "20260901010000_p4_quiz_assessments.sql",
      "20260901020000_p5_safety_gate.sql",
      "20260901021000_p5_quiz_option_contract_fix.sql",
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

  it("publishes version 2 with ten questions while preserving version 1", async () => {
    const versions = await db.query<{
      slug: string;
      current_version: number;
      v1: bigint;
      v2: bigint;
    }>(`select p.slug, p.quiz_version as current_version,
        count(q.id) filter (where q.version = 1) as v1,
        count(q.id) filter (where q.version = 2) as v2
      from problems p join quiz_questions q on q.problem_id = p.id
      group by p.slug, p.quiz_version order by p.slug`);
    expect(
      versions.rows.map((row) => ({
        ...row,
        v1: Number(row.v1),
        v2: Number(row.v2),
      })),
    ).toEqual([
      { slug: "cachorro-puxa-guia", current_version: 2, v1: 8, v2: 10 },
      { slug: "filhote-mordendo", current_version: 2, v1: 8, v2: 10 },
      { slug: "xixi-lugar-errado", current_version: 2, v1: 8, v2: 10 },
    ]);
    await expect(
      asAnon(() => db.query("select * from safety_events")),
    ).rejects.toThrow(/permission denied/i);

    const invalidOptionKeys = await db.query<{ count: bigint }>(
      `select count(*)
       from quiz_questions q
       cross join lateral jsonb_array_elements(q.options_json) as option_item
       where q.status = 'published'
         and option_item->>'key' !~ '^[a-z][a-z0-9_]*$'`,
    );
    expect(Number(invalidOptionKeys.rows[0]?.count)).toBe(0);
  });

  it("records a clear CONTINUE without claiming certainty", async () => {
    const result = await completeAssessment(1, "cachorro-puxa-guia");
    expect(result.completed.rows[0]).toMatchObject({
      assessment_status: "completed",
      safety_status: "continue",
      safety_codes: ["SAFETY_GATE_CLEAR"],
      safety_rule_version: "p5-v1",
    });
  });

  it("refers suspected pain and sudden change with physical signs", async () => {
    const result = await completeAssessment(2, "xixi-lugar-errado", {
      toilet_history: "sudden",
      urinary_signs: "effort_pain",
    });
    expect(result.completed.rows[0]?.safety_status).toBe("refer");
    expect(result.completed.rows[0]?.safety_codes).toEqual(
      expect.arrayContaining([
        "SUSPECTED_PAIN",
        "SUDDEN_CHANGE_WITH_PHYSICAL_SIGNS",
      ]),
    );
  });

  it("gives BLOCK precedence and keeps completion idempotent", async () => {
    const result = await completeAssessment(3, "filhote-mordendo", {
      bite_intensity: "injury",
      biting_change: "pain",
    });
    expect(result.completed.rows[0]?.safety_status).toBe("block");
    expect(result.completed.rows[0]?.safety_codes).toEqual(
      expect.arrayContaining(["HIGH_RISK_BITE", "SUSPECTED_PAIN"]),
    );
    const repeated = await asAnon(() =>
      db.query("select * from complete_anonymous_assessment($1, $2)", [
        result.id,
        result.tokenHash,
      ]),
    );
    expect(repeated.rows[0]).toMatchObject({ safety_status: "block" });
    const events = await db.query<{ count: bigint }>(
      "select count(*) from safety_events where assessment_id = $1",
      [result.id],
    );
    expect(Number(events.rows[0]?.count)).toBe(2);
  });

  it.each([
    [4, "vulnerable_contact", "VULNERABLE_PERSON_RISK"],
    [5, "escape_self_harm", "SELF_INJURY_OR_ESCAPE_RISK"],
    [6, "unpredictable_injury", "HIGH_RISK_BITE"],
  ])("blocks common safety answer %s", async (index, answer, code) => {
    const result = await completeAssessment(index, "cachorro-puxa-guia", {
      additional_safety: answer,
    });
    expect(result.completed.rows[0]?.safety_status).toBe("block");
    expect(result.completed.rows[0]?.safety_codes).toContain(code);
  });

  it("audits aversive methods and redirects to reward-based handling", async () => {
    const result = await completeAssessment(7, "xixi-lugar-errado", {
      methods_used: "aversive",
    });
    expect(result.completed.rows[0]).toMatchObject({
      safety_status: "continue",
      safety_codes: ["AVERSIVE_METHOD_REPORTED"],
    });
  });

  it("fails closed when published content introduces an unknown signal", async () => {
    await db.query(`update quiz_questions q
      set rules_json = '{"optionTags":{"reward":["future_unreviewed_signal"]}}'
      from problems p
      where p.id = q.problem_id and p.slug = 'xixi-lugar-errado'
        and q.version = 2 and q.key = 'methods_used'`);
    const result = await completeAssessment(8, "xixi-lugar-errado");
    expect(result.completed.rows[0]).toMatchObject({
      safety_status: "refer",
      safety_codes: ["UNRECOGNIZED_SAFETY_SIGNAL"],
    });
  });
});
