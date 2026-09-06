import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { z } from "zod";
import { assessmentIdSchema } from "./contracts";

export const assessmentCookieName = "pethcoach-assessment";
export const assessmentTtlSeconds = 7 * 24 * 60 * 60;

const payloadSchema = z
  .object({
    v: z.literal(1),
    id: assessmentIdSchema,
    exp: z.number().int().positive(),
    nonce: z.string().regex(/^[A-Za-z0-9_-]{22}$/),
  })
  .strict();

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAssessmentToken(
  assessmentId: string,
  secret: string,
  now = Date.now(),
) {
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      id: assessmentIdSchema.parse(assessmentId),
      exp: Math.floor(now / 1000) + assessmentTtlSeconds,
      nonce: randomBytes(16).toString("base64url"),
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload, secret)}`;
}

export function verifyAssessmentToken(
  token: string | undefined,
  expectedId: string,
  secret: string,
  now = Date.now(),
) {
  if (!token || token.length > 1024) return null;
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return null;
  const expectedSignature = signature(payload, secret);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
    return null;
  try {
    const parsed = payloadSchema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    if (parsed.id !== assessmentIdSchema.parse(expectedId)) return null;
    if (parsed.exp <= Math.floor(now / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Por que a comprovação de posse falhou.
 *
 * "Não foi possível comprovar a posse desta avaliação" é verdadeiro e inútil:
 * cobre quatro situações com correções opostas — cookie ausente, segredo do
 * servidor trocado, cookie apontando para outra avaliação (quiz refeito neste
 * navegador) e token vencido. Sem separar, não há como saber o que consertar.
 *
 * Devolve apenas o veredito. O token não entra no retorno nem no log: ele é a
 * credencial da avaliação.
 */
export type FalhaDeToken =
  | "sem_cookie"
  | "formato_invalido"
  | "assinatura_invalida"
  | "outra_avaliacao"
  | "expirado"
  | "conteudo_invalido";

export function diagnoseAssessmentToken(
  token: string | undefined,
  expectedId: string,
  secret: string,
  now = Date.now(),
): FalhaDeToken | null {
  if (!token) return "sem_cookie";
  if (token.length > 1024) return "formato_invalido";

  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) return "formato_invalido";

  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(signature(payload, secret));
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
    return "assinatura_invalida";

  try {
    const parsed = payloadSchema.parse(
      JSON.parse(Buffer.from(payload, "base64url").toString("utf8")),
    );
    if (parsed.id !== assessmentIdSchema.parse(expectedId))
      return "outra_avaliacao";
    if (parsed.exp <= Math.floor(now / 1000)) return "expirado";
    return null;
  } catch {
    return "conteudo_invalido";
  }
}

export function assessmentTokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function assessmentRateKey(
  secret: string,
  anonymousId: string,
  networkHint: string,
) {
  return createHmac("sha256", secret)
    .update(`create:${anonymousId}:${networkHint}`)
    .digest("hex");
}
