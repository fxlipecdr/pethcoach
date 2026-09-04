import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { PageContainer } from "@/components/layouts/page-container";

export default function CheckoutSucessoPage() {
  return (
    <PageContainer size="flow">
      <div className="py-8">
        <Card className="max-w-xl mx-auto rounded-3xl border-2 border-success/40 bg-gradient-to-br from-card via-card to-success-surface/20 p-8 sm:p-10 text-center shadow-card">
          <div className="mx-auto flex size-24 items-center justify-center rounded-3xl bg-success-surface">
            <PethMascot mood="celebrating" size={80} />
          </div>

          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-success-surface px-4 py-1.5 text-xs font-bold text-foreground border border-success/30">
            <CheckCircle2 className="size-4 text-success" />
            PAGAMENTO CONFIRMADO
          </div>

          <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Tudo pronto! Seu Plano Completo está Liberado
          </h1>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Parabéns pela decisão de investir no bem-estar e na convivência com
            seu cão. Todos os 14 dias de treino estruturado, check-ins diários e
            adaptação de ritmo já estão disponíveis na sua conta.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto shadow-tactile font-bold"
            >
              <Link href="/app">
                Ir para o Treino de Hoje
                <ArrowRight className="size-4 ml-1.5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto rounded-2xl"
            >
              <Link href="/app/conta">Ver detalhes da assinatura</Link>
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
