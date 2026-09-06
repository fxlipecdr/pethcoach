import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { waitForTransitions } from "./settle";

const assessmentId = "11111111-1111-4111-8111-111111111111";

test("P6 displays observable summary and claim CTA for CONTINUE outcome", async ({
  page,
}) => {
  test.skip(
    process.env.E2E_PRODUCTION === "1",
    "Safety presentation fixtures exist only in development",
  );
  await page.goto(`/resultado/${assessmentId}?fixture=continue`);

  // Verify clear safety outcome
  await expect(
    page.getByRole("heading", {
      name: "Nenhum bloqueio imediato foi identificado",
    }),
  ).toBeVisible();

  // Verify observable summary
  await expect(
    page.getByRole("heading", { name: /O que observamos sobre/i }),
  ).toBeVisible();
  await expect(page.getByText("Pontos positivos observados")).toBeVisible();
  await expect(
    page.getByText("Focos prioritários de manejo e treino positivo"),
  ).toBeVisible();

  // Verify ClaimCard
  await expect(
    page.getByRole("heading", { name: "Salvar este resultado e começar" }),
  ).toBeVisible();
  const claimLink = page.getByRole("link", {
    name: /Salvar avaliação e criar conta/i,
  });
  await expect(claimLink).toBeVisible();
  await expect(claimLink).toHaveAttribute(
    "href",
    `/entrar?next=${encodeURIComponent(`/resultado/${assessmentId}?claim=1`)}`,
  );

  // No horizontal overflow
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  // WCAG A and AA accessibility check
  await waitForTransitions(page);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
});
