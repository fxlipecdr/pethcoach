import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validateStructuredPlan } from "@/features/plans/engine";
import type { BehaviorModule } from "@/features/plans/contracts";

/**
 * O planner de IA é a única parte do produto onde um texto gerado influencia o
 * que o tutor pratica com o cão. As garantias que importam não são de
 * qualidade, são de contenção: o modelo não pode inventar exercício, não pode
 * furar o formato e não pode receber dado pessoal.
 */
const ambienteOriginal = { ...process.env };

const modulos: BehaviorModule[] = [
  {
    id: "70000000-0000-4000-8000-000000000001",
    problemId: "10000000-0000-4000-8000-000000000001",
    slug: "modulo-a",
    title: "Módulo A",
    category: "ambientacao",
    difficulty: "beginner",
    estimatedDurationMinutes: 3,
    setupInstructions: "Ambiente calmo.",
    steps: ["Passo um.", "Passo dois."],
    successCriteria: "Critério.",
    stopConditions: "Pare se houver desconforto.",
    tags: ["quiet"],
    contraindications: ["bite_injury"],
    version: 1,
    status: "published",
  },
  {
    id: "70000000-0000-4000-8000-000000000002",
    problemId: "10000000-0000-4000-8000-000000000001",
    slug: "modulo-b",
    title: "Módulo B",
    category: "foco",
    difficulty: "intermediate",
    estimatedDurationMinutes: 5,
    setupInstructions: "Guia frouxa.",
    steps: ["Passo um."],
    successCriteria: "Critério.",
    stopConditions: "Pare se houver agitação.",
    tags: ["focus"],
    contraindications: [],
    version: 1,
    status: "published",
  },
];

function planoValido(ids: string[]) {
  return {
    days: Array.from({ length: 14 }, (_, i) => ({
      dayNumber: i + 1,
      moduleIds: [ids[i % ids.length]],
    })),
  };
}

function respostaGemini(payload: unknown) {
  return new Response(
    JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
    }),
    { status: 200 },
  );
}

async function carregar() {
  vi.resetModules();
  return import("@/lib/ai/gemini");
}

beforeEach(() => {
  process.env.AI_GENERATION_ENABLED = "true";
  process.env.GEMINI_API_KEY = "chave-de-teste";
  process.env.AI_MODEL_PLANNER = "gemini-2.5-flash";
});

afterEach(() => {
  process.env = { ...ambienteOriginal };
  vi.restoreAllMocks();
});

describe("planner Gemini", () => {
  it("não chama a API quando a IA está desligada", async () => {
    process.env.AI_GENERATION_ENABLED = "false";
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { criarProvedorGemini } = await carregar();

    const resultado = await criarProvedorGemini().generatePlan({
      assessmentId: "a",
      availableModules: modulos,
      promptVersion: "v1",
    });

    expect(resultado.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("não vaza dado pessoal no prompt", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        respostaGemini(planoValido(modulos.map((m) => m.id))),
      );
    const { criarProvedorGemini } = await carregar();

    await criarProvedorGemini().generatePlan({
      assessmentId: "11111111-1111-4111-8111-111111111111",
      availableModules: modulos,
      answers: { dog_stage: "puppy", supervision: "most_time" },
      promptVersion: "v1",
    });

    const corpo = String(fetchSpy.mock.calls[0]?.[1]?.body);
    // Nem e-mail, nem identificador da avaliação, nem id de usuário.
    expect(corpo).not.toContain("11111111-1111-4111-8111-111111111111");
    expect(corpo).not.toMatch(/@/);
    // As respostas, sim: são elas que personalizam.
    expect(corpo).toContain("dog_stage");
    expect(corpo).toContain("puppy");
  });

  it("exige formato estrito do modelo", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        respostaGemini(planoValido(modulos.map((m) => m.id))),
      );
    const { criarProvedorGemini } = await carregar();

    await criarProvedorGemini().generatePlan({
      assessmentId: "a",
      availableModules: modulos,
      promptVersion: "v1",
    });

    const corpo = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
    expect(corpo.generationConfig.responseMimeType).toBe("application/json");
    expect(corpo.generationConfig.responseSchema).toBeDefined();
    // Variação não agrega nada aqui e atrapalha reprodutibilidade.
    expect(corpo.generationConfig.temperature).toBeLessThanOrEqual(0.3);
  });

  it("um plano com módulo inventado é recusado pela validação", async () => {
    const inventado = planoValido(["99999999-9999-4999-8999-999999999999"]);
    // O provedor devolve o que o modelo mandou, sem confiar nele...
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respostaGemini(inventado));
    const { criarProvedorGemini } = await carregar();

    const resultado = await criarProvedorGemini().generatePlan({
      assessmentId: "a",
      availableModules: modulos,
      promptVersion: "v1",
    });
    expect(resultado.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalled();

    // ...e é aqui que ele é barrado, antes de virar plano de alguém.
    if (resultado.ok) {
      expect(validateStructuredPlan(resultado.schedule, modulos, 14)).toBe(
        false,
      );
    }
  });

  it("um plano só com módulos do catálogo passa na validação", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respostaGemini(planoValido(modulos.map((m) => m.id))),
    );
    const { criarProvedorGemini } = await carregar();

    const resultado = await criarProvedorGemini().generatePlan({
      assessmentId: "a",
      availableModules: modulos,
      promptVersion: "v1",
    });

    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(validateStructuredPlan(resultado.schedule, modulos, 14)).toBe(true);
      expect(resultado.modelVersion).toBe("gemini-2.5-flash");
    }
  });

  it("responde a falha da API sem lançar, para o determinístico assumir", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("erro", { status: 500 }),
    );
    const { criarProvedorGemini } = await carregar();

    const resultado = await criarProvedorGemini().generatePlan({
      assessmentId: "a",
      availableModules: modulos,
      promptVersion: "v1",
    });

    expect(resultado).toMatchObject({ ok: false, code: "PROVIDER_ERROR" });
  });

  it("distingue limite de uso de erro genérico", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("slow down", { status: 429 }),
    );
    const { criarProvedorGemini } = await carregar();

    const resultado = await criarProvedorGemini().generatePlan({
      assessmentId: "a",
      availableModules: modulos,
      promptVersion: "v1",
    });

    expect(resultado).toMatchObject({ ok: false, code: "RATE_LIMITED" });
  });

  it("recusa resposta que não é JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: "isto não é json" }] } }],
        }),
        { status: 200 },
      ),
    );
    const { criarProvedorGemini } = await carregar();

    const resultado = await criarProvedorGemini().generatePlan({
      assessmentId: "a",
      availableModules: modulos,
      promptVersion: "v1",
    });

    expect(resultado).toMatchObject({ ok: false, code: "INVALID_OUTPUT" });
  });
});
