import "server-only";
import { unavailable, type Unavailable } from "@/lib/providers";
import { getServerEnv } from "@/lib/env/server";

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string }
  | Unavailable;

export interface SendEmailPayload {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  idempotencyKey?: string;
  tags?: { name: string; value: string }[];
  // Backwards-compatible fields for legacy callers
  recipientId?: string;
  templateId?: string;
}

export interface EmailProvider {
  isConfigured(): boolean;
  send(payload: SendEmailPayload): Promise<SendEmailResult>;
}

export class ResendEmailProvider implements EmailProvider {
  private defaultFrom = "PethCoach <suporte@peth.com.br>";

  isConfigured(): boolean {
    const env = getServerEnv();
    return Boolean(env.RESEND_API_KEY);
  }

  async send(payload: SendEmailPayload): Promise<SendEmailResult> {
    const env = getServerEnv();
    if (!env.RESEND_API_KEY) {
      return unavailable;
    }

    const from = env.EMAIL_FROM || this.defaultFrom;
    const to = payload.to || payload.recipientId;

    if (!to) {
      return { ok: false, error: "Destinatário inválido ou não informado." };
    }

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      };

      if (payload.idempotencyKey) {
        headers["Idempotency-Key"] = payload.idempotencyKey;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify({
          from,
          to: [to],
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          tags: payload.tags,
        }),
      });

      const data = (await response.json()) as { id?: string; message?: string; name?: string };

      if (!response.ok) {
        return {
          ok: false,
          error: data.message || `Erro ao enviar e-mail (HTTP ${response.status})`,
        };
      }

      return {
        ok: true,
        id: data.id || "resend_unknown_id",
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erro desconhecido na conexão com o provedor de e-mail.";
      return { ok: false, error: errorMsg };
    }
  }
}

export const emailProvider: EmailProvider = new ResendEmailProvider();
