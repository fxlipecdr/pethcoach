import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Footprints, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/pethcoach/brand";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { Paw, StarDoodle } from "@/components/pethcoach/doodles";
import { Sticker } from "@/components/pethcoach/playground";
import { PreviewNotice } from "./preview-notice";
import { controlador } from "@/content/legal";

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
          className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary-strong"
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
          <div className="relative hidden rounded-panel bg-sage p-9 md:block">
            <StarDoodle
              tone="lime"
              size={28}
              className="absolute top-7 right-8 rotate-12"
            />
            <PethMascot mood="happy" size={84} className="float-soft" />
            <Sticker tone="lime" className="mt-7">
              No ritmo de vocês
            </Sticker>
            <p className="font-display mt-5 text-4xl leading-[1.05] font-bold tracking-[-0.045em]">
              Mais clareza.
              <br />
              Mais <span className="marker-underline">conexão.</span>
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
                  <Icon className="size-4 text-primary-strong" aria-hidden="true" />
                  {text}
                </p>
              ))}
              <p className="flex items-center gap-3 pt-1">
                <Paw tone="mint" size={18} />
                Recompensa, respeito e consistência.
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </main>
      <footer className="page-width flex flex-wrap items-center justify-between gap-3 border-t border-border py-5 text-xs text-muted-foreground">
        {/* Identificação do fornecedor, como no rodapé público. */}
        <span>
          CNPJ {controlador.cnpj}
        </span>
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
