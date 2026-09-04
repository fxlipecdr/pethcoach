import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PethMascot, type MascotMood } from "@/components/pethcoach/peth-mascot";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card p-6 shadow-card transition-all duration-200",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary border border-primary/10 shadow-2xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-control border-2 border-border bg-card px-4 text-base placeholder:text-muted-foreground transition-all duration-150 enabled:hover:border-primary/60 enabled:focus:border-primary enabled:focus:ring-4 enabled:focus:ring-primary/10 read-only:bg-muted disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "min-h-12 w-full rounded-control border-2 border-border bg-card px-4 text-base transition-all duration-150 enabled:hover:border-primary/60 enabled:focus:border-primary enabled:focus:ring-4 enabled:focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive shadow-xs",
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-2xl bg-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}

export function Progress({ value, label }: { value: number; label: string }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <progress
      aria-label={label}
      className="h-3 w-full overflow-hidden rounded-full shadow-inner transition-all duration-300"
      value={pct}
      max={100}
    />
  );
}

export function EmptyState({
  title,
  children,
  mascotMood = "thinking",
}: {
  title: string;
  children: ReactNode;
  mascotMood?: MascotMood;
}) {
  return (
    <Card className="py-12 text-center sm:py-16">
      <PethMascot
        mood={mascotMood}
        size={88}
        className="mx-auto mb-4 drop-shadow-sm motion-safe:hover:scale-105 transition-transform"
      />
      <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {children}
      </div>
    </Card>
  );
}
