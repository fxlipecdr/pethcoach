import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/pethcoach/brand";
import { MobileNav } from "@/components/pethcoach/mobile-nav";
import { brand } from "@/lib/brand";

export { Brand } from "@/components/pethcoach/brand";

export function SiteHeader() {
  return (
    <header className="border-b border-border/70 bg-background">
      <div className="page-width flex min-h-21 items-center justify-between gap-4 py-4">
        <Brand />
        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-7 text-sm text-muted-foreground md:flex"
        >
          <Link href="/#problemas" className="nav-link">
            Programas
          </Link>
          <Link href="/#como-funciona" className="nav-link">
            Como funciona
          </Link>
          <Link href="/ajuda" className="nav-link">
            Dúvidas
          </Link>
        </nav>
        <Button asChild variant="outline" className="hidden md:inline-flex">
          <Link href="/entrar">
            Entrar <ArrowUpRight aria-hidden="true" />
          </Link>
        </Button>
        <MobileNav />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="page-width grid gap-8 py-10 md:grid-cols-[1fr_auto]">
        <div>
          <Brand />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            {brand.signature}
          </p>
        </div>
        <nav
          aria-label="Links institucionais"
          className="flex flex-wrap items-start gap-x-7 gap-y-2 text-sm text-muted-foreground"
        >
          <Link className="nav-link" href="/ajuda">
            Ajuda
          </Link>
          <Link className="nav-link" href="/privacidade">
            Privacidade
          </Link>
          <Link className="nav-link" href="/termos">
            Termos
          </Link>
        </nav>
      </div>
      <div className="page-width flex flex-wrap justify-between gap-3 border-t border-border py-5 text-xs text-muted-foreground">
        <span>{brand.name} · Versão de desenvolvimento</span>
        <span>Feito para respeitar o ritmo de vocês.</span>
      </div>
    </footer>
  );
}
