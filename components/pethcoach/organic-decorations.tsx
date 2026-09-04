import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Ondulação orgânica superior (estilo Plamev), conectando seções de forma natural e acolhedora.
 */
export function OrganicWaveTop({
  className,
  fill = "currentColor",
  ...props
}: ComponentProps<"svg">) {
  return (
    <div className="w-full overflow-hidden leading-none" aria-hidden="true">
      <svg
        viewBox="0 0 1440 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={cn("h-6 w-full sm:h-10 lg:h-12", className)}
        {...props}
      >
        <path
          d="M0,24 C280,48 520,0 800,24 C1080,48 1320,8 1440,24 L1440,48 L0,48 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

/**
 * Ondulação orgânica inferior conectando a transição entre seções.
 */
export function OrganicWaveBottom({
  className,
  fill = "currentColor",
  ...props
}: ComponentProps<"svg">) {
  return (
    <div className="w-full overflow-hidden leading-none" aria-hidden="true">
      <svg
        viewBox="0 0 1440 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className={cn("h-6 w-full sm:h-10 lg:h-12", className)}
        {...props}
      >
        <path
          d="M0,0 L1440,0 C1320,32 1080,48 800,24 C520,0 280,36 0,16 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

/**
 * Mancha orgânica ambiental para criar profundidade e calor visual no hero e cards.
 */
export function AmbientGlow({
  color = "mint",
  className,
  ...props
}: {
  color?: "mint" | "peach" | "lavender" | "teal";
  className?: string;
} & ComponentProps<"div">) {
  const colorMap = {
    mint: "from-brand-100/60 to-transparent",
    peach: "from-peach/50 to-transparent",
    lavender: "from-lavender/50 to-transparent",
    teal: "from-primary/10 to-transparent",
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full bg-radial blur-3xl opacity-70",
        colorMap[color],
        className,
      )}
      {...props}
    />
  );
}
