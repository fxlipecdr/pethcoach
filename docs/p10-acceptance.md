# P10 — Stripe, Billing e Concessão Automática de Entitlements via Webhooks Assinados

P10 concluída tecnicamente em 06/09/2026. A fase entrega a integração completa de faturamento com Stripe usando o SDK oficial (`stripe`), adapter seguro `PaymentProvider` com fallback tipado, tabela de mapeamento de clientes (`billing_customers`), livro de idempotência de eventos webhook (`processed_webhook_events`), rota de webhook autenticada por assinatura crua (`/api/webhooks/stripe`), concessão de entitlements com base exclusiva em estado verificado, server actions com rate limiting, tela comemorativa de pós-checkout e card de gerenciamento de assinatura na área do usuário.

## Implementado

- **Migração e Modelagem de Dados (`supabase/migrations/20260906000000_p10_billing_and_webhooks.sql`)**:
  - `public.billing_customers`:
    - Relacionamento 1:1 `user_id` (PK) vinculado a `auth.users(id)` em cascata.
    - Colunas indexadas e únicas: `stripe_customer_id`, `email`, timestamps de auditoria.
    - RLS ativado e forçado (`force row level security`): leitura estrita ao dono (`user_id = auth.uid()`), inserção/atualização apenas via service role ou pelo próprio dono.
  - `public.processed_webhook_events`:
    - Livro razão para desduplicação atômica de eventos Stripe.
    - Chave primária `event_id text primary key`.
    - Colunas: `event_type`, `processed_at`, `payload_summary` (JSONB).
    - RLS ativado e forçado: todas as permissões anônimas e autenticadas revogadas (acesso restrito exclusivamente à service-role backend).
  - Atualização em `public.entitlements`:
    - Adicionadas colunas indexadas `stripe_customer_id text` e `stripe_subscription_id text`.
- **Tipagem TypeScript e Contratos (`lib/supabase/database.types.ts` e `features/billing/contracts.ts`)**:
  - Catálogo de planos com id, nome, descrição, preço em centavos (`amountCents`) e moeda (`BRL`), com `priceId` parametrizado via `STRIPE_PRICE_ID_FULL_PROGRAM`.
  - Schemas Zod: `billingPlanTypeSchema`, `createCheckoutInputSchema`, `billingCustomerSchema`, `userBillingStatusSchema`.
- **Adapter de Pagamento Seguro (`lib/stripe/provider.ts`)**:
  - `StripePaymentProvider` implementando `PaymentProvider`:
    - Retorno tipado `{ status: "unavailable", reason: "missing_credentials" }` quando credenciais não estão configuradas no ambiente.
    - Sessões de Checkout e Customer Portal criadas via SDK Stripe oficial quando as chaves estão presentes.
    - `constructWebhookEvent` validando assinatura em formato raw Buffer com tolerância de relógio.
    - Compatibilidade retroativa com a assinatura legada de P0 nos testes unitários.
- **Camada de Dados Backend (`features/billing/data.ts`) e Cliente Admin (`lib/supabase/admin.ts`)**:
  - `getAdminClient`: cliente Supabase com chave de serviço (`SUPABASE_SECRET_KEY`) restrito ao servidor.
  - `upsertBillingCustomer`: persistência do vínculo usuário ↔ Stripe Customer.
  - `isWebhookEventProcessed` & `recordProcessedWebhookEvent`: controle transacional de idempotência contra repetições de webhook.
  - `grantOrUpdateEntitlement`: concessão de acesso `full_program` com status ativo (`active`) e expiração quando a assinatura/checkout for confirmado.
  - `getUserBillingStatus`: consulta de status da assinatura e plano do usuário logado.
- **Endpoint de Webhook Autenticado e Idempotente (`app/api/webhooks/stripe/route.ts`)**:
  - Captura da assinatura crua `stripe-signature` e do corpo da requisição em formato Buffer.
  - Validação criptográfica com `STRIPE_WEBHOOK_SECRET`.
  - Prevenção de duplicidade: verificação no ledger `processed_webhook_events` antes de processar.
  - Tratamento de eventos essenciais:
    - `checkout.session.completed`: concessão imediata de `full_program`.
    - `customer.subscription.created` & `customer.subscription.updated`: atualização de vigência e status (`active`, `canceled`, `past_due`).
    - `customer.subscription.deleted`: expiração do entitlement.
    - `invoice.payment_failed`: marcação de atraso no plano.
- **Server Actions e Proteção contra Abuso (`features/billing/actions.ts`)**:
  - `createCheckoutSessionAction`: exige autenticação, valida entrada com Zod e aplica rate limiting (`authLimiter`).
  - `createCustomerPortalAction`: redireciona com segurança para o Portal do Cliente Stripe para gerenciar cartão ou cancelamento.
- **Interface do Usuário e Experiência Mobile-First**:
  - Tela de Sucesso (`/checkout/sucesso`): celebração com o mascote Peth (`celebrating`), mensagem positiva e CTAs diretos para o Treino de Hoje e Detalhes da Conta.
  - Card de Assinatura (`features/billing/billing-card.tsx` e `/app/conta`): mostra status atual ("Plano Gratuito - Dia 1" vs "Programa Completo - Ativo"), data de renovação, e botões para Upgrade ou Portal do Cliente.
  - CTA no Plano de Treino (`features/plans/plan-view.tsx`): direcionamento fluido nos dias 2 a 14 bloqueados para a conta do usuário.

## Verificação

- `tests/unit/p10-billing.test.ts`: 7 testes unitários cobrindo:
  - Catálogo de planos e formatação em BRL.
  - Schemas Zod de checkout e status de faturamento.
  - Fallback gracioso de `StripePaymentProvider` sem credenciais.
  - Geração de sessão de checkout e portal com SDK configurado.
  - Validação estrita de assinatura no webhook.
- `tests/integration/p10-billing.test.ts`: 4 testes em PostgreSQL WASM (PGlite) cobrindo:
  - Execução da migração `20260906000000_p10_billing_and_webhooks.sql`.
  - RLS em `billing_customers` (leitura exclusiva do dono, negação a anônimos).
  - Isolamento e restrição total em `processed_webhook_events`.
  - Idempotência no livro razão de webhooks processados.
  - Concessão e atualização de entitlements via `grantOrUpdateEntitlement`.
- `tests/e2e/p10.spec.ts`: 4 testes Playwright cobrindo desktop e mobile 360px:
  - Renderização da tela `/checkout/sucesso` com mascote e links.
  - Card de upgrade nos dias bloqueados do plano.
  - Auditoria de acessibilidade Axe (WCAG 2.2 AA) com zero violações.
- `pnpm lint`: zero erros e zero avisos (ESLint com `@next/next` e `react-hooks/immutability`).
- `pnpm typecheck`: TypeScript strict com zero erros em todo o repositório.
- `pnpm test`: 23 suítes de teste e 178 testes unitários e de integração aprovados (100%).
- `pnpm e2e:smoke`: 56 testes end-to-end aprovados com o Playwright.
- `pnpm build`: compilação Turbopack de produção concluída com sucesso com todas as rotas estáticas e dinâmicas verificadas.

## Limites e próximo passo

O faturamento, webhook seguro e controle de acesso via entitlements estão 100% integrados e testados contra o banco local e PGlite. A próxima fase do roadmap é a **P11 (Observabilidade, Telemetria, Error Boundaries e Otimização para Produção)**.
