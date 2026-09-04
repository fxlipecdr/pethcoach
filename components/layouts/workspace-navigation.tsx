"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  History,
  House,
  Menu,
  PawPrint,
  SearchCheck,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Brand } from "@/components/pethcoach/brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type WorkspaceArea = "app" | "admin";
const navigation = {
  app: [
    { href: "/app", label: "Visão geral", icon: House },
    { href: "/app/caes", label: "Meus cães", icon: PawPrint },
    { href: "/app/historico", label: "Histórico", icon: History },
    { href: "/app/conta", label: "Minha conta", icon: Settings },
  ],
  admin: [
    { href: "/admin", label: "Visão geral", icon: ShieldCheck },
    { href: "/admin/modulos", label: "Catálogo", icon: BookOpen },
    { href: "/admin/inspector", label: "Inspetor Operacional", icon: SearchCheck },
  ],
};

export function WorkspaceNavigation({
  area,
  mobile = false,
  activeHref,
}: {
  area: WorkspaceArea;
  mobile?: boolean;
  activeHref?: string;
}) {
  const pathname = usePathname();
  const currentPath = activeHref ?? pathname;
  return (
    <nav
      aria-label={
        area === "app"
          ? "Navegação da área pessoal"
          : "Navegação administrativa"
      }
      className="space-y-1"
    >
      {navigation[area].map(({ href, label, icon: Icon }) => {
        const active =
          currentPath === href ||
          (href !== "/app" &&
            href !== "/admin" &&
            currentPath.startsWith(`${href}/`));
        const link = (
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-12 items-center gap-3 rounded-control px-3 text-sm transition-colors",
              active
                ? "bg-secondary font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
        return mobile ? (
          <SheetClose key={href} asChild>
            {link}
          </SheetClose>
        ) : (
          <div key={href}>{link}</div>
        );
      })}
    </nav>
  );
}

export function WorkspaceMenu({
  area,
  preview,
}: {
  area: WorkspaceArea;
  preview?: boolean;
}) {
  const title = area === "app" ? "Menu da área pessoal" : "Menu administrativo";
  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="size-11 p-0" aria-label={title}>
            <Menu aria-hidden="true" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetTitle className="sr-only">{title}</SheetTitle>
          <SheetDescription className="sr-only">
            Navegue pelas seções desta área. Os recursos de negócio ainda estão
            em preparação.
          </SheetDescription>
          <div className="mt-12 mb-9">
            <Brand />
          </div>
          <WorkspaceNavigation
            area={area}
            mobile
            activeHref={
              preview ? (area === "app" ? "/app" : "/admin") : undefined
            }
          />
          <div className="mt-auto pt-10 text-xs text-muted-foreground">
            {preview
              ? "Esta prévia não autentica um usuário. Os links reais continuam protegidos."
              : "Ambiente em preparação. Nenhum treino ou cobrança é realizado nesta etapa."}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
