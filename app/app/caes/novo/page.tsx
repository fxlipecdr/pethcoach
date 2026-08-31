import { randomUUID } from "node:crypto";
import { PageContainer } from "@/components/layouts/page-container";
import { DogForm } from "@/features/dogs/dog-form";
import { authenticatedData } from "@/features/dogs/data";
export default async function NewDogPage() {
  await authenticatedData("/app/caes/novo");
  return (
    <PageContainer size="flow">
      <div className="mb-8">
        <p className="eyebrow">UM NOVO COMPANHEIRO</p>
        <h1 className="app-heading mt-3">Criar perfil do cão</h1>
        <p className="mt-3 text-muted-foreground">
          Comece pelo essencial. Você pode editar tudo depois.
        </p>
      </div>
      <DogForm id={randomUUID()} />
    </PageContainer>
  );
}
