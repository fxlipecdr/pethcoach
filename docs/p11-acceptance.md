# P11 — Analytics, Atribuição e Rastreamento Seguro com Consentimento

P11 concluída tecnicamente em 07/09/2026. A fase entrega a governança de consentimento (LGPD), captura e sanitização de tráfego (first-touch e last-touch), pipeline seguro de persistência na tabela `attribution_touches`, catálogo estrito de 12 eventos de produto com allowlists Zod anti-PII, despacho seguro no cliente (`posthog-js`) e no servidor (`captureServerEvent`), e banner de cookies acessível e mobile-first.

## Implementado

- **Governança de Consentimento LGPD (`features/analytics/consent.ts`)**:
  - Armazenamento em cookie seguro `peth_consent` (com validade de 365 dias, `SameSite=Lax`) e `localStorage`.
  - Respeito absoluto à privacidade: tracking desativado por padrão (`opt_out_capturing_by_default: true`).
  - Sincronização em tempo real com `lib/posthog/client.ts` via evento de janela `peth:consent_change`.
- **Atribuição de Tráfego Sanitizada (`features/analytics/attribution.ts`)**:
  - `parseAttributionParams`: extrai `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content` e click IDs permitidos (`gclid`, `fbclid`, `ttclid`).
  - Sanitização de referrers externos: remoção de query strings, hashes, tokens e senhas.
  - `getOrCreateAnonymousId`: gera ou recupera UUID v4 de correlação persistido localmente (não é token nem credencial).
- **Camada de Dados de Atribuição e Server Actions (`features/analytics/data.ts` e `features/analytics/actions.ts`)**:
  - `recordAttributionTouch`: grava toques em `public.attribution_touches` via service-role backend (`createSupabaseAdminClient`).
  - **Imutabilidade do First-Touch**: uma vez registrado o first touch para determinado `anonymous_id`, ele nunca é sobrescrito.
  - **Atualização do Last-Touch**: toques do tipo `last` registram campanhas e páginas de visitas subsequentes.
  - `linkAttributionToUser`: vincula toques de `anonymous_id` ao `user_id` após o cadastro ou login do usuário.
- **Contratos e Allowlists Anti-PII (`features/analytics/contracts.ts`)**:
  - Schemas Zod específicos com validação estrita para os 12 eventos do blueprint:
    1. `landing_view`: visualização de home ou landings por problema;
    2. `quiz_started`: primeira resposta do tutor no quiz;
    3. `quiz_completed`: conclusão com duração e status determinístico de segurança;
    4. `result_viewed`: visualização da síntese de respostas;
    5. `account_created`: cadastro/reivindicação confirmada;
    6. `day1_started`: início do treino gratuito do Dia 1;
    7. `paywall_viewed`: visualização da oferta de desbloqueio dos 14 dias;
    8. `checkout_started`: início do fluxo de assinatura no backend;
    9. `purchase_completed`: evento exclusivo do servidor após webhook Stripe;
    10. `task_completed`: conclusão idempotente de tarefa diária;
    11. `checkin_submitted`: autoavaliação com humor e dificuldade;
    12. `plan_adjusted`: adaptação de ritmo ou pausa preventiva ativada.
  - Bloqueio estrito de PII: proibido envio de nomes, e-mails, anotações livres do tutor ou parâmetros de URL sensíveis.
- **Clientes Analytics Client e Server (`lib/posthog/client.ts` e `lib/posthog/server.ts`)**:
  - Client provider com checagem de consentimento ativo, validação em tempo de execução e cache de desduplicação (janela de 2000ms).
  - Emissor de servidor `captureServerEvent` integrado ao endpoint do Stripe Webhook (`/api/webhooks/stripe`) para envio de `purchase_completed`.
- **Interface do Usuário e Experiência Mobile-First**:
  - Banner de consentimento (`components/pethcoach/consent-banner.tsx`):
    - Flutuante no rodapé, semanticamente acessível (`role="region"`, `aria-label="Consentimento de privacidade e cookies"`).
    - Botões: "Aceitar analíticos" e "Apenas essenciais" com touch targets `>= 24px` conformes com WCAG 2.2 AA (critério 2.5.8).
    - Ocultado automaticamente em prévias de desenvolvimento (`/dev/*`).
  - Botão de reabertura de preferências (`components/pethcoach/cookie-preferences-button.tsx`) integrado no rodapé de todas as páginas.

## Verificação

- `tests/unit/p11-analytics.test.ts`: 13 testes unitários cobrindo:
  - Validação de schemas Zod para todos os 12 eventos de produto.
  - Bloqueio estrito de parâmetros não permitidos e PII.
  - Sanitização de URLs e referrers externos.
  - Governança de consentimento (`pending`, `granted`, `denied`).
  - Fallback seguro do provedor sem credenciais PostHog.
- `tests/integration/p11-attribution.test.ts`: 3 testes em PostgreSQL WASM (PGlite) cobrindo:
  - RLS e grants em `public.attribution_touches` (escrita direta negada a anônimos e autenticados).
  - Gravação de first touch e last touch via service-role com `click_ids` JSONB.
  - Vinculação de toques anônimos para o usuário autenticado e isolamento estrito entre usuários.
- `tests/e2e/p11.spec.ts`: 4 testes Playwright nos viewports desktop e mobile 360px:
  - Banner visível na primeira visita e botão "Apenas essenciais" persistindo `peth_consent=denied`.
  - Botão "Aceitar analíticos" persistindo `peth_consent=granted`.
  - Reabertura das preferências pelo botão do rodapé.
  - Auditoria Axe Core com zero violações WCAG 2.2 AA e ausência de overflow horizontal em 360px.
- `pnpm lint`: zero erros e zero avisos (ESLint).
- `pnpm typecheck`: TypeScript strict com zero erros em todo o repositório.
- `pnpm test`: 25 suítes de teste e 194 testes unitários e de integração aprovados (100%).
- `pnpm e2e:smoke`: 60 testes end-to-end aprovados com o Playwright.
- `pnpm build`: compilação de produção com Turbopack concluída com sucesso.

## Limites e próximo passo

O consentimento LGPD, a captura de atribuição first/last-touch e o catálogo de 12 eventos com allowlists Zod estão 100% integrados e auditados. A próxima fase na ordem do roadmap é a **P12 (E-mail e Retenção)**.
