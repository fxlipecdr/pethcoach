/**
 * Identificação do controlador e canais oficiais.
 *
 * Fonte única para política de privacidade, termos de uso e rodapé. Os dados
 * cadastrais vêm do registro público do CNPJ; alterar aqui só depois de
 * alterar no cadastro, para que os documentos não divirjam do que a Receita
 * publica.
 */
export const controlador = {
  razaoSocial: "68.660.298 Felipe Cordeiro de Paula",
  nomeFantasia: "PethCoach",
  cnpj: "68.660.298/0001-08",
  naturezaJuridica: "Empresário Individual (MEI)",
  endereco: {
    logradouro: "Rua Joaquim Emanoel Igreja, 36",
    bairro: "Centro",
    cidade: "União da Vitória",
    uf: "PR",
    cep: "84600-113",
  },
} as const;

export const contato = {
  email: "suporte@peth.com.br",
  telefone: "(42) 99961-1592",
  /** Mesmo canal para dúvidas, pedidos da LGPD e arrependimento de compra. */
  descricao: "Atendimento em dias úteis, com resposta em até 15 dias.",
} as const;

/** LGPD art. 41: quem responde por pedidos de titular. */
export const encarregado = {
  nomes: "Felipe Cordeiro e Vitória Stokero",
  email: contato.email,
} as const;

/** Operadores que tratam dados em nome do controlador (LGPD art. 5º, VII). */
export const operadores = [
  {
    nome: "Supabase",
    finalidade: "Banco de dados e autenticação",
    local: "Brasil (São Paulo)",
  },
  {
    nome: "Vercel",
    finalidade: "Hospedagem e execução da aplicação",
    local: "Exterior",
  },
  {
    nome: "Stripe",
    finalidade: "Processamento de pagamento e dados de cobrança",
    local: "Exterior",
  },
  {
    nome: "Resend",
    finalidade: "Envio de e-mails transacionais",
    local: "Exterior",
  },
  {
    nome: "Sentry",
    finalidade: "Relatórios técnicos de erro, sem dado pessoal",
    local: "Exterior",
  },
  {
    nome: "PostHog",
    finalidade: "Métricas de uso, somente com seu consentimento",
    local: "Exterior",
  },
] as const;

/** Prazo do art. 49 do CDC para compras feitas fora do estabelecimento. */
export const prazoArrependimentoDias = 7;

export const atualizadoEm = "5 de setembro de 2026";
