import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/pethcoach/brand";
import { MobileNav } from "@/components/pethcoach/mobile-nav";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { CookiePreferencesButton } from "@/components/pethcoach/cookie-preferences-button";
import { brand } from "@/lib/brand";

export { Brand } from "@/components/pethcoach/brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md transition-all">
      <div className="page-width flex min-h-20 items-center justify-between gap-4 py-3.5">
        <Brand />
        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-1.5 text-sm font-medium text-muted-foreground shadow-2xs md:flex"
        >
          <Link
            href="/#problemas"
            className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-muted hover:text-primary"
          >
            Programas
          </Link>
          <Link
            href="/#como-funciona"
            className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-muted hover:text-primary"
          >
            Como funciona
          </Link>
          <Link
            href="/ajuda"
            className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-muted hover:text-primary"
          >
            Dúvidas
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            className="hidden md:inline-flex rounded-full text-xs font-bold"
          >
            <Link href="/entrar">
              Entrar <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/70 pt-12 pb-8">
      <div className="page-width grid gap-10 md:grid-cols-[1.2fr_auto] md:items-center">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <PethMascot
            mood="encouraging"
            size={72}
            className="motion-safe:hover:scale-105 transition-transform"
          />
          <div>
            <Brand />
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              {brand.signature}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-primary font-medium">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Treino humanizado, baseado em evidências e reforço positivo.
            </div>
          </div>
        </div>
        <nav
          aria-label="Links institucionais"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground"
        >
          <Link className="nav-link hover:text-primary transition-colors" href="/ajuda">
            Ajuda
          </Link>
          <Link className="nav-link hover:text-primary transition-colors" href="/privacidade">
            Privacidade
          </Link>
          <Link className="nav-link hover:text-primary transition-colors" href="/termos">
            Termos
          </Link>
          <CookiePreferencesButton />
        </nav>
      </div>
      <div className="page-width mt-10 flex flex-wrap justify-between gap-3 border-t border-border/80 pt-6 text-xs text-muted-foreground">
        <span>{brand.name} · Versão de desenvolvimento</span>
        <span>Feito para respeitar o ritmo de vocês.</span>
      </div>
    </footer>
  );
}
