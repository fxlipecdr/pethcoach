# Configuração externa — 31/08/2026

Destino informado: `coach.peth.com.br`. Remetente: `PethCoach <suporte@peth.com.br>`. Repositório privado: https://github.com/fxlipecdr/pethcoach.

## Estado verificado

| Serviço | Configurado | Falta |
| --- | --- | --- |
| Supabase Free | Organização PethCoach, projeto `pethcoach-dev`, migrations aplicadas, Auth por e-mail, SMTP, callbacks e templates PT-BR; PKCE/CRUD/logout/replay e isolamento pelo app passaram com duas contas reais | Repetir RLS diretamente pela Data API com os dois JWTs, exercitar refresh/expiração/falhas e comparar tipos gerados |
| Resend | `peth.com.br` verificado; chave `PethCoach Auth Dev` restrita a envio; SMTP autenticado; três e-mails reais de acesso entregues no total | Exercitar expiração/falhas; retenção e webhooks pertencem à P12 |
| Stripe | Sandbox `acct_1UAZB3LaePxLnVtP` acessível no painel; modo de teste ativo; nenhum produto/preço ou webhook | Preços definidos pelo responsável, Checkout e webhook assinado na P10; ativação comercial posterior |
| Vercel | Projeto `pethcoach` na equipe `pethdeveloper-3373s-projects`, plano Hobby, GitHub conectado, primeiro deploy `READY` e `coach.peth.com.br` com configuração válida/HTTPS | Configurar envs somente quando o aceite exigir e migrar para Pro antes da operação comercial |
| DNS | Cloudflare confirmada; `coach` aponta por CNAME DNS-only para o destino exclusivo do Vercel; Zoho continua recebendo os e-mails do domínio | Monitorar renovação TLS e manter o registro sem proxy enquanto o Vercel exigir |
| GitHub | Repositório privado, remote `origin`, código enviado à `main`, SHA remoto conferido e quality gates aprovados no Actions | Não há credenciais no repositório; manter a CI obrigatória nos próximos incrementos |

## Supabase

- Organização: `qcjalvyabqpxjxokgvjz`.
- Projeto: `cvxqvfsebpdyshxpoqdj`; URL: `https://cvxqvfsebpdyshxpoqdj.supabase.co`.
- Região efetiva confirmada pelo painel e pelo pooler: **Ohio, `us-east-2`**. A seleção inicial de São Paulo não foi a região efetivamente provisionada; não houve recriação automática. Reavaliar região antes de produção, quando ainda não houver dados de clientes.
- Site URL atual de desenvolvimento: `http://127.0.0.1:3000`.
- Callbacks autorizados: `http://127.0.0.1:3000/auth/callback**`, `http://127.0.0.1:3100/auth/callback**` e `https://coach.peth.com.br/auth/callback**`. Autorizar o callback não publica o domínio.
- Email habilitado, signup habilitado e confirmação de e-mail obrigatória, verificados pela API Auth.
- SMTP: `smtp.resend.com`, porta `465`, usuário `resend`, remetente acima, intervalo mínimo por usuário de 60 segundos. A senha é a chave restrita Resend, armazenada no painel.
- Templates em `emails/auth/`, preservando `{{ .ConfirmationURL }}`. Solicitar e abrir o link no mesmo navegador para manter o verificador PKCE.
- As duas migrations existentes foram aplicadas por Supabase CLI **2.116.0**, após dry run, com histórico de migrations. Não reaplicar manualmente nem executar reset remoto.
- A conexão administrativa usou o pooler de sessão `aws-0-us-east-2.pooler.supabase.com:5432`, usuário `postgres.cvxqvfsebpdyshxpoqdj`, TLS `verify-full` e o certificado oficial Supabase. A verificação de TLS não foi desativada.

### Evidências

