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
  FeatureCard,
  FloatingCard,
  MetricCard,
  PetAvatar,
  PetCard,
  ProgressBar,
  SectionHeader,
  Sticker,
  SuccessState,
  Testimonial,
} from "@/components/pethcoach/playground";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import {
  PethMascot,
  type MascotMood,
} from "@/components/pethcoach/peth-mascot";
import { Button } from "@/components/ui/button";

const doodles = [
  { name: "paw", node: <Paw tone="mint" size={56} /> },
  { name: "bone", node: <Bone tone="cream" size={56} /> },
  { name: "ball", node: <Ball tone="coral" size={56} /> },
  { name: "heart", node: <HeartDoodle tone="coral" size={56} /> },
  { name: "spark", node: <Spark tone="lime" size={56} /> },
  { name: "treat", node: <Treat tone="lime" size={56} /> },
  { name: "collar", node: <Collar tone="sky" size={56} /> },
  { name: "star", node: <StarDoodle tone="lime" size={56} /> },
];

const moods: MascotMood[] = [
  "neutral",
  "happy",
  "celebrating",
  "thinking",
  "encouraging",
  "pointing",
  "surprised",
  "resting",
];

/** §33 e §39 — inventário visual do universo da marca. */
export function UIKitPlayground() {
  return (
    <Card id="playground" className="rounded-panel">
      <SectionHeader
        eyebrow="Universo da marca"
        title="Pet Playground"
        description="Traços autorais e componentes do DESIGN.md. Todos compartilham grade, contorno e paleta."
      />

      <h3 className="mt-10 text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
        Peth e suas expressões (§15)
      </h3>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {moods.map((mood) => (
          <li
            key={mood}
            className="flex flex-col items-center gap-2 rounded-card border border-border bg-background p-4"
          >
            <PethMascot mood={mood} size={104} />
            <code className="text-xs text-muted-foreground">{mood}</code>
          </li>
        ))}
      </ul>

      <h3 className="mt-10 text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
        Traços (§33)
      </h3>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {doodles.map((doodle) => (
          <li
            key={doodle.name}
            className="flex flex-col items-center gap-2 rounded-card border border-border bg-background p-4"
          >
            {doodle.node}
            <code className="text-xs text-muted-foreground">{doodle.name}</code>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center gap-4 rounded-card border border-border bg-background p-4">
        <Scribble className="w-32" />
        <code className="text-xs text-muted-foreground">scribble</code>
      </div>
      <div className="mt-3 overflow-hidden rounded-card border border-border bg-background pt-4">
        <Wave fill="var(--mint-soft)" />
        <p className="bg-mint-soft px-4 pb-3">
          <code className="text-xs text-ink/70">wave</code>
        </p>
      </div>

      <h3 className="mt-10 text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
        Etiquetas e selos (§26, §40)
      </h3>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Sticker tone="lime" icon={<Spark tone="coral" size={16} />}>
          Novo por aqui
        </Sticker>
        <Sticker tone="coral">Exemplo ilustrativo</Sticker>
        <Sticker tone="sky">Em preparação</Sticker>
        <Badge tone="mint">Tudo certo</Badge>
        <Badge tone="purple">Programa 01</Badge>
        <Badge tone="coral">Atenção</Badge>
      </div>
      <Achievement
        className="mt-4 max-w-sm"
        title="Rotina em dia"
        description="Sem contagem de dias perdidos."
      />

      <h3 className="mt-10 text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
        Cartões (§17, §23)
      </h3>
      <div className="mt-4 grid gap-4 md:grid-cols-12">
        <FeatureCard
          className="md:col-span-7"
          emphasis
          icon={<Paw tone="mint" size={44} />}
          title="Um bloco grande conduz a seção"
          description="O bento é irregular de propósito: um bloco domina e os outros apoiam."
          footer={<Button variant="link">Ver exemplo</Button>}
        />
        <div className="grid gap-4 md:col-span-5">
          <MetricCard
            label="Passos praticados"
            value="12"
            note="Exemplo ilustrativo."
            tone="lime"
          />
          <PetCard name="Luna" subtitle="Golden Retriever · 2 anos">
            <ProgressBar
              label="Combinados do dia"
              value={75}
              hint="3 de 4 — no ritmo de vocês."
            />
          </PetCard>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <FloatingCard floating={false}>
          <p className="text-sm font-bold">FloatingCard</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cartão solto da composição do hero.
          </p>
        </FloatingCard>
        <div className="flex items-center gap-4 rounded-card border border-border bg-background p-4">
          <PetAvatar name="Amora" tone="coral" />
          <PetAvatar name="Théo" tone="sky" />
          <PetAvatar name="Bidu" tone="mint" />
          <code className="text-xs text-muted-foreground">PetAvatar</code>
        </div>
      </div>

      <h3 className="mt-10 text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
        Estados (§27, §28)
      </h3>
      <div className="mt-4 grid gap-4">
        <SuccessState title="Tudo certo!">Informação salva.</SuccessState>
        <EmptyState
          title="Ainda não temos nada por aqui."
          action={<Button>Adicionar cuidado</Button>}
        >
          Comece registrando o primeiro passo de vocês.
        </EmptyState>
      </div>

      <h3 className="mt-10 text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
        Depoimento (§25)
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        O componente existe, mas só recebe conteúdo real. O exemplo abaixo usa
        texto explicitamente fictício e não vai para a landing.
      </p>
      <Testimonial
        className="mt-4 max-w-md"
        quote="Espaço reservado para um depoimento real de tutor."
        author="Exemplo fictício"
        role="Nenhum depoimento foi publicado ainda"
      />
    </Card>
  );
}
