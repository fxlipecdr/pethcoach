"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Feedback } from "@/components/ui/feedback";
import { generatePlanAction } from "./actions";

interface GeneratePlanButtonProps {
  assessmentId: string;
  dogId: string;
  dogName: string;
}

export function GeneratePlanButton({
  assessmentId,
  dogId,
  dogName,
}: GeneratePlanButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const result = await generatePlanAction({
        assessmentId,
        dogId,
      });

      if (result.status === "error") {
        setError(result.message);
      }
    });
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Feedback tone="error" title="Não foi possível gerar o plano">
          {error}
        </Feedback>
      ) : null}
      <Button
        onClick={handleGenerate}
        loading={isPending}
        loadingText="Estruturando plano de 14 dias..."
        className="w-full sm:w-auto"
      >
        <Sparkles className="size-4" aria-hidden="true" />
        Gerar Plano de 14 Dias para {dogName}
      </Button>
    </div>
  );
}
