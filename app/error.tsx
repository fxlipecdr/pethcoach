"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="conteudo" className="page-width py-20">
      <h1 className="text-3xl font-medium">
        Não conseguimos carregar esta página.
      </h1>
      <p className="mt-4 text-muted-foreground">
        Tente novamente em alguns instantes. Nenhuma ação precisa ser refeita
        agora.
      </p>
      <Button className="mt-7" onClick={reset}>
        Tentar novamente
      </Button>
    </main>
  );
}
