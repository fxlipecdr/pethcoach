import { z } from "zod";

export const OPERATOR_ROLES = ["admin", "reviewer", "operator"] as const;
export type OperatorRole = (typeof OPERATOR_ROLES)[number];

export const MODULE_STATUSES = [
  "draft",
  "reviewed",
  "published",
  "archived",
] as const;
export type ModuleStatus = (typeof MODULE_STATUSES)[number];

export const ALLOWED_TRANSITIONS: Record<ModuleStatus, ModuleStatus[]> = {
  draft: ["reviewed", "archived"],
  reviewed: ["published", "draft", "archived"],
  published: ["archived"],
  archived: ["draft"],
};

export const ADMIN_ONLY_STATUSES: ModuleStatus[] = ["published", "archived"];

// Anti-aversive terminology allowlist/denylist rules per AGENTS.md:
// "Training guidance must be reward-based only."
export const BANNED_AVERSIVE_TERMS = [
  "enforcador",
  "enforcadora",
  "coleira de choque",
  "choque",
  "castigo",
  "bronca",
  "tranco",
  "submissão",
  "alfa",
  "líder da matilha",
  "lider da matilha",
  "bater",
  "tapa",
  "esganar",
  "gritar",
  "punição física",
  "punicao fisica",
] as const;

export function containsAversiveTerms(text: string): string | null {
  const normalized = text.toLowerCase();
  for (const term of BANNED_AVERSIVE_TERMS) {
    if (normalized.includes(term)) {
      return term;
    }
  }
  return null;
}

export const moduleEditorSchema = z
  .object({
    id: z.string().uuid().optional(),
    problemSlug: z.enum([
      "filhote-mordendo",
      "xixi-lugar-errado",
      "cachorro-puxa-guia",
    ]),
    slug: z
      .string()
      .min(3, "Slug muito curto.")
      .max(80, "Slug muito longo.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug deve conter apenas letras minúsculas, números e hífens.",
      ),
    title: z.string().min(3, "Título deve ter no mínimo 3 caracteres.").max(140),
    category: z.string().min(3).max(60),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    estimatedDurationMinutes: z.number().int().min(2).max(15),
    setupInstructions: z.string().min(10, "Instruções de preparação devem ser detalhadas."),
    steps: z
      .array(z.string().min(5, "O passo deve ter pelo menos 5 caracteres."))
      .min(1, "O módulo deve ter pelo menos 1 passo.")
      .max(6, "O módulo não pode ter mais de 6 passos."),
    successCriteria: z.string().min(10, "Critérios de sucesso são obrigatórios."),
    stopConditions: z.string().min(10, "Condições de parada são obrigatórias para segurança."),
    tags: z.array(z.string()).default([]),
    contraindications: z.array(z.string()).default([]),
  })
  .superRefine((val, ctx) => {
    // Validate that all instructions and steps adhere strictly to positive reinforcement
    const fieldsToInspect = [
      { name: "title", value: val.title },
      { name: "setupInstructions", value: val.setupInstructions },
      { name: "successCriteria", value: val.successCriteria },
      { name: "stopConditions", value: val.stopConditions },
      ...val.steps.map((step, idx) => ({ name: `steps.${idx}`, value: step })),
    ];

    for (const field of fieldsToInspect) {
      const detected = containsAversiveTerms(field.value);
      if (detected) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field.name],
          message: `Violação da política de reforço positivo: termo punitivo/aversivo detectado: "${detected}".`,
        });
      }
    }
  });

export type ModuleEditorInput = z.infer<typeof moduleEditorSchema>;

export const transitionModuleSchema = z.object({
  moduleId: z.string().uuid("ID de módulo inválido."),
  toStatus: z.enum(MODULE_STATUSES),
  notes: z
    .string()
    .min(3, "O parecer técnico deve ter no mínimo 3 caracteres.")
    .max(1000, "O parecer técnico não pode ultrapassar 1000 caracteres."),
});

export type TransitionModuleInput = z.infer<typeof transitionModuleSchema>;

export const inspectorSearchSchema = z.object({
  query: z.string().trim().min(3, "Digite ao menos 3 caracteres para buscar.").max(120),
  searchType: z.enum(["all", "assessment", "customer", "email"]).default("all"),
});

export type InspectorSearchInput = z.infer<typeof inspectorSearchSchema>;

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const maskedLocal =
    local.length <= 2
      ? `${local[0]}***`
      : `${local.slice(0, 2)}***${local.slice(-1)}`;
  return `${maskedLocal}@${domain}`;
}

export interface SanitizedAssessment {
  id: string;
  problemSlug: string;
  safetyStatus: string;
  segment: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  hasUser: boolean;
}

export interface SanitizedEntitlement {
  id: string;
  scope: string;
  status: string;
  stripeCustomerId: string | null;
  startsAt: string;
  expiresAt: string | null;
}

export interface SanitizedEmailLog {
  id: string;
  maskedEmail: string;
  templateKey: string;
  idempotencyKey: string;
  status: string;
  skipReason: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface InspectorSearchResult {
  assessments: SanitizedAssessment[];
  entitlements: SanitizedEntitlement[];
  emailLogs: SanitizedEmailLog[];
}
