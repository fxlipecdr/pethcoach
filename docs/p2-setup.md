# P2 — conectar o Supabase de desenvolvimento

Status: projeto Supabase dev conectado, migrations aplicadas e SMTP Resend configurado. Testes de RLS no PostgreSQL remoto e bloqueio anônimo pela Data API aprovados; aceite do login real ainda pendente. Não publicar para clientes. Nenhum e-mail real foi enviado nesta configuração. Valores e evidências em `docs/external-services.md`.

## 1. Projeto e variáveis

Use um projeto Supabase separado de produção. Copie `.env.example` para `.env.local` somente se esse arquivo ainda não existir; caso exista, preserve suas variáveis. Configure:

```dotenv
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Preencha URL e chave publicável com os valores reais do painel do projeto. A chave deve começar por `sb_publishable_`. Nunca colocar chave `sb_secret_`, service role, senha do banco ou token pessoal em variáveis públicas ou em mensagens de chat. A P2 não precisa de chave de administrador em runtime. O arquivo `.env.local` é ignorado pelo Git.

Sem URL, chave e origem válida, a tela `/entrar` fica desabilitada. Reinicie `pnpm dev` depois de mudar as variáveis. Builds exigem reconstrução para mudar valores públicos.

## 2. Migrations

Revisar e aplicar **em ordem**, no projeto de desenvolvimento escolhido:

1. `supabase/migrations/20260831000000_profiles_baseline.sql`
2. `supabase/migrations/20260831010000_p2_auth_dogs_attribution.sql`

Se a primeira já estiver aplicada, não executá-la novamente. O segundo arquivo cria profiles para usuários existentes e instala um trigger privado para novos usuários. Não copia permissões de metadados editáveis. Cria `dogs` e `attribution_touches`, com RLS e grants mínimos. Atribuição não tem escrita via API pública; onboarding_source também não é editável pelo cliente.

Preferir o fluxo de migrations do CLI. Após autenticar o CLI e vincular explicitamente o projeto dev, revisar `supabase db push --dry-run` antes de aplicar `supabase db push`. Não usar `db reset` em projeto remoto. Alternativa manual: SQL Editor do projeto dev, mantendo registro de quais migrations foram aplicadas para reconciliar o histórico do CLI antes do próximo push.

Depois de aplicar, gerar os tipos com o CLI do Supabase e comparar com `lib/supabase/database.types.ts`. O arquivo atual é mantido à mão; não foi apresentado como gerado por um banco conectado. O tipo de escrita pode continuar mais restrito do que a tabela para refletir os grants.

## 3. Auth e envio

No painel Auth do projeto de desenvolvimento:

- Habilitar provedor **Email**, novos cadastros e confirmação de e-mail.
- Site URL: `http://127.0.0.1:3000`.
- Redirect URLs de desenvolvimento: `http://127.0.0.1:3000/auth/callback**`. O sufixo permite o parâmetro `next`; não autoriza origem externa no app. Se testar em 3100, adicionar também essa porta.
- Manter os limites de frequência do Supabase. O app também aplica limites por processo, inclusive cooldown por hash do endereço. Não encaminha IP arbitrário do cliente ao fornecedor.
- Nos templates de confirmação de cadastro e magic link, usar o link fornecido por `{{ .ConfirmationURL }}`. Ele passa pelo `/verify` do Supabase; com o desafio PKCE criado pelo SSR, o retorno contém `code`, que o app troca pela sessão. **Não usar um template de token_hash apontando para `/auth/confirm`**: essa é outra implementação e essa rota não existe aqui. Não trocar por template de OTP numérico.
- Configurar entrega apropriada ao teste. O SMTP padrão tem restrições de destinatários e frequência; usar destinatários de teste permitidos pelo projeto ou SMTP de sandbox. Não ativar envio público sem revisar entrega e controles de abuso.

