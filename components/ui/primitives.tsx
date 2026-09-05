import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PethMascot, type MascotMood } from "@/components/pethcoach/peth-mascot";
import type { DoodleTone } from "@/components/pethcoach/doodles";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-card border border-border bg-card p-6 shadow-card transition-[box-shadow,border-color] duration-[250ms] ease-playful",
        className,
      )}
      {...props}
    />
  );
}

const badgeTone: Record<DoodleTone, string> = {
  mint: "bg-mint-soft text-success border-mint",
  lime: "bg-lime-soft text-ink border-lime",
  coral: "bg-coral-soft text-danger border-coral/50",
  sky: "bg-sky-soft text-ink border-sky",
  purple: "bg-secondary text-primary-strong border-primary/15",
  cream: "bg-surface-warm text-muted-foreground border-border",
};

export function Badge({
  children,
  tone = "purple",
  className,
}: {
  children: ReactNode;
  tone?: DoodleTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-xs font-bold",
        badgeTone[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const fieldBase =
  "min-h-13 w-full rounded-control border border-border bg-card px-4 text-base shadow-soft transition-[border-color,box-shadow] duration-[150ms] ease-playful enabled:hover:border-primary/40 enabled:focus:border-primary enabled:focus:ring-4 enabled:focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        fieldBase,
        "placeholder:text-muted-foreground read-only:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldBase, className)} {...props} />;
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-control bg-muted motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}

export function Progress({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <progress
      aria-label={label}
      className="h-2.5 w-full overflow-hidden rounded-pill"
      value={pct}
      max={100}
    />
  );
}

/** §27 — o vazio também é um momento da marca: mascote, motivo e saída. */
export function EmptyState({
  title,
  children,
  action,
  mascotMood = "thinking",
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  mascotMood?: MascotMood;
}) {
  return (
    <Card className="py-12 text-center sm:py-16">
      <PethMascot
        mood={mascotMood}
        size={88}
        className="float-soft mx-auto mb-4"
      />
      <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
      {action ? (
        <div className="mt-7 flex justify-center">{action}</div>
      ) : null}
    </Card>
  );
}

/**
 * Bloco recolhido por padrão, para tirar do caminho o que não é a ação
 * principal da tela sem esconder a informação (DESIGN.md §29).
 * Usa `details`/`summary` nativos: teclado e leitores de tela já funcionam.
 */
export function Disclosure({
  title,
  description,
  children,
  defaultOpen = false,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        "group rounded-card border border-border bg-card shadow-soft",
        className,
      )}
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="font-display block text-base font-bold tracking-tight text-foreground">
            {title}
          </span>
          {description ? (
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
        <ChevronDown
          className="size-5 shrink-0 text-muted-foreground transition-transform duration-[250ms] ease-playful group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-border px-5 py-6">{children}</div>
    </details>
  );
}
