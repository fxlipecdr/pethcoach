import Link from "next/link";
import { ArrowLeft, Sprout } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { buttonVariants } from "@/components/ui/button";

export function FoundationState({
  title,
  description,
  phase,
  contained = false,
}: {
  title: string;
  description: string;
  phase: string;
  contained?: boolean;
}) {
  return (
    <div className={contained ? "py-4" : "page-width py-14 md:py-24"}>
      <div className="mx-auto max-w-2xl">
        <Badge>
          <Sprout className="size-3.5" aria-hidden="true" /> Em preparação
        </Badge>
        <h1
          className={
            contained
              ? "app-heading mt-6"
              : "mt-6 text-3xl font-semibold tracking-tight md:text-4xl"
          }
        >
          {title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Card className="my-8 bg-secondary/40">
          <p className="font-medium text-brand-700">Uma etapa de cada vez.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Esta é a fundação do PethCoach. {phase} Nenhum treino, cadastro ou
            pagamento é realizado nesta tela.
          </p>
        </Card>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          <ArrowLeft aria-hidden="true" /> Voltar ao início
        </Link>
      </div>
    </div>
  );
}
