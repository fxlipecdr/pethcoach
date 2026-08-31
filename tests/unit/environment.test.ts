import { describe, expect, it } from "vitest";
import {
  parseEnvironment,
  publicEnvSchema,
  serverEnvSchema,
} from "@/lib/env/schema";

describe("environment boundaries", () => {
  it("boots without credentials", () => {
    expect(parseEnvironment(publicEnvSchema, {})).toEqual({});
    expect(parseEnvironment(serverEnvSchema, {}).AI_GENERATION_ENABLED).toBe(
      false,
    );
  });
  it("accepts empty template values", () =>
    expect(
      publicEnvSchema.parse({ NEXT_PUBLIC_SITE_URL: "" }).NEXT_PUBLIC_SITE_URL,
    ).toBeUndefined());
  it("rejects half-configured providers", () => {
    expect(
      publicEnvSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.test",
      }).success,
    ).toBe(false);
    expect(
      publicEnvSchema.safeParse({ NEXT_PUBLIC_POSTHOG_KEY: "ph_test" }).success,
    ).toBe(false);
  });
  it("rejects a server secret in the public key", () =>
    expect(
      publicEnvSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.test",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_never_public",
      }).success,
    ).toBe(false));
  it("rejects invalid protocols", () =>
    expect(
      publicEnvSchema.safeParse({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" })
        .success,
    ).toBe(false));
  it("rejects AI enablement without credentials and a configured model", () =>
    expect(
      serverEnvSchema.safeParse({ AI_GENERATION_ENABLED: "true" }).success,
    ).toBe(false));
  it("never leaks bad environment values in errors", () => {
    expect(() =>
      parseEnvironment(publicEnvSchema, {
        NEXT_PUBLIC_SITE_URL: "secret-private-value",
      }),
    ).toThrow("NEXT_PUBLIC_SITE_URL");
    try {
      parseEnvironment(publicEnvSchema, {
        NEXT_PUBLIC_SITE_URL: "secret-private-value",
      });
    } catch (error) {
      expect(String(error)).not.toContain("secret-private-value");
    }
  });
});
