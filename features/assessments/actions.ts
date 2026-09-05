"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { consumeActionLimit } from "@/lib/security/rate-limit";
import {
  claimAssessmentSchema,
  type ClaimedAssessment,
} from "./contracts";
import {
  assessmentRuntime,
  claimAssessmentRecord,
  AssessmentDataError,
} from "./data";
import {
  assessmentCookieName,
  assessmentTokenHash,
  verifyAssessmentToken,
} from "./token";
import { dispatchTransactionalEmail } from "@/features/emails/dispatcher";

export type ClaimActionResult =
  | {
      status: "success";
      data: ClaimedAssessment;
      message: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function claimAssessmentAction(
  assessmentId: string,
  dogId?: string | null,
): Promise<ClaimActionResult> {
  const parsed = claimAssessmentSchema.safeParse({ assessmentId, dogId });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Dados de avaliação inválidos.",
    };
  }

  const runtime = await assessmentRuntime();
  if (!runtime) {
    return {
      status: "error",
      message: "O serviço de avaliação está temporariamente indisponível.",
    };
  }

  const session = await runtime.client.auth.getUser().catch(() => null);
  if (!session || !session.data.user) {
    return {
      status: "error",
      message: "Entre na sua conta antes de salvar esta avaliação.",
    };
  }

  const user = session.data.user;

  if (!(await consumeActionLimit(runtime.client, "assessment_claim", user.id))) {
    return {
      status: "error",
      message: "Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.",
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(assessmentCookieName)?.value;

  if (!token || !verifyAssessmentToken(token, parsed.data.assessmentId, runtime.secret)) {
    return {
      status: "error",
      message:
        "Não foi possível comprovar a posse desta avaliação no seu navegador atual.",
    };
  }

  const tokenHash = assessmentTokenHash(token);

  try {
    const claimed = await claimAssessmentRecord(runtime.client, {
      assessmentId: parsed.data.assessmentId,
      tokenHash,
      dogId: parsed.data.dogId ?? null,
    });

    if (user.email) {
      dispatchTransactionalEmail({
        recipientEmail: user.email,
        userId: user.id,
        templateKey: "welcome",
        idempotencyKey: `welcome:${user.id}`,
        templateData: {},
      }).catch((dispatchErr) => {
        console.error("[claimAssessmentAction] Erro no envio de welcome:", dispatchErr);
      });
    }

    revalidatePath("/app", "layout");
    revalidatePath(`/resultado/${parsed.data.assessmentId}`);

    return {
      status: "success",
      data: claimed,
      message: "Avaliação vinculada à sua conta com sucesso!",
    };
  } catch (err) {
    if (err instanceof AssessmentDataError) {
      switch (err.reason) {
        case "not_claimable":
          return {
            status: "error",
            message:
              "Esta avaliação requer avaliação profissional e não pode ser vinculada a um plano.",
          };
        case "already_claimed":
          return {
            status: "error",
            message: "Esta avaliação já foi vinculada a outra conta.",
          };
        case "rate_limited":
          return {
            status: "error",
            message: "Limite de tentativas excedido. Tente novamente em alguns minutos.",
          };
        case "expired":
          return {
            status: "error",
            message: "O prazo de 7 dias para vincular esta avaliação expirou.",
          };
        default:
          break;
      }
    }
    return {
      status: "error",
      message: "Não foi possível vincular a avaliação. Tente novamente em instantes.",
    };
  }
}
