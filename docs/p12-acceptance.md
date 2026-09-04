# Matriz de Aceite — Fase P12: E-mail e Retenção

A **Fase P12** implementa a infraestrutura completa de comunicação transacional, retenção e conformidade LGPD da PethCoach, garantindo consentimento por finalidade, cancelamento de 1 clique via token criptográfico, 7 templates acolhedores sem linguagem de culpa ou urgência falsa, ledger de entrega idempotente no PostgreSQL com RLS e jobs de retenção.

---

## 1. Escopo Entregue

| Requisito | Status | Evidência Técnica |
|---|---|---|
| **7 Templates Acolhedores Sem Culpa** | Concluído | `features/emails/templates.ts`: `welcome`, `day1_incomplete`, `checkin_reminder`, `milestone`, `payment_confirmed`, `payment_failed`, `re_engagement`. Testados contra termos punitivos ou ameaças de ofensiva. |
| **Consentimento por Finalidade (LGPD)** | Concluído | `features/emails/contracts.ts` e `email_preferences`: 4 categorias isoladas (`training_reminders`, `milestone_celebrations`, `billing_notifications`, `marketing_tips` com opt-in falso por padrão). |
| **Desinscrição 1-Clique por Token (`/unsubscribe`)** | Concluído | `app/(marketing)/unsubscribe/page.tsx` e `unsubscribe-form.tsx`: cancelamento sem exigir login com token seguro de 64 caracteres, opção por categoria ou global e botão de desfazer. |
| **Gerenciamento de Notificações na Conta** | Concluído | `features/emails/email-preferences-card.tsx` integrado em `/app/conta`: toggles acessíveis WCAG 2.2 AA (área de toque $\ge$ 24px) e persistência via Server Action. |
| **Tabelas Supabase com RLS** | Concluído | `supabase/migrations/20260907000000_p12_email_retention.sql`: `email_preferences` (restrito ao titular via `auth.uid()`) e `email_delivery_logs` (exclusivo service-role, bloqueio total para anon/authenticated). |
| **Ledger de Idempotência e Desduplicação** | Concluído | `email_delivery_logs.idempotency_key` (UNIQUE): previne múltiplos disparos acidentais; dispatcher ignora repetições com status `skipped` e razão `duplicate_idempotency`. |
| **Provedor Resend Seguro** | Concluído | `lib/email/provider.ts`: `ResendEmailProvider` com fallback tipado `NOT_IMPLEMENTED` quando sem chave e envio via header `Idempotency-Key` quando configurado. |
| **Jobs de Retenção Idempotentes** | Concluído | `features/emails/jobs.ts` e `/api/jobs/retention-emails`: rotinas determinísticas para `day1_incomplete` (>24h sem início), `checkin_reminder` (fim do dia) e `re_engagement` (>3 dias sem atividade). |
| **Integração aos Gatilhos Existentes** | Concluído | Disparo de `welcome` no claim da conta, `payment_confirmed` e `payment_failed` nos webhooks do Stripe, e `milestone` no desbloqueio de novos marcos do check-in. |

---

## 2. Cobertura e Resultados dos Testes Automatizados

### A. Testes Unitários (`tests/unit/p12-emails.test.ts`)
- **Validação de Schemas Zod**:
  - `sendEmailInputSchema`: rejeição estrita de e-mails inválidos, UUIDs mal formatados e chaves curtas (< 6 chars).
  - `emailPreferencesSchema`: garantia de opt-in por padrão em marketing (`marketingTips = false`).
  - `unsubscribeInputSchema`: validação de tokens hexadecimais $\ge$ 32 caracteres.
- **Auditoria de Cópia dos 7 Templates**:
  - Ausência de palavras de coerção, punição, culpa ou perda de sequência canina.
  - Presença obrigatória de links para `/unsubscribe`, preferências e política de privacidade.
- **Orquestrador / Dispatcher**:
  - Desduplicação idempotente confirmada sem chamada ao provedor.
  - Respeito ao opt-out de categoria e opt-out total (`unsubscribed_all`).
  - Fallback gracioso com registro de log `skipped` (`missing_credentials`).

### B. Testes de Integração em Banco (`tests/integration/p12-email-retention.test.ts`)
- Executado via **PGlite** com simulação de papéis `anon` e `authenticated`.
- Isolamento de RLS em `email_preferences`: Usuário A não lê nem atualiza registros do Usuário B.
- Acesso anônimo a `email_preferences` rejeitado com erro 42501 (`permission denied`).
- Isolamento de `email_delivery_logs`: acesso direto revogado tanto para anônimos quanto para usuários autenticados.
- Restrição de unicidade em `idempotency_key` testada e validada no PostgreSQL.

### C. Testes E2E Smoke Playwright (`tests/e2e/p12.spec.ts`)
- **Página `/unsubscribe` sem token**:
  - Exibe orientação amigável e link para login/início.
  - Zero violações de acessibilidade no Axe Core (WCAG 2.2 AA).
  - Sem overflow horizontal em viewport de 360px.
- **Página `/unsubscribe?token=...&category=...` com token**:
  - Exibe opções de 1 clique para cancelar a categoria ou todos os e-mails.
  - Zero violações de acessibilidade no Axe Core.
  - Sem overflow horizontal em 360px.

---

## 3. Resumo dos Quality Gates

- `pnpm lint`: **0 erros, 0 avisos**
- `pnpm typecheck`: **0 erros de tipagem**
- `pnpm test`: **27 arquivos / 205 testes aprovados (100%)**
- `pnpm e2e:smoke`: **64 testes Playwright aprovados (100%)**
- `pnpm build`: **Compilado com sucesso (Turbopack)**
