import { getPublicEnvClient } from "@/lib/env/public-client";

/**
 * Pixel da Meta — carregado apenas com aceite de cookies.
 *
 * O produto não usava nenhum script de terceiro por tag até aqui, e este é a
 * exceção deliberada: sem sinal de conversão de volta, o algoritmo de anúncio
 * não aprende quem compra e o custo por aquisição não cai.
 *
 * Duas regras que o resto do arquivo respeita:
 *
 * 1. Nada é carregado antes do aceite. A política de privacidade classifica
 *    métricas como base legal de consentimento, e carregar o pixel sem aceite
 *    tornaria aquele texto falso.
 * 2. Nenhum dado pessoal vai no evento do navegador. E-mail e identificadores
 *    seguem apenas pela Conversions API, no servidor, com hash.
 */
declare global {
  interface Window {
    fbq?: FbqFunction & { callMethod?: (...args: unknown[]) => void };
    _fbq?: unknown;
  }
}

type FbqFunction = ((...args: unknown[]) => void) & {
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
};

let carregado = false;

function pixelId(): string | undefined {
  return getPublicEnvClient().NEXT_PUBLIC_META_PIXEL_ID;
}

/**
 * Injeta o script do pixel uma única vez. Idempotente: chamar de novo não
 * duplica evento nem recarrega o script.
 */
export function loadMetaPixel(): void {
  if (typeof window === "undefined") return;
  const id = pixelId();
  if (!id || carregado) return;

  // Stub oficial da Meta: enfileira chamadas até o script terminar de carregar.
  const fbq: FbqFunction = function (...args: unknown[]) {
    if (window.fbq?.callMethod) {
      window.fbq.callMethod(...args);
      return;
    }
    fbq.queue?.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = window.fbq ?? fbq;
  window._fbq = window._fbq ?? window.fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  carregado = true;
  window.fbq("init", id);
  window.fbq("track", "PageView");
}

/**
 * Envia um evento padrão da Meta.
 *
 * `eventId` é o que evita contagem dobrada quando o mesmo evento também chega
 * pela Conversions API: a Meta descarta a segunda ocorrência do mesmo par
 * nome + id. Sem isso, uma compra vira duas e o custo por aquisição relatado
 * fica pela metade do real.
 */
export function trackMetaEvent(
  name: "ViewContent" | "Lead" | "InitiateCheckout" | "Purchase",
  parametros?: Record<string, string | number>,
  eventId?: string,
): void {
  if (typeof window === "undefined" || !window.fbq || !pixelId()) return;
  window.fbq(
    "track",
    name,
    parametros ?? {},
    eventId ? { eventID: eventId } : undefined,
  );
}

/**
 * Identificadores que a Meta grava em cookie de primeira parte. A Conversions
 * API os reenvia para casar o evento de servidor com a sessão do navegador; é
 * o que mantém a atribuição de pé quando o pixel é bloqueado no meio do
 * caminho. Não são dado pessoal declarado: são identificadores de sessão de
 * anúncio, e só existem se o visitante aceitou cookies.
 */
export function readMetaCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === "undefined") return {};
  const resultado: { fbp?: string; fbc?: string } = {};
  try {
    for (const parte of document.cookie.split(";")) {
      const [nome, ...resto] = parte.trim().split("=");
      const valor = resto.join("=");
      if (nome === "_fbp") resultado.fbp = valor;
      if (nome === "_fbc") resultado.fbc = valor;
    }
  } catch {
    // Cookie indisponível (modo privado): a conversão de servidor ainda vai,
    // apenas com menos sinal de correspondência.
  }
  return resultado;
}
