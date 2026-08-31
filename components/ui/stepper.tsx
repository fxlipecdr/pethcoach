import { cn } from "@/lib/utils";

export function Stepper({
  steps,
  current,
  label = "Etapas",
}: {
  steps: readonly string[];
  current: number;
  label?: string;
}) {
  return (
    <ol aria-label={label} className="flex gap-2">
      {steps.map((step, index) => (
        <li
          key={step}
          aria-current={index === current ? "step" : undefined}
          className="min-w-0 flex-1"
        >
          <div
            className={cn(
              "mb-2 h-1 rounded-full",
              index <= current ? "bg-primary" : "bg-border",
            )}
          />
          <span
            className={cn(
              "text-xs",
              index === current
                ? "font-semibold text-foreground"
                : "text-muted-foreground",
            )}
          >
            <span className="sr-only">Etapa {index + 1}: </span>
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}
