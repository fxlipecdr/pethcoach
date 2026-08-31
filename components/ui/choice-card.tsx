import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ChoiceCardProps = Omit<
  ComponentProps<"input">,
  "type" | "children" | "title"
> & {
  title: string;
  description?: string;
};

/** Native radio semantics preserve arrow-key navigation and form behavior. */
export function ChoiceCard({
  title,
  description,
  className,
  ...props
}: ChoiceCardProps) {
  return (
    <label
      className={cn(
        "flex min-h-18 cursor-pointer items-start gap-3 rounded-control border border-input bg-card p-4 transition-colors hover:border-primary has-checked:border-primary has-checked:bg-secondary has-disabled:cursor-not-allowed has-disabled:opacity-50 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-ring has-[[aria-invalid=true]]:border-destructive",
        className,
      )}
    >
      <input
        {...props}
        type="radio"
        className="mt-0.5 size-5 shrink-0 accent-primary focus-visible:outline-none"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
