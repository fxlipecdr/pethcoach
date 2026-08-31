import Link from "next/link";
import { ArrowUpRight, PawPrint, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/primitives";
import type { DogRow } from "@/lib/supabase/database.types";
import { dogOptions } from "./contracts";

export function DogList({ dogs }: { dogs: DogRow[] }) {
  if (!dogs.length)
    return (
      <Card className="py-12 text-center sm:py-16">
        <span className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
          <PawPrint className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-medium tracking-tight">
          O primeiro passo tem um nome
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Crie o perfil do seu cão para guardar as informações de vocês em um só
          lugar. Você poderá completar os detalhes depois.
        </p>
        <Button asChild className="mt-7">
          <Link href="/app/caes/novo">
            <Plus aria-hidden="true" />
            Adicionar meu cão
          </Link>
        </Button>
      </Card>
    );
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {dogs.map((dog) => (
        <Link
          key={dog.id}
          href={`/app/caes/${dog.id}`}
          className="group block rounded-card"
        >
          <Card className="h-full transition-colors group-hover:border-primary/40">
            <div className="flex items-start justify-between">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <PawPrint className="size-5" aria-hidden="true" />
              </span>
              <ArrowUpRight
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <h2 className="mt-5 break-words text-2xl font-semibold tracking-tight">
              {dog.name}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {dog.breed_text ?? "Raça não informada"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {dog.size ? <Badge>{dogOptions.size[dog.size]}</Badge> : null}
              {dog.sex ? <Badge>{dogOptions.sex[dog.sex]}</Badge> : null}
            </div>
            <p className="mt-6 text-sm font-medium text-primary">
              Ver e editar perfil<span className="sr-only"> de {dog.name}</span>
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
