import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { waitForTransitions } from "./settle";

const assessmentId = "11111111-1111-4111-8111-111111111111";

test("P5 replaces the result funnel with deterministic referral guidance", async ({
  page,
}) => {
  test.skip(
    process.env.E2E_PRODUCTION === "1",
    "Safety presentation fixtures exist only in development",
  );
  await page.goto(`/resultado/${assessmentId}?fixture=refer`);
  await expect(
    page.getByRole("heading", { name: "Procure avaliação antes de continuar" }),
  ).toBeVisible();
  await expect(page.getByText(/avaliação veterinária deve vir antes/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Ver limites e como buscar ajuda" }),
  ).toHaveAttribute("href", "/ajuda");
  await expect(
    page
      .getByRole("main")
      .locator('a[href*="checkout"], a[href*="entrar"]'),
  ).toHaveCount(0);
  await waitForTransitions(page);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});

test("P5 gives BLOCK precedence with immediate safety actions", async ({
  page,
}) => {
  test.skip(
    process.env.E2E_PRODUCTION === "1",
    "Safety presentation fixtures exist only in development",
  );
  await page.goto(`/resultado/${assessmentId}?fixture=block`);
  await expect(
    page.getByRole("heading", { name: "Interrompa esta jornada por enquanto" }),
  ).toBeVisible();
  await expect(page.getByText(/distância, barreiras físicas e supervisão/i)).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
