# P15 — Release candidate

Fase **em andamento**, com a maior parte concluída em 05/09/2026. O que dependia apenas de código foi entregue e verificado; o que dependia de contas externas foi configurado pelo responsável e validado em produção. Resta staging, sourcemaps do Sentry, backup no Supabase remoto e o beta controlado.

Uma observação que atravessa toda a fase: **três defeitos relevantes foram encontrados testando à mão, não pela suíte** — a região do banco provisionada em Ohio, o texto de assinatura cancelada e o `git push` que não publicava. Nenhum deles apareceria em teste automatizado, e os três foram convertidos em documentação ou regressão depois de descobertos.

## Entregue: performance do bundle

O JavaScript de primeira carga foi medido contra o build de produção real — subindo `pnpm start` e somando os `<script src>` que cada rota entrega, bruto e comprimido.

| Rota | Antes | Depois | Redução |
|---|---|---|---|
| `/` (landing) | 1192 KB · 340 KB comprimido | **705 KB · 223 KB** | −41% bruto |
| `/app` | 1046 KB · 298 KB comprimido | **676 KB · 213 KB** | −35% bruto |
| `/entrar` | 1009 KB · 286 KB comprimido | 1004 KB · 284 KB | inalterado |

`/entrar` praticamente não mudou porque o formulário de acesso valida e-mail no cliente com Zod — uso legítimo, que continua.

### Zod saiu do caminho crítico

O achado principal: `lib/env/schema.ts` valida o ambiente com Zod, e `getPublicEnv()` era chamado **no navegador** por `lib/posthog/client.ts`, `lib/supabase/browser.ts` e `instrumentation-client.ts`. Ou seja, toda página carregava o Zod para validar valores que o Next já havia congelado como literais durante o build — validação que não protege nada em tempo de execução no cliente.

`lib/env/public-client.ts` passou a fazer essa leitura sem Zod, reproduzindo apenas a normalização do schema (string vazia vira `undefined`, para que `if (!env.X)` continue idêntico). A validação segue existindo no servidor, via `getPublicEnv`, que é onde configuração errada precisa falhar cedo.

Dois caminhos menores foram fechados junto:

- `features/analytics/contracts.ts` guarda os schemas Zod, e `attribution.ts` importava dali apenas a constante `ALLOWED_CLICK_IDS`. Como o banner de consentimento roda em toda página, esse import de valor arrastava o módulo inteiro. A constante virou `features/analytics/click-ids.ts`, com reexport para não quebrar quem já importava de `contracts`.
- `lib/posthog/client.ts` carrega `eventSchemas` por import dinâmico dentro de `capture`. A lista estrita de propriedades é uma proteção de privacidade e continua valendo; ela só não precisa estar no bundle inicial, já que nada ali roda antes do consentimento e de uma interação.

### Motion trocado por CSS

O pacote `motion` custava ~131 KB brutos para uma única transição de 180 ms na prévia do produto — contra o que o próprio `DESIGN.md` pede em §30 ("usar preferencialmente CSS transitions") e §37 ("não utilizar dezenas de bibliotecas apenas para estética").

A troca de etapa agora usa `@keyframes preview-stage-in` em `app/globals.css`. A mudança de `key` no elemento já remontava o bloco, então a animação CSS reinicia sozinha, e `prefers-reduced-motion` é atendido pela regra global que desliga toda animação. Com isso saíram também o `useSyncExternalStore` e os três helpers de preferência de movimento do componente. A dependência foi removida do `package.json`.

`tests/e2e/design-system.spec.ts` continua verificando as trocas de etapa com movimento reduzido emulado.

## Entregue: E2E do funil real

`pnpm e2e:funnel` (`playwright.funnel.config.ts`, testes em `tests/e2e-funnel/`) sobe a aplicação apontando para a stack local do Supabase: Auth real, Postgres real com RLS ativa e Mailpit no lugar do provedor de e-mail. Diferente do smoke offline, que limpa as credenciais de propósito, aqui os fornecedores existem. Nenhum serviço externo é acionado.

São seis testes:

**Acesso.** Magic link de verdade: o formulário envia, o e-mail chega ao Mailpit, o link de verificação do Auth é aberto e a sessão nasce daí. Nada de cookie escrito à mão. Cobre também que o perfil é criado pelo gatilho de P2 e que sair encerra o acesso.

