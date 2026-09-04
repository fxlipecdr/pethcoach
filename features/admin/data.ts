import "server-only";
import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Database,
  ModuleRow,
  ModuleRevisionRow,
} from "@/lib/supabase/database.types";
import {
  ALLOWED_TRANSITIONS,
  ADMIN_ONLY_STATUSES,
  maskEmail,
  type ModuleStatus,
  type OperatorRole,
  type ModuleEditorInput,
  type InspectorSearchResult,
} from "./contracts";

export interface AdminModuleListItem extends ModuleRow {
  problem_slug?: string;
  revision_count?: number;
}

export async function listAllModulesForAdmin(
  filters: { problemSlug?: string; status?: ModuleStatus } = {},
  client?: SupabaseClient<Database> | null,
): Promise<AdminModuleListItem[]> {
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("modules")
    .select(`
      *,
      problems(slug)
    `)
    .order("created_at", { ascending: false });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("[listAllModulesForAdmin] Erro ao buscar módulos:", error);
    return [];
  }

  const formatted: AdminModuleListItem[] = data.map((row) => {
    const problemSlug = (row.problems as { slug?: string } | null)?.slug;
    return {
      ...row,
      problem_slug: problemSlug,
    };
  });

  if (filters.problemSlug) {
    return formatted.filter((m) => m.problem_slug === filters.problemSlug);
  }

  return formatted;
}

export async function getModuleWithRevisions(
  moduleId: string,
  client?: SupabaseClient<Database> | null,
): Promise<{ module: AdminModuleListItem | null; revisions: ModuleRevisionRow[] }> {
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return { module: null, revisions: [] };

  const { data: moduleData, error: modError } = await supabase
    .from("modules")
    .select(`
      *,
      problems(slug)
    `)
    .eq("id", moduleId)
    .maybeSingle();

  if (modError || !moduleData) {
    return { module: null, revisions: [] };
  }

  const { data: revisionsData } = await supabase
    .from("module_revisions")
    .select("*")
    .eq("module_id", moduleId)
    .order("created_at", { ascending: false });

  const problemSlug = (moduleData.problems as { slug?: string } | null)?.slug;
  const modItem: AdminModuleListItem = {
    ...moduleData,
    problem_slug: problemSlug,
  };

  return {
    module: modItem,
    revisions: (revisionsData as ModuleRevisionRow[]) || [],
  };
}

export async function transitionModuleStatus(
  input: {
    moduleId: string;
    operatorId: string;
    operatorRole: OperatorRole;
    toStatus: ModuleStatus;
    notes: string;
  },
  client?: SupabaseClient<Database> | null,
): Promise<{ ok: boolean; error?: string; module?: ModuleRow }> {
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Conexão com o banco indisponível." };

  const { data: currentMod, error: fetchError } = await supabase
    .from("modules")
    .select("status, version")
    .eq("id", input.moduleId)
    .maybeSingle();

  if (fetchError || !currentMod) {
    return { ok: false, error: "Módulo não encontrado." };
  }

  const currentStatus = currentMod.status as ModuleStatus;

  // 1. Check state machine transition validity
  const validTransitions = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!validTransitions.includes(input.toStatus)) {
    return {
      ok: false,
      error: `Transição inválida: não é permitido mover de '${currentStatus}' para '${input.toStatus}'.`,
    };
  }

  // 2. Check RBAC permissions for published/archived
  if (ADMIN_ONLY_STATUSES.includes(input.toStatus) && input.operatorRole !== "admin") {
    return {
      ok: false,
      error: "Apenas operadores com o papel de 'admin' podem publicar ou arquivar módulos.",
    };
  }

  // 3. Determine action tag
  let action: ModuleRevisionRow["action"] = "update";
  if (input.toStatus === "reviewed") action = "submit_review";
  if (input.toStatus === "published") action = "approve_publish";
  if (input.toStatus === "archived") action = "archive";

  // 4. Update module status
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("modules")
    .update({
      status: input.toStatus,
      reviewed_by: input.operatorId,
      reviewed_at: now,
    })
    .eq("id", input.moduleId)
    .select("*")
    .single();

  if (updateError || !updated) {
    return { ok: false, error: "Erro ao atualizar o status do módulo no banco de dados." };
  }

  // 5. Record revision audit trail
  await supabase.from("module_revisions").insert({
    module_id: input.moduleId,
    operator_id: input.operatorId,
    action,
    from_status: currentStatus,
    to_status: input.toStatus,
    notes: input.notes,
  });

  return { ok: true, module: updated as ModuleRow };
}

