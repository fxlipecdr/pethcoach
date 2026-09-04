import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { PethMascot } from "@/components/pethcoach/peth-mascot";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { UnsubscribeForm } from "./unsubscribe-form";
import type { EmailCategory } from "@/features/emails/contracts";
import { EMAIL_CATEGORIES } from "@/features/emails/contracts";
import { MailX, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Preferências de Notificações | PethCoach",
  description: "Gerencie o cancelamento de e-mails e preferências de comunicação no PethCoach.",
  robots: {
    index: false,
    follow: false,
  },
};

interface UnsubscribePageProps {
  searchParams: Promise<{
    token?: string;
    category?: string;
    all?: string;
  }>;
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const params = await searchParams;
  const token = params.token;
  const rawCategory = params.category;
  const isAll = params.all === "true" || params.all === "1";

  const category = (
    rawCategory && EMAIL_CATEGORIES.includes(rawCategory as EmailCategory)
      ? rawCategory
      : undefined
  ) as EmailCategory | undefined;

  return (
    <main className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block" aria-label="Voltar para a página inicial do PethCoach">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Peth<span className="text-primary">Coach</span>
            </span>
          </Link>
          <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
            Preferências de Comunicação
          </p>
        </div>

        {/* Unsubscribe Card */}
        <Card className="p-6 sm:p-8 shadow-card border-border/80">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <PethMascot mood="thinking" size={56} className="shrink-0" />
              <span className="absolute -bottom-1 -right-1 p-1 bg-destructive/10 text-destructive rounded-full">
                <MailX className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">
                Cancelar Recebimento
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Respeitamos sua decisão sem burocracia ou culpa.
              </p>
            </div>
          </div>

          {token ? (
            <Suspense fallback={<div className="text-xs text-muted-foreground py-4">Carregando...</div>}>
              <UnsubscribeForm token={token} category={category} all={isAll} />
            </Suspense>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed">
                <p className="font-semibold text-sm mb-1">Link de cancelamento não identificado</p>
                <p>
                  Para gerenciar seus e-mails sem um link direto, você pode acessar as preferências na aba de configurações da sua conta PethCoach.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button asChild variant="default" className="min-h-12 w-full justify-center text-sm font-medium">
                  <Link href="/entrar">Entrar na Minha Conta</Link>
                </Button>
                <Button asChild variant="outline" className="min-h-11 w-full justify-center text-xs">
                  <Link href="/">Voltar à Página Inicial</Link>
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Privacy Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground text-center">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          <span>
            Seus dados estão protegidos conforme a LGPD.{" "}
            <Link href="/politica-de-privacidade" className="underline hover:text-foreground">
              Política de Privacidade
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}
