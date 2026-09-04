import { z } from "zod";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { Feedback } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/primitives";
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
      <div className="mb-8">
        <p className="eyebrow">O PERFIL DO SEU CÃO</p>
        <h1 className="app-heading mt-3 break-words">{dog.name}</h1>
        <p className="mt-3 text-muted-foreground">
          Os detalhes mudam. O perfil acompanha vocês.
        </p>
      </div>
      {created === "1" ? (
        <Feedback className="mb-6" tone="success" title="Perfil disponível">
          Você já pode revisar e completar as informações abaixo.
        </Feedback>
      ) : null}
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
      {activePlan ? (
        <div className="mt-10 border-t border-border/60 pt-8">
          <PlanView
            plan={activePlan}
            dogId={dog.id}
            dogName={dog.name}
            hasEntitlement={hasEntitlement}
            initialCheckins={checkins}
            initialMilestones={milestones}
            initialAdaptations={adaptations}
          />
        </div>
      ) : eligibleAssessment ? (
        <div className="mt-10 border-t border-border/60 pt-8">
          <div className="rounded-card border border-primary/30 bg-primary/5 p-6">
            <p className="eyebrow">PLANO DE TREINO DISPONÍVEL</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-foreground">
              Jornada de 14 Dias Pronta para Início
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Você concluiu uma avaliação com status positivo para treino guiado.
              Gere o plano diário estruturado (1 a 3 exercícios rápidos e positivos por dia)
              para acompanhar o progresso de {dog.name}.
            </p>
            <div className="mt-4">
              <GeneratePlanButton
                assessmentId={eligibleAssessment.id}
                dogId={dog.id}
                dogName={dog.name}
              />
            </div>
          </div>
        </div>
      ) : null}

      {assessments.length > 0 ? (
        <div className="mt-10 border-t border-border/60 pt-8">
          <p className="eyebrow">AVALIAÇÕES VINCULADAS</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">
            Histórico de triagens
          </h2>
          <div className="mt-4 space-y-3">
            {assessments.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4 text-sm"
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
                <Badge>Salva</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </PageContainer>
  );
}

