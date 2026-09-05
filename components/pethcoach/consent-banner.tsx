"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cookie, ShieldCheck, X } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { getStoredConsent, setConsent } from "@/features/analytics/consent";
import {
  getOrCreateAnonymousId,
  parseAttributionParams,
} from "@/features/analytics/attribution";
import { recordAttributionAction } from "@/features/analytics/actions";

function recordCurrentAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    const parsed = parseAttributionParams(
      window.location.href,
      document.referrer,
    );

    const hasAttribution =
      parsed.source ||
      parsed.medium ||
      parsed.campaign ||
      parsed.referrer ||
      Object.keys(parsed.clickIds).length > 0;

    if (hasAttribution) {
      const anonymousId = getOrCreateAnonymousId();
      void recordAttributionAction({
        anonymousId,
        touchType: "first",
        source: parsed.source,
        medium: parsed.medium,
        campaign: parsed.campaign,
        referrer: parsed.referrer,
        landing: parsed.landing,
        clickIds: parsed.clickIds,
      });

      void recordAttributionAction({
        anonymousId,
        touchType: "last",
        source: parsed.source,
        medium: parsed.medium,
        campaign: parsed.campaign,
        referrer: parsed.referrer,
        landing: parsed.landing,
        clickIds: parsed.clickIds,
      });
    }
  } catch {
    // Attribution recording should never block the user
  }
}

export function ConsentBanner() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/dev")) return;
    const current = getStoredConsent();
    if (current === "pending") {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 0);
      return () => clearTimeout(timer);
    } else if (current === "granted") {
      recordCurrentAttribution();
    }
  }, [pathname]);

  useEffect(() => {
    const handleReopen = () => {
      setIsOpen(true);
    };

    window.addEventListener("peth:open_consent_preferences", handleReopen);
    return () => {
      window.removeEventListener("peth:open_consent_preferences", handleReopen);
    };
  }, []);

  function handleChoice(newStatus: "granted" | "denied") {
    setConsent(newStatus);
    setIsOpen(false);

    if (newStatus === "granted") {
      recordCurrentAttribution();
    }
  }

  if (!isOpen || pathname.startsWith("/dev")) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Consentimento de privacidade e cookies"
      className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto sm:left-auto sm:right-6 sm:mx-0 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <Card className="p-5 sm:p-6 shadow-card-hover border border-border bg-card/95 backdrop-blur-md rounded-panel">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-foreground font-bold text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary-strong">
              <Cookie className="size-5" aria-hidden="true" />
            </div>
            <span>Privacidade e respeito ao seu ritmo</span>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Fechar aviso de cookies"
            className="inline-flex items-center justify-center min-h-6 min-w-6 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Utilizamos cookies e métricas analíticas apenas para entender a
          eficácia dos treinos e melhorar a experiência de cães e tutores, sem
          anúncios nem venda de dados. Você escolhe o que deseja compartilhar.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <Button
            size="sm"
            onClick={() => handleChoice("granted")}
            className="w-full sm:w-auto font-bold"
          >
            Aceitar analíticos
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleChoice("denied")}
            className="w-full sm:w-auto font-medium"
          >
            Apenas essenciais
          </Button>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <Link
            href="/privacidade"
            className="underline underline-offset-2 hover:text-primary-strong transition-colors inline-flex items-center min-h-6 py-1"
          >
            Política de Privacidade
          </Link>
          <span className="inline-flex items-center gap-1 text-primary-strong">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Em conformidade com a LGPD
          </span>
        </div>
      </Card>
    </div>
  );
}
