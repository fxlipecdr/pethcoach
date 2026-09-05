import Link from "next/link";
import type { ReactNode } from "react";
import { CircleHelp, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/pethcoach/brand";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { Paw } from "@/components/pethcoach/doodles";
import { Badge } from "@/components/ui/primitives";
import { PageContainer } from "./page-container";
import { PreviewNotice } from "./preview-notice";
import {
  WorkspaceMenu,
  WorkspaceNavigation,
  type WorkspaceArea,
} from "./workspace-navigation";
import { WorkspaceTabBar } from "./workspace-tabbar";

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
        <p className="mt-10 mb-4 flex items-center gap-2 px-3 text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          <Paw tone="mint" size={16} />
          {title}
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
          <div className="mt-4 flex items-center gap-3 rounded-card bg-surface-warm px-3 py-3">
            <PethMascot mood="neutral" size={40} className="float-soft" />
            <p className="text-xs leading-snug text-muted-foreground">
              PethCoach · Em desenvolvimento
            </p>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="flex min-h-21 items-center justify-between gap-3 border-b border-border bg-card px-4 py-4 sm:px-8">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden items-center gap-2 text-sm font-medium lg:flex">
            {area === "admin" ? (
              <ShieldCheck className="size-4 text-primary-strong" aria-hidden="true" />
            ) : null}
            {title}
          </div>
          <div className="hidden lg:block">
            <Badge>
              {preview ? "Prévia de interface" : "Em desenvolvimento"}
            </Badge>
          </div>
          {area === "admin" ? (
            <WorkspaceMenu area={area} preview={preview} />
          ) : null}
        </header>
        <main
          id="conteudo"
          className="min-w-0 px-4 py-7 pb-28 sm:px-8 sm:py-10 lg:pb-10"
        >
          <PageContainer>
            {preview ? <PreviewNotice /> : null}
            {children}
          </PageContainer>
        </main>
        <footer className="px-4 py-6 pb-24 text-xs text-muted-foreground sm:px-8 lg:pb-6">
          <PageContainer>
            <span className="inline-flex items-center gap-2">
              <Paw tone="lime" size={16} />
              Recompensa, respeito e consistência. No ritmo de vocês.
            </span>
          </PageContainer>
        </footer>
      </div>
      {area === "app" ? (
        <WorkspaceTabBar
          preview={preview}
          activeHref={preview ? "/app" : undefined}
        />
      ) : null}
    </div>
  );
}
