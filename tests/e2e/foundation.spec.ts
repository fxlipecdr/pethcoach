import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { waitForTransitions } from "./settle";
import { faqs } from "@/content/faq";

test("home, navigation, accessibility and responsive layout", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const logo = page.getByRole("banner").getByAltText("PethCoach");
  await expect(logo).toBeVisible();
  expect(
    await logo.evaluate(
      (image: HTMLImageElement) => image.complete && image.naturalWidth > 0,
    ),
  ).toBe(true);
  expect(
    await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return {
        ink: styles.getPropertyValue("--ink").trim(),
        cream: styles.getPropertyValue("--cream").trim(),
        purple: styles.getPropertyValue("--purple").trim(),
        coral: styles.getPropertyValue("--coral").trim(),
        lime: styles.getPropertyValue("--lime").trim(),
      };
    }),
  ).toEqual({
    ink: "#17211b",
    cream: "#fffdf7",
    purple: "#6757e8",
    coral: "#ff796d",
    lime: "#ddf56d",
  });
  await expect(
    page.getByRole("heading", {
      name: "Um próximo passo. Uma rotina mais leve.",
    }),
  ).toBeVisible();
  // O selo carrega a oferta real. Já foi "Produto em desenvolvimento", frase
  // que passou a desencorajar a compra depois que a cobrança entrou no ar.
  await expect(
    page.getByText("Primeiro dia grátis", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Conhecer os programas" }).click();
  await expect(page).toHaveURL(/#problemas$/);
  await expect(
    page.getByRole("heading", { name: "O que vocês precisam melhorar?" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
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
    path: testInfo.outputPath("home.png"),
    fullPage: true,
  });
  await page.getByRole("link", { name: /Meu cachorro puxa a guia/ }).click();
  await page.waitForURL("/problemas/cachorro-puxa-guia");
  await expect(
    page.getByRole("heading", { name: "Meu cachorro puxa a guia" }),
  ).toBeVisible();
  await expect(
    page.getByText(/São até 10 perguntas sobre situações observáveis/),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("private routes fail closed and success redirect grants nothing", async ({
  page,
  request,
}) => {
  for (const route of ["/app", "/admin", "/app/conta"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/entrar(?:\?next=.*)?$/);
  }
  await page.goto("/checkout/sucesso?session_id=forged");
  await expect(
    page.getByRole("heading", {
      name: "Tudo pronto! Seu Plano Completo está Liberado",
    }),
  ).toBeVisible();
  const health = await request.get("/api/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toEqual({
    status: "ok",
    stage: "foundation",
    version: "0.1.0",
  });
  expect(health.headers()["x-content-type-options"]).toBe("nosniff");

  // P14: a resposta de documento carrega a política completa, com nonce.
  const document = await request.get("/");
  const headers = document.headers();
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin");
  const csp = headers["content-security-policy"] ?? "";
  for (const directive of [
    "default-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "img-src 'self' data: blob:",
    "style-src 'self' 'unsafe-inline'",
  ])
    expect(csp).toContain(directive);
  expect(csp).toContain("connect-src 'self'");
  // Rota pública pode ser estática: o bootstrap do Next não recebe nonce.
  expect(csp).toContain("script-src 'self' 'unsafe-inline'");

  // Rotas sempre dinâmicas usam nonce e não podem aceitar script inline solto.
  const strict = await request.get("/entrar");
  const strictCsp = strict.headers()["content-security-policy"] ?? "";
  const strictScriptSrc = strictCsp.match(/script-src [^;]*/)?.[0] ?? "";
  expect(strictScriptSrc).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/);
  // O inline solto fica proibido justamente onde há dado de usuário.
  expect(strictScriptSrc).not.toContain("'unsafe-inline'");
  // Todo script inline dessa página precisa carregar o nonce, senão a
  // hidratação quebra em produção.
  const inlineScripts =
    (await strict.text()).match(/<script(?![^>]*\ssrc=)[^>]*>/g) ?? [];
  expect(inlineScripts.length).toBeGreaterThan(0);
  for (const tag of inlineScripts) expect(tag).toContain("nonce=");
  // Nonces não podem se repetir entre requisições.
  const secondStrict =
    (await request.get("/entrar")).headers()["content-security-policy"] ?? "";
  expect(secondStrict).not.toBe(strictCsp);
  const unknown = await request.get("/problemas/desconhecido");
  expect(unknown.status()).toBe(404);
});

test("UI kit validates inputs, keyboard focus and dialogs; production hides it", async ({
  page,
}, testInfo) => {
  const response = await page.goto("/dev/ui-kit");
  if (process.env.E2E_PRODUCTION === "1") {
    expect(response?.status()).toBe(404);
    return;
  }
  await page.getByRole("button", { name: "Validar exemplo" }).click();
  await expect(page.locator("#sample-name-error")).toHaveText(
    "Informe pelo menos 2 caracteres.",
  );
  await expect(page.getByLabel("Nome do cão")).toBeFocused();
  await page.getByLabel("Nome do cão").fill("Teste local");
  await page.getByRole("button", { name: "Validar exemplo" }).click();
  await expect(page.locator("#sample-feedback")).toHaveText(
    /Nenhum dado foi salvo/,
  );
  const trigger = page.getByRole("button", { name: "Abrir exemplo" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await waitForTransitions(page);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
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
    path: testInfo.outputPath("ui-kit.png"),
    fullPage: true,
  });
});

test("help is usable with keyboard and unknown routes remain 404", async ({
  page,
}) => {
  await page.goto("/ajuda");
  // O texto das dúvidas acompanha o produto; o que este teste garante é que a
  // primeira delas abre pelo teclado, seja qual for a pergunta.
  const [primeiraDuvida] = faqs;
  if (!primeiraDuvida) throw new Error("Catálogo de dúvidas está vazio.");
  const question = page.getByRole("button", { name: primeiraDuvida.question });
  await question.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(primeiraDuvida.answer, { exact: false })).toBeVisible();
  const response = await page.goto("/caminho-inexistente");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", {
      name: "Vamos voltar para um lugar conhecido?",
    }),
  ).toBeVisible();
});
