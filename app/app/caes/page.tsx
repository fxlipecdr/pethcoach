import Link from "next/link";
import { Plus } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { listDogs } from "@/features/dogs/data";
import { DogList } from "@/features/dogs/dog-list";

export default async function DogsPage() {
  const dogs = await listDogs();
  return (
    <PageContainer>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="eyebrow">OS COMPANHEIROS DA SUA ROTINA</p>
          <h1 className="app-heading mt-3">Meus cães</h1>
          <p className="mt-3 text-muted-foreground">
            Perfis separados, o mesmo cuidado.
          </p>
        </div>
        {dogs.length ? (
          <Button asChild>
            <Link href="/app/caes/novo">
              <Plus aria-hidden="true" />
              Adicionar cão
            </Link>
          </Button>
        ) : null}
      </div>
      <DogList dogs={dogs} />
    </PageContainer>
  );
}
