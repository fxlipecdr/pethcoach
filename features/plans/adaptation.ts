import {
  type AdaptationType,
  type CheckinMood,
  type DailyCheckin,
  type DifficultyRating,
  type MilestoneKey,
  type SafetyFlag,
} from "./contracts";

export interface SafetyCheckResult {
  safe: boolean;
  reason?: string;
  recommendedAction?: string;
}

/**
 * Deterministic safety gate for daily check-ins.
 * If tutor indicates signs of acute pain, extreme distress, or aggression risk,
 * training is immediately paused and referred for veterinary/professional evaluation.
 */
export function evaluateCheckinSafety(
  safetyFlag: SafetyFlag,
): SafetyCheckResult {
  switch (safetyFlag) {
    case "pain_suspected":
      return {
        safe: false,
        reason:
          "Sinal de dor ou desconforto físico agudo relatado durante o treino.",
        recommendedAction:
          "O treino foi pausado por segurança. Consulte um médico-veterinário para avaliar possíveis causas clínicas ou desconforto antes de retomar os exercícios.",
      };
    case "distress_extreme":
      return {
        safe: false,
        reason:
          "Sinais de pânico ou estresse extremo observados durante o treino.",
        recommendedAction:
          "O treino foi pausado para proteger o bem-estar do cão. Recomendamos orientação presencial com profissional comportamental qualificado antes de prosseguir.",
      };
    case "aggression_risk":
      return {
        safe: false,
        reason:
          "Sinais de reatividade intensa, rigidez ou risco de mordida observados.",
        recommendedAction:
          "Por segurança de todos, o plano foi pausado. Casos com risco de agressividade exigem avaliação e manejo presencial especializado.",
      };
    case "none":
    default:
      return { safe: true };
  }
}

export interface AdaptationDecision {
  adaptationType: AdaptationType;
  reason: string;
}

/**
 * Evaluates whether a check-in warrants schedule adaptation (consolidation, pause or progression).
 * Reward-based principle: If dog needed pause or found exercise challenging, consolidate without rushing.
 */
export function determineAdaptation(input: {
  mood: CheckinMood;
  difficultyRating: DifficultyRating;
  recentCheckins?: DailyCheckin[];
}): AdaptationDecision | null {
  if (input.mood === "needed_pause") {
    return {
      adaptationType: "consolidation",
      reason:
        "Pausa respeitada na sessão. As próximas tarefas priorizarão ambientação suave e menor distração.",
    };
  }

  if (input.difficultyRating === "challenging") {
    return {
      adaptationType: "consolidation",
      reason:
        "Exercício avaliado como desafiador. O cronograma manterá o ritmo atual sem elevação súbita de critérios.",
    };
  }

  // If previous 2 check-ins and current are all calm and easy, acknowledge smooth progression
  const recent = input.recentCheckins ?? [];
  if (
    input.mood === "calm" &&
    input.difficultyRating === "easy" &&
    recent.length >= 2 &&
    recent.slice(-2).every((c) => c.mood === "calm")
  ) {
    return {
      adaptationType: "progression",
      reason:
        "Constância calma e boa assimilação observadas. Cão pronto para os passos seguintes com segurança.",
    };
  }

  return null;
}

export interface MilestoneDef {
  key: MilestoneKey;
  title: string;
  description: string;
}

/**
 * Calculates newly earned milestones based on the check-in and overall progress.
 */
export function calculateNewMilestones(input: {
  dayNumber: number;
  mood: CheckinMood;
  totalCheckinsCount: number;
  existingKeys: Set<string>;
}): MilestoneDef[] {
  const newMilestones: MilestoneDef[] = [];

  // Marco 1: Primeiro Passo (Day 1 check-in)
  if (!input.existingKeys.has("first_training_done") && input.dayNumber >= 1) {
    newMilestones.push({
      key: "first_training_done",
      title: "Primeiro Passo",
      description:
        "Você e seu cão concluíram a primeira sessão de treino juntos! O início de uma comunicação clara.",
    });
  }

  // Marco 2: Pausa Consciente (quando o tutor soube pausar)
  if (!input.existingKeys.has("pause_honored") && input.mood === "needed_pause") {
    newMilestones.push({
      key: "pause_honored",
      title: "Pausa Consciente",
      description:
        "Você priorizou o bem-estar do seu cão respeitando os sinais de limite. Saber parar é parte fundamental do aprendizado.",
    });
  }

  // Marco 3: Constância Serena (3 check-ins concluídos)
  if (
    !input.existingKeys.has("constancia_serena") &&
    input.totalCheckinsCount >= 3
  ) {
    newMilestones.push({
      key: "constancia_serena",
      title: "Constância Serena",
      description:
        "Três sessões concluídas no ritmo de vocês, sem pressa e reforçando comportamentos positivos.",
    });
  }

  // Marco 4: Fundamentos Sólidos (Dia 7 concluído)
  if (!input.existingKeys.has("week_one_done") && input.dayNumber >= 7) {
    newMilestones.push({
      key: "week_one_done",
      title: "Fundamentos Sólidos",
      description:
        "Metade da jornada de 14 dias concluída! As bases de foco e cooperação estão estabelecidas.",
    });
  }

  // Marco 5: Jornada Concluída (Dia 14 concluído)
  if (!input.existingKeys.has("program_completed") && input.dayNumber >= 14) {
    newMilestones.push({
      key: "program_completed",
      title: "Jornada Concluída",
      description:
        "Parabéns! 14 dias de dedicação, respeito e conexão mútua completados com sucesso.",
    });
  }

  return newMilestones;
}
