import { describe, expect, it } from "vitest";
import type { BehaviorModule, StructuredPlanOutput } from "@/features/plans/contracts";
import {
  buildDeterministicPlan,
  calculateDailyDuration,
  validateStructuredPlan,
  PlanEngineError,
} from "@/features/plans/engine";

const sampleModules: BehaviorModule[] = [
  {
    id: "70000000-0000-4000-8000-000000000001",
    problemId: "10000000-0000-4000-8000-000000000001",
    slug: "pausa-antes-da-porta",
    title: "Pausa tranquila antes da porta",
    category: "ambientacao",
    difficulty: "beginner",
    estimatedDurationMinutes: 3,
    setupInstructions: "Guia frouxa e petiscos.",
    steps: ["Fique parado.", "Aguarde relaxar.", "Recompense."],
    successCriteria: "3 repetições calmas.",
    stopConditions: "Interrompa se pular ou ganir.",
    tags: ["door", "quiet"],
    contraindications: [],
    version: 1,
    status: "published",
  },
  {
    id: "70000000-0000-4000-8000-000000000002",
    problemId: "10000000-0000-4000-8000-000000000001",
    slug: "atencao-voluntaria-guia-frouxa",
    title: "Atenção voluntária e guia frouxa",
    category: "foco",
    difficulty: "beginner",
    estimatedDurationMinutes: 4,
    setupInstructions: "Ambiente calmo.",
    steps: ["Caminhe em ritmo calmo.", "Recompense guia em U."],
    successCriteria: "10 passos com guia frouxa.",
    stopConditions: "Não dê puxões de volta.",
    tags: ["walk", "loose_leash"],
    contraindications: [],
    version: 1,
    status: "published",
  },
  {
    id: "70000000-0000-4000-8000-000000000003",
    problemId: "10000000-0000-4000-8000-000000000001",
    slug: "manejo-de-distancia",
    title: "Manejo calmo de distância",
    category: "manejo",
    difficulty: "intermediate",
    estimatedDurationMinutes: 5,
    setupInstructions: "Espaço aberto.",
    steps: ["Identifique estímulo.", "Aumente distância.", "Recompense calma."],
    successCriteria: "Cão observa à distância sem latir.",
    stopConditions: "Aumente distância se houver rigidez.",
    tags: ["stimuli", "threshold"],
    contraindications: [],
    version: 1,
    status: "published",
  },
  {
    id: "70000000-0000-4000-8000-000000000004",
    problemId: "10000000-0000-4000-8000-000000000001",
    slug: "curva-e-redirecionamento",
    title: "Mudança de direção suave",
    category: "direcionamento",
    difficulty: "intermediate",
    estimatedDurationMinutes: 4,
    setupInstructions: "Estímulos moderados.",
    steps: ["Mude a trajetória.", "Recompense movimento."],
    successCriteria: "3 mudanças de direção calmas.",
    stopConditions: "Não use enforcador.",
    tags: ["redirection"],
    contraindications: [],
    version: 1,
    status: "published",
  },
];

const [m0, m1, m2, m3] = sampleModules;
if (!m0 || !m1 || !m2 || !m3) {
  throw new Error("Sample modules must have at least 4 items");
}

describe("P7 plan engine - deterministic generation and constraints", () => {
  it("builds a 14-day schedule adhering to 1-3 tasks/day constraint", () => {
    const plan = buildDeterministicPlan(sampleModules, 14);

    expect(plan.days).toHaveLength(14);
    for (const [index, day] of plan.days.entries()) {
      expect(day.dayNumber).toBe(index + 1);
      expect(day.moduleIds.length).toBeGreaterThanOrEqual(1);
      expect(day.moduleIds.length).toBeLessThanOrEqual(3);

      // Verify every moduleId is from availableModules
      for (const id of day.moduleIds) {
        expect(sampleModules.some((m) => m.id === id)).toBe(true);
      }
    }
  });

  it("ensures Day 1 starts with beginner foundation module", () => {
    const plan = buildDeterministicPlan(sampleModules, 14);
    const day1 = plan.days[0];
    expect(day1).toBeDefined();
    const day1ModuleId = day1?.moduleIds[0];
    expect(day1ModuleId).toBeDefined();
    const module1 = sampleModules.find((m) => m.id === day1ModuleId);

    expect(module1?.difficulty).toBe("beginner");
  });

  it("calculates daily duration accurately within reasonable limits (<= 15 min)", () => {
    const modulesMap = new Map(sampleModules.map((m) => [m.id, m]));
    const plan = buildDeterministicPlan(sampleModules, 14);

    for (const day of plan.days) {
      const duration = calculateDailyDuration(day.moduleIds, modulesMap);
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThanOrEqual(15);
    }
  });

  it("throws if no modules are available", () => {
    expect(() => buildDeterministicPlan([])).toThrow(PlanEngineError);
  });
});

describe("P7 plan engine - anti-hallucination catalog validation", () => {
  it("accepts a valid schedule containing only published module IDs", () => {
    const validPlan: StructuredPlanOutput = {
      days: Array.from({ length: 14 }, (_, i) => ({
        dayNumber: i + 1,
        moduleIds: [m0.id],
      })),
      rationale: "Válido",
    };

    expect(validateStructuredPlan(validPlan, sampleModules)).toBe(true);
  });

  it("strictly rejects schedules with hallucinated/unapproved module IDs", () => {
    const hallucinatedPlan: StructuredPlanOutput = {
      days: Array.from({ length: 14 }, (_, i) => ({
        dayNumber: i + 1,
        moduleIds:
          i === 5
            ? ["ffffffff-ffff-4fff-8fff-ffffffffffff"] // Hallucinated ID
            : [m0.id],
      })),
    };

    expect(validateStructuredPlan(hallucinatedPlan, sampleModules)).toBe(false);
  });

  it("rejects schedules with invalid day count (< 14)", () => {
    const incompletePlan = {
      days: Array.from({ length: 10 }, (_, i) => ({
        dayNumber: i + 1,
        moduleIds: [m0.id],
      })),
    };

    expect(validateStructuredPlan(incompletePlan, sampleModules)).toBe(false);
  });

  it("rejects schedules where any day has > 3 tasks", () => {
    const overloadedPlan = {
      days: Array.from({ length: 14 }, (_, i) => ({
        dayNumber: i + 1,
        moduleIds:
          i === 0
            ? [m0.id, m1.id, m2.id, m3.id] // 4 tasks!
            : [m0.id],
      })),
    };

    expect(validateStructuredPlan(overloadedPlan, sampleModules)).toBe(false);
  });

  it("rejects schedules where any day has 0 tasks", () => {
    const emptyDayPlan = {
      days: Array.from({ length: 14 }, (_, i) => ({
        dayNumber: i + 1,
        moduleIds: i === 2 ? [] : [m0.id],
      })),
    };

    expect(validateStructuredPlan(emptyDayPlan, sampleModules)).toBe(false);
  });
});
