import "server-only";
import { unavailable, type Unavailable } from "@/lib/providers";
import { getServerEnv } from "@/lib/env/server";
import { criarProvedorGemini } from "./gemini";
import type {
  BehaviorModule,
  StructuredPlanOutput,
} from "@/features/plans/contracts";

export type AIPlanGenerationResult =
  | {
      ok: true;
      schedule: StructuredPlanOutput;
      modelVersion: string;
      promptVersion: string;
    }
  | Unavailable
  | {
      ok: false;
      code: "RATE_LIMITED" | "INVALID_OUTPUT" | "PROVIDER_ERROR";
      message?: string;
    };

export interface AIProvider {
  readonly provider: string;
  generatePlan(input: {
    assessmentId: string;
    eligibleModuleIds?: readonly string[];
    availableModules?: readonly BehaviorModule[];
    /**
     * Respostas do questionário, já normalizadas para rótulo legível. É o que
     * permite ao planner personalizar — o determinístico não as recebe, e por
     * isso entrega o mesmo plano para todo mundo com o mesmo problema.
     */
    answers?: Record<string, string>;
    dogName?: string;
    promptVersion: string;
  }): Promise<AIPlanGenerationResult>;
}

const semProvedor: AIProvider = {
  provider: "unconfigured",
  async generatePlan() {
    return unavailable;
  },
};

/**
 * Escolha do provedor, resolvida uma vez por processo.
 *
 * Sem chave e sem modelo, o planner de IA simplesmente não existe e o
 * determinístico assume — que é o comportamento correto para um ambiente de
 * desenvolvimento ou para uma configuração incompleta em produção.
 */
let cache: AIProvider | null = null;

export const aiProvider: AIProvider = {
  get provider() {
    return resolver().provider;
  },
  generatePlan(input) {
    return resolver().generatePlan(input);
  },
};

function resolver(): AIProvider {
  if (cache) return cache;
  const env = getServerEnv();
  cache =
    env.AI_GENERATION_ENABLED && env.GEMINI_API_KEY && env.AI_MODEL_PLANNER
      ? criarProvedorGemini()
      : semProvedor;
  return cache;
}

/** Só para teste: descarta a escolha memorizada. */
export function resetAiProviderCache() {
  cache = null;
}
