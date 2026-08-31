import { notFound } from "next/navigation";
import { findProblem, problems } from "@/content/problems";
import { FoundationState } from "@/components/pethcoach/foundation-state";

export function generateStaticParams() {
  return problems.map(({ slug }) => ({ slug }));
}
export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const problem = findProblem((await params).slug);
  if (!problem) notFound();
  return (
    <FoundationState
      title={problem.label}
      description={problem.description}
      phase="O conteúdo deste programa será desenvolvido na fase P3 e revisado antes da publicação."
    />
  );
}
