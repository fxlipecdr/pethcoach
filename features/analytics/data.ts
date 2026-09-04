import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { AttributionTouchInput } from "./contracts";

type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Records an attribution touch in public.attribution_touches.
 * Follows the strict rule: First touch is immutable; last touch records eligible visits.
 */
export async function recordAttributionTouch(
  client: TypedSupabaseClient,
  input: AttributionTouchInput,
): Promise<{ ok: boolean; touchId?: string; reason?: string }> {
  try {
    // 1. If it's a first touch, verify if one already exists for this anonymousId
    if (input.touchType === "first") {
      const { data: existingFirst } = await client
        .from("attribution_touches")
        .select("id")
        .eq("anonymous_id", input.anonymousId)
        .eq("touch_type", "first")
        .maybeSingle();

      if (existingFirst) {
        // First touch is immutable: do not overwrite or duplicate
        return { ok: true, touchId: existingFirst.id, reason: "first_touch_already_recorded" };
      }
    }

    // 2. Insert the attribution touch
    const { data, error } = await client
      .from("attribution_touches")
      .insert({
        anonymous_id: input.anonymousId,
        user_id: input.userId ?? null,
        touch_type: input.touchType,
        source: input.source ?? null,
        medium: input.medium ?? null,
        campaign: input.campaign ?? null,
        referrer: input.referrer ?? null,
        landing: input.landing ?? null,
        click_ids: input.clickIds ?? {},
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, reason: error.message };
    }

    return { ok: true, touchId: data.id };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "unknown_error",
    };
  }
}

/**
 * Associates an anonymous_id's previous touches to a newly authenticated user.
 */
export async function linkAttributionToUser(
  client: TypedSupabaseClient,
  anonymousId: string,
  userId: string,
): Promise<{ ok: boolean; count?: number }> {
  try {
    const { data, error } = await client
      .from("attribution_touches")
      .update({ user_id: userId })
      .eq("anonymous_id", anonymousId)
      .is("user_id", null)
      .select("id");

    if (error) {
      return { ok: false };
    }

    return { ok: true, count: data?.length ?? 0 };
  } catch {
    return { ok: false };
  }
}

/**
 * Retrieves attribution touches for a specific user.
 */
export async function getUserAttributionTouches(
  client: TypedSupabaseClient,
  userId: string,
) {
  const { data } = await client
    .from("attribution_touches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
