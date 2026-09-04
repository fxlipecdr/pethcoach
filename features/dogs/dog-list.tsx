import Link from "next/link";
import { ArrowUpRight, PawPrint, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Badge } from "@/components/ui/primitives";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import type { DogRow } from "@/lib/supabase/database.types";
import { dogOptions } from "./contracts";

export function DogList({ dogs }: { dogs: DogRow[] }) {
  if (!dogs.length)
    return (
      <Card className="py-12 text-center sm:py-16 border-2 border-dashed border-border/80 bg-card/60">
        <PethMascot
          mood="happy"
          size={96}
          className="mx-auto mb-5 drop-shadow-sm motion-safe:hover:scale-105 transition-transform"
        />
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          O primeiro passo tem um nome
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Crie o perfil do seu cão para guardar as informações de vocês em um só
          lugar. Você poderá completar os detalhes depois.
        </p>
        <Button asChild className="mt-7 shadow-tactile rounded-2xl">
          <Link href="/app/caes/novo">
            <Plus className="size-4" aria-hidden="true" />
            Adicionar meu cão
          </Link>
        </Button>
      </Card>
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {dogs.map((dog) => (
        <Link
          key={dog.id}
          href={`/app/caes/${dog.id}`}
          className="group block rounded-3xl"
        >
          <Card className="h-full rounded-3xl border-2 border-border bg-card p-6 shadow-card transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-card-hover motion-safe:group-hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary shadow-xs border border-primary/10">
                <PawPrint className="size-7" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <span className="flex size-9 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </div>

            <h2 className="mt-5 break-words text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
              {dog.name}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {dog.breed_text ?? "Raça não informada"}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {dog.size ? (
                <Badge className="bg-secondary/70">
                  {dogOptions.size[dog.size]}
                </Badge>
              ) : null}
              {dog.sex ? (
                <Badge className="bg-muted">
                  {dogOptions.sex[dog.sex]}
                </Badge>
              ) : null}
            </div>

            <div className="mt-6 border-t border-border/70 pt-4 flex items-center justify-between text-sm font-bold text-primary">
              <span>Ver e editar perfil<span className="sr-only"> de {dog.name}</span></span>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
