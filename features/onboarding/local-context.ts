import { z } from "zod";

// Local drafts are untrusted UX state. They never authorize a database read/claim.
export const localContextKey = "pethcoach:anonymous-context:v1";
const ttlMs = 7 * 24 * 60 * 60 * 1000;
export const anonymousContextSchema = z
  .object({
    version: z.literal(1),
    anonymousId: z.uuid(),
    updatedAt: z.number().int().nonnegative(),
    problem: z
      .enum(["cachorro-puxa-guia", "filhote-mordendo", "xixi-lugar-errado"])
      .optional(),
    assessment: z
      .object({
        id: z.uuid(),
        problem: z.enum([
          "cachorro-puxa-guia",
          "filhote-mordendo",
          "xixi-lugar-errado",
        ]),
        currentQuestion: z.number().int().min(0).max(9),
      })
      .strict()
      .optional(),
  })
  .strict();
export type AnonymousContext = z.infer<typeof anonymousContextSchema>;
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export function readAnonymousContext(
  storage: StoragePort,
  now = Date.now(),
): AnonymousContext | null {
  try {
    const raw = storage.getItem(localContextKey);
    if (!raw) return null;
    const result =
      raw.length <= 1024
        ? anonymousContextSchema.safeParse(JSON.parse(raw))
        : null;
    if (
      !result?.success ||
      result.data.updatedAt > now ||
      now - result.data.updatedAt > ttlMs
    ) {
      storage.removeItem(localContextKey);
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}
export function saveAnonymousContext(
  storage: StoragePort,
  value: AnonymousContext,
): boolean {
  const parsed = anonymousContextSchema.safeParse(value);
  if (!parsed.success) return false;
  try {
    storage.setItem(localContextKey, JSON.stringify(parsed.data));
    return true;
  } catch {
    return false;
  }
}
