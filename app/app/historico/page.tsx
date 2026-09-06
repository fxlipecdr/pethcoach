import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { authenticatedData } from "@/features/dogs/data";
import {
  getPlanAdaptations,
  getPlanCheckins,
  getPlanMilestones,
  getUserActivePlans,
} from "@/features/plans/data";
import { TimelineView } from "@/features/plans/timeline-view";

export const metadata: Metadata = {
  title: "Histórico",
};

/**
 * Histórico de treino do tutor.
 *
 * Esta rota caía no catch-all de `/app/[...segments]`, que respondia "Histórico
 * previsto para P8 e P9" — fases entregues há tempo. Quem pagava e tocava em
 * "Histórico" no menu encontrava um aviso de obra.
 *
 * Os dados já existiam: check-ins diários, marcos e adaptações são gravados
 * desde P9, e o `TimelineView` já os desenha dentro da tela de plano. O que
 * faltava era a página que junta isso por cão.
 */
export default async function HistoricoPage() {
  const { client, user } = await authenticatedData("/app/historico");
  const planos = await getUserActivePlans(client, user.id);

  const linhasDoTempo = await Promise.all(
    planos.map(async (plano) => ({
      plano,
      checkins: await getPlanCheckins(client, plano.id),
      marcos: await getPlanMilestones(client, plano.id),
      adaptacoes: await getPlanAdaptations(client, plano.id),
    })),
  );

  const comRegistro = linhasDoTempo.filter(
    ({ checkins, marcos }) => checkins.length > 0 || marcos.length > 0,
  );

  return (
    <PageContainer size="flow">
      <div className="mb-8">
        <p className="eyebrow">O caminho de vocês</p>
        <h1 className="app-heading mt-3">Histórico de treino</h1>
        <p className="mt-3 max-w-prose leading-relaxed text-muted-foreground">
          Cada check-in registrado, os marcos alcançados e os ajustes de ritmo.
          Sem contagem de dias perdidos — o histórico existe para mostrar o que
          já andou, não para cobrar.
        </p>
      </div>

      {planos.length === 0 ? (
        <Card className="p-8 text-center">
          <PethMascot mood="neutral" size={72} className="mx-auto" />
          <h2 className="app-heading mt-5 text-xl">
            Nada registrado por aqui ainda
          </h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
            Assim que vocês começarem um plano, cada dia praticado aparece
            nesta página.
          </p>
          <Button asChild className="mt-7">
            <Link href="/app">Ver o treino de hoje</Link>
          </Button>
        </Card>
      ) : comRegistro.length === 0 ? (
        <Card className="p-8 text-center">
          <PethMascot mood="happy" size={72} className="mx-auto" />
          <h2 className="app-heading mt-5 text-xl">O plano começou</h2>
          <p className="mx-auto mt-3 max-w-md leading-relaxed text-muted-foreground">
            Ainda não há check-in registrado. Depois do primeiro dia praticado,
            o caminho de vocês aparece aqui.
          </p>
          <Button asChild className="mt-7">
            <Link href="/app">Ir para o treino de hoje</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-12">
          {comRegistro.map(({ plano, checkins, marcos, adaptacoes }) => (
            <section key={plano.id}>
              {/* Com mais de um cão, o histórico precisa dizer de quem é. */}
              {comRegistro.length > 1 ? (
                <h2 className="app-heading mb-6 text-xl">{plano.dogName}</h2>
              ) : null}
              <TimelineView
                checkins={checkins}
                milestones={marcos}
                adaptations={adaptacoes}
                dogName={plano.dogName}
              />
            </section>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
