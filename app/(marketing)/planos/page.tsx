import type { Metadata } from "next";
import Link from "next/link";
import { Check, ShieldCheck, Sparkles } from "lucide-react";
import { Badge, Card, Disclosure } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { SectionHeader, Sticker } from "@/components/pethcoach/playground";
import { Bone, Paw, Spark } from "@/components/pethcoach/doodles";
import { resolvePublicPlanPrices } from "@/features/billing/pricing";
import { BILLING_PLANS_CATALOG } from "@/features/billing/contracts";
import { problems } from "@/content/problems";
import { contato, prazoArrependimentoDias } from "@/content/legal";

export const metadata: Metadata = {
  title: "Planos e preços",
  description:
    "Quanto custa o PethCoach: o primeiro dia de treino é gratuito e você escolhe entre pagamento único ou assinatura. Sete dias para desistir, sem justificar.",
};

/**
 * Vitrine pública de preços.
 *
 * Três exigências se sobrepõem aqui: o Código de Defesa do Consumidor pede
 * preço claro e ostensivo antes da contratação; quem chega por anúncio não
 * deve precisar criar conta para descobrir quanto custa; e a análise de conta
 * do Stripe abre o site para confirmar o que é vendido e por quanto.
 *
 * Sobre persuasão: não há depoimento nesta página, porque não há cliente para
 * depor ainda, e inventar seria fraude. O que existe de verdade — e convence
 * mais — é a comparação honesta de preço com adestrador e a evidência por trás
 * dos exercícios. Sem contador regressivo, sem "restam 3 vagas", sem preço
 * riscado que nunca foi cobrado.
 */
export const revalidate = 300;

/**
 * Referência de mercado, de pesquisa pública de preços de adestramento no
 * Brasil: aula avulsa entre R$ 80 e R$ 200, pacotes de cinco aulas entre
 * R$ 600 e R$ 900. Serve de âncora honesta — é o custo real da alternativa,
 * não um preço inflado inventado para parecer desconto.
 */
const referenciaAdestrador = {
  aula: "R$ 80 a R$ 200",
  pacote: "R$ 600 a R$ 900",
};

const comoFunciona = [
  {
    titulo: "Responda sobre o seu cão",
    texto:
      "Um questionário curto sobre o que acontece, quando acontece e o que você já tentou. Leva poucos minutos.",
  },
  {
    titulo: "Receba o plano de 14 dias",
    texto:
      "Um a três exercícios por dia, com duração visível e critério de parada. Nada de lista infinita.",
  },
  {
    titulo: "Ajuste conforme a rotina",
    texto:
      "O check-in diário registra como foi e adapta o ritmo. Dia difícil não vira culpa nem recomeço do zero.",
  },
];

const duvidas = [
  {
    pergunta: "E se não funcionar para o meu cão?",
    resposta:
      `Você tem ${prazoArrependimentoDias} dias para desistir e receber todo o valor de volta, sem precisar explicar o motivo. Basta escrever para ${contato.email}. Não pedimos justificativa nem oferecemos desconto para você ficar.`,
  },
  {
    pergunta: "Preciso de equipamento especial?",
    resposta:
      "Não. Peitoral confortável, guia comum e petiscos pequenos que seu cão goste. Nenhum exercício usa enforcador, coleira de choque ou qualquer equipamento aversivo.",
  },
  {
    pergunta: "Quanto tempo por dia isso toma?",
    resposta:
      "De dois a sete minutos por exercício, com um a três exercícios por dia. A duração aparece antes de você começar, para você decidir se cabe hoje.",
  },
  {
    pergunta: "Serve para filhote e para cão adulto?",
    resposta:
      "Sim, e o questionário pergunta a idade justamente porque a resposta muda o plano. Filhote em fase de socialização e cão idoso têm limites diferentes.",
  },
  {
    pergunta: "E se o problema for mais sério do que eu imagino?",
    resposta:
      "O questionário tem uma triagem de segurança que roda antes de qualquer exercício. Diante de sinais como mordida com ferimento, sofrimento intenso ou mudança súbita de comportamento, o produto interrompe as sugestões de treino e orienta procurar um médico-veterinário. Isso não é opcional nem contornável.",
  },
  {
    pergunta: "A assinatura prende em fidelidade?",
    resposta:
      "Não. Você cancela sozinho pela sua conta, sem falar com atendimento, e o acesso continua até o fim do período já pago.",
  },
];

