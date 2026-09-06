"use client";
import Link from "next/link";
import { Menu, ArrowUpRight } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";

export function MobileNav() {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className="size-11 p-0"
            aria-label="Abrir menu"
          >
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle className="sr-only">Navegação do PethCoach</SheetTitle>
          <SheetDescription className="sr-only">
            Explore os programas e conheça a proposta do produto.
          </SheetDescription>
          <div className="mt-12">
            <Brand />
          </div>
          <nav aria-label="Menu mobile" className="mt-10 flex flex-col">
            {[
              { href: "/#problemas", label: "Programas" },
              { href: "/#como-funciona", label: "Como funciona" },
              { href: "/planos", label: "Planos" },
              { href: "/#nosso-compromisso", label: "Nosso compromisso" },
              { href: "/ajuda", label: "Dúvidas" },
            ].map((link) => (
              <SheetClose asChild key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-16 items-center justify-between border-b border-border text-lg font-medium"
                >
                  {link.label}
                  <ArrowUpRight
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </SheetClose>
            ))}
          </nav>
          <div className="mt-auto pt-10">
            <p className="mb-4 text-xs text-muted-foreground">
              O primeiro dia de treino é gratuito, sem cartão.
            </p>
            <SheetClose asChild>
              <Button asChild className="w-full">
                <Link href="/entrar">Entrar</Link>
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
