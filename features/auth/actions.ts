"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authLimiter, privateRateKey } from "@/lib/security/rate-limit";
import { emailSchema, safeReturnPath, type AuthState } from "./contracts";
import { getAuthConfig } from "./config";

export async function requestMagicLink(
  _previous: AuthState,
  form: FormData,
): Promise<AuthState> {
  const config = getAuthConfig();
  if (!config.enabled || !config.origin)
    return {
      status: "error",
      message: "O acesso por e-mail ainda não está configurado neste ambiente.",
    };
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success)
    return { status: "error", fieldError: "Informe um e-mail válido." };
  if (
    !authLimiter.allow("email-global", 30, 60_000) ||
    !authLimiter.allow(`email:${privateRateKey(email.data)}`, 1, 60_000)
  ) {
    return {
      status: "error",
      message: "Aguarde pelo menos um minuto antes de pedir outro link.",
    };
  }
  const callback = new URL("/auth/callback", config.origin);
  callback.searchParams.set("next", safeReturnPath(form.get("next")));
  try {
    const client = await createSupabaseServerClient();
    if (!client)
      return {
        status: "error",
        message: "O acesso está temporariamente indisponível.",
      };
    const { error } = await client.auth.signInWithOtp({
      email: email.data,
      options: { shouldCreateUser: true, emailRedirectTo: callback.toString() },
    });
    // Do not expose provider messages or account existence to the caller.
    if (error)
      return {
        status: "error",
        message:
          "Não foi possível solicitar o link. Confira o endereço e tente novamente em alguns minutos.",
      };
    return {
      status: "success",
      message:
        "Solicitação recebida. Confira sua caixa de entrada e o spam. Abra o link neste mesmo navegador para continuar.",
    };
  } catch {
    return {
      status: "error",
      message:
        "Não conseguimos acessar o serviço de e-mail. Tente novamente em alguns minutos.",
    };
  }
}

export async function signOut(): Promise<AuthState> {
  const client = await createSupabaseServerClient();
  if (client) {
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error)
        return {
          status: "error",
          message: "Não foi possível encerrar a sessão. Tente novamente.",
        };
    } catch {
      return {
        status: "error",
        message: "Não foi possível encerrar a sessão. Tente novamente.",
      };
    }
  }
  revalidatePath("/app", "layout");
  redirect("/entrar");
}
