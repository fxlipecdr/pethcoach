import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForTransitions } from "./settle";
import { faqs } from "@/content/faq";

test("interactive preview supports keyboard tabs, stage changes and reduced motion", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("tab", { name: "Passeio", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    page.getByRole("tab", { name: "Brincadeira", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByText("Brincar também é aprender.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver etapa Praticar" }).click();
  await expect(
    page.getByRole("heading", { name: "Um passo que cabe no dia." }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("list", { name: "Etapas da prévia" })
      .locator('[aria-current="step"]'),
  ).toContainText("Praticar");
  await page.getByRole("button", { name: "Ver etapa Acompanhar" }).click();
  await expect(
    page.getByRole("heading", { name: "Perceber as pequenas mudanças." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voltar à primeira etapa" }).click();
  await expect(
    page.getByRole("heading", { name: "Primeiro, conhecer vocês." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ver etapa Praticar" }).click();
  await page.getByRole("tab", { name: "Em casa", exact: true }).click();
  await expect(
    page.getByText("Uma casa, uma nova rotina.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Primeiro, conhecer vocês." }),
  ).toBeVisible();
  await waitForTransitions(page);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  expect(errors).toEqual([]);
});

test("responsive navigation keeps focus and closes after navigation", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Abrir menu" });
  if (testInfo.project.name === "desktop") {
    await expect(menu).not.toBeVisible();
    await page
      .getByRole("navigation", { name: "Navegação principal" })
      .getByRole("link", { name: "Dúvidas" })
      .click();
  } else {
    await expect(
      page
        .getByRole("banner")
        .getByRole("link", { name: "Entrar", exact: true }),
    ).not.toBeVisible();
    await menu.click();
    const dialog = page.getByRole("dialog", { name: "Navegação do PethCoach" });
    await expect(dialog).toBeVisible();
    await waitForTransitions(page);
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath("menu-mobile.png") });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await expect(menu).toBeFocused();
    await menu.click();
    await dialog.getByRole("link", { name: "Programas", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page).toHaveURL(/#problemas$/);
    await menu.click();
    await dialog.getByRole("link", { name: "Dúvidas", exact: true }).click();
    await expect(dialog).not.toBeVisible();
  }
  await page.waitForURL("/ajuda");
  // Ancorado na primeira pergunta do catálogo, não no texto dela: o conteúdo
  // das dúvidas muda com o produto, o comportamento do acordeão não.
  const [primeiraDuvida] = faqs;
  if (!primeiraDuvida) throw new Error("Catálogo de dúvidas está vazio.");
  const question = page.getByRole("button", { name: primeiraDuvida.question });
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByText(primeiraDuvida.answer, { exact: false })).toBeVisible();
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "false");
});

test("local toast demonstrates feedback without sending data", async ({
  page,
}) => {
  test.skip(
    process.env.E2E_PRODUCTION === "1",
    "The developer kit is intentionally unavailable in production.",
  );
  await page.goto("/dev/ui-kit");
  await page.getByRole("button", { name: "Testar notificação" }).click();
  await expect(
    page.getByText("Notificação de exemplo", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Demonstração local. Nenhum dado foi enviado.", {
      exact: true,
    }),
  ).toBeVisible();
});
