# P2 — conectar o Supabase de desenvolvimento

Status: P2 concluída em 01/09/2026. Projeto Supabase dev conectado, migrations e SMTP Resend configurados; RLS remota, bloqueio anônimo, PKCE, persistência, logout, replay, isolamento pelo app, Data API direta, tipos gerados, expiração natural, refresh e falhas controladas passaram. Não liberar para clientes. Valores e evidências em `docs/external-services.md`.

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

Depois de aplicar, iniciar a stack local e executar `pnpm db:types`. O CLI escreve a introspecção física em `lib/supabase/database.generated.types.ts`. `lib/supabase/database.types.ts` deriva desse arquivo e mantém refinamentos que pg-meta não representa: valores de `CHECK`, grants de escrita por coluna e ausência total de escrita pública em attribution. Revisar ambos sempre que uma migration mudar.

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

## 4. Aceite com o fornecedor real — concluído

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

O fluxo direto pode ser repetido com `pnpm test:p2:live`. Informe duas contas próprias diferentes e cole os links recém-recebidos apenas no prompt do processo. O utilitário mantém PKCE/JWT em memória, valida select/update/delete/insert e colunas protegidas, cria registros sacrificiais e os remove com o respectivo dono. Ele recusa URL de verificação fora do projeto e chave que não seja `sb_publishable_*`; nunca adicionar service role para fazê-lo passar.

Com Docker ativo, `pnpm test:p2:session` executa o complemento descartável local. O script solicita magic link com a chave publicável, lê somente a mensagem destinada ao e-mail aleatório no Mailpit, espera o JWT de 120 segundos expirar e verifica Data API 401 após a tolerância de relógio. Depois testa refresh válido, refresh inválido e falha de rede. A stack local deve usar o `jwt_expiry = 120` documentado em `supabase/config.toml`; o comando demora cerca de três minutos e não deve apontar para o projeto hospedado.

## Desenvolvimento local com Docker (alternativa)

Docker 29.6.1 e Supabase CLI 2.116.0 estão operacionais. `pnpm exec supabase start` usa `supabase/config.toml`, aplica migrations somente ao banco descartável e expõe Mailpit na porta 54324. O CLI está fixado como dependência de desenvolvimento; use `pnpm db:types` com a stack ativa. A configuração usa a seção atual `local_smtp` e TTL curto apenas para o aceite local. Nunca copiar as chaves locais de administração para `.env.local`, Vercel ou código do app. Para remover todos os dados descartáveis, executar `pnpm exec supabase stop --no-backup` somente neste projeto local.

## Limites antes de disponibilizar publicamente

- Substituir o limitador em memória por armazenamento compartilhado atômico para múltiplas instâncias; manter rate limits do fornecedor e avaliar CAPTCHA. O atual é uma defesa adicional de desenvolvimento, não um limitador distribuído.
- Concluir privacidade, canal do controlador, retenção e exportação/exclusão (P14). ✅ As páginas jurídicas deixaram de ser provisórias em 05/09/2026; a revisão por advogado não ocorreu, por decisão do controlador registrada em `docs/release-checklist.md`.
- Regerar os tipos após migrations e repetir os aceites P2 antes de mudanças em Auth/RLS. O deploy Vercel possui somente as variáveis públicas do Supabase em Production, bloqueia indexação e serve apenas para validação; Preview continua sem acesso ao banco de desenvolvimento.
- O app omite logs de argumentos de Server Actions e URLs de acesso no Next dev. Configurar também redaction de query strings de `/auth/*` nos logs de gateway/CDN/provedor; a configuração do Next dev não controla infraestrutura externa.
- Captura/consentimento de atribuição: P11. Assessment e claim seguro: P4/P6. Plano/coaching/pagamento: fases posteriores.

Referências oficiais consultadas: [SSR e PKCE](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [redirects](https://supabase.com/docs/guides/auth/redirect-urls), [limites do Auth](https://supabase.com/docs/guides/auth/rate-limits), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
