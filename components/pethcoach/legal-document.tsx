import type { ReactNode } from "react";
import { Paw } from "@/components/pethcoach/doodles";
import { controlador, atualizadoEm } from "@/content/legal";

/**
 * Casca dos documentos legais. Coluna estreita e tipografia sóbria: aqui o
 * objetivo é ser lido e compreendido, não impressionar.
 */
export function LegalDocument({
  titulo,
  resumo,
  children,
}: {
  titulo: string;
  resumo: string;
  children: ReactNode;
}) {
  return (
    <article className="page-width py-12 md:py-20">
      <div className="mx-auto max-w-[68ch]">
        <p className="eyebrow flex items-center gap-2">
          <Paw tone="mint" size={18} />
          {controlador.nomeFantasia}
        </p>
        <h1 className="section-heading mt-3">{titulo}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {resumo}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Última atualização: {atualizadoEm}.
        </p>

        <div className="legal-body mt-10">{children}</div>
      </div>
    </article>
  );
}

/** Seção numerada do documento. */
export function LegalSection({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
        <span className="text-primary-strong">{numero}.</span> {titulo}
      </h2>
      <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
