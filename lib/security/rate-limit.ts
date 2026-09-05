import "server-only";
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  rateLimitRules,
  type RateLimitedAction,
} from "./rate-limit-rules";

/** Contagem por processo. Serve a rotas sem sessão (onde não há `auth.uid()`
 * para derivar a chave no banco) e como contingência quando o banco não
 * responde. Para ação de usuário autenticado, prefira `consumeActionLimit`,
 * que conta no banco e vale para todas as instâncias.
 * Nunca guarde aqui e-mail, token ou IP encaminhado em texto puro.
 */
export class WindowLimiter {
  private entries = new Map<string, { count: number; resetAt: number }>();
  constructor(private readonly maxEntries = 2000) {}
  allow(
    key: string,
    limit: number,
    windowMs: number,
    now = Date.now(),
  ): boolean {
    for (const [id, entry] of this.entries)
      if (entry.resetAt <= now) this.entries.delete(id);
    const entry = this.entries.get(key);
    if (entry) {
      if (entry.count >= limit) return false;
      entry.count += 1;
      return true;
    }
    // Fail closed at capacity; rotating keys cannot evict active limits.
    if (this.entries.size >= this.maxEntries) return false;
    this.entries.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
}
export const authLimiter = new WindowLimiter();
export function privateRateKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * P14 — limite compartilhado entre instâncias.
 *
 * `public.consume_action_rate_limit` deriva a chave de `auth.uid()` e lê o teto
 * de `private.rate_limit_rules`, então a chamada não consegue nem escolher o
 * balde de outro usuário nem afrouxar o próprio limite.
 *
 * Se o banco não estiver disponível, cai para a contagem em memória em vez de
 * liberar sem limite: pior proteger só a instância atual do que nenhuma.
 */
export async function consumeActionLimit(
  client: SupabaseClient<Database> | null,
  action: RateLimitedAction,
  userId: string,
): Promise<boolean> {
  if (client) {
    try {
      const { data, error } = await client.rpc("consume_action_rate_limit", {
        p_action: action,
      });
      if (!error) return data === true;
    } catch {
      // Sem conexão: segue para a contagem local.
    }
  }
  const rule = rateLimitRules[action];
  return authLimiter.allow(
    `${action}:${privateRateKey(userId)}`,
    rule.maxRequests,
    rule.windowSeconds * 1000,
  );
}