export async function upsertModuleDraft(
  input: ModuleEditorInput,
  operatorId: string,
  client?: SupabaseClient<Database> | null,
): Promise<{ ok: boolean; error?: string; moduleId?: string }> {
  const supabase = client || createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Conexão com o banco indisponível." };

  // Resolve problem ID from problem slug
  const { data: problem, error: probError } = await supabase
    .from("problems")
    .select("id")
    .eq("slug", input.problemSlug)
    .maybeSingle();

  if (probError || !problem) {
    return { ok: false, error: "Problema comportamental associado não encontrado." };
  }

  const moduleId = input.id || crypto.randomUUID();
  const isNew = !input.id;

  const payload: Database["public"]["Tables"]["modules"]["Insert"] = {
    id: moduleId,
    problem_id: problem.id,
    slug: input.slug,
    title: input.title,
    category: input.category,
    difficulty: input.difficulty,
    estimated_duration_minutes: input.estimatedDurationMinutes,
    setup_instructions: input.setupInstructions,
    steps: input.steps,
    success_criteria: input.successCriteria,
    stop_conditions: input.stopConditions,
    tags: input.tags,
    contraindications: input.contraindications,
    status: "draft",
    version: 1,
  };

  const { error: upsertError } = await supabase
    .from("modules")
    .upsert(payload);

  if (upsertError) {
    console.error("[upsertModuleDraft] Erro:", upsertError);
    return { ok: false, error: `Erro ao salvar rascunho: ${upsertError.message}` };
  }

  // Record revision
  await supabase.from("module_revisions").insert({
    module_id: moduleId,
    operator_id: operatorId,
    action: isNew ? "create" : "update",
    from_status: "draft",
    to_status: "draft",
    notes: isNew ? "Criação de novo módulo de treino em rascunho." : "Atualização de conteúdo do rascunho.",
  });

  return { ok: true, moduleId };
}

export async function inspectRecords(
  query: string,
  searchType: "all" | "assessment" | "customer" | "email" = "all",
  client?: SupabaseClient<Database> | null,
): Promise<InspectorSearchResult> {
  const supabase = client || createSupabaseAdminClient();
  const result: InspectorSearchResult = {
    assessments: [],
    entitlements: [],
    emailLogs: [],
  };

  if (!supabase || !query) return result;
  const term = query.trim();

  // 1. Search assessments (Zero PII - no open notes, no fake diagnostics)
  if (searchType === "all" || searchType === "assessment") {
    let q = supabase
      .from("assessments")
      .select(`
        id,
        safety_status,
        segment,
        status,
        started_at,
        completed_at,
        user_id,
        problems(slug)
      `)
      .limit(10);

    // If UUID format, search exact id, else match prefix
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)) {
      q = q.eq("id", term);
    }

    const { data: assessments } = await q;
    if (assessments) {
      result.assessments = assessments.map((a) => ({
        id: a.id,
        problemSlug: (a.problems as { slug?: string } | null)?.slug || "desconhecido",
        safetyStatus: a.safety_status,
        segment: a.segment,
        status: a.status,
        startedAt: a.started_at,
        completedAt: a.completed_at,
        hasUser: Boolean(a.user_id),
      }));
    }
  }

  // 2. Search entitlements (Zero PII - only scope, status, dates)
  if (searchType === "all" || searchType === "customer") {
    let q = supabase
      .from("entitlements")
      .select(`
        id,
        scope,
        status,
        stripe_customer_id,
        starts_at,
        expires_at
      `)
      .limit(10);

    if (term.startsWith("cus_")) {
      q = q.eq("stripe_customer_id", term);
    } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term)) {
      q = q.eq("user_id", term);
    }

    const { data: entitlements } = await q;
    if (entitlements) {
      result.entitlements = entitlements.map((e) => ({
        id: e.id,
        scope: e.scope,
        status: e.status,
        stripeCustomerId: e.stripe_customer_id ?? null,
        startsAt: e.starts_at,
        expiresAt: e.expires_at,
      }));
    }
  }

  // 3. Search email logs (Zero PII - strictly masked email)
  if (searchType === "all" || searchType === "email") {
    let q = supabase
      .from("email_delivery_logs")
      .select(`
        id,
        recipient_email,
        template_key,
        idempotency_key,
        status,
        skip_reason,
        sent_at,
        created_at
      `)
      .order("created_at", { ascending: false })
      .limit(15);

    if (term.includes("@")) {
      q = q.ilike("recipient_email", `%${term}%`);
    } else {
      q = q.ilike("idempotency_key", `%${term}%`);
    }

    const { data: logs } = await q;
    if (logs) {
      result.emailLogs = logs.map((l) => ({
        id: l.id,
        maskedEmail: maskEmail(l.recipient_email),
        templateKey: l.template_key,
        idempotencyKey: l.idempotency_key,
        status: l.status,
        skipReason: l.skip_reason,
        sentAt: l.sent_at,
        createdAt: l.created_at,
      }));
    }
  }

  return result;
}
