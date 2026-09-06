import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { Badge, Card } from "@/components/ui/primitives";
import {
  assessmentRuntime,
  buildObservableSummary,
  loadPublishedQuiz,
  readAssessmentRecord,
  readOwnedAssessment,
} from "@/features/assessments/data";
import {
  assessmentIdSchema,
  type ObservableSummary,
} from "@/features/assessments/contracts";
import {
  assessmentCookieName,
  assessmentTokenHash,
  verifyAssessmentToken,
} from "@/features/assessments/token";
import type {
  EvaluatedSafetyOutcome,
  SafetyCode,
} from "@/features/safety/contracts";
import { safetyPresentation } from "@/features/safety/presentation";
import { ClaimCard } from "@/features/assessments/claim-card";
import { FirstDayCard } from "@/features/assessments/first-day-card";
import { loadFirstDayModule } from "@/features/plans/data";
import type { BehaviorModule } from "@/features/plans/contracts";
import { ObservableSummaryView } from "@/features/assessments/observable-summary-view";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { findProblem } from "@/content/problems";

export const metadata: Metadata = {
  title: "Resultado e triagem de segurança",
  robots: { index: false, follow: false },
};

type ResultPageProps = {
  params: Promise<{ assessmentId: string }>;
  searchParams: Promise<{ fixture?: string; claim?: string }>;
};

function developmentFixture(value: string | undefined) {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.E2E_QUIZ_UI_ONLY !== "1"
  )
    return null;
  if (value === "block")
    return {
      status: "block" as const,
      codes: ["VULNERABLE_PERSON_RISK" as const],
    };
  if (value === "refer")
    return {
      status: "refer" as const,
      codes: ["SUSPECTED_PAIN" as const],
    };
  return {
    status: "continue" as const,
    codes: ["SAFETY_GATE_CLEAR" as const],
  };
}

const fixtureSummary: ObservableSummary = {
  problemSlug: "cachorro-puxa-guia",
  problemTitle: "Meu cachorro puxa a guia",
  observations: [
    {
      key: "pulling_moment",
      questionPrompt: "Em que momento a guia costuma ficar mais esticada?",
      answerLabel: "Já na saída ou perto da porta",
    },
    {
      key: "pulling_frequency",
      questionPrompt: "Com que frequência isso acontece nos passeios?",
      answerLabel: "Em alguns momentos",
    },
  ],
  strengths: [
    "Responde com interesse a recompensas em ambientes com menor distração.",
  ],
  focusPoints: [
    "Treinar pausas com guia frouxa antes mesmo de cruzar a porta de saída.",
    "Aumentar a distância de cheiros, cães e pessoas antes que a tensão na guia se forme.",
  ],
};

