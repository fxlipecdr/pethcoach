import { getServerEnv } from "@/lib/env/server";
import { getPublicEnv } from "@/lib/env/public";
import { scrubDiagnosticEvent } from "@/lib/observability/scrub";

export async function register() {
  getPublicEnv();
  const env = getServerEnv();
  if (process.env.NEXT_RUNTIME === "nodejs" && env.SENTRY_DSN) {
    const sentry = await import("@sentry/nextjs");
    sentry.init({
      dsn: env.SENTRY_DSN,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      defaultIntegrations: false,
      beforeSend: scrubDiagnosticEvent,
    });
  }
}

export async function onRequestError() {
  if (!getServerEnv().SENTRY_DSN) return;
  const sentry = await import("@sentry/nextjs");
  sentry.captureMessage("Falha de requisição no servidor", "error");
}
