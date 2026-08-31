import "server-only";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/features/auth/contracts";

export async function authenticatedData(next = "/app") {
  const login = `/entrar?next=${encodeURIComponent(safeReturnPath(next))}`;
  const client = await createSupabaseServerClient();
  if (!client) redirect(login);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect(login);
  return { client, user: data.user };
}

export async function listDogs() {
  const { client, user } = await authenticatedData("/app/caes");
  const { data, error } = await client
    .from("dogs")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .order("id");
  if (error) throw new Error("Não foi possível carregar os cães.");
  return data;
}

export async function getDog(id: string) {
  const { client, user } = await authenticatedData(`/app/caes/${id}`);
  const { data, error } = await client
    .from("dogs")
    .select("*")
    .eq("owner_id", user.id)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar o perfil do cão.");
  if (!data) notFound();
  return data;
}
