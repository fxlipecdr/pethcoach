import Link from "next/link";
import type { ReactNode } from "react";
import { CircleHelp, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/pethcoach/brand";
import { Badge } from "@/components/ui/primitives";
import { PageContainer } from "./page-container";
import { PreviewNotice } from "./preview-notice";
import {
  WorkspaceMenu,
  WorkspaceNavigation,
  type WorkspaceArea,
} from "./workspace-navigation";

/** Presentation only. Real route layouts must authorize before rendering this shell. */
export function WorkspaceShell({
  area,
  preview = false,
  children,
}: {
  area: WorkspaceArea;
  preview?: boolean;
  children: ReactNode;
}) {
  const title = area === "app" ? "Área pessoal" : "Administração";
  return (
    <div className="min-h-dvh">
      <aside
        aria-label="Barra lateral"
        className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-border bg-card px-5 py-7 lg:flex"
      >
        <Brand />
        <p className="mt-10 mb-4 px-3 text-[10px] font-semibold tracking-widest text-muted-foreground">
          {title.toUpperCase()}
        </p>
        <WorkspaceNavigation
          area={area}
          activeHref={
            preview ? (area === "app" ? "/app" : "/admin") : undefined
          }
        />
        <div className="mt-auto border-t border-border pt-5">
          <Link
            href="/ajuda"
            className="nav-link gap-3 px-3 text-sm text-muted-foreground"
          >
            <CircleHelp className="size-4" aria-hidden="true" /> Ajuda
          </Link>
          <p className="mt-3 px-3 text-xs text-muted-foreground">
            PethCoach · Em desenvolvimento
          </p>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="flex min-h-21 items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden items-center gap-2 text-sm font-medium lg:flex">
            {area === "admin" ? (
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            ) : null}
            {title}
          </div>
          <div className="hidden lg:block">
            <Badge>
              {preview ? "Prévia de interface" : "Em desenvolvimento"}
            </Badge>
          </div>
          <WorkspaceMenu area={area} preview={preview} />
        </header>
        <main id="conteudo" className="min-w-0 px-4 py-7 sm:px-8 sm:py-10">
          <PageContainer>
            {preview ? <PreviewNotice /> : null}
            {children}
          </PageContainer>
        </main>
        <footer className="px-4 py-6 text-xs text-muted-foreground sm:px-8">
          <PageContainer>
            Recompensa, respeito e consistência. No ritmo de vocês.
          </PageContainer>
        </footer>
      </div>
    </div>
  );
}
