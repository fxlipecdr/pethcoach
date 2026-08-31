import { notFound } from "next/navigation";
import { findProblem } from "@/content/problems";
import { FoundationState } from "@/components/pethcoach/foundation-state";
export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!findProblem((await params).slug)) notFound();
  return (
    <FoundationState
      title="Vamos conhecer a rotina de vocês"
      description="O quiz ainda está em preparação. Quando estiver disponível, você poderá responder sem precisar de cartão."
      phase="Quiz e triagem de segurança serão implementados nas fases P4 e P5."
    />
  );
}
