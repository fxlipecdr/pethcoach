import "server-only";
import { createHash } from "node:crypto";

/** Bounded per-process defense for development. Provider limits remain authoritative.
 * Replace with an atomic shared store before a multi-instance public deployment (P14).
 * Never store raw email addresses, tokens, or forwarded IP headers here.
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
