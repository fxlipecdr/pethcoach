import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  assessmentRuntime,
  createAssessmentRecord,
  loadPublishedQuiz,
  AssessmentDataError,
} from "@/features/assessments/data";
import { createAssessmentSchema } from "@/features/assessments/contracts";
import {
  assessmentCookieName,
  assessmentRateKey,
  assessmentTokenHash,
  assessmentTtlSeconds,
  createAssessmentToken,
} from "@/features/assessments/token";
import {
  apiError,
  isSameOriginMutation,
  networkHint,
  parseJson,
} from "@/features/assessments/http";

export async function POST(request: NextRequest) {
  if (!isSameOriginMutation(request))
    return apiError("forbidden", "A origem da solicitação não é válida.", 403);
  const input = await parseJson(request, createAssessmentSchema);
  if (!input)
    return apiError("invalid_request", "Não foi possível iniciar este quiz.", 400);
  const runtime = await assessmentRuntime();
  if (!runtime)
    return apiError(
      "unavailable",
      "O quiz ainda não está disponível neste ambiente.",
      503,
    );
  const assessmentId = randomUUID();
  const token = createAssessmentToken(assessmentId, runtime.secret);
  const tokenHash = assessmentTokenHash(token);
  const expiresAt = new Date(Date.now() + assessmentTtlSeconds * 1000);
  try {
    const quiz = await loadPublishedQuiz(runtime.client, input.problemSlug);
    const assessment = await createAssessmentRecord(runtime.client, {
      assessmentId,
      anonymousId: input.anonymousId,
      problemSlug: input.problemSlug,
      tokenHash,
      tokenExpiresAt: expiresAt.toISOString(),
      rateKey: assessmentRateKey(
        runtime.secret,
        input.anonymousId,
        networkHint(request),
      ),
    });
    const response = NextResponse.json(
      { assessment, quiz },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
    response.cookies.set(assessmentCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    if (error instanceof AssessmentDataError && error.reason === "rate_limited")
      return apiError(
        "rate_limited",
        "Muitas tentativas em pouco tempo. Aguarde alguns minutos.",
        429,
      );
    return apiError(
      "unavailable",
      "Não foi possível iniciar o quiz agora. Tente novamente.",
      503,
    );
  }
}
