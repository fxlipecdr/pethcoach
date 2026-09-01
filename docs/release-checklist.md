# Checklist de release

**Estado: P0-P3 concluídas tecnicamente. Não publicar como SaaS operacional.**

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

- [ ] P2-P14 concluídas e testadas.
- [x] Projeto Supabase descartável e Auth/callback reais testados.
- [x] RLS real via API para todas as tabelas pessoais existentes.
- [ ] Conteúdo e mensagens de segurança revisados por profissional qualificado.
- [ ] Checkout, webhook, portal e expiração/cancelamento em Stripe test.
- [ ] Consentimento, atribuição, e-mail e preferências verificados.
- [ ] Sentry, sourcemaps, alertas e redação de PII testados em staging.
- [ ] CSP completa com nonces/hashes compatíveis com SSR; rate limits distribuídos nos endpoints mutáveis.
- [ ] Termos, privacidade, controlador e canal de suporte revisados e reais.

## Antes de produção

- [ ] P15 e beta controlado concluídos; incidentes resolvidos.
- [x] Domínio próprio de validação configurado com DNS e HTTPS.
- [ ] Secrets por ambiente e hospedagem comercial apropriada.
- [ ] Indexação liberada apenas para landings prontas; conteúdo privado permanece noindex.
- [ ] Backup, restore e rollback ensaiados.
- [ ] Nenhum conteúdo draft acessível pelo planner.
- [ ] Exclusão/exportação e retenção exercitadas.

## Runbook inicial

`/api/health` comprova apenas que o processo HTTP está respondendo. Ao ligar fornecedores, adicionar readiness protegido e monitorar falhas/latência sem exibir configuração publicamente.

Rollback de código: reimplantar a última versão validada, verificar health e smoke. Banco: preferir migrations expansivas e compatíveis; não reverter migration destrutiva automaticamente. Snapshot/backup antes de operações irreversíveis. Um desligamento de IA deve usar fallback aprovado; sem catálogo aprovado, manter geração indisponível.

Existe um deploy remoto de validação no Hobby da Vercel em `https://coach.peth.com.br`, com DNS/HTTPS válidos e variáveis públicas do Supabase somente em Production, mas sem liberação comercial. Nenhuma compra de serviço foi realizada; migrar para hospedagem/plano comercial apropriado antes de vendas.
