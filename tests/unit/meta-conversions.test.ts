import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A regra de maior consequência aqui não é técnica, é jurídica: a política de
 * privacidade publicada diz que medição de anúncio depende de consentimento.
 * Se este arquivo passar a permitir envio sem aceite, o documento público vira
 * declaração falsa perante a ANPD.
 */
const ambienteOriginal = { ...process.env };

async function carregarModulo() {
  vi.resetModules();
  return import("@/lib/meta/server");
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_META_PIXEL_ID = "111122223333";
  process.env.META_CAPI_ACCESS_TOKEN = "token-de-teste";
  delete process.env.META_TEST_EVENT_CODE;
});

afterEach(() => {
  process.env = { ...ambienteOriginal };
  vi.restoreAllMocks();
});

describe("conversão da Meta", () => {
  it("não envia nada sem consentimento", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { sendMetaPurchase } = await carregarModulo();

    for (const consentimento of ["denied", "pending", null, undefined]) {
      const resultado = await sendMetaPurchase({
        eventId: "cs_test_1",
        valor: 97,
        moeda: "brl",
        emailCliente: "tutor@exemplo.com",
        consentimento: consentimento as string | null | undefined,
      });
      expect(resultado).toEqual({ ok: false, motivo: "sem_consentimento" });
    }

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("não envia sem credenciais configuradas", async () => {
    delete process.env.META_CAPI_ACCESS_TOKEN;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { sendMetaPurchase } = await carregarModulo();

    const resultado = await sendMetaPurchase({
      eventId: "cs_test_2",
      valor: 97,
      moeda: "brl",
      emailCliente: "tutor@exemplo.com",
      consentimento: "granted",
    });

    expect(resultado).toEqual({ ok: false, motivo: "sem_credenciais" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("envia o e-mail apenas como hash, nunca em texto claro", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const { sendMetaPurchase } = await carregarModulo();

    const resultado = await sendMetaPurchase({
      eventId: "cs_test_3",
      valor: 97.5,
      moeda: "brl",
      emailCliente: "Tutor@Exemplo.com ",
      consentimento: "granted",
    });

    expect(resultado).toEqual({ ok: true });
    const corpo = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));

    expect(JSON.stringify(corpo)).not.toContain("Tutor@Exemplo.com");
    expect(JSON.stringify(corpo)).not.toContain("tutor@exemplo.com");
    // SHA-256 de "tutor@exemplo.com", normalizado para minúsculas e sem espaços.
    expect(corpo.data[0].user_data.em[0]).toMatch(/^[a-f0-9]{64}$/);
    expect(corpo.data[0].event_name).toBe("Purchase");
    expect(corpo.data[0].custom_data).toEqual({ value: 97.5, currency: "BRL" });
  });

  it("usa o id da sessão do Stripe como id do evento, para não contar a compra duas vezes", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const { sendMetaPurchase } = await carregarModulo();

    await sendMetaPurchase({
      eventId: "cs_test_dedup",
      valor: 10,
      moeda: "brl",
      emailCliente: "tutor@exemplo.com",
      consentimento: "granted",
    });

    const corpo = JSON.parse(String(fetchSpy.mock.calls[0]?.[1]?.body));
    expect(corpo.data[0].event_id).toBe("cs_test_dedup");
  });

  it("recusa envio sem nenhum identificador de correspondência", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { sendMetaPurchase } = await carregarModulo();

    const resultado = await sendMetaPurchase({
      eventId: "cs_test_4",
      valor: 97,
      moeda: "brl",
      emailCliente: null,
      consentimento: "granted",
    });

    expect(resultado).toEqual({ ok: false, motivo: "sem_identificador" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reporta falha de HTTP sem lançar exceção", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("erro", { status: 400 }),
    );
    const { sendMetaPurchase } = await carregarModulo();

    const resultado = await sendMetaPurchase({
      eventId: "cs_test_5",
      valor: 97,
      moeda: "brl",
      emailCliente: "tutor@exemplo.com",
      consentimento: "granted",
    });

    expect(resultado).toEqual({ ok: false, motivo: "http_400" });
  });
});
