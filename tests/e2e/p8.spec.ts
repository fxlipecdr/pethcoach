import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForTransitions } from "./settle";

test("P8 - Day 1 is free, Day 2 is locked without entitlement, and check-in UI operates correctly", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/dev/plano-treino");
  if (process.env.E2E_PRODUCTION === "1") {
    expect(response?.status()).toBe(404);
    return;
  }

  // Verify Day 1 is selected and unlocked
  await expect(page.getByRole("heading", { name: "Plano de Treino Estruturado" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pausa tranquila antes da porta" })).toBeVisible();

  // Click Day 2 tab (should be locked without entitlement)
  const day2Tab = page.getByRole("tab", { name: /Dia 2/i });
  await expect(day2Tab).toBeVisible();
  await day2Tab.click();

  // Verify locked upgrade card
  await expect(page.getByText(/Dia 2 faz parte do Plano Completo/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Desbloqueie todos os 14 dias de treino" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Conhecer o programa completo" })).toBeVisible();

  // Accessibility check on locked view
  await waitForTransitions(page);
  const lockedAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(lockedAxe.violations).toEqual([]);

  // Return to Day 1
  await page.getByRole("button", { name: "Voltar para o Dia 1 (Grátis)" }).click();
  await expect(page.getByRole("heading", { name: "Pausa tranquila antes da porta" })).toBeVisible();

  // Complete tasks to trigger check-in card
  const completeButtons = page.getByRole("button", { name: "Concluir exercício" });
  await completeButtons.first().click();
  await completeButtons.first().click();

  // Verify Daily Check-in card appeared
  await expect(page.getByRole("heading", { name: /Como foi o treino do Dia 1\?/i })).toBeVisible();
  await expect(page.getByText("Precisamos pausar")).toBeVisible();
  await expect(page.getByText("Tranquilo e focado")).toBeVisible();

  // Select "Precisamos pausar" (reward-based, mindful management)
  await page.getByText("Precisamos pausar").click();
  await expect(page.getByText("Pausar também é aprender!")).toBeVisible();

  // Fill optional notes
  await page.locator("#checkin-notes").fill("Rex foi muito bem, pausamos no momento certo.");

  // Check-in submit button is present and clickable
  const submitCheckinButton = page.getByRole("button", {
    name: "Concluir check-in do Dia 1",
  });
  await expect(submitCheckinButton).toBeVisible();
  await submitCheckinButton.click();
  await expect(page.getByText(/CHECK-IN DO DIA CONCLUÍDO/i)).toBeVisible();

  // Responsive: no horizontal overflow at 360px width
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  // WCAG check on check-in state
  await waitForTransitions(page);
  const checkinAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(checkinAxe.violations).toEqual([]);

  // Screenshot artifact
  await page.screenshot({
    path: testInfo.outputPath("p8-training-checkin.png"),
    fullPage: true,
  });
});

test("P8 - Day 2 is fully unlocked when user has active entitlement", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/dev/plano-treino?entitlement=1");
  if (process.env.E2E_PRODUCTION === "1") {
    expect(response?.status()).toBe(404);
    return;
  }

  // Click Day 2 tab
  const day2Tab = page.getByRole("tab", { name: /Dia 2/i });
  await expect(day2Tab).toBeVisible();
  await day2Tab.click();

  // Should NOT show locked card
  await expect(page.getByText("Desbloqueie todos os 14 dias de treino")).not.toBeVisible();

  // Should show Day 2 task
  await expect(page.getByRole("heading", { name: "Manejo calmo de distância" })).toBeVisible();
  await expect(page.getByText("5 minutos")).toBeVisible();

  // Screenshot artifact
  await page.screenshot({
    path: testInfo.outputPath("p8-unlocked-day2.png"),
    fullPage: true,
  });
});
