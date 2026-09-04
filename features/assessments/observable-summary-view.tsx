"use client";

import { useEffect } from "react";
import { Check, Sparkles, Target } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { analytics } from "@/lib/posthog/client";
import type { ObservableSummary } from "./contracts";

type ObservableSummaryViewProps = {
  summary: ObservableSummary;
};

export function ObservableSummaryView({ summary }: ObservableSummaryViewProps) {
  useEffect(() => {
    void analytics.capture("result_viewed", {
      segment: "continue",
      plan_eligible: true,
    });
  }, []);
  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2">
          <Badge>
            <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
            SÍNTESE DAS SUAS RESPOSTAS
          </Badge>
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          O que observamos sobre {summary.problemTitle.toLowerCase()}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Com base nas respostas fornecidas, organizamos os principais pontos do
          ambiente e da rotina atual de vocês.
        </p>

        {summary.strengths.length > 0 ? (
          <div className="mt-6 rounded-2xl bg-emerald-50/70 p-5 border border-emerald-200/80 dark:bg-emerald-950/30 dark:border-emerald-800/40">
            <h3 className="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-300">
              <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Pontos positivos observados
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-emerald-800/95 dark:text-emerald-400 font-medium">
              {summary.strengths.map((strength) => (
                <li key={strength} className="flex items-start gap-2.5">
                  <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6 rounded-2xl bg-secondary/50 p-5 border border-border/60">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Target className="size-4 text-primary" aria-hidden="true" />
            Focos prioritários de manejo e treino positivo
          </h3>
          <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            {summary.focusPoints.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 border-t border-border/60 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Resumo das situações observadas
          </h3>
          <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
            {summary.observations.map((item) => (
              <div
                key={item.key}
                className="rounded-2xl border border-border/60 bg-secondary/30 p-4 text-xs transition-colors hover:border-primary/40"
              >
                <p className="font-semibold text-foreground">{item.questionPrompt}</p>
                <p className="mt-1.5 font-medium text-primary">
                  {item.answerLabel}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
