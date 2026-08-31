import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function checkAccessibleLayout(page: Page) {
  await expect(page.getByRole("main", { includeHidden: true })).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
}

test("access layout is focused, accessible and explicit about unavailable signup", async ({
  page,
}, testInfo) => {
  await page.goto("/entrar");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Um lugar para a rotina de vocês",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Nenhum cadastro, e-mail ou pagamento é realizado/),
  ).toBeVisible();
  await expect(page.getByLabel("Seu e-mail")).toBeDisabled();
  await expect(page.getByRole("button", { name: "Receber link de acesso" })).toBeDisabled();
  await checkAccessibleLayout(page);
  await page.screenshot({
    path: testInfo.outputPath("access.png"),
    fullPage: true,
  });
  const action = page.getByRole("link", { name: "Conhecer os programas" });
  await action.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/#problemas$/);
});

test("ChoiceCard and Drawer preserve native keyboard behavior, draft state and focus", async ({
  page,
}, testInfo) => {
  test.skip(
    process.env.E2E_PRODUCTION === "1",
    "These component examples only exist in development.",
  );
  await page.goto("/dev/ui-kit");
  const short = page.getByRole("radio", { name: "Um passo curto por vez" });
  const steady = page.getByRole("radio", { name: "Uma rotina com mais tempo" });
  await short.focus();
  expect(
    await short.evaluate(
      (element) => getComputedStyle(element.parentElement!).outlineStyle,
    ),
  ).toBe("solid");
  await page.keyboard.press("ArrowRight");
  await expect(steady).toBeChecked();
  await page.keyboard.press("ArrowRight");
  await expect(short).toBeChecked();
  await expect(
    page.getByRole("radio", { name: /Opção indisponível/ }),
  ).toBeDisabled();
  const loading = page.getByRole("button", { name: "Carregando exemplo" });
  await expect(loading).toBeDisabled();
  await expect(loading).toHaveAttribute("aria-busy", "true");
  const trigger = page.getByRole("button", { name: "Ajustar exemplo" });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Preferências do exemplo" });
  await expect(drawer).toBeVisible();
  await drawer.getByRole("radio", { name: /Espaçamento compacto/ }).check();
  for (let index = 0; index < 6; index++) {
    await page.keyboard.press("Tab");
    expect(
      await drawer.evaluate((element) =>
        element.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(
    page.getByText("Espaçamento confortável", { exact: true }),
  ).toBeVisible();
  await trigger.click();
  await expect(
    drawer.getByRole("radio", { name: /Espaçamento confortável/ }),
  ).toBeChecked();
  await drawer.getByRole("radio", { name: /Espaçamento compacto/ }).check();
  await checkAccessibleLayout(page);
  await page.screenshot({ path: testInfo.outputPath("drawer.png") });
  await drawer.getByRole("button", { name: "Aplicar ao exemplo" }).click();
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(
    page.getByText("Espaçamento compacto aplicado ao exemplo. Nada foi salvo."),
  ).toBeVisible();
  // Short viewports, such as a phone with the software keyboard open, must scroll the panel.
  const originalViewport = page.viewportSize();
  await page.setViewportSize({ width: 360, height: 480 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await trigger.click();
  await drawer.getByRole("radio", { name: /Espaçamento confortável/ }).check();
  await drawer.getByRole("button", { name: "Aplicar ao exemplo" }).click();
  await expect(drawer).not.toBeVisible();
  await expect(trigger).toBeFocused();
  if (originalViewport) await page.setViewportSize(originalViewport);
});

test("all layout previews are usable in development and closed in production", async ({
  page,
  request,
}, testInfo) => {
  const layouts = [
    { slug: "auth", title: "Um lugar para a rotina de vocês" },
    { slug: "app", title: "A rotina de vocês começa aqui" },
    { slug: "flow", title: "Um foco de cada vez" },
    { slug: "admin", title: "Cuidado também nos bastidores" },
  ];
  for (const layout of layouts) {
    const response = await page.goto(`/dev/layouts/${layout.slug}`);
    if (process.env.E2E_PRODUCTION === "1") {
      expect(response?.status()).toBe(404);
      continue;
    }
    await expect(
      page.getByRole("heading", { level: 1, name: layout.title }),
    ).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Aviso da prévia" }),
    ).toBeVisible();
    await checkAccessibleLayout(page);
    if (layout.slug === "flow") {
      const bounds = await page
        .locator('[data-layout-size="flow"]')
        .boundingBox();
      expect(bounds?.width).toBeLessThanOrEqual(720);
    }
    if (layout.slug === "app" || layout.slug === "admin") {
      const menu = page.getByRole("button", {
        name:
          layout.slug === "app"
            ? "Menu da área pessoal"
            : "Menu administrativo",
      });
      if (testInfo.project.name === "desktop") {
        await expect(menu).not.toBeVisible();
        await expect(
          page.getByRole("complementary", { name: "Barra lateral" }),
        ).toBeVisible();
        await expect(
          page.getByRole("link", { name: "Visão geral" }),
        ).toHaveAttribute("aria-current", "page");
      } else {
        await menu.click();
        await expect(page.getByRole("dialog")).toBeVisible();
        expect(
          (
            await new AxeBuilder({ page })
              .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
              .analyze()
          ).violations,
        ).toEqual([]);
        await page.keyboard.press("Escape");
        await expect(menu).toBeFocused();
      }
    }
    await page.screenshot({
      path: testInfo.outputPath(`layout-${layout.slug}.png`),
      fullPage: true,
    });
  }
  expect((await request.get("/dev/layouts/inexistente")).status()).toBe(404);
  // A presentation preview must not grant access to the actual protected route.
  for (const route of ["/app?preview=true", "/admin?preview=true"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/entrar(?:\?next=.*)?$/);
  }
});
