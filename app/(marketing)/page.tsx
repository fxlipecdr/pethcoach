import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Heart,
  Route,
  Dog,
  Droplets,
  ShieldCheck,
  Sprout,
  MessageCircle,
  Footprints,
  ChartNoAxesCombined,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductPreview } from "@/components/pethcoach/product-preview";
import { FAQ } from "@/components/pethcoach/faq";
import { problems } from "@/content/problems";

const problemIcons = { route: Route, dog: Dog, drop: Droplets };
const tones = { sage: "bg-sage", peach: "bg-peach", lavender: "bg-lavender" };
const steps = [
  {
    icon: MessageCircle,
    title: "Conte o que está acontecendo.",
    description:
      "Um quiz curto para entender o comportamento, o contexto e a rotina de vocês.",
  },
  {
    icon: Footprints,
    title: "Tenha clareza para praticar.",
    description:
      "Orientações curtas, com preparação, passos claros e limites de segurança.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Encontre o ritmo de vocês.",
    description:
      "Check-ins simples para registrar a experiência e acompanhar pequenas mudanças.",
  },
];

export default function Home() {
  return (
    <>
      <section className="page-width grid items-center gap-12 pt-10 pb-12 md:grid-cols-[1.08fr_1fr] md:gap-12 md:pt-16 md:pb-16 lg:gap-20">
        <div className="py-2">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
            <span
              className="size-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />{" "}
            Produto em desenvolvimento
          </div>
          <p className="eyebrow">MENOS DÚVIDAS. MAIS CONEXÃO.</p>
          <h1 className="mt-5 max-w-xl text-[2.8rem] leading-[1.07] font-medium tracking-[-0.06em] sm:text-[3.6rem] lg:text-[4.25rem]">
            Um próximo passo.
            <br />
            <span className="text-primary">
              Uma rotina
              <br /> mais leve.
            </span>
          </h1>
          <p className="mt-6 max-w-[440px] text-base leading-[1.8] text-muted-foreground sm:text-lg">
            Cuidar do comportamento do seu cão pode começar com mais clareza. E
            com pequenos passos que cabem na vida de vocês.
          </p>
          <Link
            href="#problemas"
            className={buttonVariants({
              className:
                "mt-8 min-h-13 w-full justify-between px-6 text-sm sm:w-auto sm:gap-7",
            })}
          >
            Conhecer os programas <ArrowRight aria-hidden="true" />
          </Link>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <Sprout className="size-4 text-primary" aria-hidden="true" />{" "}
            Recompensa, respeito e consistência.
          </p>
          <div className="mt-9 hidden items-center gap-3 text-xs text-muted-foreground lg:flex">
            <span className="h-px w-9 bg-border" /> Feito para a rotina real. No
            tempo de vocês.
          </div>
        </div>
        <ProductPreview />
      </section>

      <div className="page-width grid gap-4 border-y border-border py-6 text-sm text-muted-foreground sm:grid-cols-3">
        {[
          { icon: ShieldCheck, text: "Bem-estar em primeiro lugar" },
          { icon: Heart, text: "Sem punição. Sem culpa." },
          { icon: Sprout, text: "Um passo possível de cada vez" },
        ].map(({ icon: Icon, text }) => (
          <span
            className="inline-flex items-center gap-3 sm:justify-center"
            key={text}
          >
            <Icon
              className="size-4 shrink-0 text-primary"
              strokeWidth={1.7}
              aria-hidden="true"
            />
            {text}
          </span>
        ))}
      </div>

      <section id="problemas" className="page-width py-16 md:py-24">
        <div className="mb-9 flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow">UM PONTO DE PARTIDA</p>
            <h2 className="section-heading mt-3">
              O que vocês precisam melhorar?
            </h2>
            <p className="mt-4 max-w-lg text-muted-foreground">
              Três situações do dia a dia. Conheça a proposta dos programas que
              estamos preparando.
            </p>
          </div>
          <ArrowDown
            className="mb-2 hidden size-5 text-primary sm:block"
            aria-hidden="true"
          />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {problems.map((problem, index) => {
            const Icon = problemIcons[problem.icon];
            return (
              <Link
                href={`/problemas/${problem.slug}`}
                key={problem.slug}
                className="program-card group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,box-shadow,transform] duration-200 hover:border-primary/50 hover:shadow-card motion-safe:hover:-translate-y-1"
              >
                <div
                  className={`relative m-2.5 flex min-h-36 items-end justify-between rounded-xl p-5 ${tones[problem.tone]}`}
                >
                  <Icon
                    className="size-13 text-brand-700"
                    strokeWidth={1.1}
                    aria-hidden="true"
                  />
                  <div className="text-right">
                    <span className="block text-[10px] font-medium tracking-widest text-brand-700">
                      {problem.category}
                    </span>
                    <span
                      className="mt-2 block text-3xl font-light tracking-tight text-brand-700"
                      aria-hidden="true"
                    >
                      0{index + 1}
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col px-6 pt-4 pb-5">
                  <h3 className="max-w-60 text-[1.35rem] leading-snug font-medium tracking-tight">
                    {problem.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {problem.description}
                  </p>
                  <div className="mt-7 flex items-center justify-between gap-3 border-t border-border pt-4 text-sm font-medium text-primary">
                    <span>Conhecer a proposta</span>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted transition-colors group-hover:bg-secondary">
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        id="como-funciona"
        className="border-y border-border bg-card py-16 md:py-20"
      >
        <div className="page-width grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-20">
          <div>
            <p className="eyebrow">SIMPLES, COMO PRECISA SER</p>
            <h2 className="section-heading mt-4 max-w-sm">
              Um plano para a vida real.
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-muted-foreground">
              Sem precisar descobrir tudo sozinho. É assim que estamos
              desenhando a sua experiência.
            </p>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              <span
                className="size-1.5 rounded-full bg-primary"
                aria-hidden="true"
              />{" "}
              Em preparação
            </div>
          </div>
          <ol className="divide-y divide-border border-y border-border">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <li
                className="grid grid-cols-[2.5rem_1fr] gap-3 py-7"
                key={title}
              >
                <span className="pt-0.5 text-sm text-primary">
                  0{index + 1}
                </span>
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-medium tracking-tight">
                      {title}
                    </h3>
                    <Icon
                      className="mt-1 size-5 shrink-0 text-primary"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="nosso-compromisso" className="page-width pt-16 md:pt-24">
        <div className="grid gap-8 rounded-[1.5rem] bg-strong p-7 text-strong-foreground md:grid-cols-2 md:gap-16 md:p-12">
          <div>
            <ShieldCheck
              className="mb-6 size-8"
              strokeWidth={1.3}
              aria-hidden="true"
            />
            <p className="mb-4 text-[10px] font-medium tracking-[0.15em]">
              NOSSO COMPROMISSO
            </p>
            <h2 className="section-heading">
              Cuidar também é<br />
              conhecer os limites.
            </h2>
          </div>
          <div className="self-center">
            <p className="leading-relaxed text-strong-foreground/90">
              Estamos construindo uma experiência baseada em recompensas e
              respeito ao cão. Não fazemos diagnósticos nem substituímos a
              avaliação de um veterinário ou profissional qualificado.
            </p>
            <Link
              href="/ajuda"
              className="mt-6 inline-flex min-h-11 items-center gap-3 text-sm font-medium underline underline-offset-4"
            >
              Conheça nossos princípios{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section
        className="page-width grid gap-8 py-16 md:grid-cols-[0.8fr_1.2fr] md:gap-20 md:py-24"
        aria-labelledby="faq-heading"
      >
        <div>
          <p className="eyebrow">ANTES DO PRIMEIRO PASSO</p>
          <h2 id="faq-heading" className="section-heading mt-4">
            É bom ter clareza.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Respostas sobre a proposta e sobre o que já está disponível nesta
            versão.
          </p>
        </div>
        <FAQ />
      </section>
    </>
  );
}
