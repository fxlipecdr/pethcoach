import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  dailyCheckinSchema,
  moduleSchema,
  planAdaptationSchema,
  planMilestoneSchema,
  planSchema,
  planTaskSchema,
  type BehaviorModule,
  type CheckinMood,
  type DailyCheckin,
  type DifficultyRating,
  type Plan,
  type PlanAdaptation,
  type PlanMilestone,
  type PlanTask,
  type PlannerType,
  type SafetyFlag,
  type StructuredPlanOutput,
} from "./contracts";

type Client = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export class PlanDataError extends Error {
  constructor(
    readonly reason:
      | "unavailable"
      | "not_found"
      | "unauthorized"
      | "unsafe_assessment"
      | "invalid_schedule"
      | "entitlement_required"
      | "incomplete_tasks",
  ) {
    super(reason);
  }
}

/**
 * Loads published behavior modules for a specific problem.
 */
export async function loadPublishedModules(
  client: Client,
  problemId: string,
): Promise<BehaviorModule[]> {
  const { data, error } = await client
    .from("modules")
    .select(
      "id, problem_id, slug, title, category, difficulty, estimated_duration_minutes, setup_instructions, steps, success_criteria, stop_conditions, tags, contraindications, version, status",
    )
    .eq("problem_id", problemId)
    .eq("status", "published")
    .order("difficulty")
    .order("estimated_duration_minutes");

  if (error || !data) {
    throw new PlanDataError("unavailable");
  }

  return data.map((row) =>
    moduleSchema.parse({
      id: row.id,
      problemId: row.problem_id,
      slug: row.slug,
      title: row.title,
      category: row.category,
      difficulty: row.difficulty,
      estimatedDurationMinutes: row.estimated_duration_minutes,
      setupInstructions: row.setup_instructions,
      steps: row.steps as string[],
      successCriteria: row.success_criteria,
      stopConditions: row.stop_conditions,
      tags: row.tags,
      contraindications: row.contraindications,
      version: row.version,
      status: row.status,
    }),
  );
}

/**
 * Loads a plan with all its tasks and associated module details.
 */
