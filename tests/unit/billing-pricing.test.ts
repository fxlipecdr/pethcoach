import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * O valor exibido e o valor cobrado precisam ser o mesmo número. Anunciar um
 * preço e cobrar outro é propaganda enganosa no Código de Defesa do Consumidor,
 * e era o risco real de manter o preço fixo no código enquanto o Stripe é quem
 * cobra.
 */
vi.mock("@/lib/stripe/provider", () => ({
  paymentProvider: {
    getLivePrice: vi.fn(),
    isConfigured: vi.fn(() => true),
  },
}));

const { paymentProvider } = await import("@/lib/stripe/provider");
const { resolvePlanPrices } = await import("@/features/billing/pricing");
const obterPreco = vi.mocked(paymentProvider.getLivePrice);
const estaConfigurado = vi.mocked(paymentProvider.isConfigured);

afterEach(() => {
  vi.resetAllMocks();
  estaConfigurado.mockReturnValue(true);
});

describe("preços dos planos", () => {
  it("usa o valor do Stripe, não o texto do código", async () => {
    obterPreco.mockImplementation(async (plano) => {
      if (plano === "single_program")
        return { unitAmount: 9700, currency: "brl" };
      if (plano === "monthly")
        return { unitAmount: 3990, currency: "brl", interval: "month" };
      return { unitAmount: 29700, currency: "brl", interval: "year" };
    });

    const precos = await resolvePlanPrices();

    expect(precos.single_program.priceFormatted).toContain("97,00");
    expect(precos.single_program.period).toBe("pagamento único");
    expect(precos.single_program.live).toBe(true);

    expect(precos.monthly.priceFormatted).toContain("39,90");
    expect(precos.monthly.period).toBe("/mês");

    expect(precos.annual.priceFormatted).toContain("297,00");
    expect(precos.annual.period).toBe("/ano");
  });

  it("esconde plano sem preço cadastrado, em vez de anunciar oferta que o checkout recusa", async () => {
    // Cenário real: mensal e avulso cadastrados, anual não.
    obterPreco.mockImplementation(async (plano) => {
      if (plano === "annual") return null;
      return { unitAmount: 3990, currency: "brl", interval: "month" };
    });

    const precos = await resolvePlanPrices();

    expect(precos.annual.available).toBe(false);
    expect(precos.monthly.available).toBe(true);
    expect(precos.single_program.available).toBe(true);
  });

  it("mostra o catálogo quando o Stripe inteiro não está configurado", async () => {
    estaConfigurado.mockReturnValue(false);
    obterPreco.mockResolvedValue(null);

    const precos = await resolvePlanPrices();

    // Prévia de desenvolvimento: a tela existe para revisar layout.
    expect(precos.monthly.live).toBe(false);
    expect(precos.monthly.available).toBe(true);
    expect(precos.monthly.priceFormatted).toMatch(/^R\$/);
  });

  it("formata em real brasileiro", async () => {
    obterPreco.mockResolvedValue({
      unitAmount: 14700,
      currency: "brl",
    });

    const precos = await resolvePlanPrices();
    // Espaço não separável entre símbolo e número, como o Intl produz.
    expect(precos.single_program.priceFormatted).toMatch(/R\$\s*147,00/);
  });
});

describe("afirmações comparativas", () => {
  it("o plano anual só declara vantagem quando o mensal está à vista", async () => {
    const { BILLING_PLANS_CATALOG } = await import(
      "@/features/billing/contracts"
    );
    const anual = BILLING_PLANS_CATALOG.find((p) => p.id === "annual");

    // A comparação precisa dizer contra quem compara, para que a tela possa
    // esconder a afirmação quando a referência não estiver sendo vendida.
    expect(anual?.comparesTo).toBe("monthly");
    expect(anual?.comparativeFeatures).toEqual([
      "Economia em relação ao plano mensal",
    ]);

    // Nenhuma afirmação comparativa pode estar na lista incondicional.
    for (const plano of BILLING_PLANS_CATALOG) {
      for (const beneficio of plano.features) {
        expect(beneficio.toLowerCase()).not.toContain("economia");
        expect(beneficio.toLowerCase()).not.toContain("desconto");
        expect(beneficio.toLowerCase()).not.toContain("mais barato");
      }
    }
  });
});
