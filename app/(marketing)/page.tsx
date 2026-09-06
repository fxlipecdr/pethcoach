import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Dog,
  Droplets,
  MessageCircle,
  Footprints,
  ChartNoAxesCombined,
  Route,
  ShieldCheck,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ProductPreview } from "@/components/pethcoach/product-preview";
import { FAQ } from "@/components/pethcoach/faq";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import {
  Ball,
  Bone,
  Collar,
  HeartDoodle,
  Paw,
  Scribble,
  Spark,
  StarDoodle,
  Treat,
  Wave,
} from "@/components/pethcoach/doodles";
import {
  Achievement,
  FloatingCard,
  PetCard,
  ProgressBar,
  SectionHeader,
  Sticker,
} from "@/components/pethcoach/playground";
import { problems } from "@/content/problems";
import { LandingTracker } from "@/features/analytics/landing-tracker";

const problemIcons = { route: Route, dog: Dog, drop: Droplets };

/** Tons de superfície por programa — §7: as cores secundárias são momentos, não uniforme. */
const tones = {
  sage: "bg-mint-soft border-mint",
  peach: "bg-coral-soft border-coral/50",
  lavender: "bg-sky-soft border-sky",
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

const exampleDay = [
  "Passeio curto, com guia leve",
  "Pausa antes da porta",
  "Brincadeira com redirecionamento",
  "Descanso sem cobrança",
];

export default function Home() {
  const [lead, ...rest] = problems;
  const LeadIcon = problemIcons[lead.icon];

  return (
    <>
      <LandingTracker slug="home" />

      {/* §14 — hero assimétrico: texto à esquerda, universo visual à direita. */}
      <section className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24">
        <Bone
          tone="cream"
          size={70}
          className="absolute top-52 -left-5 hidden rotate-[-22deg] opacity-80 lg:block"
        />
        <StarDoodle
          tone="lime"
          size={30}
          className="absolute top-24 right-[46%] hidden rotate-12 opacity-90 lg:block"
        />

        <div className="page-width relative grid items-center gap-12 md:grid-cols-[1.12fr_0.88fr] md:gap-10 lg:gap-16">
          <div>
            <Sticker tone="lime" icon={<Spark tone="coral" size={16} />}>
              Primeiro dia grátis
            </Sticker>

            <p className="eyebrow mt-7">Menos dúvidas. Mais conexão.</p>

            <h1 className="display-heading mt-4">
              Um próximo passo.
              <br />
              Uma rotina <span className="marker-underline">mais leve.</span>
            </h1>

            <p className="mt-7 max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
              Cuidar do comportamento do seu cão pode começar com mais clareza.
              E com pequenos passos que cabem na vida de vocês.
            </p>

            <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
              <Link
                href="#problemas"
                className={buttonVariants({
                  size: "lg",
                  className: "w-full sm:w-auto",
                })}
              >
                Conhecer os programas
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="#como-funciona"
                className={buttonVariants({
                  variant: "link",
                  className: "text-sm",
                })}
              >
                Ver como funciona
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>

            <p className="mt-9 flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <Paw tone="mint" size={24} />
              Recompensa, respeito e consistência.
            </p>
          </div>

          {/* Composição: mini UI, cartão solto, mascote e objetos flutuantes. */}
          <div className="relative">
            <Ball
              tone="coral"
              size={54}
              className="float-soft absolute -top-6 -right-2 z-10 hidden sm:block"
            />
            <Treat
              tone="lime"
              size={38}
              className="float-soft-delayed absolute top-1/2 -left-7 z-10 hidden rotate-12 lg:block"
            />

            <ProductPreview />

            <FloatingCard
              delayed
              className="absolute -bottom-14 -left-8 z-10 hidden w-64 sm:block"
            >
              <div className="flex items-center gap-3">
                <PethMascot mood="happy" size={46} className="shrink-0" />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  <strong className="block text-primary-strong">
                    Oi, eu sou o Peth!
                  </strong>
                  Vou acompanhar vocês em cada passo.
                </p>
              </div>
            </FloatingCard>
          </div>
        </div>
      </section>

      {/* §22 — faixa ink para quebrar o ritmo antes dos programas. */}
      <div className="bg-strong py-5 text-strong-foreground">
        <div className="page-width flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm font-semibold sm:justify-between">
          <span className="flex items-center gap-2.5">
            <HeartDoodle tone="coral" stroke="var(--cream)" size={22} />
            Bem-estar em primeiro lugar
          </span>
          <span className="flex items-center gap-2.5">
            <Collar tone="mint" stroke="var(--cream)" size={22} />
            Sem punição. Sem culpa.
          </span>
          <span className="flex items-center gap-2.5">
            <Spark tone="lime" stroke="var(--cream)" size={22} />
            Um passo possível de cada vez
          </span>
        </div>
      </div>

      {/* §23 — bento irregular: um bloco grande e dois menores, nunca três iguais. */}
      <section id="problemas" className="page-width py-20 md:py-28">
        <SectionHeader
          eyebrow="Um ponto de partida"
          title="O que vocês precisam melhorar?"
          description="Três situações do dia a dia. Conheça a proposta dos programas que estamos preparando."
          aside={
            <Scribble className="hidden w-36 text-primary-strong sm:block" />
          }
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <Link
            href={`/problemas/${lead.slug}`}
            className="lift-card group relative flex flex-col justify-between overflow-hidden rounded-panel border border-border bg-card p-7 shadow-card hover:border-primary/40 sm:p-9 lg:col-span-7 lg:row-span-2"
          >
            <div
              className={`relative flex min-h-52 items-end justify-between rounded-card border p-6 ${tones[lead.tone]}`}
            >
              <Paw
                tone="cream"
                size={92}
                className="absolute -top-4 -right-3 rotate-12 opacity-70"
              />
              <LeadIcon
                className="size-12 text-ink"
                strokeWidth={1.4}
                aria-hidden="true"
              />
              <div className="relative text-right">
                <span className="block text-[11px] font-bold tracking-[0.16em] text-ink/70 uppercase">
                  {lead.category}
                </span>
                <span
                  className="font-display mt-1 block text-5xl leading-none font-bold tracking-tight text-ink"
                  aria-hidden="true"
                >
                  01
                </span>
              </div>
            </div>

            <div className="mt-7">
              <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {lead.title}
              </h3>
              <p className="mt-3 max-w-md leading-relaxed text-muted-foreground">
                {lead.description}
              </p>
              <span className="arrow-nudge mt-7 inline-flex items-center gap-3 text-sm font-bold text-primary-strong">
                Conhecer a proposta
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </span>
            </div>
          </Link>

          {rest.map((problem, index) => {
            const Icon = problemIcons[problem.icon];
            return (
              <Link
                href={`/problemas/${problem.slug}`}
                key={problem.slug}
                className="lift-card group flex gap-5 rounded-card border border-border bg-card p-6 shadow-card hover:border-primary/40 lg:col-span-5"
              >
                <span
                  className={`flex size-16 shrink-0 items-center justify-center rounded-control border ${tones[problem.tone]}`}
                >
                  <Icon
                    className="size-7 text-ink"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                    {problem.category} · 0{index + 2}
                  </span>
                  <h3 className="font-display mt-1.5 text-xl font-bold tracking-tight text-foreground">
                    {problem.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {problem.description}
                  </p>
                  <span className="arrow-nudge mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary-strong">
                    Conhecer a proposta
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* §24 — a funcionalidade dentro de uma situação real, sobre superfície branca. */}
      <Wave fill="var(--card)" />
      <section id="como-funciona" className="bg-card">
        <div className="page-width grid items-center gap-14 py-6 md:grid-cols-[0.9fr_1.1fr] md:gap-16 md:py-12">
          <div className="relative">
            <PetCard name="Luna" subtitle="Golden Retriever · 2 anos">
              <p className="text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
                Um dia comum
              </p>
              <ul className="mt-3 space-y-2.5">
                {exampleDay.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-foreground"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-pill bg-mint">
                      <Check
                        className="size-3 text-ink"
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <ProgressBar
                className="mt-6"
                label="Combinados do dia"
                value={100}
                hint="4 de 4 — no ritmo de vocês."
              />
            </PetCard>

            <Sticker tone="coral" className="absolute -top-3 -right-2">
              Exemplo ilustrativo
            </Sticker>

            <Achievement
              className="mt-4"
              title="Rotina em dia"
              description="Sem cobrança e sem contagem de dias perdidos."
            />
          </div>

          <div>
            <p className="eyebrow">Simples, como precisa ser</p>
            <h2 className="section-heading mt-3 max-w-[14ch]">
              Um plano para a vida real.
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
              Sem precisar descobrir tudo sozinho. É assim que estamos
              desenhando a sua experiência.
            </p>

            <ol className="mt-9 space-y-4" aria-label="Passos do funcionamento">
              {steps.map(({ icon: Icon, title, description }, index) => (
                <li
                  key={title}
                  className={`lift-card flex items-start gap-4 rounded-card border border-border bg-background p-5 ${
                    index === 1 ? "md:ml-8" : index === 2 ? "md:ml-4" : ""
                  }`}
                >
                  <span className="font-display flex size-11 shrink-0 items-center justify-center rounded-control bg-secondary text-base font-bold text-primary-strong">
                    0{index + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                        {title}
                      </h3>
                      <Icon
                        className="size-5 shrink-0 text-primary-strong"
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <Wave fill="var(--background)" />
      </section>

      {/* §22 — painel ink de compromisso, com o mascote espiando a borda. */}
      <section id="nosso-compromisso" className="page-width pt-20 md:pt-24">
        <div className="relative grid gap-8 rounded-panel bg-strong p-8 text-strong-foreground shadow-card md:grid-cols-2 md:gap-16 md:p-14">
          <PethMascot
            mood="encouraging"
            size={96}
            className="float-soft absolute -top-11 right-8 hidden md:block"
          />
          <div>
            <div className="mb-5 flex size-12 items-center justify-center rounded-control bg-white/10">
              <ShieldCheck
                className="size-7"
                strokeWidth={1.6}
                aria-hidden="true"
              />
            </div>
            <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-mint uppercase">
              Nosso compromisso
            </p>
            <h2 className="section-heading">
              Cuidar também é conhecer os limites.
            </h2>
          </div>
          <div className="self-center">
            <p className="leading-relaxed text-strong-foreground/85">
              Estamos construindo uma experiência baseada em recompensas e
              respeito ao cão. Não fazemos diagnósticos nem substituímos a
              avaliação de um veterinário ou profissional qualificado.
            </p>
            <Link
              href="/ajuda"
              className="arrow-nudge mt-7 inline-flex min-h-12 items-center gap-3 rounded-control bg-white/10 px-5 text-sm font-bold text-white transition-colors hover:bg-white/20"
            >
              Conheça nossos princípios
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ — composição assimétrica, com o mascote apoiado na coluna. */}
      <section
        className="page-width grid gap-10 py-20 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:py-28"
        aria-labelledby="faq-heading"
      >
        <div className="relative">
          <p className="eyebrow">Antes do primeiro passo</p>
          <h2 id="faq-heading" className="section-heading mt-3">
            É bom ter clareza.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Respostas sobre a proposta e sobre o que já está disponível nesta
            versão.
          </p>
          <PethMascot
            mood="thinking"
            size={104}
            className="float-soft mt-10 hidden md:block"
          />
        </div>
        <FAQ />
      </section>
    </>
  );
}
