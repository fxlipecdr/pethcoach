import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { PetAvatar } from "@/components/pethcoach/playground";
import type { DoodleTone } from "@/components/pethcoach/doodles";
import type { DogRow } from "@/lib/supabase/database.types";
import { dogOptions } from "./contracts";

/** §4 — cartões não saem todos iguais: o tom alterna por posição. */
const tones: DoodleTone[] = ["mint", "coral", "sky", "lime"];

export function DogList({ dogs }: { dogs: DogRow[] }) {
  if (!dogs.length)
    return (
      <Card className="border-dashed bg-card/70 py-12 text-center sm:py-16">
        <PethMascot mood="happy" size={96} className="float-soft mx-auto mb-5" />
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          O primeiro passo tem um nome
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Crie o perfil do seu cão para guardar as informações de vocês em um só
          lugar. Você poderá completar os detalhes depois.
        </p>
        <Button asChild className="mt-7">
          <Link href="/app/caes/novo">
            <Plus className="size-4" aria-hidden="true" />
            Adicionar meu cão
          </Link>
        </Button>
      </Card>
    );

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {dogs.map((dog, index) => {
        const details = [
          dog.breed_text,
          dog.size ? dogOptions.size[dog.size] : null,
          dog.sex ? dogOptions.sex[dog.sex] : null,
        ].filter(Boolean);
        return (
          <li key={dog.id}>
            <Link
              href={`/app/caes/${dog.id}`}
              className="lift-card group flex min-h-20 items-center gap-4 rounded-card border border-border bg-card p-4 shadow-card hover:border-primary/40"
            >
              <PetAvatar
                name={dog.name}
                size={52}
                tone={tones[index % tones.length]}
              />
              <span className="min-w-0 flex-1">
                <span className="font-display block truncate text-lg font-bold tracking-tight text-foreground">
                  {dog.name}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {details.length ? details.join(" · ") : "Perfil a completar"}
                </span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary-strong"
                aria-hidden="true"
              />
              <span className="sr-only">Abrir perfil de {dog.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
