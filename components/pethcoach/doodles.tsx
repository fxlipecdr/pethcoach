import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Biblioteca de desenhos autorais do PethCoach — DESIGN.md §32 e §33.
 *
 * Regras compartilhadas por todos os traços, para que pareçam desenhados
 * pela mesma mão: grade de 32×32, contorno `--ink` de 1.8, junções
 * arredondadas, preenchimento chapado vindo de `tone` e nenhuma sombra.
 * São decorativos: ficam ocultos para tecnologias assistivas.
 */
export type DoodleTone =
  | "mint"
  | "lime"
  | "coral"
  | "sky"
  | "purple"
  | "cream";

const toneFill: Record<DoodleTone, string> = {
  mint: "var(--mint)",
  lime: "var(--lime)",
  coral: "var(--coral)",
  sky: "var(--sky)",
  purple: "var(--purple)",
  cream: "var(--cream)",
};

export interface DoodleProps extends Omit<ComponentProps<"svg">, "fill"> {
  tone?: DoodleTone;
  size?: number;
}

function Doodle({
  tone = "mint",
  size = 32,
  className,
  children,
  ...props
}: DoodleProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill={toneFill[tone]}
      stroke="var(--ink)"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn("shrink-0 select-none", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Patinha — o traço mais recorrente da marca. */
export function Paw(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M16 16.6c4.1 0 7.4 2.7 7.4 6 0 2.5-2 4-4.4 4-1.1 0-2-.4-3-.4s-1.9.4-3 .4c-2.4 0-4.4-1.5-4.4-4 0-3.3 3.3-6 7.4-6Z" />
      <ellipse cx="9.4" cy="12.2" rx="2.9" ry="3.7" transform="rotate(-16 9.4 12.2)" />
      <ellipse cx="22.6" cy="12.2" rx="2.9" ry="3.7" transform="rotate(16 22.6 12.2)" />
      <ellipse cx="15.9" cy="8.2" rx="3" ry="3.9" />
    </Doodle>
  );
}

/** Ossinho. */
export function Bone(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M11 13C11 9.5 8.5 8 6.5 9.5 4.5 11 4.8 14 7 15c-2.2 1.5-2.4 4.5-.4 6 2 1.5 4.4 0 4.4-3.5h10c0 3.5 2.4 5 4.4 3.5 2-1.5 1.8-4.5-.4-6 2.2-1 2.5-4 .5-5.5-2-1.5-4.5 0-4.5 3.5H11Z" />
    </Doodle>
  );
}

/** Bolinha, com brilho e listra de brinquedo. */
export function Ball(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <circle cx="16" cy="16" r="11.2" />
      <path d="M8.2 7.8c2.8 4.8 2.8 11.6 0 16.4" fill="none" />
      <path d="M23.8 7.8c-2.8 4.8-2.8 11.6 0 16.4" fill="none" />
    </Doodle>
  );
}

/** Coração levemente torto, de propósito. */
export function HeartDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M16 27.4C8.2 22.6 4 18.6 4 13.6 4 9.6 6.9 6.8 10.6 6.8c2.3 0 4.2 1.1 5.4 3 1.2-1.9 3.1-3 5.4-3C25.1 6.8 28 9.6 28 13.6c0 5-4.2 9-12 13.8Z" />
    </Doodle>
  );
}

/** Faísca de quatro pontas, para momentos de acerto. */
export function Spark(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="M16 3.2c1 6.6 5.2 10.8 11.8 12.8-6.6 1.4-10.8 5.6-11.8 12.8-1-7.2-5.2-11.4-11.8-12.8C11.4 14 15 9.8 16 3.2Z" />
    </Doodle>
  );
}

/** Petisco. */
export function Treat(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <rect x="4.6" y="8.4" width="22.8" height="15.2" rx="6.4" />
      <circle cx="11.4" cy="14" r="1.5" fill="var(--ink)" stroke="none" />
      <circle cx="19.6" cy="13.2" r="1.5" fill="var(--ink)" stroke="none" />
      <circle cx="15.4" cy="18.8" r="1.5" fill="var(--ink)" stroke="none" />
    </Doodle>
  );
}

/** Coleira com plaquinha. */
export function Collar(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <rect x="3.6" y="10.2" width="24.8" height="7.2" rx="3.6" />
      <path d="M10.6 10.2v7.2M21.4 10.2v7.2" fill="none" />
      <path d="M16 17.4v2.4" fill="none" />
      <circle cx="16" cy="24" r="4.4" fill="var(--lime)" />
    </Doodle>
  );
}

/** Estrela um pouco irregular. */
export function StarDoodle(props: DoodleProps) {
  return (
    <Doodle {...props}>
      <path d="m16 3.6 3.9 7.6 8.5 1.3-6.1 6 1.4 8.6-7.7-4.2-7.7 4.2 1.4-8.6-6.1-6 8.5-1.3L16 3.6Z" />
    </Doodle>
  );
}

/** Onda de transição entre seções. Ocupa a largura toda. */
export function Wave({
  className,
  fill = "var(--surface)",
  flip = false,
  ...props
}: Omit<ComponentProps<"svg">, "fill"> & { fill?: string; flip?: boolean }) {
  return (
    <div className="w-full overflow-hidden leading-none" aria-hidden="true">
      <svg
        viewBox="0 0 1440 56"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-7 w-full sm:h-11", flip && "rotate-180", className)}
        {...props}
      >
        <path
          d="M0 28c220 26 380-24 620-14 240 10 340 40 560 30 100-4 180-16 260-30V56H0V28Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}

/** Rabisco solto, para sublinhar ou marcar uma direção. */
export function Scribble({
  className,
  stroke = "var(--primary)",
  ...props
}: ComponentProps<"svg">) {
  return (
    <svg
      viewBox="0 0 120 18"
      fill="none"
      stroke={stroke}
      strokeWidth={3.2}
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn("h-3 w-auto select-none", className)}
      {...props}
    >
      <path d="M3 12.4C22 5.2 44 3 60 6.4c16 3.4 34 4 57-2.6" />
    </svg>
  );
}
