import { redirect } from "next/navigation";
import { SignInForm } from "@/features/auth/sign-in-form";
import { getAuthConfig } from "@/features/auth/config";
import { safeReturnPath } from "@/features/auth/contracts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const next = safeReturnPath(query.next);
  const { enabled } = getAuthConfig();
  if (enabled) {
    const client = await createSupabaseServerClient();
    if (client) {
      const { data, error } = await client.auth.getUser();
      if (!error && data.user) redirect(next);
    }
  }
  return (
    <SignInForm
      enabled={enabled}
      next={next}
      linkError={query.error === "link"}
    />
  );
}
