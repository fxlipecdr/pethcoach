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
  Sparkles,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { PethMascot, type MascotMood } from "@/components/pethcoach/peth-mascot";

const scenarios = [
  {
    id: "passeio",
    label: "Passeio",
    icon: Route,
    tone: "bg-sage/70",
    mascotMood: "encouraging" as MascotMood,
    title: "Mais parceria no passeio.",
    context: "O ambiente, a guia e o ritmo de vocês fazem parte da conversa.",
  },
  {
    id: "brincadeira",
    label: "Brincadeira",
    icon: Dog,
    tone: "bg-peach/70",
    mascotMood: "happy" as MascotMood,
    title: "Brincar também é aprender.",
    context:
      "A idade, a energia e a rotina do filhote ajudam a entender o contexto.",
  },
  {
    id: "casa",
    label: "Em casa",
    icon: Droplets,
    tone: "bg-lavender/70",
    mascotMood: "thinking" as MascotMood,
    title: "Uma casa, uma nova rotina.",
    context: "Os espaços e os horários da casa fazem parte dessa história.",
  },
] as const;

const stages = [
  {
    label: "Entender",
    title: "Primeiro, conhecer vocês.",
    icon: MessageCircle,
    mascotMood: "thinking" as MascotMood,
    detail: "",
  },
  {
    label: "Praticar",
    title: "Um passo que cabe no dia.",
    icon: Footprints,
    mascotMood: "encouraging" as MascotMood,
    detail:
      "A proposta é reunir orientações curtas, com preparação, passos claros e limites de segurança.",
  },
  {
    label: "Acompanhar",
    title: "Perceber as pequenas mudanças.",
    icon: ChartNoAxesCombined,
    mascotMood: "celebrating" as MascotMood,
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

  const currentScenario = scenarios.find((s) => s.id === scenario) ?? scenarios[0];
  const activeMascotMood: MascotMood = stage === 0 ? currentScenario.mascotMood : currentStage.mascotMood;

  return (
    <div className="preview-shell relative rounded-[2.25rem] border-2 border-border/80 bg-card p-3.5 shadow-preview sm:p-5 transition-all">
      {/* Barra de status superior simulando app mobile */}
      <div className="flex items-center justify-between gap-2 px-3 pt-1 pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
          <span className="font-bold text-foreground tracking-tight text-xs">
            Uma ideia da experiência
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-secondary/60 px-3 py-1 text-[10px] font-bold tracking-wider text-primary">
          <Sparkles className="size-3" aria-hidden="true" />
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
        <TabsList aria-label="Contexto da prévia" className="p-1 rounded-2xl bg-muted/60">
          {scenarios.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className="rounded-xl font-bold transition-all data-[state=active]:shadow-xs"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {scenarios.map((item) => {
          return (
            <TabsContent key={item.id} value={item.id} className="mt-3">
              {/* Header do cenário com o mascote Peth */}
              <div
                className={`relative flex min-h-44 items-center gap-4 overflow-hidden rounded-3xl p-5 sm:p-6 border border-border/50 shadow-inner ${item.tone}`}
              >
                <div className="relative z-10 flex-1">
                  <p className="text-[11px] font-bold tracking-[0.15em] text-brand-700 uppercase">
                    CADA ROTINA É ÚNICA
                  </p>
                  <p className="mt-2.5 max-w-56 text-[1.65rem] leading-[1.18] font-bold tracking-tight text-foreground">
                    {item.title}
                  </p>
                </div>

                <div className="relative flex shrink-0 items-center justify-center">
                  <PethMascot
                    mood={activeMascotMood}
                    size={84}
                    className="drop-shadow-md motion-safe:hover:scale-105 transition-transform"
                  />
                  <span
                    className="absolute -right-2 -bottom-1 flex size-7 items-center justify-center rounded-full bg-card shadow-xs text-xs font-bold text-primary border border-border"
                    aria-hidden="true"
                  >
                    {stage + 1}
                  </span>
                </div>
              </div>

              {/* Corpo da etapa com Stepper e feedback */}
              <div className="px-3 pt-6 pb-2 sm:px-4">
                <Stepper
                  steps={stages.map((step) => step.label)}
                  current={stage}
                  label="Etapas da prévia"
                />

                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className="mt-6 min-h-32"
                >
                  <motion.div
                    key={`${item.id}-${stage}`}
                    initial={reducedMotion ? false : { opacity: 0.6, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.18 }}
                    className="rounded-2xl border border-border/70 bg-muted/20 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-primary">
                      <StageIcon className="size-4" aria-hidden="true" />{" "}
                      {currentStage.label} · Etapa {stage + 1} de 3
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">
                      {currentStage.title}
                    </h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {stage === 0 ? item.context : currentStage.detail}
                    </p>
                  </motion.div>
                </div>

                <Button
                  variant="outline"
                  className="mt-5 w-full justify-between rounded-2xl font-bold py-3.5"
                  onClick={() =>
                    setStage((value) => (value + 1) % stages.length)
                  }
                >
                  {stage === stages.length - 1
                    ? "Voltar à primeira etapa"
                    : `Ver etapa ${nextStage.label}`}
                  {stage === stages.length - 1 ? (
                    <RotateCcw className="size-4" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      <p className="px-3 pt-4 pb-1 text-center text-xs leading-relaxed text-muted-foreground">
        Demonstração interativa. Não gera nem salva um treino.
      </p>
    </div>
  );
}
