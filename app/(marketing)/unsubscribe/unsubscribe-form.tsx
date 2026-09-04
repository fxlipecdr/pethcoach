"use client";

import { useState, useTransition } from "react";
import { unsubscribeByTokenAction, resubscribeByTokenAction } from "@/features/emails/actions";
import { CATEGORY_LABELS, type EmailCategory } from "@/features/emails/contracts";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UnsubscribeFormProps {
  token: string;
  category?: EmailCategory;
  all?: boolean;
}

export function UnsubscribeForm({ token, category, all }: UnsubscribeFormProps) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "unsubscribed" | "resubscribed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unsubscribedScope, setUnsubscribedScope] = useState<"category" | "all">(
    all || !category ? "all" : "category",
  );

  const categoryLabel = category ? CATEGORY_LABELS[category]?.title : null;

  const handleUnsubscribe = (scope: "category" | "all") => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await unsubscribeByTokenAction({
        token,
        category: scope === "category" ? category : undefined,
        all: scope === "all",
      });

      if (res.ok) {
        setUnsubscribedScope(scope);
        setStatus("unsubscribed");
      } else {
        setErrorMessage(res.error || "Não foi possível processar sua solicitação.");
        setStatus("error");
      }
    });
  };

  const handleResubscribe = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await resubscribeByTokenAction({
        token,
        category: unsubscribedScope === "category" ? category : undefined,
        all: unsubscribedScope === "all",
      });

      if (res.ok) {
        setStatus("resubscribed");
      } else {
        setErrorMessage(res.error || "Não foi possível reativar.");
        setStatus("error");
      }
    });
  };

  if (status === "unsubscribed") {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-sm">Preferência atualizada com sucesso</p>
              <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                {unsubscribedScope === "all"
                  ? "Você não receberá mais nenhum e-mail da PethCoach."
                  : `Você não receberá mais e-mails da categoria "${categoryLabel}".`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleResubscribe}
            disabled={isPending}
            className="text-xs min-h-11"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />}
            Desfazer (cliquei por engano)
          </Button>

          <Button asChild variant="default" className="text-xs min-h-11">
            <Link href="/" className="inline-flex items-center gap-1.5">
              Voltar ao PethCoach
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "resubscribed") {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-sm">Notificações reativadas</p>
              <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                Suas mensagens continuarão chegando normalmente.
              </p>
            </div>
          </div>
        </div>

        <Button asChild variant="default" className="text-xs min-h-11">
          <Link href="/" className="inline-flex items-center gap-1.5">
            Voltar à Página Inicial
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {category && categoryLabel ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            Você está descadastrando da categoria: <strong>{categoryLabel}</strong>.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Se preferir, você pode pausar apenas este tipo de comunicação ou optar por não receber mais nenhuma mensagem.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">
          Confirme abaixo se deseja pausar o envio de comunicações por e-mail da sua conta PethCoach.
        </p>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        {category && categoryLabel && (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleUnsubscribe("category")}
            disabled={isPending}
            className="w-full justify-center min-h-12 text-sm font-medium"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Cancelar apenas &quot;{categoryLabel}&quot;
          </Button>
        )}

        <Button
          type="button"
          variant="destructive"
          onClick={() => handleUnsubscribe("all")}
          disabled={isPending}
          className="w-full justify-center min-h-12 text-sm font-medium"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          Não receber nenhum e-mail da PethCoach
        </Button>
      </div>
    </div>
  );
}
