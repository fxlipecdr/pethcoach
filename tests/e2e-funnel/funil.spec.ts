import { expect, test, type Page } from "@playwright/test";
import { readMagicLink, uniqueEmail } from "./magic-link";

/**
 * P15 — o funil inteiro contra fornecedores reais.
 *
 * Landing → quiz → gate de segurança → conta por magic link → vínculo da
 * avaliação → perfil do cão → plano → execução do Dia 1 → check-in.
 *
 * Nada é simulado: as perguntas vêm do catálogo publicado, o gate roda no
 * banco, a sessão é emitida pelo Auth e a RLS está ativa o tempo todo. O
 * planner usa o fallback determinístico, porque não há chave de IA no ambiente
 * de teste — e é justamente esse o caminho que precisa existir em produção
 * quando o provedor cai.
 */
const problema = "cachorro-puxa-guia";

/**
 * O banner de consentimento cobre o rodapé e, com ele, botões de formulário.
 * O tutor decide antes de seguir — aqui pela opção que preserva privacidade.
 * A espera explícita importa: o banner entra por efeito, depois da hidratação.
 */
async function recusarAnaliticos(page: Page) {
  const apenasEssenciais = page.getByRole("button", {
    name: "Apenas essenciais",
  });
  await expect(apenasEssenciais).toBeVisible({ timeout: 15000 });
  await apenasEssenciais.click();
  await expect(apenasEssenciais).toBeHidden();
}

/**
 * Responde o quiz escolhendo sempre a primeira alternativa.
 *
 * Não é arbitrário: nenhuma primeira opção do catálogo carrega tag de risco em
 * `rules_json.optionTags`, então o desfecho é CONTINUE de forma determinística.
 * Se alguém adicionar uma tag a uma primeira opção, este teste passa a falhar
 * no lugar certo — no resultado do gate.
 */
async function responderQuiz(page: Page) {
  await page.goto(`/quiz/${problema}`);
  await page.getByRole("button", { name: "Começar quiz" }).click();

  // O contador é a âncora: só interagir depois que a pergunta certa está na
  // tela evita responder a anterior enquanto a próxima ainda renderiza.
  const contador = page.getByText(/^Pergunta \d+ de \d+$/);
  await expect(contador).toBeVisible();
  const total = Number(
    (await contador.textContent())?.match(/de (\d+)/)?.[1] ?? 0,
  );
  expect(total).toBeGreaterThan(0);

  for (let pergunta = 1; pergunta <= total; pergunta += 1) {
    await expect(
      page.getByText(`Pergunta ${pergunta} de ${total}`),
    ).toBeVisible();
    await page.getByRole("group").getByRole("radio").first().check();
    await page
      .getByRole("button", {
        name: pergunta === total ? "Concluir quiz" : "Continuar",
      })
      .click();
  }

  await page.waitForURL(/\/resultado\//, { timeout: 60000 });
}

test("do quiz ao check-in do Dia 1, com conta e plano reais", async ({ page }) => {
  const address = uniqueEmail("funil");

  // 1. A landing do problema leva ao quiz.
  await page.goto(`/problemas/${problema}`);
  await expect(
    page.getByRole("heading", { name: "Meu cachorro puxa a guia" }),
  ).toBeVisible();
  await recusarAnaliticos(page);

  // 2. Quiz completo, com o gate de segurança avaliado no banco.
  await responderQuiz(page);
  const resultado = page.url();
  await expect(
    page.getByRole("heading", {
      name: /Nenhum bloqueio imediato foi identificado/i,
    }),
  ).toBeVisible();

  // 3. Criar conta a partir do resultado, preservando a avaliação.
  await page
    .getByRole("link", { name: /Salvar avaliação e criar conta/i })
    .click();
  await expect(page).toHaveURL(/\/entrar/);
  await page.getByLabel(/e-mail/i).fill(address);
  await page.getByRole("button", { name: /receber link/i }).click();
  await page.goto(await readMagicLink(address));

  // 4. O cão precisa existir antes do vínculo: é o cão que carrega o plano.
  await page.goto("/app/caes/novo");
  await page.getByLabel("Nome do cão").fill("Luna");
  await page.getByRole("button", { name: "Criar perfil do cão" }).click();
  await page.waitForURL(/\/app\/caes\/[0-9a-f-]{36}/, { timeout: 60000 });
  const perfilDoCao = page.url().split("?")[0]!;

  // 5. De volta ao resultado, autenticado: vincular a avaliação ao cão.
  await page.goto(resultado);
  await page
    .getByLabel("Escolha o cão para esta avaliação:")
    .selectOption({ label: "Luna" });
  await page
    .getByRole("button", { name: "Salvar avaliação na minha conta" })
    .click();
  await expect(
    page.getByRole("link", { name: /Acessar minha área/i }),
  ).toBeVisible();

  // 6. Gerar o plano pelo fallback determinístico.
  await page.goto(perfilDoCao);
  const gerar = page.getByRole("button", {
    name: /Gerar Plano de 14 Dias para Luna/i,
  });
  await expect(gerar).toBeVisible({ timeout: 30000 });
  await gerar.click();

  // 7. O plano de 14 dias existe e o Dia 1 está liberado.
  await expect(
    page.getByRole("heading", { name: /Jornada de 14 Dias/i }),
  ).toBeVisible({ timeout: 90000 });
  await expect(page.getByText(/Exercícios do Dia 1/i)).toBeVisible();

  // 8. Concluir um exercício do Dia 1.
  const concluirExercicio = page
    .getByRole("button", { name: "Concluir exercício" })
    .first();
  await concluirExercicio.click();
  await expect(page.getByRole("button", { name: "Concluída" }).first()).toBeVisible({
    timeout: 30000,
  });

  // 9. O dashboard reflete o plano ativo.
  await page.goto("/app");
  await expect(page.getByText("Treino de hoje").first()).toBeVisible();
  // O título muda conforme o dia esteja em andamento ou já concluído; o que
  // precisa valer é o painel apontar para o cão certo.
  await expect(
    page.getByRole("heading", { name: /(Treino com|Tudo certo com) Luna/i }),
  ).toBeVisible();
  // O progresso do dia já reflete o exercício concluído.
  await expect(page.getByText(/1 de \d+ exercícios/)).toBeVisible();
});
