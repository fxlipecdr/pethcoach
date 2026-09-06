import { parseEnvironment, publicEnvSchema } from "./schema";
import type { z } from "zod";

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getPublicEnv() {
  // Explicit property access is required for Next.js browser replacement.
  return parseEnvironment(publicEnvSchema, {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED:
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED,
  });
}
