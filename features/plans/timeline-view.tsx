import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Heart,
  Lock,
  Sparkles,
} from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import type {
  DailyCheckin,
  PlanAdaptation,
  PlanMilestone,
} from "./contracts";

interface TimelineViewProps {
  checkins: DailyCheckin[];
  milestones: PlanMilestone[];
  adaptations?: PlanAdaptation[];
  dogName?: string;
}

const ALL_MILESTONES_DEF = [
  {
    key: "first_training_done" as const,
    title: "Primeiro Passo",
    desc: "Primeira sessão de treino concluída juntos.",
    icon: Sparkles,
  },
  {
    key: "pause_honored" as const,
    title: "Pausa Consciente",
    desc: "Respeitou os limites do cão sem pressa ou frustração.",
    icon: Heart,
  },
  {
    key: "constancia_serena" as const,
    title: "Constância Serena",
    desc: "Três sessões concluídas no ritmo de vocês.",
    icon: Calendar,
  },
  {
    key: "week_one_done" as const,
    title: "Fundamentos Sólidos",
    desc: "Metade da jornada completada com reforço positivo.",
    icon: Award,
  },
  {
    key: "program_completed" as const,
    title: "Jornada Concluída",
    desc: "14 dias de parceria, respeito e aprendizado mútuo.",
    icon: Award,
  },
];

export function TimelineView({
  checkins,
  milestones,
  adaptations = [],
  dogName = "seu cão",
}: TimelineViewProps) {
  const unlockedKeys = new Set(milestones.map((m) => m.key));
  const sortedCheckins = [...checkins].sort((a, b) => b.dayNumber - a.dayNumber);

  return (
    <div className="space-y-8">
      {/* 1. Marcos Comportamentais (Milestones) */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Award className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Marcos Comportamentais
            </h3>
            <p className="text-xs text-muted-foreground">
              Conquistas alcançadas na jornada com {dogName}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {ALL_MILESTONES_DEF.map((m) => {
            const isUnlocked = unlockedKeys.has(m.key);
            const unlockedData = milestones.find((item) => item.key === m.key);
            const Icon = m.icon;

            return (
              <div
                key={m.key}
                className={`rounded-2xl border-2 p-4 transition-all duration-150 ${
                  isUnlocked
                    ? "border-primary/40 bg-secondary/30 shadow-xs"
                    : "border-border/80 bg-card shadow-2xs"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      isUnlocked
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  {isUnlocked ? (
                    <Badge className="border-success/30 bg-success-surface text-foreground font-bold">
                      <CheckCircle2 className="size-3 text-success" />
                      Conquistado
                    </Badge>
                  ) : (
                    <Badge className="border-border bg-muted/60 text-foreground font-medium">
                      <Lock className="size-3 text-muted-foreground" />
                      A conquistar
                    </Badge>
                  )}
                </div>

                <h4 className="mt-3 text-base font-bold text-foreground">
                  {m.title}
                </h4>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {isUnlocked && unlockedData?.description
                    ? unlockedData.description
                    : m.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Adaptações Ativas no Cronograma */}
      {adaptations.length > 0 ? (
        <Card className="rounded-3xl border-2 border-primary/20 bg-secondary/30 p-5">
          <div className="flex items-start gap-3.5">
            <PethMascot mood="encouraging" size={48} className="shrink-0" />
            <div>
              <Badge className="bg-card text-foreground border-border font-bold">
                ADAPTAÇÃO DE RITMO
              </Badge>
              <h4 className="mt-1 text-base font-bold text-foreground">
                Cronograma Ajustado para o Bem-estar
              </h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                {adaptations[0]?.reason}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {/* 3. Linha do Tempo de Sessões (Check-ins) */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            <Clock className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Histórico de Sessões de Treino
            </h3>
            <p className="text-xs text-muted-foreground">
              Registros e observações do tutor ao final de cada dia
            </p>
          </div>
        </div>

        {sortedCheckins.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Nenhum check-in registrado ainda. Complete o Dia 1 para iniciar o histórico.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {sortedCheckins.map((checkin) => {
              const isCalm = checkin.mood === "calm";
              const isPause = checkin.mood === "needed_pause";

              return (
                <div
                  key={checkin.id}
                  className="rounded-2xl border-2 border-border bg-card p-4.5 transition-all shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">
                        Dia {checkin.dayNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(checkin.completedAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge
                        className={
                          isPause
                            ? "bg-secondary text-foreground font-semibold"
                            : isCalm
                              ? "bg-success-surface text-foreground font-semibold"
                              : "bg-muted text-foreground font-semibold"
                        }
                      >
                        {isCalm
                          ? "Tranquilo e focado"
                          : isPause
                            ? "Pausa respeitada"
                            : "Mais ou menos"}
                      </Badge>
                      <span className="rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {checkin.difficultyRating === "easy"
                          ? "Fácil"
                          : checkin.difficultyRating === "challenging"
                            ? "Desafiador"
                            : "Adequado"}
                      </span>
                    </div>
                  </div>

                  {checkin.notes ? (
                    <div className="mt-3 rounded-xl bg-muted/30 p-3 text-xs text-foreground border border-border/50">
                      <span className="font-semibold text-muted-foreground">
                        Observações:
                      </span>{" "}
                      &ldquo;{checkin.notes}&rdquo;
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
