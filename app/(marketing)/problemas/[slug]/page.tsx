import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Dog,
  Droplets,
  Route,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { findProblem, problems } from "@/content/problems";
import { getPublicEnv } from "@/lib/env/public";

const problemIcons = { route: Route, dog: Dog, drop: Droplets };
const tones = { sage: "bg-sage", peach: "bg-peach", lavender: "bg-lavender" };

type ProblemPageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return problems.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: ProblemPageProps): Promise<Metadata> {
  const problem = findProblem((await params).slug);
  if (!problem) notFound();

  const path = `/problemas/${problem.slug}`;
  const siteUrl = getPublicEnv().NEXT_PUBLIC_SITE_URL;
  const canonical = siteUrl ? new URL(path, siteUrl).toString() : undefined;

  return {
    title: problem.seoTitle,
    description: problem.seoDescription,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title: problem.seoTitle,
      description: problem.seoDescription,
      url: canonical,
      siteName: "PethCoach",
      locale: "pt_BR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: problem.seoTitle,
      description: problem.seoDescription,
    },
    robots: { index: false, follow: false },
  };
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const problem = findProblem((await params).slug);
  if (!problem) notFound();
  const Icon = problemIcons[problem.icon];

  return (
    <>
      <section className="page-width grid gap-10 py-10 md:grid-cols-[1.08fr_0.92fr] md:items-center md:gap-16 md:py-18">
        <div>
          <Link
            href="/#problemas"
            className="nav-link mb-7 gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Ver todos os pontos de partida
          </Link>
          <p className="eyebrow">{problem.category}</p>
          <h1 className="mt-4 max-w-2xl text-[2.65rem] leading-[1.08] font-medium tracking-[-0.055em] sm:text-[3.5rem]">
            {problem.title}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-[1.8] text-muted-foreground sm:text-lg">
            {problem.hero}
          </p>
          <Link
            href={`/quiz/${problem.slug}`}
            className={buttonVariants({
              className:
                "mt-8 min-h-13 w-full justify-between px-6 text-sm sm:w-auto sm:gap-7",
            })}
          >
            Começar avaliação <ArrowRight aria-hidden="true" />
          </Link>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-muted-foreground">
            São 8 perguntas sobre situações observáveis. Não é diagnóstico e
            nenhuma cobrança será iniciada.
          </p>
        </div>

        <div
          className={`relative min-h-80 overflow-hidden rounded-[1.75rem] p-7 sm:p-9 ${tones[problem.tone]}`}
          aria-hidden="true"
        >
          <div className="flex items-start justify-between">
            <span className="rounded-full border border-brand-700/15 bg-white/55 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-brand-700">
              PONTO DE PARTIDA
            </span>
            <Icon className="size-12 text-brand-700" strokeWidth={1.15} />
          </div>
          <div className="absolute right-7 bottom-7 left-7">
            <p className="max-w-xs text-2xl leading-tight font-medium tracking-tight text-brand-700 sm:text-3xl">
              {problem.label}
            </p>
            <div className="mt-6 h-px bg-brand-700/15" />
            <p className="mt-4 text-xs leading-relaxed text-brand-700/80">
              Recompensa, clareza e progressão no ritmo do cão.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-16 md:py-20">
        <div className="page-width">
          <div className="max-w-2xl">
            <p className="eyebrow">ANTES DE TENTAR CORRIGIR</p>
            <h2 className="section-heading mt-4">Comece observando.</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Um registro simples ajuda a escolher um passo possível e evita
              respostas automáticas baseadas em bronca ou força.
            </p>
          </div>
          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {problem.observations.map((observation, index) => (
              <article
                key={observation.title}
                className="rounded-2xl border border-border bg-background p-6"
              >
                <span className="text-xs font-semibold text-primary">
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-lg font-medium tracking-tight">
                  {observation.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {observation.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="page-width grid gap-8 py-16 md:grid-cols-[0.82fr_1.18fr] md:gap-16 md:py-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-primary">
            <Clock3 className="size-4" aria-hidden="true" />
            {problem.practice.duration}
          </div>
          <p className="eyebrow mt-7">UMA PRÁTICA POSSÍVEL</p>
          <h2 className="section-heading mt-4">{problem.practice.title}</h2>
          <p className="mt-5 leading-relaxed text-muted-foreground">
            {problem.practice.introduction}
          </p>
        </div>

        <div>
          <ol className="space-y-4">
            {problem.practice.steps.map((step, index) => (
              <li
                key={step}
                className="grid grid-cols-[2.5rem_1fr] gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <p className="self-center text-sm leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
          <div className="mt-5 rounded-2xl bg-warning-surface p-5 text-sm leading-relaxed">
            <strong className="font-semibold">Evite:</strong>{" "}
            {problem.practice.avoid}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-16 md:py-20">
        <div className="page-width grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <div>
            <Sparkles
              className="mb-6 size-7 text-primary"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="eyebrow">PROGRAMA EM PREPARAÇÃO</p>
            <h2 className="section-heading mt-4">
              Poucas tarefas, com propósito claro.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              Quando esta jornada for liberada, cada dia terá de uma a três
              tarefas curtas, com duração visível e critérios para avançar ou
              pedir ajuda.
            </p>
          </div>
          <ul className="divide-y divide-border border-y border-border">
            {problem.programFocus.map((focus) => (
              <li key={focus} className="flex items-center gap-4 py-6">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                  <Check className="size-4" aria-hidden="true" />
                </span>
                <span className="font-medium">{focus}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="page-width py-16 md:py-24">
        <div className="grid gap-7 rounded-[1.5rem] bg-strong p-7 text-strong-foreground md:grid-cols-[auto_1fr] md:gap-8 md:p-10">
          <ShieldAlert
            className="size-8"
            strokeWidth={1.4}
            aria-hidden="true"
          />
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em]">
              QUANDO INTERROMPER E PEDIR AJUDA
            </p>
            <h2 className="mt-4 text-2xl font-medium tracking-tight">
              Segurança vem antes do treino.
            </h2>
            <p className="mt-4 max-w-3xl leading-relaxed text-strong-foreground/90">
              {problem.safetyReferral}
            </p>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-strong-foreground/75">
              O PethCoach oferece orientação educacional e não realiza
              diagnóstico, tratamento ou prognóstico veterinário.
            </p>
            <Link
              href="/ajuda"
              className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium underline underline-offset-4"
            >
              Ver princípios e limites <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
