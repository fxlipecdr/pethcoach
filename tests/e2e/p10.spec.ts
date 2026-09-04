import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("P10 - Checkout success page renders celebrating mascot and direct CTAs", async ({
  page,
}, testInfo) => {
  await page.goto("/checkout/sucesso");

  // Verify Heading & Mascot
  await expect(
    page.getByRole("heading", {
      name: "Tudo pronto! Seu Plano Completo está Liberado",
    }),
  ).toBeVisible();

  await expect(page.getByText("PAGAMENTO CONFIRMADO")).toBeVisible();
  await expect(
    page.getByText(
      "Todos os 14 dias de treino estruturado, check-ins diários e adaptação de ritmo já estão disponíveis na sua conta.",
    ),
  ).toBeVisible();

  // Action Buttons
  const trainingButton = page.getByRole("link", {
    name: /Ir para o Treino de Hoje/i,
  });
  await expect(trainingButton).toBeVisible();
  await expect(trainingButton).toHaveAttribute("href", "/app");

  const accountLink = page.getByRole("link", {
    name: /Ver detalhes da assinatura/i,
  });
  await expect(accountLink).toBeVisible();
  await expect(accountLink).toHaveAttribute("href", "/app/conta");

  // WCAG 2.2 AA compliance check
  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axeResults.violations).toEqual([]);

  // Responsive: no horizontal overflow at 360px
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath("p10-checkout-success.png"),
    fullPage: true,
  });
});

test("P10 - Locked day upgrade card provides clear CTA to complete program", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/dev/plano-treino");
  if (process.env.E2E_PRODUCTION === "1") {
    expect(response?.status()).toBe(404);
    return;
  }

  // Click Day 2 tab
  const day2Tab = page.getByRole("tab", { name: /Dia 2/i });
  await day2Tab.click();

  // Verify upgrade card
  await expect(
    page.getByRole("heading", {
      name: "Desbloqueie todos os 14 dias de treino",
    }),
  ).toBeVisible();

  const upgradeButton = page.getByRole("button", {
    name: "Conhecer o programa completo",
  });
  await expect(upgradeButton).toBeVisible();

  // WCAG check
  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axeResults.violations).toEqual([]);

  await page.screenshot({
    path: testInfo.outputPath("p10-upgrade-card.png"),
    fullPage: true,
  });
});
