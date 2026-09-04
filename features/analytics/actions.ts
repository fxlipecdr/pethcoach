"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  attributionTouchInputSchema,
  type AttributionTouchInput,
} from "./contracts";
import {
  recordAttributionTouch,
  linkAttributionToUser,
} from "./data";

/**
 * Server action to record traffic attribution touch points.
 */
export async function recordAttributionAction(
  rawInput: AttributionTouchInput,
): Promise<{ ok: boolean; touchId?: string; reason?: string }> {
  const parsed = attributionTouchInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, reason: "invalid_input" };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, reason: "admin_client_unavailable" };
  }

  return recordAttributionTouch(admin, parsed.data);
}

/**
 * Server action to link previous anonymous touches to the logged-in user.
 */
export async function linkAttributionAction(
  anonymousId: string,
): Promise<{ ok: boolean; count?: number }> {
  if (!anonymousId || typeof anonymousId !== "string") {
    return { ok: false };
  }

  const serverClient = await createSupabaseServerClient();
  if (!serverClient) return { ok: false };

  const {
    data: { user },
  } = await serverClient.auth.getUser().catch(() => ({ data: { user: null } }));

  if (!user) {
    return { ok: false };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return { ok: false };

  return linkAttributionToUser(admin, anonymousId, user.id);
}
