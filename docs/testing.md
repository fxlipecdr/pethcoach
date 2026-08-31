# Estratégia de testes

## Testes automatizados da fundação

- `pnpm lint`: ESLint com presets Next.js e TypeScript, zero warnings.
- `pnpm typecheck`: gera tipos de rotas e verifica TypeScript estrito.
- `pnpm test`: unitários de ambiente/providers/privacidade e integração RLS.
- `pnpm test:integration`: migration real executada em PGlite (PostgreSQL embarcado), roles `authenticated`/`anon`, dois usuários e claims sintéticos.
- `pnpm e2e:smoke`: Chromium em 1440px e 360px, navegação, 404, guards, sucesso de checkout sem entitlement, formulário de exemplo, diálogo/teclado, axe e screenshots.
- `pnpm build`: build de produção sem chaves. E2E com `E2E_PRODUCTION=1` testa o build e a indisponibilidade do UI kit em produção.

PGlite executa PostgreSQL e suas políticas RLS, sem mocks de consultas. O fixture emula somente `auth.users`/`auth.uid` para testar a migration isoladamente. **Não testa Supabase Auth real, JWT, PostgREST, magic link ou refresh de sessão**. Essas integrações exigem teste no Supabase local/staging em P2. Não confundir integração da migration com teste do fornecedor.

## Supabase local (P2)

Com Docker e CLI Supabase instalados, executar `supabase start` e `supabase db reset` somente no ambiente local descartável. A configuração usa portas 54321-54324 e signup/callbacks locais preparados pela P2. Docker/CLI não estavam disponíveis nesta execução. A aplicação remota, tipos gerados, Auth e RLS via Data API seguem pendentes. Procedimento: `p2-setup.md`.

Nunca executar reset ou migrations destrutivas em projeto remoto sem revisão e backup. `TEST_DATABASE_URL` é reservado para futuro teste contra banco descartável; nenhum script da fundação usa essa variável.

## P1: interfaces e layouts

P1 adiciona `tests/e2e/p1.spec.ts`: radios por teclado, foco visível, loading/disabled, drawer com cancelar/aplicar e restauração de foco, tela curta de 360 × 480, layout de acesso, quatro prévias, limites de largura, menus, axe e 404 em produção. A suíte E2E totaliza 20 testes em development e 16 aprovados/4 omitidos em produção; as omissões são exemplos de componentes que não existem no build público. Evidências detalhadas em `verification.md`.

## Cobertura ainda necessária

Auth/cookies/refresh e dog CRUD via Supabase real; safety gate, catálogo/planner, consentimento/atribuição real, assessment anônimo/claim, webhooks Stripe, entitlement, check-ins, exportação/exclusão e admin. Testes desses recursos entram junto com sua fase. A CI local não prova que secrets, DNS, provedores, produção ou LGPD estejam prontos.

## P2: contratos, ações e RLS

`p2-contracts.test.ts` cobre redirects, origem, entrada de cães, limites e contexto anônimo. `p2-actions.test.ts` testa autorização de cada mutation, erros, retry e callback com fronteiras de fornecedor simuladas. `p2-rls.test.ts` executa as duas migrations, trigger/backfill, CRUD entre donos, ownership/timestamps imutáveis, atribuição e acesso anônimo. `p2.spec.ts` valida formulário a 360px/desktop, callback inválido e persistência local na tela de acesso. O smoke inicia seu servidor com variáveis Supabase vazias para não enviar e-mails reais; não reutilizar um servidor conectado na porta 3100 para essa suíte. Todos os testes que dependem do fornecedor real permanecem explicitamente pendentes em `p2-acceptance.md`.
