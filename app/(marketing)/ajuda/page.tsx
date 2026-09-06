import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { FAQ } from "@/components/pethcoach/faq";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Sticker } from "@/components/pethcoach/playground";
import { Paw, Spark } from "@/components/pethcoach/doodles";
import { contato } from "@/content/legal";

export const metadata: Metadata = {
  title: "Dúvidas",
  description:
    "Como funciona o PethCoach, quanto tempo toma por dia, que método usamos e como pedir reembolso. As respostas antes de você precisar perguntar.",
};

export default function HelpPage() {
  return (
    <section className="page-width py-14 md:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <Sticker tone="mint" icon={<Spark tone="coral" size={16} />}>
            Sem letra miúda
          </Sticker>
          <h1 className="section-heading mt-5">Clareza desde o começo.</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            O que costuma travar a decisão, respondido antes de você precisar
            perguntar. Se ficar faltando algo, é só escrever para a gente.
          </p>
        </div>

        <div className="mt-12">
          <FAQ />
        </div>

        {/* Quem chega aqui está decidindo. A página precisa ter saída. */}
        <Card className="mt-14 border-2 border-mint/60 bg-secondary/20 p-6 text-center sm:p-8">
          <span className="inline-flex size-12 items-center justify-center rounded-control bg-card">
            <Mail className="size-5 text-primary-strong" aria-hidden="true" />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-foreground">
            Ficou uma dúvida que não está aqui?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Escreva para{" "}
            <a
              href={`mailto:${contato.email}`}
              className="font-semibold text-primary-strong underline underline-offset-4"
            >
              {contato.email}
            </a>
            . {contato.descricao}
          </p>
        </Card>

        <div className="mt-12 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
            <Paw tone="mint" size={22} />O primeiro dia de treino é gratuito e
            não pede cartão.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/entrar">Começar pelo dia grátis</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/planos">Ver planos e preços</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
