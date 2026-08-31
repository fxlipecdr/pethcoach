import { notFound } from "next/navigation";
import { WorkspaceShell } from "@/components/layouts/workspace-shell";
import { PageContainer } from "@/components/layouts/page-container";
import { DogForm } from "@/features/dogs/dog-form";
export const dynamic = "force-dynamic";
export default function DogFormPreview() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <WorkspaceShell area="app" preview>
      <PageContainer size="flow">
        <div className="mb-8">
          <p className="eyebrow">PRÉVIA DE INTERFACE · P2</p>
          <h1 className="app-heading mt-3">Criar perfil do cão</h1>
          <p className="mt-3 text-muted-foreground">
            Validação local de formulário, sem conta e sem gravação no banco.
          </p>
        </div>
        <DogForm id="" preview />
      </PageContainer>
    </WorkspaceShell>
  );
}
