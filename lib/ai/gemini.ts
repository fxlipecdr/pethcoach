import "server-only";
import { getServerEnv } from "@/lib/env/server";
import { unavailable } from "@/lib/providers";
import type {
  BehaviorModule,
  StructuredPlanOutput,
} from "@/features/plans/contracts";
import type { AIPlanGenerationResult, AIProvider } from "./provider";

/**
 * Planner de IA sobre o Gemini.
 *
 * O que a IA pode e o que ela **não** pode, nesta ordem de importância:
 *
 * - Ela **não** decide segurança. A triagem determinística roda antes e o plano
 *   só chega aqui com desfecho `continue`. Nada que o modelo escreva reabre um
 *   caso encaminhado ou bloqueado.
 * - Ela **não** inventa exercício. Recebe a lista fechada de módulos aprovados e
 *   devolve apenas identificadores dessa lista. `validateStructuredPlan` recusa
 *   qualquer id fora do catálogo, e a recusa cai no planner determinístico.
 * - Ela **não** escreve texto que o tutor lê. O conteúdo de cada exercício vem
 *   do catálogo revisado; o modelo só escolhe quais entram em cada dia e em que
 *   ordem.
 *
 * O que ela faz: personalizar a sequência a partir das respostas do
 * questionário — o que hoje o planner determinístico ignora, entregando os
 * mesmos 14 dias para todo mundo com o mesmo problema.
 *
 * Falha de qualquer natureza devolve erro em vez de lançar: quem chama já sabe
 * cair para o determinístico, e um plano previsível é melhor que nenhum plano.
 */
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

/** Corte de segurança: o tutor não espera meio minuto por um plano. */
const TEMPO_LIMITE_MS = 12000;

function montarPrompt(
  modulos: readonly BehaviorModule[],
  respostas: Record<string, string> | undefined,
  nomeDoCao: string | undefined,
): string {
  const catalogo = modulos
    .map(
      (m) =>
        `- id: ${m.id}\n  titulo: ${m.title}\n  dificuldade: ${m.difficulty}\n  duracao_min: ${m.estimatedDurationMinutes}\n  foco: ${m.category}\n  tags: ${m.tags.join(", ")}`,
    )
    .join("\n");

  const contexto = respostas
    ? Object.entries(respostas)
        .map(([chave, valor]) => `- ${chave}: ${valor}`)
        .join("\n")
    : "- (sem respostas registradas)";

  return [
    "Você monta a sequência de um programa de treino canino de 14 dias.",
    "",
    "Regras invioláveis:",
    "1. Use SOMENTE os identificadores da lista de módulos abaixo. Nunca invente um id.",
    "2. Exatamente 14 dias, numerados de 1 a 14, em ordem.",
    "3. De 1 a 3 módulos por dia.",
    "4. Comece pelos módulos mais fáceis e avance a dificuldade ao longo dos dias.",
    "5. Repita módulos ao longo dos dias: repetição é como o cão aprende.",
    "",
    "Personalize a ordem e a ênfase segundo as respostas do tutor. Por exemplo:",
    "priorize o que a rotina dele indica como lacuna, e adiante o que ele já faz bem.",
    "",
    `Cão: ${nomeDoCao ?? "não informado"}`,
    "",
    "Respostas do questionário:",
    contexto,
    "",
    "Módulos disponíveis:",
    catalogo,
  ].join("\n");
}

/**
 * Esquema estrito exigido do modelo. O Gemini respeita `responseSchema`, o que
 * elimina a classe inteira de erro de "JSON quase válido".
 */
const ESQUEMA_RESPOSTA = {
  type: "OBJECT",
  properties: {
    days: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          dayNumber: { type: "INTEGER" },
          moduleIds: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["dayNumber", "moduleIds"],
      },
    },
    rationale: { type: "STRING" },
  },
  required: ["days"],
} as const;

export function criarProvedorGemini(): AIProvider {
  return {
    provider: "gemini",
    async generatePlan(input): Promise<AIPlanGenerationResult> {
      const env = getServerEnv();
      const chave = env.GEMINI_API_KEY;
      const modelo = env.AI_MODEL_PLANNER;
      if (!env.AI_GENERATION_ENABLED || !chave || !modelo) return unavailable;

      const modulos = input.availableModules ?? [];
      if (modulos.length === 0) {
        return { ok: false, code: "PROVIDER_ERROR", message: "sem_modulos" };
      }

      const controlador = new AbortController();
      const alarme = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);

      try {
        const resposta = await fetch(
          `${ENDPOINT}/${encodeURIComponent(modelo)}:generateContent`,
          {
            method: "POST",
            signal: controlador.signal,
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": chave,
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: montarPrompt(
                        modulos,
                        input.answers,
                        input.dogName,
                      ),
                    },
                  ],
                },
              ],
              generationConfig: {
                // Determinismo alto: o mesmo tutor deve receber o mesmo plano
                // se refizer a geração, e variação aqui não agrega nada.
                temperature: 0.2,
                responseMimeType: "application/json",
                responseSchema: ESQUEMA_RESPOSTA,
              },
            }),
          },
        );

        if (!resposta.ok) {
          return {
            ok: false,
            code: resposta.status === 429 ? "RATE_LIMITED" : "PROVIDER_ERROR",
            message: `http_${resposta.status}`,
          };
        }

        const corpo = (await resposta.json()) as {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const texto = corpo.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!texto) {
          return { ok: false, code: "INVALID_OUTPUT", message: "sem_conteudo" };
        }

        let bruto: unknown;
        try {
          bruto = JSON.parse(texto);
        } catch {
          return { ok: false, code: "INVALID_OUTPUT", message: "json_invalido" };
        }

        /**
         * A validação forte contra o catálogo acontece em
         * `validateStructuredPlan`, do lado de quem chama. Aqui só devolvemos o
         * que o modelo produziu, sem confiar nele.
         */
        return {
          ok: true,
          schedule: bruto as StructuredPlanOutput,
          modelVersion: modelo,
          promptVersion: input.promptVersion,
        };
      } catch (err) {
        const abortado =
          err instanceof Error && err.name === "AbortError";
        return {
          ok: false,
          code: "PROVIDER_ERROR",
          message: abortado ? "tempo_limite" : "erro_de_rede",
        };
      } finally {
        clearTimeout(alarme);
      }
    },
  };
}
