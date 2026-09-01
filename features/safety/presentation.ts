import type {
  EvaluatedSafetyOutcome,
  SafetyCode,
} from "./contracts";

type SafetyPresentation = {
  badge: string;
  title: string;
  description: string;
  actions: string[];
  tone: "success" | "warning" | "error";
};

export function safetyPresentation(
  status: EvaluatedSafetyOutcome,
  codes: readonly SafetyCode[],
): SafetyPresentation {
  const codeSet = new Set(codes);
  if (status === "block") {
    const actions = [
      "Evite repetir ou testar a situação de risco. Use distância, barreiras físicas e supervisão sem punição.",
      "Procure um médico-veterinário e um profissional qualificado que trabalhe com métodos baseados em recompensa.",
    ];
    if (codeSet.has("SELF_INJURY_OR_ESCAPE_RISK"))
      actions.unshift(
        "Não deixe o cão enfrentar essa situação sozinho até receber orientação individualizada.",
      );
    return {
      badge: "PAUSA DE SEGURANÇA",
      title: "Interrompa esta jornada por enquanto",
      description:
        "Suas respostas indicam uma situação com risco que não deve ser conduzida apenas por um plano online.",
      actions,
      tone: "error",
    };
  }

  if (status === "refer") {
    const veterinaryFirst =
      codeSet.has("SUSPECTED_PAIN") ||
      codeSet.has("SUDDEN_CHANGE_WITH_PHYSICAL_SIGNS");
    return {
      badge: "AVALIAÇÃO RECOMENDADA",
      title: "Procure avaliação antes de continuar",
      description: veterinaryFirst
        ? "As respostas incluem mudança física, mudança repentina ou possível desconforto. Uma avaliação veterinária deve vir antes do treino relacionado a essa situação."
        : "As respostas indicam sofrimento intenso ou risco de contato que pede orientação individualizada antes do autotreino.",
      actions: veterinaryFirst
        ? [
            "Pause os exercícios ligados a essa situação e organize uma avaliação com médico-veterinário.",
            "Depois da avaliação, procure um profissional de comportamento que use métodos baseados em recompensa, se necessário.",
          ]
        : [
            "Reduza a exposição, aumente a distância e evite punições ou confrontos.",
            "Procure um profissional qualificado que trabalhe com métodos baseados em recompensa; inclua avaliação veterinária se houver qualquer sinal físico.",
          ],
      tone: "warning",
    };
  }

  const actions = [
    "Observe mudanças repentinas, sinais físicos, medo intenso ou risco de mordida e interrompa se algo surgir.",
  ];
  if (codeSet.has("AVERSIVE_METHOD_REPORTED"))
    actions.unshift(
      "Suspenda trancos, sustos, dor, choque e correções físicas. Prefira manejo do ambiente e recompensas.",
    );
  return {
    badge: "TRIAGEM CONCLUÍDA",
    title: "Nenhum bloqueio imediato foi identificado",
    description:
      "As respostas não acionaram um dos sinais definidos para pausa ou encaminhamento. Isso não garante ausência de risco e não é diagnóstico.",
    actions,
    tone: "success",
  };
}
