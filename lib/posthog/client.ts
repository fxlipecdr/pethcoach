"use client";

import { getPublicEnv } from "@/lib/env/public";
import type { AnalyticsProvider } from "@/features/analytics/contracts";

// Dormant until P11 wires a real consent interface. Importing never initializes tracking.
let consent = false;
let clientPromise:
  Promise<(typeof import("posthog-js"))["default"]> | undefined;

export async function setAnalyticsConsent(granted: boolean) {
  consent = granted;
  if (!granted) {
    const client = await clientPromise;
    client?.opt_out_capturing();
    client?.reset();
    return;
  }
  const env = getPublicEnv();
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
  if (consent) client.opt_in_capturing({ captureEventName: false });
}

export const analytics: AnalyticsProvider = {
  async capture(event, properties) {
    if (!consent || !clientPromise) return;
    const client = await clientPromise;
    if (consent) client.capture(event, properties);
  },
};
