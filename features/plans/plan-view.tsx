"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { analytics } from "@/lib/posthog/client";
import {
  Award,
  CheckCircle2,
  Clock,
  Info,
  Lock,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { submitDailyCheckinAction, updatePlanTaskAction } from "./actions";
import {
  calculateNewMilestones,
  determineAdaptation,
  evaluateCheckinSafety,
} from "./adaptation";
import type {
  CheckinMood,
  DailyCheckin,
  DifficultyRating,
  Plan,
  PlanAdaptation,
  PlanMilestone,
  PlanTask,
  SafetyFlag,
} from "./contracts";
import { TimelineView } from "./timeline-view";

interface PlanViewProps {
  plan: Plan;
  dogId: string;
  dogName?: string;
  hasEntitlement?: boolean;
  initialCheckins?: DailyCheckin[];
  initialMilestones?: PlanMilestone[];
  initialAdaptations?: PlanAdaptation[];
  preview?: boolean;
}

export function PlanView({
  plan,
  dogId,
  dogName,
  hasEntitlement = false,
  initialCheckins = [],
  initialMilestones = [],
  initialAdaptations = [],
  preview = false,
}: PlanViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"treino" | "timeline">("treino");
  const [selectedDay, setSelectedDay] = useState(plan.currentDay);
  const [tasks, setTasks] = useState<PlanTask[]>(plan.tasks ?? []);
  const [checkins, setCheckins] = useState<DailyCheckin[]>(initialCheckins);
  const [milestones, setMilestones] =
    useState<PlanMilestone[]>(initialMilestones);
  const [adaptations, setAdaptations] =
    useState<PlanAdaptation[]>(initialAdaptations);

  const [selectedMood, setSelectedMood] = useState<CheckinMood | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyRating>("adequate");
  const [selectedSafetyFlag, setSelectedSafetyFlag] =
    useState<SafetyFlag>("none");
  const [checkinNotes, setCheckinNotes] = useState("");
  const [isCheckinSubmitting, setIsCheckinSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [safetyPause, setSafetyPause] = useState<{
    active: boolean;
    reason: string;
    recommendedAction: string;
  } | null>(
    plan.status === "paused"
      ? {
          active: true,
          reason:
            "O plano está em pausa preventiva para priorizar a saúde e a segurança do cão.",
          recommendedAction:
            "Consulte um médico-veterinário ou profissional comportamental qualificado antes de retomar os exercícios.",
        }
      : null,
  );

  const dayTasks = tasks.filter((t) => t.dayNumber === selectedDay);

  const dailyDuration = dayTasks.reduce(
    (acc, t) => acc + (t.module?.estimatedDurationMinutes ?? 0),
    0,
  );

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progressPercent =
    Math.round((completedCount / tasks.length) * 100) || 0;
  const isAllDayTasksCompleted =
    dayTasks.length > 0 && dayTasks.every((t) => t.status === "completed");

  const isDayLocked = selectedDay > 1 && !hasEntitlement;
  const dayCheckin = checkins.find((c) => c.dayNumber === selectedDay);

  useEffect(() => {
    if (isDayLocked) {
      void analytics.capture("paywall_viewed", {
        plan_type: "full_program",
        variant: `day_${selectedDay}`,
      });
    }
  }, [isDayLocked, selectedDay]);

  function handleToggleTask(task: PlanTask) {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    setActiveTaskId(task.id);
    setFeedback(null);

    if (nextStatus === "completed") {
      void analytics.capture("task_completed", {
        task_id: task.id,
        day_number: task.dayNumber,
        difficulty: "adequate",
      });

      if (task.dayNumber === 1 && completedCount === 0) {
        void analytics.capture("day1_started", {
          program_slug: plan.problemId ?? "geral",
          exercise_id: task.id,
        });
      }
    }

    if (preview) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: nextStatus,
                completedAt:
                  nextStatus === "completed" ? new Date().toISOString() : null,
              }
            : t,
        ),
      );
      setActiveTaskId(null);
      setFeedback({
        tone: "success",
        message:
          nextStatus === "completed"
            ? "Tarefa marcada como concluída! Excelente progresso."
            : "Tarefa reaberta para prática.",
      });
      return;
    }

    startTransition(async () => {
      const result = await updatePlanTaskAction({
        taskId: task.id,
        status: nextStatus,
        dogId,
      });

      setActiveTaskId(null);
      if (result.status === "error") {
        setFeedback({ tone: "error", message: result.message });
      } else {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  status: nextStatus,
                  completedAt:
                    nextStatus === "completed" ? new Date().toISOString() : null,
                }
              : t,
          ),
        );
        setFeedback({
          tone: "success",
          message:
            nextStatus === "completed"
              ? "Tarefa marcada como concluída! Excelente progresso."
              : "Tarefa reaberta para prática.",
        });
      }
    });
  }

  async function handleSubmitCheckin() {
    if (!selectedMood) return;
    setIsCheckinSubmitting(true);
    setFeedback(null);

    void analytics.capture("checkin_submitted", {
      day_number: selectedDay,
      difficulty: selectedDifficulty,
      mood: selectedMood,
    });

    const safety = evaluateCheckinSafety(selectedSafetyFlag);

    if (preview) {
      if (!safety.safe) {
        void analytics.capture("plan_adjusted", {
          reason_code: "safety_pause",
        });
        setSafetyPause({
          active: true,
          reason: safety.reason!,
          recommendedAction: safety.recommendedAction!,
        });
        setAdaptations((prev) => [
          {
            id: `mock-adapt-${Date.now()}`,
            planId: plan.id,
            userId: plan.userId,
            triggerCheckinId: null,
            adaptationType: "safety_pause",
            reason: safety.reason!,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setFeedback({
          tone: "error",
          message:
            "Treino pausado por segurança. Consulte as orientações na tela.",
        });
        setIsCheckinSubmitting(false);
        return;
      }

      const mockCheckin: DailyCheckin = {
        id: `mock-checkin-${selectedDay}`,
        planId: plan.id,
        dayNumber: selectedDay,
        userId: plan.userId,
        mood: selectedMood,
        difficultyRating: selectedDifficulty,
        safetyFlag: selectedSafetyFlag,
        notes: checkinNotes.trim() || null,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedCheckins = [
        ...checkins.filter((c) => c.dayNumber !== selectedDay),
        mockCheckin,
      ];
      setCheckins(updatedCheckins);

      // Evaluate milestones in preview
      const existingKeys = new Set(milestones.map((m) => m.key));
      const newlyEarned = calculateNewMilestones({
        dayNumber: selectedDay,
        mood: selectedMood,
        totalCheckinsCount: updatedCheckins.length,
        existingKeys,
      });

      if (newlyEarned.length > 0) {
        const newMilestoneObjects: PlanMilestone[] = newlyEarned.map((m) => ({
          id: `mock-ms-${m.key}`,
          planId: plan.id,
          userId: plan.userId,
          key: m.key,
          title: m.title,
          description: m.description,
          unlockedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }));
        setMilestones((prev) => [...prev, ...newMilestoneObjects]);
      }

      // Evaluate adaptations in preview
      const adaptationDecision = determineAdaptation({
        mood: selectedMood,
        difficultyRating: selectedDifficulty,
        recentCheckins: updatedCheckins,
      });

      if (adaptationDecision) {
        setAdaptations((prev) => [
          {
            id: `mock-adapt-${Date.now()}`,
            planId: plan.id,
            userId: plan.userId,
            triggerCheckinId: mockCheckin.id,
            adaptationType: adaptationDecision.adaptationType,
            reason: adaptationDecision.reason,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      }

      const isDayOneFree = selectedDay === 1 && !hasEntitlement;
      const milestoneNotice =
        newlyEarned.length > 0
          ? ` Marco desbloqueado: ${newlyEarned.map((m) => m.title).join(", ")}!`
          : "";

      setFeedback({
        tone: "success",
        message: isDayOneFree
          ? `Parabéns por concluir o Dia 1 Gratuito! Desbloqueie o plano completo para continuar.${milestoneNotice}`
          : `Check-in do Dia ${selectedDay} registrado com sucesso!${milestoneNotice}`,
      });
      setSelectedMood(null);
      setSelectedDifficulty("adequate");
      setSelectedSafetyFlag("none");
      setCheckinNotes("");
      setIsCheckinSubmitting(false);
      return;
    }

    try {
      const result = await submitDailyCheckinAction(
        {
          planId: plan.id,
          dayNumber: selectedDay,
          mood: selectedMood,
          difficultyRating: selectedDifficulty,
          safetyFlag: selectedSafetyFlag,
          notes: checkinNotes.trim() || undefined,
        },
        dogId,
      );

      if (result.status === "error") {
        setFeedback({ tone: "error", message: result.message });
      } else if (result.status === "safety_pause") {
        setSafetyPause({
          active: true,
          reason: result.message,
          recommendedAction: result.recommendedAction,
        });
        setFeedback({
          tone: "error",
          message:
            "Treino pausado por segurança. Consulte as orientações na tela.",
        });
      } else {
        setCheckins((prev) => [
          ...prev.filter((c) => c.dayNumber !== selectedDay),
          result.checkin,
        ]);
        if (result.newMilestones && result.newMilestones.length > 0) {
          setMilestones((prev) => [...prev, ...result.newMilestones!]);
        }
        if (result.adaptation) {
          setAdaptations((prev) => [result.adaptation!, ...prev]);
        }
        const milestoneNotice =
          result.newMilestones && result.newMilestones.length > 0
            ? ` Marco desbloqueado: ${result.newMilestones.map((m) => m.title).join(", ")}!`
            : "";

        setFeedback({
          tone: "success",
          message: result.requiresUpgrade
            ? `Parabéns por concluir o Dia 1 Gratuito! Desbloqueie o plano completo para continuar.${milestoneNotice}`
            : `Check-in do Dia ${selectedDay} registrado com sucesso!${milestoneNotice}`,
        });
        setSelectedMood(null);
        setSelectedDifficulty("adequate");
        setSelectedSafetyFlag("none");
        setCheckinNotes("");
      }
    } finally {
      setIsCheckinSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Visualização alternável: Treino do Dia vs Marcos & Linha do Tempo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Modo de visualização"
          className="inline-flex rounded-2xl border border-border/80 bg-muted/50 p-1 shadow-xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "treino"}
            onClick={() => setActiveTab("treino")}
            className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "treino"
                ? "bg-card text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Treino do Dia
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "timeline"}
            onClick={() => setActiveTab("timeline")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeTab === "timeline"
                ? "bg-card text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Award className="size-4 text-primary" aria-hidden="true" />
            Marcos & Linha do Tempo
            {milestones.length > 0 ? (
              <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-extrabold text-primary">
                {milestones.length}
              </span>
            ) : null}
          </button>
        </div>

        {adaptations.length > 0 ? (
          <Badge className="bg-secondary text-foreground font-semibold border-border">
            Ritmo adaptado ({adaptations.length}{" "}
            {adaptations.length === 1 ? "ajuste" : "ajustes"})
          </Badge>
        ) : null}
      </div>

      {feedback ? (
        <Feedback
          tone={feedback.tone}
          title={feedback.tone === "success" ? "Progresso salvo" : "Atenção"}
        >
          {feedback.message}
        </Feedback>
      ) : null}

      {/* Renderiza a aba ativa */}
      {activeTab === "timeline" ? (
        <TimelineView
          checkins={checkins}
          milestones={milestones}
          adaptations={adaptations}
          dogName={dogName}
        />
      ) : safetyPause?.active ? (
        /* Tela de Pausa Consciente / Red Flag de Segurança */
        <Card className="p-8 rounded-3xl border-2 border-warning/40 bg-warning/5 text-center shadow-card">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-warning/15">
            <PethMascot mood="resting" size={64} />
          </div>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-warning/20 px-3.5 py-1 text-xs font-bold text-warning-foreground">
            <ShieldAlert className="size-4" /> Pausa Consciente Ativada
          </div>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
            O bem-estar e a segurança vêm sempre em primeiro lugar
          </h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {safetyPause.reason}
          </p>

          <div className="mt-5 p-4 rounded-2xl bg-card border border-warning/30 max-w-lg mx-auto text-left text-xs">
            <p className="font-bold text-warning-foreground flex items-center gap-1.5">
              <Info className="size-4" /> Recomendação importante:
            </p>
            <p className="mt-1 text-muted-foreground leading-relaxed">
              {safetyPause.recommendedAction}
            </p>
          </div>

          <p className="mt-5 text-xs text-muted-foreground max-w-md mx-auto">
            Nenhum treino deve causar dor, medo ou risco. Pausar é um ato de
            responsabilidade e cuidado com {dogName ?? "seu cão"}.
          </p>

          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setActiveTab("timeline")}
              className="rounded-2xl"
            >
              Ver histórico e marcos na Linha do Tempo
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Header card com mascote e progresso */}
          <Card className="p-6 rounded-3xl border-2 border-border/90 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <PethMascot
                  mood={isAllDayTasksCompleted ? "celebrating" : "encouraging"}
                  size={64}
                  className="drop-shadow-xs motion-safe:hover:scale-105 transition-transform"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="eyebrow">PLANO COMPORTAMENTAL</span>
                    {plan.plannerType === "deterministic_fallback" ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        Catálogo Aprovado
                      </Badge>
                    ) : (
                      <Badge className="bg-primary/10 text-primary border-primary/20">
                        <Sparkles className="size-3" aria-hidden="true" />
                        Personalizado por IA
                      </Badge>
                    )}
                  </div>
                  <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    Jornada de 14 Dias
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground">
                  Progresso geral
                </p>
                <p className="text-xl font-extrabold text-primary">
                  {completedCount} de {tasks.length} tarefas ({progressPercent}
                  %)
                </p>
              </div>
            </div>

            {/* Day selection tabs (mobile-friendly horizontal scroll) */}
            <div className="mt-6">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Selecione o dia de treino
              </label>
              <div
                className="mt-2.5 flex gap-2.5 overflow-x-auto pb-2 focus:outline-none"
                role="tablist"
                aria-label="Dias do plano de treino"
              >
                {Array.from({ length: plan.totalDays }, (_, i) => i + 1).map(
                  (day) => {
                    const isSelected = day === selectedDay;
                    const isToday = day === plan.currentDay;
                    const isLocked = day > 1 && !hasEntitlement;
                    const hasCheckin = checkins.some((c) => c.dayNumber === day);
                    const dayTasksCount = tasks.filter(
                      (t) => t.dayNumber === day && t.status === "completed",
                    ).length;
                    const totalDayTasks = tasks.filter(
                      (t) => t.dayNumber === day,
                    ).length;
                    const isAllDone =
                      totalDayTasks > 0 && dayTasksCount === totalDayTasks;

                    return (
                      <button
                        key={day}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setSelectedDay(day)}
                        className={`flex min-w-16 flex-col items-center justify-center rounded-2xl border-2 px-3 py-2.5 text-xs transition-all duration-150 select-none ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs scale-102"
                            : isLocked
                              ? "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/30"
                              : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          Dia {day}
                          {isLocked ? (
                            <Lock
                              className="size-2.5"
                              aria-label="Bloqueado"
                            />
                          ) : null}
                        </span>
                        {hasCheckin ? (
                          <CheckCircle2
                            className={`mt-1 size-3.5 ${
                              isSelected
                                ? "text-primary-foreground"
                                : "text-success"
                            }`}
                            aria-label="Check-in realizado"
                          />
                        ) : isAllDone ? (
                          <CheckCircle2
                            className={`mt-1 size-3.5 ${
                              isSelected
                                ? "text-primary-foreground"
                                : "text-success"
                            }`}
                            aria-label="Concluído"
                          />
                        ) : isLocked ? (
                          <span
                            className={`mt-1 text-[9px] font-medium ${
                              isSelected
                                ? "text-primary-foreground/90"
                                : "text-muted-foreground"
                            }`}
                          >
                            Plano
                          </span>
                        ) : isToday ? (
                          <span
                            className={`mt-1 text-[10px] font-bold ${
                              isSelected
                                ? "text-primary-foreground underline"
                                : "text-primary"
                            }`}
                          >
                            Hoje
                          </span>
                        ) : (
                          <span
                            className={`mt-1 text-[10px] ${
                              isSelected
                                ? "text-primary-foreground/90"
                                : "text-muted-foreground"
                            }`}
                          >
                            {dayTasksCount}/{totalDayTasks}
                          </span>
                        )}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            {/* Daily duration callout */}
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-secondary/60 p-3.5 text-xs text-muted-foreground">
              <Clock
                className="size-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <span>
                Duração estimada para o <strong>Dia {selectedDay}</strong>:{" "}
                <strong className="text-foreground font-bold">
                  {dailyDuration} minutos
                </strong>{" "}
                total (1 a 3 exercícios curtos e positivos).
              </span>
            </div>
          </Card>

          {isDayLocked ? (
            <Card className="p-8 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-secondary/30 text-center shadow-card">
              <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-secondary/80">
                <PethMascot mood="pointing" size={64} />
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Lock className="size-3.5" /> Dia {selectedDay} faz parte do
                Plano Completo
              </div>
              <h3 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
                Desbloqueie todos os 14 dias de treino
              </h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                O <strong>Dia 1 é 100% gratuito</strong> para você começar hoje
                mesmo sem compromisso. Para continuar o plano estruturado com{" "}
                {dogName ?? "seu cão"} e registrar as tarefas dos dias
                seguintes, assine o programa completo.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => {
                    router.push("/app/conta");
                  }}
                  className="w-full sm:w-auto shadow-tactile font-bold"
                >
                  Conhecer o programa completo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDay(1)}
                  className="w-full sm:w-auto"
                >
                  Voltar para o Dia 1 (Grátis)
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {/* Check-in Diário card quando todas as tarefas do dia foram completadas */}
              {isAllDayTasksCompleted ? (
                dayCheckin ? (
                  <Card className="p-6 rounded-3xl border-2 border-success/40 bg-success-surface/30">
                    <div className="flex items-center gap-4">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-success-surface">
                        <PethMascot mood="celebrating" size={48} />
                      </div>
                      <div>
                        <Badge className="bg-success-surface text-foreground border-success/30 font-bold">
                          <CheckCircle2 className="size-3.5 text-success" />{" "}
                          CHECK-IN DO DIA CONCLUÍDO
                        </Badge>
                        <h4 className="mt-1 text-lg font-bold text-foreground">
                          Check-in do Dia {selectedDay} registrado
                        </h4>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Humor da sessão:{" "}
                          <strong>
                            {dayCheckin.mood === "calm"
                              ? "Tranquilo e focado"
                              : dayCheckin.mood === "moderate"
                                ? "Mais ou menos / Algumas distrações"
                                : "Precisamos pausar (respeito aos limites)"}
                          </strong>
                          {dayCheckin.difficultyRating ? (
                            <>
                              {" • Dificuldade: "}
                              <strong>
                                {dayCheckin.difficultyRating === "easy"
                                  ? "Fácil"
                                  : dayCheckin.difficultyRating === "challenging"
                                    ? "Desafiador"
                                    : "Adequado"}
                              </strong>
                            </>
                          ) : null}
                          {dayCheckin.notes ? ` • "${dayCheckin.notes}"` : ""}
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-6 rounded-3xl border-2 border-primary/30 bg-secondary/30">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <PethMascot
                          mood={
                            selectedMood === "calm"
                              ? "happy"
                              : selectedMood === "moderate"
                                ? "encouraging"
                                : selectedMood === "needed_pause"
                                  ? "resting"
                                  : "celebrating"
                          }
                          size={54}
                        />
                        <div>
                          <Badge className="bg-card text-foreground border-primary/30 font-bold">
                            CHECK-IN DIÁRIO
                          </Badge>
                          <h4 className="mt-1 text-xl font-bold text-foreground">
                            Como foi o treino do Dia {selectedDay}?
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            Registre a resposta do cão para acompanhar o ritmo
                            de vocês.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pergunta 1: Humor / Resposta */}
                    <div className="mt-5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Resposta do Cão
                      </label>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          {
                            key: "calm" as const,
                            label: "Tranquilo e focado",
                            desc: "Aproveitou e respondeu bem",
                          },
                          {
                            key: "moderate" as const,
                            label: "Mais ou menos",
                            desc: "Algumas distrações normais",
                          },
                          {
                            key: "needed_pause" as const,
                            label: "Precisamos pausar",
                            desc: "Pausar também é aprender!",
                          },
                        ].map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => setSelectedMood(option.key)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${
                              selectedMood === option.key
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30 font-bold"
                                : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            <p className="text-sm font-bold text-foreground">
                              {option.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {option.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pergunta 2: Percepção de Dificuldade */}
                    <div className="mt-5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Percepção de Dificuldade
                      </label>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          {
                            key: "easy" as const,
                            label: "Fácil",
                            desc: "Executou com tranquilidade imediata",
                          },
                          {
                            key: "adequate" as const,
                            label: "Adequado",
                            desc: "Desafio na medida certa para o dia",
                          },
                          {
                            key: "challenging" as const,
                            label: "Desafiador",
                            desc: "Exigiu esforço ou repetições extras",
                          },
                        ].map((diff) => (
                          <button
                            key={diff.key}
                            type="button"
                            onClick={() => setSelectedDifficulty(diff.key)}
                            className={`p-3 rounded-2xl border-2 text-left transition-all ${
                              selectedDifficulty === diff.key
                                ? "border-primary bg-primary/10 ring-2 ring-primary/30 font-bold"
                                : "border-border bg-card hover:border-primary/40"
                            }`}
                          >
                            <p className="text-xs font-bold text-foreground">
                              {diff.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {diff.desc}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Pergunta 3: Portão de Segurança / Red Flags */}
                    <div className="mt-5 rounded-2xl border border-warning/30 bg-warning/5 p-4">
                      <div className="flex items-center gap-2">
                        <ShieldAlert
                          className="size-4 text-warning"
                          aria-hidden="true"
                        />
                        <label
                          htmlFor="safety-flag-select"
                          className="text-xs font-bold uppercase tracking-wider text-warning-foreground"
                        >
                          Sinais de Alerta (Segurança em Primeiro Lugar)
                        </label>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Se notar dor física, estresse extremo ou agressividade,
                        pausamos preventivamente.
                      </p>
                      <select
                        id="safety-flag-select"
                        value={selectedSafetyFlag}
                        onChange={(e) =>
                          setSelectedSafetyFlag(e.target.value as SafetyFlag)
                        }
                        className="mt-2.5 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs sm:text-sm font-medium shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="none">
                          Nenhum sinal (sessão tranquila e segura)
                        </option>
                        <option value="pain_suspected">
                          Suspeita de dor ou desconforto físico
                        </option>
                        <option value="distress_extreme">
                          Estresse extremo ou pânico
                        </option>
                        <option value="aggression_risk">
                          Risco de agressão ou rosnado defensivo
                        </option>
                      </select>

                      {selectedSafetyFlag !== "none" ? (
                        <p className="mt-2 text-xs font-medium text-warning-foreground bg-warning/15 p-2 rounded-xl border border-warning/20">
                          Aviso: Ao registrar este sinal, o plano será pausado
                          preventivamente e você receberá recomendações
                          presenciais especializadas.
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor="checkin-notes"
                        className="text-xs font-semibold text-muted-foreground"
                      >
                        Observações da sessão (opcional):
                      </label>
                      <input
                        id="checkin-notes"
                        type="text"
                        maxLength={500}
                        value={checkinNotes}
                        onChange={(e) => setCheckinNotes(e.target.value)}
                        placeholder="Ex.: Usamos petisco de frango, respondeu bem ao estímulo."
                        className="mt-1.5 w-full rounded-2xl border border-input bg-background px-4 py-2.5 text-sm shadow-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                      </input>
                    </div>

                    <div className="mt-5 flex justify-end">
                      <Button
                        size="lg"
                        disabled={!selectedMood}
                        loading={isCheckinSubmitting}
                        loadingText="Salvando check-in…"
                        onClick={handleSubmitCheckin}
                      >
                        Concluir check-in do Dia {selectedDay}
                      </Button>
                    </div>
                  </Card>
                )
              ) : null}

              {/* Task cards for the selected day */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">
                    Exercícios do Dia {selectedDay} ({dayTasks.length}{" "}
                    {dayTasks.length === 1 ? "tarefa" : "tarefas"})
                  </h3>
                  {isAllDayTasksCompleted ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success bg-success-surface px-3 py-1 rounded-full border border-success/20">
                      <CheckCircle2 className="size-3.5" /> Dia concluído!
                    </span>
                  ) : null}
                </div>

                {dayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa cadastrada para este dia.
                  </p>
                ) : (
                  dayTasks.map((task, index) => {
                    const mod = task.module;
                    const isCompleted = task.status === "completed";
                    const isTaskPending = isPending && activeTaskId === task.id;

                    return (
                      <Card
                        key={task.id}
                        className={`transition-all duration-200 p-6 rounded-3xl border-2 ${
                          isCompleted
                            ? "border-success/50 bg-success-surface/25 shadow-xs"
                            : "border-border bg-card shadow-card hover:border-primary/40"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-[240px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-muted-foreground">
                                Exercício {index + 1} de {dayTasks.length}
                              </span>
                              {mod ? (
                                <>
                                  <Badge className="text-[11px] uppercase bg-secondary/80 font-bold">
                                    {mod.category}
                                  </Badge>
                                  <Badge className="text-[11px] bg-muted font-medium">
                                    {mod.difficulty === "beginner"
                                      ? "Iniciante"
                                      : mod.difficulty === "intermediate"
                                        ? "Intermediário"
                                        : "Avançado"}
                                  </Badge>
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                                    <Clock
                                      className="size-3"
                                      aria-hidden="true"
                                    />
                                    {mod.estimatedDurationMinutes} min
                                  </span>
                                </>
                              ) : null}
                            </div>
                            <h4 className="mt-2 text-xl font-bold text-foreground">
                              {mod?.title ?? "Módulo Comportamental"}
                            </h4>
                          </div>

                          <Button
                            variant={isCompleted ? "outline" : "default"}
                            loading={isTaskPending}
                            onClick={() => handleToggleTask(task)}
                            className={`rounded-2xl font-bold min-w-40 ${
                              isCompleted
                                ? "border-2 border-success text-success hover:bg-success/10"
                                : "shadow-tactile"
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle2 className="size-4 text-success" />
                                Concluída
                              </>
                            ) : (
                              "Concluir exercício"
                            )}
                          </Button>
                        </div>

                        {mod ? (
                          <div className="mt-5 space-y-4 text-sm">
                            {/* Setup instructions */}
                            <div className="rounded-2xl bg-muted/40 p-4 border border-border/60">
                              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Preparação do ambiente:
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                                {mod.setupInstructions}
                              </p>
                            </div>

                            {/* Step-by-step */}
                            <div>
                              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Passo a passo (reforço positivo):
                              </p>
                              <ol className="mt-2.5 space-y-2 list-decimal list-inside text-foreground leading-relaxed font-medium">
                                {mod.steps.map((step, stepIdx) => (
                                  <li key={stepIdx} className="leading-relaxed">
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>

                            {/* Success criteria */}
                            <div className="flex items-start gap-2.5 rounded-2xl bg-secondary/40 p-3.5 text-xs text-foreground border border-primary/20">
                              <Info
                                className="mt-0.5 size-4 text-primary shrink-0"
                                aria-hidden="true"
                              />
                              <p>
                                <strong>Critério de sucesso:</strong>{" "}
                                {mod.successCriteria}
                              </p>
                            </div>

                            {/* Stop condition (Deterministic safety reminder) */}
                            <div className="flex items-start gap-2.5 rounded-2xl bg-warning/10 p-3.5 text-xs text-warning-foreground border border-warning/30">
                              <ShieldAlert
                                className="mt-0.5 size-4 text-warning shrink-0"
                                aria-hidden="true"
                              />
                              <p>
                                <strong>Quando pausar:</strong>{" "}
                                {mod.stopConditions}
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
