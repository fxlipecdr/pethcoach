import { FoundationState } from "@/components/pethcoach/foundation-state";
export default function AdminPage() {
  return (
    <FoundationState
      contained
      title="Cuidado também nos bastidores"
      description="A área de revisão de conteúdo e auditoria ainda não está disponível."
      phase="O workflow draft → reviewed → published e a auditoria fazem parte da fase P13."
    />
  );
}
