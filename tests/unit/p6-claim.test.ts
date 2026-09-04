import { describe, expect, it } from "vitest";
import {
  claimAssessmentSchema,
  claimedAssessmentSchema,
  observableSummarySchema,
  type QuizDefinition,
} from "@/features/assessments/contracts";
import { buildObservableSummary } from "@/features/assessments/data";

const sampleQuiz: QuizDefinition = {
  problemSlug: "cachorro-puxa-guia",
  problemTitle: "Meu cachorro puxa a guia",
  version: 2,
  questions: [
    {
      key: "pulling_moment",
      prompt: "Em que momento a guia costuma ficar mais esticada?",
      helpText: null,
      order: 1,
      options: [
        { key: "door", label: "Já na saída ou perto da porta" },
        { key: "walk", label: "Durante boa parte do passeio" },
      ],
    },
    {
      key: "reward_response",
      prompt: "Em um local calmo, ele consegue notar uma recompensa?",
      helpText: null,
      order: 2,
      options: [
        { key: "easily", label: "Sim, com facilidade" },
        { key: "rarely", label: "Raramente consegue" },
      ],
    },
    {
      key: "distance_response",
      prompt: "Quando vocês se afastam do estímulo, o que costuma acontecer?",
      helpText: null,
      order: 3,
      options: [
        { key: "recovers", label: "Ele desacelera e consegue prestar atenção" },
        { key: "no_change", label: "A distância parece não mudar" },
      ],
    },
    {
      key: "methods_used",
      prompt: "Ao tentar lidar com essa situação, o que vocês fazem?",
      helpText: null,
      order: 4,
      options: [
        { key: "reward", label: "Recompensas e pausas" },
        { key: "unsure", label: "Ainda não tentamos" },
      ],
    },
    {
      key: "pulling_frequency",
      prompt: "Com que frequência isso acontece?",
      helpText: null,
      order: 5,
      options: [
        { key: "often", label: "Em boa parte do passeio" },
        { key: "sometimes", label: "Em alguns momentos" },
      ],
    },
    {
      key: "walk_environment",
      prompt: "Como é o ambiente do passeio?",
      helpText: null,
      order: 6,
      options: [
        { key: "mixed", label: "Tem momentos calmos e movimentados" },
        { key: "quiet", label: "Mais calmo e previsível" },
      ],
    },
  ],
};

describe("P6 claim and observable summary contracts", () => {
  it("validates claimAssessmentSchema", () => {
    const valid = claimAssessmentSchema.safeParse({
      assessmentId: "11111111-1111-4111-8111-111111111111",
      dogId: "22222222-2222-4222-8222-222222222222",
    });
    expect(valid.success).toBe(true);

    const validWithoutDog = claimAssessmentSchema.safeParse({
      assessmentId: "11111111-1111-4111-8111-111111111111",
    });
    expect(validWithoutDog.success).toBe(true);

    const invalidId = claimAssessmentSchema.safeParse({
      assessmentId: "invalid-uuid",
    });
    expect(invalidId.success).toBe(false);
  });

  it("validates claimedAssessmentSchema strictly", () => {
    const valid = claimedAssessmentSchema.safeParse({
      assessmentId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      dogId: null,
      problemSlug: "cachorro-puxa-guia",
      safetyStatus: "continue",
      claimedAt: new Date().toISOString(),
    });
    expect(valid.success).toBe(true);

    const invalidOutcome = claimedAssessmentSchema.safeParse({
      assessmentId: "11111111-1111-4111-8111-111111111111",
      userId: "22222222-2222-4222-8222-222222222222",
      dogId: null,
      problemSlug: "cachorro-puxa-guia",
      safetyStatus: "block",
      claimedAt: new Date().toISOString(),
    });
    expect(invalidOutcome.success).toBe(false);
  });

  it("builds observable summary deterministically without medical terms", () => {
    const answers = {
      pulling_moment: "door",
      reward_response: "easily",
      distance_response: "recovers",
      methods_used: "reward",
      pulling_frequency: "often",
      walk_environment: "mixed",
    };

    const summary = buildObservableSummary(sampleQuiz, answers);
    expect(observableSummarySchema.safeParse(summary).success).toBe(true);
    expect(summary.observations).toHaveLength(6);
    expect(summary.strengths).toContain(
      "Responde com interesse a recompensas em ambientes com menor distração.",
    );
    expect(summary.strengths).toContain(
      "Consegue desacelerar e recuperar foco quando a distância do estímulo é ampliada.",
    );
    expect(summary.focusPoints).toContain(
      "Treinar pausas com guia frouxa antes mesmo de cruzar a porta de saída.",
    );
  });

  it("builds puppy biting observable summary with calming routine focuses", () => {
    const puppyQuiz: QuizDefinition = {
      problemSlug: "filhote-mordendo",
      problemTitle: "Meu filhote morde muito",
      version: 2,
      questions: [
        {
          key: "redirect_response",
          prompt: "Quando você oferece um brinquedo, o que acontece?",
          helpText: null,
          order: 1,
          options: [
            { key: "accepts", label: "Ele troca e continua no brinquedo" },
          ],
        },
        {
          key: "rest_pattern",
          prompt: "Como estão as pausas e descanso?",
          helpText: null,
          order: 2,
          options: [
            { key: "regular", label: "Há pausas regulares e um lugar tranquilo" },
          ],
        },
        {
          key: "puppy_stage",
          prompt: "Em qual fase está?",
          helpText: null,
          order: 3,
          options: [{ key: "age_4_to_6m", label: "De 4 a 6 meses" }],
        },
        {
          key: "biting_moment",
          prompt: "Quando as mordidas aparecem?",
          helpText: null,
          order: 4,
          options: [{ key: "play", label: "Durante brincadeiras" }],
        },
        {
          key: "biting_target",
          prompt: "O que costuma morder?",
          helpText: null,
          order: 5,
          options: [{ key: "hands", label: "Mãos e roupas" }],
        },
        {
          key: "bite_intensity",
          prompt: "Como é a intensidade?",
          helpText: null,
          order: 6,
          options: [{ key: "light", label: "Contato leve" }],
        },
      ],
    };

    const summary = buildObservableSummary(puppyQuiz, {
      redirect_response: "accepts",
      rest_pattern: "regular",
      puppy_stage: "age_4_to_6m",
      biting_moment: "play",
      biting_target: "hands",
      bite_intensity: "light",
    });

    expect(summary.strengths).toContain(
      "Apresenta interesse pelo brinquedo quando o redirecionamento é oferecido com calma.",
    );
    expect(summary.focusPoints).toContain(
      "Planejar momentos de sono profundo, essenciais para reduzir a agitação de filhotes.",
    );
  });
});
