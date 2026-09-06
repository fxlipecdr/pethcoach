"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { getPublicEnvClient } from "@/lib/env/public-client";
import { safeReturnPath } from "./contracts";

/**
 * Entrada por conta Google.
 *
 * O link mágico funciona, mas cobra um preço no pior momento: a pessoa acabou
 * de ver o Dia 1, decidiu continuar, e precisa sair do site, abrir o e-mail e
 * voltar. Cada uma dessas etapas perde gente. Aqui é um clique.
 *
 * O botão só existe quando `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` está ligado. Sem
 * isso ele não aparece — botão de login quebrado é pior que login com mais
 * atrito, porque a pessoa tenta, falha e vai embora achando que o produto está
 * fora do ar.
 *
 * O retorno passa pelo mesmo `/auth/callback` do link mágico: o fluxo PKCE do
 * OAuth entrega um `code`, e a rota já troca esse código por sessão.
 */
export function GoogleSignIn({
  next,
  disabled = false,
}: {
  next: string;
  disabled?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (getPublicEnvClient().NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "true") {
    return null;
  }

  async function entrar() {
    setErro(null);
    setPending(true);
    try {
      const client = createSupabaseBrowserClient();
      if (!client) {
        setErro("O acesso não está configurado neste ambiente.");
        return;
      }

      // `next` vem da URL: passa pelo mesmo saneamento do link mágico para não
      // virar redirecionamento aberto para fora do site.
      const destino = new URL(
        `/auth/callback?next=${encodeURIComponent(safeReturnPath(next))}`,
        window.location.origin,
      );

      const { error } = await client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: destino.toString() },
      });

      if (error) {
        setErro(
          "Não foi possível abrir o acesso com o Google. Tente novamente ou use o link por e-mail.",
        );
      }
      // Em caso de sucesso o navegador é redirecionado; não há o que fazer aqui.
    } catch {
      setErro(
        "Não foi possível abrir o acesso com o Google. Tente novamente ou use o link por e-mail.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-3"
        onClick={entrar}
        disabled={disabled}
        loading={pending}
        loadingText="Abrindo o Google…"
      >
        <GoogleMark />
        Continuar com Google
      </Button>

      {erro ? (
        <Feedback announce tone="error" title="Acesso indisponível" className="mt-4">
          {erro}
        </Feedback>
      ) : null}

      <div className="mt-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          ou
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

/** Marca oficial do Google, nas quatro cores exigidas pela diretriz da marca. */
function GoogleMark() {
  return (
    <svg
      viewBox="0 0 18 18"
      className="size-[18px] shrink-0"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}
