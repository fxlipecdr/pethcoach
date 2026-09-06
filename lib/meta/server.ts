import "server-only";
import { createHash } from "node:crypto";
import { getPublicEnv } from "@/lib/env/public";
import { getServerEnv } from "@/lib/env/server";

/**
 * Conversions API da Meta — envio da compra pelo servidor.
 *
 * Por que existe: o pixel do navegador perde uma fatia grande das conversões
 * (bloqueador, ITP do Safari, aba fechada antes do retorno do checkout). A
 * compra é o único evento que o servidor conhece com certeza, porque vem do
 * webhook do Stripe já com assinatura verificada. Sem ela, o algoritmo otimiza
 * por um número menor do que o real e o custo por aquisição sobe.
 *
 * Consentimento: este envio **só acontece com aceite**. A política de
 * privacidade classifica métricas como consentimento, e o aceite viaja junto
 * do checkout, nos metadados da sessão do Stripe. Sem aceite registrado, a
 * função devolve `sem_consentimento` e nada sai daqui.
 *
 * Dado pessoal: e-mail vai apenas como SHA-256, que é o que a Meta exige e
 * aceita. Nunca em texto claro.
 */
export interface MetaPurchaseInput {
  /** Mesmo id usado no evento do navegador; a Meta descarta a duplicata. */
  eventId: string;
  valor: number;
  moeda: string;
  emailCliente?: string | null;
  /** Cookies de primeira parte da Meta, capturados no checkout. */
  fbp?: string | null;
  fbc?: string | null;
  /** Aceite de cookies registrado no momento do checkout. */
  consentimento?: string | null;
  /** URL da página onde a conversão se originou. */
  origem?: string | null;
}

export type MetaResultado =
  | { ok: true }
  | { ok: false; motivo: string };

function sha256(valor: string): string {
  return createHash("sha256").update(valor.trim().toLowerCase()).digest("hex");
}

export async function sendMetaPurchase(
  input: MetaPurchaseInput,
): Promise<MetaResultado> {
  if (input.consentimento !== "granted") {
    return { ok: false, motivo: "sem_consentimento" };
  }

  const pixelId = getPublicEnv().NEXT_PUBLIC_META_PIXEL_ID;
  const token = getServerEnv().META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) {
    return { ok: false, motivo: "sem_credenciais" };
  }

  const userData: Record<string, string | string[]> = {};
  if (input.emailCliente) userData.em = [sha256(input.emailCliente)];
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  // Sem nenhum identificador a Meta rejeita o evento; melhor não gastar a
  // chamada e deixar o motivo explícito no log.
  if (Object.keys(userData).length === 0) {
    return { ok: false, motivo: "sem_identificador" };
  }

  const testCode = getServerEnv().META_TEST_EVENT_CODE;

  try {
    const resposta = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: token,
          ...(testCode ? { test_event_code: testCode } : {}),
          data: [
            {
              event_name: "Purchase",
              event_time: Math.floor(Date.now() / 1000),
              event_id: input.eventId,
              action_source: "website",
              ...(input.origem ? { event_source_url: input.origem } : {}),
              user_data: userData,
              custom_data: {
                value: input.valor,
                currency: input.moeda.toUpperCase(),
              },
            },
          ],
        }),
      },
    );

    if (!resposta.ok) {
      return { ok: false, motivo: `http_${resposta.status}` };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      motivo: err instanceof Error ? err.message : "erro_de_rede",
    };
  }
}
