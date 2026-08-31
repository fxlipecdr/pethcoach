import "server-only";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeReturnPath } from "@/features/auth/contracts";

export async function requireUser(next?: string) {
  const login = next
    ? `/entrar?next=${encodeURIComponent(safeReturnPath(next))}`
    : "/entrar";
  const client = await createSupabaseServerClient();
  if (!client) redirect(login);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect(login);
  return data.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  // app_metadata is server-managed; user_metadata must never grant permissions.
  if (user.app_metadata.role !== "admin") notFound();
  return user;
}
