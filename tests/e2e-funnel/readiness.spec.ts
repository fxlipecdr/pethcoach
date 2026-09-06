import { expect, test } from "@playwright/test";

/**
 * P15 — readiness protegido.
 *
 * Verifica as três garantias: exige segredo, não vaza configuração e reporta
 * o estado real das dependências com o banco de verdade no ar.
 */
const cronSecret =
  process.env.FUNNEL_CRON_SECRET ?? "cron-funil-local-somente-teste";

test("readiness exige segredo e não expõe configuração", async ({ request }) => {
  const semSegredo = await request.get("/api/ready");
  expect(semSegredo.status()).toBe(401);
  expect(await semSegredo.json()).toEqual({ pronto: false });

  const segredoErrado = await request.get("/api/ready", {
    headers: { "x-cron-secret": "errado" },
  });
  expect(segredoErrado.status()).toBe(401);
});

test("readiness reporta o estado real das dependências", async ({ request }) => {
  const resposta = await request.get("/api/ready", {
    headers: { authorization: `Bearer ${cronSecret}` },
  });
  expect(resposta.status()).toBe(200);

  const corpo = await resposta.json();
  expect(corpo.pronto).toBe(true);
  expect(resposta.headers()["cache-control"]).toContain("no-store");
  // Identifica a versão no ar; em produção vem o SHA curto do commit.
  expect(corpo.commit).toBe("local");

  const porNome = Object.fromEntries(
    (corpo.dependencias as { nome: string; estado: string }[]).map((d) => [
      d.nome,
      d.estado,
    ]),
  );
  expect(porNome.banco).toBe("ok");
  // Sem chave de IA neste ambiente: o fallback determinístico cobre.
  expect(porNome.planner_ia).toBe("degradado");
  expect(porNome.email).toBe("ausente");

  // Nenhuma URL, chave ou host pode aparecer na resposta.
  const texto = JSON.stringify(corpo);
  expect(texto).not.toMatch(/https?:\/\//);
  expect(texto).not.toMatch(/sb_secret|whsec_|sk_test|supabase\.co/);
});
