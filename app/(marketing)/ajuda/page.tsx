import { FAQ } from "@/components/pethcoach/faq";

export default function HelpPage() {
  return (
    <section className="page-width py-16 md:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">PODEMOS AJUDAR?</p>
        <h1 className="section-heading mt-4">Clareza desde o começo.</h1>
        <p className="mt-4 text-muted-foreground">
          O que você precisa saber sobre esta primeira etapa.
        </p>
        <div className="mt-10">
          <FAQ />
        </div>
      </div>
    </section>
  );
}
