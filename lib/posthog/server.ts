import "server-only";
import { getPublicEnv } from "@/lib/env/public";
import {
  purchaseCompletedPropsSchema,
  type EventPropertiesMap,
} from "@/features/analytics/contracts";

/**
 * Dispatches a server-side analytics event to PostHog via HTTP API.
 * Used exclusively for events originating in backend webhooks like `purchase_completed`.
 */
export async function captureServerEvent(
  event: "purchase_completed",
  properties: EventPropertiesMap["purchase_completed"],
  distinctId: string,
): Promise<{ ok: boolean; reason?: string }> {
  const parsed = purchaseCompletedPropsSchema.safeParse(properties);
  if (!parsed.success) {
    return { ok: false, reason: "invalid_properties" };
  }

  const env = getPublicEnv();
  if (!env.NEXT_PUBLIC_POSTHOG_KEY || !env.NEXT_PUBLIC_POSTHOG_HOST) {
    return { ok: false, reason: "missing_credentials" };
  }

  try {
    const endpoint = `${env.NEXT_PUBLIC_POSTHOG_HOST.replace(/\/$/, "")}/capture/`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: env.NEXT_PUBLIC_POSTHOG_KEY,
        event,
        properties: {
          distinct_id: distinctId,
          ...parsed.data,
          $lib: "pethcoach_server",
        },
        timestamp: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      return { ok: false, reason: `http_${res.status}` };
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "network_error",
    };
  }
}
