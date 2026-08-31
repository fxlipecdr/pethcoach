import { notFound } from "next/navigation";
import { z } from "zod";
import { AuthShell } from "@/components/layouts/auth-shell";
import { WorkspaceShell } from "@/components/layouts/workspace-shell";
import {
  PageContainer,
  PageHeading,
} from "@/components/layouts/page-container";
import { AccessState } from "@/components/pethcoach/access-state";
import { Card, EmptyState, Skeleton } from "@/components/ui/primitives";
import { Feedback } from "@/components/ui/feedback";
import { Stepper } from "@/components/ui/stepper";

export const dynamic = "force-dynamic";
const layoutSchema = z.enum(["auth", "app", "flow", "admin"]);

export default async function LayoutPreview({
  params,
}: {
  params: Promise<{ layout: string }>;
}) {
  // This is an isolated presentation fixture, never an alternative to route authorization.
  if (process.env.NODE_ENV !== "development") notFound();
  const parsed = layoutSchema.safeParse((await params).layout);
  if (!parsed.success) notFound();
  const layout = parsed.data;
  if (layout === "auth")
    return (
      <AuthShell preview>
        <AccessState />
      </AuthShell>
    );
  if (layout === "flow")
    return (
      <WorkspaceShell area="app" preview>
        <PageContainer size="flow">
          <PageHeading
            eyebrow="PRÉVIA DO FLUXO"
            title="Um foco de cada vez"
            description="Uma coluna de até 720 px para os futuros fluxos de quiz e treino. Nenhuma orientação ou resposta real é apresentada."
          />
          <Card>
            <Stepper
              steps={["Preparação", "Prática", "Registro"]}
              current={0}
              label="Estrutura de exemplo"
            />
            <div className="mt-8 rounded-control border border-border p-5">
              <h2 className="text-lg font-semibold">
                O conteúdo virá na etapa certa.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Exercícios, duração e critérios de segurança só serão
                apresentados após a implementação e revisão do catálogo.
              </p>
            </div>
            <div className="mt-6" aria-busy="true">
              <span className="sr-only">Exemplo visual de carregamento</span>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-3 h-4 w-4/5" />
            </div>
          </Card>
          <Feedback
            className="mt-5"
            title="Estrutura visual, sem treino gerado"
          >
            Esta tela serve apenas para conferir leitura, espaçamento e
            navegação.
          </Feedback>
        </PageContainer>
      </WorkspaceShell>
    );
  const admin = layout === "admin";
  return (
    <WorkspaceShell area={admin ? "admin" : "app"} preview>
      <PageHeading
        eyebrow={admin ? "OPERAÇÃO E CONTEÚDO" : "O ESPAÇO DA ROTINA"}
        title={
          admin
            ? "Cuidado também nos bastidores"
            : "A rotina de vocês começa aqui"
        }
        description={
          admin
            ? "Estrutura da área administrativa. Não há catálogo publicado, revisões ou dados de usuários nesta prévia."
            : "Estrutura da área pessoal. Nenhum cão, plano ou histórico foi criado para esta demonstração."
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <EmptyState
          title={
            admin
              ? "O catálogo ainda não está disponível"
              : "Ainda não há um plano"
          }
        >
          <p className="text-sm">
            {admin
              ? "A edição estruturada, revisão e publicação serão implementadas em P13."
              : "O perfil do cão entra em P2. Os planos e o treino diário entram após a revisão de conteúdo, em P7 e P8."}
          </p>
        </EmptyState>
        <Card>
          <h2 className="text-lg font-semibold">
            {admin ? "Acesso controlado" : "Um passo possível por vez"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {admin
              ? "No ambiente real, esta área exige uma sessão validada e permissão administrativa verificada no servidor."
              : "Este espaço reunirá a rotina de vocês, com ações claras e sem pressão para cumprir metas artificiais."}
          </p>
          <div className="mt-6">
            <Feedback title="Recursos em preparação">
              Sem métricas, perfis ou resultados fictícios.
            </Feedback>
          </div>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
