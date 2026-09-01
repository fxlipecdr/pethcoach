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

Docker 29.6.1 e Supabase CLI 2.116.0 executam a stack descartável nas portas 54321-54324. `pnpm db:types` gera a introspecção física; `pnpm test:p2:session` usa PKCE/Mailpit e cobre expiração natural, refresh válido/inválido e falha de rede. O TTL curto de 120 segundos existe somente nessa configuração local. O fluxo hospedado e a Data API com dois JWTs são cobertos separadamente por `pnpm test:p2:live` e pelas evidências manuais. Procedimento: `p2-setup.md`.

Nunca executar reset ou migrations destrutivas em projeto remoto sem revisão e backup. `TEST_DATABASE_URL` é reservado para futuro teste contra banco descartável; nenhum script da fundação usa essa variável.

## P1: interfaces e layouts

P1 adiciona `tests/e2e/p1.spec.ts`: radios por teclado, foco visível, loading/disabled, drawer com cancelar/aplicar e restauração de foco, tela curta de 360 × 480, layout de acesso, quatro prévias, limites de largura, menus, axe e 404 em produção. A suíte E2E totaliza 20 testes em development e 16 aprovados/4 omitidos em produção; as omissões são exemplos de componentes que não existem no build público. Evidências detalhadas em `verification.md`.

## Cobertura ainda necessária

Safety gate, catálogo/planner, consentimento/atribuição real, claim do assessment, webhooks Stripe, entitlement, check-ins, exportação/exclusão e admin. Testes desses recursos entram junto com sua fase. A CI local não prova que secrets, DNS, provedores, produção ou LGPD estejam prontos.

## P2: contratos, ações e RLS

`p2-contracts.test.ts` cobre redirects, origem, entrada de cães, limites e contexto anônimo. `p2-actions.test.ts` testa autorização de cada mutation, erros, retry e callback com fronteiras de fornecedor simuladas. `p2-rls.test.ts` executa as duas migrations, trigger/backfill, CRUD entre donos, ownership/timestamps imutáveis, atribuição e acesso anônimo. `p2.spec.ts` valida formulário a 360px/desktop, callback inválido e persistência local na tela de acesso. O smoke inicia seu servidor com variáveis Supabase vazias para não enviar e-mails reais; não reutilizar um servidor conectado na porta 3100 para essa suíte. Os aceites do fornecedor e da stack local estão registrados separadamente em `p2-acceptance.md`.

## P3: landings e SEO

`p3-content.test.ts` valida conteúdo exclusivo, duração, orientação baseada em recompensa, encaminhamento de segurança, metadata/canonical, sitemap e bloqueio de indexação. `p3.spec.ts` percorre as três landings em desktop e 360 px, verificando título, descrição, CTA único, aviso de indisponibilidade comercial e encaminhamento. O smoke totaliza 30 casos nos dois projetos; `robots.txt` permanece fechado e o sitemap fica vazio sem `NEXT_PUBLIC_SITE_URL`.

## P4: quiz e assessments anônimos

`p4-contracts.test.ts` cobre schemas, token assinado/expirado, hash, chave de rate limit, same-origin e persistência local sem respostas ou segredo. `p4-api.test.ts` cobre criação, retomada, mutation, cookie HttpOnly, origem inválida, token forjado e conclusão incompleta. `p4-assessments.test.ts` executa a migration completa no PGlite e valida catálogo publicado, grants/RLS, RPCs anônimas, respostas permitidas, expiração, idempotência e limites atômicos. `p4.spec.ts` percorre o quiz em desktop e 360 px, verifica uma pergunta por tela, retorno, reload, conclusão, axe e ausência de token/respostas no localStorage. O modo `E2E_QUIZ_UI_ONLY=1` apenas apresenta a interface em development; as requisições continuam interceptadas pelo teste e não constituem bypass de API.
