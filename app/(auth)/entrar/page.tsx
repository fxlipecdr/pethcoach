import { redirect } from "next/navigation";
import { SignInForm } from "@/features/auth/sign-in-form";
import { getAuthConfig } from "@/features/auth/config";
import { safeReturnPath } from "@/features/auth/contracts";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAnonymizedAccount } from "@/lib/security/auth";
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
      // Conta anonimizada mantém cookie válido, mas não deve voltar ao app.
      if (
        !error &&
        data.user &&
        !(await isAnonymizedAccount(client, data.user.id))
      )
        redirect(next);
    }
  }
  return (
    <SignInForm
      enabled={enabled}
      next={next}
      linkError={query.error === "link"}
      oauthCancelado={query.error === "oauth"}
      accountRemoved={query.conta === "removida"}
    />
  );
}
