import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForTransitions } from "./settle";

test("P12 - Unsubscribe page without token renders fallback guidance and passes accessibility", async ({
  page,
}, testInfo) => {
  await page.goto("/unsubscribe");

  await expect(
    page.getByRole("heading", { name: "Cancelar Recebimento", level: 1 }),
  ).toBeVisible();

  await expect(
    page.getByText("Link de cancelamento não identificado"),
  ).toBeVisible();

  // Button to login exists
  await expect(
    page.getByRole("link", { name: "Entrar na Minha Conta" }),
  ).toBeVisible();

  // WCAG 2.2 AA accessibility test
  await waitForTransitions(page);
  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axeResults.violations).toEqual([]);

  // Responsive: no horizontal overflow
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath("p12-unsubscribe-no-token.png"),
    fullPage: true,
  });
});

test("P12 - Unsubscribe page with valid token and category renders 1-click options", async ({
  page,
}, testInfo) => {
  const dummyToken = "1234567890abcdef1234567890abcdef1234567890";
  await page.goto(
    `/unsubscribe?token=${dummyToken}&category=training_reminders`,
  );

  await expect(
    page.getByRole("heading", { name: "Cancelar Recebimento", level: 1 }),
  ).toBeVisible();

  await expect(
    page.getByText("Lembretes e Rotina de Treino", { exact: true }),
  ).toBeVisible();

  // Buttons for category and all emails
  const unsubCategoryBtn = page.getByRole("button", {
    name: /Cancelar apenas/i,
  });
  const unsubAllBtn = page.getByRole("button", {
    name: /Não receber nenhum e-mail/i,
  });

  await expect(unsubCategoryBtn).toBeVisible();
  await expect(unsubAllBtn).toBeVisible();

  // WCAG 2.2 AA accessibility test
  await waitForTransitions(page);
  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axeResults.violations).toEqual([]);

  // Responsive check
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.screenshot({
    path: testInfo.outputPath("p12-unsubscribe-with-token.png"),
    fullPage: true,
  });
});
