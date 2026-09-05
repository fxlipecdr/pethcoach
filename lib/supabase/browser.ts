"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnvClient } from "@/lib/env/public-client";
import type { Database } from "./database.types";

export function createSupabaseBrowserClient() {
  const env = getPublicEnvClient();
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return null;
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        secure: env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false,
      },
    },
  );
}
