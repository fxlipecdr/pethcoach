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
