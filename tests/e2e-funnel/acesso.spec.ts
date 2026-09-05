import { expect, test } from "@playwright/test";
import { signIn, uniqueEmail } from "./magic-link";

/**
 * P15 — o acesso real, ponta a ponta.
 *
 * Auth de verdade, e-mail de verdade (Mailpit), Postgres de verdade com RLS.
 * O smoke offline cobre o comportamento sem credenciais; aqui o objetivo é
 * provar que o caminho do tutor funciona quando os fornecedores existem.
 */
test("magic link cria conta, abre a área pessoal e o perfil nasce pelo gatilho", async ({
  page,
}) => {
  const address = uniqueEmail("acesso");
  await signIn(page, address);

  await expect(
    page.getByRole("heading", { name: "A rotina de vocês" }),
  ).toBeVisible();

  await page.goto("/app/conta");
  await expect(page.getByText(address)).toBeVisible();
});

test("sair encerra a sessão e a área pessoal volta a exigir acesso", async ({
  page,
}) => {
  const address = uniqueEmail("saida");
  await signIn(page, address);

  await page.goto("/app/conta");
  await page.getByRole("button", { name: "Sair desta conta" }).click();
  await page.waitForURL(/\/entrar/);

  await page.goto("/app");
  await expect(page).toHaveURL(/\/entrar/);
});
