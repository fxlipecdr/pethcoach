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
  Sparkles,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductPreview } from "@/components/pethcoach/product-preview";
import { FAQ } from "@/components/pethcoach/faq";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import {
  AmbientGlow,
} from "@/components/pethcoach/organic-decorations";
import { problems } from "@/content/problems";
import { LandingTracker } from "@/features/analytics/landing-tracker";

const problemIcons = { route: Route, dog: Dog, drop: Droplets };
const tones = {
  sage: "bg-sage/80 border-primary/20",
  peach: "bg-peach/80 border-accent/20",
  lavender: "bg-lavender/80 border-brand-700/20",
};

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
      <LandingTracker slug="home" />
      {/* HERO SECTION - Asimétrica, moderna, acolhedora e com o mascote Peth */}
      <section className="relative overflow-hidden pt-8 pb-14 md:pt-14 md:pb-20">
        <AmbientGlow
          color="teal"
          className="-top-24 -left-20 size-[32rem]"
        />
        <AmbientGlow
          color="peach"
          className="top-1/3 -right-20 size-[28rem]"
        />

        <div className="page-width relative z-10 grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12 lg:gap-16">
          <div className="py-2">
            {/* Tag de desenvolvimento */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-2xs backdrop-blur-xs">
              <span
                className="size-2 rounded-full bg-primary animate-pulse"
                aria-hidden="true"
              />{" "}
              Produto em desenvolvimento
            </div>

            <p className="eyebrow">MENOS DÚVIDAS. MAIS CONEXÃO.</p>

            {/* Título principal grande com peso e tracking acolhedor */}
            <h1 className="mt-4 max-w-xl text-[2.85rem] leading-[1.06] font-bold tracking-[-0.05em] sm:text-[3.6rem] lg:text-[4.2rem]">
              Um próximo passo.
              <br />
              <span className="text-primary">
                Uma rotina
                <br /> mais leve.
              </span>
            </h1>

            <p className="mt-5 max-w-[460px] text-base leading-[1.75] text-muted-foreground sm:text-lg">
              Cuidar do comportamento do seu cão pode começar com mais clareza. E
              com pequenos passos que cabem na vida de vocês.
            </p>

            {/* Mascote de boas-vindas com balãozinho interativo */}
            <div className="mt-6 flex items-center gap-4 rounded-2xl border border-primary/20 bg-card/90 p-3.5 shadow-xs max-w-md">
              <PethMascot mood="happy" size={58} className="drop-shadow-sm shrink-0" />
              <div className="text-xs sm:text-sm text-foreground">
                <p className="font-bold text-primary">Oi, eu sou o Peth!</p>
                <p className="text-muted-foreground mt-0.5">
                  Vamos construir um dia a dia com menos estresse e mais cooperação?
                </p>
              </div>
            </div>

            {/* CTA principal com sensação tátil Duolingo */}
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="#problemas"
                className={buttonVariants({
                  className:
                    "min-h-13 w-full justify-between px-7 text-sm font-bold sm:w-auto sm:gap-6 shadow-tactile rounded-2xl",
                })}
              >
                Conhecer os programas <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Sprout className="size-4 text-primary shrink-0" aria-hidden="true" />{" "}
              Recompensa, respeito e consistência.
            </p>

            <div className="mt-7 hidden items-center gap-3 text-xs text-muted-foreground lg:flex">
              <span className="h-px w-10 bg-border" /> Feito para a rotina real. No
              tempo de vocês.
            </div>
          </div>

          {/* Coluna direita: Mockup interativo da experiência */}
          <div className="relative">
            <ProductPreview />
          </div>
        </div>
      </section>

      {/* STRIP DE VALORES - Cartões acolhedores e arredondados */}
      <div className="border-y border-border/80 bg-surface-soft/60 py-6">
        <div className="page-width grid gap-3 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, text: "Bem-estar em primeiro lugar", tint: "text-primary bg-secondary/80" },
            { icon: Heart, text: "Sem punição. Sem culpa.", tint: "text-accent bg-peach/70" },
            { icon: Sprout, text: "Um passo possível de cada vez", tint: "text-success bg-brand-100/70" },
          ].map(({ icon: Icon, text, tint }) => (
            <div
              key={text}
              className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-card/70 p-3.5 text-sm font-semibold text-foreground shadow-2xs sm:justify-center"
            >
              <span className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${tint}`}>
                <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
              </span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SEÇÃO PROGRAMAS - 3 cards com cantos 3xl e sensação pet moderna */}
      <section id="problemas" className="page-width py-16 md:py-24">
        <div className="mb-10 flex items-end justify-between gap-5">
          <div>
            <p className="eyebrow">UM PONTO DE PARTIDA</p>
            <h2 className="section-heading mt-3">
              O que vocês precisam melhorar?
            </h2>
            <p className="mt-3.5 max-w-lg text-base text-muted-foreground leading-relaxed">
              Três situações do dia a dia. Conheça a proposta dos programas que
              estamos preparando.
            </p>
          </div>
          <ArrowDown
            className="mb-2 hidden size-5 text-primary sm:block"
            aria-hidden="true"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {problems.map((problem, index) => {
            const Icon = problemIcons[problem.icon];
            return (
              <Link
                href={`/problemas/${problem.slug}`}
                key={problem.slug}
                className="program-card group flex flex-col overflow-hidden rounded-3xl border-2 border-border bg-card shadow-card transition-all duration-200 hover:border-primary/60 hover:shadow-card-hover motion-safe:hover:-translate-y-1.5"
              >
                {/* Header tonal com ícone expressivo */}
                <div
                  className={`relative m-3 flex min-h-36 items-end justify-between rounded-2xl p-5 border ${tones[problem.tone]}`}
                >
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-card/80 shadow-xs backdrop-blur-xs">
                    <Icon
                      className="size-8 text-brand-700"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="text-right">
                    <span className="block text-[11px] font-bold tracking-widest text-brand-700 uppercase">
                      {problem.category}
                    </span>
                    <span
                      className="mt-1 block text-3xl font-extrabold tracking-tight text-brand-700"
                      aria-hidden="true"
                    >
                      0{index + 1}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-6 pt-3 pb-6">
                  <h3 className="text-xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {problem.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {problem.description}
                  </p>
                  <div className="mt-6 flex items-center justify-between gap-3 border-t border-border/80 pt-4 text-sm font-bold text-primary">
                    <span>Conhecer a proposta</span>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:translate-x-1">
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* SEÇÃO COMO FUNCIONA - Alternância com ondas orgânicas Plamev */}
      <section
        id="como-funciona"
        className="relative bg-surface-soft/60 border-y border-border/80 py-16 md:py-24"
      >
        <div className="page-width grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-20 md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary/80 px-3.5 py-1 text-xs font-bold text-primary mb-3">
              <Sparkles className="size-3.5" aria-hidden="true" />
              PASSO A PASSO GUIADO
            </div>
            <p className="eyebrow">SIMPLES, COMO PRECISA SER</p>
            <h2 className="section-heading mt-3 max-w-sm">
              Um plano para a vida real.
            </h2>
            <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground text-base">
              Sem precisar descobrir tudo sozinho. É assim que estamos
              desenhando a sua experiência.
            </p>

            {/* Chamada com mascote pensando */}
            <div className="mt-6 flex items-center gap-3.5 rounded-2xl border border-border/80 bg-card p-4 shadow-xs max-w-sm">
              <PethMascot mood="thinking" size={54} className="shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cada cão aprende em um ritmo diferente. Nós ajudamos você a interpretar os sinais.
              </p>
            </div>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full bg-card border border-border/80 px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-2xs">
              <span
                className="size-2 rounded-full bg-primary"
                aria-hidden="true"
              />{" "}
              Em preparação
            </div>
          </div>

          <ol className="space-y-4" aria-label="Passos do funcionamento">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <li
                key={title}
                className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:border-primary/40"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-secondary font-extrabold text-primary text-base shadow-2xs">
                  0{index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-bold tracking-tight text-foreground">
                      {title}
                    </h3>
                    <Icon
                      className="size-5 shrink-0 text-primary"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* SEÇÃO NOSSO COMPROMISSO - Card escuro de alta confiança */}
      <section id="nosso-compromisso" className="page-width pt-16 md:pt-24">
        <div className="grid gap-8 rounded-[2.25rem] bg-strong p-8 text-strong-foreground shadow-xl md:grid-cols-2 md:gap-16 md:p-14 border border-strong/80">
          <div>
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-xs">
              <ShieldCheck className="size-7" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <p className="mb-3 text-[11px] font-bold tracking-[0.16em] uppercase text-brand-100">
              NOSSO COMPROMISSO
            </p>
            <h2 className="section-heading text-white">
              Cuidar também é<br />
              conhecer os limites.
            </h2>
          </div>
          <div className="self-center">
            <p className="leading-relaxed text-strong-foreground/90 text-base">
              Estamos construindo uma experiência baseada em recompensas e
              respeito ao cão. Não fazemos diagnósticos nem substituímos a
              avaliação de um veterinário ou profissional qualificado.
            </p>
            <Link
              href="/ajuda"
              className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-2xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/20"
            >
              Conheça nossos princípios{" "}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* SEÇÃO FAQ - Acolhedora e sem atrito */}
      <section
        className="page-width grid gap-8 py-16 md:grid-cols-[0.85fr_1.15fr] md:gap-20 md:py-24"
        aria-labelledby="faq-heading"
      >
        <div>
          <p className="eyebrow">ANTES DO PRIMEIRO PASSO</p>
          <h2 id="faq-heading" className="section-heading mt-3">
            É bom ter clareza.
          </h2>
          <p className="mt-3.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Respostas sobre a proposta e sobre o que já está disponível nesta
            versão.
          </p>

          <div className="mt-8 hidden md:block">
            <PethMascot mood="neutral" size={88} className="opacity-90 drop-shadow-sm" />
          </div>
        </div>
        <FAQ />
      </section>
    </>
  );
}
