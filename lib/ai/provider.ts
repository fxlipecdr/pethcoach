import "server-only";
import { unavailable, type Unavailable } from "@/lib/providers";

// P7 will implement OpenAI Responses API after deterministic safety and catalog approval.
export interface AIProvider {
  readonly provider: string;
  generatePlan(input: {
    assessmentId: string;
    eligibleModuleIds: readonly string[];
    promptVersion: string;
  }): Promise<Unavailable>;
}
export const aiProvider: AIProvider = {
  provider: "unconfigured",
  async generatePlan() {
    return unavailable;
  },
};
