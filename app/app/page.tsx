import Link from "next/link";
import { ArrowRight, Clock, History, PawPrint, Plus } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { DogList } from "@/features/dogs/dog-list";
import { listDogs } from "@/features/dogs/data";
import { getUserActivePlans } from "@/features/plans/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button, buttonVariants } from "@/components/ui/button";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { ProgressBar, Sticker } from "@/components/pethcoach/playground";
import { Paw } from "@/components/pethcoach/doodles";

const shortcuts = [
  {
    href: "/app/caes",
    label: "Meus cães",
    icon: PawPrint,
    tone: "bg-mint-soft border-mint",
  },
  {
    href: "/app/caes/novo",
    label: "Adicionar cão",
    icon: Plus,
    tone: "bg-lime-soft border-lime",
  },
  {
    href: "/app/historico",
    label: "Histórico",
    icon: History,
    tone: "bg-sky-soft border-sky",
  },
];

export default async function DashboardPage() {
  const dogs = await listDogs();
  const client = await createSupabaseServerClient();
  const session = client ? await client.auth.getUser().catch(() => null) : null;
  const user = session?.data.user;
  const activePlans =
    client && user ? await getUserActivePlans(client, user.id) : [];
  const primaryPlan = activePlans[0] ?? null;
  const firstDog = dogs[0] ?? null;

  const todayTasks = primaryPlan
    ? (primaryPlan.tasks ?? []).filter(
        (t) => t.dayNumber === primaryPlan.currentDay,
      )
    : [];
  const todayDone = todayTasks.filter((t) => t.status === "completed").length;
  const todayDuration = todayTasks.reduce(
    (acc, t) => acc + (t.module?.estimatedDurationMinutes ?? 0),
    0,
  );
  const isTodayComplete = todayTasks.length > 0 && todayDone === todayTasks.length;
  const todayPercent = todayTasks.length
    ? (todayDone / todayTasks.length) * 100
    : 0;

  return (
    <PageContainer>
      {/* Cabeçalho curto: a ação principal precisa caber na primeira tela. */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Bem-vindo de volta</p>
          <h1 className="app-heading mt-1.5">A rotina de vocês</h1>
        </div>
        <PethMascot
          mood={isTodayComplete ? "celebrating" : "happy"}
          size={64}
          className="float-soft -mt-1 shrink-0"
        />
      </div>

      {/* AÇÃO DE HOJE — sempre o primeiro bloco da página. */}
      {primaryPlan ? (
        <section
          aria-labelledby="acao-de-hoje"
          className="rounded-panel border border-primary/20 bg-secondary/40 p-5 sm:p-7"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Sticker tone="purple">Treino de hoje</Sticker>
            <span className="text-xs font-bold text-muted-foreground">
              Dia {primaryPlan.currentDay} de {primaryPlan.totalDays}
            </span>
          </div>

          <h2
            id="acao-de-hoje"
            className="font-display mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            {isTodayComplete
              ? `Tudo certo com ${primaryPlan.dogName} hoje.`
              : `Treino com ${primaryPlan.dogName}`}
          </h2>

          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Clock className="size-4 text-primary-strong" aria-hidden="true" />
              {todayDuration} min estimados
            </span>
            <span aria-hidden="true">•</span>
            <span>
              {todayDone} de {todayTasks.length} exercícios
            </span>
          </p>

          <ProgressBar
            className="mt-5"
            label="Exercícios de hoje"
            value={todayPercent}
          />

          <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
            <Link href={`/app/caes/${primaryPlan.dogId}`}>
              {isTodayComplete ? "Ver treino de hoje" : "Praticar agora"}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </section>
      ) : firstDog ? (
        <section
          aria-labelledby="acao-de-hoje"
          className="rounded-panel border border-border bg-card p-5 shadow-card sm:p-7"
        >
          <Sticker tone="sky">Próximo passo</Sticker>
          <h2
            id="acao-de-hoje"
            className="font-display mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Ainda não há treino ativo.
          </h2>
          <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
            O plano diário nasce de uma avaliação com resultado positivo para
            treino guiado. Abra o perfil de {firstDog.name} para continuar de
            onde vocês pararam.
          </p>
          <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
            <Link href={`/app/caes/${firstDog.id}`}>
              Abrir perfil de {firstDog.name}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </section>
      ) : (
        <section
          aria-labelledby="acao-de-hoje"
          className="rounded-panel border border-dashed border-border bg-card p-6 text-center shadow-card sm:p-10"
        >
          <PethMascot mood="encouraging" size={96} className="mx-auto" />
          <h2
            id="acao-de-hoje"
            className="font-display mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            O primeiro passo tem um nome.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Crie o perfil do seu cão para guardar as informações de vocês em um
            só lugar. Você pode completar os detalhes depois.
          </p>
          <Button asChild size="lg" className="mt-7 w-full sm:w-auto">
            <Link href="/app/caes/novo">
              <Plus aria-hidden="true" />
              Adicionar meu cão
            </Link>
          </Button>
        </section>
      )}

      {/* Atalhos das funções principais, sem precisar abrir menu. */}
      <nav aria-label="Atalhos" className="mt-5 grid grid-cols-3 gap-3">
        {shortcuts.map(({ href, label, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className={`lift-card flex min-h-24 flex-col items-center justify-center gap-2 rounded-card border px-2 text-center text-xs font-bold text-ink ${tone}`}
          >
            <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      {dogs.length ? (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <Paw tone="mint" size={20} />
              Seus cães
            </h2>
            <Link
              href="/app/caes/novo"
              className={buttonVariants({
                variant: "link",
                className: "text-sm",
              })}
            >
              Adicionar
              <Plus aria-hidden="true" />
            </Link>
          </div>
          <DogList dogs={dogs} />
        </section>
      ) : null}
    </PageContainer>
  );
}
