import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assessmentAnswersSchema,
  assessmentSnapshotSchema,
  assessmentCompletionSchema,
  claimedAssessmentSchema,
  observableSummarySchema,
  problemSlugSchema,
  quizDefinitionSchema,
  quizOptionSchema,
  type AssessmentSnapshot,
  type ClaimedAssessment,
  type ObservableSummary,
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
      | "incomplete"
      | "not_claimable"
      | "already_claimed"
      | "unauthorized",
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
  if (message?.includes("not_claimable"))
    return new AssessmentDataError("not_claimable");
  if (message?.includes("already_claimed"))
    return new AssessmentDataError("already_claimed");
  if (message?.includes("claim_unauthorized"))
    return new AssessmentDataError("unauthorized");
  if (message?.includes("not_available"))
    return new AssessmentDataError("expired");
  return new AssessmentDataError("unavailable");
}

export async function loadPublishedQuiz(
  client: Client,
  slug: ProblemSlug,
  requestedVersion?: number,
): Promise<QuizDefinition> {
  const { data: problem, error: problemError } = await client
    .from("problems")
    .select("id, slug, title, quiz_version")
    .eq("slug", slug)
    .maybeSingle();
  if (problemError || !problem) throw new AssessmentDataError("unavailable");
  const version = requestedVersion ?? problem.quiz_version;
  if (!Number.isInteger(version) || version < 1)
    throw new AssessmentDataError("unavailable");
  const { data: questions, error: questionsError } = await client
    .from("quiz_questions")
    .select("key, prompt, help_text, options_json, order_index, version")
    .eq("problem_id", problem.id)
    .eq("version", version)
    .order("order_index");
  if (questionsError || !questions) throw new AssessmentDataError("unavailable");
  return quizDefinitionSchema.parse({
    problemSlug: problemSlugSchema.parse(problem.slug),
    problemTitle: problem.title,
    version,
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
    safetyStatus: "pending",
    safetyCodes: [],
    safetyRuleVersion: null,
    safetyEvaluatedAt: null,
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
    safetyStatus: row.safety_status,
    safetyCodes: row.safety_codes,
    safetyRuleVersion: row.safety_rule_version,
    safetyEvaluatedAt: row.safety_evaluated_at,
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
  return assessmentCompletionSchema.parse({
    status: row.assessment_status,
    safetyStatus: row.safety_status,
    safetyCodes: row.safety_codes,
    safetyRuleVersion: row.safety_rule_version,
    completedAt: row.completed_at,
  });
}

export async function claimAssessmentRecord(
  client: Client,
  input: {
    assessmentId: string;
    tokenHash: string;
    dogId?: string | null;
  },
): Promise<ClaimedAssessment> {
  const { data, error } = await client.rpc("claim_assessment", {
    p_assessment_id: input.assessmentId,
    p_token_hash: input.tokenHash,
    p_dog_id: input.dogId ?? null,
  });
  const row = data?.[0];
  if (error || !row) throw mapProviderError(error?.message);
  return claimedAssessmentSchema.parse({
    assessmentId: row.assessment_id,
    userId: row.user_id,
    dogId: row.dog_id,
    problemSlug: row.problem_slug,
    safetyStatus: row.safety_status,
    claimedAt: row.claimed_at,
  });
}

export async function readOwnedAssessment(
  client: Client,
  assessmentId: string,
) {
  const { data, error } = await client
    .from("assessments")
    .select(
      "id, user_id, anonymous_id, dog_id, problem_id, quiz_version, answers_json, safety_status, safety_rule_version, safety_evaluated_at, segment, status, started_at, completed_at",
    )
    .eq("id", assessmentId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function listDogAssessments(
  client: Client,
  dogId: string,
) {
  const { data, error } = await client
    .from("assessments")
    .select(
      "id, user_id, dog_id, problem_id, quiz_version, answers_json, safety_status, status, started_at, completed_at",
    )
    .eq("dog_id", dogId)
    .order("completed_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    dogId: row.dog_id,
    problemId: row.problem_id,
    safetyStatus: row.safety_status,
    completedAt: row.completed_at,
    answers: assessmentAnswersSchema.parse(row.answers_json),
  }));
}

export function buildObservableSummary(
  quiz: QuizDefinition,
  answers: Record<string, string>,
): ObservableSummary {
  const observations = quiz.questions
    .map((question) => {
      const selectedKey = answers[question.key];
      if (!selectedKey) return null;
      const option = question.options.find((opt) => opt.key === selectedKey);
      if (!option) return null;
      return {
        key: question.key,
        questionPrompt: question.prompt,
        answerLabel: option.label,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const strengths: string[] = [];
  const focusPoints: string[] = [];

  if (quiz.problemSlug === "cachorro-puxa-guia") {
    if (
      answers.reward_response === "easily" ||
      answers.reward_response === "sometimes"
    ) {
      strengths.push(
        "Responde com interesse a recompensas em ambientes com menor distração.",
      );
    }
    if (
      answers.distance_response === "recovers" ||
      answers.distance_response === "partial"
    ) {
      strengths.push(
        "Consegue desacelerar e recuperar foco quando a distância do estímulo é ampliada.",
      );
    }
    focusPoints.push(
      "Treinar pausas com guia frouxa antes mesmo de cruzar a porta de saída.",
    );
    focusPoints.push(
      "Aumentar a distância de cheiros, cães e pessoas antes que a tensão na guia se forme.",
    );
    focusPoints.push(
      "Consolidar o uso de peitoral confortável que não cause desconforto nem dê trancos.",
    );
  } else if (quiz.problemSlug === "filhote-mordendo") {
    if (
      answers.redirect_response === "accepts" ||
      answers.redirect_response === "brief"
    ) {
      strengths.push(
        "Apresenta interesse pelo brinquedo quando o redirecionamento é oferecido com calma.",
      );
    }
    if (answers.rest_pattern === "regular") {
      strengths.push(
        "Já conta com rotina de pausas e ambiente calmo para descanso ao longo do dia.",
      );
    }
    focusPoints.push(
      "Planejar momentos de sono profundo, essenciais para reduzir a agitação de filhotes.",
    );
    focusPoints.push(
      "Apresentar mordedores com texturas adequadas antes de movimentar mãos e roupas.",
    );
    focusPoints.push(
      "Parar a interação com calma ao sentir dentes, sem broncas ou estímulo corporal.",
    );
  } else if (quiz.problemSlug === "xixi-lugar-errado") {
    if (
      answers.success_reward === "immediate" ||
      answers.success_reward === "sometimes"
    ) {
      strengths.push(
        "Já existe a prática de valorizar e recompensar os acertos no local adequado.",
      );
    }
    if (answers.toilet_access === "easy") {
      strengths.push(
        "O cão tem acesso facilitado e sem barreiras até a área de higiene.",
      );
    }
    focusPoints.push(
      "Intensificar a supervisão nos momentos-chave: ao acordar, após refeições e brincadeiras.",
    );
    focusPoints.push(
      "Entregar uma recompensa de alto valor imediatamente após o término do xixi no local certo.",
    );
    focusPoints.push(
      "Limpeza enzimática neutra de eventuais acidentes, sem repreensões posteriores.",
    );
  }

  if (strengths.length === 0) {
    strengths.push(
      "Disposição do tutor para registrar a rotina e adotar métodos baseados em recompensa.",
    );
  }

  return observableSummarySchema.parse({
    problemSlug: quiz.problemSlug,
    problemTitle: quiz.problemTitle,
    observations,
    strengths,
    focusPoints,
  });
}

