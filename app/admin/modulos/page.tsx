import Link from "next/link";
import { ArrowRight, Clock, Gauge, Filter } from "lucide-react";
import { requireOperator } from "@/lib/security/auth";
import { PageHeading } from "@/components/layouts/page-container";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { listAllModulesForAdmin } from "@/features/admin/data";
import type { ModuleStatus } from "@/features/admin/contracts";

export const dynamic = "force-dynamic";

const STATUS_CONFIG: Record<
  ModuleStatus,
  { label: string; badgeClass: string }
> = {
  published: {
    label: "Publicado",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
  },
  reviewed: {
    label: "Revisado",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
  },
  draft: {
    label: "Rascunho",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
  },
  archived: {
    label: "Arquivado",
    badgeClass: "bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-900 dark:text-stone-400",
  },
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
};

const PROBLEM_NAMES: Record<string, string> = {
  "filhote-mordendo": "Filhote Mordendo",
  "xixi-lugar-errado": "Xixi no Lugar Errado",
  "cachorro-puxa-guia": "Passeio sem Puxar",
};

export default async function AdminModulosPage({
  searchParams,
}: {
  searchParams: Promise<{ problem?: string; status?: string }>;
}) {
  await requireOperator(["admin", "reviewer", "operator"]);
  const { problem, status } = await searchParams;

  const validStatus = ["draft", "reviewed", "published", "archived"].includes(
    status || "",
  )
    ? (status as ModuleStatus)
    : undefined;

  const modules = await listAllModulesForAdmin({
    problemSlug: problem || undefined,
    status: validStatus,
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeading
          eyebrow="CATÁLOGO DE CONTEÚDO"
          title="Módulos de Treino"
          description="Controle editorial de exercícios educativos. Filtre por problema comportamental ou status de revisão."
        />
      </div>

      {/* Filter toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mr-2">
            <Filter className="size-3.5" />
            <span>Filtrar:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={!problem ? "default" : "outline"}
              size="sm"
              className="text-xs h-8"
            >
              <Link
                href={`/admin/modulos${status ? `?status=${status}` : ""}`}
              >
                Todos os problemas
              </Link>
            </Button>
            {Object.entries(PROBLEM_NAMES).map(([slug, name]) => {
              const active = problem === slug;
              const query = new URLSearchParams();
              query.set("problem", slug);
              if (status) query.set("status", status);

              return (
                <Button
                  key={slug}
                  asChild
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-8"
                >
                  <Link href={`/admin/modulos?${query.toString()}`}>
                    {name}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">Status:</span>
          <Button
            asChild
            variant={!status ? "secondary" : "outline"}
            size="sm"
            className="text-xs h-7"
          >
            <Link
              href={`/admin/modulos${problem ? `?problem=${problem}` : ""}`}
            >
              Todos ({modules.length})
            </Link>
          </Button>
          {(["published", "reviewed", "draft", "archived"] as const).map(
            (st) => {
              const active = status === st;
              const query = new URLSearchParams();
              if (problem) query.set("problem", problem);
              query.set("status", st);

              return (
                <Button
                  key={st}
                  asChild
                  variant={active ? "secondary" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                >
                  <Link href={`/admin/modulos?${query.toString()}`}>
                    {STATUS_CONFIG[st].label}
                  </Link>
                </Button>
              );
            },
          )}
        </div>
      </Card>

      {/* Modules listing */}
      {modules.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhum módulo encontrado para os filtros selecionados.
          </p>
          <Button asChild variant="outline" className="mt-4" size="sm">
            <Link href="/admin/modulos">Limpar filtros</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {modules.map((mod) => {
            const statusConfig =
              STATUS_CONFIG[mod.status as ModuleStatus] ||
              STATUS_CONFIG.draft;

            return (
              <Card
                key={mod.id}
                className="p-5 flex flex-col justify-between gap-4 transition-colors hover:border-foreground/30 sm:flex-row sm:items-center"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}
                    >
                      {statusConfig.label}
                    </span>
                    <Badge className="text-[11px] bg-muted text-foreground border-border">
                      {PROBLEM_NAMES[mod.problem_slug || ""] ||
                        mod.problem_slug ||
                        "Geral"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      v{mod.version}
                    </span>
                  </div>

                  <h2 className="text-base font-semibold text-foreground truncate">
                    {mod.title}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {mod.estimated_duration_minutes} min/dia
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="size-3.5" />
                      {DIFFICULTY_LABELS[mod.difficulty] || mod.difficulty}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground/80">
                      {mod.slug}
                    </span>
                  </div>
                </div>

                <div className="sm:self-center">
                  <Button asChild variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                    <Link href={`/admin/modulos/${mod.id}`}>
                      <span>Ver & Revisar</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
