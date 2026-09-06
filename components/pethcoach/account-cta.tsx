"use client";

import { useEffect, useState, type ComponentProps } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";

/**
 * Botão de acesso que sabe se você já entrou.
 *
 * Antes ele dizia "Entrar" sempre, inclusive para quem estava logado. Quem
 * saía da área da conta para uma página pública via "Entrar" no topo e concluía
 * que tinha sido desconectado — não tinha; a sessão seguia de pé. O sintoma
 * relatado como "está deslogando" era este botão.
 *
 * As páginas públicas são estáticas, então o servidor não pode consultar a
 * sessão ao renderizar. A verificação acontece no navegador, depois da
 * hidratação, lendo o cookie local: `getSession` não faz chamada de rede.
 *
 * O estado inicial é o mesmo do servidor — "Entrar" — para não haver divergência
 * de hidratação. Se houver sessão, o rótulo troca em seguida.
 */
export function AccountCta({
  className,
  variant = "header",
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "children"> & {
  variant?: "header" | "menu";
}) {
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    const client = createSupabaseBrowserClient();
    if (!client) return;

    let ativo = true;
    client.auth
      .getSession()
      .then(({ data }) => {
        if (ativo) setLogado(Boolean(data.session));
      })
      .catch(() => {
        // Sem sessão legível, o padrão "Entrar" já é o correto.
      });

    // Entrar ou sair em outra aba precisa refletir aqui.
    const { data: inscricao } = client.auth.onAuthStateChange(
      (_evento, sessao) => {
        if (ativo) setLogado(Boolean(sessao));
      },
    );

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, []);

  const destino = logado ? "/app" : "/entrar";
  const rotulo = logado ? "Minha conta" : "Entrar";

  /**
   * As props recebidas são repassadas ao `Link`.
   *
   * Este componente é usado dentro de `SheetClose asChild` e `Button asChild`,
   * que injetam `onClick`, `className` e `ref` no filho. Sem repassar, o menu
   * mobile deixava de fechar ao clicar e o botão perdia o estilo — foi o que
   * quebrou na primeira versão.
   */
  return (
    <Link {...props} href={destino} className={cn(className)}>
      {rotulo}
      {variant === "header" ? <ArrowUpRight aria-hidden="true" /> : null}
    </Link>
  );
}
