import { prazoArrependimentoDias } from "@/content/legal";

/**
 * Dúvidas da página de ajuda.
 *
 * Estas respostas descreviam um produto que ainda não vendia: diziam que não
 * havia quiz, plano nem cobrança. Depois que o checkout entrou no ar, cada uma
 * delas passou a ser falsa — e a contradizer a página de planos, que mostra
 * preço. Texto que desmente o próprio produto custa venda e credibilidade.
 */
export const faqs = [
  {
    question: "Como funciona, na prática?",
    answer:
      "Você escolhe o que está acontecendo com seu cão, responde um questionário curto sobre situações observáveis e recebe um plano de 14 dias. São de um a três exercícios por dia, cada um com duração visível e critério de parada. O Dia 1 é gratuito e não pede cartão.",
  },
  {
    question: "Preciso ter experiência com treinamento?",
    answer:
      "Não. Cada exercício traz o que preparar antes, os passos em ordem, como saber que deu certo e quando parar. A ideia é que o próximo passo seja sempre claro, mesmo para quem nunca treinou um cão.",
  },
  {
    question: "Quanto tempo por dia isso toma?",
    answer:
      "De dois a sete minutos por exercício. A duração aparece antes de você começar, para você decidir se cabe no dia de hoje. Dia difícil não vira culpa nem recomeço do zero: o check-in registra como foi e o plano ajusta o ritmo.",
  },
  {
    question: "O PethCoach substitui um veterinário?",
    answer:
      "Não. Não fazemos diagnóstico, não prescrevemos tratamento nem medicação e não prometemos resultado. Existe uma triagem de segurança que roda antes de qualquer exercício: diante de mordida com ferimento, sinal de dor, sofrimento intenso ou mudança súbita de comportamento, o produto interrompe as sugestões de treino e orienta procurar um médico-veterinário.",
  },
  {
    question: "Que método de treino vocês usam?",
    answer:
      "Somente métodos baseados em recompensa. Nenhum exercício usa tranco, enforcador, coleira de choque, correção física ou intimidação — é o que a literatura de bem-estar animal sustenta, e não abrimos exceção.",
  },
  {
    question: "Preciso comprar equipamento?",
    answer:
      "Não. Peitoral confortável, guia comum e petiscos pequenos que seu cão goste dão conta de todos os exercícios.",
  },
  {
    question: "E se eu me arrepender da compra?",
    answer:
      `Você tem ${prazoArrependimentoDias} dias corridos para desistir e receber todo o valor de volta, sem precisar justificar, como garante o artigo 49 do Código de Defesa do Consumidor. A assinatura também é cancelável a qualquer momento pela sua conta, sem falar com atendimento, e o acesso continua até o fim do período já pago.`,
  },
  {
    question: "O que vocês fazem com os meus dados?",
    answer:
      "Coletamos o mínimo para o serviço funcionar, e você pode baixar tudo em arquivo ou excluir sua conta sozinho, pela página da conta. Não vendemos dados e não os usamos para publicidade. Os detalhes, com base legal e prazos, estão na Política de Privacidade.",
  },
  {
    question: "Serve para filhote e para cão idoso?",
    answer:
      "Serve, e o questionário pergunta a idade porque a resposta muda o plano. Filhote em fase de socialização e cão idoso ou com limitação física têm limites diferentes, e os exercícios respeitam isso.",
  },
];
