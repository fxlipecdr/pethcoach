import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDocument,
  LegalSection,
} from "@/components/pethcoach/legal-document";
import {
  contato,
  controlador,
  prazoArrependimentoDias,
} from "@/content/legal";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "As regras do serviço PethCoach: o que ele faz, o que não faz, como cancelar e como pedir reembolso.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      titulo="Termos de Uso"
      resumo="As regras da nossa relação. O ponto mais importante está logo no começo, porque envolve a segurança do seu cão."
    >
      <LegalSection numero={1} titulo="O que o PethCoach não é">
        <p>
          <strong>
            O PethCoach não é serviço veterinário e não substitui a avaliação de
            um profissional.
          </strong>{" "}
          Não fazemos diagnóstico, não prescrevemos tratamento nem medicação,
          não damos prognóstico e não prometemos resultado.
        </p>
        <p>
          O que oferecemos é orientação comportamental educativa, baseada
          exclusivamente em métodos de recompensa, para você praticar com seu
          cão no dia a dia.
        </p>
        <p>
          <strong>Procure um médico-veterinário imediatamente</strong> se houver
          mordida com ferimento, mudança súbita de comportamento, sinal de dor,
          sofrimento intenso, tentativa de fuga ou autolesão. Nessas situações o
          próprio produto interrompe as sugestões de treino e orienta o
          encaminhamento — mas não espere pelo sistema se você já percebeu o
          sinal.
        </p>
        <p>
          Você é responsável pela supervisão do seu cão, pela segurança das
          pessoas ao redor e pela decisão de aplicar ou não qualquer exercício
          sugerido.
        </p>
      </LegalSection>

      <LegalSection numero={2} titulo="Quem somos">
        <p>
          O serviço é oferecido por <strong>{controlador.razaoSocial}</strong>,
          CNPJ {controlador.cnpj}, com endereço na{" "}
          {controlador.endereco.logradouro}, {controlador.endereco.bairro},{" "}
          {controlador.endereco.cidade}/{controlador.endereco.uf}, CEP{" "}
          {controlador.endereco.cep}.
        </p>
        <p>
          Atendimento por <strong>{contato.email}</strong> e{" "}
          <strong>{contato.telefone}</strong>. {contato.descricao}
        </p>
      </LegalSection>

      <LegalSection numero={3} titulo="Quem pode usar">
        <p>
          É preciso ter 18 anos ou mais e fornecer um e-mail válido, que é como
          você acessa a conta. Você responde pelo que acontece na sua conta e
          deve nos avisar se suspeitar de uso indevido.
        </p>
      </LegalSection>

      <LegalSection numero={4} titulo="Como funciona o acesso">
        <p>
          O primeiro dia de treino é gratuito. O acesso aos demais dias depende
          de compra do programa completo ou de assinatura ativa, conforme os
          planos apresentados no momento da contratação.
        </p>
        <p>
          Os valores, a periodicidade e a forma de pagamento aparecem antes de
          você confirmar. O pagamento é processado pela Stripe; não guardamos o
          número do seu cartão.
        </p>
      </LegalSection>

      <LegalSection numero={5} titulo="Arrependimento: 7 dias para desistir">
        <p>
          Como a contratação acontece pela internet, o artigo 49 do Código de
          Defesa do Consumidor garante que você pode{" "}
          <strong>
            desistir em até {prazoArrependimentoDias} dias corridos
          </strong>{" "}
          contados da compra, <strong>sem precisar justificar</strong>, com
          devolução integral do valor pago.
        </p>
        <p>
          Para exercer, basta escrever para <strong>{contato.email}</strong>{" "}
          dentro do prazo, informando o e-mail da conta. Confirmamos o pedido e
          solicitamos o estorno pelo mesmo meio de pagamento. O prazo de crédito
          efetivo depende da operadora do cartão.
        </p>
      </LegalSection>

      <LegalSection numero={6} titulo="Cancelamento da assinatura">
        <p>
          Você cancela quando quiser, pelo portal de gestão acessível em{" "}
          <Link
            href="/app/conta"
            className="text-primary-strong underline underline-offset-4"
          >
            Minha conta
          </Link>
          , sem precisar falar com atendimento.
        </p>
        <p>
          O cancelamento encerra as cobranças futuras e{" "}
          <strong>o acesso continua até o fim do período já pago</strong> — você
          não perde o que contratou. Passado o prazo de arrependimento, não há
          devolução proporcional do período em curso.
        </p>
      </LegalSection>

      <LegalSection numero={7} titulo="Uso aceitável">
        <p>Ao usar o serviço, você se compromete a não:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            compartilhar sua conta ou revender o acesso a terceiros
          </li>
          <li>
            reproduzir ou redistribuir o conteúdo dos programas fora do seu uso
            pessoal
          </li>
          <li>
            tentar burlar o controle de acesso, sondar falhas ou sobrecarregar o
            sistema
          </li>
          <li>
            usar o serviço para orientar terceiros de forma profissional sem
            habilitação para isso
          </li>
        </ul>
        <p>
          Podemos suspender conta que descumpra estas regras, com aviso, salvo
          quando houver risco imediato.
        </p>
      </LegalSection>

      <LegalSection numero={8} titulo="Conteúdo e propriedade">
        <p>
          Os textos, exercícios, ilustrações e a marca PethCoach pertencem ao
          controlador. Sua compra dá direito de uso pessoal do conteúdo,
          enquanto o acesso estiver ativo.
        </p>
        <p>
          O que você registra — dados do seu cão, respostas e check-ins —
          continua sendo seu. Nós apenas os tratamos para prestar o serviço,
          como descrito na{" "}
          <Link
            href="/privacidade"
            className="text-primary-strong underline underline-offset-4"
          >
            Política de Privacidade
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection numero={9} titulo="Disponibilidade e mudanças">
        <p>
          Buscamos manter o serviço disponível, mas ele pode ficar fora do ar
          para manutenção ou por falha de fornecedor. O conteúdo dos programas
          pode ser revisado e melhorado ao longo do tempo.
        </p>
        <p>
          Se alterarmos estes termos de forma relevante, avisaremos por e-mail
          antes de a mudança valer. Se você não concordar, pode encerrar a
          assinatura.
        </p>
      </LegalSection>

      <LegalSection numero={10} titulo="Limites de responsabilidade">
        <p>
          O serviço oferece orientação educativa. A aplicação dos exercícios
          acontece sob sua supervisão, no ambiente e nas condições que só você
          conhece. Não respondemos por consequências de aplicação em desacordo
          com as instruções e os critérios de parada de cada exercício, nem por
          situações que exigiam avaliação veterinária e não foram levadas a um
          profissional.
        </p>
        <p>
          Nada nestes termos afasta direitos que o Código de Defesa do
          Consumidor garante a você.
        </p>
      </LegalSection>

      <LegalSection numero={11} titulo="Foro e lei aplicável">
        <p>
          Aplica-se a legislação brasileira. Fica eleito o foro do domicílio do
          consumidor para resolver questões decorrentes destes termos.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
