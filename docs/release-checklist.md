# Checklist de release

**Estado: P0-P14 concluídas tecnicamente; P15 em andamento. Não publicar como SaaS operacional.**

## Fundação

- [x] Estrutura do projeto, AGENTS e docs.
- [x] Clients/envs e adapters sem credenciais obrigatórias.
- [x] RLS e grants da baseline, com testes de isolamento.
- [x] Home e UI kit acessível para validação.
- [x] CI com lint, tipos, unitários, integração, build e E2E.
- [x] Ausência de fornecedor não concede autenticação, plano ou compra.
- [x] P1: componentes, estados, layouts, teclado/foco, 360px/desktop e prévias fechadas em produção.
- [x] P2: Auth/cães/RLS aceitos no projeto dev e em stack descartável.
- [x] P3: landings, metadata, OG, canonical condicional e sitemap de páginas prontas validados com `noindex` preservado.
- [x] Logo e paleta oficiais integradas nos componentes compartilhados e validadas em desktop/360px.

## Antes de staging funcional

- [x] P2-P14 concluídas e testadas, exceto a revisão jurídica e profissional listada abaixo.
- [x] Projeto Supabase descartável e Auth/callback reais testados.
- [x] RLS real via API para todas as tabelas pessoais existentes.
- [ ] Conteúdo e mensagens de segurança revisados por profissional qualificado.
- [ ] Checkout, webhook, portal e expiração/cancelamento em Stripe test. Webhook assinado, concessão de acesso e idempotência já cobertos por `pnpm e2e:funnel`; falta o checkout hospedado e o portal.
- [ ] Consentimento, atribuição, e-mail e preferências verificados.
- [ ] Sentry, sourcemaps, alertas e redação de PII testados em staging.
- [x] CSP completa com nonces/hashes compatíveis com SSR; rate limits distribuídos nos endpoints mutáveis. Detalhes em `docs/p14-acceptance.md`.
- [ ] Termos, privacidade, controlador e canal de suporte revisados e reais.

## Antes de produção

- [ ] P15 e beta controlado concluídos; incidentes resolvidos.
- [x] Domínio próprio de validação configurado com DNS e HTTPS.
- [ ] Secrets por ambiente e hospedagem comercial apropriada.
- [ ] Indexação liberada apenas para landings prontas; conteúdo privado permanece noindex.
- [x] Backup e restore ensaiados na stack local, com procedimento validado e modo de falha documentado em `docs/p15-acceptance.md`. Falta ensaiar no projeto remoto e o rollback de deploy.
- [ ] Nenhum conteúdo draft acessível pelo planner.
- [x] Exclusão e exportação de dados implementadas e exercitadas contra Postgres real; retenção de e-mail segue de P12.

## Orçamento de performance

Medido contra o build de produção em 05/09/2026, somando os scripts de primeira carga por rota: landing 705 KB brutos / 223 KB comprimidos; área logada 676 KB / 213 KB. Regressão acima disso deve ser investigada antes de release. Método e histórico em `docs/p15-acceptance.md`.

## Runbook inicial

`/api/health` comprova apenas que o processo HTTP está respondendo. `GET /api/ready`, protegido por `CRON_SECRET`, informa o estado de banco, pagamentos, e-mail e planner de IA sem revelar configuração — é o alvo da checagem pós-deploy e pós-rollback. Sem `CRON_SECRET` configurado ele devolve 404.

**Backup e restore.** Procedimento validado em 05/09/2026 contra a stack local. Use o dono do schema, não `postgres`:

```
pg_dump -U supabase_admin -d postgres --data-only   --schema=public --schema=auth --disable-triggers > backup.sql
psql -U supabase_admin -d postgres < backup.sql
```

Com papel sem posse do schema `auth`, os comandos `DISABLE TRIGGER` falham em silêncio, os gatilhos disparam durante a carga e o banco fica inconsistente mesmo com as contagens corretas. **Validar restore é rodar `pnpm e2e:funnel` contra o banco restaurado**, não conferir contagem de linhas. No projeto gerenciado, prefira o backup do próprio Supabase a um dump de aplicação.

Rollback de código: reimplantar a última versão validada, verificar health e smoke. Banco: preferir migrations expansivas e compatíveis; não reverter migration destrutiva automaticamente. Snapshot/backup antes de operações irreversíveis. Um desligamento de IA deve usar fallback aprovado; sem catálogo aprovado, manter geração indisponível.

Existe um deploy remoto de validação no Hobby da Vercel em `https://coach.peth.com.br`, com DNS/HTTPS válidos e variáveis públicas do Supabase somente em Production, mas sem liberação comercial. Nenhuma compra de serviço foi realizada; migrar para hospedagem/plano comercial apropriado antes de vendas.
