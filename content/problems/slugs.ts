import { problems } from "./index";

/**
 * Vocabulário de slugs de problema, derivado do catálogo.
 *
 * Antes disso, a mesma lista aparecia fixa em quatro lugares: contrato do
 * quiz, contexto anônimo do navegador, editor do admin e as próprias landings.
 * Acrescentar um programa exigia lembrar dos quatro — e o esquecimento não dava
 * erro de compilação, dava 404 em produção com o banco já populado.
 *
 * Uma fonte só. Acrescentar em `content/problems` passa a bastar.
 */
export type ProblemSlug = (typeof problems)[number]["slug"];

export const problemSlugs = problems.map(({ slug }) => slug) as [
  ProblemSlug,
  ...ProblemSlug[],
];
