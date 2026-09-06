import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForTransitions } from "./settle";

/**
 * Os documentos legais têm exigências verificáveis. Este teste trava as que
 * a LGPD e o CDC impõem, para que uma edição futura não devolva as páginas ao
 * estado de aviso genérico sem ninguém perceber.
 *
 * Não substitui revisão jurídica: verifica presença, não adequação.
 */
const cnpj = "68.660.298/0001-08";

test("política de privacidade traz o que a LGPD exige", async ({ page }) => {
  await page.goto("/privacidade");
  // O rodapé também identifica o fornecedor; escopo no documento evita casar lá.
  const doc = page.getByRole("article");
  await expect(
    doc.getByRole("heading", { name: "Política de Privacidade", level: 1 }),
  ).toBeVisible();

  // Controlador identificado (art. 9º) e encarregado (art. 41).
  await expect(doc.getByText(cnpj)).toBeVisible();
  await expect(doc.getByText(/encarregado pelo tratamento de dados/i)).toBeVisible();
  await expect(doc.getByText("suporte@peth.com.br").first()).toBeVisible();

  // Finalidades com base legal, retenção, compartilhamento e direitos.
  await expect(
    doc.getByRole("columnheader", { name: "Base legal" }),
  ).toBeVisible();
  await expect(
    doc.getByRole("heading", { name: /Por quanto tempo guardamos/i }),
  ).toBeVisible();
  await expect(doc.getByText(/Transferência internacional/i)).toBeVisible();
  await expect(doc.getByText(/artigo 18 da LGPD/i)).toBeVisible();
  await expect(doc.getByText(/artigo 16, II/i)).toBeVisible();

  await waitForTransitions(page);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("termos trazem escopo, arrependimento e cancelamento", async ({ page }) => {
  await page.goto("/termos");
  const doc = page.getByRole("article");
  await expect(
    doc.getByRole("heading", { name: "Termos de Uso", level: 1 }),
  ).toBeVisible();

  // O limite de escopo é a cláusula de maior consequência e abre o documento.
  await expect(
    doc.getByText(/não é serviço veterinário e não substitui/i),
  ).toBeVisible();
  await expect(doc.getByText(/médico-veterinário imediatamente/i)).toBeVisible();

  // Direito de arrependimento do art. 49 do CDC, com prazo e canal.
  await expect(doc.getByText(/artigo 49 do Código de Defesa do Consumidor/i)).toBeVisible();
  await expect(doc.getByText(/7 dias corridos/i)).toBeVisible();

  // Cancelamento e o que acontece com o acesso já pago.
  await expect(doc.getByText(/acesso continua até o fim do período já pago/i)).toBeVisible();

  // Identificação do fornecedor, exigida para venda à distância.
  await expect(doc.getByText(cnpj)).toBeVisible();

  await waitForTransitions(page);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});

test("rodapé identifica o fornecedor em qualquer página", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("contentinfo").getByText(cnpj)).toBeVisible();
});

test("o site não declara que o produto está em desenvolvimento", async ({
  page,
}) => {
  /**
   * Enquanto o produto não vendia, dizer "em desenvolvimento" era honesto.
   * Depois que a cobrança está no ar, a mesma frase passa a desencorajar a
   * compra de quem chega por anúncio — e diz ao revisor do Stripe que o site
   * não está pronto para vender.
   *
   * A lista cresceu depois de uma varredura que achou nove afirmações
   * envelhecidas em cinco páginas: a home dizia "três situações" mostrando
   * sete, as dúvidas diziam que não havia quiz nem cobrança, e a tela de
   * acesso dizia que planos não estavam disponíveis. Nada disso dá erro de
   * compilação, e o texto envelhece calado.
   */
  const proibidas = [
    /em desenvolvimento/i,
    /programas ainda não estão dispon/i,
    /estamos preparando/i,
    /estamos construindo/i,
    /estamos desenhando/i,
    /próximas fases/i,
    /proposta dos programas/i,
    /cobranças ainda não estão/i,
    /três situações/i,
  ];

  for (const rota of [
    "/",
    "/ajuda",
    "/planos",
    "/privacidade",
    "/termos",
    "/entrar",
    "/problemas/cachorro-late-muito",
  ]) {
    await page.goto(rota);
    const corpo = page.locator("body");
    for (const proibida of proibidas) {
      await expect(corpo, `${rota} contém "${proibida}"`).not.toContainText(
        proibida,
      );
    }
  }

  // A descrição usada em busca e compartilhamento também não pode declarar obra.
  await page.goto("/");
  const descricao = await page
    .locator('meta[name="description"]')
    .getAttribute("content");
  expect(descricao ?? "").not.toMatch(/em desenvolvimento/i);
});

test("a vitrine pública informa preço, garantia e limite de escopo", async ({
  page,
}) => {
  /**
   * Três exigências se sobrepõem nesta página: o CDC pede preço claro antes da
   * contratação, o anúncio precisa que o visitante veja o valor sem criar
   * conta, e a análise de conta do Stripe abre o site para confirmar o que é
   * vendido e por quanto. Nenhuma delas tolera preço atrás de login.
   */
  await page.goto("/planos");
  await expect(
    page.getByRole("heading", { name: /Quanto custa treinar/i, level: 1 }),
  ).toBeVisible();

  // Pelo menos um preço em reais, visível sem autenticação.
  await expect(page.getByText(/R\$\s?\d/).first()).toBeVisible();

  // Direito de arrependimento, com prazo e canal.
  await expect(
    page.getByRole("heading", { name: /7 dias para desistir/i }),
  ).toBeVisible();
  await expect(
    page.getByText(/artigo 49 do Código de Defesa do Consumidor/i),
  ).toBeVisible();

  // O limite de escopo veterinário aparece antes da decisão de compra.
  await expect(
    page.getByRole("heading", { name: /Não é serviço veterinário/i }),
  ).toBeVisible();

  // Caminho para os termos, exigido em venda à distância.
  await expect(page.getByRole("link", { name: "Termos de Uso" })).toBeVisible();

  await waitForTransitions(page);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("a vitrine é alcançável a partir da home", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: "Planos e preços" }),
  ).toBeVisible();
});
