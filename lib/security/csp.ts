import { getPublicEnv } from "@/lib/env/public";

/**
 * Content Security Policy do PethCoach — P14.
 *
 * Nenhum script de terceiro é carregado por tag: PostHog e Sentry entram pelo
 * bundle da aplicação e o Stripe é usado por redirecionamento, sem Stripe.js.
 * Por isso `script-src 'self'` já cobre todo o JavaScript externo e o
 * `frame-src` fica fechado.
 *
 * Resta o script inline que o Next emite para hidratação. Ele recebe um nonce
 * apenas quando a página é renderizada por requisição; em página estática o
 * HTML vem do build e não há nonce possível. A política então tem dois modos:
 *
 * - `nonce`: rotas sempre dinâmicas (sessão, quiz, resultado, unsubscribe).
 *   `script-src 'self' 'nonce-…'`, sem `'unsafe-inline'`.
 * - `null`: rotas públicas que podem ser estáticas. `script-src` precisa de
 *   `'unsafe-inline'` para o bootstrap do Next, mas essas telas não renderizam
 *   dado de usuário autenticado.
 *
 * Aplicar o modo com nonce a uma rota que venha a ser estática quebraria a
 * hidratação, por isso `tests/e2e/foundation.spec.ts` verifica que as rotas
 * estritas continuam entregando o nonce no HTML.
 */
function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function createNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/** Rotas renderizadas por requisição por construção: leem sessão ou parâmetro. */
const strictPaths = [
  /^\/app(?:\/|$)/,
  /^\/admin(?:\/|$)/,
  /^\/entrar$/,
  /^\/auth(?:\/|$)/,
  /^\/quiz\//,
  /^\/resultado\//,
  /^\/unsubscribe$/,
];

export function usesNonce(pathname: string): boolean {
  return strictPaths.some((pattern) => pattern.test(pathname));
}

/**
 * As diretivas dependem só do ambiente, que não muda em tempo de execução.
 * Montar isso a cada requisição custaria uma validação de schema por request
 * no runtime do proxy, que roda em toda navegação.
 */
let cached: { withNonce: (nonce: string) => string; open: string } | null = null;

function compile() {
  const env = getPublicEnv();
  const development = process.env.NODE_ENV !== "production";

  const supabase = originOf(env.NEXT_PUBLIC_SUPABASE_URL);
  const posthog = originOf(env.NEXT_PUBLIC_POSTHOG_HOST);
  const sentry = originOf(env.NEXT_PUBLIC_SENTRY_DSN);

  const connect = [
    "'self'",
    supabase,
    // Realtime do Supabase usa WebSocket na mesma origem.
    supabase ? supabase.replace(/^https:/, "wss:") : null,
    posthog,
    sentry,
  ].filter((value): value is string => Boolean(value));

  // React Refresh avalia módulos em tempo de execução e o HMR usa WebSocket.
  const extraScript = development ? " 'unsafe-eval'" : "";
  if (development)
    connect.push("ws:", "http://127.0.0.1:*", "http://localhost:*");

  const rest = [
    // O Next injeta CSS crítico inline; nonce em estilo não cobre esse caso.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];
  if (!development) rest.push("upgrade-insecure-requests");

  const tail = `; ${rest.join("; ")}`;
  return {
    withNonce: (nonce: string) =>
      `default-src 'self'; script-src 'self' 'nonce-${nonce}'${extraScript}${tail}`,
    open: `default-src 'self'; script-src 'self' 'unsafe-inline'${extraScript}${tail}`,
  };
}

export function buildContentSecurityPolicy(nonce: string | null): string {
  cached ??= compile();
  return nonce ? cached.withNonce(nonce) : cached.open;
}
