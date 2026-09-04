"use server";

import { revalidatePath } from "next/cache";
import { aiProvider } from "@/lib/ai/provider";
import { authLimiter, privateRateKey } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dispatchTransactionalEmail } from "@/features/emails/dispatcher";
import { readOwnedAssessment } from "@/features/assessments/data";
import {
  generatePlanSchema,
  planTaskStatusSchema,
  submitDailyCheckinInputSchema,
  type DailyCheckin,
  type GeneratePlanInput,
  type PlanAdaptation,
  type PlanMilestone,
  type PlannerType,
  type StructuredPlanOutput,
  type SubmitDailyCheckinInput,
} from "./contracts";
import {
  createPlanRecord,
  getPlanCheckins,
  getPlanMilestones,
  getPlanTaskWithPlan,
  getUserEntitlements,
  isDayUnlocked,
  loadPublishedModules,
  pausePlanDueToSafety,
  recordDailyCheckin,
  recordPlanAdaptation,
  recordPlanMilestones,
  updatePlanTaskStatus,
} from "./data";
import {
  buildDeterministicPlan,
  PLAN_ENGINE_VERSION,
  validateStructuredPlan,
} from "./engine";
import {
  calculateNewMilestones,
  determineAdaptation,
  evaluateCheckinSafety,
} from "./adaptation";

export type GeneratePlanActionResult =
  | {
      status: "success";
      planId: string;
      message: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function generatePlanAction(
  input: GeneratePlanInput,
): Promise<GeneratePlanActionResult> {
  const parsed = generatePlanSchema.safeParse(input);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Identificadores inválidos para geração de plano.",
    };
  }

  const client = await createSupabaseServerClient();
  if (!client) {
    return {
      status: "error",
      message: "Serviço temporariamente indisponível.",
    };
  }

  const session = await client.auth.getUser().catch(() => null);
  if (!session || !session.data.user) {
    return {
      status: "error",
      message: "Entre na sua conta para gerar o plano de treino.",
    };
  }
  const user = session.data.user;

  if (!authLimiter.allow(`plan:${privateRateKey(user.id)}`, 20, 60_000)) {
    return {
      status: "error",
      message: "Muitas solicitações recentes. Aguarde um minuto e tente novamente.",
    };
  }

  // 1. Verify assessment ownership and safety gate
  const assessment = await readOwnedAssessment(client, parsed.data.assessmentId);
  if (!assessment) {
    return {
      status: "error",
      message: "Avaliação não encontrada ou sem permissão de acesso.",
    };
  }

  // Non-negotiable product rule: Safety gate blocks plan generation for refer or block
  if (assessment.safety_status !== "continue") {
    return {
      status: "error",
      message:
        "Este caso necessita de acompanhamento presencial especializado. Não é seguro aplicar um plano automático sem avaliação clínica/comportamental.",
    };
  }

  // Verify and link dog ownership if needed
  if (assessment.dog_id !== parsed.data.dogId) {
    const { data: dog } = await client
      .from("dogs")
      .select("id")
      .eq("id", parsed.data.dogId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!dog) {
      return {
        status: "error",
        message: "Cão não encontrado na sua conta.",
      };
    }

    await client
      .from("assessments")
      .update({ dog_id: parsed.data.dogId })
      .eq("id", assessment.id);
  }

  // 2. Load published behavior modules from catalog
  const modules = await loadPublishedModules(client, assessment.problem_id);
  if (modules.length === 0) {
    return {
      status: "error",
      message: "Nenhum módulo aprovado disponível no catálogo para este comportamento.",
    };
  }

  // 3. Structured Generation: AI with strict anti-hallucination check or deterministic fallback
  let schedule: StructuredPlanOutput;
  let plannerType: PlannerType = "deterministic_fallback";
  let promptVersion: string = PLAN_ENGINE_VERSION;
  let modelVersion: string | undefined = undefined;

  try {
    const aiResult = await aiProvider.generatePlan({
      assessmentId: assessment.id,
      availableModules: modules,
      promptVersion: PLAN_ENGINE_VERSION,
    });

    if (aiResult.ok && validateStructuredPlan(aiResult.schedule, modules, 14)) {
      schedule = aiResult.schedule;
      plannerType = "llm_structured";
      promptVersion = aiResult.promptVersion;
      modelVersion = aiResult.modelVersion;
    } else {
      // Deterministic progression guarantees safety, 1-3 tasks/day and zero hallucinations
      schedule = buildDeterministicPlan(modules, 14);
    }
  } catch {
    schedule = buildDeterministicPlan(modules, 14);
  }

  // 4. Persist plan and schedule
  try {
    const plan = await createPlanRecord(client, {
      userId: user.id,
      dogId: parsed.data.dogId,
      assessmentId: assessment.id,
      problemId: assessment.problem_id,
      plannerType,
      promptVersion,
      modelVersion,
      schedule,
    });

    revalidatePath(`/app/caes/${parsed.data.dogId}`);
    return {
      status: "success",
      planId: plan.id,
      message: "Plano estruturado gerado com sucesso!",
    };
  } catch {
    return {
      status: "error",
      message: "Erro ao registrar o plano de treino. Tente novamente.",
    };
  }
}

