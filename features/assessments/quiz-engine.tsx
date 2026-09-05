"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import { analytics } from "@/lib/posthog/client";
import {
  readAnonymousContext,
  saveAnonymousContext,
  type AnonymousContext,
} from "@/features/onboarding/local-context";
import { Button } from "@/components/ui/button";
import { ChoiceCard } from "@/components/ui/choice-card";
import { Feedback } from "@/components/ui/feedback";
import { Badge, Card, Progress } from "@/components/ui/primitives";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import {
  assessmentAnswersSchema,
  assessmentCompletionSchema,
  quizSessionSchema,
  type AssessmentSnapshot,
  type ProblemSlug,
  type QuizDefinition,
  type QuizSession,
} from "./contracts";

type Phase = "intro" | "loading" | "active" | "completing" | "error";
type Answers = AssessmentSnapshot["answers"];

function errorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  )
    return value.error;
  return "Não foi possível continuar agora. Tente novamente.";
}

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...init.headers }
      : init?.headers,
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(body));
  return body;
}

export function QuizEngine({
  problem,
  available,
}: {
  problem: { slug: ProblemSlug; title: string };
  available: boolean;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [quiz, setQuiz] = useState<QuizDefinition | null>(null);
  const [assessment, setAssessment] = useState<AssessmentSnapshot | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [message, setMessage] = useState<string>();

  const question = quiz?.questions[current];
  const progress = quiz ? ((current + 1) / quiz.questions.length) * 100 : 0;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  function localContext(): AnonymousContext {
    const existing = readAnonymousContext(window.localStorage);
    return (
      existing ?? {
        version: 1,
        anonymousId: crypto.randomUUID(),
        updatedAt: Date.now(),
      }
    );
  }

  function persistAssessment(id: string, step: number) {
    const context = localContext();
    saveAnonymousContext(window.localStorage, {
      ...context,
      problem: problem.slug,
      updatedAt: Date.now(),
      assessment: { id, problem: problem.slug, currentQuestion: step },
    });
  }

  function clearAssessment() {
    const context = localContext();
    saveAnonymousContext(window.localStorage, {
      version: 1,
      anonymousId: context.anonymousId,
      updatedAt: Date.now(),
      problem: problem.slug,
    });
  }

  function applySession(session: QuizSession, preferredStep?: number) {
    if (session.assessment.status === "completed") {
      router.replace(`/resultado/${session.assessment.assessmentId}`);
      return;
    }
    const firstMissing = session.quiz.questions.findIndex(
      (item) => !session.assessment.answers[item.key],
    );
    const step = Math.min(
      Math.max(preferredStep ?? (firstMissing < 0 ? 0 : firstMissing), 0),
      session.quiz.questions.length - 1,
    );
    setQuiz(session.quiz);
    setAssessment(session.assessment);
    setAnswers(session.assessment.answers);
    setCurrent(step);
    setSelected(session.assessment.answers[session.quiz.questions[step]!.key]);
    persistAssessment(session.assessment.assessmentId, step);
    setPhase("active");
  }

  useEffect(() => {
    if (!available) return;
    const context = readAnonymousContext(window.localStorage);
    if (!context?.assessment || context.assessment.problem !== problem.slug)
      return;
    let active = true;
    void jsonRequest(`/api/assessments/${context.assessment.id}`)
      .then((body) => {
        if (!active) return;
        const parsed = quizSessionSchema.safeParse(body);
        if (!parsed.success) throw new Error();
        applySession(parsed.data, context.assessment?.currentQuestion);
      })
      .catch(() => {
        if (!active) return;
        clearAssessment();
        setMessage(
          "Seu quiz anterior não está mais disponível. Você pode começar novamente.",
        );
        setPhase("intro");
      });
    return () => {
      active = false;
    };
    // Resume runs once for the route's problem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available, problem.slug]);

  async function start() {
    setMessage(undefined);
    setPhase("loading");
    const context = localContext();
    try {
      const body = await jsonRequest("/api/assessments", {
        method: "POST",
        body: JSON.stringify({
          problemSlug: problem.slug,
          anonymousId: context.anonymousId,
        }),
      });
      const session = quizSessionSchema.parse(body);
      await analytics.capture("quiz_started", {
        problem_slug: problem.slug,
        anonymous_id: context.anonymousId,
      });
      applySession(session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errorMessage(error));
      setPhase("error");
    }
  }

  function goBack() {
    if (!assessment || !quiz || current === 0) return;
    const step = current - 1;
    setCurrent(step);
    setSelected(answers[quiz.questions[step]!.key]);
    persistAssessment(assessment.assessmentId, step);
    setMessage(undefined);
  }

  async function continueQuiz() {
    if (!assessment || !quiz || !question || !selected) return;
    setMessage(undefined);
    setPhase(current === quiz.questions.length - 1 ? "completing" : "loading");
    try {
      const body = await jsonRequest(
        `/api/assessments/${assessment.assessmentId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            questionKey: question.key,
            optionKey: selected,
          }),
        },
      );
      const nextAnswers = assessmentAnswersSchema.parse(
        typeof body === "object" && body !== null && "answers" in body
          ? body.answers
          : null,
      );
      setAnswers(nextAnswers);
      const isLast = current === quiz.questions.length - 1;
      if (isLast) {
        const completion = assessmentCompletionSchema.parse(
          await jsonRequest(
            `/api/assessments/${assessment.assessmentId}/complete`,
            { method: "POST" },
          ),
        );
        const duration = Math.max(
          0,
          Math.round((Date.now() - Date.parse(assessment.startedAt)) / 1000),
        );
        await analytics.capture("quiz_completed", {
          problem_slug: problem.slug,
          duration_s: duration,
          safety_status: completion.safetyStatus,
        });
        persistAssessment(assessment.assessmentId, current);
        router.push(`/resultado/${assessment.assessmentId}`);
        return;
      }
      const step = current + 1;
      setCurrent(step);
      setSelected(nextAnswers[quiz.questions[step]!.key]);
      persistAssessment(assessment.assessmentId, step);
      setPhase("active");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : errorMessage(error));
      setPhase("active");
    }
  }

  if (phase === "intro" || phase === "error")
    return (
      <Card className="mx-auto max-w-2xl p-6 sm:p-10 rounded-3xl shadow-sm border-border/80">
        <div className="flex items-center justify-between gap-4">
          <Badge>QUIZ DO PROBLEMA</Badge>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-secondary/80 p-1">
            <PethMascot mood="thinking" size={46} />
          </div>
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
          Vamos entender a rotina de vocês
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          São até 10 perguntas rápidas sobre situações observáveis. Não é
          diagnóstico veterinário e nenhuma cobrança será iniciada.
        </p>
        <div className="mt-6 flex items-start gap-3 rounded-2xl bg-secondary/70 p-4 text-foreground">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            Suas respostas ficam associadas a uma credencial segura neste navegador
            por até sete dias. O resultado e a triagem de segurança entram nas
            próximas fases.
          </p>
        </div>
        {message ? (
          <Feedback tone="warning" title="Precisamos recomeçar" announce className="mt-5">
            {message}
          </Feedback>
        ) : null}
        {!available ? (
          <Feedback title="Quiz indisponível neste ambiente" className="mt-5">
            A configuração segura do assessment ainda não está disponível aqui.
          </Feedback>
        ) : null}
        <Button
          size="lg"
          className="mt-7 w-full sm:w-auto"
          onClick={() => void start()}
          disabled={!available}
        >
          Começar quiz
        </Button>
      </Card>
    );

  if (!quiz || !assessment || !question)
    return (
      <Card className="mx-auto max-w-2xl py-16 text-center rounded-3xl" role="status">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-secondary/80">
          <PethMascot mood="thinking" size={50} />
        </div>
        <p className="font-semibold text-lg text-foreground">Carregando seu quiz…</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Isso deve levar apenas alguns segundos.
        </p>
      </Card>
    );

  return (
    <div className="mx-auto max-w-2xl" data-quiz-active="true">
      <div className="mb-4 flex items-center justify-between gap-4 text-sm font-medium text-muted-foreground">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-full bg-secondary/80">
            <PethMascot mood={current === quiz.questions.length - 1 ? "celebrating" : "encouraging"} size={30} />
          </div>
          <span className="font-semibold text-foreground">
            Pergunta {current + 1} de {quiz.questions.length}
          </span>
        </div>
        <span className="text-xs">{answeredCount} respondidas</span>
      </div>
      <Progress value={progress} label={`Progresso: ${current + 1} de ${quiz.questions.length}`} />
      <Card className="mt-6 p-6 sm:p-8 rounded-3xl shadow-sm border-border/80">
        <p className="eyebrow">{problem.title}</p>
        <fieldset className="mt-4">
          <legend className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl text-foreground">
            {question.prompt}
          </legend>
          {question.helpText ? (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {question.helpText}
            </p>
          ) : null}
          <div className="mt-6 grid gap-3">
            {question.options.map((option) => (
              <ChoiceCard
                key={option.key}
                name={question.key}
                value={option.key}
                title={option.label}
                description={option.description}
                checked={selected === option.key}
                onChange={() => setSelected(option.key)}
              />
            ))}
          </div>
        </fieldset>
        {message ? (
          <Feedback tone="error" title="Não foi possível salvar" announce className="mt-5">
            {message}
          </Feedback>
        ) : null}
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={goBack} disabled={current === 0 || phase !== "active"}>
            <ArrowLeft aria-hidden="true" /> Voltar
          </Button>
          <Button
            size="lg"
            onClick={() => void continueQuiz()}
            disabled={!selected}
            loading={phase === "loading" || phase === "completing"}
            loadingText={phase === "completing" ? "Concluindo…" : "Salvando…"}
          >
            {current === quiz.questions.length - 1 ? (
              <>
                <Check aria-hidden="true" /> Concluir quiz
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>
      </Card>
      <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
        Você pode voltar sem perder as respostas já salvas.
      </p>
    </div>
  );
}