export async function getPlanWithTasks(
  client: Client,
  planId: string,
): Promise<Plan | null> {
  const { data: planRow, error: planError } = await client
    .from("plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle();

  if (planError || !planRow) return null;

  const { data: taskRows, error: taskError } = await client
    .from("plan_tasks")
    .select("*")
    .eq("plan_id", planId)
    .order("day_number")
    .order("order_index");

  if (taskError || !taskRows) return null;

  const moduleIds = Array.from(new Set(taskRows.map((t) => t.module_id)));
  const { data: moduleRows } = await client
    .from("modules")
    .select("*")
    .in("id", moduleIds);

  const modulesMap = new Map<string, BehaviorModule>();
  if (moduleRows) {
    for (const m of moduleRows) {
      modulesMap.set(
        m.id,
        moduleSchema.parse({
          id: m.id,
          problemId: m.problem_id,
          slug: m.slug,
          title: m.title,
          category: m.category,
          difficulty: m.difficulty,
          estimatedDurationMinutes: m.estimated_duration_minutes,
          setupInstructions: m.setup_instructions,
          steps: m.steps as string[],
          successCriteria: m.success_criteria,
          stopConditions: m.stop_conditions,
          tags: m.tags,
          contraindications: m.contraindications,
          version: m.version,
          status: m.status,
        }),
      );
    }
  }

  const tasks: PlanTask[] = taskRows.map((t) =>
    planTaskSchema.parse({
      id: t.id,
      planId: t.plan_id,
      dayNumber: t.day_number,
      orderIndex: t.order_index,
      moduleId: t.module_id,
      status: t.status,
      completedAt: t.completed_at,
      notes: t.notes,
      module: modulesMap.get(t.module_id),
    }),
  );

  return planSchema.parse({
    id: planRow.id,
    userId: planRow.user_id,
    dogId: planRow.dog_id,
    assessmentId: planRow.assessment_id,
    problemId: planRow.problem_id,
    status: planRow.status,
    currentDay: planRow.current_day,
    totalDays: planRow.total_days,
    plannerType: planRow.planner_type,
    promptVersion: planRow.prompt_version,
    modelVersion: planRow.model_version,
    createdAt: planRow.created_at,
    updatedAt: planRow.updated_at,
    tasks,
  });
}

/**
 * Returns the currently active plan for a specific dog, if any.
 */
export async function getDogActivePlan(
  client: Client,
  dogId: string,
): Promise<Plan | null> {
  const { data: planRow, error } = await client
    .from("plans")
    .select("id")
    .eq("dog_id", dogId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !planRow) return null;
  return getPlanWithTasks(client, planRow.id);
}

/**
 * Creates a plan record and its 14-day schedule of tasks.
 * Strictly verifies that the assessment has safety_status = 'continue'
 * and archives any previously active plan for this dog.
 */
export async function createPlanRecord(
  client: Client,
  input: {
    userId: string;
    dogId: string;
    assessmentId: string;
    problemId: string;
    plannerType: PlannerType;
    promptVersion?: string;
    modelVersion?: string;
    schedule: StructuredPlanOutput;
  },
): Promise<Plan> {
  // 1. Verify assessment safety status
  const { data: assessment, error: assessmentError } = await client
    .from("assessments")
    .select("id, safety_status, user_id, dog_id")
    .eq("id", input.assessmentId)
    .maybeSingle();

  if (assessmentError || !assessment) {
    throw new PlanDataError("not_found");
  }

  if (assessment.safety_status !== "continue") {
    throw new PlanDataError("unsafe_assessment");
  }

  // 2. Archive existing active plans for this dog
  await client
    .from("plans")
    .update({ status: "archived" })
    .eq("dog_id", input.dogId)
    .eq("status", "active");

  // 3. Create the new active plan
  const { data: planRow, error: planError } = await client
    .from("plans")
    .insert({
      user_id: input.userId,
      dog_id: input.dogId,
      assessment_id: input.assessmentId,
      problem_id: input.problemId,
      planner_type: input.plannerType,
      prompt_version: input.promptVersion ?? null,
      model_version: input.modelVersion ?? null,
      status: "active",
      current_day: 1,
      total_days: 14,
    })
    .select()
    .single();

  if (planError || !planRow) {
    throw new PlanDataError("unavailable");
  }

  // 4. Insert all tasks for the plan
  const tasksToInsert = input.schedule.days.flatMap((day) =>
    day.moduleIds.map((moduleId, idx) => ({
      plan_id: planRow.id,
      day_number: day.dayNumber,
      order_index: idx + 1,
      module_id: moduleId,
      status: "pending" as const,
    })),
  );

  const { error: tasksError } = await client
    .from("plan_tasks")
    .insert(tasksToInsert);

  if (tasksError) {
    // If inserting tasks failed, rollback plan to avoid orphaned empty plan
    await client.from("plans").delete().eq("id", planRow.id);
    throw new PlanDataError("unavailable");
  }

  const hydrated = await getPlanWithTasks(client, planRow.id);
  if (!hydrated) {
    throw new PlanDataError("unavailable");
  }
  return hydrated;
}

/**
 * Updates a plan task status (e.g. mark as completed).
 */
export async function updatePlanTaskStatus(
  client: Client,
  input: {
    taskId: string;
    status: "pending" | "completed" | "skipped";
    notes?: string;
  },
): Promise<void> {
  const { error } = await client
    .from("plan_tasks")
    .update({
      status: input.status,
      completed_at: input.status === "completed" ? new Date().toISOString() : null,
      notes: input.notes ?? null,
    })
    .eq("id", input.taskId);

  if (error) {
    throw new PlanDataError("unavailable");
  }
}

/**
 * Determines whether a specific training day is unlocked for a user.
 * Day 1 is always 100% free; Days 2+ require active entitlement.
 */
export function isDayUnlocked(dayNumber: number, hasEntitlement: boolean): boolean {
  if (dayNumber <= 1) return true;
  return Boolean(hasEntitlement);
}

/**
 * Checks if a user has an active entitlement (full program or subscription).
 */
export async function getUserEntitlements(
  client: Client,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("entitlements")
    .select("id, status, expires_at")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error || !data || data.length === 0) return false;

  const now = new Date();
  return data.some((item) => {
    if (!item.expires_at) return true;
    return new Date(item.expires_at) > now;
  });
}

/**
 * Retrieves a plan task along with its plan and authorization metadata.
 */
export async function getPlanTaskWithPlan(
  client: Client,
  taskId: string,
): Promise<{
  task: {
    id: string;
    plan_id: string;
    day_number: number;
    status: "pending" | "completed" | "skipped";
  };
  plan: {
    id: string;
    user_id: string;
    current_day: number;
    total_days: number;
  };
} | null> {
  const { data: task, error: taskError } = await client
    .from("plan_tasks")
    .select("id, plan_id, day_number, status")
    .eq("id", taskId)
    .maybeSingle();

  if (taskError || !task) return null;

  const { data: plan, error: planError } = await client
    .from("plans")
    .select("id, user_id, current_day, total_days")
    .eq("id", task.plan_id)
    .maybeSingle();

  if (planError || !plan) return null;

  return { task, plan };
}

