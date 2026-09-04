import { describe, expect, it } from "vitest";
import {
  adaptationTypeSchema,
  difficultyRatingSchema,
  milestoneKeySchema,
  planAdaptationSchema,
  planMilestoneSchema,
  safetyFlagSchema,
  submitDailyCheckinInputSchema,
} from "@/features/plans/contracts";
import {
  calculateNewMilestones,
  determineAdaptation,
  evaluateCheckinSafety,
} from "@/features/plans/adaptation";

describe("P9 Safety Gate - evaluateCheckinSafety", () => {
  it("allows safe check-in when safetyFlag is 'none'", () => {
    const result = evaluateCheckinSafety("none");
    expect(result.safe).toBe(true);
    expect(result.reason).toBeUndefined();
    expect(result.recommendedAction).toBeUndefined();
  });

  it("intercepts pain_suspected and triggers veterinary referral", () => {
    const result = evaluateCheckinSafety("pain_suspected");
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("desconforto físico agudo");
    expect(result.recommendedAction).toContain("médico-veterinário");
  });

  it("intercepts distress_extreme and triggers behavioral referral", () => {
    const result = evaluateCheckinSafety("distress_extreme");
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("estresse extremo");
    expect(result.recommendedAction).toContain("profissional comportamental");
  });

  it("intercepts aggression_risk and pauses plan without risk", () => {
    const result = evaluateCheckinSafety("aggression_risk");
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("risco de mordida");
    expect(result.recommendedAction).toContain("manejo presencial especializado");
  });
});

