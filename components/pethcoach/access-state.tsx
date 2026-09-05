import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export function AccessState() {
  return (
    <Card className="p-6 sm:p-8">
      <span className="mb-6 inline-flex size-12 items-center justify-center rounded-control bg-secondary text-primary-strong">
        <Mail className="size-5" aria-hidden="true" />
      </span>
      <Badge className="mb-5 ml-3">Em preparação</Badge>
      <h1 className="app-heading">Um lugar para a rotina de vocês</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        O acesso à conta ainda não está disponível. Estamos preparando uma
        entrada simples e segura para salvar o perfil do seu cão e acompanhar
        seus planos.
      </p>
      <div className="mt-6 rounded-control border border-border bg-muted p-4 text-sm">
        <p className="font-medium">A próxima etapa é o acesso por e-mail.</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Autenticação e perfil do cão fazem parte da P2. Nenhum cadastro,
          e-mail ou pagamento é realizado nesta tela.
        </p>
      </div>
      <Button asChild className="mt-7 w-full justify-between">
        <Link href="/#problemas">
          Conhecer os programas <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </Card>
  );
}
