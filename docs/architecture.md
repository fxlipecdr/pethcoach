# Arquitetura da fundação

## Escopo e fonte

Implementação inicial do Prompt Mestre (seção 24) e P0 (seção 25) do blueprint de 31/08/2026. O PDF orienta explicitamente não implementar todas as fases no primeiro run. O repositório anterior estava vazio. Um repositório Git próprio foi inicializado na pasta PethCoach, sem alterar o Git existente na pasta do usuário, na branch `codex/foundation`. Nenhum remote ou deploy foi criado.

## Decisões

- Next.js App Router com Server Components por padrão. Client Components somente em interações e SDKs de navegador.
- TypeScript strict e `noUncheckedIndexedAccess`. Zod nos boundaries de ambiente e formulário de demonstração.
- Tailwind v4 com tokens semânticos; paleta oficial PethCoach documentada em `ui-design.md`. Geist empacotada localmente, sem dependência do Google Fonts durante build ou navegação.
- Componentes próprios com padrão shadcn, CVA, `cn` e primitivas Radix para composição e gerenciamento de foco. Não foi instalado um pacote monolítico de UI.
- Sem chamadas OpenAI, Stripe ou Resend nesta etapa. Interfaces não fingem sucesso: retornam indisponibilidade tipada. As interfaces finais serão refinadas pelos contratos de P7/P10/P12.
- Ausência completa de envs é válida. Configuração parcial ou malformada de um serviço é erro. Mensagens de erro mostram apenas nomes das variáveis.
- PostHog não inicializa no import. Requer consentimento explícito e configuração completa. Sem autocapture ou replay. Nenhuma página o utiliza antes de P11.
- Sentry é opcional e sanitiza por allowlist. A fundação coleta somente metadados mínimos; enriquecimento seguro, sourcemaps e alertas ficam para observabilidade em staging.

## Dados e autorização

A baseline cria `profiles`; a migration P2 adiciona `dogs`, `attribution_touches`, onboarding_source protegido e criação automática do profile via trigger privado. A P4 adiciona `problems`, `quiz_questions`, `assessments` e rate limits no schema privado. `auth.users` é a identidade do Supabase. Colunas de permissão ou billing não são editáveis no perfil. RLS e grants impedem operações cruzadas, mudança de ownership, escrita de atribuição e acesso direto a assessments. A exclusão de conta será um fluxo revisado de P14; a API não permite excluir profiles diretamente.

Browser usa chave publishable e RLS. Server usa o mesmo contexto de usuário com cookies. Proxy renova tokens e desabilita cache das rotas com sessão. `requireUser()` confirma usuário via Auth; `requireAdmin()` consulta somente `app_metadata`, nunca `user_metadata`. Guards de layout protegem as telas-base, mas **cada futuro endpoint/action deve autorizar novamente**.

Não há client service role implementado: o segredo está apenas documentado para futuras operações administrativas autorizadas. Nunca usar segredo para contornar ownership/RLS.

O quiz público usa Route Handlers same-origin e RPCs `SECURITY DEFINER` com contratos estreitos. O navegador recebe um token HMAC em cookie HttpOnly/SameSite=Lax; o banco guarda somente seu SHA-256 e expiração. O localStorage contém apenas o UUID anônimo, problema, assessment e etapa. Os limites de criação, atualização e conclusão são atômicos no PostgreSQL e funcionam entre instâncias. `started_at` e `completed_at` são o registro canônico dos eventos; PostHog permanece inativo sem consentimento.

A P5 preserva a versão 1 do quiz e publica a versão 2 com dez perguntas. A conclusão chama o gate `p5-v1` na mesma transação, grava `safety_events` sem PII e persiste `CONTINUE`, `REFER` ou `BLOCK`; nenhum cliente escreve eventos ou status. Versões antigas continuam legíveis apenas pelos campos públicos do catálogo e pelo token do assessment. A tela de resultado valida o cookie no servidor e mostra somente mensagens fixas de segurança. Não há LLM, plano, cobrança ou claim nesse caminho.

## Rotas-base

Públicas: `/`, `/problemas/[slug]`, `/quiz/[slug]`, `/resultado/[assessmentId]`, `/entrar`, `/ajuda`, `/privacidade`, `/termos`, `/checkout/sucesso`.

Protegidas: `/app`, `/app/caes`, `/app/caes/novo`, `/app/caes/[dogId]`, `/app/planos/[planId]/hoje`, `/app/planos/[planId]/progresso`, `/app/historico`, `/app/conta`, `/admin`. Callback público `/auth/callback` só cria sessão após troca PKCE válida e confirmação do usuário no Auth.

Técnicas: `/api/health` (liveness somente; não implica readiness de fornecedores), `/api/assessments` e subrotas (criação, resposta e conclusão protegidas), `/dev/ui-kit` (404 fora de development), `/robots.txt` (bloqueado enquanto fundação).

## P1: apresentação e layouts

Sistema visual e marketing shell concluídos conforme `p1-acceptance.md`. `components/layouts/` separa os shells de acesso e workspace, navegação, cabeçalhos e larguras. As rotas `/app` e `/admin` continuam executando seus guards no servidor antes de renderizar os shells; os componentes visuais não autenticam nem autorizam.

`/dev/layouts/[layout]` aceita somente `auth`, `app`, `flow` e `admin`, com validação Zod e bloqueio fora de development. São fixtures de apresentação sem chamadas de dados ou sessões simuladas. O único estado interativo novo é local aos exemplos do UI kit, como a densidade de um cartão. Não há persistência ou requisição de negócio.

A P1 não altera a migration, Auth, adapters, consentimento ou billing. A identidade oficial foi integrada depois da validação da P3 sem alterar a semântica dos componentes.

## Documentação oficial conferida

P2 mantém os shells da P1 e adiciona Server Actions autenticadas, queries filtradas por owner e RLS, contexto anônimo local mínimo com validade de sete dias e prévia `/dev/perfil-cao` fechada em produção. A prévia não salva nem autentica. Login não apaga o contexto válido nem concede um claim de assessment. Limites por processo protegem os endpoints adicionais de desenvolvimento; a publicação com múltiplas instâncias exige armazenamento compartilhado. Migrations, testes locais e mocks do fornecedor não substituem o aceite real descrito em `p2-setup.md`.

- [Instalação Next.js](https://nextjs.org/docs/app/getting-started/installation)
- [Supabase clients SSR e refresh de cookies](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Tailwind com Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs)
- [Next.js instrumentation](https://nextjs.org/docs/app/guides/instrumentation)
- [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

As versões concretas instaladas estão em `package.json` e `pnpm-lock.yaml`. Não usar nomes/modelos/preços do PDF como confirmação de disponibilidade de API.
