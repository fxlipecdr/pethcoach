import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeActionLimit } from "@/lib/security/rate-limit";
import { isAnonymizedAccount } from "@/lib/security/auth";
import { buildAccountExport } from "@/features/profile/data-rights";

export const dynamic = "force-dynamic";

/** P14 — o titular baixa os próprios dados em JSON. Nunca aceita id externo. */
export async function GET() {
  const client = await createSupabaseServerClient();
  if (!client)
    return NextResponse.json(
      { error: "indisponivel" },
      { status: 503, headers: { "X-Content-Type-Options": "nosniff" } },
    );

  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    return NextResponse.json(
      { error: "nao_autenticado" },
      { status: 401, headers: { "X-Content-Type-Options": "nosniff" } },
    );

  if (await isAnonymizedAccount(client, data.user.id))
    return NextResponse.json(
      { error: "conta_removida" },
      { status: 404, headers: { "X-Content-Type-Options": "nosniff" } },
    );

  // A exportação varre várias tabelas; poucos pedidos por minuto bastam.
  if (!(await consumeActionLimit(client, "account_export", data.user.id)))
    return NextResponse.json(
      { error: "muitas_tentativas" },
      { status: 429, headers: { "X-Content-Type-Options": "nosniff" } },
    );

  const payload = await buildAccountExport(client, data.user.id);
  const filename = `pethcoach-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
