import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAssessmentToken } from "@/features/assessments/token";

const mocks = vi.hoisted(() => ({
  runtime: vi.fn(),
  loadQuiz: vi.fn(),
  create: vi.fn(),
  read: vi.fn(),
  update: vi.fn(),
  complete: vi.fn(),
}));

vi.mock("@/features/assessments/data", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/features/assessments/data")
  >();
  return {
    ...actual,
    assessmentRuntime: mocks.runtime,
    loadPublishedQuiz: mocks.loadQuiz,
    createAssessmentRecord: mocks.create,
    readAssessmentRecord: mocks.read,
    updateAssessmentAnswer: mocks.update,
    completeAssessmentRecord: mocks.complete,
  };
});

import { POST as createAssessment } from "@/app/api/assessments/route";
import {
  GET as readAssessment,
  PATCH as updateAssessment,
} from "@/app/api/assessments/[assessmentId]/route";
import { POST as completeAssessment } from "@/app/api/assessments/[assessmentId]/complete/route";
import { AssessmentDataError } from "@/features/assessments/data";

const id = "11111111-1111-4111-8111-111111111111";
const anonymousId = "22222222-2222-4222-8222-222222222222";
const secret = "assessment-secret-with-more-than-thirty-two-characters";
const quiz = {
  problemSlug: "cachorro-puxa-guia" as const,
  problemTitle: "Meu cachorro puxa a guia",
  version: 1,
  questions: Array.from({ length: 6 }, (_, index) => ({
    key: `question_${index}`,
    prompt: `Pergunta ${index + 1}`,
    helpText: null,
    order: index + 1,
    options: [
      { key: "a", label: "Opção A" },
      { key: "b", label: "Opção B" },
    ],
  })),
};
const assessment = {
  assessmentId: id,
  problemSlug: "cachorro-puxa-guia" as const,
  version: 1,
  answers: {},
  status: "in_progress" as const,
  safetyStatus: "pending" as const,
  safetyCodes: [],
  safetyRuleVersion: null,
  safetyEvaluatedAt: null,
  startedAt: "2026-09-01T10:00:00.000Z",
  completedAt: null,
};

function request(
  path: string,
  init: { method?: string; body?: string; cookie?: string; origin?: string } = {},
) {
  return new NextRequest(`https://coach.peth.com.br${path}`, {
    method: init.method ?? "GET",
    body: init.body,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.origin === "none"
        ? {}
        : { origin: init.origin ?? "https://coach.peth.com.br" }),
      ...(init.cookie ? { cookie: init.cookie } : {}),
    },
  });
}

describe("P4 assessment Route Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runtime.mockResolvedValue({ client: {}, secret });
    mocks.loadQuiz.mockResolvedValue(quiz);
    mocks.create.mockResolvedValue(assessment);
    mocks.read.mockResolvedValue(assessment);
    mocks.update.mockResolvedValue({ question_0: "a" });
    mocks.complete.mockResolvedValue({
      status: "completed",
      safetyStatus: "continue",
      safetyCodes: ["SAFETY_GATE_CLEAR"],
      safetyRuleVersion: "p5-v1",
      completedAt: "2026-09-01T10:05:00.000Z",
    });
  });

  it("rejects cross-origin creation before touching the provider", async () => {
    const response = await createAssessment(
      request("/api/assessments", {
        method: "POST",
        origin: "https://evil.test",
        body: JSON.stringify({
          problemSlug: "cachorro-puxa-guia",
          anonymousId,
        }),
      }),
    );
    expect(response.status).toBe(403);
    expect(mocks.runtime).not.toHaveBeenCalled();
  });

  it("creates a session without returning the bearer token to JavaScript", async () => {
    const response = await createAssessment(
      request("/api/assessments", {
        method: "POST",
        body: JSON.stringify({
          problemSlug: "cachorro-puxa-guia",
          anonymousId,
        }),
      }),
    );
    expect(response.status).toBe(201);
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    const body = await response.json();
    expect(body).toMatchObject({ assessment: { problemSlug: quiz.problemSlug } });
    expect(JSON.stringify(body)).not.toContain("token");
  });

  it("maps the shared creation limit to a recoverable 429", async () => {
    mocks.create.mockRejectedValue(new AssessmentDataError("rate_limited"));
    const response = await createAssessment(
      request("/api/assessments", {
        method: "POST",
        body: JSON.stringify({
          problemSlug: "cachorro-puxa-guia",
          anonymousId,
        }),
      }),
    );
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ code: "rate_limited" });
  });

  it("requires the signed HttpOnly credential for reads and updates", async () => {
    const token = createAssessmentToken(id, secret);
    const cookie = `pethcoach-assessment=${token}`;
    const context = { params: Promise.resolve({ assessmentId: id }) };
    const read = await readAssessment(
      request(`/api/assessments/${id}`, { cookie }),
      context,
    );
    expect(read.status).toBe(200);
    expect(mocks.loadQuiz).toHaveBeenCalledWith(
      {},
      assessment.problemSlug,
      assessment.version,
    );
    const updated = await updateAssessment(
      request(`/api/assessments/${id}`, {
        method: "PATCH",
        cookie,
        body: JSON.stringify({ questionKey: "question_0", optionKey: "a" }),
      }),
      context,
    );
    expect(updated.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ assessmentId: id, questionKey: "question_0" }),
    );
    const denied = await updateAssessment(
      request(`/api/assessments/${id}`, {
        method: "PATCH",
        cookie: "pethcoach-assessment=forged",
        body: JSON.stringify({ questionKey: "question_0", optionKey: "a" }),
      }),
      context,
    );
    expect(denied.status).toBe(404);
  });

  it("does not complete partial assessments", async () => {
    mocks.complete.mockRejectedValue(new AssessmentDataError("incomplete"));
    const token = createAssessmentToken(id, secret);
    const response = await completeAssessment(
      request(`/api/assessments/${id}/complete`, {
        method: "POST",
        cookie: `pethcoach-assessment=${token}`,
      }),
      { params: Promise.resolve({ assessmentId: id }) },
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "incomplete" });
  });

  it("returns the canonical safety decision produced during completion", async () => {
    const token = createAssessmentToken(id, secret);
    const response = await completeAssessment(
      request(`/api/assessments/${id}/complete`, {
        method: "POST",
        cookie: `pethcoach-assessment=${token}`,
      }),
      { params: Promise.resolve({ assessmentId: id }) },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "completed",
      safetyStatus: "continue",
      safetyCodes: ["SAFETY_GATE_CLEAR"],
      safetyRuleVersion: "p5-v1",
    });
  });
});
