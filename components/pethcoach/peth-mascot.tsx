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
 * PethMascot: O mascote canino oficial do PethCoach.
 * Um cãozinho carismático, amigável e estilizado em SVG vetorial de alta definição.
 * 100% responsivo, sem dependência de assets externos e alinhado à paleta oficial.
 */
export function PethMascot({
  mood = "neutral",
  size = 96,
  className,
  ariaLabel,
  ...props
}: PethMascotProps) {
  const isAccessible = Boolean(ariaLabel);

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
      className={cn("shrink-0 transition-transform duration-200 select-none", className)}
      {...props}
    >
      <defs>
        {/* Sombras suaves para profundidade */}
        <filter id="mascot-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" />
        </filter>
        {/* Gradiente dourado suave para os pelos */}
        <linearGradient id="fur-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F7B23B" />
          <stop offset="100%" stopColor="#E59424" />
        </linearGradient>
        {/* Orelhas em tom mais acolhedor */}
        <linearGradient id="ear-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E2891E" />
          <stop offset="100%" stopColor="#C97412" />
        </linearGradient>
        {/* Focinho creme suave */}
        <linearGradient id="muzzle-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF7EC" />
          <stop offset="100%" stopColor="#FFEACC" />
        </linearGradient>
      </defs>

      {/* Sombra de chão */}
      <ellipse cx="60" cy="112" rx="36" ry="5" fill="#0B1F33" fillOpacity="0.08" />

      {/* Elementos especiais conforme o mood */}
      {mood === "celebrating" && (
        <g className="animate-pulse">
          {/* Confetes e estrelas de celebração */}
          <circle cx="20" cy="24" r="3.5" fill="#FC6F4D" />
          <circle cx="98" cy="22" r="3" fill="#0F766E" />
          <circle cx="26" cy="40" r="2.5" fill="#2E9E68" />
          <circle cx="94" cy="42" r="2.5" fill="#FC6F4D" />
          {/* Estrelinhas */}
          <path d="M58 8 L60 14 L66 16 L60 18 L58 24 L56 18 L50 16 L56 14 Z" fill="#F7B23B" />
          <path d="M18 16 L19.5 20 L23.5 21.5 L19.5 23 L18 27 L16.5 23 L12.5 21.5 L16.5 20 Z" fill="#2E9E68" />
          <path d="M102 14 L103.5 17.5 L107 18.5 L103.5 19.5 L102 23 L100.5 19.5 L97 18.5 L100.5 17.5 Z" fill="#FC6F4D" />
        </g>
      )}

      {mood === "thinking" && (
        <g>
          {/* Balãozinho de pensamento */}
          <circle cx="86" cy="28" r="3" fill="#DDF3EF" stroke="#0F766E" strokeWidth="1.2" />
          <circle cx="92" cy="20" r="4.5" fill="#DDF3EF" stroke="#0F766E" strokeWidth="1.2" />
          <circle cx="102" cy="12" r="7" fill="#DDF3EF" stroke="#0F766E" strokeWidth="1.5" />
          <text x="99" y="16" fill="#0F766E" fontSize="10" fontWeight="bold" fontFamily="sans-serif">?</text>
        </g>
      )}

      {mood === "encouraging" && (
        <g>
          {/* Coraçãozinho flutuante de afeto */}
          <path
            d="M96 22 C96 17 103 14 106 19 C109 14 116 17 116 22 C116 28 106 34 106 34 C106 34 96 28 96 22 Z"
            fill="#FC6F4D"
            filter="drop-shadow(0 2px 4px rgba(252, 111, 77, 0.3))"
          />
        </g>
      )}

      {mood === "resting" && (
        <g>
          {/* Símbolos zZz de sono e descanso tranquilo */}
          <text x="88" y="22" fill="#586875" fontSize="9" fontWeight="bold" opacity="0.6">z</text>
          <text x="96" y="16" fill="#586875" fontSize="11" fontWeight="bold" opacity="0.8">Z</text>
          <text x="106" y="10" fill="#0F766E" fontSize="14" fontWeight="bold">Z</text>
        </g>
      )}

      {/* CORPO DO CÃO */}
      <ellipse
        cx="60"
        cy={mood === "resting" ? 84 : 80}
        rx={mood === "resting" ? 34 : 28}
        ry={mood === "resting" ? 22 : 26}
        fill="url(#fur-gradient)"
      />

      {/* Mancha peitoral mais clara */}
      <path
        d="M50 72 C50 64 70 64 70 72 C70 88 50 88 50 72 Z"
        fill="url(#muzzle-gradient)"
        opacity="0.95"
      />

      {/* PATAS TRASEIRAS / CORPO INFERIOR */}
      {mood !== "resting" ? (
        <>
          <ellipse cx="40" cy="104" rx="10" ry="7" fill="url(#ear-gradient)" />
          <ellipse cx="80" cy="104" rx="10" ry="7" fill="url(#ear-gradient)" />
          {/* Patas dianteiras padrão */}
          <ellipse cx="50" cy="105" rx="8" ry="6" fill="#FFEACC" />
          <ellipse cx="70" cy="105" rx="8" ry="6" fill="#FFEACC" />
        </>
      ) : (
        <>
          {/* Pata aconchegada */}
          <ellipse cx="44" cy="98" rx="8" ry="5" fill="#FFEACC" />
          <ellipse cx="76" cy="98" rx="8" ry="5" fill="#FFEACC" />
        </>
      )}

      {/* RABO FELIZ */}
      {mood !== "resting" ? (
        <path
          d={
            mood === "happy" || mood === "celebrating"
              ? "M84 76 C96 74 104 62 102 54 C100 52 96 56 94 66 C92 72 86 78 84 76 Z"
              : "M84 78 C94 78 100 70 98 64 C96 62 93 66 90 72 C88 76 84 78 84 78 Z"
          }
          fill="url(#ear-gradient)"
        />
      ) : null}

      {/* ORELHAS (desenhadas atrás da cabeça) */}
      {mood === "happy" || mood === "surprised" ? (
        // Orelhas empinadas de entusiasmo
        <>
          <path
            d="M34 46 C24 36 24 16 36 24 C44 30 42 46 34 46 Z"
            fill="url(#ear-gradient)"
          />
          <path
            d="M86 46 C96 36 96 16 84 24 C76 30 78 46 86 46 Z"
            fill="url(#ear-gradient)"
          />
          {/* Parte interna rosada */}
          <path d="M33 38 C28 30 29 20 36 25 C40 30 38 40 33 38 Z" fill="#FFC7B2" opacity="0.8" />
          <path d="M87 38 C92 30 91 20 84 25 C80 30 82 40 87 38 Z" fill="#FFC7B2" opacity="0.8" />
        </>
      ) : mood === "thinking" ? (
        // Uma orelha empinada e outra caída
        <>
          <path
            d="M36 46 C24 38 22 22 34 26 C42 30 42 46 36 46 Z"
            fill="url(#ear-gradient)"
          />
          <path
            d="M84 46 C98 52 102 72 90 74 C82 72 82 56 84 46 Z"
            fill="url(#ear-gradient)"
          />
        </>
      ) : (
        // Orelhas caídas carismáticas normais
        <>
          <path
            d="M36 46 C22 52 18 72 30 74 C38 72 38 56 36 46 Z"
            fill="url(#ear-gradient)"
          />
          <path
            d="M84 46 C98 52 102 72 90 74 C82 72 82 56 84 46 Z"
            fill="url(#ear-gradient)"
          />
          <path d="M29 55 C22 60 21 68 28 70 C33 70 33 61 29 55 Z" fill="#FFC7B2" opacity="0.75" />
          <path d="M91 55 C98 60 99 68 92 70 C87 70 87 61 91 55 Z" fill="#FFC7B2" opacity="0.75" />
        </>
      )}

      {/* CABEÇA */}
      <circle
        cx="60"
        cy={mood === "resting" ? 56 : 50}
        r="27"
        fill="url(#fur-gradient)"
      />

      {/* FOCINHO CREME */}
      <ellipse
        cx="60"
        cy={mood === "resting" ? 64 : 58}
        rx="16"
        ry="12"
        fill="url(#muzzle-gradient)"
      />

      {/* NARIZ CORAÇÃOZINHO PRETO */}
      <path
        d={
          mood === "resting"
            ? "M56 59 C56 57 58 56 60 58 C62 56 64 57 64 59 C64 62 60 64 60 64 C60 64 56 62 56 59 Z"
            : "M55 53 C55 50.5 57.5 49 60 51.5 C62.5 49 65 50.5 65 53 C65 57 60 60 60 60 C60 60 55 57 55 53 Z"
        }
        fill="#0B1F33"
      />
      {/* Brilho no nariz */}
      <circle cx="58.5" cy={mood === "resting" ? 59 : 53} r="1" fill="#FFFFFF" opacity="0.9" />

      {/* OLHOS CONFORME O MOOD */}
      {mood === "happy" || mood === "celebrating" ? (
        // Olhinhos fechados de pura felicidade (^ _ ^)
        <g stroke="#0B1F33" strokeWidth="2.8" strokeLinecap="round" fill="none">
          <path d="M47 44 C49 40 53 40 55 44" />
          <path d="M65 44 C67 40 71 40 73 44" />
        </g>
      ) : mood === "resting" ? (
        // Olhinhos dormindo calmos
        <g stroke="#0B1F33" strokeWidth="2.5" strokeLinecap="round" fill="none">
          <path d="M47 50 C49 53 53 53 55 50" />
          <path d="M65 50 C67 53 71 53 73 50" />
        </g>
      ) : mood === "surprised" ? (
        // Olhos arregalados curiosos
        <>
          <circle cx="51" cy="44" r="6" fill="#0B1F33" />
          <circle cx="69" cy="44" r="6" fill="#0B1F33" />
          <circle cx="49.5" cy="42" r="2.2" fill="#FFFFFF" />
          <circle cx="67.5" cy="42" r="2.2" fill="#FFFFFF" />
          <circle cx="52.5" cy="45.5" r="1.1" fill="#FFFFFF" />
          <circle cx="70.5" cy="45.5" r="1.1" fill="#FFFFFF" />
        </>
      ) : (
        // Olhos expressivos padrão brilhantes
        <>
          <circle cx="51" cy="44" r="4.8" fill="#0B1F33" />
          <circle cx="69" cy="44" r="4.8" fill="#0B1F33" />
          <circle cx="49.5" cy="42.5" r="1.8" fill="#FFFFFF" />
          <circle cx="67.5" cy="42.5" r="1.8" fill="#FFFFFF" />
          <circle cx="52" cy="45.5" r="0.9" fill="#FFFFFF" />
          <circle cx="70" cy="45.5" r="0.9" fill="#FFFFFF" />
          {/* Sobrancelhas sutis expressivas */}
          <ellipse cx="51" cy="37" rx="3" ry="1.2" fill="#C97412" />
          <ellipse cx="69" cy="37" rx="3" ry="1.2" fill="#C97412" />
        </>
      )}

      {/* BOCA E LÍNGUA */}
      {mood === "happy" || mood === "celebrating" ? (
        // Boca aberta alegre com linguinha rosa
        <g>
          <path
            d="M55 60 C55 66 65 66 65 60 Z"
            fill="#B42318"
          />
          <path
            d="M57 61 C57 66 63 66 63 61 Z"
            fill="#FC6F4D"
          />
        </g>
      ) : mood === "surprised" ? (
        // Boca redondinha de "ó!"
        <circle cx="60" cy="63" r="2.5" fill="#0B1F33" />
      ) : mood === "resting" ? (
        // Boquinha sutil serena
        <path
          d="M58 65 Q60 67 62 65"
          stroke="#0B1F33"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      ) : (
        // Sorriso acolhedor em W
        <path
          d="M55 60 Q57.5 63 60 61 Q62.5 63 65 60"
          stroke="#0B1F33"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* BOCHECHAS ROSADAS */}
      <circle cx="44" cy="52" r="3.5" fill="#FC6F4D" fillOpacity="0.25" />
      <circle cx="76" cy="52" r="3.5" fill="#FC6F4D" fillOpacity="0.25" />

      {/* COLEIRA TEAL OFICIAL (#0F766E) */}
      <path
        d={
          mood === "resting"
            ? "M44 74 C44 71 76 71 76 74 C76 77 44 77 44 74 Z"
            : "M43 68 C43 64 77 64 77 68 C77 73 43 73 43 68 Z"
        }
        fill="#0F766E"
      />
      {/* Detalhe da costura da coleira */}
      <path
        d={
          mood === "resting"
            ? "M46 74 C50 73 70 73 74 74"
            : "M45 68.5 C50 67 70 67 75 68.5"
        }
        stroke="#DDF3EF"
        strokeWidth="0.8"
        strokeDasharray="2 1"
        fill="none"
      />

      {/* MEDALHA DE CORAÇÃO CORAL (#FC6F4D) */}
      <g transform={mood === "resting" ? "translate(0, 6)" : "translate(0, 0)"}>
        {/* Elo de metal */}
        <circle cx="60" cy="71" r="2" stroke="#E59424" strokeWidth="1" fill="none" />
        {/* Coraçãozinho com a cor oficial --heart */}
        <path
          d="M56 74 C56 71.5 59 70.5 60 72.5 C61 70.5 64 71.5 64 74 C64 76.5 60 79.5 60 79.5 C60 79.5 56 76.5 56 74 Z"
          fill="#FC6F4D"
        />
        {/* Brilho na medalha */}
        <circle cx="58" cy="73.5" r="0.8" fill="#FFFFFF" opacity="0.8" />
      </g>

      {/* PATAS DIANTEIRAS ESPECIAIS (apontando ou comemorando) */}
      {mood === "celebrating" && (
        <g>
          {/* Patas erguidas para cima! */}
          <ellipse cx="32" cy="54" rx="7" ry="10" transform="rotate(-30 32 54)" fill="url(#fur-gradient)" />
          <ellipse cx="88" cy="54" rx="7" ry="10" transform="rotate(30 88 54)" fill="url(#fur-gradient)" />
          <circle cx="28" cy="46" r="5" fill="#FFEACC" />
          <circle cx="92" cy="46" r="5" fill="#FFEACC" />
        </g>
      )}

      {mood === "pointing" && (
        <g>
          {/* Pata esquerda apoiada, pata direita estendida apontando para a frente */}
          <ellipse cx="48" cy="80" rx="6" ry="8" fill="url(#fur-gradient)" />
          {/* Pata apontando */}
          <path
            d="M74 76 C82 74 94 72 98 74 C100 75 100 78 96 80 C90 82 80 82 74 80 Z"
            fill="url(#fur-gradient)"
          />
          <circle cx="98" cy="76" r="4.5" fill="#FFEACC" />
        </g>
      )}

      {mood === "thinking" && (
        <g>
          {/* Pata encostada no queixo pensativa */}
          <ellipse cx="70" cy="68" rx="6" ry="8" transform="rotate(-20 70 68)" fill="url(#fur-gradient)" />
          <circle cx="68" cy="64" r="5" fill="#FFEACC" />
        </g>
      )}

      {mood === "encouraging" && (
        <g>
          {/* Pata direita levantada acenando */}
          <ellipse cx="86" cy="62" rx="6" ry="9" transform="rotate(25 86 62)" fill="url(#fur-gradient)" />
          <circle cx="90" cy="55" r="5" fill="#FFEACC" />
        </g>
      )}
    </svg>
  );
}