**Funil completo.** Landing do problema → quiz com as 10 perguntas publicadas → gate de segurança avaliado no banco → resultado CONTINUE → criação de conta a partir do resultado → perfil do cão → vínculo da avaliação → geração do plano → conclusão de um exercício do Dia 1 → painel refletindo o progresso.

O quiz responde sempre a primeira alternativa, e isso não é arbitrário: nenhuma primeira opção do catálogo carrega tag de risco em `rules_json.optionTags`, então o desfecho CONTINUE é determinístico. Se alguém marcar uma primeira opção como risco, o teste falha no lugar certo — no resultado do gate.

O plano é gerado pelo **fallback determinístico**, porque não há chave de IA no ambiente de teste. É de propósito: esse é o caminho que precisa funcionar em produção quando o provedor cai.

**Billing.** Não há como abrir um checkout sem chaves do Stripe, mas o ponto crítico de segurança é o outro — o acesso pago só pode nascer de webhook com assinatura válida. Isso é verificável localmente, porque `constructEvent` do Stripe é HMAC puro e não chama a API deles. O teste cobre assinatura forjada (400, nada concedido), assinatura válida (entitlement `full_program` ativo), reenvio do mesmo evento (não duplica) e o reflexo na conta do tutor.

**Readiness.** Ver abaixo.

### Pré-requisito

`pnpm exec supabase start`. As chaves da stack local são as publicamente documentadas do CLI, iguais em qualquer máquina; ficam no config do Playwright e nunca em `.env.local` ou na Vercel.

## Entregue: readiness protegido

O runbook pedia readiness protegido ao ligar fornecedores. `GET /api/ready` responde o estado de cada dependência — banco (com latência medida), pagamentos, e-mail e planner de IA — como `ok`, `degradado` ou `ausente`.

Três garantias, cobertas por teste: exige `CRON_SECRET` (401 sem ele, 404 quando o segredo nem está configurado, para não virar inventário público de fornecedores); **nunca revela configuração** — o teste falha se aparecer qualquer URL ou chave na resposta; e só o banco derruba a prontidão, porque o resto tem caminho de contingência.

## Entregue: ensaio de backup e restore

Feito de verdade contra a stack local, não descrito no papel. E foi o ensaio que mostrou o problema.

**A primeira tentativa produziu um banco quebrado.** `pg_dump --data-only` incluindo o schema `auth`, executado como `postgres`, gerou 89 erros de `must be owner of table`: os comandos `DISABLE TRIGGER` falharam, os gatilhos permaneceram ativos durante o restore e o banco resultante ficou sutilmente inconsistente. As contagens batiam — 18 usuários, 5 cães, 4 planos, 96 tarefas — mas a área pessoal passou a responder "Não conseguimos carregar seus dados". Conferir contagem não é conferir restore.

**O procedimento que funciona** usa o dono do schema:

```
docker exec <container> pg_dump -U supabase_admin -d postgres   --data-only --schema=public --schema=auth --disable-triggers > backup.sql
docker exec -i <container> psql -U supabase_admin -d postgres < backup.sql
```

Zero erro no dump; no restore restam apenas quatro conflitos de chave duplicada em tabelas que as migrações já semeiam (`schema_migrations`, `problems` e catálogos). As contagens bateram e, o que importa de fato, **a suíte do funil passou inteira contra o banco restaurado**.

Lição para o runbook: um dump de aplicação não é caminho de recuperação se rodar com papel sem posse do schema `auth`, e a validação de um restore é executar o funil, não contar linhas.

## Verificação

`pnpm lint`, `pnpm verify`, `pnpm test:integration` (262 testes), `pnpm build`, `pnpm e2e:smoke` (68 testes offline em 1440px e 360px) e `pnpm e2e:funnel` (7 testes contra fornecedores reais) passam.

## Entregue: compra real em test mode, validada em produção — 05/09/2026

Com o Stripe configurado e as chaves publicadas na Vercel, o caminho de pagamento foi validado em `coach.peth.com.br`, não apenas em teste local.

