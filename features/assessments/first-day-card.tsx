import { Clock, CircleCheckBig, TriangleAlert } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import type { BehaviorModule } from "@/features/plans/contracts";

/**
 * Dia 1 entregue na própria página de resultado, sem conta.
 *
 * Antes disso, quem terminava o quiz recebia um resumo e um convite para se
 * cadastrar. Dez perguntas respondidas e nada praticável de volta — o tutor ia
 * embora sem nunca ver o produto funcionar, e voltar exigia procurar um e-mail.
 *
 * O Dia 1 já era gratuito por definição do produto. Entregá-lo aqui não abre
 * nada que estivesse fechado: o catálogo publicado é legível por qualquer
 * visitante. O que muda é a ordem — valor primeiro, cadastro depois.
 */
export function FirstDayCard({ module }: { module: BehaviorModule }) {
  return (
    <Card className="mt-6 border-2 border-primary/30 bg-secondary/20 p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge>DIA 1 · GRÁTIS</Badge>
          <h2 className="font-display mt-4 text-2xl font-bold tracking-tight text-foreground">
            {module.title}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4" aria-hidden="true" />
            {module.estimatedDurationMinutes} minutos
          </p>
        </div>
        <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-card sm:flex">
          <PethMascot mood="happy" size={48} />
        </div>
      </div>

      <div className="mt-6 rounded-card border border-border bg-card p-5">
        <h3 className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Antes de começar
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {module.setupInstructions}
        </p>
      </div>

      <ol className="mt-6 space-y-3">
        {module.steps.map((passo, indice) => (
          <li key={passo} className="flex gap-3">
            <span className="font-display flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {indice + 1}
            </span>
            <p className="pt-0.5 text-sm leading-relaxed text-foreground">
              {passo}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-mint bg-mint-soft p-4">
          <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-ink uppercase">
            <CircleCheckBig className="size-4" aria-hidden="true" />
            Deu certo quando
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            {module.successCriteria}
          </p>
        </div>
        {/* O critério de parada não é rodapé: é a parte do exercício que
            protege o cão, e precisa ser lida antes da prática. */}
        <div className="rounded-card border border-coral/50 bg-coral-soft p-4">
          <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-ink uppercase">
            <TriangleAlert className="size-4" aria-hidden="true" />
            Pare se
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-ink/80">
            {module.stopConditions}
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Faça hoje, sem pressa, e repita amanhã se quiser. Os dias 2 a 14
        aprofundam esse exercício e acrescentam os próximos.
      </p>
    </Card>
  );
}
