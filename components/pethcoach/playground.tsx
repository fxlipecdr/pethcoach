import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PethMascot, type MascotMood } from "@/components/pethcoach/peth-mascot";
import { Paw, Spark, type DoodleTone } from "@/components/pethcoach/doodles";

/**
 * Componentes do universo Pet Playground — DESIGN.md §39.
 * Cada um carrega algum detalhe da marca: um traço, uma inclinação,
 * um raio diferente ou o mascote. Nenhum deles é um card genérico.
 */

const toneSurface: Record<DoodleTone, string> = {
  mint: "bg-mint-soft border-mint",
  lime: "bg-lime-soft border-lime",
  coral: "bg-coral-soft border-coral/60",
  sky: "bg-sky-soft border-sky",
  purple: "bg-secondary border-primary/25",
  cream: "bg-surface-warm border-border",
};

/** §40 — etiqueta inclinada que reage ao hover. */
export function Sticker({
  tone = "lime",
  icon,
  children,
  className,
  ...props
}: ComponentProps<"span"> & { tone?: DoodleTone; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        "sticker-tilt inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs font-bold text-ink shadow-soft",
        toneSurface[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

/** §17 e §26 — selo de conquista, sempre afirmativo. */
export function Achievement({
  title,
  description,
  tone = "lime",
  className,
}: {
  title: string;
  description?: string;
  tone?: DoodleTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-panel border px-4 py-3",
        toneSurface[tone],
        className,
      )}
    >
      <Spark tone={tone === "lime" ? "coral" : "lime"} size={26} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{title}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-ink/70">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

/** §14 — cartão solto da composição do hero, com flutuação discreta. */
export function FloatingCard({
  className,
  floating = true,
  delayed = false,
  ...props
}: ComponentProps<"div"> & { floating?: boolean; delayed?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-card p-4 shadow-card",
        floating && (delayed ? "float-soft-delayed" : "float-soft"),
        className,
      )}
      {...props}
    />
  );
}

/** §39 — cabeçalho de seção; alinhado à esquerda por padrão (§4). */
export function SectionHeader({
  eyebrow,
  title,
  description,
  aside,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-xl">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="section-heading mt-3">{title}</h2>
        {description ? (
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

/** §17 — número em destaque, com rótulo e nota curta. */
export function MetricCard({
  label,
  value,
  note,
  tone = "mint",
  className,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: DoodleTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-panel border p-5",
        toneSurface[tone],
        className,
      )}
    >
      <p className="text-xs font-bold tracking-[0.12em] text-ink/70 uppercase">
        {label}
      </p>
      <p className="mt-4 font-display text-4xl leading-none font-bold tracking-tight text-ink">
        {value}
      </p>
      {note ? <p className="mt-2 text-xs text-ink/70">{note}</p> : null}
    </div>
  );
}

/** §23 — bloco de recurso; `emphasis` permite o bento irregular. */
export function FeatureCard({
  title,
  description,
  icon,
  emphasis = false,
  footer,
  className,
  ...props
}: Omit<ComponentProps<"div">, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  emphasis?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "lift-card group relative flex flex-col overflow-hidden border bg-card shadow-card",
        emphasis
          ? "rounded-panel border-border p-7 sm:p-9"
          : "rounded-card border-border p-6",
        className,
      )}
      {...props}
    >
      {icon ? <div className="mb-5">{icon}</div> : null}
      <h3
        className={cn(
          "font-display font-bold tracking-tight text-foreground",
          emphasis ? "text-2xl sm:text-3xl" : "text-lg",
        )}
      >
        {title}
      </h3>
      {description ? (
        <p
          className={cn(
            "mt-3 flex-1 leading-relaxed text-muted-foreground",
            emphasis ? "text-base" : "text-sm",
          )}
        >
          {description}
        </p>
      ) : null}
      {footer ? <div className="mt-6">{footer}</div> : null}
    </div>
  );
}

/** §39 — avatar do cão com moldura orgânica. */
export function PetAvatar({
  name,
  src,
  size = 56,
  tone = "mint",
  className,
}: {
  name: string;
  src?: string;
  size?: number;
  tone?: DoodleTone;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border-2 font-display font-bold text-ink",
        toneSurface[tone],
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: "var(--shape-organic)",
        fontSize: size * 0.4,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Foto de ${name}`}
          width={size}
          height={size}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}

/** §26 — barra de progresso com rótulo e valor visíveis. */
export function ProgressBar({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: number;
  hint?: string;
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-bold text-ink/80">{label}</span>
        <span className="font-display text-sm font-bold text-primary-strong">
          {pct}%
        </span>
      </div>
      <progress
        aria-label={label}
        value={pct}
        max={100}
        className="mt-2 h-2.5 w-full overflow-hidden rounded-pill"
      />
      {hint ? (
        <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** §17 e §24 — o cão dentro de uma situação real, não de um rótulo. */
export function PetCard({
  name,
  subtitle,
  avatarSrc,
  children,
  className,
}: {
  name: string;
  subtitle?: string;
  avatarSrc?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-panel border border-border bg-card p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-3.5">
        <PetAvatar name={name} src={avatarSrc} />
        <div className="min-w-0">
          <p className="font-display text-lg font-bold tracking-tight text-foreground">
            {name}
          </p>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <Paw tone="lime" size={22} className="ml-auto" />
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

/**
 * §25 — depoimento real. Recebe conteúdo por props de propósito:
 * o AGENTS.md proíbe depoimento fabricado, então nada é embutido aqui.
 */
export function Testimonial({
  quote,
  author,
  role,
  petName,
  avatarSrc,
  className,
}: {
  quote: string;
  author: string;
  role?: string;
  petName?: string;
  avatarSrc?: string;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "border border-border bg-card p-6 shadow-card",
        className,
      )}
      style={{ borderRadius: "var(--shape-organic)" }}
    >
      <blockquote className="font-display text-lg leading-snug font-semibold tracking-tight text-foreground">
        “{quote}”
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <PetAvatar name={petName ?? author} src={avatarSrc} size={44} tone="coral" />
        <div>
          <p className="text-sm font-bold text-foreground">{author}</p>
          {role ? (
            <p className="text-xs text-muted-foreground">{role}</p>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}

/** §28 — confirmação após uma ação importante, com reação do mascote. */
export function SuccessState({
  title,
  children,
  mascotMood = "celebrating",
  className,
}: {
  title: string;
  children?: ReactNode;
  mascotMood?: MascotMood;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-panel border border-mint bg-mint-soft p-5",
        className,
      )}
    >
      <PethMascot mood={mascotMood} size={56} className="shrink-0" />
      <div>
        <p className="font-display text-lg font-bold tracking-tight text-ink">
          {title}
        </p>
        {children ? (
          <div className="mt-1 text-sm leading-relaxed text-ink/75">
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
