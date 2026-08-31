# Configuração externa — 31/08/2026

Destino informado: `coach.peth.com.br`. Remetente: `PethCoach <suporte@peth.com.br>`. Repositório privado: https://github.com/fxlipecdr/pethcoach.

## Estado verificado

| Serviço | Configurado | Falta |
| --- | --- | --- |
| Supabase Free | Organização PethCoach, projeto `pethcoach-dev`, migrations aplicadas, Auth por e-mail, SMTP, callbacks e templates PT-BR | Aceite do magic link no navegador, dois tutores via Data API e comparação dos tipos gerados |
| Resend | `peth.com.br` já estava verificado; chave nova `PethCoach Auth Dev`, somente envio nesse domínio; SMTP autenticado | Testar entrega na caixa de entrada; nenhum e-mail enviado nesta configuração |
| Stripe | Sandbox existente da Peth, chave de testes local validada pela API | Preços definidos pelo responsável, Checkout e webhook assinado na P10; ativação comercial posterior |
| Vercel | Conta conectada `fxlipecdrs-projects`, plano Hobby, sem projeto criado | Escolha de hospedagem compatível com SaaS comercial; nenhum upgrade ou deploy realizado |
| DNS | Cloudflare confirmada; Zoho recebe os e-mails do domínio | Criar registro `coach` somente após conhecer o destino real da hospedagem |
| GitHub | Acesso administrativo validado, repositório privado inicialmente vazio, remote `origin` configurado | Conferir resultado do primeiro push/CI no painel; não há credenciais no repositório |

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
- Geração de tipos por `supabase gen types --db-url` ficou pendente porque exige Docker/Podman, indisponíveis neste computador. Não substituir `lib/supabase/database.types.ts` pelo arquivo de erro; os tipos atuais continuam mantidos à mão.
- Esses resultados não substituem testes de Auth/PKCE, JWTs reais de dois tutores e entrega de e-mail.
- Verificação local após a configuração: lint, TypeScript e 52 testes aprovados; smoke offline com 26 testes aprovados em desktop/celular. O smoke isola as credenciais e não envia mensagens reais.

## Stripe e Resend

A chave Stripe local pertence ao sandbox `acct_1UAZB3LaePxLnVtP`. A consulta somente de leitura retornou HTTP 200, com `charges_enabled=false` e `details_submitted=false`. Não foram criados preços, cobranças, assinaturas ou endpoints fictícios. O adapter de pagamento continua desativado mesmo com a chave configurada.

A autenticação SMTP Resend retornou 235 sobre TLS; o teste não executou envio. A chave anterior `Peth Staging` foi preservada. O adapter de e-mails de retenção continua desativado; apenas Supabase Auth está preparado para enviar quando alguém solicitar acesso.

## Credenciais e DNS

- `.env.local`: URL pública local, conexão pública Supabase, Resend, remetente e **Stripe test**. Arquivo ignorado pelo Git.
- `.env.supabase-admin.local`: senha administrativa do banco, também ignorada pelo Git. Não carregar no Next.js, não enviar à Vercel e não usar em código do app. Guardar em gerenciador de senhas e limitar acesso ao computador.
- Não há service role no app, chave live Stripe, segredo de webhook, API OpenAI ou modelos de IA configurados.
- MX do domínio raiz continuam em `mx.zoho.com`, `mx2.zoho.com` e `mx3.zoho.com`; SPF raiz continua com `include:zohomail.com`. Nenhum registro DNS foi alterado. `coach.peth.com.br` ainda não tinha A/CNAME na consulta inicial.
- Separar ambiente público/produção do projeto dev e nunca aplicar envs de produção indistintamente a previews. Rebuild é obrigatório após mudar valores `NEXT_PUBLIC_*`.

## Hospedagem e próximos passos

O Hobby da Vercel é limitado a uso pessoal não comercial. Como o PethCoach é um SaaS comercial, não presumir que ausência temporária de cobranças torna o projeto elegível. Manter a conta sem upgrade até o responsável escolher Pro ou outro provedor compatível. Não apontar DNS para um destino inventado.

Antes de liberar clientes: concluir aceite P2, limitador distribuído, revisão de privacidade/termos e fases restantes. Nenhum serviço foi publicado como produto pronto.

Fontes: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Resend SMTP no Supabase](https://resend.com/docs/send-with-supabase-smtp), [TLS do Supabase](https://supabase.com/docs/guides/platform/ssl-enforcement), [CLI Supabase](https://supabase.com/docs/reference/cli/supabase-db-push).
