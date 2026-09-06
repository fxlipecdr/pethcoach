import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { safeReturnPath } from "@/features/auth/contracts";

/**
 * Entrada pelo Google. O que precisa estar garantido não é a aparência do
 * botão, é o comportamento do retorno: para onde a pessoa vai depois, e o que
 * ela lê quando desiste no meio.
 */
const ambienteOriginal = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ambienteOriginal };
  process.env.NEXT_PUBLIC_SITE_URL = "https://exemplo.test";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://projeto.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_teste";
});

afterEach(() => {
  process.env = { ...ambienteOriginal };
  vi.restoreAllMocks();
});

describe("retorno do acesso pelo Google", () => {
  it("cancelar no provedor não vira mensagem de link de e-mail expirado", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const { NextRequest } = await import("next/server");

    const resposta = await GET(
      new NextRequest(
        "https://exemplo.test/auth/callback?error=access_denied&error_description=denied&next=%2Fapp",
      ),
    );

    expect(resposta.status).toBe(303);
    const destino = resposta.headers.get("Location") ?? "";
    // Quem desistiu na tela do Google não teve e-mail nenhum no caminho.
    expect(destino).toContain("error=oauth");
    expect(destino).not.toContain("error=link");
    expect(destino).toContain("next=%2Fapp");
  });

  it("não propaga o texto de erro do provedor", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const { NextRequest } = await import("next/server");

    const resposta = await GET(
      new NextRequest(
        "https://exemplo.test/auth/callback?error=access_denied&error_description=usuario%20negou",
      ),
    );

    const destino = resposta.headers.get("Location") ?? "";
    // Texto vindo de terceiro não entra na nossa URL.
    expect(destino).not.toContain("usuario");
    expect(destino).not.toContain("access_denied");
  });

  it("um destino externo no next é descartado", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const { NextRequest } = await import("next/server");

    const resposta = await GET(
      new NextRequest(
        "https://exemplo.test/auth/callback?error=access_denied&next=https%3A%2F%2Fmalicioso.test",
      ),
    );

    const destino = resposta.headers.get("Location") ?? "";
    expect(destino).not.toContain("malicioso.test");
  });

  it("o mesmo saneamento de destino do link mágico vale para o Google", () => {
    // O botão monta o retorno com `safeReturnPath`; esta é a garantia por trás.
    expect(safeReturnPath("https://malicioso.test/app")).not.toContain(
      "malicioso.test",
    );
    expect(safeReturnPath("//malicioso.test")).not.toContain("malicioso.test");
    expect(safeReturnPath("/app/conta")).toBe("/app/conta");
  });
});

describe("bandeira de habilitação", () => {
  it("o botão não existe sem a variável ligada", async () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED;
    const { getPublicEnvClient } = await import("@/lib/env/public-client");
    // Botão de login quebrado espanta mais que login com atrito: sem a
    // configuração no Supabase, ele simplesmente não é renderizado.
    expect(getPublicEnvClient().NEXT_PUBLIC_GOOGLE_AUTH_ENABLED).toBeUndefined();
  });

  it("só o valor exato liga o botão", async () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = "sim";
    const { publicEnvSchema } = await import("@/lib/env/schema");
    expect(
      publicEnvSchema.safeParse({ NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "sim" })
        .success,
    ).toBe(false);
    expect(
      publicEnvSchema.safeParse({ NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: "true" })
        .success,
    ).toBe(true);
  });
});
