import type { Metadata } from "next";
import Link from "next/link";
import {
  LegalDocument,
  LegalSection,
} from "@/components/pethcoach/legal-document";
import {
  contato,
  controlador,
  encarregado,
  operadores,
} from "@/content/legal";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o PethCoach trata os dados pessoais de tutores, com base na Lei Geral de Proteção de Dados.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      titulo="Política de Privacidade"
      resumo="Esta política explica quais dados coletamos, por quê, por quanto tempo guardamos e como você exerce seus direitos. Está escrita para ser entendida sem intérprete."
    >
      <LegalSection numero={1} titulo="Quem é responsável pelos seus dados">
        <p>
          O controlador dos dados é <strong>{controlador.razaoSocial}</strong>{" "}
          ({controlador.naturezaJuridica}), inscrito no CNPJ{" "}
          {controlador.cnpj}, com endereço na{" "}
          {controlador.endereco.logradouro}, {controlador.endereco.bairro},{" "}
          {controlador.endereco.cidade}/{controlador.endereco.uf}, CEP{" "}
          {controlador.endereco.cep}. O produto é operado sob o nome{" "}
          {controlador.nomeFantasia}.
        </p>
        <p>
          O <strong>encarregado pelo tratamento de dados</strong>, previsto no
          artigo 41 da LGPD, é {encarregado.nomes}. Você fala com ele pelo
          e-mail <strong>{encarregado.email}</strong>.
        </p>
      </LegalSection>

      <LegalSection numero={2} titulo="Quais dados coletamos e por quê">
        <p>
          Coletamos apenas o necessário para o serviço funcionar. Cada item
          abaixo tem uma finalidade e uma base legal, como exige o artigo 7º da
          LGPD.
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-bold text-foreground">Dado</th>
                <th className="py-2 pr-4 font-bold text-foreground">
                  Para quê
                </th>
                <th className="py-2 font-bold text-foreground">Base legal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top">E-mail</td>
                <td className="py-2 pr-4 align-top">
                  Criar e acessar sua conta pelo link enviado
                </td>
                <td className="py-2 align-top">Execução do contrato</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top">Nome (opcional)</td>
                <td className="py-2 pr-4 align-top">
                  Personalizar o tratamento nas telas e e-mails
                </td>
                <td className="py-2 align-top">Execução do contrato</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top">
                  Dados do seu cão e respostas do questionário
                </td>
                <td className="py-2 pr-4 align-top">
                  Avaliar segurança e montar o plano de treino
                </td>
                <td className="py-2 align-top">Execução do contrato</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top">
                  Progresso e check-ins diários
                </td>
                <td className="py-2 pr-4 align-top">
                  Acompanhar a evolução e adaptar os exercícios
                </td>
                <td className="py-2 align-top">Execução do contrato</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top">Dados de cobrança</td>
                <td className="py-2 pr-4 align-top">
                  Processar pagamento e manter registro fiscal
                </td>
                <td className="py-2 align-top">
                  Contrato e obrigação legal
                </td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4 align-top">
                  Métricas de uso e origem de visita
                </td>
                <td className="py-2 pr-4 align-top">
                  Entender o que funciona no produto
                </td>
                <td className="py-2 align-top">Consentimento</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 align-top">
                  Relatórios técnicos de erro
                </td>
                <td className="py-2 pr-4 align-top">
                  Corrigir falhas do sistema
                </td>
                <td className="py-2 align-top">Legítimo interesse</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          <strong>Não coletamos dado pessoal sensível.</strong> Informações
          sobre comportamento e saúde do seu cão dizem respeito ao animal, não a
          você, e por isso não se enquadram no artigo 5º, II da LGPD.
        </p>
        <p>
          As métricas de uso só existem se você aceitar no aviso de cookies. Se
          recusar, o produto funciona igual — apenas deixamos de medir.
        </p>
      </LegalSection>

      <LegalSection numero={3} titulo="Se você usar o quiz sem ter conta">
        <p>
          É possível responder o questionário antes de criar conta. Nesse caso
          guardamos no seu navegador um identificador aleatório e a etapa em que
          você está, e no nosso banco as respostas e o resultado da triagem,
          protegidos por uma credencial guardada em cookie de acesso restrito.
        </p>
        <p>
          Esses dados <strong>expiram em 7 dias</strong> se você não vincular a
          avaliação a uma conta. Se vincular, passam a seguir as regras da conta.
        </p>
      </LegalSection>

      <LegalSection numero={4} titulo="Por quanto tempo guardamos">
        <ul className="ml-5 list-disc space-y-1">
          <li>Avaliação anônima não vinculada: 7 dias</li>
          <li>Dados da conta, cães, planos e progresso: enquanto a conta existir</li>
          <li>
            Registros de pagamento: mantidos após a exclusão da conta, pelo
            prazo exigido pela legislação fiscal
          </li>
          <li>Relatórios de erro: conforme a retenção do serviço de monitoramento</li>
        </ul>
      </LegalSection>

      <LegalSection numero={5} titulo="Com quem compartilhamos">
        <p>
          Não vendemos dados e não os usamos para publicidade. Compartilhamos
          apenas com fornecedores que executam parte do serviço:
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 font-bold text-foreground">
                  Fornecedor
                </th>
                <th className="py-2 pr-4 font-bold text-foreground">
                  Finalidade
                </th>
                <th className="py-2 font-bold text-foreground">Local</th>
              </tr>
            </thead>
            <tbody>
              {operadores.map((operador) => (
                <tr key={operador.nome} className="border-b border-border/60">
                  <td className="py-2 pr-4 align-top">{operador.nome}</td>
                  <td className="py-2 pr-4 align-top">{operador.finalidade}</td>
                  <td className="py-2 align-top">{operador.local}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <strong>Transferência internacional.</strong> Parte desses
          fornecedores processa dados fora do Brasil. A transferência ocorre
          para permitir a execução do contrato com você e é feita com
          fornecedores que adotam cláusulas contratuais de proteção, conforme o
          artigo 33 da LGPD. Seu banco de dados principal fica no Brasil, na
          região de São Paulo.
        </p>
      </LegalSection>

      <LegalSection numero={6} titulo="Seus direitos e como exercê-los">
        <p>
          O artigo 18 da LGPD garante que você possa confirmar se tratamos seus
          dados, acessá-los, corrigi-los, pedir anonimização ou eliminação,
          solicitar portabilidade, saber com quem compartilhamos e revogar o
          consentimento.
        </p>
        <p>
          Duas dessas coisas você faz sozinho, sem pedir nada a ninguém, na
          página <Link href="/app/conta" className="text-primary-strong underline underline-offset-4">Minha conta</Link>:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Baixar seus dados</strong> em arquivo JSON, com perfil,
            cães, avaliações, planos, progresso e preferências
          </li>
          <li>
            <strong>Excluir sua conta</strong>, o que apaga seu nome, os perfis
            dos cães, avaliações, planos, check-ins e preferências
          </li>
        </ul>
        <p>
          Na exclusão, os registros de pagamentos já realizados são mantidos por
          obrigação fiscal, com base no artigo 16, II da LGPD. Eles deixam de
          estar ligados ao seu nome ou ao seu e-mail.
        </p>
        <p>
          Para qualquer outro pedido, escreva para{" "}
          <strong>{contato.email}</strong>. {contato.descricao}
        </p>
      </LegalSection>

      <LegalSection numero={7} titulo="Cookies e armazenamento no navegador">
        <p>
          Usamos o mínimo. São necessários para o serviço: o cookie de sessão,
          que mantém você conectado, e o do questionário anônimo. Só existem com
          o seu aceite: as métricas de uso e o pixel de medição de anúncios da
          Meta.
        </p>
        <p>
          Se você recusar, o pixel não é carregado e nenhuma informação sua é
          enviada à Meta — nem no navegador, nem depois de uma compra.
        </p>
        <p>
          Você muda sua escolha a qualquer momento pelo link{" "}
          <strong>Preferências de cookies</strong>, no rodapé de todas as
          páginas.
        </p>
      </LegalSection>

      <LegalSection numero={8} titulo="Segurança">
        <p>
          O acesso aos dados é isolado por tutor no próprio banco de dados, de
          modo que uma conta não alcança o conteúdo de outra. O tráfego é
          cifrado, os segredos ficam fora do código, e os relatórios de erro
          removem informação pessoal antes do envio.
        </p>
        <p>
          Nenhum sistema é imune. Se houver incidente com risco relevante aos
          seus direitos, comunicaremos você e a Autoridade Nacional de Proteção
          de Dados, como determina o artigo 48 da LGPD.
        </p>
      </LegalSection>

      <LegalSection numero={9} titulo="Menores de idade">
        <p>
          O serviço é destinado a maiores de 18 anos. Não coletamos dados de
          crianças e adolescentes de forma consciente. Se identificarmos conta
          criada por menor, ela será encerrada e os dados eliminados.
        </p>
      </LegalSection>

      <LegalSection numero={10} titulo="Mudanças nesta política">
        <p>
          Se mudarmos algo relevante, avisaremos por e-mail antes de a mudança
          valer. A data no topo indica a última revisão.
        </p>
        <p>
          Você também pode reclamar à Autoridade Nacional de Proteção de Dados
          se entender que seus direitos não foram atendidos.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
