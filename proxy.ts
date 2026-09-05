import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import {
  buildContentSecurityPolicy,
  createNonce,
  usesNonce,
} from "@/lib/security/csp";

/** Só estas rotas precisam renovar a sessão do Supabase. */
const sessionPaths = [
  /^\/app(?:\/|$)/,
  /^\/admin(?:\/|$)/,
  /^\/entrar$/,
  /^\/auth(?:\/|$)/,
];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const nonce = usesNonce(pathname) ? createNonce() : null;
  const csp = buildContentSecurityPolicy(nonce);

  if (nonce) {
    // O Next lê o nonce do CSP presente nos headers da requisição e assina o
    // script de hidratação com ele.
    request.headers.set("x-nonce", nonce);
    request.headers.set("Content-Security-Policy", csp);
  }

  const needsSession = sessionPaths.some((pattern) => pattern.test(pathname));
  const response = needsSession
    ? await updateSession(request)
    : NextResponse.next({ request });

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Só documento HTML precisa da política. `_next` e `api` ficam de fora
    // porque o proxy roda em toda navegação e cada invocação custa caro.
    "/((?!_next/|api/|favicon\\.ico|icon\\.svg|brand/|.*\\.[a-zA-Z0-9]{2,5}$).*)",
  ],
};
