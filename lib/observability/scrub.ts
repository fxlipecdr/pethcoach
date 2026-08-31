export type DiagnosticEvent = {
  event_id?: string;
  level?: "fatal" | "error" | "warning" | "log" | "info" | "debug";
  platform?: string;
  timestamp?: number;
  environment?: string;
  release?: string;
  message?: string;
};

export function scrubDiagnosticEvent(
  event: DiagnosticEvent,
): DiagnosticEvent & { type: undefined } {
  // Foundation allowlist: strip messages, stack traces, URLs, cookies, user data and breadcrumbs.
  return {
    type: undefined,
    event_id: event.event_id,
    level: event.level,
    platform: event.platform,
    timestamp: event.timestamp,
    environment: event.environment,
    release: event.release,
    message:
      "Falha técnica na fundação PethCoach; detalhes removidos por privacidade.",
  };
}
