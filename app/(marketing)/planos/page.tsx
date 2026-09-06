import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { SectionHeader, Sticker } from "@/components/pethcoach/playground";
import { Bone, Paw, Spark } from "@/components/pethcoach/doodles";
import { resolvePublicPlanPrices } from "@/features/billing/pricing";
import { BILLING_PLANS_CATALOG } from "@/features/billing/contracts";
import { contato, prazoArrependimentoDias } from "@/content/legal";

export const metadata: Metadata = {
  title: "Planos e preços",
  description:
    "Quanto custa o PethCoach: o primeiro dia de treino é gratuito e você escolhe entre pagamento único ou assinatura. Sete dias para desistir, sem justificar.",
};

/**
 * Vitrine pública de preços.
 *
 * Existe por três motivos que se sobrepõem: o Código de Defesa do Consumidor
 * exige preço claro e ostensivo antes da contratação; quem chega por anúncio
 * não deve precisar criar conta para descobrir quanto custa; e a análise de
 * conta do Stripe abre o site para confirmar o que é vendido e por quanto.
 *
 * O valor vem do Stripe, não daqui — é ele quem cobra.
 */
export const revalidate = 300;

export default async function PlansPage() {
  const precos = await resolvePublicPlanPrices();
  const planos = BILLING_PLANS_CATALOG.filter(
    (plano) => precos[plano.id].live || plano.id !== "annual",
  );

  return (
    <div className="page-width py-12 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <Sticker tone="lime" icon={<Spark tone="coral" size={16} />}>
          Primeiro dia grátis
        </Sticker>
        <h1 className="display-heading mt-6">
          Quanto custa treinar
          <br />
          <span className="marker-underline">com calma.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          O primeiro dia de treino é gratuito e não pede cartão. Se fizer
          sentido para vocês, você escolhe como continuar.
        </p>
      </div>

      <div
        className={`mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-5 ${
          planos.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {planos.map((plano) => {
          const preco = precos[plano.id];
          const destaque = plano.id === "single_program";
          const comparavel = plano.comparesTo
            ? planos.some((outro) => outro.id === plano.comparesTo)
            : true;
          const beneficios = comparavel
            ? [...(plano.comparativeFeatures ?? []), ...plano.features]
            : plano.features;

          return (
            <Card
              key={plano.id}
              className={`flex flex-col justify-between p-6 ${
                destaque
                  ? "border-2 border-primary bg-secondary/20 shadow-soft ring-1 ring-primary/20"
                  : "border border-border"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {plano.title}
                  </h2>
                  {destaque ? <Badge>Mais escolhido</Badge> : null}
                  {!destaque && plano.badge && comparavel ? (
                    <Badge>{plano.badge}</Badge>
                  ) : null}
                </div>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold tracking-tight text-foreground">
                    {preco.priceFormatted}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {preco.period}
                  </span>
                </p>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {plano.description}
                </p>

                <ul className="mt-6 space-y-2.5">
                  {beneficios.map((beneficio) => (
                    <li
                      key={beneficio}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-primary-strong"
                        aria-hidden="true"
                      />
                      {beneficio}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-7 border-t border-border/60 pt-5">
                <Button
                  asChild
                  className="w-full"
                  variant={destaque ? "default" : "outline"}
                >
                  <Link href="/entrar">Começar pelo dia grátis</Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-muted-foreground">
        Pagamento processado pela Stripe. Não guardamos o número do seu cartão.
        A assinatura é cancelável a qualquer momento pela sua conta, e o acesso
        continua até o fim do período já pago.
      </p>

      <Card className="mx-auto mt-14 max-w-3xl border-2 border-mint/60 bg-secondary/20 p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-control bg-card">
            <ShieldCheck
              className="size-5 text-primary-strong"
              aria-hidden="true"
            />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              {prazoArrependimentoDias} dias para desistir, sem justificar
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Como a compra é feita pela internet, o artigo 49 do Código de
              Defesa do Consumidor garante que você pode desistir em até{" "}
              {prazoArrependimentoDias} dias corridos e receber{" "}
              <strong>todo o valor de volta</strong>. Basta escrever para{" "}
              <strong>{contato.email}</strong> dentro do prazo.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Não pedimos motivo, não oferecemos desconto para você ficar e não
              dificultamos o cancelamento.
            </p>
          </div>
        </div>
      </Card>

      <div className="mx-auto mt-16 max-w-3xl">
        <SectionHeader
          eyebrow="Antes de decidir"
          title="O que o PethCoach não é"
          description="A parte mais importante de contratar qualquer coisa é saber o que ela não faz."
        />
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <Card className="border border-border p-5">
            <Paw tone="coral" size={22} />
            <h3 className="mt-3 font-display text-base font-bold text-foreground">
              Não é serviço veterinário
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Não fazemos diagnóstico, não prescrevemos tratamento e não
              prometemos resultado. Diante de mordida com ferimento, sinal de
              dor ou mudança súbita de comportamento, o produto interrompe as
              sugestões e orienta procurar um médico-veterinário.
            </p>
          </Card>
          <Card className="border border-border p-5">
            <Bone tone="mint" size={22} />
            <h3 className="mt-3 font-display text-base font-bold text-foreground">
              Não usa métodos aversivos
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Nada de trancos, enforcador, choque ou correção física. Toda a
              orientação é baseada em recompensa — é o que a literatura
              veterinária comportamental recomenda, e é o único método que
              ensinamos.
            </p>
          </Card>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-3xl text-center">
        <p className="text-sm text-muted-foreground">
          Dúvidas sobre cobrança ou cancelamento? Escreva para{" "}
          <strong>{contato.email}</strong> ou consulte os{" "}
          <Link
            href="/termos"
            className="text-primary-strong underline underline-offset-4"
          >
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            className="text-primary-strong underline underline-offset-4"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
