import Link from "next/link";
import { Brand } from "@/components/pethcoach/site-shell";
import { buttonVariants } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main id="conteudo" className="page-width py-14">
      <Brand />
      <div className="py-20">
        <p className="text-sm text-primary">404 · CAMINHO NÃO ENCONTRADO</p>
        <h1 className="mt-4 text-4xl font-medium">
          Vamos voltar para um lugar conhecido?
        </h1>
        <p className="mt-4 text-muted-foreground">
          Essa página não existe ou não está disponível para você.
        </p>
        <Link className={buttonVariants({ className: "mt-8" })} href="/">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
