import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Reproduz a queda total em produção: toda URL respondendo 500, inclusive
 * `/api/health`, que não depende de nada.
 *
 * A causa era `instrumentation.register()` validando o ambiente e lançando. Ela
 * roda uma vez por processo, antes de qualquer rota, então a exceção não
 * degradava um recurso — derrubava o site inteiro.
 */
const ambienteOriginal = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ambienteOriginal };
});

afterEach(() => {
  process.env = { ...ambienteOriginal };
  vi.restoreAllMocks();
});

describe("inicialização do servidor", () => {
  it("não lança com ambiente inválido", async () => {
    // Par incompleto: o schema exige host e chave do PostHog juntos.
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "chave-sem-host";
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    const erro = vi.spyOn(console, "error").mockImplementation(() => {});

    const { register } = await import("@/instrumentation");
    await expect(register()).resolves.toBeUndefined();

    // A falha precisa aparecer, e com o nome do campo — nunca com o valor.
    expect(erro).toHaveBeenCalled();
    const mensagem = String(erro.mock.calls[0]?.[0]);
    expect(mensagem).toContain("NEXT_PUBLIC_POSTHOG");
    expect(mensagem).not.toContain("chave-sem-host");
  });

  it("não lança com chave publicável no formato errado", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_secret_errada";
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { register } = await import("@/instrumentation");
    await expect(register()).resolves.toBeUndefined();
  });

  it("onRequestError nunca lança, mesmo com ambiente quebrado", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "chave-sem-host";
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;

    const { onRequestError } = await import("@/instrumentation");
    await expect(onRequestError()).resolves.toBeUndefined();
  });
});

describe("política de segurança", () => {
  it("cai para política restritiva quando o ambiente é ilegível", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "chave-sem-host";
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { buildContentSecurityPolicy } = await import("@/lib/security/csp");
    const politica = buildContentSecurityPolicy(null);

    // Mais restritiva, não menos: nenhuma origem externa liberada.
    expect(politica).toContain("default-src 'self'");
    expect(politica).toContain("frame-ancestors 'none'");
    expect(politica).toContain("connect-src 'self'");
    expect(politica).not.toContain("supabase.co");
    expect(politica).not.toContain("facebook");
  });
});
