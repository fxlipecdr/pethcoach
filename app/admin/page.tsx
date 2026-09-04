import Link from "next/link";
import { BookOpen, SearchCheck, ShieldCheck, CheckCircle2, AlertCircle, FileEdit, Archive } from "lucide-react";
import { requireOperator } from "@/lib/security/auth";
import { PageHeading } from "@/components/layouts/page-container";
import { Card, Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { listAllModulesForAdmin } from "@/features/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { role } = await requireOperator(["admin", "reviewer", "operator"]);
  const modules = await listAllModulesForAdmin();

  const counts = {
    published: modules.filter((m) => m.status === "published").length,
    reviewed: modules.filter((m) => m.status === "reviewed").length,
    draft: modules.filter((m) => m.status === "draft").length,
    archived: modules.filter((m) => m.status === "archived").length,
  };

  const roleLabel = {
    admin: "Administrador Geral",
    reviewer: "Revisor Técnico",
    operator: "Operador de Suporte",
  }[role];

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="PAINEL ADMINISTRATIVO"
        title="Operação e Conteúdo"
        description="Gestão editorial do catálogo de treinos, auditoria de ciclo de vida e suporte técnico operacional com conformidade Zero PII."
      />

      {/* Operator session badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-control bg-secondary text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Sessão operacional autenticada</p>
            <p className="font-semibold text-foreground">{roleLabel}</p>
          </div>
        </div>
        <Badge>{role.toUpperCase()}</Badge>
      </div>

      {/* Module status metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Publicados</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{counts.published}</p>
          <p className="text-xs text-muted-foreground">Visíveis aos tutores</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <FileEdit className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Em Revisão</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{counts.reviewed}</p>
          <p className="text-xs text-muted-foreground">Aguardando publicação</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <AlertCircle className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Rascunhos</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{counts.draft}</p>
          <p className="text-xs text-muted-foreground">Em elaboração</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Archive className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Arquivados</span>
          </div>
          <p className="mt-2 text-2xl font-bold">{counts.archived}</p>
          <p className="text-xs text-muted-foreground">Fora de circulação</p>
        </Card>
      </div>

      {/* Section shortcuts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col justify-between p-6">
          <div className="space-y-3">
            <div className="flex size-10 items-center justify-center rounded-control bg-secondary text-primary">
              <BookOpen className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Catálogo de Treinos</h2>
            <p className="text-sm text-muted-foreground">
              Revise, aprove e publique módulos educativos. Todo conteúdo passa por validação determinística de reforço positivo antes da aprovação.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/admin/modulos">Acessar Catálogo</Link>
            </Button>
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-6">
          <div className="space-y-3">
            <div className="flex size-10 items-center justify-center rounded-control bg-secondary text-primary">
              <SearchCheck className="size-5" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Inspetor Operacional (Zero PII)</h2>
            <p className="text-sm text-muted-foreground">
              Investigue diagnósticos comportamentais, habilitações ativas e logs de entrega de e-mails de forma segura, com mascaramento estrito de dados pessoais.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/admin/inspector">Abrir Inspetor</Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Policy guidance */}
      <Feedback
        title="Diretrizes Inegociáveis de Conteúdo e Operação"
        className="text-xs"
      >
        <ul className="list-disc pl-4 space-y-1 mt-1 text-muted-foreground">
          <li><strong>Reforço Positivo Estrito:</strong> É vedada a menção a métodos aversivos, punição física, enforcador, tranco ou liderança de matilha.</li>
          <li><strong>Ciclo Editorial:</strong> Rascunhos só avançam para revisão por revisores/admins; a publicação final e arquivamento exigem nível Admin.</li>
          <li><strong>Privacidade LGPD:</strong> Nunca exponha e-mails completos, tokens ou dados pessoais em logs ou telas de suporte.</li>
        </ul>
      </Feedback>
    </div>
  );
}

