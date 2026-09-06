import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Dog,
  Droplets,
  BellRing,
  HandHeart,
  Undo2,
  House,
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
import { resolvePublicPlanPrices } from "@/features/billing/pricing";
import { PlanCards } from "@/components/pethcoach/plan-cards";
import { LandingTracker } from "@/features/analytics/landing-tracker";

const problemIcons = {
  route: Route,
  dog: Dog,
  drop: Droplets,
  bell: BellRing,
  hand: HandHeart,
  recall: Undo2,
  home: House,
};

/** Tons de superfície por programa — §7: as cores secundárias são momentos, não uniforme. */
const tones = {
  sage: "bg-mint-soft border-mint",
  peach: "bg-coral-soft border-coral/50",
  lavender: "bg-sky-soft border-sky",
  butter: "bg-lime-soft border-lime",
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

/**
 * A home lê o preço do Stripe para exibir os planos. Revalidação curta mantém
 * a página estática para quem chega de anúncio, e o valor atualiza sozinho
 * quando muda no painel.
 */
export const revalidate = 300;

export default async function Home() {
  const precos = await resolvePublicPlanPrices();
  const [lead, ...rest] = problems;
  const LeadIcon = problemIcons[lead.icon];

  return (
    <>
      <LandingTracker slug="home" />

      {/* §14 — hero assimétrico: texto à esquerda, universo visual à direita. */}
      <section className="relative overflow-hidden pt-8 pb-24 md:pt-14 md:pb-32">
        <Bone
          tone="cream"
          size={70}
          className="absolute top-52 -left-5 hidden rotate-[-22deg] opacity-80 lg:block"
        />
        <StarDoodle
          tone="lime"
          size={30}
          className="absolute top-10 right-[42%] hidden rotate-12 opacity-90 xl:block"
        />

        <div className="page-width relative grid items-center gap-12 md:grid-cols-[1.12fr_0.88fr] md:gap-10 lg:gap-16">
          <div>
            <Sticker tone="lime" icon={<Spark tone="coral" size={16} />}>
              Primeiro dia grátis, sem cartão
            </Sticker>

            <p className="eyebrow mt-7">Puxa a guia? Late? Não fica sozinho?</p>

            <h1 className="display-heading mt-4">
              Um plano de 14 dias
              <br />
              para o problema{" "}
              <span className="marker-underline">de vocês.</span>
            </h1>

            <p className="mt-7 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
              Você conta o que está acontecendo e recebe exercícios de poucos
              minutos por dia, na ordem certa, com critério de parada. Sem
              tranco, sem grito, sem promessa mágica.
            </p>

            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="#problemas"
                className={buttonVariants({
                  size: "lg",
                  className: "w-full sm:w-auto",
                })}
              >
                Começar pelo dia grátis
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link
                href="#planos"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "w-full sm:w-auto",
                })}
              >
                Ver preços
              </Link>
            </div>

            {/* Sinal de preço no primeiro quadro: quem vem de anúncio não
                deveria precisar de dois cliques para saber quanto custa. */}
            <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 font-semibold">
                <Paw tone="mint" size={22} />
                Programa completo por{" "}
                <strong className="text-foreground">
                  {precos.single_program.priceFormatted}
                </strong>
              </span>
              <span>7 dias para desistir, sem justificar</span>
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

            {/* Precisa ficar abaixo da legenda da demonstração: em -bottom-14
                o cartão cobria o texto em 1024, 1280 e 1440. */}
            <FloatingCard
              delayed
              className="absolute -bottom-24 -left-8 z-10 hidden w-64 sm:block"
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
          description="Sete situações do dia a dia. Escolha a de vocês e comece pelo Dia 1, que é gratuito."
          aside={
            <Scribble className="hidden w-36 text-primary-strong sm:block" />
          }
        />

        {/* Banner do programa em destaque, depois seis cards iguais em três
            colunas. Com sete itens, a grade de 12 colunas anterior deixava
            duas colunas vazias nas duas últimas fileiras. */}
        <Link
          href={`/problemas/${lead.slug}`}
          className="lift-card group mt-12 grid gap-7 overflow-hidden rounded-panel border border-border bg-card p-7 shadow-card hover:border-primary/40 sm:p-9 lg:grid-cols-[0.85fr_1.15fr] lg:items-center"
        >
          <div
            className={`relative flex min-h-44 items-end justify-between rounded-card border p-6 ${tones[lead.tone]}`}
          >
            <Paw
              tone="cream"
              size={88}
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

          <div>
            <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {lead.title}
            </h3>
            <p className="mt-3 max-w-lg leading-relaxed text-muted-foreground">
              {lead.description}
            </p>
            <span className="arrow-nudge mt-6 inline-flex items-center gap-3 text-sm font-bold text-primary-strong">
              Ver o programa
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </span>
          </div>
        </Link>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((problem, index) => {
            const Icon = problemIcons[problem.icon];
            return (
              <Link
                href={`/problemas/${problem.slug}`}
                key={problem.slug}
                className="lift-card group flex flex-col rounded-card border border-border bg-card p-6 shadow-card hover:border-primary/40"
              >
                <span
                  className={`flex size-14 shrink-0 items-center justify-center rounded-control border ${tones[problem.tone]}`}
                >
                  <Icon
                    className="size-6 text-ink"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-5 text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  {problem.category} · 0{index + 2}
                </span>
                <h3 className="font-display mt-1.5 text-lg font-bold tracking-tight text-foreground">
                  {problem.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {problem.description}
                </p>
                <span className="arrow-nudge mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-primary-strong">
                  Ver o programa
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Preço logo depois da dor: quem se reconheceu num programa precisa
          saber quanto custa antes de qualquer outra coisa. */}
      <section id="planos" className="page-width pb-20 md:pb-28">
        <SectionHeader
          eyebrow="Quanto custa"
          title="Comece de graça. Continue se fizer sentido."
          description="O Dia 1 é completo e gratuito, sem pedir cartão. Um adestrador cobra de R$ 80 a R$ 200 por aula."
        />

        <PlanCards prices={precos} className="mt-12 max-w-4xl" />

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary-strong" aria-hidden="true" />
            7 dias para desistir, sem justificar
          </span>
          <span className="flex items-center gap-2">
            <Paw tone="mint" size={20} />
            Cancele sozinho, sem falar com atendimento
          </span>
          <Link href="/planos" className="nav-link font-semibold text-primary-strong">
            Ver detalhes dos planos
          </Link>
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
              Sem precisar descobrir tudo sozinho. É assim que o programa
              funciona, do primeiro dia ao décimo quarto.
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
              Toda a orientação é baseada em recompensas e respeito ao cão.
              Não fazemos diagnóstico nem substituímos a avaliação de um
              médico-veterinário — e a triagem de segurança interrompe o treino
              quando é disso que vocês precisam.
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
            O que costuma travar a decisão, respondido antes de você
            perguntar.
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
