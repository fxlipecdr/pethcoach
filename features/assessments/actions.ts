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
  diagnoseAssessmentToken,
  assessmentTokenHash,
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

  const falha = !token
    ? ("sem_cookie" as const)
    : diagnoseAssessmentToken(
        token,
        parsed.data.assessmentId,
        runtime.secret,
      );
  if (falha || !token) {
    // O motivo vai para o log do servidor: a mensagem ao tutor precisa dizer o
    // que fazer, não o que quebrou. Nenhum token é registrado.
    console.warn(`[claim] posse não comprovada: ${falha}`);

    /**
     * Refazer o questionário no mesmo navegador sobrescreve o cookie, que passa
     * a apontar para a avaliação nova. Voltar para o resultado antigo — pelo
     * histórico do navegador, por exemplo — cai exatamente aqui, e o tutor não
     * tem como adivinhar isso pela mensagem genérica.
     */
    const mensagem =
      falha === "outra_avaliacao"
        ? "Este resultado é de um questionário anterior. Você respondeu outro depois, e é ele que está salvo neste navegador — abra o resultado mais recente para vinculá-lo."
        : falha === "expirado"
          ? "Este resultado passou dos 7 dias e não pode mais ser vinculado. Responder o questionário de novo leva poucos minutos."
          : "Não foi possível comprovar a posse desta avaliação neste navegador. Se você respondeu o questionário em outro aparelho ou em janela anônima, responda novamente aqui.";

    return { status: "error", message: mensagem };
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
