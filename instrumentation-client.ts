import { getPublicEnvClient } from "@/lib/env/public-client";
import { scrubDiagnosticEvent } from "@/lib/observability/scrub";

const dsn = getPublicEnvClient().NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  void import("@sentry/nextjs").then((sentry) => {
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
