"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeActionLimit } from "@/lib/security/rate-limit";
import {
  emailPreferencesSchema,
  unsubscribeInputSchema,
  type EmailPreferences,
} from "./contracts";
import {
  getOrCreateEmailPreferences,
  updateEmailPreferences,
  unsubscribeByToken,
  resubscribeByToken,
} from "./data";

export async function getUserEmailPreferencesAction(): Promise<EmailPreferences | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const row = await getOrCreateEmailPreferences(user.id);
  if (!row) return null;

  return {
    trainingReminders: row.training_reminders,
    milestoneCelebrations: row.milestone_celebrations,
    billingNotifications: row.billing_notifications,
    marketingTips: row.marketing_tips,
    unsubscribedAll: row.unsubscribed_all,
  };
}

export async function updateEmailPreferencesAction(
  rawInput: unknown,
): Promise<{ ok: boolean; error?: string; preferences?: EmailPreferences }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Serviço indisponível no momento." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Você precisa estar autenticado para atualizar suas preferências." };
  }

  const parsed = emailPreferencesSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Dados de preferências inválidos." };
  }

  if (!(await consumeActionLimit(supabase, "email_preferences_write", user.id)))
    return {
      ok: false,
      error: "Muitas alterações em pouco tempo. Aguarde um minuto.",
    };

  const updated = await updateEmailPreferences(user.id, parsed.data);
  if (!updated) {
    return { ok: false, error: "Não foi possível salvar suas preferências de e-mail." };
  }

  return {
    ok: true,
    preferences: {
      trainingReminders: updated.training_reminders,
      milestoneCelebrations: updated.milestone_celebrations,
      billingNotifications: updated.billing_notifications,
      marketingTips: updated.marketing_tips,
      unsubscribedAll: updated.unsubscribed_all,
    },
  };
}

export async function unsubscribeByTokenAction(
  rawInput: unknown,
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const parsed = unsubscribeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Link de cancelamento inválido ou expirado." };
  }

  const result = await unsubscribeByToken(parsed.data.token, {
    category: parsed.data.category,
    all: parsed.data.all,
  });

  if (!result) {
    return { ok: false, error: "Código de desinscrição não encontrado." };
  }

  const message = parsed.data.all || !parsed.data.category
    ? "Você foi desinscrito de todas as comunicações por e-mail com sucesso."
    : "Sua preferência foi atualizada: você não receberá mais este tipo de mensagem.";

  return { ok: true, message };
}

export async function resubscribeByTokenAction(
  rawInput: unknown,
): Promise<{ ok: boolean; error?: string; message?: string }> {
  const parsed = unsubscribeInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: "Link inválido." };
  }

  const result = await resubscribeByToken(parsed.data.token, {
    category: parsed.data.category,
    all: parsed.data.all,
  });

  if (!result) {
    return { ok: false, error: "Código não encontrado." };
  }

  return {
    ok: true,
    message: "Suas notificações foram reativadas com sucesso.",
  };
}