**Rejeição, verificada de fora antes da compra.** Uma requisição ao webhook sem assinatura responde 400 ("assinatura ausente") e uma com assinatura forjada responde 400 do próprio SDK do Stripe ("no signatures found matching the expected signature"). Antes das chaves entrarem, a mesma requisição respondia 503 — o handler recusa operar sem segredo em vez de aceitar qualquer coisa. Ninguém libera acesso pago inventando um evento para essa URL.

**Concessão, verificada pela compra.** Compra com o cartão de teste `4242 4242 4242 4242` no checkout hospedado: o acesso ao programa completo liberou sozinho, sem intervenção. Isso fecha a cadeia inteira — checkout, evento assinado, `grantOrUpdateEntitlement` e abertura do paywall.

## Entregue: ciclo de vida da assinatura — e o bug que ele revelou

Portal de gestão, cancelamento e `past_due` foram exercitados no test mode. Os três funcionaram, mas o cancelamento expôs um defeito de comunicação.

**O que acontecia.** Cancelar pelo portal do Stripe não encerra o acesso na hora: o padrão é `cancel_at_period_end`, com a assinatura seguindo `active` até o fim do período pago. O acesso continuar está certo — a pessoa pagou por aquele período — e `getUserEntitlements` já respeitava `expires_at`, então o corte aconteceria mesmo se o `deleted` se perdesse.

O defeito estava na leitura. Sem guardar `cancel_at_period_end`, uma assinatura cancelada e uma que ia renovar ficavam idênticas no banco (`status = 'active'` com `expires_at` preenchido), e `/app/conta` anunciava **"Próxima renovação prevista para…"** a quem tinha acabado de cancelar. Num produto pago, isso vira chamado de suporte e desconfiança.

**A correção.** A migração `20260911000000_p15_cancel_at_period_end.sql` adiciona a coluna, o webhook passa a repassar o sinal que o Stripe já enviava e era descartado, e a conta passa a dizer *"Não haverá nova cobrança. Seu acesso continua até DD/MM."*, com o selo mudando para "Assinatura cancelada".

**A regressão ficou coberta.** `tests/e2e-funnel/billing.spec.ts` percorre os quatro estados contra o banco real — criada, cancelada no portal, `past_due` e encerrada — e verifica tanto a linha em `entitlements` quanto o texto que o tutor lê, exigindo que "Próxima renovação" **não** apareça no estado cancelado.

**Lição.** O bug não apareceria em teste automatizado nenhum antes de existir alguém cancelando de verdade. Foi a segunda vez no dia em que testar à mão encontrou o que a suíte não encontrava — a primeira foi a região do banco.

## Entregue: monitoramento com Sentry — 05/09/2026

DSN configurado na Vercel e confirmado no bundle de produção (`o4512036167548928.ingest.us.sentry.io`). O `instrumentation-client.ts` só inicializa o SDK quando o DSN existe, então o custo é zero em ambiente sem monitoramento.

A redação de PII vinha pronta de fases anteriores e continua valendo: `scrubDiagnosticEvent` limpa o evento, `sendDefaultPii` é falso, e os handlers de `error` e `unhandledrejection` enviam **apenas uma mensagem genérica**, descartando payload, URL, stack e o texto de erro fornecido pelo navegador. É uma troca deliberada — menos detalhe em favor de não levar dado de tutor para dentro do Sentry.

### O que a configuração do Sentry revelou

A investigação do DSN ausente descobriu um problema maior: **`git push` não estava publicando**. A Vercel recusava com "couldn't find a Git account for the commit author", porque a conta do GitHub mantém o e-mail privado e os commits saíam com um endereço não vinculado. Como os deploys anteriores tinham sido feitos por *Redeploy* no painel — que é atribuído a quem está logado e escapa dessa checagem — a falha ficou invisível. Registrado em `docs/external-services.md`.

## Entregue: ensaio de rollback — 05/09/2026

Rollback de código exercitado em produção, não descrito no papel: publicar, promover o deploy anterior, conferir, promover de volta.

**O que faltava para o ensaio ser verificável.** Durante toda a preparação não havia como responder "qual versão está no ar?" sem garimpar o painel da hospedagem — e essa lacuna chegou a produzir uma conclusão errada nesta sessão, quando um deploy bloqueado passou por variável de ambiente ausente. `/api/ready` passou a devolver o campo `commit`, com o SHA curto lido de `VERCEL_GIT_COMMIT_SHA`. Fica atrás do `CRON_SECRET` por ser informação de operação, não de visitante.

