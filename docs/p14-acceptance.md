# P14 — Segurança e privacidade

Fase **em andamento**. Este documento registra o que já está entregue e verificado, e o que ainda falta para o aceite. Nada aqui declara a fase concluída.

## Entregue

### Cabeçalhos de segurança

`next.config.ts` passou a enviar, em todas as respostas:

| Cabeçalho | Valor |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `X-Permitted-Cross-Domain-Policies` | `none` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` — somente em produção |

### Content Security Policy

Antes existiam três diretivas (`frame-ancestors`, `object-src`, `base-uri`). A política agora é montada por requisição em `proxy.ts`, a partir de `lib/security/csp.ts`:

```
default-src 'self'; script-src …; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:; font-src 'self' data:; connect-src …;
form-action 'self'; frame-ancestors 'none'; frame-src 'none';
object-src 'none'; base-uri 'self'; manifest-src 'self';
worker-src 'self' blob:; upgrade-insecure-requests
```

`connect-src` é derivado do ambiente: origem do Supabase (mais o `wss:` equivalente para Realtime), host do PostHog e origem do DSN do Sentry. Nenhum host é fixado no código, e origem ausente simplesmente não entra na lista.

**`frame-src` fechado** porque não há Stripe.js: o checkout é redirecionamento. **`script-src 'self'` cobre todo o JavaScript externo** porque PostHog e Sentry entram pelo bundle, não por tag de script.

#### Os dois modos de `script-src`

O Next emite um script inline de hidratação. Ele só recebe nonce quando a página é renderizada por requisição — em página estática o HTML vem do build e não existe nonce possível. Por isso:

| Modo | Rotas | `script-src` |
|---|---|---|
| Com nonce | `/app`, `/admin`, `/entrar`, `/auth`, `/quiz/*`, `/resultado/*`, `/unsubscribe` | `'self' 'nonce-…'` |
| Sem nonce | demais rotas públicas | `'self' 'unsafe-inline'` |

A área autenticada e o funil que manipula dado do tutor ficam sem `'unsafe-inline'`. As páginas de marketing, que não renderizam dado de usuário, mantêm `'unsafe-inline'` para preservar a renderização estática.

Isso foi verificado contra o build de produção, não só em desenvolvimento: `/termos`, `/privacidade`, `/`, `/ajuda` e `/problemas/[slug]` saem estáticas com scripts inline sem nonce; `/entrar`, `/quiz/[slug]`, `/app` e `/admin` saem com nonce e **zero** script inline sem nonce. `/checkout/sucesso` foi retirado da lista estrita justamente por essa verificação: é estática e teria a hidratação quebrada.

**Invariante frágil:** mover uma rota estrita para renderização estática quebra a hidratação em produção. `tests/e2e/foundation.spec.ts` verifica que toda tag de script inline de `/entrar` carrega nonce e que o `script-src` estrito não contém `'unsafe-inline'`. Ao adicionar rota a `strictPaths`, confirme no build que ela é `ƒ` (dinâmica).

### Verificação automatizada

`tests/e2e/foundation.spec.ts` cobre diretivas obrigatórias, os dois modos, presença do nonce no HTML das rotas estritas e rotação do nonce entre requisições. `pnpm verify`, `pnpm test:integration`, `pnpm build` e `pnpm e2e:smoke` passam (262 testes unitários e de integração, 68 e2e em 1440px e 360px, em 2 min).

O proxy passou a rodar em todas as rotas de documento para poder emitir a política, mas `updateSession` continua sendo chamado apenas em `/app`, `/admin`, `/entrar` e `/auth`. O matcher exclui `_next/`, `api/` e arquivos com extensão: o proxy roda em toda navegação, então cada invocação a mais é custo direto. As diretivas são compiladas uma vez por processo em `lib/security/csp.ts`; só o nonce varia por requisição.

### Direitos do titular (LGPD)

Decisão de produto de 05/09/2026: **exclusão por anonimização, preservando o registro de cobrança.**

**Portabilidade.** `GET /api/conta/exportar` devolve um JSON com anexo (`Content-Disposition`) contendo perfil, cães, avaliações, planos, tarefas, check-ins, marcos, adaptações, preferências de e-mail, acessos contratados e origem de visita. Todas as consultas usam o cliente autenticado do próprio titular (`features/profile/data-rights.ts`), então a RLS continua sendo a fronteira mesmo que um filtro seja esquecido. A rota recusa sessão ausente (401), conta já anonimizada (404) e passa por rate limit de 3 pedidos por minuto.

**Exclusão.** A função `public.anonymize_account()` (`security definer`, `search_path` fixo) opera exclusivamente sobre `auth.uid()` e nunca aceita id vindo do cliente. Ela apaga cães (que levam junto planos, tarefas, check-ins, marcos e adaptações por cascade), avaliações (que levam os `safety_events`), toques de atribuição, preferências e logs de e-mail; depois zera o nome do perfil e grava `profiles.deleted_at`.

Permanecem `billing_customers` e `entitlements`, por obrigação fiscal sobre pagamentos já realizados. Eles passam a apontar para um perfil sem nome, e o e-mail em `auth.users` é substituído por `removido+<id>@contas.invalido` com banimento, usando a chave de serviço. Sem a chave de serviço a anonimização dos dados acontece do mesmo jeito, mas o endereço permanece em `auth.users` até um operador concluir — isso está explícito no código.

**Fechamento de acesso.** Uma sessão válida em outro dispositivo não pode voltar ao app: `requireUser` consulta `profiles.deleted_at` e redireciona para `/entrar?conta=removida`. A tela de acesso, que normalmente devolve o usuário autenticado ao app, reconhece a conta anonimizada e mostra o aviso em vez de redirecionar — sem isso haveria laço de redirecionamento.

**Interface.** `/app/conta` ganhou o cartão "Seus dados": download direto e um diálogo de exclusão que exige digitar `EXCLUIR` e lista, lado a lado, o que é apagado e o que é mantido.

**Cuidado com o gate.** `deleteAccountConfirmation` precisou sair de `actions.ts` para `features/profile/contracts.ts`: um arquivo `"use server"` só pode exportar função assíncrona. `pnpm typecheck` e `pnpm lint` passam mesmo assim — só `pnpm build` (ou o servidor em execução) acusa. Vale rodar `pnpm build` antes de fechar qualquer fase que mexa em server actions.

**Verificação.** `tests/integration/p14-lgpd.test.ts` roda as migrações em PGlite e prova que a função exige usuário autenticado, remove o dado pessoal do titular, preserva `entitlements` e `billing_customers`, e não alcança o dado de outro usuário. `tests/unit/auth.test.ts` cobre a recusa de sessão em conta anonimizada.

### Limite de requisições compartilhado

O problema não era cobertura — magic link, callback, claim, perfil, cão e geração de plano já tinham limite. Era o **armazenamento**: `WindowLimiter` conta em memória e protege um processo só. Com várias instâncias, cada uma teria seu próprio contador, e o limite efetivo viraria o teto multiplicado pelo número de instâncias. A dívida estava anotada no próprio arquivo desde P0.

A contagem passou para o banco, que já era a fonte compartilhada usada pelo quiz desde P4. A tabela `private.assessment_rate_limits` foi renomeada para `private.rate_limits` — nunca foi específica de assessment — e `private.consume_assessment_rate_limit` foi recriada com a mesma assinatura, então os cinco chamadores em SQL continuam funcionando sem alteração.

`public.consume_action_rate_limit(p_action)` é a porta de entrada da aplicação. Ela deriva a chave de `auth.uid()` **dentro** da função e lê o teto de `private.rate_limit_rules`: quem chama escolhe a ação, nunca o balde nem o limite. Ação desconhecida nega em vez de liberar sem contar, e `anon` não tem grant de execução.

| Ação | Teto | Janela |
|---|---|---|
| `dog_write` | 30 | 60 s |
| `plan_generate` | 10 | 1 h |
| `plan_task_write` | 120 | 60 s |
| `checkin_write` | 30 | 60 s |
| `email_preferences_write` | 20 | 60 s |
| `profile_write` | 20 | 60 s |
| `account_export` | 3 | 60 s |
| `account_delete` | 3 | 5 min |
| `assessment_claim` | 20 | 60 s |

`consumeActionLimit` em `lib/security/rate-limit.ts` chama a RPC e, se o banco não responder, cai para a contagem em memória — pior proteger só a instância atual do que não proteger nada. Os mesmos valores vivem em `lib/security/rate-limit-rules.ts` para esse caminho, e o teste de integração falha se as duas listas divergirem.

Três ações passaram a ter limite pela primeira vez: conclusão de tarefa, check-in diário e preferências de e-mail. A geração de plano trocou 20/minuto por 10/hora, porque cada chamada aciona o provedor de IA. `WindowLimiter` continua em uso onde não existe `auth.uid()` para derivar a chave: envio de magic link e callback de autenticação.

### Auditoria de IDOR e bypass de entitlement

`tests/integration/p14-idor.test.ts` roda as migrações em PGlite e ataca o banco direto, sem passar por Server Action nenhuma. Para cada uma das dez tabelas com dono — `dogs`, `assessments`, `plans`, `plan_tasks`, `daily_checkins`, `plan_milestones`, `plan_adaptations`, `entitlements`, `billing_customers`, `email_preferences` — o usuário A tenta ler, alterar e apagar a linha do usuário B pelo id direto. São 35 verificações, todas passando.

Cobre também:

- **Forjar dono na escrita:** inserir plano com `user_id` de outro usuário é recusado pelo `with check` da política.
- **Bypass de paywall:** `authenticated` tem apenas `grant select` em `entitlements`, então o cliente não consegue criar nem reativar o próprio acesso pago. O entitlement só nasce de webhook verificado, como P10 previu.
- **Schema `private`:** `rate_limits` e `rate_limit_rules` são inalcançáveis pelo cliente.
- **`operator_roles`:** um usuário comum enxerga zero linhas.

O ponto mais sensível era `plan_tasks`, que não tem coluna de dono: a política resolve a propriedade por join em `plans`, e o teste confirma que o join fecha o acesso.

## Pendente para o aceite de P14

1. **Revisão jurídica** de privacidade e termos — trabalho humano, fora do escopo de código.
2. **Aplicar as migrações no projeto Supabase remoto.** As duas migrações de P14 já rodaram na stack local (`supabase start`), e os tipos foram regenerados a partir dela. Falta o `supabase db push` no projeto dev, que exige CLI autenticado e projeto vinculado.

## Migrações e tipos

As migrações `20260909000000_p14_lgpd_data_rights.sql` e `20260910000000_p14_shared_rate_limit.sql` foram aplicadas na stack local e verificadas contra Postgres real, não só contra o PGlite dos testes:

- `private.rate_limits` existe, `private.assessment_rate_limits` não existe mais e as nove regras estão semeadas.
- `profiles.deleted_at` existe.
- `public.consume_action_rate_limit('account_delete')` libera três vezes e nega a quarta; ação desconhecida nega.
- `public.anonymize_account()` apagou o cão, preservou o entitlement, zerou o nome e gravou `deleted_at`.

`pnpm db:types` foi executado com a stack ativa. O arquivo gerado estava parado na P2 — tinha 3 tabelas para um schema de 26 — e agora reflete o banco inteiro. Com isso, `deleted_at` e as duas funções novas passaram a vir da introspecção, e as definições que eu havia acrescentado à mão em `database.types.ts` foram removidas por redundância. `Functions` continua sendo mantido à mão nesse arquivo, então entradas novas de RPC ainda precisam ser declaradas ali.
