import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForTransitions } from "./settle";

test("P2 dog form validates, preserves fields and stays accessible at 360px", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/dev/perfil-cao");
  if (process.env.E2E_PRODUCTION === "1") {
    expect(response?.status()).toBe(404);
    return;
  }
  await page.getByRole("button", { name: "Validar prévia" }).click();
  await expect(
    page.getByText("Informe o nome do cão.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Nome do cão")).toBeFocused();
  await page.getByLabel("Nome do cão").fill("Mel");
  await page.getByLabel("É castrado?").selectOption("no");
  await page.getByLabel("Porte", { exact: true }).selectOption("small");
  await page.getByRole("button", { name: "Validar prévia" }).click();
  await expect(
    page.getByText("Campos validados nesta prévia. Nenhum dado foi salvo."),
  ).toBeVisible();
  await expect(page.getByLabel("Nome do cão")).toHaveValue("Mel");
  await expect(page.getByLabel("É castrado?")).toHaveValue("no");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await waitForTransitions(page);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("dog-profile.png"),
    fullPage: true,
  });
  await page.goto("/app/caes/novo?preview=true");
  await expect(page).toHaveURL(/\/entrar\?next=/);
});

test("invalid callbacks fail closed without external redirects or cached sessions", async ({
  page,
  request,
}) => {
  const response = await request.get(
    "/auth/callback?code=forged&next=https://evil.test",
    { maxRedirects: 0 },
  );
  expect(response.status()).toBe(303);
  expect(response.headers()["location"]).toBe("/entrar?error=link&next=%2Fapp");
  expect(response.headers()["cache-control"]).toContain("no-store");
  await page.goto(response.headers()["location"]!);
  await expect(
    page.getByText("Não conseguimos confirmar o acesso", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Receber link de acesso" }),
  ).toBeDisabled();
});

test("login preserves a valid anonymous draft across navigation and rejects tampered redirect", async ({
  page,
}) => {
  await page.goto("/entrar");
  const context = {
    version: 1,
    anonymousId: "11111111-1111-4111-8111-111111111111",
    updatedAt: Date.now(),
    problem: "filhote-mordendo",
  };
  await page.evaluate(
    (value) =>
      localStorage.setItem(
        "pethcoach:anonymous-context:v1",
        JSON.stringify(value),
      ),
    context,
  );
  await page.goto("/entrar?next=//evil.test");
  await expect(
    page.getByText(/Sua etapa anterior permanece salva/),
  ).toBeVisible();
  await expect(page.locator('input[name="next"]')).toHaveValue("/app");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("pethcoach:anonymous-context:v1")!),
    ),
  ).toEqual(context);
});
