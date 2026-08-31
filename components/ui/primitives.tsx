import type { ComponentProps, ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-card border border-border bg-card p-6", className)}
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
        "inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary",
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
        "min-h-12 w-full rounded-control border border-input bg-card px-4 text-base placeholder:text-muted-foreground transition-colors enabled:hover:border-primary read-only:bg-muted disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
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
        "min-h-12 w-full rounded-control border border-input bg-card px-4 text-base transition-colors enabled:hover:border-primary disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
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
      className={cn("rounded-xl bg-muted motion-safe:animate-pulse", className)}
      {...props}
    />
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  return (
    <progress
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full"
      value={Math.min(100, Math.max(0, value))}
      max={100}
    />
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="py-12 text-center">
      <CircleAlert
        className="mx-auto mb-4 size-8 text-primary"
        aria-hidden="true"
      />
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mx-auto mt-3 max-w-md text-muted-foreground">
        {children}
      </div>
    </Card>
  );
}
