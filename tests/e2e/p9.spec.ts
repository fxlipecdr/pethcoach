import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("P9 - Timeline and Milestones tab renders correctly with initial badges and adaptations", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/dev/plano-treino");
  if (process.env.E2E_PRODUCTION === "1") {
    expect(response?.status()).toBe(404);
    return;
  }

  // Verify tab switcher exists
  const timelineTab = page.getByRole("tab", { name: /Marcos & Linha do Tempo/i });
  await expect(timelineTab).toBeVisible();
  await timelineTab.click();

  // Milestones section should be visible
  await expect(
    page.getByRole("heading", { name: "Marcos Comportamentais" }),
  ).toBeVisible();
  await expect(page.getByText("Primeiro Passo")).toBeVisible();
  await expect(page.getByText("Pausa Consciente")).toBeVisible();
  await expect(page.getByText("Constância Serena")).toBeVisible();
  await expect(page.getByText("Fundamentos Sólidos")).toBeVisible();
  await expect(page.getByText("Jornada Concluída")).toBeVisible();

  // Fixture adaptation banner should be visible
  await expect(
    page.getByRole("heading", { name: "Cronograma Ajustado para o Bem-estar" }),
  ).toBeVisible();

  // Check WCAG accessibility on Timeline view
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
    path: testInfo.outputPath("p9-timeline-view.png"),
    fullPage: true,
  });
});

test("P9 - Check-in with difficulty perception and milestone unlock", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/dev/plano-treino");
  if (process.env.E2E_PRODUCTION === "1") {
    expect(response?.status()).toBe(404);
    return;
  }

  // Complete Day 1 exercises
  const completeButtons = page.getByRole("button", {
    name: "Concluir exercício",
  });
  await completeButtons.first().click();
  await completeButtons.first().click();

  // Check-in card renders
  await expect(
    page.getByRole("heading", { name: /Como foi o treino do Dia 1\?/i }),
  ).toBeVisible();

  // Select Mood: "Tranquilo e focado"
  await page.getByText("Tranquilo e focado").click();

  // Select Difficulty: "Fácil"
  await page.getByText("Fácil").click();

  // Notes
  await page
    .locator("#checkin-notes")
    .fill("Sessão perfeita, Pipoca estava super focada.");

  // Submit check-in
  await page.getByRole("button", { name: "Concluir check-in do Dia 1" }).click();

  // Check-in concluded card appears
  await expect(page.getByText(/CHECK-IN DO DIA CONCLUÍDO/i)).toBeVisible();
  await expect(page.getByText(/Dificuldade:/i)).toBeVisible();

  // Go to Timeline view to see updated check-in history
  const timelineTab = page.getByRole("tab", { name: /Marcos & Linha do Tempo/i });
  await timelineTab.click();

  // Check-in record is in the session history
  await expect(page.getByText("Pipoca estava super focada.")).toBeVisible();

  // WCAG check
  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axeResults.violations).toEqual([]);

  await page.screenshot({
    path: testInfo.outputPath("p9-checkin-completed.png"),
    fullPage: true,
  });
});

test("P9 - Safety flag triggers immediate safety pause and referral guidance", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/dev/plano-treino");
  if (process.env.E2E_PRODUCTION === "1") {
    expect(response?.status()).toBe(404);
    return;
  }

  // Complete Day 1 exercises
  const completeButtons = page.getByRole("button", {
    name: "Concluir exercício",
  });
  await completeButtons.first().click();
  await completeButtons.first().click();

  // Select Mood
  await page.getByText("Precisamos pausar").click();

  // Select Safety Flag: "pain_suspected"
  const safetySelect = page.locator("#safety-flag-select");
  await safetySelect.selectOption("pain_suspected");

  // Warning note is displayed
  await expect(
    page.getByText(/Ao registrar este sinal, o plano será pausado preventivamente/i),
  ).toBeVisible();

  // Submit check-in
  await page.getByRole("button", { name: "Concluir check-in do Dia 1" }).click();

  // Safety Pause Card is rendered
  await expect(page.getByText("Pausa Consciente Ativada")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "O bem-estar e a segurança vêm sempre em primeiro lugar",
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Consulte um médico-veterinário/i),
  ).toBeVisible();

  // WCAG check on safety pause view
  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(axeResults.violations).toEqual([]);

  await page.screenshot({
    path: testInfo.outputPath("p9-safety-pause.png"),
    fullPage: true,
  });
});
