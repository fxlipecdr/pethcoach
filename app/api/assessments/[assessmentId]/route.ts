import { NextRequest } from "next/server";
import {
  assessmentRuntime,
  loadPublishedQuiz,
  readAssessmentRecord,
  updateAssessmentAnswer,
  AssessmentDataError,
} from "@/features/assessments/data";
import {
  answerAssessmentSchema,
  assessmentIdSchema,
} from "@/features/assessments/contracts";
import {
  assessmentCookieName,
  assessmentTokenHash,
  verifyAssessmentToken,
} from "@/features/assessments/token";
import {
  apiError,
  isSameOriginMutation,
  parseJson,
} from "@/features/assessments/http";

async function access(request: NextRequest, rawId: string) {
  const id = assessmentIdSchema.safeParse(rawId);
  const runtime = await assessmentRuntime();
  if (!id.success || !runtime) return null;
  const token = request.cookies.get(assessmentCookieName)?.value;
  if (!verifyAssessmentToken(token, id.data, runtime.secret)) return null;
  return {
    ...runtime,
    id: id.data,
    tokenHash: assessmentTokenHash(token!),
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/assessments/[assessmentId]">,
) {
  const runtime = await access(request, (await context.params).assessmentId);
  if (!runtime)
    return apiError("expired", "Este quiz não está mais disponível.", 404);
  try {
    const assessment = await readAssessmentRecord(
      runtime.client,
      runtime.id,
      runtime.tokenHash,
    );
    const quiz = await loadPublishedQuiz(
      runtime.client,
      assessment.problemSlug,
      assessment.version,
    );
    return Response.json(
      { assessment, quiz },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return apiError("expired", "Este quiz não está mais disponível.", 404);
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/assessments/[assessmentId]">,
) {
  if (!isSameOriginMutation(request))
    return apiError("forbidden", "A origem da solicitação não é válida.", 403);
  const input = await parseJson(request, answerAssessmentSchema);
  if (!input)
    return apiError("invalid_request", "Escolha uma resposta válida.", 400);
  const runtime = await access(request, (await context.params).assessmentId);
  if (!runtime)
    return apiError("expired", "Este quiz não está mais disponível.", 404);
  try {
    const answers = await updateAssessmentAnswer(runtime.client, {
      assessmentId: runtime.id,
      tokenHash: runtime.tokenHash,
      questionKey: input.questionKey,
      optionKey: input.optionKey,
    });
    return Response.json(
      { answers },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof AssessmentDataError) {
      if (error.reason === "rate_limited")
        return apiError(
          "rate_limited",
          "Muitas respostas em pouco tempo. Aguarde um instante.",
          429,
        );
      if (error.reason === "invalid_answer")
        return apiError("invalid_request", "Escolha uma resposta válida.", 400);
    }
    return apiError("expired", "Este quiz não está mais disponível.", 404);
  }
}
