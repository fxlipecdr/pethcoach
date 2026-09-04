import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ChoiceCardProps = Omit<
  ComponentProps<"input">,
  "type" | "children" | "title"
> & {
  title: string;
  description?: string;
};

/** Native radio semantics preserve arrow-key navigation, accessible names and form behavior. */
export function ChoiceCard({
  title,
  description,
  className,
  ...props
}: ChoiceCardProps) {
  return (
    <label
      className={cn(
        "group flex min-h-20 cursor-pointer items-start gap-3.5 rounded-2xl border-2 border-border bg-card p-4.5 transition-all duration-150 select-none shadow-xs hover:border-primary/50 hover:bg-muted/30 has-checked:border-primary has-checked:bg-secondary/50 has-checked:shadow-sm has-disabled:cursor-not-allowed has-disabled:opacity-50 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ring has-[[aria-invalid=true]]:border-destructive motion-safe:active:scale-[0.99]",
        className,
      )}
    >
      <input
        {...props}
        type="radio"
        className="mt-0.5 size-5 shrink-0 accent-primary focus-visible:outline-none"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground group-has-checked:text-primary sm:text-base">
          {title}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