export default async function PlansPage() {
  const precos = await resolvePublicPlanPrices();
  const planos = BILLING_PLANS_CATALOG.filter(
    (plano) => precos[plano.id].live || plano.id !== "annual",
  );

  return (
    <div className="page-width py-12 md:py-20">
      {/* ------------------------------------------------------------ topo */}
      <div className="mx-auto max-w-3xl text-center">
        <Sticker tone="lime" icon={<Spark tone="coral" size={16} />}>
          Primeiro dia grátis, sem cartão
        </Sticker>
        <h1 className="display-heading mt-6">
          Quanto custa treinar
          <br />
          <span className="marker-underline">com calma.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Um adestrador cobra {referenciaAdestrador.aula} por aula, e pacotes
          costumam ficar entre {referenciaAdestrador.pacote}. O PethCoach é um
          programa de 14 dias que você faz em casa, no seu ritmo.
        </p>
      </div>

      {/* ----------------------------------------------------------- planos */}
      <div
        className={`mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-5 ${
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
              className={`relative flex flex-col justify-between p-6 sm:p-7 ${
                destaque
                  ? "border-2 border-primary bg-secondary/25 shadow-card ring-1 ring-primary/20"
                  : "border border-border"
              }`}
            >
              {destaque ? (
                <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-pill bg-primary px-3 py-1 text-[11px] font-bold text-primary-foreground">
                  <Sparkles className="size-3" aria-hidden="true" />
                  Sem mensalidade
                </span>
              ) : null}

              <div>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-foreground">
                    {plano.title}
                  </h2>
                  {!destaque && plano.badge && comparavel ? (
                    <Badge>{plano.badge}</Badge>
                  ) : null}
                </div>

                <p className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-bold tracking-tight text-foreground">
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
                <p className="mt-3 text-center text-[11px] text-muted-foreground">
                  O Dia 1 não pede cartão
                </p>
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

      {/* -------------------------------------------------------- garantia */}
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

      {/* --------------------------------------------------- como funciona */}
      <div className="mx-auto mt-16 max-w-4xl">
        <SectionHeader
          eyebrow="Como funciona"
          title="Três passos, e o primeiro é grátis"
        />
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {comoFunciona.map((passo, indice) => (
            <li key={passo.titulo}>
              <Card className="h-full border border-border p-5">
                <span className="font-display text-sm font-bold text-primary-strong">
                  {indice + 1}
                </span>
                <h3 className="mt-2 font-display text-base font-bold text-foreground">
                  {passo.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {passo.texto}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </div>

      {/* ------------------------------------------------------- programas */}
      <div className="mx-auto mt-16 max-w-4xl">
        <SectionHeader
          eyebrow="O que está incluído"
          title="Sete programas, um para cada dor"
          description="Você escolhe o que está acontecendo agora. O plano é montado a partir daí."
        />
        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {problems.map((problema) => (
            <li key={problema.slug}>
              <Link
                href={`/problemas/${problema.slug}`}
                className="lift-card flex items-center gap-3 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <Paw tone="mint" size={20} />
                <span>
                  <span className="block text-sm font-bold text-foreground">
                    {problema.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {problema.label}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* -------------------------------------------------------- o que não é */}
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

      {/* ---------------------------------------------------------- dúvidas */}
      <div className="mx-auto mt-16 max-w-3xl">
        <SectionHeader eyebrow="Dúvidas" title="O que costuma travar a decisão" />
        <div className="mt-7 space-y-3">
          {duvidas.map((duvida) => (
            <Disclosure key={duvida.pergunta} title={duvida.pergunta}>
              {duvida.resposta}
            </Disclosure>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------- fechamento */}
      <div className="mx-auto mt-16 max-w-2xl text-center">
        <h2 className="section-heading">Comece pelo dia que é grátis</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Você responde o questionário, recebe o Dia 1 completo e decide depois
          se faz sentido continuar. Sem cartão para começar.
        </p>
        <Button asChild size="lg" className="mt-7">
          <Link href="/entrar">Começar agora</Link>
        </Button>
        <p className="mt-6 text-xs text-muted-foreground">
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
