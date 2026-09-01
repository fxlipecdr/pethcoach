# Configuração externa — atualizada em 01/09/2026

Destino informado: `coach.peth.com.br`. Remetente: `PethCoach <suporte@peth.com.br>`. Repositório privado: https://github.com/fxlipecdr/pethcoach.

## Estado verificado

| Serviço | Configurado | Falta |
| --- | --- | --- |
| Supabase Free | Organização PethCoach, projeto `pethcoach-dev`, migrations P0/P2/P4/P5 aplicadas, Auth por e-mail, SMTP, callbacks e templates PT-BR; P2 hospedada/local aceita e safety gate P5 validado nos três desfechos | Monitorar drift de schema e repetir o aceite após mudanças de Auth/RLS |
| Resend | `peth.com.br` verificado; chave `PethCoach Auth Dev` restrita a envio; SMTP autenticado; cinco e-mails reais de acesso entregues no total | Retenção e webhooks pertencem à P12 |
| Stripe | Sandbox `acct_1UAZB3LaePxLnVtP` acessível no painel; modo de teste ativo; nenhum produto/preço ou webhook | Preços definidos pelo responsável, Checkout e webhook assinado na P10; ativação comercial posterior |
| Vercel | Projeto `pethcoach` na equipe `pethdeveloper-3373s-projects`, plano Hobby, GitHub conectado, `coach.peth.com.br` com HTTPS, variáveis públicas do Supabase e `ASSESSMENT_TOKEN_SECRET` sensível somente em Production; login confirmado | Manter Preview isolado e migrar para Pro antes da operação comercial |
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
- As cinco migrations existentes foram aplicadas por Supabase CLI **2.116.0**, após dry run, com histórico de migrations. O dry run posterior confirmou `upToDate: true`. Não reaplicar manualmente nem executar reset remoto.
- A conexão administrativa usou o pooler de sessão `aws-0-us-east-2.pooler.supabase.com:5432`, usuário `postgres.cvxqvfsebpdyshxpoqdj`, TLS `verify-full` e o certificado oficial Supabase. A verificação de TLS não foi desativada.

### Evidências

- `profiles`, `dogs` e `attribution_touches`: RLS habilitada e forçada, com 3, 4 e 1 políticas, respectivamente.
- Data API sem sessão autenticada: HTTP 401/código 42501 nas três tabelas.
- `supabase/tests/p2_remote_rls.sql`: teste no PostgreSQL remoto com usuários sintéticos dentro de uma transação; trigger, CRUD próprio, isolamento entre tutores, ownership, grants por coluna, atribuição e bloqueio anônimo aprovados. Rollback confirmado: zero usuários persistidos após o teste.
- O teste SQL foi executado com cliente PostgreSQL e certificado validado. A versão atual de `supabase db query --file` rejeitou o lote por usar prepared statement; não houve aplicação parcial por esse comando. Pode-se executar o arquivo completo com `psql` em uma sessão no projeto dev.
- Docker 29.6.1 e Supabase CLI 2.116.0 iniciaram a stack descartável e geraram `database.generated.types.ts` a partir das migrations. `database.types.ts` deriva dessa estrutura e restringe checks/grants que pg-meta não infere. A geração pela Management API remota não foi necessária e nenhum PAT foi criado.
- Duas contas próprias concluíram PKCE no navegador real. Sessão/reload, criação e edição do cão A, logout, lista vazia do cão B, 404 do UUID alheio, criação do cão B e replay do link usado sem sessão foram aprovados. `pnpm test:p2:live` repetiu o PKCE em memória e aprovou isolamento direto PostgREST para select/update/delete/insert, owner e timestamp; dados sacrificiais foram limpos.
- O responsável confirmou o login/callback no deployment `coach.peth.com.br`. Na stack local descartável, `pnpm test:p2:session` aprovou expiração natural de JWT, rejeição pela Data API após a tolerância de relógio, refresh válido, refresh inválido e falha de rede, usando somente a chave publicável e Mailpit.
- Verificação local após a configuração: lint, TypeScript e 52 testes aprovados; smoke offline com 26 testes aprovados em desktop/celular. O smoke isola as credenciais e não envia mensagens reais.
- Servidor local reiniciado com `.env.local`: `/entrar` abre com o botão de acesso habilitado. Os pedidos usados no aceite foram iniciados manualmente pelo formulário.
- P4 adicionou três problemas publicados, 24 perguntas versionadas, assessments protegidos e rate limits no PostgreSQL. O token anônimo fica somente em cookie HttpOnly e seu hash no banco; acesso direto ao assessment permanece revogado.
- A Data API anônima retornou HTTP 200 com os três problemas publicados e HTTP 401/código 42501 ao tentar ler `assessments` diretamente.
- O fluxo P4 real pela aplicação local criou, respondeu e concluiu oito perguntas contra o Supabase hospedado. Os registros e rate limits descartáveis do aceite foram limpos logo depois.
- Verificação final P4: lint/TypeScript e 70 testes aprovados, smoke com 34 cenários desktop/mobile e build de produção aprovado. A geração física de tipos ficou pendente porque Docker não está disponível nesta estação e a CLI remota exige PAT; o overlay estrito foi atualizado e validado.
- P5 publicou 30 perguntas de quiz v2, manteve as versões v1 para retomada e adicionou avaliação determinística, atômica e versionada em `p5-v1`. `safety_events` tem RLS forçada e acesso direto anônimo retornou HTTP 401/código 42501.
- O aceite real local contra o projeto hospedado aprovou `CONTINUE`, `REFER` e `BLOCK`, incluindo prioridade de mordida de alto risco sobre suspeita de dor. Os eventos persistidos foram conferidos e todos os dados/rate limits descartáveis foram removidos.
- A correção de catálogo P5 alinhou as duas chaves de faixa etária do quiz de filhotes ao contrato da API e migra respostas antigas correspondentes. A conferência remota retornou 30 perguntas v2 e zero chaves publicadas inválidas.
- Verificação final P5 antes do deployment: lint/TypeScript e 94 testes aprovados, smoke com 38 cenários desktop/mobile e build de produção aprovado.

