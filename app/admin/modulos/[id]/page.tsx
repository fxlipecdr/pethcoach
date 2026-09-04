import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Gauge,
  History,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { requireOperator } from "@/lib/security/auth";
import { PageHeading } from "@/components/layouts/page-container";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { getModuleWithRevisions } from "@/features/admin/data";
import { ModuleTransitionForm } from "@/components/admin/module-transition-form";
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

const ACTION_LABELS: Record<string, string> = {
  create: "Criação de rascunho",
  update: "Edição de conteúdo",
  submit_review: "Envio para revisão",
  approve_publish: "Aprovação para publicação",
  archive: "Arquivamento",
};

export default async function AdminModuloDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { role } = await requireOperator(["admin", "reviewer", "operator"]);
  const { id } = await params;

  const { module: mod, revisions } = await getModuleWithRevisions(id);
  if (!mod) {
    notFound();
  }

  const currentStatus = mod.status as ModuleStatus;
  const statusConfig = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.draft;
  const stepsList: string[] = Array.isArray(mod.steps)
    ? (mod.steps as string[])
    : [];

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="gap-2 -ml-3 text-muted-foreground">
          <Link href="/admin/modulos">
            <ArrowLeft className="size-4" />
            <span>Voltar ao catálogo</span>
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeading
          eyebrow="REVISÃO TÉCNICA E AUDITORIA"
          title={mod.title}
          description={`Slug: ${mod.slug} · Problema: ${mod.problem_slug || "Geral"}`}
        />
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.badgeClass}`}
          >
            {statusConfig.label}
          </span>
          <Badge>v{mod.version}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left Column: Educational Content Details */}
        <div className="space-y-6">
          <Card className="p-6 space-y-5">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pb-4 border-b border-border">
              <span className="flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                {mod.estimated_duration_minutes} minutos por dia
              </span>
              <span className="flex items-center gap-1.5">
                <Gauge className="size-4 text-primary" />
                Nível: {mod.difficulty}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-600" />
                Reforço Positivo Verificado
              </span>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Instruções de Preparação
              </h3>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {mod.setup_instructions}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Passo a Passo do Exercício
              </h3>
              <ol className="space-y-2 list-decimal pl-5 text-sm text-foreground">
                {stepsList.map((step: string, idx: number) => (
                  <li key={idx} className="leading-relaxed pl-1">
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="rounded-control bg-emerald-500/10 border border-emerald-500/30 p-4">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs mb-1">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Critérios de Sucesso</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {mod.success_criteria}
                </p>
              </div>

              <div className="rounded-control bg-amber-500/10 border border-amber-500/30 p-4">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs mb-1">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>Condições de Parada</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {mod.stop_conditions}
                </p>
              </div>
            </div>

            {mod.tags && mod.tags.length > 0 ? (
              <div className="pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Tags Editoriais
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {mod.tags.map((tag) => (
                    <Badge key={tag} className="text-[11px] bg-muted text-foreground border-border">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Right Column: State Machine Controls & Audit Trail */}
        <div className="space-y-6">
          <ModuleTransitionForm
            moduleId={mod.id}
            currentStatus={currentStatus}
            operatorRole={role}
          />

          {/* Revision History Audit Trail */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-4">
              <History className="size-4 text-primary" />
              Histórico de Revisões ({revisions.length})
            </h3>

            {revisions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum registro de auditoria anterior encontrado.
              </p>
            ) : (
              <div className="space-y-4">
                {revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="border-l-2 border-border pl-3 text-xs space-y-1 py-1"
                  >
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {ACTION_LABELS[rev.action] || rev.action}
                      </span>
                      <span>
                        {new Date(rev.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      De <span className="font-mono">{rev.from_status}</span> para{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {rev.to_status}
                      </span>
                    </p>

                    {rev.notes ? (
                      <p className="italic text-foreground/90 bg-muted/50 p-2 rounded text-[11px] mt-1">
                        &ldquo;{rev.notes}&rdquo;
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Feedback title="Auditoria Imutável">
            Todas as transições de status gravam o identificador do operador e
            as notas técnicas de forma indelével na tabela{" "}
            <code>module_revisions</code>.
          </Feedback>
        </div>
      </div>
    </div>
  );
}
