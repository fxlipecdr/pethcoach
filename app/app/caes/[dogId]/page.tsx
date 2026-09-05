import { z } from "zod";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { Feedback } from "@/components/ui/feedback";
import { Badge, Disclosure } from "@/components/ui/primitives";
import { DogForm } from "@/features/dogs/dog-form";
import { getDog } from "@/features/dogs/data";
import { listDogAssessments } from "@/features/assessments/data";
import {
  getDogActivePlan,
  getPlanAdaptations,
  getPlanCheckins,
  getPlanMilestones,
  getUserEntitlements,
} from "@/features/plans/data";
import { PlanView } from "@/features/plans/plan-view";
import { GeneratePlanButton } from "@/features/plans/generate-plan-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditDogPage({
  params,
  searchParams,
}: {
  params: Promise<{ dogId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { dogId } = await params;
  if (!z.uuid().safeParse(dogId).success) notFound();
  const dog = await getDog(dogId);
  const { created } = await searchParams;

  const client = await createSupabaseServerClient();
  const assessments = client ? await listDogAssessments(client, dogId) : [];
  const activePlan = client ? await getDogActivePlan(client, dogId) : null;
  const hasEntitlement =
    client && dog.owner_id
      ? await getUserEntitlements(client, dog.owner_id)
      : false;
  const checkins =
    client && activePlan ? await getPlanCheckins(client, activePlan.id) : [];
  const milestones =
    client && activePlan ? await getPlanMilestones(client, activePlan.id) : [];
  const adaptations =
    client && activePlan ? await getPlanAdaptations(client, activePlan.id) : [];
  const eligibleAssessment = assessments.find(
    (a) => a.safetyStatus === "continue",
  );

  return (
    <PageContainer size="flow">
      {/* A tela abre no que a pessoa veio fazer: o treino de hoje. */}
      <div className="mb-7">
        <p className="eyebrow">O perfil do seu cão</p>
        <h1 className="app-heading mt-1.5 break-words">{dog.name}</h1>
      </div>

      {created === "1" ? (
        <Feedback className="mb-6" tone="success" title="Perfil disponível">
          O treino aparece aqui assim que houver uma avaliação concluída. Você
          pode completar os dados do perfil no fim da página.
        </Feedback>
      ) : null}

      {activePlan ? (
        <PlanView
          plan={activePlan}
          dogId={dog.id}
          dogName={dog.name}
          hasEntitlement={hasEntitlement}
          initialCheckins={checkins}
          initialMilestones={milestones}
          initialAdaptations={adaptations}
        />
      ) : eligibleAssessment ? (
        <div className="rounded-panel border border-primary/20 bg-secondary/40 p-6">
          <p className="eyebrow">Plano de treino disponível</p>
          <h2 className="font-display mt-2 text-xl font-bold tracking-tight text-foreground">
            Jornada de 14 Dias Pronta para Início
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Você concluiu uma avaliação com status positivo para treino guiado.
            Gere o plano diário estruturado (1 a 3 exercícios rápidos e
            positivos por dia) para acompanhar o progresso de {dog.name}.
          </p>
          <div className="mt-5">
            <GeneratePlanButton
              assessmentId={eligibleAssessment.id}
              dogId={dog.id}
              dogName={dog.name}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-panel border border-border bg-card p-6 shadow-card">
          <p className="eyebrow">Próximo passo</p>
          <h2 className="font-display mt-2 text-xl font-bold tracking-tight text-foreground">
            Ainda não há treino ativo para {dog.name}.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            O plano diário começa por uma avaliação com resultado positivo para
            treino guiado. Enquanto isso, você pode completar o perfil abaixo.
          </p>
        </div>
      )}

      {assessments.length > 0 ? (
        <div className="mt-10">
          <p className="eyebrow">Avaliações vinculadas</p>
          <h2 className="font-display mt-2 text-xl font-bold tracking-tight">
            Histórico de triagens
          </h2>
          <div className="mt-4 space-y-3">
            {assessments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-card border border-border bg-card p-4 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    Triagem concluída
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: {item.safetyStatus.toUpperCase()} • Concluída em{" "}
                    {item.completedAt
                      ? new Date(item.completedAt).toLocaleDateString("pt-BR")
                      : "Recente"}
                  </p>
                </div>
                <Badge tone="mint">Salva</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* O formulário sai do caminho, mas continua a um toque de distância. */}
      <Disclosure
        className="mt-10"
        title={`Editar perfil de ${dog.name}`}
        description="Nome, idade, porte e ambiente. Os detalhes mudam; o perfil acompanha vocês."
        defaultOpen={created === "1"}
      >
        <DogForm
          key={dog.id}
          id={dog.id}
          editing
          initialValues={{
            name: dog.name,
            birth_date: dog.birth_date ?? "",
            sex: dog.sex ?? "",
            size: dog.size ?? "",
            breed_text: dog.breed_text ?? "",
            neutered: dog.neutered === null ? "" : dog.neutered ? "yes" : "no",
            environment: dog.environment ?? "",
          }}
        />
      </Disclosure>
    </PageContainer>
  );
}
