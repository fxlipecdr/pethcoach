import "server-only";
import { unavailable, type Unavailable } from "@/lib/providers";

export interface EmailProvider {
  send(input: {
    recipientId: string;
    templateId: string;
    idempotencyKey: string;
  }): Promise<Unavailable>;
}
export const emailProvider: EmailProvider = {
  async send() {
    return unavailable;
  },
};
