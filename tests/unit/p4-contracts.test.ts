import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import {
  answerAssessmentSchema,
  assessmentAnswersSchema,
  createAssessmentSchema,
  quizDefinitionSchema,
} from "@/features/assessments/contracts";
import { isSameOriginMutation, networkHint } from "@/features/assessments/http";
import {
  assessmentRateKey,
  assessmentTokenHash,
  createAssessmentToken,
  verifyAssessmentToken,
} from "@/features/assessments/token";
import {
  localContextKey,
  readAnonymousContext,
} from "@/features/onboarding/local-context";

const secret = "assessment-secret-with-more-than-thirty-two-characters";
const id = "11111111-1111-4111-8111-111111111111";

describe("P4 assessment contracts", () => {
  it("signs, hashes, validates and expires an assessment token", () => {
    const token = createAssessmentToken(id, secret, 1_000);
    expect(assessmentTokenHash(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(verifyAssessmentToken(token, id, secret, 2_000)?.id).toBe(id);
    expect(
      verifyAssessmentToken(`${token.slice(0, -1)}x`, id, secret, 2_000),
    ).toBeNull();
    expect(
      verifyAssessmentToken(
        token,
        "22222222-2222-4222-8222-222222222222",
        secret,
        2_000,
      ),
    ).toBeNull();
    expect(verifyAssessmentToken(token, id, secret, 8 * 86_400_000)).toBeNull();
  });

  it("creates stable private rate keys without exposing their inputs", () => {
    const key = assessmentRateKey(secret, id, "203.0.113.10");
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain(id);
    expect(key).toBe(assessmentRateKey(secret, id, "203.0.113.10"));
    expect(key).not.toBe(assessmentRateKey(secret, id, "203.0.113.11"));
  });

  it("validates slugs, answers and the six-to-ten-question definition", () => {
    expect(
      createAssessmentSchema.safeParse({
        problemSlug: "cachorro-puxa-guia",
        anonymousId: id,
      }).success,
    ).toBe(true);
    expect(
      createAssessmentSchema.safeParse({
        problemSlug: "forged",
        anonymousId: id,
      }).success,
    ).toBe(false);
    expect(
      answerAssessmentSchema.safeParse({ questionKey: "question", optionKey: "a" })
        .success,
    ).toBe(true);
    expect(assessmentAnswersSchema.safeParse({ "../owner": "forged" }).success).toBe(
      false,
    );
    const question = {
      key: "context",
      prompt: "O que acontece?",
      helpText: null,
      order: 1,
      options: [
        { key: "a", label: "Opção A" },
        { key: "b", label: "Opção B" },
      ],
    };
    expect(
      quizDefinitionSchema.safeParse({
        problemSlug: "cachorro-puxa-guia",
        problemTitle: "Passeio",
        version: 1,
        questions: Array.from({ length: 6 }, (_, index) => ({
          ...question,
          key: `context_${index}`,
          order: index + 1,
        })),
      }).success,
    ).toBe(true);
    expect(
      quizDefinitionSchema.safeParse({
        problemSlug: "cachorro-puxa-guia",
        problemTitle: "Passeio",
        version: 1,
        questions: [question],
      }).success,
    ).toBe(false);
  });

  it("keeps only the assessment id in local storage and rejects tokens or answers", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    values.set(
      localContextKey,
      JSON.stringify({
        version: 1,
        anonymousId: id,
        updatedAt: 1000,
        problem: "cachorro-puxa-guia",
        assessment: {
          id,
          problem: "cachorro-puxa-guia",
          currentQuestion: 2,
        },
      }),
    );
    expect(readAnonymousContext(storage, 1001)?.assessment?.id).toBe(id);
    values.set(
      localContextKey,
      JSON.stringify({
        version: 1,
        anonymousId: id,
        updatedAt: 1000,
        token: "secret",
      }),
    );
    expect(readAnonymousContext(storage, 1001)).toBeNull();
  });

  it("requires same-origin JSON mutations and bounds the network hint", () => {
    const valid = new NextRequest("https://coach.peth.com.br/api/assessments", {
      method: "POST",
      headers: {
        origin: "https://coach.peth.com.br",
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
      },
    });
    expect(isSameOriginMutation(valid)).toBe(true);
    expect(networkHint(valid)).toBe("203.0.113.10");
    expect(
      isSameOriginMutation(
        new NextRequest("http://localhost:3000/api/assessments", {
          method: "POST",
          headers: {
            host: "127.0.0.1:3000",
            origin: "http://127.0.0.1:3000",
          },
        }),
      ),
    ).toBe(true);
    expect(
      isSameOriginMutation(
        new NextRequest("https://coach.peth.com.br/api/assessments", {
          method: "POST",
          headers: { origin: "https://evil.test" },
        }),
      ),
    ).toBe(false);
  });
});