Solicitar o link em `/entrar` e abrir o e-mail **no mesmo navegador** que iniciou o acesso. Outro navegador, um novo pedido que substitua o verificador ou link expirado/usado deve levar à mensagem de erro e a um novo pedido. Essa característica é uma proteção do PKCE. Nunca colar tokens de sessão ou URLs de autenticação em logs, tickets ou chat.

Google não foi ativado: não há credenciais/provider configurados e é opcional na P2.

## 4. Aceite com o fornecedor real — ainda pendente

Usar duas contas de teste próprias e uma janela sem sessão. Autorizar os destinatários antes de enviar e-mails reais.

1. Conta A: pedir link, entrar, verificar o profile criado e recarregar `/app` mantendo a sessão.
2. Criar cão somente com nome; completar os campos; salvar, recarregar e conferir persistência. Verificar valores desconhecidos e `Não` para castração.
3. Conta B em outro contexto: criar outro cão. Abrir a URL do cão A deve dar 404, sem revelar nome ou dados. A lista deve conter só os próprios cães.
4. Repetir via **Data API** com JWTs de A e B e chave pública: select sem filtro retorna só registros próprios; update/delete do ID alheio não afetam linhas; insert com owner_id alheio falha; troca de owner_id/timestamps é negada.
5. Sem JWT: profiles, dogs e attribution_touches devem negar acesso. Contexto anônimo local não deve conceder acesso à API.
6. Sair, voltar e recarregar: acesso privado deve pedir login. Testar renovação da sessão no proxy e repetição do callback; não reutilizar sessão de outra conta.
7. Verificar Set-Cookie e `Cache-Control: private, no-store` no callback/refresh. Não usar cache compartilhado para conteúdo privado.
8. Testar e-mail inválido, cooldown, link usado/expirado/outro navegador, banco indisponível, edição negada e perda de conexão. Não perder os campos do formulário.
9. Verificar que um contexto local válido da futura avaliação não foi apagado pelo login. Esse contexto não contém respostas, identidade autenticada ou autorização de claim; o token assinado será da P4/P6.

Registrar resultados em `docs/p2-acceptance.md`. Testes PGlite não substituem esse aceite.

## Desenvolvimento local com Docker (alternativa)

Docker continua indisponível; o CLI 2.116.0 foi executado via `pnpm dlx` para migrations remotas. A geração de tipos por conexão direta ainda depende de Docker/Podman. Se Docker for instalado posteriormente, `supabase start` usa `supabase/config.toml` (signup e callbacks locais preparados); aplicar migrations apenas no banco local descartável. Usar a chave publicável real emitida pela versão instalada do CLI; não afrouxar a validação do app para aceitar service role. A caixa de e-mail local usa a porta 54324. O CLI novo avisa que a seção local `inbucket` foi renomeada para `local_smtp`; revisar essa configuração antes de iniciar a stack local.

## Limites antes de disponibilizar publicamente

- Substituir o limitador em memória por armazenamento compartilhado atômico para múltiplas instâncias; manter rate limits do fornecedor e avaliar CAPTCHA. O atual é uma defesa adicional de desenvolvimento, não um limitador distribuído.
- Concluir privacidade, canal do controlador, retenção, exportação/exclusão e revisão jurídica (P14). Não abrir cadastros ao público com páginas jurídicas provisórias.
- Validar o serviço real, tipos gerados, templates, SMTP e cache de produção. Não há deploy nesta entrega.
- O app omite logs de argumentos de Server Actions e URLs de acesso no Next dev. Configurar também redaction de query strings de `/auth/*` nos logs de gateway/CDN/provedor; a configuração do Next dev não controla infraestrutura externa.
- Captura/consentimento de atribuição: P11. Assessment e claim seguro: P4/P6. Plano/coaching/pagamento: fases posteriores.

Referências oficiais consultadas: [SSR e PKCE](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [redirects](https://supabase.com/docs/guides/auth/redirect-urls), [limites do Auth](https://supabase.com/docs/guides/auth/rate-limits), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
