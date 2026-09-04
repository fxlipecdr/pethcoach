import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/layouts/workspace-shell";
import { PageContainer } from "@/components/layouts/page-container";
import { PlanView } from "@/features/plans/plan-view";
import type { Plan, PlanAdaptation, PlanMilestone } from "@/features/plans/contracts";

export const dynamic = "force-dynamic";

const fixtureMilestones: PlanMilestone[] = [
  {
    id: "ms-1",
    planId: "80000000-0000-4000-8000-000000000001",
    userId: "11111111-1111-4111-8111-111111111111",
    key: "first_training_done",
    title: "Primeiro Passo",
    description:
      "Você e seu cão concluíram a primeira sessão de treino juntos! O início de uma comunicação clara.",
    unlockedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const fixtureAdaptations: PlanAdaptation[] = [
  {
    id: "ad-1",
    planId: "80000000-0000-4000-8000-000000000001",
    userId: "11111111-1111-4111-8111-111111111111",
    triggerCheckinId: null,
    adaptationType: "consolidation",
    reason:
      "Ritmo consolidado para garantir conforto e foco sem elevação súbita de critérios.",
    createdAt: new Date().toISOString(),
  },
];

const fixturePlan: Plan = {
  id: "80000000-0000-4000-8000-000000000001",
  userId: "11111111-1111-4111-8111-111111111111",
  dogId: "aaaaaaaa-1111-4111-8111-111111111111",
  assessmentId: "60000000-0000-4000-8000-000000000001",
  problemId: "10000000-0000-4000-8000-000000000001",
  status: "active",
  currentDay: 1,
  totalDays: 14,
  plannerType: "deterministic_fallback",
  promptVersion: "p7-v1",
  modelVersion: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tasks: [
    {
      id: "90000000-0000-4000-8000-000000000001",
      planId: "80000000-0000-4000-8000-000000000001",
      dayNumber: 1,
      orderIndex: 1,
      moduleId: "70000000-0000-4000-8000-000000000001",
      status: "pending",
      module: {
        id: "70000000-0000-4000-8000-000000000001",
        problemId: "10000000-0000-4000-8000-000000000001",
        slug: "pausa-antes-da-porta",
        title: "Pausa tranquila antes da porta",
        category: "ambientacao",
        difficulty: "beginner",
        estimatedDurationMinutes: 3,
        setupInstructions:
          "Ambiente interno, peitoral confortável, guia frouxa e petiscos pequenos.",
        steps: [
          "Fique parado em frente à porta fechada com a guia sem tensão.",
          "Aguarde o cão relaxar ou olhar para você voluntariamente.",
          "Marque com elogio e recompense imediatamente.",
          "Abra a porta lentamente apenas se a guia permanecer relaxada.",
        ],
        successCriteria:
          "3 repetições onde o cão permanece calmo com a porta se abrindo.",
        stopConditions:
          "Se o cão ganir, pular na porta ou apresentar agitação intensa, interrompa o exercício.",
        tags: ["door", "quiet", "focus"],
        contraindications: [],
        version: 1,
        status: "published",
      },
    },
    {
      id: "90000000-0000-4000-8000-000000000002",
      planId: "80000000-0000-4000-8000-000000000001",
      dayNumber: 1,
      orderIndex: 2,
      moduleId: "70000000-0000-4000-8000-000000000002",
      status: "pending",
      module: {
        id: "70000000-0000-4000-8000-000000000002",
        problemId: "10000000-0000-4000-8000-000000000001",
        slug: "atencao-voluntaria-guia-frouxa",
        title: "Atenção voluntária e guia frouxa",
        category: "foco",
        difficulty: "beginner",
        estimatedDurationMinutes: 4,
        setupInstructions:
          "Área com poucas distrações (corredor ou quintal calmo), guia de 1,5m a 2m.",
        steps: [
          "Caminhe em ritmo natural e calmo.",
          "Sempre que a guia estiver com folga em U, marque e entregue a recompensa rente à sua perna.",
          "Se a guia esticar, pare suavemente sem dar trancos e espere o cão aliviar a tensão.",
        ],
        successCriteria:
          "Manter a guia frouxa por pelo menos 10 passos contínuos.",
        stopConditions:
          "Não dê puxões de volta. Se houver cansaço ou frustração, pause a sessão.",
        tags: ["walk", "reward", "reinforcement"],
        contraindications: [],
        version: 1,
        status: "published",
      },
    },
    {
      id: "90000000-0000-4000-8000-000000000003",
      planId: "80000000-0000-4000-8000-000000000001",
      dayNumber: 2,
      orderIndex: 1,
      moduleId: "70000000-0000-4000-8000-000000000003",
      status: "pending",
      module: {
        id: "70000000-0000-4000-8000-000000000003",
        problemId: "10000000-0000-4000-8000-000000000001",
        slug: "manejo-de-distancia",
        title: "Manejo calmo de distância",
        category: "manejo",
        difficulty: "intermediate",
        estimatedDurationMinutes: 5,
        setupInstructions:
          "Espaço aberto com visibilidade e rotas de escape tranquilas.",
        steps: [
          "Identifique o estímulo a uma distância confortável.",
          "Recompense o cão por permanecer calmo e olhar para você.",
          "Afaste-se suavemente mantendo a guia frouxa.",
        ],
        successCriteria:
          "Cão observa à distância sem latir ou puxar em direção ao estímulo.",
        stopConditions:
          "Se houver rigidez corporal ou latido, aumente a distância imediatamente.",
        tags: ["stimuli", "threshold", "distance"],
        contraindications: [],
        version: 1,
        status: "published",
      },
    },
  ],
};

export default async function PlanPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ entitlement?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const params = await searchParams;
  const hasEntitlement = params?.entitlement === "1";

  return (
    <WorkspaceShell area="app" preview>
      <PageContainer size="flow">
        <div className="mb-8">
          <p className="eyebrow">PRÉVIA DE INTERFACE · P7 / P8</p>
          <h1 className="app-heading mt-3">Plano de Treino Estruturado</h1>
          <p className="mt-3 text-muted-foreground">
            Visualização de 1 a 3 tarefas/dia, duração visível e critérios de parada.
          </p>
        </div>
        <PlanView
          plan={fixturePlan}
          dogId={fixturePlan.dogId}
          dogName="Pipoca"
          hasEntitlement={hasEntitlement}
          initialMilestones={fixtureMilestones}
          initialAdaptations={fixtureAdaptations}
          preview={true}
        />
      </PageContainer>
    </WorkspaceShell>
  );
}
