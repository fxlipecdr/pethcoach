import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const assessmentId = "11111111-1111-4111-8111-111111111111";
const questions = Array.from({ length: 8 }, (_, index) => ({
  key: `question_${index + 1}`,
  prompt: `Pergunta observável ${index + 1}?`,
  helpText: index === 0 ? "Escolha a situação mais próxima da rotina." : null,
  order: index + 1,
  options: [
    { key: "a", label: `Resposta A ${index + 1}` },
    { key: "b", label: `Resposta B ${index + 1}` },
  ],
}));

async function mockAssessmentApi(page: Page) {
  const answers: Record<string, string> = {};
  const session = () => ({
    assessment: {
      assessmentId,
      problemSlug: "cachorro-puxa-guia",
      version: 1,
      answers,
      status: "in_progress",
      safetyStatus: "pending",
      safetyCodes: [],
      safetyRuleVersion: null,
      safetyEvaluatedAt: null,
      startedAt: "2026-09-01T10:00:00.000Z",
      completedAt: null,
    },
    quiz: {
      problemSlug: "cachorro-puxa-guia",
      problemTitle: "Meu cachorro puxa a guia",
      version: 1,
      questions,
    },
  });
  await page.route("**/api/assessments**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "PATCH") {
      const body = request.postDataJSON() as {
        questionKey: string;
        optionKey: string;
      };
      answers[body.questionKey] = body.optionKey;
      await route.fulfill({ status: 200, json: { answers } });
      return;
    }
    if (request.method() === "POST" && url.pathname.endsWith("/complete")) {
      await route.fulfill({
        status: 200,
        json: {
          status: "completed",
          safetyStatus: "continue",
          safetyCodes: ["SAFETY_GATE_CLEAR"],
          safetyRuleVersion: "p5-v1",
          completedAt: "2026-09-01T10:05:00.000Z",
        },
      });
      return;
    }
    await route.fulfill({
      status: request.method() === "POST" ? 201 : 200,
      json: session(),
    });
  });
  return answers;
}

test("P4 quiz keeps one question per screen, persists progress and completes", async ({
  page,
}) => {
  test.skip(process.env.E2E_PRODUCTION === "1", "UI provider fixture is development-only");
  const answers = await mockAssessmentApi(page);
  await page.goto("/quiz/cachorro-puxa-guia");
  await expect(page.getByRole("heading", { name: "Vamos entender a rotina de vocês" })).toBeVisible();
  await page.getByRole("button", { name: "Começar quiz" }).click();
  await expect(page.getByRole("group", { name: "Pergunta observável 1?" })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.getByRole("radio", { name: "Resposta A 1" }).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 2 de 8")).toBeVisible();
  expect(answers.question_1).toBe("a");

  await page.getByRole("button", { name: "Voltar" }).click();
  await expect(page.getByRole("radio", { name: "Resposta A 1" })).toBeChecked();
  await page.getByRole("button", { name: "Continuar" }).click();
  for (let index = 2; index <= 8; index += 1) {
    await page.getByRole("radio", { name: `Resposta A ${index}` }).check();
    await page
      .getByRole("button", { name: index === 8 ? "Concluir quiz" : "Continuar" })
      .click();
  }
  await expect(page).toHaveURL(`/resultado/${assessmentId}`);
  await expect(
    page.getByRole("heading", {
      name: "Nenhum bloqueio imediato foi identificado",
    }),
  ).toBeVisible();
});

test("P4 quiz resumes from the stored assessment id without exposing a token", async ({
  page,
}) => {
  test.skip(process.env.E2E_PRODUCTION === "1", "UI provider fixture is development-only");
  await mockAssessmentApi(page);
  await page.goto("/quiz/cachorro-puxa-guia");
  await page.getByRole("button", { name: "Começar quiz" }).click();
  await page.getByRole("radio", { name: "Resposta B 1" }).check();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Pergunta 2 de 8")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Pergunta 2 de 8")).toBeVisible();
  const stored = await page.evaluate(() => localStorage.getItem("pethcoach:anonymous-context:v1"));
  expect(stored).toContain(assessmentId);
  expect(stored).not.toContain("token");
  expect(stored).not.toContain("question_1");
});