- `profiles`, `dogs` e `attribution_touches`: RLS habilitada e forçada, com 3, 4 e 1 políticas, respectivamente.
- Data API sem sessão autenticada: HTTP 401/código 42501 nas três tabelas.
- `supabase/tests/p2_remote_rls.sql`: teste no PostgreSQL remoto com usuários sintéticos dentro de uma transação; trigger, CRUD próprio, isolamento entre tutores, ownership, grants por coluna, atribuição e bloqueio anônimo aprovados. Rollback confirmado: zero usuários persistidos após o teste.
- O teste SQL foi executado com cliente PostgreSQL e certificado validado. A versão atual de `supabase db query --file` rejeitou o lote por usar prepared statement; não houve aplicação parcial por esse comando. Pode-se executar o arquivo completo com `psql` em uma sessão no projeto dev.
- Geração de tipos por `supabase gen types --db-url` continua pendente. O Docker CLI passou a existir neste computador, mas o daemon não iniciou na auditoria posterior. Não substituir `lib/supabase/database.types.ts` pelo arquivo de erro; os tipos atuais continuam mantidos à mão.
- Duas contas próprias concluíram PKCE no navegador real. Sessão/reload, criação e edição do cão A, logout, lista vazia do cão B, 404 do UUID alheio, criação do cão B e replay do link usado sem sessão foram aprovados. A prova direta de PostgREST com os dois JWTs ainda é obrigatória.
- Verificação local após a configuração: lint, TypeScript e 52 testes aprovados; smoke offline com 26 testes aprovados em desktop/celular. O smoke isola as credenciais e não envia mensagens reais.
- Servidor local reiniciado com `.env.local`: `/entrar` abre com o botão de acesso habilitado. Os pedidos usados no aceite foram iniciados manualmente pelo formulário.

## Stripe e Resend

A chave Stripe anteriormente usada pertence ao sandbox `acct_1UAZB3LaePxLnVtP`. A consulta somente de leitura retornou HTTP 200, com `charges_enabled=false` e `details_submitted=false`. A auditoria posterior no painel confirmou modo de teste, zero produtos e nenhum destino de webhook; ativação de Payments e modelo de preços seguem não iniciados. O adapter de pagamento continua desativado.

A autenticação SMTP Resend retornou 235 sobre TLS. Depois disso, o fluxo de Auth entregou três e-mails reais `Confirme seu acesso ao PethCoach` no total, incluindo as duas contas do aceite PKCE, e usou a chave restrita `PethCoach Auth Dev`. A chave anterior `Peth Staging`, de acesso total, foi preservada e permanecia sem atividade. Não há webhooks Resend; o adapter de e-mails de retenção continua desativado.

## Credenciais e DNS

- `.env.local` foi restaurado com origem local, URL do projeto dev e chave publicável completa; permanece ignorado pelo Git. Nenhuma chave secreta foi adicionada ao runtime.
- Quando restaurado, `.env.supabase-admin.local` contém a senha administrativa do banco e permanece ignorado pelo Git. Não carregar no Next.js, não enviar à Vercel e não usar em código do app. Guardar em gerenciador de senhas e limitar acesso ao computador.
- Não há service role no app, chave live Stripe, segredo de webhook, API OpenAI ou modelos de IA configurados.
- MX do domínio raiz continuam em `mx.zoho.com`, `mx2.zoho.com` e `mx3.zoho.com`; SPF raiz continua com `include:zohomail.com`. Foi criado apenas o CNAME DNS-only `coach` para `f26d9bdb1aea5a39.vercel-dns-017.com`; os registros da raiz e do Zoho não foram alterados.
- Separar ambiente público/produção do projeto dev e nunca aplicar envs de produção indistintamente a previews. Rebuild é obrigatório após mudar valores `NEXT_PUBLIC_*`.

## Hospedagem e próximos passos

Por decisão do responsável, o projeto permanece no Hobby apenas durante a validação sem vendas. O primeiro deploy do commit `0b39599` ficou `READY` em `https://pethcoach.vercel.app`; `https://coach.peth.com.br` foi associado ao ambiente Production com configuração válida e certificado HTTPS. O deploy continua sem variáveis de ambiente, Analytics ou Speed Insights. A aplicação mantém `Disallow: /`, fecha `/dev/*` em produção e deixa Auth indisponível sem Supabase. Migrar para Pro antes da operação comercial; o domínio próprio ativo não representa liberação para clientes.

Antes de liberar clientes: concluir aceite P2, limitador distribuído, revisão de privacidade/termos e fases restantes. Nenhum serviço foi publicado como produto pronto.

Fontes: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Resend SMTP no Supabase](https://resend.com/docs/send-with-supabase-smtp), [TLS do Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement), [CLI Supabase](https://supabase.com/docs/reference/cli/supabase-db-push).
