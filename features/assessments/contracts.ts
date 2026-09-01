import { z } from "zod";

export const problemSlugSchema = z.enum([
  "cachorro-puxa-guia",
  "filhote-mordendo",
  "xixi-lugar-errado",
]);

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

export type ProblemSlug = z.infer<typeof problemSlugSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizDefinition = z.infer<typeof quizDefinitionSchema>;
export type AssessmentSnapshot = z.infer<typeof assessmentSnapshotSchema>;
export type QuizSession = z.infer<typeof quizSessionSchema>;

export type AssessmentApiError = {
  error: string;
  code:
    | "invalid_request"
    | "forbidden"
    | "unavailable"
    | "expired"
    | "rate_limited"
    | "incomplete";
};
