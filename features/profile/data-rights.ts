import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * P14 — portabilidade (LGPD). Reúne tudo que o titular pode levar consigo.
 *
 * Todas as consultas passam pelo cliente autenticado do próprio usuário, então
 * a RLS continua sendo a fronteira: nenhuma linha de outra conta é alcançável
 * mesmo que um filtro seja esquecido aqui.
 */
export interface AccountExport {
  gerado_em: string;
  formato: string;
  conta: unknown;
  caes: unknown;
  avaliacoes: unknown;
  planos: unknown;
  tarefas: unknown;
  checkins: unknown;
  marcos: unknown;
  adaptacoes: unknown;
  preferencias_de_email: unknown;
  acessos_contratados: unknown;
  origem_de_visita: unknown;
}

export async function buildAccountExport(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<AccountExport> {
  const [
    profile,
    dogs,
    assessments,
    plans,
    checkins,
    milestones,
    adaptations,
    emailPreferences,
    entitlements,
    attribution,
  ] = await Promise.all([
    client.from("profiles").select("*").eq("id", userId).maybeSingle(),
    client.from("dogs").select("*").eq("owner_id", userId),
    client.from("assessments").select("*").eq("user_id", userId),
    client.from("plans").select("*").eq("user_id", userId),
    client.from("daily_checkins").select("*").eq("user_id", userId),
    client.from("plan_milestones").select("*").eq("user_id", userId),
    client.from("plan_adaptations").select("*").eq("user_id", userId),
    client.from("email_preferences").select("*").eq("user_id", userId),
    client.from("entitlements").select("*").eq("user_id", userId),
    client.from("attribution_touches").select("*").eq("user_id", userId),
  ]);

  // As tarefas pertencem ao plano, não ao usuário; a RLS as libera pelo plano.
  const planIds = (plans.data ?? []).map((plan) => plan.id);
  const tasks = planIds.length
    ? await client.from("plan_tasks").select("*").in("plan_id", planIds)
    : { data: [] };

  return {
    gerado_em: new Date().toISOString(),
    formato:
      "Exportação de dados pessoais do PethCoach. Cada chave corresponde a uma tabela.",
    conta: profile.data ?? null,
    caes: dogs.data ?? [],
    avaliacoes: assessments.data ?? [],
    planos: plans.data ?? [],
    tarefas: tasks.data ?? [],
    checkins: checkins.data ?? [],
    marcos: milestones.data ?? [],
    adaptacoes: adaptations.data ?? [],
    preferencias_de_email: emailPreferences.data ?? [],
    acessos_contratados: entitlements.data ?? [],
    origem_de_visita: attribution.data ?? [],
  };
}
