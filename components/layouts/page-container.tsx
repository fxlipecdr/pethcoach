import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  size = "dashboard",
  className,
  ...props
}: ComponentProps<"div"> & { size?: "dashboard" | "flow" }) {
  return (
    <div
      data-layout-size={size}
      className={cn(
        "mx-auto w-full min-w-0",
        size === "flow"
          ? "max-w-[var(--layout-flow)]"
          : "max-w-[var(--layout-dashboard)]",
        className,
      )}
      {...props}
    />
  );
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="app-heading">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
