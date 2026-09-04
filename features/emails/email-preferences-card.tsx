"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/primitives";
import { updateEmailPreferencesAction } from "./actions";
import { CATEGORY_LABELS, type EmailPreferences } from "./contracts";
import { Bell, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface EmailPreferencesCardProps {
  initialPreferences: EmailPreferences;
}

export function EmailPreferencesCard({ initialPreferences }: EmailPreferencesCardProps) {
  const [preferences, setPreferences] = useState<EmailPreferences>(initialPreferences);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleToggle = (key: keyof EmailPreferences) => {
    setMessage(null);
    const updated = {
      ...preferences,
      [key]: !preferences[key],
      // If user enables any category, ensure unsubscribedAll is false
      ...(key !== "unsubscribedAll" && !preferences[key] ? { unsubscribedAll: false } : {}),
      // If user toggles unsubscribedAll to true, keep the preferences intact for restoration
    };
    setPreferences(updated);

    startTransition(async () => {
      const res = await updateEmailPreferencesAction(updated);
      if (res.ok && res.preferences) {
        setPreferences(res.preferences);
        setMessage({ type: "success", text: "Suas preferências de e-mail foram salvas." });
      } else {
        setMessage({
          type: "error",
          text: res.error || "Não foi possível salvar suas preferências. Tente novamente.",
        });
      }
    });
  };

  const handleToggleAll = () => {
    setMessage(null);
    const nextUnsubscribedAll = !preferences.unsubscribedAll;
    const updated = {
      ...preferences,
      unsubscribedAll: nextUnsubscribedAll,
    };
    setPreferences(updated);

    startTransition(async () => {
      const res = await updateEmailPreferencesAction(updated);
      if (res.ok && res.preferences) {
        setPreferences(res.preferences);
        setMessage({
          type: "success",
          text: nextUnsubscribedAll
            ? "Você pausou todos os e-mails com sucesso."
            : "Comunicações por e-mail reativadas.",
        });
      } else {
        setMessage({
          type: "error",
          text: res.error || "Não foi possível salvar. Tente novamente.",
        });
      }
    });
  };

  return (
    <Card id="emails">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Bell className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Comunicações por E-mail</h2>
          <p className="text-sm text-muted-foreground">
            Escolha o que você deseja receber. Respeitamos seu tempo e sua privacidade.
          </p>
        </div>
      </div>

      <div className="divide-y divide-border/60">
        {/* Training Reminders */}
        <label className="flex items-start justify-between py-4 cursor-pointer gap-4 min-h-12">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground block">
              {CATEGORY_LABELS.training_reminders.title}
            </span>
            <span className="text-xs text-muted-foreground block leading-relaxed">
              {CATEGORY_LABELS.training_reminders.description}
            </span>
          </div>
          <input
            type="checkbox"
            checked={preferences.trainingReminders && !preferences.unsubscribedAll}
            disabled={isPending || preferences.unsubscribedAll}
            onChange={() => handleToggle("trainingReminders")}
            className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary focus:ring-2 cursor-pointer disabled:opacity-40"
            aria-label={CATEGORY_LABELS.training_reminders.title}
          />
        </label>

        {/* Milestone Celebrations */}
        <label className="flex items-start justify-between py-4 cursor-pointer gap-4 min-h-12">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground block">
              {CATEGORY_LABELS.milestone_celebrations.title}
            </span>
            <span className="text-xs text-muted-foreground block leading-relaxed">
              {CATEGORY_LABELS.milestone_celebrations.description}
            </span>
          </div>
          <input
            type="checkbox"
            checked={preferences.milestoneCelebrations && !preferences.unsubscribedAll}
            disabled={isPending || preferences.unsubscribedAll}
            onChange={() => handleToggle("milestoneCelebrations")}
            className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary focus:ring-2 cursor-pointer disabled:opacity-40"
            aria-label={CATEGORY_LABELS.milestone_celebrations.title}
          />
        </label>

        {/* Billing Notifications */}
        <label className="flex items-start justify-between py-4 cursor-pointer gap-4 min-h-12">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground block">
              {CATEGORY_LABELS.billing_notifications.title}
            </span>
            <span className="text-xs text-muted-foreground block leading-relaxed">
              {CATEGORY_LABELS.billing_notifications.description}
            </span>
          </div>
          <input
            type="checkbox"
            checked={preferences.billingNotifications && !preferences.unsubscribedAll}
            disabled={isPending || preferences.unsubscribedAll}
            onChange={() => handleToggle("billingNotifications")}
            className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary focus:ring-2 cursor-pointer disabled:opacity-40"
            aria-label={CATEGORY_LABELS.billing_notifications.title}
          />
        </label>

        {/* Marketing Tips (Opt-in by default) */}
        <label className="flex items-start justify-between py-4 cursor-pointer gap-4 min-h-12">
          <div className="space-y-1">
            <span className="text-sm font-medium text-foreground block">
              {CATEGORY_LABELS.marketing_tips.title}
            </span>
            <span className="text-xs text-muted-foreground block leading-relaxed">
              {CATEGORY_LABELS.marketing_tips.description}
            </span>
          </div>
          <input
            type="checkbox"
            checked={preferences.marketingTips && !preferences.unsubscribedAll}
            disabled={isPending || preferences.unsubscribedAll}
            onChange={() => handleToggle("marketingTips")}
            className="mt-1 h-5 w-5 rounded border-border text-primary focus:ring-primary focus:ring-2 cursor-pointer disabled:opacity-40"
            aria-label={CATEGORY_LABELS.marketing_tips.title}
          />
        </label>

        {/* Opt-out Global */}
        <label className="flex items-start justify-between py-4 cursor-pointer gap-4 min-h-12 bg-muted/20 -mx-6 px-6 rounded-b-2xl">
          <div className="space-y-1">
            <span className="text-sm font-medium text-destructive block">
              Pausar todos os e-mails
            </span>
            <span className="text-xs text-muted-foreground block leading-relaxed">
              Não enviar nenhum lembrete, aviso ou novidade para esta conta.
            </span>
          </div>
          <input
            type="checkbox"
            checked={preferences.unsubscribedAll}
            disabled={isPending}
            onChange={handleToggleAll}
            className="mt-1 h-5 w-5 rounded border-destructive text-destructive focus:ring-destructive focus:ring-2 cursor-pointer"
            aria-label="Pausar todos os e-mails"
          />
        </label>
      </div>

      {isPending && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" aria-hidden="true" />
          <span>Salvando alterações...</span>
        </div>
      )}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
          )}
          <span>{message.text}</span>
        </div>
      )}
    </Card>
  );
}
