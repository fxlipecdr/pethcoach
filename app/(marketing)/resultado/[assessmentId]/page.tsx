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
  readAssessmentRecord,
} from "@/features/assessments/data";
import { assessmentIdSchema } from "@/features/assessments/contracts";
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

export const metadata: Metadata = {
  title: "Triagem de segurança",
  robots: { index: false, follow: false },
};

type ResultPageProps = {
  params: Promise<{ assessmentId: string }>;
  searchParams: Promise<{ fixture?: string }>;
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

export default async function ResultPage({
  params,
  searchParams,
}: ResultPageProps) {
  const fixture = developmentFixture((await searchParams).fixture);
  let result: {
    status: EvaluatedSafetyOutcome;
    codes: SafetyCode[];
  } | null = fixture;

  if (!result) {
    const parsedId = assessmentIdSchema.safeParse(
      (await params).assessmentId,
    );
    const runtime = await assessmentRuntime();
    if (!parsedId.success || !runtime) notFound();
    const token = (await cookies()).get(assessmentCookieName)?.value;
    if (!verifyAssessmentToken(token, parsedId.data, runtime.secret))
      notFound();
    const assessment = await readAssessmentRecord(
      runtime.client,
      parsedId.data,
      assessmentTokenHash(token!),
    ).catch(() => null);
    if (!assessment) notFound();
    if (assessment.status === "in_progress")
      redirect(`/quiz/${assessment.problemSlug}`);
    if (assessment.safetyStatus === "pending")
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
    result = {
      status: assessment.safetyStatus,
      codes: assessment.safetyCodes,
    };
  }

  const presentation = safetyPresentation(result.status, result.codes);
  return (
    <section className="page-width py-10 sm:py-16">
      <Card className="mx-auto max-w-2xl p-6 sm:p-8">
        <Badge>
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          {presentation.badge}
        </Badge>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
          {presentation.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {presentation.description}
        </p>
        <Feedback
          tone={presentation.tone}
          title="Próximos passos seguros"
          className="mt-7"
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
        <Link href="/ajuda" className={buttonVariants({ className: "mt-7" })}>
          Ver limites e como buscar ajuda
        </Link>
      </Card>
    </section>
  );
}
