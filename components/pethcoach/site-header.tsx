"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/pethcoach/brand";
import { MobileNav } from "@/components/pethcoach/mobile-nav";
import { AccountCta } from "@/components/pethcoach/account-cta";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#problemas", label: "Programas" },
  { href: "/#como-funciona", label: "Como funciona" },
  { href: "/planos", label: "Planos" },
  { href: "/ajuda", label: "Dúvidas" },
];

/**
 * §21 — logo à esquerda, links ao centro, CTA à direita.
 * Depois do scroll a barra vira uma cápsula discreta; o blur só existe aqui.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 pt-3 pb-2">
      <div
        className={cn(
          "page-width flex min-h-16 items-center justify-between gap-4 transition-[background-color,box-shadow,border-color,border-radius] duration-[250ms] ease-playful",
          scrolled
            ? "rounded-pill border border-border bg-card/85 py-2 shadow-card backdrop-blur-md"
            : "rounded-pill border border-transparent py-2",
        )}
      >
        <Brand />
        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-1 text-sm font-semibold text-muted-foreground md:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-pill px-3.5 py-2 transition-colors duration-[150ms] hover:bg-secondary hover:text-primary-strong"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden rounded-pill md:inline-flex"
          >
            <AccountCta />
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
