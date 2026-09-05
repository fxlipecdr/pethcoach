import { notFound } from "next/navigation";
import { Brand } from "@/components/pethcoach/site-shell";
import { UIKit } from "@/components/pethcoach/ui-kit";
import { UIKitPlayground } from "@/components/pethcoach/ui-kit-playground";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";
export default function UIKitPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return (
    <main id="conteudo" className="page-width max-w-4xl py-10">
      <Brand />
      <div className="py-10">
        <p className="text-xs font-semibold tracking-widest text-primary-strong">
          SOMENTE EM DESENVOLVIMENTO
        </p>
        <h1 className="mt-3 text-4xl font-medium tracking-tight">
          A base de cada experiência.
        </h1>
        <p className="mt-4 text-muted-foreground">
          Tokens, componentes e estados do PethCoach. Os exemplos não persistem
          dados.
        </p>
      </div>
      <section aria-labelledby="layout-examples" className="mb-10">
        <h2 id="layout-examples" className="mb-4 text-xl font-semibold">
          Layouts da P1
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              slug: "auth",
              title: "Layout de acesso",
              description: "Entrada focada e contexto de confiança.",
            },
            {
              slug: "app",
              title: "Layout da área pessoal",
              description: "Navegação e conteúdo de até 1200 px.",
            },
            {
              slug: "flow",
              title: "Layout de fluxo",
              description: "Uma coluna de até 720 px para manter o foco.",
            },
            {
              slug: "admin",
              title: "Layout administrativo",
              description: "Estrutura de operação, sem dados ou permissões.",
            },
          ].map((item) => (
            <Link
              key={item.slug}
              href={`/dev/layouts/${item.slug}`}
              className="group rounded-card border border-border bg-card p-5 transition-colors hover:border-primary"
            >
              <span className="flex items-center justify-between gap-3 text-sm font-semibold">
                {item.title}
                <ArrowUpRight
                  className="size-4 text-primary-strong"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-2 block text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </span>
            </Link>
          ))}
        </div>
      </section>
      <div className="mb-10">
        <UIKitPlayground />
      </div>
      <UIKit />
    </main>
  );
}
