# P15 — Release candidate

Fase **em andamento**. Boa parte de P15 depende de credenciais e infraestrutura externas (Stripe test, projeto Supabase remoto, staging na Vercel, Sentry), que não são acessíveis a partir do repositório. Este documento registra o que foi possível fechar sem elas.

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

`pnpm lint`, `pnpm verify`, `pnpm test:integration` (262 testes), `pnpm build`, `pnpm e2e:smoke` (68 testes offline em 1440px e 360px) e `pnpm e2e:funnel` (6 testes contra fornecedores reais) passam.

## Entregue: compra real em test mode, validada em produção — 05/09/2026

Com o Stripe configurado e as chaves publicadas na Vercel, o caminho de pagamento foi validado em `coach.peth.com.br`, não apenas em teste local.

**Rejeição, verificada de fora antes da compra.** Uma requisição ao webhook sem assinatura responde 400 ("assinatura ausente") e uma com assinatura forjada responde 400 do próprio SDK do Stripe ("no signatures found matching the expected signature"). Antes das chaves entrarem, a mesma requisição respondia 503 — o handler recusa operar sem segredo em vez de aceitar qualquer coisa. Ninguém libera acesso pago inventando um evento para essa URL.

**Concessão, verificada pela compra.** Compra com o cartão de teste `4242 4242 4242 4242` no checkout hospedado: o acesso ao programa completo liberou sozinho, sem intervenção. Isso fecha a cadeia inteira — checkout, evento assinado, `grantOrUpdateEntitlement` e abertura do paywall.

## Pendente para o aceite de P15

1. **Portal de gestão e ciclo de vida da assinatura.** A compra avulsa está provada. Faltam, todos possíveis no test mode: abrir o portal do cliente, cancelar uma assinatura e conferir a perda de acesso, e simular `invoice.payment_failed` para o estado `past_due`.
2. **Sentry.** Ainda não configurado: o DSN não aparece no bundle de produção. Sem ele, erro em produção não gera aviso para ninguém.
3. **Staging e rollback ensaiados.** Depende de um ambiente separado do de validação atual. O `/api/ready` já está no ar e protegido, pronto para ser o alvo da checagem pós-deploy.
4. **Backup e restore no projeto Supabase remoto.** O procedimento está validado localmente; no projeto gerenciado, prefira o backup do próprio Supabase (PITR) a um dump de aplicação.
5. **Beta controlado** e resolução de incidentes.

## Observação sobre o orçamento de performance

223 KB comprimidos na landing ainda incluem React e o runtime do Next, que respondem por boa parte do total. O que sobra de código próprio é modesto. Antes de perseguir mais bytes, vale medir o que o usuário sente — LCP e INP em rede real — porque a próxima economia relevante provavelmente está em imagem e fonte, não em JavaScript.
