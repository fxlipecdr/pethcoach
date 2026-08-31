import { describe, expect, it } from "vitest";
import {
  emailSchema,
  safeReturnPath,
  trustedSiteOrigin,
} from "@/features/auth/contracts";
import {
  dogFieldsSchema,
  dogMutationSchema,
  emptyDogValues,
} from "@/features/dogs/contracts";
import {
  localContextKey,
  readAnonymousContext,
  saveAnonymousContext,
} from "@/features/onboarding/local-context";
import { WindowLimiter } from "@/lib/security/rate-limit";

describe("auth boundaries", () => {
  it("accepts internal destinations and rejects redirect injection", () => {
    expect(safeReturnPath("/app/caes/novo")).toBe("/app/caes/novo");
    for (const value of [
      "https://evil.test",
      "//evil.test",
      "/app/../evil",
      "/app%2f%2fevil",
      "/app\\evil",
      "/app?next=//evil",
      "/app\n",
      ["/admin"],
      "/app/#x",
      "/entrar",
      "javascript:alert(1)",
    ])
      expect(safeReturnPath(value)).toBe("/app");
  });
  it("uses only a configured trusted origin", () => {
    expect(trustedSiteOrigin("http://127.0.0.1:3000")).toBe(
      "http://127.0.0.1:3000",
    );
    expect(trustedSiteOrigin("https://example.test")).toBe(
      "https://example.test",
    );
    for (const value of [
      undefined,
      "http://example.test",
      "https://user:pass@example.test",
      "https://example.test/other",
      "https://example.test?token=secret",
      "javascript:alert(1)",
    ])
      expect(trustedSiteOrigin(value)).toBeNull();
  });
  it("normalizes email but rejects oversized/malformed values", () => {
    expect(emailSchema.parse(" USER@EXAMPLE.TEST ")).toBe("user@example.test");
    expect(emailSchema.safeParse("invalid").success).toBe(false);
    expect(
      emailSchema.safeParse("a".repeat(260) + "@example.test").success,
    ).toBe(false);
  });
  it("enforces the window, restores capacity after expiry and fails closed at capacity", () => {
    const limiter = new WindowLimiter(1);
    expect(limiter.allow("a", 1, 100, 0)).toBe(true);
    expect(limiter.allow("a", 1, 100, 1)).toBe(false);
    expect(limiter.allow("b", 1, 100, 1)).toBe(false);
    expect(limiter.allow("b", 1, 100, 100)).toBe(true);
  });
});
describe("dog input", () => {
  it("requires only a name and preserves unknown vs no", () => {
    const dog = dogFieldsSchema.parse({ ...emptyDogValues, name: "  Mel  " });
    expect(dog).toMatchObject({
      name: "Mel",
      birth_date: null,
      neutered: null,
    });
    expect(
      dogFieldsSchema.parse({ ...emptyDogValues, name: "Mel", neutered: "no" })
        .neutered,
    ).toBe(false);
  });
  it("rejects invalid dates, values and forged mode/ids", () => {
    for (const fields of [
      { name: "   " },
      { birth_date: "2025-02-30" },
      { birth_date: "2999-01-01" },
      { sex: "invalid" },
      { size: "invalid" },
      { name: "a".repeat(61) },
    ])
      expect(
        dogFieldsSchema.safeParse({ ...emptyDogValues, name: "Mel", ...fields })
          .success,
      ).toBe(false);
    expect(
      dogMutationSchema.safeParse({
        ...emptyDogValues,
        name: "Mel",
        mode: "delete",
        id: "forged",
      }).success,
    ).toBe(false);
  });
});
describe("future anonymous context", () => {
  const draft = {
    version: 1 as const,
    anonymousId: "11111111-1111-4111-8111-111111111111",
    updatedAt: 1000,
    problem: "filhote-mordendo" as const,
  };
  function storage() {
    const data = new Map<string, string>();
    return {
      getItem: (key: string) => data.get(key) ?? null,
      setItem: (key: string, value: string) => {
        data.set(key, value);
      },
      removeItem: (key: string) => {
        data.delete(key);
      },
    };
  }
  it("round trips independently of auth state, without discarding a valid draft", () => {
    const store = storage();
    expect(saveAnonymousContext(store, draft)).toBe(true);
    expect(readAnonymousContext(store, 1001)).toEqual(draft);
    expect(readAnonymousContext(store, 1002)).toEqual(draft);
  });
  it("expires drafts and rejects oversized, future, unsupported and malformed storage", () => {
    const store = storage();
    for (const value of [
      "{}",
      "broken",
      "a".repeat(2048),
      JSON.stringify({ ...draft, version: 2 }),
      JSON.stringify({ ...draft, userId: "forged" }),
    ]) {
      store.setItem(localContextKey, value);
      expect(readAnonymousContext(store, 1001)).toBeNull();
    }
    saveAnonymousContext(store, draft);
    expect(readAnonymousContext(store, 999)).toBeNull();
    saveAnonymousContext(store, draft);
    expect(readAnonymousContext(store, 8 * 86400000)).toBeNull();
  });
  it("does not break login when local storage is blocked", () => {
    const blocked = {
      getItem() {
        throw new Error();
      },
      setItem() {
        throw new Error();
      },
      removeItem() {
        throw new Error();
      },
    };
    expect(readAnonymousContext(blocked)).toBeNull();
    expect(saveAnonymousContext(blocked, draft)).toBe(false);
  });
});
