import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Footprints, Heart, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/pethcoach/brand";
import { PreviewNotice } from "./preview-notice";

export function AuthShell({
  children,
  preview = false,
}: {
  children: ReactNode;
  preview?: boolean;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="page-width flex min-h-22 flex-wrap items-center justify-between gap-3 py-4">
        <Brand />
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Início
        </Link>
      </header>
      <main
        id="conteudo"
        className="page-width flex flex-1 flex-col justify-center py-8 md:py-14"
      >
        {preview ? <PreviewNotice /> : null}
        <div className="mx-auto grid w-full max-w-5xl items-center gap-8 md:grid-cols-[1fr_1fr] md:gap-16">
          <div className="hidden rounded-panel bg-sage p-9 md:block">
            <Heart
              className="size-9 text-primary"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <p className="eyebrow mt-10">NO RITMO DE VOCÊS</p>
            <p className="mt-4 text-4xl leading-tight font-medium tracking-[-0.045em]">
              Mais clareza.
              <br />
              Mais conexão.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Um espaço para entender o contexto, organizar a rotina e
              reconhecer os pequenos avanços.
            </p>
            <div className="mt-10 space-y-4 border-t border-foreground/10 pt-6 text-sm">
              {[
                { icon: Footprints, text: "Um passo possível de cada vez" },
                { icon: ShieldCheck, text: "Bem-estar em primeiro lugar" },
              ].map(({ icon: Icon, text }) => (
                <p className="flex items-center gap-3" key={text}>
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {text}
                </p>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </main>
      <footer className="page-width flex flex-wrap items-center justify-between gap-3 border-t border-border py-5 text-xs text-muted-foreground">
        <span>Uma experiência em desenvolvimento.</span>
        <nav aria-label="Informações de acesso" className="flex gap-5">
          <Link className="nav-link" href="/privacidade">
            Privacidade
          </Link>
          <Link className="nav-link" href="/termos">
            Termos
          </Link>
        </nav>
      </footer>
    </div>
  );
}
