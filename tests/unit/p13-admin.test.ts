import { describe, expect, it } from "vitest";
import {
  containsAversiveTerms,
  moduleEditorSchema,
  transitionModuleSchema,
  inspectorSearchSchema,
  maskEmail,
  ALLOWED_TRANSITIONS,
  ADMIN_ONLY_STATUSES,
  BANNED_AVERSIVE_TERMS,
} from "@/features/admin/contracts";

describe("P13 Admin and Content Governance - Unit Tests", () => {
  describe("Anti-aversive validation (Positive reinforcement policy)", () => {
    it("detects banned aversive terms across text inputs", () => {
      expect(BANNED_AVERSIVE_TERMS.length).toBeGreaterThan(5);
      expect(containsAversiveTerms("Use um enforcador para conter")).toBe("enforcador");
      expect(containsAversiveTerms("Dê uma bronca quando ele pular")).toBe("bronca");
      expect(containsAversiveTerms("Aplique um tranco rápido na guia")).toBe("tranco");
      expect(containsAversiveTerms("Apresente-se como líder da matilha")).toBe("líder da matilha");
      expect(containsAversiveTerms("Uso de coleira de choque é proibido")).toBe("coleira de choque");
      expect(containsAversiveTerms("Recompense com petisco quando sentar")).toBeNull();
    });

    it("rejects module submission if setup instructions contain aversive terms", () => {
      const parsed = moduleEditorSchema.safeParse({
        problemSlug: "cachorro-puxa-guia",
        slug: "guia-unificada",
        title: "Treino de Guia Frouxa",
        category: "Passeio",
        difficulty: "beginner",
        estimatedDurationMinutes: 5,
        setupInstructions: "Coloque o enforcador logo atrás das orelhas do cão.",
        steps: ["Caminhe devagar", "Pare quando ele puxar"],
        successCriteria: "O cão mantém a guia frouxa por 5 metros.",
        stopConditions: "Se demonstrar frustração, encerre a sessão.",
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("termo punitivo/aversivo detectado: \"enforcador\"");
      }
    });

    it("rejects module submission if any step contains aversive terms", () => {
      const parsed = moduleEditorSchema.safeParse({
        problemSlug: "filhote-mordendo",
        slug: "mordida-filhote-redireciona",
        title: "Redirecionamento Positivo",
        category: "Mordidas",
        difficulty: "beginner",
        estimatedDurationMinutes: 5,
        setupInstructions: "Separe brinquedos apropriados e petiscos de alto valor.",
        steps: ["Ofereça o brinquedo", "Se ele morder sua mão dê uma bronca firme"],
        successCriteria: "O filhote engaja com o brinquedo sem morder a pele.",
        stopConditions: "Se o filhote ficar superexcitado, faça uma pausa.",
      });

      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0]?.message).toContain("termo punitivo/aversivo detectado: \"bronca\"");
      }
    });

    it("approves valid reward-based module submission", () => {
      const parsed = moduleEditorSchema.safeParse({
        problemSlug: "filhote-mordendo",
        slug: "redirecionamento-positivo",
        title: "Redirecionamento com Brinquedo",
        category: "Mordidas",
        difficulty: "beginner",
        estimatedDurationMinutes: 5,
        setupInstructions: "Tenha em mãos um mordedor macio e petiscos pequenos.",
        steps: [
          "Quando o filhote se aproximar, apresente o brinquedo.",
          "Elogie e recompense assim que ele segurar o brinquedo com a boca.",
        ],
        successCriteria: "O cão mantém a boca no brinquedo por pelo menos 10 segundos.",
        stopConditions: "Pare o exercício se o filhote bocejar ou desviar o olhar repetidamente.",
      });

      expect(parsed.success).toBe(true);
    });
  });

  describe("State Machine Transition Rules", () => {
    it("enforces allowed editorial transitions", () => {
      expect(ALLOWED_TRANSITIONS.draft).toContain("reviewed");
      expect(ALLOWED_TRANSITIONS.draft).toContain("archived");
      expect(ALLOWED_TRANSITIONS.draft).not.toContain("published");

      expect(ALLOWED_TRANSITIONS.reviewed).toContain("published");
      expect(ALLOWED_TRANSITIONS.reviewed).toContain("draft");
      expect(ALLOWED_TRANSITIONS.reviewed).toContain("archived");

      expect(ALLOWED_TRANSITIONS.published).toContain("archived");
      expect(ALLOWED_TRANSITIONS.published).not.toContain("draft");

      expect(ALLOWED_TRANSITIONS.archived).toContain("draft");
      expect(ALLOWED_TRANSITIONS.archived).not.toContain("published");
    });

    it("restricts published and archived statuses to admin role", () => {
      expect(ADMIN_ONLY_STATUSES).toContain("published");
      expect(ADMIN_ONLY_STATUSES).toContain("archived");
      expect(ADMIN_ONLY_STATUSES).not.toContain("reviewed");
      expect(ADMIN_ONLY_STATUSES).not.toContain("draft");
    });

    it("validates transitionModuleSchema notes requirement", () => {
      const valid = transitionModuleSchema.safeParse({
        moduleId: "11111111-1111-4111-8111-111111111111",
        toStatus: "reviewed",
        notes: "Módulo validado tecnicamente sem aversivos.",
      });
      expect(valid.success).toBe(true);

      const invalidNotes = transitionModuleSchema.safeParse({
        moduleId: "11111111-1111-4111-8111-111111111111",
        toStatus: "reviewed",
        notes: "ok", // Too short (< 3 chars)
      });
      expect(invalidNotes.success).toBe(false);
    });
  });

  describe("Zero PII Inspector and Privacy Compliance", () => {
    it("masks email addresses correctly preserving domain", () => {
      expect(maskEmail("usuario@exemplo.com.br")).toBe("us***o@exemplo.com.br");
      expect(maskEmail("ab@empresa.com")).toBe("a***@empresa.com");
      expect(maskEmail("contato.suporte@peth.com.br")).toBe("co***e@peth.com.br");
      expect(maskEmail("invalido")).toBe("***");
    });

    it("validates inspector search schema requiring at least 3 characters", () => {
      expect(inspectorSearchSchema.safeParse({ query: "12" }).success).toBe(false);
      expect(inspectorSearchSchema.safeParse({ query: "cus_12345" }).success).toBe(true);
      expect(
        inspectorSearchSchema.safeParse({
          query: "11111111-1111-4111-8111-111111111111",
          searchType: "assessment",
        }).success,
      ).toBe(true);
    });
  });
});
