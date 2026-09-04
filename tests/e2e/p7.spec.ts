import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("P7 plan view displays 1-3 tasks, visible duration and meets WCAG AA at 360px", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/dev/plano-treino");
  if (process.env.E2E_PRODUCTION === "1") {
    expect(response?.status()).toBe(404);
    return;
  }

  // Heading & Badge
  await expect(
    page.getByRole("heading", { name: "Plano de Treino Estruturado" }),
  ).toBeVisible();
  await expect(page.getByText("Catálogo Aprovado")).toBeVisible();

  // 1-3 tasks on Day 1
  await expect(
    page.getByRole("heading", { name: "Pausa tranquila antes da porta" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atenção voluntária e guia frouxa" }),
  ).toBeVisible();

  // Daily duration is visible
  await expect(page.getByText(/Duração estimada para o/i)).toBeVisible();
  await expect(page.getByText("7 minutos")).toBeVisible();

  // Stop conditions are visible and clear
  await expect(page.getByText(/Quando pausar:/i).first()).toBeVisible();

  // Responsive: no horizontal overflow at 360px width
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  // WCAG 2.2 AA accessibility check
  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axeResults.violations).toEqual([]);

  // Screenshot artifact
  await page.screenshot({
    path: testInfo.outputPath("p7-plan-view.png"),
    fullPage: true,
  });
});
