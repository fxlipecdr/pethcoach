import { requireOperator } from "@/lib/security/auth";
import { PageHeading } from "@/components/layouts/page-container";
import { Feedback } from "@/components/ui/feedback";
import { InspectorSearchPanel } from "@/components/admin/inspector-search-panel";

export const dynamic = "force-dynamic";

export default async function AdminInspectorPage() {
  await requireOperator(["admin", "reviewer", "operator"]);

  return (
    <div className="space-y-8">
      <PageHeading
        eyebrow="SUPORTE TÉCNICO E AUDITORIA"
        title="Inspetor Operacional (Zero PII)"
        description="Diagnóstico e investigação técnica de funis comportamentais, assinaturas ativas e logs de disparo de e-mails em estrita conformidade com a LGPD."
      />

      <Feedback title="Garantia de Privacidade e LGPD (Zero PII)">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Esta ferramenta foi desenvolvida com controles criptográficos e mascaramento irreversível.
          Nenhum conteúdo livre escrito pelo tutor, diagnóstico médico ou endereço de e-mail desmascarado
          é exposto nesta interface ou persistido em logs do cliente.
        </p>
      </Feedback>

      <InspectorSearchPanel />
    </div>
  );
}
