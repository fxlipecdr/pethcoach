import { defineConfig, devices } from "@playwright/test";

/**
 * Suíte do funil real — P15.
 *
 * Diferente de `playwright.config.ts`, que limpa as credenciais de propósito
 * para o smoke offline, aqui a aplicação sobe apontando para a stack local do
 * Supabase: Auth real, Postgres real com RLS e Mailpit no lugar do provedor de
 * e-mail. Nenhum serviço externo é acionado e nenhuma cobrança acontece.
 *
 * Pré-requisito: `pnpm exec supabase start`. As chaves abaixo são as
 * publicamente documentadas da stack local do CLI, iguais em qualquer máquina;
 * não são segredo e nunca devem aparecer em `.env.local` ou na Vercel.
 */
const supabaseUrl = process.env.FUNNEL_SUPABASE_URL ?? "http://127.0.0.1:54321";
const publishableKey =
  process.env.FUNNEL_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const secretKey =
  process.env.FUNNEL_SUPABASE_SECRET_KEY ??
  "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

export default defineConfig({
  testDir: "./tests/e2e-funnel",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 180000,
  expect: { timeout: 30000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "funnel",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } },
    },
  ],
  webServer: {
    env: {
      // O redirecionamento do magic link precisa bater com
      // `additional_redirect_urls` em supabase/config.toml.
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      SUPABASE_SECRET_KEY: secretKey,
      // Segredo só deste ambiente de teste; assina o token anônimo do quiz.
      ASSESSMENT_TOKEN_SECRET:
        "funil-local-somente-para-teste-nao-usar-em-producao",
      // Sem OPENAI_API_KEY: o planner cai no fallback determinístico aprovado,
      // que é exatamente o caminho que precisa funcionar se o provedor cair.
      //
      // O Stripe não é chamado: `constructEvent` é HMAC puro, então dá para
      // verificar assinatura, concessão e idempotência sem conta nem rede.
      STRIPE_SECRET_KEY: "sk_test_funil_local_nao_chama_a_api",
      STRIPE_WEBHOOK_SECRET:
        process.env.FUNNEL_STRIPE_WEBHOOK_SECRET ?? "whsec_funil_local_de_teste",
      // Protege /api/ready e os jobs; sem ele o readiness devolve 404.
      CRON_SECRET:
        process.env.FUNNEL_CRON_SECRET ?? "cron-funil-local-somente-teste",
    },
    command: "pnpm dev --port 3100",
    url: "http://127.0.0.1:3100/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
