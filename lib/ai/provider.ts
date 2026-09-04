import "server-only";
import { unavailable, type Unavailable } from "@/lib/providers";
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
    dogName?: string;
    promptVersion: string;
  }): Promise<AIPlanGenerationResult>;
}

export const aiProvider: AIProvider = {
  provider: "unconfigured",
  async generatePlan() {
    return unavailable;
  },
};