**O procedimento, validado:**

1. `git push` publica sozinho e o `commit` do readiness passa a apontar para o SHA novo
2. *Deployments → deploy anterior → Promote to Production* devolve a versão antiga, confirmada pelo mesmo campo
3. Promover o deploy recente traz de volta

**Verificação pós-ensaio:** home, `/api/health`, `/entrar` e `/quiz/[slug]` em 200, `/api/ready` em 401 (vivo e protegido) e o DSN do Sentry ainda presente no bundle.

**Efeito colateral do dia:** o ensaio confirmou que o `git push` voltou a publicar automaticamente, depois da correção de autoria de commit. Até então, todo deploy dependia de alguém lembrar de clicar em *Redeploy*.

## Entregue: documentos legais e a instabilidade que eles revelaram — 05/09/2026

Política de privacidade e termos de uso passaram de aviso de desenvolvimento a documento com conteúdo real, com os dados factuais centralizados em `content/legal.ts`. `tests/e2e/legal.spec.ts` trava a presença do que a LGPD e o CDC exigem — controlador, encarregado, bases legais, prazos, operadores, transferência internacional, arrependimento de 7 dias e o limite de escopo veterinário — para que uma edição futura não devolva as páginas ao estado anterior sem ninguém notar. Detalhe do que ficou pendente em `docs/pre-revisao-conteudo-e-juridica.md`.

Em 05/09/2026 o controlador leu e aprovou os documentos jurídicos e o conteúdo comportamental, e decidiu seguir sem revisão de advogado e sem revisão por profissional de comportamento. Está registrado como risco assumido, não como revisão profissional: os itens correspondentes do checklist seguem desmarcados e `reviewed_by` dos 12 módulos permanece nulo.

Rodar a suíte completa depois disso expôs uma falha intermitente antiga em P8 e P10, que até então vinha sendo tratada como ruído. A causa é concreta: o `axe` lê a cor computada no instante em que roda, e os dois testes o chamam logo depois de clicar na aba "Dia 2". O chip do dia selecionado tem `transition-all duration-150`, então o `axe` media um quadro intermediário — chegou a registrar `#6c64d6` sobre `#e2e5e3`, 3,73:1 — quando em repouso o par é `#5344CE` sobre branco, **6,81:1**, folgado em AA.

Ou seja: não havia problema de contraste nenhum. Havia um teste medindo a interface em movimento.

A correção é `tests/e2e/settle.ts`, que espera as transições CSS assentarem antes de cada uma das 25 chamadas do `axe` na suíte. Espera só transições: animações declaradas com `animation` podem ser infinitas e nunca sairiam da lista. Duas execuções completas seguidas terminaram em 74/74.

A lição vale além deste caso: uma falha intermitente que passa quando reexecutada isolada continua sendo um defeito de alguma coisa. Aqui era do teste, e descobrir isso custou menos do que conviver com uma suíte em que uma falha vermelha não significa nada.

## Pendente para o aceite de P15

1. **Sourcemaps e alertas do Sentry.** Falta o `SENTRY_AUTH_TOKEN` para enviar sourcemaps; sem ele os erros aparecem com o código minificado. Faltam também as regras de alerta, para que um erro novo notifique alguém em vez de só ficar registrado.
2. **Staging.** Falta um ambiente separado do de validação atual. O rollback já está ensaiado; o que resta é ter onde validar antes de produção, e isso combina com a migração para o plano Pro, necessária de qualquer forma antes de vender.
3. **Backup e restore no projeto Supabase remoto.** O procedimento está validado localmente; no projeto gerenciado, prefira o backup do próprio Supabase (PITR) a um dump de aplicação.
4. **Beta controlado** e resolução de incidentes.

## Observação sobre o orçamento de performance

223 KB comprimidos na landing ainda incluem React e o runtime do Next, que respondem por boa parte do total. O que sobra de código próprio é modesto. Antes de perseguir mais bytes, vale medir o que o usuário sente — LCP e INP em rede real — porque a próxima economia relevante provavelmente está em imagem e fonte, não em JavaScript.
