import { notFound } from "next/navigation";
import { FoundationState } from "@/components/pethcoach/foundation-state";
import { resolveAppRoute } from "@/features/navigation/routes";
import { PageContainer } from "@/components/layouts/page-container";
export default async function AppPage({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const segments = (await params).segments ?? [];
  const route = resolveAppRoute(segments);
  if (!route) notFound();
  return (
    <PageContainer
      size={
        segments[0] === "planos" && segments.at(-1) === "hoje"
          ? "flow"
          : "dashboard"
      }
    >
      <FoundationState
        contained
        title={route.title}
        description="Sua área pessoal está em preparação. Esta tela não contém dados de demonstração nem treinos gerados."
        phase={route.phase}
      />
    </PageContainer>
  );
}
