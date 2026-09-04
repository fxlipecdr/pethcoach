import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailProvider as defaultEmailProvider, type EmailProvider } from "@/lib/email/provider";
import type { Database } from "@/lib/supabase/database.types";
import {
  sendEmailInputSchema,
  TEMPLATE_TO_CATEGORY,
  type SendEmailInput,
} from "./contracts";
import { renderEmailTemplate } from "./templates";
import {
  checkEmailIdempotency,
  getOrCreateEmailPreferences,
  recordEmailDeliveryLog,
  updateEmailDeliveryLog,
} from "./data";

export type DispatchEmailResult =
  | { ok: true; status: "sent"; messageId: string; logId: string }
  | { ok: true; status: "skipped"; reason: string; logId?: string }
  | { ok: false; status: "failed"; error: string; logId?: string };

export async function dispatchTransactionalEmail(
  rawInput: SendEmailInput,
  options: {
    client?: SupabaseClient<Database> | null;
    provider?: EmailProvider;
    siteUrl?: string;
  } = {},
): Promise<DispatchEmailResult> {
  const parseResult = sendEmailInputSchema.safeParse(rawInput);
  if (!parseResult.success) {
    return {
      ok: false,
      status: "failed",
      error: `Entrada de e-mail inválida: ${parseResult.error.issues.map((i) => i.message).join(", ")}`,
    };
  }

  const input = parseResult.data;
  const client = options.client;
  const provider = options.provider || defaultEmailProvider;

  // 1. Idempotency Check
  const existing = await checkEmailIdempotency(input.idempotencyKey, client);
  if (existing) {
    if (existing.status === "sent" || existing.status === "skipped") {
      return {
        ok: true,
        status: "skipped",
        reason: "duplicate_idempotency",
        logId: existing.id,
      };
    }
  }

  // 2. Consent & Preferences Check
  let unsubscribeToken: string | undefined;
  if (input.userId) {
    const prefs = await getOrCreateEmailPreferences(input.userId, client);
    if (prefs) {
      unsubscribeToken = prefs.unsubscribe_token;

      if (prefs.unsubscribed_all) {
        const skippedLog = await recordEmailDeliveryLog(
          {
            userId: input.userId,
            recipientEmail: input.recipientEmail,
            templateKey: input.templateKey,
            idempotencyKey: input.idempotencyKey,
            status: "skipped",
            skipReason: "unsubscribed_all",
            metadata: input.templateData,
          },
          client,
        );
        return {
          ok: true,
          status: "skipped",
          reason: "unsubscribed_all",
          logId: skippedLog?.id,
        };
      }

      const category = TEMPLATE_TO_CATEGORY[input.templateKey];
      const isCategoryAllowed = prefs[category];
      if (!isCategoryAllowed) {
        const skippedLog = await recordEmailDeliveryLog(
          {
            userId: input.userId,
            recipientEmail: input.recipientEmail,
            templateKey: input.templateKey,
            idempotencyKey: input.idempotencyKey,
            status: "skipped",
            skipReason: "unsubscribed_category",
            metadata: input.templateData,
          },
          client,
        );
        return {
          ok: true,
          status: "skipped",
          reason: "unsubscribed_category",
          logId: skippedLog?.id,
        };
      }
    }
  }

  // 3. Render Email Template
  const rendered = renderEmailTemplate(
    input.templateKey,
    input.templateData,
    {
      siteUrl: options.siteUrl,
      unsubscribeToken,
    },
  );

  // 4. Record Pending Log
  const log = await recordEmailDeliveryLog(
    {
      userId: input.userId,
      recipientEmail: input.recipientEmail,
      templateKey: input.templateKey,
      idempotencyKey: input.idempotencyKey,
      status: "pending",
      metadata: input.templateData,
    },
    client,
  );

  const logId = log?.id || "unknown_log_id";

  // 5. Send via Provider
  const result = await provider.send({
    to: input.recipientEmail,
    subject: rendered.subject,
    html: rendered.html,
    text: rendered.text,
    idempotencyKey: input.idempotencyKey,
  });

  // 6. Handle Provider Result
  if ("code" in result && result.code === "NOT_IMPLEMENTED") {
    if (log?.id) {
      await updateEmailDeliveryLog(
        log.id,
        {
          status: "skipped",
          skipReason: "missing_credentials",
        },
        client,
      );
    }
    return {
      ok: true,
      status: "skipped",
      reason: "missing_credentials",
      logId,
    };
  }

  if (!result.ok) {
    const errorMsg = "error" in result ? result.error : "Falha no envio de e-mail.";
    if (log?.id) {
      await updateEmailDeliveryLog(
        log.id,
        {
          status: "failed",
          errorMessage: errorMsg,
        },
        client,
      );
    }
    return {
      ok: false,
      status: "failed",
      error: errorMsg,
      logId,
    };
  }

  if (log?.id) {
    await updateEmailDeliveryLog(
      log.id,
      {
        status: "sent",
        providerMessageId: result.id,
        sentAt: new Date().toISOString(),
      },
      client,
    );
  }

  return {
    ok: true,
    status: "sent",
    messageId: result.id,
    logId,
  };
}