export async function updatePlanTaskAction(input: {
  taskId: string;
  status: "pending" | "completed" | "skipped";
  dogId: string;
  notes?: string;
}): Promise<{ status: "success" } | { status: "error"; message: string }> {
  const statusParsed = planTaskStatusSchema.safeParse(input.status);
  if (!statusParsed.success) {
    return { status: "error", message: "Status de tarefa inválido." };
  }

  const client = await createSupabaseServerClient();
  if (!client) {
    return { status: "error", message: "Serviço indisponível." };
  }

  const session = await client.auth.getUser().catch(() => null);
  if (!session || !session.data.user) {
    return { status: "error", message: "Não autorizado." };
  }
  const user = session.data.user;

  // Server-side authorization and entitlement check
  const taskPlan = await getPlanTaskWithPlan(client, input.taskId);
  if (!taskPlan || taskPlan.plan.user_id !== user.id) {
    return { status: "error", message: "Tarefa não encontrada ou sem autorização." };
  }

  // Non-negotiable product rule: Day 1 is 100% free; Days 2+ require active entitlement
  const hasEntitlement = await getUserEntitlements(client, user.id);
  if (!isDayUnlocked(taskPlan.task.day_number, hasEntitlement)) {
    return {
      status: "error",
      message:
        "O Dia 1 é gratuito. Para praticar e registrar os dias seguintes, assine o plano completo.",
    };
  }

  try {
    await updatePlanTaskStatus(client, {
      taskId: input.taskId,
      status: statusParsed.data,
      notes: input.notes,
    });
    revalidatePath(`/app/caes/${input.dogId}`);
    revalidatePath("/app");
    return { status: "success" };
  } catch {
    return { status: "error", message: "Erro ao atualizar a tarefa." };
  }
}

export type SubmitDailyCheckinActionResult =
  | {
      status: "success";
      checkin: DailyCheckin;
      nextDay: number;
      requiresUpgrade: boolean;
      newMilestones?: PlanMilestone[];
      adaptation?: PlanAdaptation | null;
    }
  | {
      status: "safety_pause";
      message: string;
      recommendedAction: string;
    }
  | {
      status: "error";
      message: string;
    };

