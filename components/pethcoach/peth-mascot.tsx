import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type MascotMood =
  | "neutral"
  | "happy"
  | "celebrating"
  | "thinking"
  | "encouraging"
  | "pointing"
  | "surprised"
  | "resting";

interface PethMascotProps extends ComponentProps<"svg"> {
  mood?: MascotMood;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * Peth, o mascote do PethCoach — DESIGN.md §15 e §32.
 *
 * Desenhado com as mesmas regras dos traços de `doodles.tsx`: cor chapada,
 * contorno `--ink`, junções arredondadas e nenhuma sombra ou gradiente.
 * A silhueta é a assinatura: cabeça grande, uma orelha em pé e outra caída,
 * mancha em volta de um olho e coleira roxa com plaquinha lime.
 */
const FUR = "#F2B14E";
const FUR_DARK = "#DC9333";
const CREAM = "#FFF3E2";
const INNER_EAR = "#FFC2B4";
const INK = "#17211B";
const COLLAR = "#6757E8";
const TAG = "#DDF56D";
const TONGUE = "#FF796D";

export function PethMascot({
  mood = "neutral",
  size = 96,
  className,
  ariaLabel,
  ...props
}: PethMascotProps) {
  const isAccessible = Boolean(ariaLabel);
  const resting = mood === "resting";
  const beaming = mood === "happy" || mood === "celebrating";
  const wideEyed = mood === "surprised";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={isAccessible ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={!isAccessible ? "true" : undefined}
      stroke={INK}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0 select-none", className)}
      {...props}
    >
      {/* Chão */}
      <ellipse
        cx="60"
        cy="113"
        rx={resting ? 36 : 30}
        ry="4"
        fill={INK}
        fillOpacity="0.07"
        stroke="none"
      />

      {/* Adereços de humor, atrás do corpo */}
      {mood === "celebrating" ? (
        <g>
          <path
            d="M60 6c.9 5.2 3.8 8.1 9 9-5.2 1.1-8.1 4-9 9-.9-5-3.8-7.9-9-9 5.2-.9 8.1-3.8 9-9Z"
            fill={TAG}
          />
          <path
            d="M17 20c.7 3.6 2.6 5.6 6.2 6.3-3.6.7-5.5 2.7-6.2 6.2-.7-3.5-2.7-5.5-6.2-6.2 3.6-.7 5.5-2.7 6.2-6.3Z"
            fill={TONGUE}
          />
          <circle cx="104" cy="24" r="4" fill={COLLAR} />
          <circle cx="14" cy="47" r="3" fill={TAG} />
          <circle cx="107" cy="48" r="3.2" fill={TONGUE} />
        </g>
      ) : null}

      {mood === "thinking" ? (
        <g>
          <circle cx="93" cy="34" r="3.4" fill={CREAM} />
          <circle cx="100" cy="25" r="5" fill={CREAM} />
          <circle cx="108" cy="13" r="8.4" fill={CREAM} />
          <path
            d="M105.4 10.2c0-1.9 1.5-3.2 3.2-3.2 1.8 0 3.2 1.2 3.2 3 0 2.6-3 2.6-3 5"
            strokeWidth="2.2"
          />
          <circle cx="108.6" cy="18.4" r="1.2" fill={INK} stroke="none" />
        </g>
      ) : null}

      {mood === "encouraging" ? (
        <path
          d="M104 20c2.6-3.6 8-2 8 2.4 0 4-5 8-8 10.6-3-2.6-8-6.6-8-10.6 0-4.4 5.4-6 8-2.4Z"
          fill={TONGUE}
        />
      ) : null}

      {resting ? (
        <g stroke="none" fill={INK} fillOpacity="0.55">
          <path d="M88 34h7l-7 8h7" stroke={INK} strokeWidth="2" fill="none" />
          <path
            d="M99 20h9l-9 11h9"
            stroke={INK}
            strokeWidth="2.4"
            fill="none"
          />
        </g>
      ) : null}

      {/* Rabo */}
      {!resting ? (
        <path
          d={
            beaming
              ? "M87 82c11-1 18-11 16-21-1-4-6-3-6 2 0 8-4 12-11 13Z"
              : "M87 86c11 1 19-6 19-15 0-4-5-4-6 1-1 7-6 9-13 8Z"
          }
          fill={FUR_DARK}
        />
      ) : (
        <path
          d="M92 96c10-2 15-9 13-15-1-3-5-2-5 2-1 5-4 7-9 7Z"
          fill={FUR_DARK}
        />
      )}

      {/* Orelhas, atrás da cabeça. A assimetria é a assinatura do Peth. */}
      {resting ? (
        <>
          <path
            d="M35 52c-11 3-15 17-6 22 6 2 10-8 10-18Z"
            fill={FUR_DARK}
          />
          <path
            d="M86 52c11 3 15 17 6 22-6 2-10-8-10-18Z"
            fill={FUR_DARK}
          />
        </>
      ) : (
        <>
          {/* Esquerda: em pé. Direita: caída. A assimetria é a assinatura. */}
          <path
            d="M39 34C24 33 11 15 21 6c11-9 24 8 26 27Z"
            fill={FUR_DARK}
          />
          <path d="M33 26c-7-7-10-14-6-16 4-2 10 8 12 17Z" fill={INNER_EAR} />
          <path
            d={
              wideEyed || mood === "celebrating"
                ? "M81 33c12-16 27-16 30-5 3 11-11 19-25 20Z"
                : "M81 31c17-4 29 8 26 25-3 15-19 15-25 2Z"
            }
            fill={FUR_DARK}
          />
          <path
            d={
              wideEyed || mood === "celebrating"
                ? "M87 29c7-9 15-10 17-5 2 6-6 11-14 12Z"
                : "M88 38c9-2 15 5 13 14-2 8-10 7-13-1Z"
            }
            fill={INNER_EAR}
          />
        </>
      )}

      {/* Corpo */}
      <path
        d={
          resting
            ? "M60 70c19 0 33 10 33 22 0 11-15 15-33 15S27 103 27 92c0-12 14-22 33-22Z"
            : "M60 62c17 0 29 14 29 29 0 14-13 20-29 20s-29-6-29-20c0-15 12-29 29-29Z"
        }
        fill={FUR}
      />

      {/* Peito claro */}
      <path
        d={
          resting
            ? "M60 82c9 0 16 5 16 12s-7 10-16 10-16-3-16-10 7-12 16-12Z"
            : "M60 76c9 0 16 7 16 15s-7 13-16 13-16-5-16-13 7-15 16-15Z"
        }
        fill={CREAM}
      />

      {/* Patas da frente */}
      {mood === "celebrating" ? (
        <>
          <ellipse
            cx="29"
            cy="55"
            rx="8"
            ry="11"
            transform="rotate(-28 29 55)"
            fill={FUR}
          />
          <ellipse
            cx="91"
            cy="55"
            rx="8"
            ry="11"
            transform="rotate(28 91 55)"
            fill={FUR}
          />
        </>
      ) : mood === "pointing" ? (
        <>
          <ellipse cx="47" cy="105" rx="9" ry="6.5" fill={CREAM} />
          <path
            d="M74 88c10-3 24-5 30-2 4 2 3 7-2 8-8 2-20 2-28 0Z"
            fill={FUR}
          />
          <circle cx="103" cy="89" r="5.5" fill={CREAM} />
        </>
      ) : mood === "encouraging" ? (
        <>
          <ellipse cx="47" cy="105" rx="9" ry="6.5" fill={CREAM} />
          <ellipse
            cx="88"
            cy="62"
            rx="7"
            ry="10"
            transform="rotate(28 88 62)"
            fill={FUR}
          />
          <circle cx="94" cy="53" r="5.5" fill={CREAM} />
        </>
      ) : resting ? (
        <>
          <ellipse cx="44" cy="102" rx="10" ry="6" fill={CREAM} />
          <ellipse cx="76" cy="102" rx="10" ry="6" fill={CREAM} />
        </>
      ) : (
        <>
          <ellipse cx="47" cy="105" rx="9" ry="6.5" fill={CREAM} />
          <ellipse cx="73" cy="105" rx="9" ry="6.5" fill={CREAM} />
        </>
      )}

      {/* Coleira roxa e plaquinha lime, iguais ao traço `collar` */}
      <g transform={resting ? "translate(0 8)" : undefined}>
        <path
          d="M40 68c6 8 34 8 40 0v7c-6 8-34 8-40 0v-7Z"
          fill={COLLAR}
        />
        <path d="M60 79v4" strokeWidth="2.4" />
        <circle cx="60" cy="89" r="6.4" fill={TAG} />
      </g>

      {/* Cabeça */}
      <path
        d={
          resting
            ? "M60 26c17 0 30 12 30 27 0 16-13 25-30 25s-30-9-30-25c0-15 13-27 30-27Z"
            : "M60 14c17 0 30 12 30 29 0 17-13 29-30 29S30 60 30 43c0-17 13-29 30-29Z"
        }
        fill={FUR}
      />

      {/* Mancha em volta de um olho — a marca registrada do Peth */}
      <ellipse
        cx="74"
        cy={resting ? 50 : 41}
        rx="11.5"
        ry="12.5"
        transform={`rotate(10 74 ${resting ? 50 : 41})`}
        fill={FUR_DARK}
      />

      {/* Focinho */}
      <ellipse
        cx="60"
        cy={resting ? 62 : 56}
        rx="18"
        ry={resting ? 12 : 13}
        fill={CREAM}
      />

      {/* Nariz */}
      <path
        d={
          resting
            ? "M54 58c0-2.6 3-4 6-1.4 3-2.6 6-1.2 6 1.4 0 3.4-6 7-6 7s-6-3.6-6-7Z"
            : "M54 51c0-2.8 3-4.2 6-1.4 3-2.8 6-1.4 6 1.4 0 3.6-6 7.4-6 7.4S54 54.6 54 51Z"
        }
        fill={INK}
        strokeWidth="2"
      />

      {/* Bochechas */}
      <circle
        cx="40"
        cy={resting ? 58 : 52}
        r="4.4"
        fill={TONGUE}
        fillOpacity="0.32"
        stroke="none"
      />
      <circle
        cx="80"
        cy={resting ? 58 : 52}
        r="4.4"
        fill={TONGUE}
        fillOpacity="0.32"
        stroke="none"
      />

      {/* Olhos */}
      {beaming ? (
        <g strokeWidth="3.2" fill="none">
          <path d="M43 40c2.4-4 6.6-4 9 0" />
          <path d="M68 40c2.4-4 6.6-4 9 0" />
        </g>
      ) : resting ? (
        <g strokeWidth="3" fill="none">
          <path d="M44 50c2.4 4 6.6 4 9 0" />
          <path d="M67 50c2.4 4 6.6 4 9 0" />
        </g>
      ) : mood === "encouraging" ? (
        <>
          <circle cx="48" cy="40" r="5.4" fill={INK} strokeWidth="2" />
          <circle cx="46" cy="38" r="2" fill="#FFFFFF" stroke="none" />
          <path d="M68 41c2.4-4 6.6-4 9 0" strokeWidth="3.2" fill="none" />
        </>
      ) : (
        <>
          <circle
            cx={mood === "thinking" ? 50 : 48}
            cy={wideEyed ? 39 : 40}
            r={wideEyed ? 7 : 5.6}
            fill={INK}
            strokeWidth="2"
          />
          <circle
            cx={mood === "thinking" ? 74 : 72}
            cy={wideEyed ? 39 : 40}
            r={wideEyed ? 7 : 5.6}
            fill={INK}
            strokeWidth="2"
          />
          <circle
            cx={mood === "thinking" ? 48 : 46}
            cy={wideEyed ? 36.5 : 38}
            r={wideEyed ? 2.6 : 2.1}
            fill="#FFFFFF"
            stroke="none"
          />
          <circle
            cx={mood === "thinking" ? 72 : 70}
            cy={wideEyed ? 36.5 : 38}
            r={wideEyed ? 2.6 : 2.1}
            fill="#FFFFFF"
            stroke="none"
          />
        </>
      )}

      {/* Sobrancelhas — carregam boa parte da expressão */}
      {!resting && !beaming ? (
        <g strokeWidth="2.6" fill="none">
          <path
            d={
              wideEyed
                ? "M42 29c3-2.6 7-2.6 10 0"
                : mood === "thinking"
                  ? "M42 32c3-1 7-.4 10 1.6"
                  : "M42 31c3-1.6 7-1.6 10 0"
            }
          />
          <path
            d={
              wideEyed
                ? "M67 29c3-2.6 7-2.6 10 0"
                : mood === "thinking"
                  ? "M67 27c3-2.6 7-2 10 .6"
                  : "M67 31c3-1.6 7-1.6 10 0"
            }
          />
        </g>
      ) : null}

      {/* Boca */}
      {beaming ? (
        <g>
          <path
            d="M51 59c0 7 18 7 18 0Z"
            fill={INK}
            strokeWidth="2.4"
          />
          <path
            d="M56 63c0 4.4 8 4.4 8 0Z"
            fill={TONGUE}
            strokeWidth="2"
          />
        </g>
      ) : wideEyed ? (
        <ellipse cx="60" cy="63" rx="3.4" ry="4" fill={INK} strokeWidth="2" />
      ) : resting ? (
        <path d="M56 70c2.4 2.4 5.6 2.4 8 0" strokeWidth="2.4" fill="none" />
      ) : (
        <g strokeWidth="2.6" fill="none">
          <path d="M53 60c3 3.4 5 3.4 7 .6c2 2.8 4 2.8 7-.6" />
        </g>
      )}
    </svg>
  );
}
