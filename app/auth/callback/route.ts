import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthConfig } from "@/features/auth/config";
import { safeReturnPath } from "@/features/auth/contracts";
import { authLimiter } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";
const codeSchema = z
  .string()
  .min(8)
  .max(2048)
  .regex(/^[a-zA-Z0-9._~-]+$/);

export async function GET(request: NextRequest) {
  const { origin, enabled } = getAuthConfig();
  // Relative redirect when unconfigured: never trust Host to construct an origin.
  const finish = (path: string) =>
    new NextResponse(null, {
      status: 303,
      headers: {
        Location: origin ? new URL(path, origin).toString() : path,
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  const next = safeReturnPath(request.nextUrl.searchParams.get("next"));
  const failure = `/entrar?error=link&next=${encodeURIComponent(next)}`;
  const code = codeSchema.safeParse(request.nextUrl.searchParams.get("code"));
  if (
    !enabled ||
    !code.success ||
    !authLimiter.allow("callback-global", 60, 60_000)
  )
    return finish(failure);
  try {
    const client = await createSupabaseServerClient();
    if (!client) return finish(failure);
    const { error } = await client.auth.exchangeCodeForSession(code.data);
    if (error) return finish(failure);
    const { data, error: userError } = await client.auth.getUser();
    if (userError || !data.user) return finish(failure);
  } catch {
    return finish(failure);
  }
  return finish(next);
}
