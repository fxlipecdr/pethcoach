import { notFound } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Archive,
  BookOpen,
  SearchCheck,
  Clock,
  Gauge,
  History,
} from "lucide-react";
import { WorkspaceShell } from "@/components/layouts/workspace-shell";
import { PageHeading } from "@/components/layouts/page-container";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";

export const dynamic = "force-dynamic";

export default function DevAdminPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <WorkspaceShell area="admin" preview>
      <div className="space-y-8">
        <PageHeading
          eyebrow="PRÉVIA ADMINISTRATIVA"
          title="Gestão de Conteúdo e Operação"
          description="Ambiente de desenvolvimento para validação de layout, fluxos editoriais e testes de acessibilidade (WCAG 2.2 AA)."
        />

        {/* Operator session badge mock */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-control bg-secondary text-primary-strong">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Sessão de demonstração (Fixture)
              </p>
              <p className="font-semibold text-foreground">
                Administrador Geral (Demonstração)
              </p>
            </div>
          </div>
          <Badge>ADMIN (MOCK)</Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-primary-strong">
              <CheckCircle2 className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Publicados
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">14</p>
            <p className="text-xs text-muted-foreground">Visíveis aos tutores</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <FileEdit className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Em Revisão
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertCircle className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Rascunhos
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">2</p>
            <p className="text-xs text-muted-foreground">Em elaboração</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Archive className="size-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Arquivados
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">1</p>
            <p className="text-xs text-muted-foreground">Descontinuados</p>
          </Card>
        </div>

        {/* Catalog Preview Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="size-4 text-primary-strong" />
              Exemplo de Catálogo e Módulos
            </h2>
            <Badge className="bg-muted text-foreground border-border">Prévia de Componentes</Badge>
          </div>

          <div className="grid gap-3">
            {[
              {
                title: "Redirecionamento de Mordidas com Brinquedo Texturizado",
                slug: "redirecionamento-brinquedo",
                problem: "Filhote Mordendo",
                status: "Publicado",
                badgeClass:
                  "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
                duration: "5 min/dia",
                difficulty: "Iniciante",
              },
              {
                title: "Protocolo de Superfície Adequada e Recompensa Imediata",
                slug: "superficie-adequada",
                problem: "Xixi no Lugar Errado",
                status: "Revisado",
                badgeClass:
                  "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
                duration: "8 min/dia",
                difficulty: "Intermediário",
              },
              {
                title: "Caminhada em Foco com Paradas Estruturadas",
                slug: "caminhada-foco",
                problem: "Passeio sem Puxar",
                status: "Rascunho",
                badgeClass:
                  "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
                duration: "10 min/dia",
                difficulty: "Intermediário",
              },
            ].map((m) => (
              <Card
                key={m.slug}
                className="p-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${m.badgeClass}`}
                    >
                      {m.status}
                    </span>
                    <Badge className="text-[11px] bg-muted text-foreground border-border">
                      {m.problem}
                    </Badge>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {m.title}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" /> {m.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Gauge className="size-3" /> {m.difficulty}
                    </span>
                    <span className="font-mono text-[11px]">{m.slug}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Simular Edição
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Audit Trail & State Machine Preview */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-2">
              <History className="size-4 text-primary-strong" />
              Auditoria de Transições
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Cada mudança de estado gera um registro imutável com operador e
              parecer técnico.
            </p>
            <div className="space-y-3">
              <div className="border-l-2 border-border pl-3 text-xs space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Aprovação para publicação</span>
                  <span className="text-muted-foreground">04/09/2026</span>
                </div>
                <p className="text-muted-foreground">
                  De <span className="font-mono">reviewed</span> para{" "}
                  <span className="font-mono font-semibold text-foreground">
                    published
                  </span>
                </p>
                <p className="italic bg-muted/40 p-1.5 rounded text-[11px]">
                  &ldquo;Módulo auditado: 100% de conformidade com reforço positivo.&rdquo;
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-2">
              <SearchCheck className="size-4 text-primary-strong" />
              Inspetor Operacional (Zero PII)
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Visualização segura de diagnósticos e entregas de e-mails com
              mascaramento de dados sensíveis.
            </p>
            <div className="rounded-control border border-border bg-muted/20 p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-mono">jo***o@exemplo.com.br</span>
                <span className="text-emerald-800 dark:text-emerald-300 font-medium text-[11px]">
                  ✓ Enviado
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Template: welcome · Idempotência: welcome:usr_4821...
              </p>
            </div>
          </Card>
        </div>

        <Feedback title="Aviso de Desenvolvimento">
          Esta tela é um componente de demonstração visual isolado para
          testes automatizados e revisão de ergonomia mobile. No ambiente de
          produção, as rotas sob <code>/admin/*</code> são protegidas por
          verificação estrita no servidor e Supabase RLS.
        </Feedback>
      </div>
    </WorkspaceShell>
  );
}
