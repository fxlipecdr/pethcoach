import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { BILLING_PLANS_CATALOG } from "@/features/billing/contracts";
import type { ResolvedPlanPrice } from "@/features/billing/pricing";
import type { BillingPlanType } from "@/features/billing/contracts";

/**
 * Cards de plano da vitrine pública.
 *
 * Compartilhado entre a home e `/planos`. Duas cópias do mesmo card acabariam
 * divergindo — e divergência aqui é preço diferente em duas páginas do mesmo
 * site, que é problema de consumidor, não de estilo.
 *
 * O valor vem do Stripe; um plano sem preço cadastrado não é renderizado.
 */
export function PlanCards({
  prices,
  className,
}: {
  prices: Record<BillingPlanType, ResolvedPlanPrice>;
  className?: string;
}) {
  const planos = BILLING_PLANS_CATALOG.filter(
    (plano) => prices[plano.id].live || plano.id !== "annual",
  );

  return (
    <div
      className={`grid grid-cols-1 gap-5 ${
        planos.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"
      } ${className ?? ""}`}
    >
      {planos.map((plano) => {
        const preco = prices[plano.id];
        const destaque = plano.id === "single_program";
        const comparavel = plano.comparesTo
          ? planos.some((outro) => outro.id === plano.comparesTo)
          : true;
        const beneficios = comparavel
          ? [...(plano.comparativeFeatures ?? []), ...plano.features]
          : plano.features;

        return (
          <Card
            key={plano.id}
            className={`relative flex flex-col justify-between p-6 sm:p-7 ${
              destaque
                ? "border-2 border-primary bg-secondary/25 shadow-card ring-1 ring-primary/20"
                : "border border-border"
            }`}
          >
            {destaque ? (
              <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-pill bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                <Sparkles className="size-3" aria-hidden="true" />
                Sem mensalidade
              </span>
            ) : null}

            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold text-foreground">
                  {plano.title}
                </h3>
                {!destaque && plano.badge && comparavel ? (
                  <Badge>{plano.badge}</Badge>
                ) : null}
              </div>

              <p className="mt-5 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-bold tracking-tight text-foreground">
                  {preco.priceFormatted}
                </span>
                <span className="text-sm text-muted-foreground">
                  {preco.period}
                </span>
              </p>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {plano.description}
              </p>

              <ul className="mt-6 space-y-2.5">
                {beneficios.map((beneficio) => (
                  <li
                    key={beneficio}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary-strong"
                      aria-hidden="true"
                    />
                    {beneficio}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 border-t border-border/60 pt-5">
              <Button
                asChild
                className="w-full"
                variant={destaque ? "default" : "outline"}
              >
                <Link href="/entrar">Começar pelo dia grátis</Link>
              </Button>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                O Dia 1 não pede cartão
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
