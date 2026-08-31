import "server-only";
import { getPublicEnv } from "@/lib/env/public";
import { trustedSiteOrigin } from "./contracts";
export function getAuthConfig() {
  const env = getPublicEnv();
  const origin = trustedSiteOrigin(env.NEXT_PUBLIC_SITE_URL);
  return {
    origin,
    enabled: Boolean(
      origin &&
      env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}
