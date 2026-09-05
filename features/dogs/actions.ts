"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeActionLimit } from "@/lib/security/rate-limit";
import {
  dogMutationSchema,
  dogFormValues,
  type DogFormState,
} from "./contracts";

export async function saveDog(
  _previous: DogFormState,
  form: FormData,
): Promise<DogFormState> {
  // Authentication is repeated here: rendering a protected form is not authorization.
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
  const { data: auth, error: authError } = session;
  if (authError || !auth.user)
    return {
      status: "error",
      message: "Sua sessão expirou. Entre novamente antes de salvar.",
    };
  const values = dogFormValues(form);
  const parsed = dogMutationSchema.safeParse({
    ...values,
    id: form.get("id"),
    mode: form.get("mode"),
  });
  if (!parsed.success) {
    const errors = Object.fromEntries(
      parsed.error.issues.map((issue) => [issue.path[0], issue.message]),
    );
    return {
      status: "error",
      message: "Confira os campos indicados e tente novamente.",
      errors,
      values,
    };
  }
  if (!(await consumeActionLimit(client, "dog_write", auth.user.id)))
    return {
      status: "error",
      message:
        "Muitas alterações em pouco tempo. Aguarde um minuto e tente novamente.",
      values,
    };
  const { id, mode, ...fields } = parsed.data;
  try {
    if (mode === "create") {
      const { error } = await client
        .from("dogs")
        .insert({ id, owner_id: auth.user.id, ...fields });
      if (error) {
        // A retried form uses the same UUID; an existing row must still belong to this user.
        if (error.code !== "23505")
          return {
            status: "error",
            message:
              "Não foi possível salvar. Seus campos continuam preenchidos para tentar novamente.",
            values,
          };
        const { data: existing, error: readError } = await client
          .from("dogs")
          .select("id")
          .eq("id", id)
          .eq("owner_id", auth.user.id)
          .maybeSingle();
        if (readError || !existing)
          return {
            status: "error",
            message:
              "Não foi possível criar este perfil. Reabra o cadastro e tente novamente.",
            values,
          };
      }
    } else {
      const { data, error } = await client
        .from("dogs")
        .update(fields)
        .eq("id", id)
        .eq("owner_id", auth.user.id)
        .select("id")
        .maybeSingle();
      if (error || !data)
        return {
          status: "error",
          message:
            "Não foi possível salvar este perfil. Ele pode não estar disponível para sua conta.",
          values,
        };
    }
  } catch {
    return {
      status: "error",
      message:
        "Falha de conexão. Seus campos continuam preenchidos; tente novamente.",
      values,
    };
  }
  revalidatePath("/app", "layout");
  if (mode === "create") redirect(`/app/caes/${id}?created=1`);
  return {
    status: "success",
    message: "Perfil atualizado. As alterações foram salvas.",
    values,
  };
}