/**
 * Lists all daily check-ins for a specific plan.
 */
export async function getPlanCheckins(
  client: Client,
  planId: string,
): Promise<DailyCheckin[]> {
  const { data, error } = await client
    .from("daily_checkins")
    .select("*")
    .eq("plan_id", planId)
    .order("day_number", { ascending: true });

  if (error || !data) return [];

  return data.map((row) =>
    dailyCheckinSchema.parse({
      id: row.id,
      planId: row.plan_id,
      dayNumber: row.day_number,
      userId: row.user_id,
      mood: row.mood,
      notes: row.notes,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );
}

/**
 * Records a daily check-in and conditionally advances current_day.
 */
export async function recordDailyCheckin(
  client: Client,
  input: {
    planId: string;
    dayNumber: number;
    userId: string;
    mood: CheckinMood;
    difficultyRating?: DifficultyRating;
    safetyFlag?: SafetyFlag;
    notes?: string;
  },
): Promise<DailyCheckin> {
  // 1. Verify that all tasks for this day are completed
  const { data: dayTasks, error: tasksError } = await client
    .from("plan_tasks")
    .select("id, status")
    .eq("plan_id", input.planId)
    .eq("day_number", input.dayNumber);

  if (tasksError || !dayTasks || dayTasks.length === 0) {
    throw new PlanDataError("not_found");
  }

  const allDone = dayTasks.every((t) => t.status === "completed");
  if (!allDone) {
    throw new PlanDataError("incomplete_tasks");
  }

  // 2. Upsert checkin record with P9 difficulty and safety metrics
  const { data: checkinRow, error: checkinError } = await client
    .from("daily_checkins")
    .upsert(
      {
        plan_id: input.planId,
        day_number: input.dayNumber,
        user_id: input.userId,
        mood: input.mood,
        difficulty_rating: input.difficultyRating ?? "adequate",
        safety_flag: input.safetyFlag ?? "none",
        notes: input.notes ?? null,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "plan_id,day_number" },
    )
    .select()
    .single();

  if (checkinError || !checkinRow) {
    throw new PlanDataError("unavailable");
  }

  // 3. Advance plan's current_day if dayNumber >= current_day
  const { data: currentPlan } = await client
    .from("plans")
    .select("current_day, total_days")
    .eq("id", input.planId)
    .single();

  if (currentPlan && input.dayNumber >= currentPlan.current_day) {
    const nextDay = Math.min(input.dayNumber + 1, currentPlan.total_days);
    await client
      .from("plans")
      .update({ current_day: nextDay })
      .eq("id", input.planId);
  }

  return dailyCheckinSchema.parse({
    id: checkinRow.id,
    planId: checkinRow.plan_id,
    dayNumber: checkinRow.day_number,
    userId: checkinRow.user_id,
    mood: checkinRow.mood,
    difficultyRating: checkinRow.difficulty_rating,
    safetyFlag: checkinRow.safety_flag,
    notes: checkinRow.notes,
    completedAt: checkinRow.completed_at,
    createdAt: checkinRow.created_at,
    updatedAt: checkinRow.updated_at,
  });
}

/**
 * Retrieves all earned milestones for a specific plan.
 */
export async function getPlanMilestones(
  client: Client,
  planId: string,
): Promise<PlanMilestone[]> {
  const { data, error } = await client
    .from("plan_milestones")
    .select("*")
    .eq("plan_id", planId)
    .order("unlocked_at", { ascending: true });

  if (error || !data) return [];

  return data.map((row) =>
    planMilestoneSchema.parse({
      id: row.id,
      planId: row.plan_id,
      userId: row.user_id,
      key: row.key,
      title: row.title,
      description: row.description,
      unlockedAt: row.unlocked_at,
      createdAt: row.created_at,
    }),
  );
}

/**
 * Retrieves the audit trail of adaptations for a plan.
 */
export async function getPlanAdaptations(
  client: Client,
  planId: string,
): Promise<PlanAdaptation[]> {
  const { data, error } = await client
    .from("plan_adaptations")
    .select("*")
    .eq("plan_id", planId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) =>
    planAdaptationSchema.parse({
      id: row.id,
      planId: row.plan_id,
      userId: row.user_id,
      triggerCheckinId: row.trigger_checkin_id,
      adaptationType: row.adaptation_type,
      reason: row.reason,
      createdAt: row.created_at,
    }),
  );
}

/**
 * Idempotently records newly achieved milestones for a plan.
 */
export async function recordPlanMilestones(
  client: Client,
  milestones: Array<{
    planId: string;
    userId: string;
    key: PlanMilestone["key"];
    title: string;
    description: string;
  }>,
): Promise<PlanMilestone[]> {
  if (milestones.length === 0) return [];

  const rowsToInsert = milestones.map((m) => ({
    plan_id: m.planId,
    user_id: m.userId,
    key: m.key,
    title: m.title,
    description: m.description,
  }));

  const { data, error } = await client
    .from("plan_milestones")
    .upsert(rowsToInsert, { onConflict: "plan_id,key" })
    .select();

  if (error || !data) return [];

  return data.map((row) =>
    planMilestoneSchema.parse({
      id: row.id,
      planId: row.plan_id,
      userId: row.user_id,
      key: row.key,
      title: row.title,
      description: row.description,
      unlockedAt: row.unlocked_at,
      createdAt: row.created_at,
    }),
  );
}

/**
 * Records a plan adaptation event (consolidation, progression, or safety pause).
 */
export async function recordPlanAdaptation(
  client: Client,
  adaptation: {
    planId: string;
    userId: string;
    triggerCheckinId?: string;
    adaptationType: PlanAdaptation["adaptationType"];
    reason: string;
  },
): Promise<PlanAdaptation | null> {
  const { data, error } = await client
    .from("plan_adaptations")
    .insert({
      plan_id: adaptation.planId,
      user_id: adaptation.userId,
      trigger_checkin_id: adaptation.triggerCheckinId ?? null,
      adaptation_type: adaptation.adaptationType,
      reason: adaptation.reason,
    })
    .select()
    .single();

  if (error || !data) return null;

  return planAdaptationSchema.parse({
    id: data.id,
    planId: data.plan_id,
    userId: data.user_id,
    triggerCheckinId: data.trigger_checkin_id,
    adaptationType: data.adaptation_type,
    reason: data.reason,
    createdAt: data.created_at,
  });
}

/**
 * Pauses a plan due to safety flags raised during a check-in session.
 */
export async function pausePlanDueToSafety(
  client: Client,
  planId: string,
): Promise<void> {
  await client
    .from("plans")
    .update({ status: "paused" })
    .eq("id", planId);
}

/**
 * Returns all active plans for a user, along with dog name and hydrated tasks.
 */
export async function getUserActivePlans(
  client: Client,
  userId: string,
): Promise<Array<Plan & { dogName: string }>> {
  const { data: planRows, error } = await client
    .from("plans")
    .select("id, dog_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !planRows || planRows.length === 0) return [];

  const dogIds = planRows.map((p) => p.dog_id);
  const { data: dogs } = await client
    .from("dogs")
    .select("id, name")
    .in("id", dogIds);

  const dogsMap = new Map<string, string>();
  dogs?.forEach((d) => dogsMap.set(d.id, d.name));

  const plansWithTasks = await Promise.all(
    planRows.map(async (p) => {
      const plan = await getPlanWithTasks(client, p.id);
      if (!plan) return null;
      return {
        ...plan,
        dogName: dogsMap.get(p.dog_id) || "Seu cão",
      };
    }),
  );

  return plansWithTasks.filter(
    (p): p is Plan & { dogName: string } => p !== null,
  );
}


/**
 * Primeiro exercício do programa, para entregar valor antes de pedir conta.
 *
 * Até aqui, quem terminava o quiz recebia um resumo e um pedido de cadastro —
 * nenhum exercício. Dez perguntas respondidas e nada praticável de volta, o
 * que faz o tutor sair sem nunca ver o produto funcionando.
 *
 * O Dia 1 é gratuito por definição do produto, e `modules` é legível por
 * visitante anônimo quando publicado. Então dá para mostrar o exercício ali
 * mesmo, e só depois convidar a salvar o plano.
 *
 * Devolve `null` em qualquer falha: a página de resultado não pode quebrar por
 * causa de um bloco de bônus.
 */
export async function loadFirstDayModule(
  client: Client,
  problemSlug: string,
): Promise<BehaviorModule | null> {
  try {
    const { data: problema } = await client
      .from("problems")
      .select("id")
      .eq("slug", problemSlug)
      .eq("status", "published")
      .maybeSingle();
    if (!problema) return null;

    const modulos = await loadPublishedModules(client, problema.id);
    // `loadPublishedModules` já ordena por dificuldade e duração: o primeiro é
    // o exercício de entrada, que é exatamente o Dia 1 do plano determinístico.
    return modulos[0] ?? null;
  } catch {
    return null;
  }
}
