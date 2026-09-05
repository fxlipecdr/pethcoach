/**
 * Identificadores de clique aceitos na atribuição.
 *
 * Fica fora de `contracts.ts` de propósito: aquele módulo carrega os schemas
 * Zod, e o banner de consentimento — que roda em toda página — precisa apenas
 * desta constante. Importar um valor de `contracts.ts` arrastava o Zod inteiro
 * para o bundle inicial do navegador.
 */
export const ALLOWED_CLICK_IDS = ["gclid", "fbclid", "ttclid"] as const;
export type AllowedClickId = (typeof ALLOWED_CLICK_IDS)[number];
