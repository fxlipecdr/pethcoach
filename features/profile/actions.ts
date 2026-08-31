"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authLimiter, privateRateKey } from "@/lib/security/rate-limit";
import type { AuthState } from "@/features/auth/contracts";

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
  if (!authLimiter.allow(`profile:${privateRateKey(data.user.id)}`, 20, 60_000))
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
