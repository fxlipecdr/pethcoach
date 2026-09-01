import { NextRequest } from "next/server";
import {
  assessmentRuntime,
  completeAssessmentRecord,
  AssessmentDataError,
} from "@/features/assessments/data";
import { assessmentIdSchema } from "@/features/assessments/contracts";
import {
  assessmentCookieName,
  assessmentTokenHash,
  verifyAssessmentToken,
} from "@/features/assessments/token";
import { apiError, isSameOriginMutation } from "@/features/assessments/http";

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/assessments/[assessmentId]/complete">,
) {
  if (!isSameOriginMutation(request))
    return apiError("forbidden", "A origem da solicitação não é válida.", 403);
  const id = assessmentIdSchema.safeParse((await context.params).assessmentId);
  const runtime = await assessmentRuntime();
  if (!id.success || !runtime)
    return apiError("expired", "Este quiz não está mais disponível.", 404);
  const token = request.cookies.get(assessmentCookieName)?.value;
  if (!verifyAssessmentToken(token, id.data, runtime.secret))
    return apiError("expired", "Este quiz não está mais disponível.", 404);
  try {
    const result = await completeAssessmentRecord(
      runtime.client,
      id.data,
      assessmentTokenHash(token!),
    );
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AssessmentDataError) {
      if (error.reason === "incomplete")
        return apiError(
          "incomplete",
          "Responda todas as perguntas antes de concluir.",
          409,
        );
      if (error.reason === "rate_limited")
        return apiError(
          "rate_limited",
          "Muitas tentativas em pouco tempo. Aguarde um instante.",
          429,
        );
    }
    return apiError("expired", "Este quiz não está mais disponível.", 404);
  }
}
