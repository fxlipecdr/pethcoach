import { notFound } from "next/navigation";
import { findProblem } from "@/content/problems";
import { QuizEngine } from "@/features/assessments/quiz-engine";
import { problemSlugSchema } from "@/features/assessments/contracts";
import { getPublicEnv } from "@/lib/env/public";
import { getServerEnv } from "@/lib/env/server";
export default async function QuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const parsedSlug = problemSlugSchema.safeParse((await params).slug);
  if (!parsedSlug.success) notFound();
  const problem = findProblem(parsedSlug.data);
  if (!problem) notFound();
  const publicEnv = getPublicEnv();
  const available = Boolean(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL &&
      publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      getServerEnv().ASSESSMENT_TOKEN_SECRET,
  ) ||
    (process.env.NODE_ENV === "development" &&
      process.env.E2E_QUIZ_UI_ONLY === "1");
  return (
    <section className="page-width py-10 sm:py-16">
      <QuizEngine
        problem={{ slug: parsedSlug.data, title: problem.title }}
        available={available}
      />
    </section>
  );
}