export default async function ResultPage({
  params,
  searchParams,
}: ResultPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const fixture = developmentFixture(resolvedSearchParams.fixture);

  let result: {
    status: EvaluatedSafetyOutcome;
    codes: SafetyCode[];
  } | null = fixture;

  let observableSummary: ObservableSummary | null = null;
  let firstDay: BehaviorModule | null = null;
  let problemSlug: string | null = fixture ? "cachorro-puxa-guia" : null;
  let isAuthenticated = false;
  let isClaimed = false;
  let userDogs: Array<{ id: string; name: string }> = [];

  if (!result) {
    const parsedId = assessmentIdSchema.safeParse(resolvedParams.assessmentId);
    const runtime = await assessmentRuntime();
    if (!parsedId.success || !runtime) notFound();

    const token = (await cookies()).get(assessmentCookieName)?.value;
    if (!verifyAssessmentToken(token, parsedId.data, runtime.secret)) {
      notFound();
    }

    const assessment = await readAssessmentRecord(
      runtime.client,
      parsedId.data,
      assessmentTokenHash(token!),
    ).catch(() => null);

    if (!assessment) notFound();
    if (assessment.status === "in_progress") {
      redirect(`/quiz/${assessment.problemSlug}`);
    }

    if (assessment.safetyStatus === "pending") {
      return (
        <section className="page-width py-12 sm:py-20">
          <Card className="mx-auto max-w-2xl p-6 sm:p-8">
            <Badge>TRIAGEM INDISPONÍVEL</Badge>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">
              Ainda não podemos apresentar um resultado
            </h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              A verificação de segurança não foi concluída. Nenhum plano ou
              orientação será liberado até que essa etapa esteja disponível.
            </p>
          </Card>
        </section>
      );
    }

    result = {
      status: assessment.safetyStatus,
      codes: assessment.safetyCodes,
    };

    if (result.status === "continue") {
      const quiz = await loadPublishedQuiz(
        runtime.client,
        assessment.problemSlug,
        assessment.version,
      ).catch(() => null);

      if (quiz) {
        observableSummary = buildObservableSummary(quiz, assessment.answers);
      }

      // Valor antes do cadastro: o Dia 1 aparece aqui mesmo, sem conta.
      problemSlug = assessment.problemSlug;
      firstDay = await loadFirstDayModule(
        runtime.client,
        assessment.problemSlug,
      );

      const { data: authData } = await runtime.client.auth.getUser().catch(() => ({
        data: { user: null },
      }));
      const user = authData?.user;

      if (user) {
        isAuthenticated = true;
        const owned = await readOwnedAssessment(
          runtime.client,
          parsedId.data,
        ).catch(() => null);
        isClaimed = Boolean(owned?.user_id);

        const { data: dogs } = await runtime.client
          .from("dogs")
          .select("id, name")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (dogs) {
          userDogs = dogs;
        }
      }
    }
  } else if (result.status === "continue") {
    observableSummary = fixtureSummary;
  }

  const presentation = safetyPresentation(result.status, result.codes);
  const seguePraticando = result.status === "continue";
  const problema = problemSlug ? findProblem(problemSlug) : undefined;

  /**
   * O bloco de triagem, sempre presente e sempre íntegro.
   *
   * A **posição** dele muda conforme o desfecho, e isso é deliberado. Em
   * encaminhamento ou bloqueio, a segurança é a mensagem: abre a página. Em
   * `continue`, a mensagem é o plano — e liderar com "nenhum bloqueio imediato
   * foi identificado" entrega a quem respondeu dez perguntas sobre o próprio
   * cão a linguagem de um laudo, no negativo, antes de qualquer coisa útil.
   *
   * Nenhum texto some: o aviso de que não há diagnóstico, os sinais para
   * observar e o limite de escopo continuam na tela, por inteiro.
   */
  const blocoDeTriagem = (
    <Card
      className={`rounded-3xl border-border/80 p-6 shadow-sm sm:p-10 ${seguePraticando ? "mt-6 bg-surface-soft" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge>
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {presentation.badge}
          </Badge>
          {seguePraticando ? (
            <h2 className="mt-4 font-display text-xl font-bold tracking-tight text-foreground">
              {presentation.title}
            </h2>
          ) : (
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {presentation.title}
            </h1>
          )}
        </div>
        {seguePraticando ? null : (
          <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/80 sm:flex">
            <PethMascot mood="neutral" size={48} />
          </div>
        )}
      </div>
      <p
        className={`mt-4 leading-relaxed text-muted-foreground ${seguePraticando ? "text-sm" : "text-base sm:text-lg"}`}
      >
        {presentation.description}
      </p>

      <Feedback
        tone={presentation.tone}
        title="Próximos passos seguros"
        className="mt-6 rounded-2xl"
      >
        <ul className="list-disc space-y-2 pl-5">
          {presentation.actions.map((action) => (
            <li key={action}>{action}</li>
          ))}
        </ul>
      </Feedback>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        O PethCoach não realiza diagnóstico, tratamento ou prognóstico. As
        mensagens são regras fixas de segurança e não substituem avaliação
        individual.
      </p>

      {seguePraticando ? null : (
        <Link
          href="/ajuda"
          className={buttonVariants({ size: "lg", className: "mt-7" })}
        >
          Ver limites e como buscar ajuda
        </Link>
      )}
    </Card>
  );

  if (!seguePraticando) {
    return (
      <section className="page-width py-10 sm:py-16">
        <div className="mx-auto max-w-2xl">{blocoDeTriagem}</div>
      </section>
    );
  }

  return (
    <section className="page-width py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Abre com o que o tutor veio buscar: o próximo passo, praticável hoje. */}
        <Card className="rounded-3xl border-2 border-primary/30 bg-secondary/20 p-6 shadow-sm sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge>SEU PLANO ESTÁ PRONTO</Badge>
              <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                14 dias para
                <br />
                <span className="marker-underline">
                  {problema ? problema.label.toLowerCase() : "mudar essa rotina"}
                </span>
              </h1>
            </div>
            <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-card sm:flex">
              <PethMascot mood="celebrating" size={48} />
            </div>
          </div>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Montamos a sequência a partir do que você respondeu
            {problema ? ` sobre ${problema.title.toLowerCase()}` : ""}. O{" "}
            <strong className="text-foreground">Dia 1 está aqui embaixo</strong>
            , completo e gratuito — dá para fazer hoje mesmo.
          </p>
        </Card>

        {firstDay ? <FirstDayCard module={firstDay} /> : null}

        <ClaimCard
          assessmentId={resolvedParams.assessmentId}
          isAuthenticated={isAuthenticated}
          isClaimed={isClaimed}
          dogs={userDogs}
        />

        {observableSummary ? (
          <ObservableSummaryView summary={observableSummary} />
        ) : null}

        {blocoDeTriagem}
      </div>
    </section>
  );
}
