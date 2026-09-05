"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { transitionModuleStatusAction } from "@/features/admin/actions";
import {
  ALLOWED_TRANSITIONS,
  ADMIN_ONLY_STATUSES,
  type ModuleStatus,
  type OperatorRole,
} from "@/features/admin/contracts";

const STATUS_LABELS: Record<ModuleStatus, string> = {
  draft: "Rascunho (draft)",
  reviewed: "Revisado (reviewed)",
  published: "Publicado (published)",
  archived: "Arquivado (archived)",
};

interface ModuleTransitionFormProps {
  moduleId: string;
  currentStatus: ModuleStatus;
  operatorRole: OperatorRole;
}

export function ModuleTransitionForm({
  moduleId,
  currentStatus,
  operatorRole,
}: ModuleTransitionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState<ModuleStatus | "">("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const availableTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedStatus) {
      setErrorMessage("Selecione o novo status de destino.");
      return;
    }

    if (!notes.trim() || notes.trim().length < 3) {
      setErrorMessage("O parecer técnico deve conter pelo menos 3 caracteres.");
      return;
    }

    if (ADMIN_ONLY_STATUSES.includes(selectedStatus) && operatorRole !== "admin") {
      setErrorMessage("Apenas administradores podem publicar ou arquivar módulos.");
      return;
    }

    startTransition(async () => {
      const res = await transitionModuleStatusAction({
        moduleId,
        toStatus: selectedStatus,
        notes: notes.trim(),
      });

      if (!res.ok) {
        setErrorMessage(res.error || "Erro ao processar transição.");
      } else {
        setSuccessMessage(
          `Status alterado com sucesso para "${STATUS_LABELS[selectedStatus]}".`,
        );
        setSelectedStatus("");
        setNotes("");
        router.refresh();
      }
    });
  };

  if (availableTransitions.length === 0) {
    return (
      <Card className="p-5 border-dashed">
        <p className="text-sm text-muted-foreground">
          Nenhuma transição adicional permitida a partir deste status.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
        <ArrowRight className="size-4 text-primary-strong" />
        Transição de Ciclo de Vida
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Atualize o status editorial do módulo acompanhado de parecer técnico fundamentado.
      </p>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-control border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="mt-4 flex items-start gap-2 rounded-control border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300"
        >
          <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="target-status"
            className="block text-xs font-semibold text-foreground mb-1"
          >
            Novo Status de Destino <span className="text-destructive">*</span>
          </label>
          <select
            id="target-status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as ModuleStatus)}
            disabled={isPending}
            className="w-full rounded-control border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
          >
            <option value="">Selecione uma transição...</option>
            {availableTransitions.map((st) => {
              const isAdminOnly = ADMIN_ONLY_STATUSES.includes(st);
              const isBlocked = isAdminOnly && operatorRole !== "admin";
              return (
                <option key={st} value={st} disabled={isBlocked}>
                  {STATUS_LABELS[st]}
                  {isBlocked ? " (Requer perfil Administrador)" : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label
            htmlFor="transition-notes"
            className="block text-xs font-semibold text-foreground mb-1"
          >
            Parecer Técnico / Justificativa Editorial{" "}
            <span className="text-destructive">*</span>
          </label>
          <textarea
            id="transition-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            placeholder="Ex: Conteúdo revisado tecnicamente conforme diretrizes de reforço positivo sem aversivos..."
            className="w-full rounded-control border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50 resize-y"
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Mínimo 3 e máximo 1000 caracteres. Ficará registrado permanentemente no histórico de auditoria.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            type="submit"
            disabled={isPending || !selectedStatus || !notes.trim()}
            className="gap-2 w-full sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Processando...</span>
              </>
            ) : (
              <span>Confirmar Transição</span>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
}
