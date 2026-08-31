import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env/public";
import type { Database } from "./database.types";

export async function createSupabaseServerClient() {
  const env = getPublicEnv();
  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return null;
  const jar = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: {
        secure: env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ?? false,
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            // Server Components cannot mutate cookies; proxy.ts owns session refresh.
          }
        },
      },
    },
  );
}
