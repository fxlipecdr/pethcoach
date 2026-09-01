# P2 — implementação e aceite

P2 concluída e aceita em 01/09/2026. O aceite combina Supabase hospedado real para o fluxo principal/RLS e a stack local descartável para expiração e falhas controladas. Isso libera o início técnico da P3, mas não libera a plataforma para clientes.

## Implementado

- Migrations incrementais: profiles com onboarding_source protegido; backfill e trigger privado; dogs com dados opcionais; estrutura inicial de attribution_touches sem captura.
- RLS forçada, grants por coluna, ownership imutável, timestamps no banco, cascata ao remover auth.users. Nenhuma service role no cliente ou nas mutations.
- Acesso por magic link PKCE com criação de conta, retorno interno validado, callback sem cache e sessão confirmada pelo Auth. Logout do navegador e invalidação da área privada.
- `/app`, `/app/caes`, `/app/caes/novo`, `/app/caes/[dogId]`, `/app/conta`: consultas reais autenticadas, cadastro/edição, estados vazios, erro e sucesso. Nenhum cão fictício nessas rotas.
- Identidade do tutor confirmada em cada Server Action; atualização filtra ID e dono. UUID estável do formulário evita duplicação no reenvio da mesma criação.
- Formulários controlados preservam campos em falhas; validação Zod, labels, foco em erro, feedback anunciado e botões de carregamento.
- Contexto anônimo local versionado, validado e limitado a sete dias, preservado no login. Apenas identificador aleatório e preferência de problema; não contém dados do cão, e-mail ou respostas. Não concede ownership nem claim de assessment.
- `/dev/perfil-cao`: prévia de formulário vazia com validação local explícita, sem autenticação fictícia nem gravação; 404 em produção.
- Cores e logo continuam configuráveis, sem alteração da identidade definitiva.

## Verificações locais

- `pnpm verify`: aprovado, incluindo lint, tipos e 52 testes em sete arquivos.
- Smoke completo de desenvolvimento: 26 aprovados em desktop 1440 px e mobile 360 px; axe sem violações nas telas exercitadas.
- Build final de produção: aprovado, incluindo cookies Secure para origens HTTPS e logs de acesso/formulários desativados.
- Revalidação específica da P2 em desenvolvimento: seis testes aprovados após os últimos ajustes.
- Smoke do bundle de produção: 22 aprovados e quatro omitidos (exemplos exclusivos de development). Prévias, inclusive `/dev/perfil-cao`, retornam 404.
- Imagens do formulário revisadas em desktop/mobile. Prévias identificadas como locais, sem gravação.

A suíte de banco executa as duas migrations sobre PostgreSQL/PGlite; emula apenas auth.users/auth.uid. Os testes de ações usam fronteiras de provedor simuladas explicitamente; não são evidência de envio de e-mail ou sessão real. Uma execução paralela esgotou a memória do Windows; Vitest foi limitado a um worker e a execução completa seguinte passou. Houve também falha de recursos do Windows (1450) em uma checagem extra de dev, sem ausência real da dependência apontada. As verificações finais foram executadas isoladamente, com heap Node limitado a 512 MB no processo do comando, e passaram. Nenhuma dependência foi removida nem teste desabilitado para contornar a falha.

## Configuração externa e verificações remotas

Em 31/08/2026, criado o projeto dev, aplicadas as duas migrations com histórico, conectado SMTP Resend e publicados templates PT-BR no Supabase. RLS forçada confirmada nas três tabelas. Data API anônima bloqueada com HTTP 401/42501. Testes em PostgreSQL remoto de ownership, CRUD, grants e bloqueio anônimo aprovados com rollback, sem usuários persistidos. Ver `docs/external-services.md` e `supabase/tests/p2_remote_rls.sql`.

O aceite real no navegador avançou com duas contas próprias de teste. Ambas receberam o template PT-BR e concluíram o callback PKCE no mesmo Edge. A conta A manteve sessão após nova aba/reload, criou um cão só com nome, completou os campos e confirmou persistência. Depois do logout, `/app` voltou a exigir login. A conta B iniciou com lista vazia, recebeu 404 ao abrir diretamente o UUID do cão A e criou somente o próprio cão. O replay do link usado, sem sessão, terminou em `/entrar?error=link` com mensagem segura para pedir novo acesso. Nenhum token ou URL de autenticação foi persistido em documentação.

Essa prova cobre Auth real, sessão SSR, CRUD pelo app e isolamento observado com JWTs reais nas rotas do produto. Em 01/09/2026, `pnpm test:p2:live` repetiu PKCE com as duas contas em clientes independentes e validou diretamente a Data API: leitura cruzada retornou vazio; update e delete do cão alheio não afetaram linhas; insert com `owner_id` alheio falhou; mudanças de `owner_id` e `created_at` foram negadas; o registro A permaneceu íntegro. Os dois registros sacrificiais foram removidos pelos respectivos donos no final. Tokens e links ficaram somente em memória/entrada interativa e não foram gravados em arquivo ou documentação. Em seguida, a Vercel recebeu as três variáveis públicas somente em Production, um novo deploy habilitou o formulário de Auth em `coach.peth.com.br` e o responsável confirmou login/callback corretos nesse domínio.

## Fechamento do aceite

- Docker 29.6.1 e Supabase CLI 2.116.0 iniciaram a stack descartável, reaplicaram as migrations e geraram `lib/supabase/database.generated.types.ts`. A comparação confirmou todas as tabelas/colunas. Como pg-meta não infere `CHECK` constraints nem grants por coluna, `database.types.ts` deriva do arquivo gerado e estreita enums e payloads; attribution permanece sem escrita pelo cliente.
- `pnpm test:p2:session` criou uma conta descartável por PKCE/Mailpit sem service role. Com TTL local de 120 segundos, a Data API recusou o JWT após a expiração natural e a tolerância de 30 segundos; refresh válido restaurou o usuário, refresh inválido não criou sessão e uma falha de rede simulada também falhou fechada.
- Outro navegador/replay já havia sido rejeitado com mensagem segura no aceite hospedado. O login no deployment da Vercel confirmou o caminho feliz de produção; os casos destrutivos/de falha ficaram restritos ao ambiente local descartável.

Procedimento concreto: `docs/p2-setup.md`. O aceite hospedado é repetível por `pnpm test:p2:live`; o local por `pnpm test:p2:session` após `pnpm exec supabase start`. Nenhum deles usa service role. Google é opcional e permanece desativado. As variáveis públicas existem em `.env.local`, ignorado pelo Git, e somente no ambiente Production da Vercel; Preview não aponta para o banco de desenvolvimento. Preços, webhooks e cobrança continuam pendentes. P2 concluída não representa release comercial.
