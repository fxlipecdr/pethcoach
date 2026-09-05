import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/pethcoach/brand";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { CookiePreferencesButton } from "@/components/pethcoach/cookie-preferences-button";
import { Paw, Bone, StarDoodle } from "@/components/pethcoach/doodles";
import { brand } from "@/lib/brand";

export { Brand } from "@/components/pethcoach/brand";
export { SiteHeader } from "@/components/pethcoach/site-header";

const footerColumns = [
  {
    title: "Produto",
    links: [
      { href: "/#problemas", label: "Programas" },
      { href: "/#como-funciona", label: "Como funciona" },
      { href: "/#nosso-compromisso", label: "Nosso compromisso" },
    ],
  },
  {
    title: "Ajuda",
    links: [
      { href: "/ajuda", label: "Dúvidas" },
      { href: "/entrar", label: "Área de acesso" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacidade", label: "Privacidade" },
      { href: "/termos", label: "Termos" },
    ],
  },
];

/** §35 — o rodapé é o momento mais expressivo da marca: ink, mascote e despedida. */
export function SiteFooter() {
  return (
    <footer className="relative mt-24 bg-strong text-strong-foreground">
      <PethMascot
        mood="encouraging"
        size={112}
        className="float-soft absolute -top-14 left-6 hidden sm:block lg:left-[7%]"
      />
      <Bone
        tone="cream"
        stroke="var(--ink)"
        size={44}
        className="absolute top-16 right-[12%] hidden rotate-12 opacity-90 lg:block"
      />
      <StarDoodle
        tone="lime"
        stroke="var(--ink)"
        size={26}
        className="absolute top-40 right-[7%] hidden -rotate-12 opacity-90 lg:block"
      />

      <div className="page-width pt-24 pb-10 sm:pt-28">
        <div className="grid gap-14 md:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="font-display max-w-[15ch] text-3xl leading-[1.05] font-bold tracking-[-0.04em] sm:text-4xl">
              Até a próxima aventura.
            </p>
            <p className="mt-5 max-w-sm leading-relaxed text-strong-foreground/70">
              {brand.signature}
            </p>
            <Button asChild className="mt-8">
              <Link href="/entrar">
                Conhecer a área de acesso
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <nav
            aria-label="Links institucionais"
            className="grid grid-cols-2 gap-8 sm:grid-cols-3"
          >
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h2 className="font-display text-xs font-bold tracking-[0.16em] text-mint uppercase">
                  {column.title}
                </h2>
                <ul className="mt-4 space-y-1">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="nav-link text-sm text-strong-foreground/80 transition-colors hover:text-lime"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-5 border-t border-white/12 pt-7">
          <span className="inline-flex items-center rounded-control bg-cream px-4 py-2">
            <Brand />
          </span>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-strong-foreground/60">
            <CookiePreferencesButton className="hover:text-lime" />
            <span>{brand.name} · Versão de desenvolvimento</span>
            <span className="inline-flex items-center gap-2">
              <Paw tone="lime" stroke="var(--ink)" size={16} />
              Feito para respeitar o ritmo de vocês.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