export async function submitDailyCheckinAction(
  input: SubmitDailyCheckinInput,
  dogId: string,
): Promise<SubmitDailyCheckinActionResult> {
  const parsed = submitDailyCheckinInputSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Dados de check-in inválidos." };
  }

  const client = await createSupabaseServerClient();
  if (!client) {
    return { status: "error", message: "Serviço indisponível." };
  }

  const session = await client.auth.getUser().catch(() => null);
  if (!session || !session.data.user) {
    return { status: "error", message: "Não autorizado." };
  }
  const user = session.data.user;

  // 1. Non-negotiable product rule: Safety gate on daily check-in
  const safety = evaluateCheckinSafety(parsed.data.safetyFlag);
  if (!safety.safe) {
    await pausePlanDueToSafety(client, parsed.data.planId);
    await recordPlanAdaptation(client, {
      planId: parsed.data.planId,
      userId: user.id,
      adaptationType: "safety_pause",
      reason: safety.reason!,
    });

    revalidatePath(`/app/caes/${dogId}`);
    revalidatePath("/app");

    return {
      status: "safety_pause",
      message: safety.reason!,
      recommendedAction: safety.recommendedAction!,
    };
  }

  // 2. Verify entitlement for this day (Day 1 is 100% free)
  const hasEntitlement = await getUserEntitlements(client, user.id);
  if (!isDayUnlocked(parsed.data.dayNumber, hasEntitlement)) {
    return {
      status: "error",
      message:
        "O Dia 1 é gratuito. Para registrar check-ins dos dias seguintes, assine o plano completo.",
    };
  }

  try {
    const checkin = await recordDailyCheckin(client, {
      planId: parsed.data.planId,
      dayNumber: parsed.data.dayNumber,
      userId: user.id,
      mood: parsed.data.mood,
      difficultyRating: parsed.data.difficultyRating,
      safetyFlag: parsed.data.safetyFlag,
      notes: parsed.data.notes,
    });

    // 3. Process milestones
    const allCheckins = await getPlanCheckins(client, parsed.data.planId);
    const existingMilestones = await getPlanMilestones(client, parsed.data.planId);
    const existingKeys = new Set(existingMilestones.map((m) => m.key));

    const milestonesToAward = calculateNewMilestones({
      dayNumber: parsed.data.dayNumber,
      mood: parsed.data.mood,
      totalCheckinsCount: allCheckins.length,
      existingKeys,
    });

    let newMilestones: PlanMilestone[] = [];
    if (milestonesToAward.length > 0) {
      newMilestones = await recordPlanMilestones(
        client,
        milestonesToAward.map((m) => ({
          planId: parsed.data.planId,
          userId: user.id,
          key: m.key,
          title: m.title,
          description: m.description,
        })),
      );

      if (user.email) {
        for (const m of newMilestones) {
          dispatchTransactionalEmail({
            recipientEmail: user.email,
            userId: user.id,
            templateKey: "milestone",
            idempotencyKey: `milestone:${user.id}:${parsed.data.planId}:${m.key}`,
            templateData: {
              milestoneTitle: m.title,
              milestoneDescription: m.description,
            },
          }).catch((err) => {
            console.error("[submitCheckinAction] Erro ao enviar email de milestone:", err);
          });
        }
      }
    }

    // 4. Process adaptation
    const adaptationDecision = determineAdaptation({
      mood: parsed.data.mood,
      difficultyRating: parsed.data.difficultyRating,
      recentCheckins: allCheckins,
    });

    let adaptation: PlanAdaptation | null = null;
    if (adaptationDecision) {
      adaptation = await recordPlanAdaptation(client, {
        planId: parsed.data.planId,
        userId: user.id,
        triggerCheckinId: checkin.id,
        adaptationType: adaptationDecision.adaptationType,
        reason: adaptationDecision.reason,
      });
    }

    revalidatePath(`/app/caes/${dogId}`);
    revalidatePath("/app");

    const isDayOneFree = parsed.data.dayNumber === 1 && !hasEntitlement;
    return {
      status: "success",
      checkin,
      nextDay: Math.min(parsed.data.dayNumber + 1, 14),
      requiresUpgrade: isDayOneFree,
      newMilestones,
      adaptation,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "incomplete_tasks") {
      return {
        status: "error",
        message: "Conclua todas as tarefas do dia antes de enviar o check-in.",
      };
    }
    return {
      status: "error",
      message: "Não foi possível registrar o check-in. Tente novamente.",
    };
  }
}
