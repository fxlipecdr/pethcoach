/**
 * Regras de limite por ação — P14.
 *
 * O banco é a autoridade: `private.rate_limit_rules` guarda os mesmos valores e
 * é lido por `public.consume_action_rate_limit`, para que o cliente escolha a
 * ação mas nunca o limite. Esta cópia serve ao caminho de contingência em
 * memória, quando o banco não está disponível.
 *
 * `tests/integration/p14-rate-limit.test.ts` falha se as duas listas
 * divergirem, então alterar um limite exige alterar os dois lados.
 */
export const rateLimitRules = {
  dog_write: { maxRequests: 30, windowSeconds: 60 },
  plan_generate: { maxRequests: 10, windowSeconds: 3600 },
  plan_task_write: { maxRequests: 120, windowSeconds: 60 },
  checkin_write: { maxRequests: 30, windowSeconds: 60 },
  email_preferences_write: { maxRequests: 20, windowSeconds: 60 },
  profile_write: { maxRequests: 20, windowSeconds: 60 },
  account_export: { maxRequests: 3, windowSeconds: 60 },
  account_delete: { maxRequests: 3, windowSeconds: 300 },
  assessment_claim: { maxRequests: 20, windowSeconds: 60 },
} as const;

export type RateLimitedAction = keyof typeof rateLimitRules;
