import { PageContainer } from "@/components/layouts/page-container";
import { Feedback } from "@/components/ui/feedback";
import { DogList } from "@/features/dogs/dog-list";
import { listDogs } from "@/features/dogs/data";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardPage() {
  const dogs = await listDogs();
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
      <DogList dogs={dogs} />
      <Feedback className="mt-7" title="O perfil é o começo">
        Quiz, planos e acompanhamento diário serão liberados nas próximas
        etapas. Nenhum treino ou cobrança está ativo.
      </Feedback>
    </PageContainer>
  );
}
