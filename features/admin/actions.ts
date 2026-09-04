"use server";

import { revalidatePath } from "next/cache";
import { requireOperator } from "@/lib/security/auth";
import {
  moduleEditorSchema,
  transitionModuleSchema,
  inspectorSearchSchema,
  type ModuleEditorInput,
  type TransitionModuleInput,
  type InspectorSearchInput,
  type InspectorSearchResult,
} from "./contracts";
import {
  transitionModuleStatus,
  upsertModuleDraft,
  inspectRecords,
} from "./data";
import type { ModuleRow } from "@/lib/supabase/database.types";

export interface ActionResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export async function transitionModuleStatusAction(
  rawInput: TransitionModuleInput,
): Promise<ActionResult<ModuleRow>> {
  const { user, role } = await requireOperator(["admin", "reviewer"]);

  const parsed = transitionModuleSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Dados inválidos.";
    return { ok: false, error: firstIssue };
  }

  const result = await transitionModuleStatus({
    moduleId: parsed.data.moduleId,
    operatorId: user.id,
    operatorRole: role,
    toStatus: parsed.data.toStatus,
    notes: parsed.data.notes,
  });

  if (!result.ok || !result.module) {
    return { ok: false, error: result.error || "Erro ao atualizar status." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/modulos");
  revalidatePath(`/admin/modulos/${parsed.data.moduleId}`);
  return { ok: true, data: result.module };
}

export async function saveModuleDraftAction(
  rawInput: ModuleEditorInput,
): Promise<ActionResult<{ moduleId: string }>> {
  const { user } = await requireOperator(["admin", "reviewer"]);

  const parsed = moduleEditorSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Dados do módulo inválidos.";
    return { ok: false, error: firstIssue };
  }

  const result = await upsertModuleDraft(parsed.data, user.id);
  if (!result.ok || !result.moduleId) {
    return { ok: false, error: result.error || "Erro ao salvar rascunho." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/modulos");
  revalidatePath(`/admin/modulos/${result.moduleId}`);
  return { ok: true, data: { moduleId: result.moduleId } };
}

export async function searchInspectorAction(
  rawInput: InspectorSearchInput,
): Promise<ActionResult<InspectorSearchResult>> {
  await requireOperator(["admin", "reviewer", "operator"]);

  const parsed = inspectorSearchSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Termo de busca inválido.";
    return { ok: false, error: firstIssue };
  }

  const results = await inspectRecords(parsed.data.query, parsed.data.searchType);
  return { ok: true, data: results };
}
