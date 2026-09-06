import { z } from "zod";
import { problemSlugs } from "@/content/problems/slugs";
import {
  safetyCodeSchema,
  safetyOutcomeSchema,
} from "@/features/safety/contracts";

/**
 * Slugs aceitos no quiz, derivados do catálogo de landings.
 *
 * Já foi uma lista fixa aqui, e o custo apareceu ao adicionar programas: as
 * landings novas subiam, o banco tinha as perguntas, e `/quiz/<slug>` devolvia
 * 404 porque este enum não sabia dos slugs. Derivar da mesma fonte que gera as
 * páginas elimina a divergência: acrescentar um problema em `content/problems`
 * passa a bastar.
 */
export const problemSlugSchema = z.enum(problemSlugs);

export const quizOptionSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]*$/).max(80),
    label: z.string().trim().min(1).max(180),
    description: z.string().trim().min(1).max(240).optional(),
  })
  .strict();

export const quizQuestionSchema = z
  .object({
    key: z.string().regex(/^[a-z][a-z0-9_]*$/).max(80),
    prompt: z.string().trim().min(1).max(240),
    helpText: z.string().trim().min(1).max(300).nullable(),
    order: z.number().int().min(1).max(20),
    options: z.array(quizOptionSchema).min(2).max(8),
  })
  .strict();

export const quizDefinitionSchema = z
  .object({
    problemSlug: problemSlugSchema,
    problemTitle: z.string().trim().min(1).max(120),
    version: z.number().int().positive(),
    questions: z.array(quizQuestionSchema).min(6).max(10),
  })
  .strict();

export const createAssessmentSchema = z
  .object({
    problemSlug: problemSlugSchema,
    anonymousId: z.uuid(),
  })
  .strict();

export const answerAssessmentSchema = z
  .object({
    questionKey: z.string().regex(/^[a-z][a-z0-9_]*$/).max(80),
    optionKey: z.string().regex(/^[a-z][a-z0-9_]*$/).max(80),
  })
  .strict();

export const assessmentIdSchema = z.uuid();
export const assessmentAnswersSchema = z.record(
  z.string().regex(/^[a-z][a-z0-9_]*$/).max(80),
  z.string().regex(/^[a-z][a-z0-9_]*$/).max(80),
);

export const assessmentSnapshotSchema = z
  .object({
    assessmentId: assessmentIdSchema,
    problemSlug: problemSlugSchema,
    version: z.number().int().positive(),
    answers: assessmentAnswersSchema,
    status: z.enum(["in_progress", "completed"]),
    safetyStatus: safetyOutcomeSchema,
    safetyCodes: z.array(safetyCodeSchema).max(10),
    safetyRuleVersion: z.literal("p5-v1").nullable(),
    safetyEvaluatedAt: z.iso.datetime({ offset: true }).nullable(),
    startedAt: z.iso.datetime({ offset: true }),
    completedAt: z.iso.datetime({ offset: true }).nullable(),
  })
  .strict();

export const quizSessionSchema = z
  .object({
    assessment: assessmentSnapshotSchema,
    quiz: quizDefinitionSchema,
  })
  .strict();

export const assessmentCompletionSchema = z
  .object({
    status: z.literal("completed"),
    safetyStatus: safetyOutcomeSchema.exclude(["pending"]),
    safetyCodes: z.array(safetyCodeSchema).min(1).max(10),
    safetyRuleVersion: z.literal("p5-v1"),
    completedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const claimAssessmentSchema = z
  .object({
    assessmentId: assessmentIdSchema,
    dogId: z.uuid().optional().nullable(),
  })
  .strict();

export const claimedAssessmentSchema = z
  .object({
    assessmentId: assessmentIdSchema,
    userId: z.uuid(),
    dogId: z.uuid().nullable(),
    problemSlug: problemSlugSchema,
    safetyStatus: z.literal("continue"),
    claimedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const observableItemSchema = z
  .object({
    key: z.string(),
    questionPrompt: z.string(),
    answerLabel: z.string(),
  })
  .strict();

export const observableSummarySchema = z
  .object({
    problemSlug: problemSlugSchema,
    problemTitle: z.string(),
    observations: z.array(observableItemSchema),
    strengths: z.array(z.string()),
    focusPoints: z.array(z.string()),
  })
  .strict();

export type ProblemSlug = z.infer<typeof problemSlugSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizDefinition = z.infer<typeof quizDefinitionSchema>;
export type AssessmentSnapshot = z.infer<typeof assessmentSnapshotSchema>;
export type QuizSession = z.infer<typeof quizSessionSchema>;
export type ClaimAssessmentInput = z.infer<typeof claimAssessmentSchema>;
export type ClaimedAssessment = z.infer<typeof claimedAssessmentSchema>;
export type ObservableItem = z.infer<typeof observableItemSchema>;
export type ObservableSummary = z.infer<typeof observableSummarySchema>;

export type AssessmentApiError = {
  error: string;
  code:
    | "invalid_request"
    | "forbidden"
    | "unavailable"
    | "expired"
    | "rate_limited"
    | "incomplete"
    | "not_claimable"
    | "already_claimed";
};
