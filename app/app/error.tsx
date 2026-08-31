"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
export default function WorkspaceError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card>
      <h1 className="app-heading">Não conseguimos carregar seus dados</h1>
      <p className="mt-4 mb-6 text-muted-foreground">
        Pode ser uma falha temporária de conexão. Tente carregar a página
        novamente.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </Card>
  );
}