## Stripe e Resend

A chave Stripe anteriormente usada pertence ao sandbox `acct_1UAZB3LaePxLnVtP`. A consulta somente de leitura retornou HTTP 200, com `charges_enabled=false` e `details_submitted=false`. A auditoria posterior no painel confirmou modo de teste, zero produtos e nenhum destino de webhook; ativação de Payments e modelo de preços seguem não iniciados. O adapter de pagamento continua desativado.

A autenticação SMTP Resend retornou 235 sobre TLS. Depois disso, o fluxo de Auth entregou cinco e-mails reais de acesso no total, incluindo as duas contas do aceite pelo navegador e a repetição direta, e usou a chave restrita `PethCoach Auth Dev`. A chave anterior `Peth Staging`, de acesso total, foi preservada e permanecia sem atividade. Não há webhooks Resend; o adapter de e-mails de retenção continua desativado.

## Credenciais e DNS

- `.env.local` contém origem local, URL do projeto dev, chave publicável completa e token OIDC temporário criado pela Vercel CLI; permanece ignorado pelo Git. A Vercel recebeu origem pública, URL/chave publicável do Supabase e o segredo P4 `ASSESSMENT_TOKEN_SECRET`, todos somente em Production. O segredo P4 foi gerado aleatoriamente, registrado como `Secret` e nunca exibido nem versionado. Nenhuma chave secreta do Supabase foi adicionada ao runtime.
- Quando restaurado, `.env.supabase-admin.local` contém a senha administrativa do banco e permanece ignorado pelo Git. Não carregar no Next.js, não enviar à Vercel e não usar em código do app. Guardar em gerenciador de senhas e limitar acesso ao computador.
- Não há service role no app, chave live Stripe, segredo de webhook, API OpenAI ou modelos de IA configurados.
- MX do domínio raiz continuam em `mx.zoho.com`, `mx2.zoho.com` e `mx3.zoho.com`; SPF raiz continua com `include:zohomail.com`. Foi criado apenas o CNAME DNS-only `coach` para `f26d9bdb1aea5a39.vercel-dns-017.com`; os registros da raiz e do Zoho não foram alterados.
- Separar ambiente público/produção do projeto dev e nunca aplicar envs de produção indistintamente a previews. Rebuild é obrigatório após mudar valores `NEXT_PUBLIC_*`.

## Hospedagem e próximos passos

Por decisão do responsável, o projeto permanece no Hobby apenas durante a validação sem vendas. Em 01/09/2026, o deployment P4 `dpl_FLcF7hL4Me4j2K6y6GUTp3CyXUyZ` ficou `READY` e foi associado a `https://coach.peth.com.br`. As quatro variáveis P4 estão limitadas a Production; Preview continua sem acesso ao projeto Supabase dev. A verificação pública retornou página do quiz 200, criação 201, oito respostas e conclusão 200; os dados descartáveis foram removidos. Auth continua habilitado e `/app` redireciona para login sem sessão. A aplicação mantém `Disallow: /`, fecha `/dev/*` em produção e continua sem Analytics ou Speed Insights. Migrar para Pro antes da operação comercial; o domínio, Auth e quiz ativos não representam liberação para clientes.

P4 foi concluída tecnicamente no repositório com os três quizzes, persistência anônima segura, rate limit distribuído e registro de início/conclusão. A aplicação mantém `Disallow: /` e `noindex`; revisão editorial/profissional continua obrigatória antes de indexar.

Antes de liberar clientes: concluir P6-P15 e revisar conteúdo, privacidade e termos. Nenhum serviço foi publicado como produto pronto.

Fontes: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Resend SMTP no Supabase](https://resend.com/docs/send-with-supabase-smtp), [TLS do Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement), [CLI Supabase](https://supabase.com/docs/reference/cli/supabase-db-push), [tipos gerados](https://supabase.com/docs/guides/api/rest/generating-types).
