import "server-only";
import { redirect, notFound } from "next/navigation";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { safeReturnPath } from "@/features/auth/contracts";
import type { Database } from "@/lib/supabase/database.types";

export type OperatorRole = "admin" | "reviewer" | "operator";

/**
 * P14: uma conta anonimizada a pedido do titular pode ter sessão válida em
 * outro dispositivo. O perfil marcado com `deleted_at` encerra o acesso.
 */
export async function isAnonymizedAccount(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("profiles")
    .select("deleted_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) return false;
  return Boolean(data?.deleted_at);
}

export async function requireUser(next?: string): Promise<User> {
  const login = next
    ? `/entrar?next=${encodeURIComponent(safeReturnPath(next))}`
    : "/entrar";
  const client = await createSupabaseServerClient();
  if (!client) redirect(login);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) redirect(login);
  if (await isAnonymizedAccount(client, data.user.id))
    redirect("/entrar?conta=removida");
  return data.user;
}

export async function getOperatorRole(
  user: User,
  client?: SupabaseClient<Database> | null,
): Promise<OperatorRole | null> {
  // 1. Check server-managed app_metadata.role (highest priority, immune to user tampering)
  const appRole = user.app_metadata?.role as string | undefined;
  if (appRole && ["admin", "reviewer", "operator"].includes(appRole)) {
    return appRole as OperatorRole;
  }

  // 2. Check public.operator_roles in Supabase
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("operator_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return (data.role as OperatorRole) || null;
}

export async function requireOperator(
  allowedRoles: OperatorRole[] = ["admin", "reviewer", "operator"],
): Promise<{ user: User; role: OperatorRole }> {
  const user = await requireUser();
  const role = await getOperatorRole(user);
  if (!role || !allowedRoles.includes(role)) {
    notFound();
  }
  return { user, role };
}

export async function requireAdmin(): Promise<User> {
  const { user } = await requireOperator(["admin"]);
  return user;
}
