"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, ExternalLink, Sparkles } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { analytics } from "@/lib/posthog/client";
import {
  BILLING_PLANS_CATALOG,
  type BillingPlanType,
  type UserBillingStatus,
} from "./contracts";
import {
  createCheckoutSessionAction,
  createCustomerPortalAction,
} from "./actions";

interface BillingCardProps {
  status: UserBillingStatus;
  dogId?: string;
}

export function BillingCard({ status, dogId }: BillingCardProps) {
  const [loadingAction, setLoadingAction] = useState<
    BillingPlanType | "portal" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!status.hasAccess) {
      void analytics.capture("paywall_viewed", {
        plan_type: "full_program",
      });
    }
  }, [status.hasAccess]);

  async function handleCheckout(planType: BillingPlanType) {
    setLoadingAction(planType);
    setErrorMessage(null);

    void analytics.capture("checkout_started", {
      price_id: planType,
    });

    try {
      const result = await createCheckoutSessionAction({
        planType,
        dogId,
      });

      if (result.status === "error") {
        setErrorMessage(result.message);
      } else if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
      }
    } catch {
      setErrorMessage("Erro ao conectar com o serviço de pagamento.");
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleOpenPortal() {
    setLoadingAction("portal");
    setErrorMessage(null);

    try {
      const result = await createCustomerPortalAction();

      if (result.status === "error") {
        setErrorMessage(result.message);
      } else if (result.portalUrl) {
        window.location.assign(result.portalUrl);
      }
    } catch {
      setErrorMessage("Erro ao conectar com o portal de gestão.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <Card className="p-6 sm:p-7 rounded-3xl border-2 border-border/80 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-secondary text-primary">
            <CreditCard className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Plano e Faturamento
            </h2>
            <p className="text-xs text-muted-foreground">
              Acesso aos dias completos de treino estruturado e histórico
            </p>
          </div>
        </div>

        {status.hasAccess ? (
          <Badge className="border-success/30 bg-success-surface text-foreground font-bold">
            {status.hasFullProgram ? "Programa Completo" : "Assinatura Ativa"}
          </Badge>
        ) : (
          <Badge className="border-border bg-muted/60 text-foreground font-medium">
            Dia 1 Gratuito
          </Badge>
        )}
      </div>

      {errorMessage ? (
        <div className="mt-4">
          <Feedback tone="error" title="Atenção">
            {errorMessage}
          </Feedback>
        </div>
      ) : null}

      {status.hasAccess ? (
        <div className="mt-6 rounded-2xl border border-border/80 bg-muted/30 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">
                {status.hasFullProgram
                  ? "Acesso Vitalício ao Programa Completo"
                  : "Assinatura PethCoach Pro"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status.hasFullProgram
                  ? "Você tem acesso ilimitado a todos os 14 dias de treino estruturado."
                  : status.expiresAt
                    ? `Próxima renovação prevista para ${new Date(status.expiresAt).toLocaleDateString("pt-BR")}`
                    : "Renovação ativa sem pendências."}
              </p>
            </div>

            {status.stripeCustomerId ? (
              <Button
                variant="outline"
                size="sm"
                loading={loadingAction === "portal"}
                loadingText="Abrindo portal…"
                onClick={handleOpenPortal}
                className="rounded-xl font-semibold text-xs"
              >
                Gerenciar no Stripe Portal
                <ExternalLink className="size-3.5 ml-1" />
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-secondary/30 p-4 text-xs text-muted-foreground">
            O <strong>Dia 1 é 100% gratuito</strong> para você iniciar sem
            compromisso. Para continuar com os <strong>Dias 2 a 14</strong>,
            escolha uma das opções abaixo:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BILLING_PLANS_CATALOG.map((plan) => {
              const isRecommended = plan.recommended;

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col justify-between rounded-2xl border-2 p-5 transition-all ${
                    isRecommended
                      ? "border-primary bg-secondary/20 shadow-xs ring-1 ring-primary/20"
                      : "border-border bg-card shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {plan.title}
                      </span>
                      {plan.badge ? (
                        <span className="rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-[10px] font-bold">
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <span className="text-2xl font-extrabold text-foreground">
                        {plan.priceFormatted}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        {plan.period}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                      {plan.description}
                    </p>

                    <ul className="mt-4 space-y-2 text-xs text-foreground">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60">
                    <Button
                      className="w-full rounded-xl font-bold text-xs"
                      variant={isRecommended ? "default" : "outline"}
                      loading={loadingAction === plan.id}
                      loadingText="Iniciando…"
                      onClick={() => handleCheckout(plan.id)}
                    >
                      {isRecommended ? (
                        <>
                          <Sparkles className="size-3.5 mr-1" />
                          Assinar com desconto
                        </>
                      ) : (
                        "Escolher este plano"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
