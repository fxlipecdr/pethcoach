import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("P13 - Admin preview fixture renders full operational layout and passes accessibility", async ({
  page,
}, testInfo) => {
  await page.goto("/dev/admin");

  await expect(
    page.getByRole("heading", { name: "Gestão de Conteúdo e Operação", level: 1 }),
  ).toBeVisible();

  // Operator session badge
  await expect(page.getByText("Sessão de demonstração (Fixture)")).toBeVisible();

  // Metric status cards
  await expect(page.getByText("Publicados", { exact: true })).toBeVisible();
  await expect(page.getByText("Em Revisão", { exact: true })).toBeVisible();
  await expect(page.getByText("Rascunhos", { exact: true })).toBeVisible();
  await expect(page.getByText("Arquivados", { exact: true })).toBeVisible();

  // Catalog modules preview
  await expect(
    page.getByRole("heading", { name: "Exemplo de Catálogo e Módulos", level: 2 }),
  ).toBeVisible();

  // Audit trail preview
  await expect(
    page.getByRole("heading", { name: "Auditoria de Transições", level: 2 }),
  ).toBeVisible();

  // Zero PII inspector preview
  await expect(
    page.getByRole("heading", { name: "Inspetor Operacional (Zero PII)", level: 2 }),
  ).toBeVisible();

  // WCAG 2.2 AA accessibility test
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
    path: testInfo.outputPath("p13-admin-preview.png"),
    fullPage: true,
  });
});

test("P13 - Unauthenticated visitor is redirected to login for admin routes", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/entrar/);

  await page.goto("/admin/modulos");
  await expect(page).toHaveURL(/\/entrar/);

  await page.goto("/admin/inspector");
  await expect(page).toHaveURL(/\/entrar/);
});
