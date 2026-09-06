import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getUser: vi.fn(),
  profile: vi.fn(),
}));

/** Cliente mínimo: sessão do Auth mais a leitura de `profiles.deleted_at`. */
function clientWithProfile(deletedAt: string | null = null) {
  mocks.profile.mockResolvedValue({ data: { deleted_at: deletedAt }, error: null });
  return {
    auth: { getUser: mocks.getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: mocks.profile }),
      }),
    }),
  };
}
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: mocks.createClient,
}));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT:${path}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
import { requireAdmin, requireUser } from "@/lib/security/auth";

describe("server authorization", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("redirects when provider is absent", async () => {
    mocks.createClient.mockResolvedValue(null);
    await expect(requireUser()).rejects.toThrow("REDIRECT:/entrar");
  });
  it("redirects when the Auth server rejects the session", async () => {
    mocks.createClient.mockResolvedValue(clientWithProfile());
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("invalid jwt"),
    });
    await expect(requireUser()).rejects.toThrow("REDIRECT:/entrar");
  });
  it("recusa uma conta anonimizada mesmo com sessão válida", async () => {
    mocks.createClient.mockResolvedValue(
      clientWithProfile("2026-09-05T00:00:00.000Z"),
    );
    mocks.getUser.mockResolvedValue({
      data: { user: { id: "test", app_metadata: {} } },
      error: null,
    });
    await expect(requireUser()).rejects.toThrow("REDIRECT:/entrar?conta=removida");
  });
  it("does not grant admin from user-editable metadata", async () => {
    mocks.createClient.mockResolvedValue(clientWithProfile());
    mocks.getUser.mockResolvedValue({
      data: {
        user: {
          id: "test",
          user_metadata: { role: "admin" },
          app_metadata: {},
        },
      },
      error: null,
    });
    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
  });
  it("accepts only a verified user with server-managed admin role", async () => {
    const user = { id: "test", app_metadata: { role: "admin" } };
    mocks.createClient.mockResolvedValue(clientWithProfile());
    mocks.getUser.mockResolvedValue({ data: { user }, error: null });
    await expect(requireAdmin()).resolves.toEqual(user);
  });
});

describe("diagnóstico de posse da avaliação", () => {
  /**
   * "Não foi possível comprovar a posse" cobria quatro causas com correções
   * opostas. Cada uma precisa ser distinguível, senão não há como saber o que
   * consertar — nem o operador no log, nem o tutor na tela.
   */
  const segredo = "s".repeat(32);
  const idA = "11111111-1111-4111-8111-111111111111";
  const idB = "22222222-2222-4222-8222-222222222222";

  it("separa as quatro causas", async () => {
    const { createAssessmentToken, diagnoseAssessmentToken } = await import(
      "@/features/assessments/token"
    );

    expect(diagnoseAssessmentToken(undefined, idA, segredo)).toBe("sem_cookie");
    expect(diagnoseAssessmentToken("nao-e-token", idA, segredo)).toBe(
      "formato_invalido",
    );

    const valido = createAssessmentToken(idA, segredo);
    expect(diagnoseAssessmentToken(valido, idA, segredo)).toBeNull();

    // Segredo trocado no servidor invalida todos os tokens emitidos antes.
    expect(diagnoseAssessmentToken(valido, idA, "o".repeat(32))).toBe(
      "assinatura_invalida",
    );

    // Quiz refeito no mesmo navegador: o cookie aponta para a avaliação nova.
    expect(diagnoseAssessmentToken(valido, idB, segredo)).toBe(
      "outra_avaliacao",
    );

    const oitoDias = Date.now() + 8 * 24 * 60 * 60 * 1000;
    expect(diagnoseAssessmentToken(valido, idA, segredo, oitoDias)).toBe(
      "expirado",
    );
  });

  it("o veredito nunca carrega o token", async () => {
    const { createAssessmentToken, diagnoseAssessmentToken } = await import(
      "@/features/assessments/token"
    );
    const token = createAssessmentToken(idA, segredo);
    const falha = diagnoseAssessmentToken(token, idB, segredo);
    expect(typeof falha).toBe("string");
    expect(token).not.toContain(String(falha));
    expect(String(falha)).not.toContain(token.slice(0, 12));
  });
});
