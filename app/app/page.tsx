import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { DogList } from "@/features/dogs/dog-list";
import { listDogs } from "@/features/dogs/data";
import { getUserActivePlans } from "@/features/plans/data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge, Card } from "@/components/ui/primitives";
import { PethMascot } from "@/components/pethcoach/peth-mascot";

export default async function DashboardPage() {
  const dogs = await listDogs();
  const client = await createSupabaseServerClient();
  const session = client ? await client.auth.getUser().catch(() => null) : null;
  const user = session?.data.user;
  const activePlans = client && user ? await getUserActivePlans(client, user.id) : [];
  const primaryPlan = activePlans[0] ?? null;

  const todayTasks = primaryPlan
    ? (primaryPlan.tasks ?? []).filter((t) => t.dayNumber === primaryPlan.currentDay)
    : [];
  const todayDuration = todayTasks.reduce(
    (acc, t) => acc + (t.module?.estimatedDurationMinutes ?? 0),
    0,
  );
  const isTodayComplete =
    todayTasks.length > 0 && todayTasks.every((t) => t.status === "completed");

  return (
    <PageContainer>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="eyebrow">BEM-VINDO À SUA ÁREA</p>
          <h1 className="app-heading mt-3">A rotina de vocês começa aqui</h1>
          <p className="mt-3 text-muted-foreground">
            Um espaço para cuidar dos detalhes, no ritmo de vocês.
          </p>
        </div>
        {dogs.length ? (
          <Button asChild>
            <Link href="/app/caes/novo">Adicionar cão</Link>
          </Button>
        ) : null}
      </div>

      {primaryPlan ? (
        <Card className="mb-10 p-6 sm:p-8 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-secondary/30 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-secondary/80">
                <PethMascot
                  mood={isTodayComplete ? "celebrating" : "encouraging"}
                  size={52}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary/15 text-primary border-primary/30 font-bold">
                    TREINO DE HOJE
                  </Badge>
                  <span className="text-xs font-bold text-muted-foreground">
                    Dia {primaryPlan.currentDay} de {primaryPlan.totalDays}
                  </span>
                </div>
                <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
                  Treino com {primaryPlan.dogName}
                </h2>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Clock className="size-3.5 text-primary" aria-hidden="true" />
                    {todayDuration} minutos estimados
                  </span>
                  <span>•</span>
                  <span>
                    {todayTasks.filter((t) => t.status === "completed").length} de{" "}
                    {todayTasks.length} exercícios concluídos
                  </span>
                </div>
              </div>
            </div>

            <Button asChild size="lg" className="w-full sm:w-auto shadow-tactile">
              <Link href={`/app/caes/${primaryPlan.dogId}`}>
                {isTodayComplete ? "Ver treino concluído" : "Praticar treino de hoje"}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Seus Cães Cadastrados
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Acesse os perfis individuais para gerenciar planos, avaliações e rotinas.
        </p>
      </div>

      <DogList dogs={dogs} />
    </PageContainer>
  );
}
