"use client";

import { getPublicEnvClient } from "@/lib/env/public-client";
import type {
  AnalyticsProvider,
  ClientProductEvent,
  EventPropertiesMap,
} from "@/features/analytics/contracts";

let consent = false;
let clientPromise:
  | Promise<(typeof import("posthog-js"))["default"]>
  | undefined;

// In-memory deduplication cache to prevent duplicate events within 2 seconds
const recentEventsCache = new Map<string, number>();

function isDuplicate(eventKey: string): boolean {
  const now = Date.now();
  const lastTime = recentEventsCache.get(eventKey);
  if (lastTime && now - lastTime < 2000) {
    return true;
  }
  recentEventsCache.set(eventKey, now);

  // Clean old entries
  if (recentEventsCache.size > 100) {
    for (const [key, timestamp] of recentEventsCache.entries()) {
      if (now - timestamp > 5000) {
        recentEventsCache.delete(key);
      }
    }
  }

  return false;
}

export function hasAnalyticsConsent(): boolean {
  return consent;
}

export async function setAnalyticsConsent(granted: boolean): Promise<void> {
  consent = granted;
  if (!granted) {
    const client = await clientPromise;
    client?.opt_out_capturing();
    client?.reset();
    return;
  }

  const env = getPublicEnvClient();
  if (!env.NEXT_PUBLIC_POSTHOG_KEY || !env.NEXT_PUBLIC_POSTHOG_HOST) return;

  const key = env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = env.NEXT_PUBLIC_POSTHOG_HOST;

  clientPromise ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: host,
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      opt_out_capturing_by_default: true,
      persistence: "memory",
      person_profiles: "identified_only",
    });
    return posthog;
  });

  const client = await clientPromise;
  if (consent) {
    client.opt_in_capturing({ captureEventName: false });
  }
}

export const analytics: AnalyticsProvider = {
  async capture<E extends ClientProductEvent>(
    event: E,
    properties: EventPropertiesMap[E],
  ): Promise<void> {
    if (!consent) return;

    // A lista estrita de propriedades é uma proteção de privacidade e
    // continua valendo. O import é dinâmico só para tirar o Zod do bundle
    // inicial: nada aqui roda antes do consentimento e de uma interação.
    const { eventSchemas } = await import("@/features/analytics/contracts");
    const schema = eventSchemas[event];
    const parsed = schema.safeParse(properties);
    if (!parsed.success) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[Analytics] Property validation failed for event "${event}":`,
          parsed.error.format(),
        );
      }
      return;
    }

    // Deduplication check
    const dedupKey = `${event}:${JSON.stringify(parsed.data)}`;
    if (isDuplicate(dedupKey)) {
      return;
    }

    if (!clientPromise) return;
    const client = await clientPromise;
    if (consent) {
      client.capture(event, parsed.data as Record<string, unknown>);
    }
  },
};
