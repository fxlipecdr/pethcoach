import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Reproduz a falha que quebrou a build em produção.
 *
 * `AI_GENERATION_ENABLED=true` sem modelo invalidava o ambiente, e como a home
 * lê o ambiente para exibir preço, a build inteira caía com
 * `Error occurred prerendering page "/"`. Um recurso opcional derrubando o site
 * é desproporcional: existe fallback determinístico exatamente para isso.
 */
const ambienteOriginal = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ambienteOriginal };
});

afterEach(() => {
  process.env = { ...ambienteOriginal };
  vi.restoreAllMocks();
});

describe("resiliência da configuração de IA", () => {
  it("IA ligada pela metade não invalida o ambiente", async () => {
    process.env.AI_GENERATION_ENABLED = "true";
    delete process.env.GEMINI_API_KEY;
    delete process.env.AI_MODEL_PLANNER;

    const { getServerEnv } = await import("@/lib/env/server");
    expect(() => getServerEnv()).not.toThrow();
  });

  it("IA ligada pela metade avisa e cai no determinístico", async () => {
    process.env.AI_GENERATION_ENABLED = "true";
    process.env.GEMINI_API_KEY = "chave";
    delete process.env.AI_MODEL_PLANNER;
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});

    const { aiProvider } = await import("@/lib/ai/provider");
    // Ligado pela metade parece IA ativa e não é: o aviso existe para que
    // ninguém descubra isso só ao notar que todos recebem o mesmo plano.
    expect(aiProvider.provider).toBe("unconfigured");
    expect(aviso).toHaveBeenCalledWith(
      expect.stringContaining("AI_MODEL_PLANNER"),
    );
  });

  it("configuração completa seleciona o Gemini", async () => {
    process.env.AI_GENERATION_ENABLED = "true";
    process.env.GEMINI_API_KEY = "chave";
    process.env.AI_MODEL_PLANNER = "gemini-3.8-flash";

    const { aiProvider } = await import("@/lib/ai/provider");
    expect(aiProvider.provider).toBe("gemini");
  });

  it("a vitrine de preços sobrevive a ambiente ilegível", async () => {
    vi.doMock("@/lib/stripe/provider", () => ({
      paymentProvider: {
        isConfigured: () => {
          throw new Error("Configuração de ambiente inválida: QUALQUER_COISA");
        },
        getLivePrice: vi.fn(),
      },
    }));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { resolvePlanPrices } = await import("@/features/billing/pricing");
    const precos = await resolvePlanPrices();

    // Preço é conteúdo importante, mas nunca ao ponto de tirar o site do ar.
    expect(precos.single_program.motivo).toBe("ambiente_ilegivel");
    expect(precos.single_program.available).toBe(true);
    expect(precos.single_program.priceFormatted).toMatch(/^R\$/);
  });
});
