import { z } from "zod";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { Feedback } from "@/components/ui/feedback";
import { DogForm } from "@/features/dogs/dog-form";
import { getDog } from "@/features/dogs/data";
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
    </PageContainer>
  );
}
