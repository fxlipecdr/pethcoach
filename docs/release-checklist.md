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
- [ ] Conteúdo e mensagens de segurança revisados por profissional qualificado. Pré-revisão técnica com achados e perguntas dirigidas em `docs/pre-revisao-conteudo-e-juridica.md`. O revisor fictício foi removido em 05/09/2026 pela migração `20260912000000_p15_revisor_real_do_catalogo.sql`: `reviewed_by` agora é nulo, e nulo significa sem revisão profissional.
  **Estado em 05/09/2026: risco assumido pelo controlador.** Felipe Cordeiro de Paula leu e aprovou o conteúdo comportamental e a copy de segurança na condição de responsável pela empresa. Não houve revisão por médico-veterinário nem por adestrador com credencial em reforço positivo, e por isso `reviewed_by` permanece nulo — a coluna registra profissional, não aprovação do controlador. Os 12 módulos seguem `published`. Este item continua desmarcado porque o que ele exige é revisão profissional, que não ocorreu; a decisão de lançar assim é do controlador e está registrada aqui.
- [ ] Checkout, webhook, portal e expiração/cancelamento em Stripe test. **Bloqueado em 06/09/2026: a conta Stripe está com aprovação pendente para cobrança real.** Nenhuma venda de verdade é possível até o Stripe liberar, e nada no código contorna isso. Enquanto pendente, verificar se o painel do Stripe aguarda algum documento do lojista, e se a página pública de planos existe — o revisor abre o site para confirmar o que é vendido e por quanto. **Checkout hospedado, webhook assinado e concessão de acesso validados em produção em 05/09/2026** com o cartão de teste; idempotência coberta por `pnpm e2e:funnel`. **Portal, cancelamento e `past_due` validados no test mode em 05/09/2026**, com regressão automatizada em `pnpm e2e:funnel`.
- [ ] Consentimento, atribuição, e-mail e preferências verificados.
- [ ] Sentry, sourcemaps, alertas e redação de PII testados em staging. **DSN em produção desde 05/09/2026**, com redação de PII já implementada; faltam sourcemaps (`SENTRY_AUTH_TOKEN`) e configuração de alertas.
- [x] CSP completa com nonces/hashes compatíveis com SSR; rate limits distribuídos nos endpoints mutáveis. Detalhes em `docs/p14-acceptance.md`.
- [ ] Termos, privacidade, controlador e canal de suporte revisados e reais. **Escritos e publicados em 05/09/2026**, com controlador, encarregado, bases legais, prazos de retenção, operadores, transferência internacional e o direito de arrependimento do art. 49 do CDC; dados factuais centralizados em `content/legal.ts` e presença travada por `tests/e2e/legal.spec.ts`. **Estado em 05/09/2026: risco assumido pelo controlador.** Felipe Cordeiro de Paula leu e aprovou os dois documentos como responsável pela empresa. Não houve revisão por advogado: o texto é redação técnica fiel ao que o sistema faz. Este item continua desmarcado porque o que ele exige é revisão profissional; a decisão de publicar assim é do controlador e está registrada aqui. Falta também operar o processo de reembolso quando houver o primeiro pedido.

Revisão geral de 05/09/2026, com método e achados: `docs/revisao-geral.md`.

## Antes de produção

- [ ] P15 e beta controlado concluídos; incidentes resolvidos.
- [x] Domínio próprio de validação configurado com DNS e HTTPS.
- [ ] Secrets por ambiente e hospedagem comercial apropriada. **Decisão do controlador em 06/09/2026: a migração da Vercel para o plano Pro acontece depois da primeira venda.** O plano Hobby não autoriza uso comercial, então existe uma janela — entre a primeira venda e a migração — em que o produto opera fora dos termos da hospedagem. Risco conhecido e assumido; o gatilho da migração é a primeira venda.
- [ ] Indexação liberada apenas para landings prontas; conteúdo privado permanece noindex.
- [x] Backup, restore e rollback ensaiados. Backup e restore na stack local com procedimento validado e modo de falha documentado; **rollback de deploy exercitado em produção em 05/09/2026**, com `/api/ready` informando o commit publicado. Falta ensaiar backup no projeto Supabase remoto.
- [ ] Nenhum conteúdo draft acessível pelo planner.
- [ ] **Situação fiscal compatível com a venda.** O CNAE principal do CNPJ 68.660.298/0001-08 é 4789-0/04 (comércio varejista de animais e artigos para pets), não serviço digital; a inclusão do CNAE adequado precisa acontecer **antes da primeira nota fiscal**, não antes do lançamento do site. O enquadramento MEI tem teto anual de receita, com migração para LTDA planejada: acompanhar o faturamento para migrar antes de estourar, sob pena de cobrança retroativa. Detalhe em `docs/proximos-passos.md`, seção 6.
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
