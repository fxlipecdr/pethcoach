import { getPublicEnvClient } from "@/lib/env/public-client";
import { scrubDiagnosticEvent } from "@/lib/observability/scrub";

type SentryModule = typeof import("@sentry/nextjs");

/**
 * O SDK é carregado sob demanda e só quando existe DSN, para que ambiente sem
 * monitoramento não pague o custo do pacote. Guardamos a referência porque o
 * Next pede o gancho de navegação como export síncrono do módulo.
 */
let sentryCarregado: SentryModule | null = null;

const dsn = getPublicEnvClient().NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  void import("@sentry/nextjs").then((sentry) => {
    sentryCarregado = sentry;
    sentry.init({
      dsn,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      defaultIntegrations: false,
      beforeSend: scrubDiagnosticEvent,
    });
    // Deliberately omit the event payload, URL, stack and message supplied by the browser.
    window.addEventListener("error", () =>
      sentry.captureMessage("Erro de interface", "error"),
    );
    window.addEventListener("unhandledrejection", () =>
      sentry.captureMessage("Falha assíncrona de interface", "error"),
    );
  });
}

/**
 * Gancho que o Next chama a cada navegação no cliente. Encaminha para o SDK
 * quando ele já carregou; antes disso, e em ambiente sem DSN, não faz nada.
 */
export const onRouterTransitionStart: SentryModule["captureRouterTransitionStart"] =
  (...args) => sentryCarregado?.captureRouterTransitionStart?.(...args);
