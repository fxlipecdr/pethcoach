import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assessmentAnswersSchema,
  assessmentSnapshotSchema,
  problemSlugSchema,
  quizDefinitionSchema,
  quizOptionSchema,
  type AssessmentSnapshot,
  type ProblemSlug,
  type QuizDefinition,
} from "./contracts";

type Client = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

export class AssessmentDataError extends Error {
  constructor(
    readonly reason:
      | "unavailable"
      | "expired"
      | "rate_limited"
      | "invalid_answer"
      | "incomplete",
  ) {
    super(reason);
  }
}

export async function assessmentRuntime() {
  const secret = getServerEnv().ASSESSMENT_TOKEN_SECRET;
  const client = await createSupabaseServerClient();
  return secret && client ? { client, secret } : null;
}

function mapProviderError(message: string | undefined) {
  if (message?.includes("rate_limited") || message?.includes("request_rejected"))
    return new AssessmentDataError("rate_limited");
  if (message?.includes("answer_invalid"))
    return new AssessmentDataError("invalid_answer");
  if (message?.includes("incomplete"))
    return new AssessmentDataError("incomplete");
  if (message?.includes("not_available"))
    return new AssessmentDataError("expired");
  return new AssessmentDataError("unavailable");
}

export async function loadPublishedQuiz(
  client: Client,
  slug: ProblemSlug,
): Promise<QuizDefinition> {
  const { data: problem, error: problemError } = await client
    .from("problems")
    .select("id, slug, title, quiz_version")
    .eq("slug", slug)
    .maybeSingle();
  if (problemError || !problem) throw new AssessmentDataError("unavailable");
  const { data: questions, error: questionsError } = await client
    .from("quiz_questions")
    .select("key, prompt, help_text, options_json, order_index, version")
    .eq("problem_id", problem.id)
    .eq("version", problem.quiz_version)
    .order("order_index");
  if (questionsError || !questions) throw new AssessmentDataError("unavailable");
  return quizDefinitionSchema.parse({
    problemSlug: problemSlugSchema.parse(problem.slug),
    problemTitle: problem.title,
    version: problem.quiz_version,
    questions: questions.map((question) => ({
      key: question.key,
      prompt: question.prompt,
      helpText: question.help_text,
      order: question.order_index,
      options: quizOptionSchema.array().parse(question.options_json),
    })),
  });
}

export async function createAssessmentRecord(
  client: Client,
  input: {
    assessmentId: string;
    anonymousId: string;
    problemSlug: ProblemSlug;
    tokenHash: string;
    tokenExpiresAt: string;
    rateKey: string;
  },
): Promise<AssessmentSnapshot> {
  const { data, error } = await client.rpc("create_anonymous_assessment", {
    p_assessment_id: input.assessmentId,
    p_anonymous_id: input.anonymousId,
    p_problem_slug: input.problemSlug,
    p_token_hash: input.tokenHash,
    p_token_expires_at: input.tokenExpiresAt,
    p_rate_key: input.rateKey,
  });
  const row = data?.[0];
  if (error || !row) throw mapProviderError(error?.message);
  return assessmentSnapshotSchema.parse({
    assessmentId: row.assessment_id,
    problemSlug: row.problem_slug,
    version: row.quiz_version,
    answers: {},
    status: "in_progress",
    startedAt: row.started_at,
    completedAt: null,
  });
}

export async function readAssessmentRecord(
  client: Client,
  assessmentId: string,
  tokenHash: string,
): Promise<AssessmentSnapshot> {
  const { data, error } = await client.rpc("read_anonymous_assessment", {
    p_assessment_id: assessmentId,
    p_token_hash: tokenHash,
  });
  const row = data?.[0];
  if (error || !row) throw new AssessmentDataError("expired");
  return assessmentSnapshotSchema.parse({
    assessmentId: row.assessment_id,
    problemSlug: row.problem_slug,
    version: row.quiz_version,
    answers: assessmentAnswersSchema.parse(row.answers_json),
    status: row.assessment_status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  });
}

export async function updateAssessmentAnswer(
  client: Client,
  input: {
    assessmentId: string;
    tokenHash: string;
    questionKey: string;
    optionKey: string;
  },
) {
  const { data, error } = await client.rpc(
    "update_anonymous_assessment_answer",
    {
      p_assessment_id: input.assessmentId,
      p_token_hash: input.tokenHash,
      p_question_key: input.questionKey,
      p_option_key: input.optionKey,
    },
  );
  const row = data?.[0];
  if (error || !row) throw mapProviderError(error?.message);
  return assessmentAnswersSchema.parse(row.answers_json);
}

export async function completeAssessmentRecord(
  client: Client,
  assessmentId: string,
  tokenHash: string,
) {
  const { data, error } = await client.rpc("complete_anonymous_assessment", {
    p_assessment_id: assessmentId,
    p_token_hash: tokenHash,
  });
  const row = data?.[0];
  if (error || !row) throw mapProviderError(error?.message);
  return {
    status: "completed" as const,
    completedAt: row.completed_at,
  };
}
