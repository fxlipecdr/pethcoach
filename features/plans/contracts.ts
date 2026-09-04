import { z } from "zod";

export const moduleDifficultySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
]);
export type ModuleDifficulty = z.infer<typeof moduleDifficultySchema>;

export const moduleStatusSchema = z.enum([
  "draft",
  "reviewed",
  "published",
  "archived",
]);
export type ModuleStatus = z.infer<typeof moduleStatusSchema>;

export const moduleSchema = z
  .object({
    id: z.uuid(),
    problemId: z.uuid(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80),
    title: z.string().trim().min(1).max(140),
    category: z.string().trim().min(1).max(60),
    difficulty: moduleDifficultySchema,
    estimatedDurationMinutes: z.number().int().min(2).max(15),
    setupInstructions: z.string().trim().min(1),
    steps: z.array(z.string().trim().min(1)).min(1).max(6),
    successCriteria: z.string().trim().min(1),
    stopConditions: z.string().trim().min(1),
    tags: z.array(z.string()).default([]),
    contraindications: z.array(z.string()).default([]),
    version: z.number().int().positive().default(1),
    status: moduleStatusSchema.default("draft"),
  })
  .strict();
export type BehaviorModule = z.infer<typeof moduleSchema>;

export const planStatusSchema = z.enum([
  "active",
  "completed",
  "paused",
  "archived",
]);
export type PlanStatus = z.infer<typeof planStatusSchema>;

export const plannerTypeSchema = z.enum([
  "deterministic_fallback",
  "llm_structured",
]);
export type PlannerType = z.infer<typeof plannerTypeSchema>;

export const planTaskStatusSchema = z.enum(["pending", "completed", "skipped"]);
export type PlanTaskStatus = z.infer<typeof planTaskStatusSchema>;

export const planTaskSchema = z
  .object({
    id: z.uuid(),
    planId: z.uuid(),
    dayNumber: z.number().int().min(1).max(30),
    orderIndex: z.number().int().min(1).max(3),
    moduleId: z.uuid(),
    status: planTaskStatusSchema.default("pending"),
    completedAt: z.iso.datetime({ offset: true }).nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
    module: moduleSchema.optional(),
  })
  .strict();
export type PlanTask = z.infer<typeof planTaskSchema>;

export const planSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    dogId: z.uuid(),
    assessmentId: z.uuid(),
    problemId: z.uuid(),
    status: planStatusSchema.default("active"),
    currentDay: z.number().int().min(1).max(30).default(1),
    totalDays: z
      .union([z.literal(7), z.literal(14), z.literal(21), z.literal(30)])
      .default(14),
    plannerType: plannerTypeSchema,
    promptVersion: z.string().max(40).nullable().optional(),
    modelVersion: z.string().max(60).nullable().optional(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
    tasks: z.array(planTaskSchema).optional(),
  })
  .strict();
export type Plan = z.infer<typeof planSchema>;

export const generatePlanSchema = z
  .object({
    assessmentId: z.uuid(),
    dogId: z.uuid(),
  })
  .strict();
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;

export const structuredDailyPlanSchema = z
  .object({
    dayNumber: z.number().int().min(1).max(30),
    moduleIds: z.array(z.uuid()).min(1).max(3),
  })
  .strict();
export type StructuredDailyPlan = z.infer<typeof structuredDailyPlanSchema>;

export const structuredPlanOutputSchema = z
  .object({
    days: z.array(structuredDailyPlanSchema).length(14),
    rationale: z.string().trim().max(500).optional(),
  })
  .strict();
export type StructuredPlanOutput = z.infer<typeof structuredPlanOutputSchema>;

// P8: Entitlements and Daily Check-ins
export const entitlementScopeSchema = z.enum([
  "full_program",
  "subscription",
]);
export type EntitlementScope = z.infer<typeof entitlementScopeSchema>;

export const entitlementStatusSchema = z.enum([
  "active",
  "past_due",
  "canceled",
  "expired",
]);
export type EntitlementStatus = z.infer<typeof entitlementStatusSchema>;

export const entitlementSchema = z
  .object({
    id: z.uuid(),
    userId: z.uuid(),
    scope: entitlementScopeSchema,
    status: entitlementStatusSchema,
    startsAt: z.iso.datetime({ offset: true }),
    expiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type Entitlement = z.infer<typeof entitlementSchema>;

export const checkinMoodSchema = z.enum([
  "calm",
  "moderate",
  "needed_pause",
]);
export type CheckinMood = z.infer<typeof checkinMoodSchema>;

export const difficultyRatingSchema = z.enum([
  "easy",
  "adequate",
  "challenging",
]);
export type DifficultyRating = z.infer<typeof difficultyRatingSchema>;

export const safetyFlagSchema = z.enum([
  "none",
  "pain_suspected",
  "distress_extreme",
  "aggression_risk",
]);
export type SafetyFlag = z.infer<typeof safetyFlagSchema>;

export const dailyCheckinSchema = z
  .object({
    id: z.uuid(),
    planId: z.uuid(),
    dayNumber: z.number().int().min(1).max(30),
    userId: z.uuid(),
    mood: checkinMoodSchema,
    difficultyRating: difficultyRatingSchema.default("adequate"),
    safetyFlag: safetyFlagSchema.default("none"),
    notes: z.string().max(500).nullable().optional(),
    completedAt: z.iso.datetime({ offset: true }),
    createdAt: z.iso.datetime({ offset: true }),
    updatedAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type DailyCheckin = z.infer<typeof dailyCheckinSchema>;

export const submitDailyCheckinInputSchema = z
  .object({
    planId: z.uuid(),
    dayNumber: z.number().int().min(1).max(30),
    mood: checkinMoodSchema,
    difficultyRating: difficultyRatingSchema.default("adequate"),
    safetyFlag: safetyFlagSchema.default("none"),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();
export type SubmitDailyCheckinInput = z.infer<
  typeof submitDailyCheckinInputSchema
>;

// P9: Milestones & Adaptations
export const milestoneKeySchema = z.enum([
  "first_training_done",
  "pause_honored",
  "constancia_serena",
  "week_one_done",
  "program_completed",
]);
export type MilestoneKey = z.infer<typeof milestoneKeySchema>;

export const planMilestoneSchema = z
  .object({
    id: z.uuid(),
    planId: z.uuid(),
    userId: z.uuid(),
    key: milestoneKeySchema,
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().min(1).max(300),
    unlockedAt: z.iso.datetime({ offset: true }),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type PlanMilestone = z.infer<typeof planMilestoneSchema>;

export const adaptationTypeSchema = z.enum([
  "consolidation",
  "repeat_day",
  "progression",
  "safety_pause",
]);
export type AdaptationType = z.infer<typeof adaptationTypeSchema>;

export const planAdaptationSchema = z
  .object({
    id: z.uuid(),
    planId: z.uuid(),
    userId: z.uuid(),
    triggerCheckinId: z.uuid().nullable().optional(),
    adaptationType: adaptationTypeSchema,
    reason: z.string().trim().min(1).max(500),
    createdAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export type PlanAdaptation = z.infer<typeof planAdaptationSchema>;


