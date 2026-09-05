"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, House, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceMenu } from "./workspace-navigation";

const tabs = [
  { href: "/app", label: "Hoje", icon: House },
  { href: "/app/caes", label: "Meus cães", icon: PawPrint },
  { href: "/app/historico", label: "Histórico", icon: History },
];

/**
 * DESIGN.md §29 — no celular a navegação principal fica ao alcance do polegar,
 * não escondida atrás de um menu. O quarto slot abre o menu completo.
 */
export function WorkspaceTabBar({
  preview = false,
  activeHref,
}: {
  preview?: boolean;
  activeHref?: string;
}) {
  const pathname = usePathname();
  const currentPath = activeHref ?? pathname;

  return (
    <nav
      aria-label="Navegação rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="grid grid-cols-4">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            currentPath === href ||
            (href !== "/app" && currentPath.startsWith(`${href}/`));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-bold transition-colors duration-[150ms]",
                  active ? "text-primary-strong" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-11 items-center justify-center rounded-pill transition-colors duration-[150ms]",
                    active ? "bg-secondary" : "bg-transparent",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
        <li>
          <WorkspaceMenu area="app" preview={preview} variant="tab" />
        </li>
      </ul>
    </nav>
  );
}
