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
