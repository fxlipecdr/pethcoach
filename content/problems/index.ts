export const problems = [
  {
    slug: "cachorro-puxa-guia",
    label: "Passeios mais tranquilos",
    title: "Meu cachorro puxa a guia",
    description: "Para quando passear juntos vira uma disputa de direção.",
    icon: "route",
    category: "NO PASSEIO",
    tone: "sage",
  },
  {
    slug: "filhote-mordendo",
    label: "Brincadeiras com mais calma",
    title: "Meu filhote morde muito",
    description: "Para as brincadeiras que acabam em mãos e roupas mordidas.",
    icon: "dog",
    category: "NA BRINCADEIRA",
    tone: "peach",
  },
  {
    slug: "xixi-lugar-errado",
    label: "Uma rotina de higiene",
    title: "Xixi fora do lugar",
    description: "Para construir uma rotina mais previsível dentro de casa.",
    icon: "drop",
    category: "EM CASA",
    tone: "lavender",
  },
] as const;

export function findProblem(slug: string) {
  return problems.find((problem) => problem.slug === slug);
}
