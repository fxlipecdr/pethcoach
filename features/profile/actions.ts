"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { consumeActionLimit } from "@/lib/security/rate-limit";
import type { AuthState } from "@/features/auth/contracts";
import { deleteAccountConfirmation } from "./contracts";

export async function saveProfile(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const client = await createSupabaseServerClient();
  if (!client)
    return { status: "error", message: "O banco ainda não está configurado." };
  const session = await client.auth.getUser().catch(() => null);
  if (!session)
    return {
      status: "error",
      message:
        "Não conseguimos confirmar sua sessão. Tente novamente em alguns instantes.",
    };
  const { data, error } = session;
  if (error || !data.user)
    return {
      status: "error",
      message: "Sua sessão expirou. Entre novamente antes de salvar.",
    };
  const name = z.string().trim().max(100).safeParse(form.get("name"));
  if (!name.success)
    return { status: "error", fieldError: "Use até 100 caracteres." };
  if (!(await consumeActionLimit(client, "profile_write", data.user.id)))
    return {
      status: "error",
      message: "Aguarde um minuto antes de salvar novamente.",
    };
  try {
    const { error: updateError, data: profile } = await client
      .from("profiles")
      .update({ name: name.data || null })
      .eq("id", data.user.id)
      .select("id")
      .maybeSingle();
    if (updateError || !profile)
      return {
        status: "error",
        message: "Não foi possível salvar seu nome. Tente novamente.",
      };
  } catch {
    return { status: "error", message: "Falha de conexão. Tente novamente." };
  }
  revalidatePath("/app/conta");
  return { status: "success", message: "Seu nome foi atualizado." };
}

/**
 * P14 — exclusão de conta por anonimização (LGPD).
 *
 * Apaga cães, avaliações, planos, check-ins, marcos, adaptações, preferências
 * e registros de origem. Preserva `billing_customers` e `entitlements`, que são
 * registro de transação com obrigação fiscal e passam a apontar para um perfil
 * sem nome. A remoção acontece dentro de `public.anonymize_account()`, que
 * opera apenas sobre `auth.uid()` e não aceita id vindo do cliente.
 */
export async function deleteAccount(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const client = await createSupabaseServerClient();
  if (!client)
    return { status: "error", message: "O banco ainda não está configurado." };

  const session = await client.auth.getUser().catch(() => null);
  const user = session?.data.user;
  if (!user || session?.error)
    return {
      status: "error",
      message: "Sua sessão expirou. Entre novamente antes de continuar.",
    };

  const confirmation = z
    .string()
    .trim()
    .safeParse(form.get("confirmacao"));
  if (
    !confirmation.success ||
    confirmation.data.toUpperCase() !== deleteAccountConfirmation
  )
    return {
      status: "error",
      fieldError: `Digite ${deleteAccountConfirmation} para confirmar.`,
    };

  if (!(await consumeActionLimit(client, "account_delete", user.id)))
    return {
      status: "error",
      message: "Aguarde alguns minutos antes de tentar novamente.",
    };

  const { error: anonymizeError } = await client.rpc("anonymize_account");
  if (anonymizeError)
    return {
      status: "error",
      message: "Não foi possível concluir a exclusão. Tente novamente.",
    };

  // O e-mail vive em auth.users, fora do alcance da RLS. Sem a chave de
  // serviço a conta já fica sem dado pessoal e sem acesso ao app, mas o
  // endereço permanece até que um operador conclua a remoção.
  const admin = createSupabaseAdminClient();
  if (admin) {
    // Falha aqui não desfaz a anonimização: os dados já foram removidos.
    await admin.auth.admin.updateUserById(user.id, {
      email: `removido+${user.id}@contas.invalido`,
      email_confirm: false,
      user_metadata: {},
      ban_duration: "876000h",
    });
  }

  try {
    await client.auth.signOut({ scope: "global" });
  } catch {
    // A conta já está anonimizada; a sessão restante é barrada por requireUser.
  }

  revalidatePath("/app", "layout");
  redirect("/entrar?conta=removida");
}