describe("P9 Adaptation Engine - determineAdaptation", () => {
  it("triggers consolidation adaptation when dog needed a pause", () => {
    const decision = determineAdaptation({
      mood: "needed_pause",
      difficultyRating: "adequate",
    });
    expect(decision).not.toBeNull();
    expect(decision?.adaptationType).toBe("consolidation");
    expect(decision?.reason).toContain("Pausa respeitada na sessão");
  });

  it("triggers consolidation adaptation when tutor evaluated exercise as challenging", () => {
    const decision = determineAdaptation({
      mood: "calm",
      difficultyRating: "challenging",
    });
    expect(decision).not.toBeNull();
    expect(decision?.adaptationType).toBe("consolidation");
    expect(decision?.reason).toContain("Exercício avaliado como desafiador");
  });

  it("triggers progression adaptation after consecutive calm and easy check-ins", () => {
    const pastCheckins = [
      {
        id: "c-1",
        planId: "p-1",
        dayNumber: 1,
        userId: "u-1",
        mood: "calm" as const,
        difficultyRating: "easy" as const,
        safetyFlag: "none" as const,
        notes: null,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "c-2",
        planId: "p-1",
        dayNumber: 2,
        userId: "u-1",
        mood: "calm" as const,
        difficultyRating: "easy" as const,
        safetyFlag: "none" as const,
        notes: null,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const decision = determineAdaptation({
      mood: "calm",
      difficultyRating: "easy",
      recentCheckins: pastCheckins,
    });

    expect(decision).not.toBeNull();
    expect(decision?.adaptationType).toBe("progression");
    expect(decision?.reason).toContain("Constância calma e boa assimilação");
  });

  it("returns null when session is normal/adequate without requiring schedule disruption", () => {
    const decision = determineAdaptation({
      mood: "calm",
      difficultyRating: "adequate",
    });
    expect(decision).toBeNull();
  });
});

describe("P9 Milestone Calculation - calculateNewMilestones", () => {
  it("awards first_training_done on day 1 check-in if not previously awarded", () => {
    const milestones = calculateNewMilestones({
      dayNumber: 1,
      mood: "calm",
      totalCheckinsCount: 1,
      existingKeys: new Set(),
    });

    expect(milestones).toHaveLength(1);
    expect(milestones[0]?.key).toBe("first_training_done");
    expect(milestones[0]?.title).toBe("Primeiro Passo");
  });

  it("awards pause_honored when tutor reports needed_pause", () => {
    const milestones = calculateNewMilestones({
      dayNumber: 2,
      mood: "needed_pause",
      totalCheckinsCount: 2,
      existingKeys: new Set(["first_training_done"]),
    });

    expect(milestones).toHaveLength(1);
    expect(milestones[0]?.key).toBe("pause_honored");
    expect(milestones[0]?.title).toBe("Pausa Consciente");
  });

  it("awards constancia_serena when 3 check-ins are reached", () => {
    const milestones = calculateNewMilestones({
      dayNumber: 3,
      mood: "calm",
      totalCheckinsCount: 3,
      existingKeys: new Set(["first_training_done"]),
    });

    expect(milestones.some((m) => m.key === "constancia_serena")).toBe(true);
  });

  it("awards week_one_done on day 7", () => {
    const milestones = calculateNewMilestones({
      dayNumber: 7,
      mood: "calm",
      totalCheckinsCount: 7,
      existingKeys: new Set(["first_training_done", "constancia_serena"]),
    });

    expect(milestones.some((m) => m.key === "week_one_done")).toBe(true);
  });

  it("awards program_completed on day 14", () => {
    const milestones = calculateNewMilestones({
      dayNumber: 14,
      mood: "calm",
      totalCheckinsCount: 14,
      existingKeys: new Set([
        "first_training_done",
        "constancia_serena",
        "week_one_done",
      ]),
    });

    expect(milestones.some((m) => m.key === "program_completed")).toBe(true);
  });

  it("is strictly idempotent and does not duplicate already unlocked milestones", () => {
    const existingKeys = new Set([
      "first_training_done",
      "pause_honored",
      "constancia_serena",
      "week_one_done",
      "program_completed",
    ]);

    const milestones = calculateNewMilestones({
      dayNumber: 14,
      mood: "needed_pause",
      totalCheckinsCount: 14,
      existingKeys,
    });

    expect(milestones).toHaveLength(0);
  });
});

describe("P9 Contracts & Schemas", () => {
  it("validates difficultyRatingSchema values", () => {
    expect(difficultyRatingSchema.safeParse("easy").success).toBe(true);
    expect(difficultyRatingSchema.safeParse("adequate").success).toBe(true);
    expect(difficultyRatingSchema.safeParse("challenging").success).toBe(true);
    expect(difficultyRatingSchema.safeParse("hard").success).toBe(false);
  });

  it("validates safetyFlagSchema values", () => {
    expect(safetyFlagSchema.safeParse("none").success).toBe(true);
    expect(safetyFlagSchema.safeParse("pain_suspected").success).toBe(true);
    expect(safetyFlagSchema.safeParse("distress_extreme").success).toBe(true);
    expect(safetyFlagSchema.safeParse("aggression_risk").success).toBe(true);
    expect(safetyFlagSchema.safeParse("danger").success).toBe(false);
  });

  it("validates milestoneKeySchema and adaptationTypeSchema", () => {
    expect(milestoneKeySchema.safeParse("first_training_done").success).toBe(true);
    expect(milestoneKeySchema.safeParse("pause_honored").success).toBe(true);
    expect(milestoneKeySchema.safeParse("constancia_serena").success).toBe(true);
    expect(milestoneKeySchema.safeParse("week_one_done").success).toBe(true);
    expect(milestoneKeySchema.safeParse("program_completed").success).toBe(true);
    expect(milestoneKeySchema.safeParse("random_award").success).toBe(false);

    expect(adaptationTypeSchema.safeParse("consolidation").success).toBe(true);
    expect(adaptationTypeSchema.safeParse("progression").success).toBe(true);
    expect(adaptationTypeSchema.safeParse("safety_pause").success).toBe(true);
    expect(adaptationTypeSchema.safeParse("speedup").success).toBe(false);
  });

  it("validates planMilestoneSchema and planAdaptationSchema", () => {
    const validMilestone = {
      id: "10000000-0000-4000-8000-000000000001",
      planId: "20000000-0000-4000-8000-000000000001",
      userId: "30000000-0000-4000-8000-000000000001",
      key: "first_training_done",
      title: "Primeiro Passo",
      description: "Primeira sessão concluída.",
      unlockedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    expect(planMilestoneSchema.safeParse(validMilestone).success).toBe(true);

    const validAdaptation = {
      id: "40000000-0000-4000-8000-000000000001",
      planId: "20000000-0000-4000-8000-000000000001",
      userId: "30000000-0000-4000-8000-000000000001",
      triggerCheckinId: null,
      adaptationType: "consolidation",
      reason: "Manter ritmo calmo",
      createdAt: new Date().toISOString(),
    };
    expect(planAdaptationSchema.safeParse(validAdaptation).success).toBe(true);
  });

  it("validates submitDailyCheckinInputSchema with difficulty and safety flags", () => {
    const input = {
      planId: "20000000-0000-4000-8000-000000000001",
      dayNumber: 1,
      mood: "calm",
      difficultyRating: "easy",
      safetyFlag: "none",
      notes: "Sessão tranquila.",
    };
    expect(submitDailyCheckinInputSchema.safeParse(input).success).toBe(true);
  });
});
