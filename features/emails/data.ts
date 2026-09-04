import "server-only";
import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Database,
  EmailPreferencesRow,
  EmailDeliveryLogRow,
} from "@/lib/supabase/database.types";
import type { EmailCategory, EmailPreferences } from "./contracts";

export function generateUnsubscribeToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function getOrCreateEmailPreferences(
  userId: string,
  client?: SupabaseClient<Database> | null,
): Promise<EmailPreferencesRow | null> {
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return null;

  const { data: existing, error: selectError } = await supabase
    .from("email_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (selectError) {
    console.error("[getOrCreateEmailPreferences] Erro ao buscar preferências:", selectError);
    return null;
  }

  if (existing) {
    return existing as EmailPreferencesRow;
  }

  const token = generateUnsubscribeToken();
  const { data: created, error: insertError } = await supabase
    .from("email_preferences")
    .insert({
      user_id: userId,
      unsubscribe_token: token,
      training_reminders: true,
      milestone_celebrations: true,
      billing_notifications: true,
      marketing_tips: false,
      unsubscribed_all: false,
    })
    .select("*")
    .single();

  if (insertError) {
    // If concurrent insert occurred, attempt one more select
    const { data: fallback } = await supabase
      .from("email_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return (fallback as EmailPreferencesRow) || null;
  }

  return created as EmailPreferencesRow;
}

export async function getEmailPreferencesByToken(
  token: string,
): Promise<EmailPreferencesRow | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("email_preferences")
    .select("*")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error || !data) return null;
  return data as EmailPreferencesRow;
}

export async function updateEmailPreferences(
  userId: string,
  preferences: Partial<EmailPreferences>,
  client?: SupabaseClient<Database> | null,
): Promise<EmailPreferencesRow | null> {
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return null;

  const updates: Database["public"]["Tables"]["email_preferences"]["Update"] = {};
  if (preferences.trainingReminders !== undefined) {
    updates.training_reminders = preferences.trainingReminders;
  }
  if (preferences.milestoneCelebrations !== undefined) {
    updates.milestone_celebrations = preferences.milestoneCelebrations;
  }
  if (preferences.billingNotifications !== undefined) {
    updates.billing_notifications = preferences.billingNotifications;
  }
  if (preferences.marketingTips !== undefined) {
    updates.marketing_tips = preferences.marketingTips;
  }
  if (preferences.unsubscribedAll !== undefined) {
    updates.unsubscribed_all = preferences.unsubscribedAll;
  }

  const { data, error } = await supabase
    .from("email_preferences")
    .update(updates)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    console.error("[updateEmailPreferences] Erro ao atualizar preferências:", error);
    return null;
  }

  return data as EmailPreferencesRow;
}

export async function unsubscribeByToken(
  token: string,
  options: { category?: EmailCategory; all?: boolean },
): Promise<EmailPreferencesRow | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const updates: Database["public"]["Tables"]["email_preferences"]["Update"] = {};
  if (options.all || !options.category) {
    updates.unsubscribed_all = true;
  } else {
    updates[options.category] = false;
  }

  const { data, error } = await admin
    .from("email_preferences")
    .update(updates)
    .eq("unsubscribe_token", token)
    .select("*")
    .single();

  if (error) {
    console.error("[unsubscribeByToken] Erro ao desinscrever por token:", error);
    return null;
  }

  return data as EmailPreferencesRow;
}

export async function resubscribeByToken(
  token: string,
  options: { category?: EmailCategory; all?: boolean },
): Promise<EmailPreferencesRow | null> {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const updates: Database["public"]["Tables"]["email_preferences"]["Update"] = {};
  if (options.all) {
    updates.unsubscribed_all = false;
  } else if (options.category) {
    updates[options.category] = true;
    updates.unsubscribed_all = false;
  }

  const { data, error } = await admin
    .from("email_preferences")
    .update(updates)
    .eq("unsubscribe_token", token)
    .select("*")
    .single();

  if (error) {
    console.error("[resubscribeByToken] Erro ao reativar por token:", error);
    return null;
  }

  return data as EmailPreferencesRow;
}

export async function checkEmailIdempotency(
  idempotencyKey: string,
  client?: SupabaseClient<Database> | null,
): Promise<EmailDeliveryLogRow | null> {
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("email_delivery_logs")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (error) {
    console.error("[checkEmailIdempotency] Erro ao consultar idempotência:", error);
    return null;
  }

  return (data as EmailDeliveryLogRow) || null;
}

export async function recordEmailDeliveryLog(
  input: {
    userId?: string | null;
    recipientEmail: string;
    templateKey: string;
    idempotencyKey: string;
    status: "pending" | "sent" | "skipped" | "failed";
    skipReason?: string | null;
    providerMessageId?: string | null;
    metadata?: Record<string, unknown>;
    errorMessage?: string | null;
    sentAt?: string | null;
  },
  client?: SupabaseClient<Database> | null,
): Promise<EmailDeliveryLogRow | null> {
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("email_delivery_logs")
    .insert({
      user_id: input.userId ?? null,
      recipient_email: input.recipientEmail,
      template_key: input.templateKey,
      idempotency_key: input.idempotencyKey,
      status: input.status,
      skip_reason: input.skipReason ?? null,
      provider_message_id: input.providerMessageId ?? null,
      metadata: (input.metadata ?? {}) as Database["public"]["Tables"]["email_delivery_logs"]["Row"]["metadata"],
      error_message: input.errorMessage ?? null,
      sent_at: input.sentAt ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[recordEmailDeliveryLog] Erro ao registrar log:", error);
    return null;
  }

  return data as EmailDeliveryLogRow;
}

export async function updateEmailDeliveryLog(
  id: string,
  updates: {
    status?: "pending" | "sent" | "skipped" | "failed";
    skipReason?: string | null;
    providerMessageId?: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
  },
  client?: SupabaseClient<Database> | null,
): Promise<void> {
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return;

  const payload: Database["public"]["Tables"]["email_delivery_logs"]["Update"] = {};
  if (updates.status) payload.status = updates.status;
  if (updates.skipReason !== undefined) payload.skip_reason = updates.skipReason;
  if (updates.providerMessageId !== undefined) payload.provider_message_id = updates.providerMessageId;
  if (updates.errorMessage !== undefined) payload.error_message = updates.errorMessage;
  if (updates.sentAt !== undefined) payload.sent_at = updates.sentAt;

  const { error } = await supabase
    .from("email_delivery_logs")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("[updateEmailDeliveryLog] Erro ao atualizar log:", error);
  }
}
