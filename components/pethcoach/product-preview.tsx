"use client";

import { useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Dog,
  Droplets,
  Footprints,
  MessageCircle,
  Route,
  RotateCcw,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";

const scenarios = [
  {
    id: "passeio",
    label: "Passeio",
    icon: Route,
    tone: "bg-sage",
    title: "Mais parceria no passeio.",
    context: "O ambiente, a guia e o ritmo de vocês fazem parte da conversa.",
  },
  {
    id: "brincadeira",
    label: "Brincadeira",
    icon: Dog,
    tone: "bg-peach",
    title: "Brincar também é aprender.",
    context:
      "A idade, a energia e a rotina do filhote ajudam a entender o contexto.",
  },
  {
    id: "casa",
    label: "Em casa",
    icon: Droplets,
    tone: "bg-lavender",
    title: "Uma casa, uma nova rotina.",
    context: "Os espaços e os horários da casa fazem parte dessa história.",
  },
] as const;
const stages = [
  {
    label: "Entender",
    title: "Primeiro, conhecer vocês.",
    icon: MessageCircle,
    detail: "",
  },
  {
    label: "Praticar",
    title: "Um passo que cabe no dia.",
    icon: Footprints,
    detail:
      "A proposta é reunir orientações curtas, com preparação, passos claros e limites de segurança.",
  },
  {
    label: "Acompanhar",
    title: "Perceber as pequenas mudanças.",
    icon: ChartNoAxesCombined,
    detail:
      "Check-ins simples ajudarão a registrar a experiência, respeitando o ritmo de cada cão.",
  },
] as const;

function subscribeMotionPreference(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
const getMotionPreference = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const getServerMotionPreference = () => true;

export function ProductPreview() {
  const [scenario, setScenario] = useState("passeio");
  const [stage, setStage] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeMotionPreference,
    getMotionPreference,
    getServerMotionPreference,
  );
  const currentStage = stages[stage] ?? stages[0];
  const nextStage = stages[(stage + 1) % stages.length] ?? stages[0];
  const StageIcon = currentStage.icon;

  return (
    <div className="preview-shell relative rounded-[1.75rem] border border-border bg-card p-3 shadow-preview sm:p-4">
      <div className="flex items-center justify-between gap-2 px-3 pt-2 pb-4 text-xs">
        <span className="font-medium text-foreground">
          Uma ideia da experiência
        </span>
        <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground">
          PRÉVIA
        </span>
      </div>
      <Tabs
        value={scenario}
        onValueChange={(value) => {
          setScenario(value);
          setStage(0);
        }}
      >
        <TabsList aria-label="Contexto da prévia">
          {scenarios.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {scenarios.map((item) => {
          const Icon = item.icon;
          return (
            <TabsContent key={item.id} value={item.id} className="mt-3">
              <div
                className={`relative flex min-h-40 items-center gap-5 overflow-hidden rounded-2xl p-5 sm:p-6 ${item.tone}`}
              >
                <div className="relative z-10 flex-1">
                  <p className="text-[10px] font-semibold tracking-[0.14em] text-brand-700">
                    CADA ROTINA É ÚNICA
                  </p>
                  <p className="mt-3 max-w-56 text-[1.6rem] leading-[1.2] font-medium tracking-tight text-foreground">
                    {item.title}
                  </p>
                </div>
                <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-card/35 sm:size-24">
                  <Icon
                    className="size-10 text-brand-700 sm:size-12"
                    strokeWidth={1.1}
                    aria-hidden="true"
                  />
                  <span
                    className="absolute -right-1 bottom-0 flex size-7 items-center justify-center rounded-full bg-card text-xs font-medium text-primary"
                    aria-hidden="true"
                  >
                    {stage + 1}
                  </span>
                </div>
              </div>
              <div className="px-3 pt-6 pb-2 sm:px-4">
                <Stepper
                  steps={stages.map((step) => step.label)}
                  current={stage}
                  label="Etapas da prévia"
                />
                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className="mt-6 min-h-35"
                >
                  <motion.div
                    key={`${item.id}-${stage}`}
                    initial={reducedMotion ? false : { opacity: 0.6, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.18 }}
                  >
                    <div className="mb-3 flex items-center gap-2 text-xs font-medium text-primary">
                      <StageIcon className="size-4" aria-hidden="true" />{" "}
                      {currentStage.label} · Etapa {stage + 1} de 3
                    </div>
                    <h2 className="text-lg font-semibold tracking-tight">
                      {currentStage.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {stage === 0 ? item.context : currentStage.detail}
                    </p>
                  </motion.div>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full justify-between"
                  onClick={() =>
                    setStage((value) => (value + 1) % stages.length)
                  }
                >
                  {stage === stages.length - 1
                    ? "Voltar à primeira etapa"
                    : `Ver etapa ${nextStage.label}`}
                  {stage === stages.length - 1 ? (
                    <RotateCcw aria-hidden="true" />
                  ) : (
                    <ArrowRight aria-hidden="true" />
                  )}
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
      <p className="px-3 pt-4 pb-2 text-center text-[11px] leading-relaxed text-muted-foreground">
        Demonstração interativa. Não gera nem salva um treino.
      </p>
    </div>
  );
}
