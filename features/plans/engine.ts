import type {
  BehaviorModule,
  StructuredDailyPlan,
  StructuredPlanOutput,
} from "./contracts";

export const PLAN_ENGINE_VERSION = "p7-v1";

export class PlanEngineError extends Error {
  constructor(
    readonly reason:
      | "no_published_modules"
      | "invalid_total_days"
      | "hallucinated_module_id"
      | "invalid_task_count"
      | "missing_days",
  ) {
    super(reason);
  }
}

/**
 * Validates candidate structured plan schedule against the published catalog.
 * Rejects if:
 * 1. Missing days (must be exactly totalDays, 1..totalDays sequential).
 * 2. Day has < 1 or > 3 tasks.
 * 3. Any module ID is not in the published catalog (anti-hallucination).
 */
export function validateStructuredPlan(
  candidate: unknown,
  availableModules: readonly BehaviorModule[],
  totalDays: number = 14,
): candidate is StructuredPlanOutput {
  if (!candidate || typeof candidate !== "object") return false;

  const validIds = new Set(availableModules.map((m) => m.id));
  if (validIds.size === 0) return false;

  const obj = candidate as Partial<StructuredPlanOutput>;
  if (!Array.isArray(obj.days) || obj.days.length !== totalDays) {
    return false;
  }

  for (let i = 0; i < totalDays; i++) {
    const day = obj.days[i];
    const expectedDay = i + 1;
    if (!day || typeof day !== "object") return false;
    if (day.dayNumber !== expectedDay) return false;
    if (!Array.isArray(day.moduleIds)) return false;
    if (day.moduleIds.length < 1 || day.moduleIds.length > 3) return false;

    for (const moduleId of day.moduleIds) {
      if (typeof moduleId !== "string" || !validIds.has(moduleId)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Deterministic plan engine: generates a structured 14-day training plan
 * using strictly available, reviewed positive reinforcement modules.
 * Follows a progressive 1-3 tasks/day schedule with clear focus phases:
 * - Days 1-4 (Fundamentos): 1-2 tarefas/dia com módulos introdutórios.
 * - Days 5-9 (Consolidação): 2 tarefas/dia combinando fundação e transição.
 * - Days 10-14 (Generalização e Manutenção): 1-2 tarefas/dia incluindo intermediários.
 */
export function buildDeterministicPlan(
  availableModules: readonly BehaviorModule[],
  totalDays: number = 14,
): StructuredPlanOutput {
  if (availableModules.length === 0) {
    throw new PlanEngineError("no_published_modules");
  }
  if (![7, 14, 21, 30].includes(totalDays)) {
    throw new PlanEngineError("invalid_total_days");
  }

  // Sort modules by difficulty (beginner first, then intermediate, then advanced)
  // then by estimated duration ascending.
  const difficultyWeight: Record<BehaviorModule["difficulty"], number> = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
  };

  const sorted = [...availableModules].sort((a, b) => {
    const diffDiff =
      difficultyWeight[a.difficulty] - difficultyWeight[b.difficulty];
    if (diffDiff !== 0) return diffDiff;
    return a.estimatedDurationMinutes - b.estimatedDurationMinutes;
  });

  const intermediates = sorted.filter((m) => m.difficulty !== "beginner");

  const first = sorted[0];
  if (!first) {
    throw new PlanEngineError("no_published_modules");
  }
  // Primary anchor module (easiest/first)
  const m0 = first;
  // Secondary anchor module
  const m1 = sorted[1] ?? m0;
  // Third module or intermediate
  const m2 = intermediates[0] ?? sorted[2] ?? m0;
  // Fourth module or next available
  const m3 = intermediates[1] ?? sorted[3] ?? m1;

  const days: StructuredDailyPlan[] = [];

  for (let day = 1; day <= totalDays; day++) {
    let dayModuleIds: string[];

    if (day <= 4) {
      // Phase 1: Foundation (1-2 tasks/day)
      // Days 1 & 3: Anchor foundation task
      // Days 2 & 4: Anchor foundation + secondary reinforcement
      if (day % 2 === 1) {
        dayModuleIds = [m0.id];
      } else {
        dayModuleIds = m0.id !== m1.id ? [m0.id, m1.id] : [m0.id];
      }
    } else if (day <= 9) {
      // Phase 2: Consolidation (2 tasks/day)
      // Alternating combinations of primary and intermediate modules
      if (day % 2 === 1) {
        dayModuleIds = [m0.id, m2.id];
      } else {
        dayModuleIds = [m1.id, m2.id];
      }
    } else {
      // Phase 3: Generalization & Maintenance (1-2 tasks/day)
      // Days 10, 12, 14: maintenance and advanced/intermediate focus
      if (day % 2 === 0) {
        dayModuleIds = [m2.id, m3.id];
      } else {
        dayModuleIds = [m3.id];
      }
    }

    // Safety constraint: Guarantee 1 to 3 tasks per day
    const uniqueIds = Array.from(new Set(dayModuleIds)).slice(0, 3);
    if (uniqueIds.length === 0) {
      uniqueIds.push(m0.id);
    }

    days.push({
      dayNumber: day,
      moduleIds: uniqueIds,
    });
  }

  return {
    days,
    rationale:
      "Plano progressivo baseado em reforço positivo, respeitando o ritmo e o bem-estar do cão.",
  };
}

/**
 * Calculates total estimated duration in minutes for a day's tasks.
 */
export function calculateDailyDuration(
  taskModuleIds: readonly string[],
  modulesById: ReadonlyMap<string, BehaviorModule>,
): number {
  return taskModuleIds.reduce((acc, id) => {
    const mod = modulesById.get(id);
    return acc + (mod?.estimatedDurationMinutes ?? 0);
  }, 0);
}
