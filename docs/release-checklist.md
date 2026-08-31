# Checklist de release

**Estado: fundação e P1 concluídas. Não publicar como SaaS operacional.**

## Fundação

- [x] Estrutura do projeto, AGENTS e docs.
- [x] Clients/envs e adapters sem credenciais obrigatórias.
- [x] RLS e grants da baseline, com testes de isolamento.
- [x] Home e UI kit acessível para validação.
- [x] CI com lint, tipos, unitários, integração, build e E2E.
- [x] Ausência de fornecedor não concede autenticação, plano ou compra.
- [x] P1: componentes, estados, layouts, teclado/foco, 360px/desktop e prévias fechadas em produção.

## Antes de staging funcional

- [ ] P2-P14 concluídas e testadas.
- [ ] Projeto Supabase descartável e Auth/callback reais testados.
- [ ] RLS real via API para todas as tabelas pessoais.
- [ ] Conteúdo e mensagens de segurança revisados por profissional qualificado.
- [ ] Checkout, webhook, portal e expiração/cancelamento em Stripe test.
- [ ] Consentimento, atribuição, e-mail e preferências verificados.
- [ ] Sentry, sourcemaps, alertas e redação de PII testados em staging.
- [ ] CSP completa com nonces/hashes compatíveis com SSR; rate limits distribuídos nos endpoints mutáveis.
- [ ] Termos, privacidade, controlador e canal de suporte revisados e reais.

## Antes de produção

- [ ] P15 e beta controlado concluídos; incidentes resolvidos.
- [ ] Domínio próprio, secrets por ambiente e hospedagem comercial apropriada.
- [ ] Indexação liberada apenas para landings prontas; conteúdo privado permanece noindex.
- [ ] Backup, restore e rollback ensaiados.
- [ ] Nenhum conteúdo draft acessível pelo planner.
- [ ] Exclusão/exportação e retenção exercitadas.

## Runbook inicial

`/api/health` comprova apenas que o processo HTTP está respondendo. Ao ligar fornecedores, adicionar readiness protegido e monitorar falhas/latência sem exibir configuração publicamente.

Rollback de código: reimplantar a última versão validada, verificar health e smoke. Banco: preferir migrations expansivas e compatíveis; não reverter migration destrutiva automaticamente. Snapshot/backup antes de operações irreversíveis. Um desligamento de IA deve usar fallback aprovado; sem catálogo aprovado, manter geração indisponível.

Nenhum deploy remoto, configuração de conta externa ou compra de serviço foi realizado nesta etapa.
