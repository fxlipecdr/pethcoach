import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: "Informe um e-mail válido." }));
// Strict allowlist: do not decode user paths or accept absolute URLs/query strings.
export function safeReturnPath(value: unknown): string {
  return typeof value === "string" &&
    value.length <= 240 &&
    !/\s/.test(value) &&
    /^\/(app|admin)(\/[a-zA-Z0-9-]+)*$/.test(value)
    ? value
    : "/app";
}

export function trustedSiteOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export type AuthState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldError?: string;
};
export const initialAuthState: AuthState = { status: "idle" };
