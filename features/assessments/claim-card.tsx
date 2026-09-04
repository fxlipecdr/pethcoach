"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/primitives";
import { Feedback } from "@/components/ui/feedback";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { analytics } from "@/lib/posthog/client";
import { getOrCreateAnonymousId } from "@/features/analytics/attribution";
import { linkAttributionAction } from "@/features/analytics/actions";
import { claimAssessmentAction, type ClaimActionResult } from "./actions";

type DogOption = {
  id: string;
  name: string;
};

type ClaimCardProps = {
  assessmentId: string;
  isAuthenticated: boolean;
  isClaimed: boolean;
  dogs: DogOption[];
};

export function ClaimCard({
  assessmentId,
  isAuthenticated,
  isClaimed,
  dogs,
}: ClaimCardProps) {
  const [state, formAction, isPending] = useActionState<
    ClaimActionResult | null,
    FormData
  >(async (_prev, formData) => {
    const selectedDogId = formData.get("dogId")?.toString() || null;
    const res = await claimAssessmentAction(assessmentId, selectedDogId);
    if (res.status === "success") {
      void analytics.capture("account_created", {
        source: "claim",
      });
      const anonId = getOrCreateAnonymousId();
      if (anonId) {
        void linkAttributionAction(anonId);
      }
    }
    return res;
  }, null);

  if (isClaimed || state?.status === "success") {
    return (
      <Card className="mt-8 border-emerald-500/30 bg-emerald-50/40 p-6 sm:p-8 rounded-3xl dark:bg-emerald-950/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300">
              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              AVALIAÇÃO SALVA
            </Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Esta avaliação está vinculada à sua conta
            </h2>
          </div>
          <div className="hidden sm:flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100/70 dark:bg-emerald-900/40">
            <PethMascot mood="celebrating" size={48} />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Suas respostas foram preservadas com segurança. Você pode acompanhar a
          rotina do seu cão e acessar os próximos passos na sua área pessoal.
        </p>
        <div className="mt-6">
          <Button asChild size="lg">
            <Link href="/app">
              Acessar minha área
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  if (!isAuthenticated) {
    const nextUrl = `/resultado/${assessmentId}?claim=1`;
    return (
      <Card className="mt-8 border-primary/25 bg-gradient-to-br from-card via-card to-secondary/30 p-6 sm:p-8 rounded-3xl shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge>PRÓXIMO PASSO</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              Salvar este resultado e começar
            </h2>
          </div>
          <div className="hidden sm:flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/80">
            <PethMascot mood="happy" size={46} />
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Conecte sua conta para salvar estas respostas e associá-las ao perfil do
          seu cão sem precisar refazer o questionário.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={`/entrar?next=${encodeURIComponent(nextUrl)}`}
            className={buttonVariants({ size: "lg", className: "w-full sm:w-auto" })}
          >
            Salvar avaliação e criar conta
            <ArrowRight className="ml-2 size-4" aria-hidden="true" />
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Acesso seguro por link mágico no seu e-mail. Sem senhas ou cobranças nesta
          etapa.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mt-8 border-primary/25 bg-card p-6 sm:p-8 rounded-3xl shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge>VINCULAR AO CÃO</Badge>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            Conectar avaliação à sua conta
          </h2>
        </div>
        <div className="hidden sm:flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary/80">
          <PethMascot mood="pointing" size={46} />
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
        Vincule este resultado ao perfil de um dos seus cães ou guarde-o na sua
        conta para atribuir depois.
      </p>

      {state?.status === "error" ? (
        <Feedback tone="error" title="Não foi possível salvar" className="mt-4">
          {state.message}
        </Feedback>
      ) : null}

      <form action={formAction} className="mt-6 space-y-4">
        {dogs.length > 0 ? (
          <div>
            <label
              htmlFor="dogId"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Escolha o cão para esta avaliação:
            </label>
            <select
              id="dogId"
              name="dogId"
              defaultValue={dogs[0]?.id}
              className="block w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/20"
            >
              {dogs.map((dog) => (
                <option key={dog.id} value={dog.id}>
                  {dog.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Você ainda não tem nenhum cão cadastrado. Ao salvar, vincularemos esta
            avaliação à sua conta para você criar o perfil do cão em seguida.
          </p>
        )}

        <Button type="submit" size="lg" loading={isPending} loadingText="Salvando...">
          Salvar avaliação na minha conta
        </Button>
      </form>
    </Card>
  );
}
