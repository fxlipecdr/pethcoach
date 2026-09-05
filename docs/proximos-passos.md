# O que falta fazer — passo a passo

Escrito para ser seguido sem conhecimento técnico prévio. Cada item diz **por que importa**, **o que fazer** e **como saber que deu certo**.

O código está pronto até P15. O que falta são coisas que dependem de contas, senhas e decisões suas — nada disso pode ser feito de dentro do repositório.

## Antes de começar

Abra o terminal na pasta do projeto. No Windows, use o **Git Bash** (não o PowerShell), porque os comandos abaixo são escritos para ele.

Confirme que o `pnpm` responde:

```bash
pnpm --version
```

Deve imprimir `11.23.0`. Se disser que o comando não existe, falta o atalho do pnpm. Ele é criado uma única vez com o Node já instalado, e não precisa de administrador:

```bash
{ echo '@echo off'; echo 'corepack pnpm %*'; } > "$APPDATA/npm/pnpm.cmd"
```

```bash
{ echo '#!/bin/sh'; echo 'exec corepack pnpm "$@"'; } > "$APPDATA/npm/pnpm" && chmod +x "$APPDATA/npm/pnpm"
```

O primeiro atende o PowerShell e o Prompt de Comando; o segundo, o Git Bash. Os dois encaminham para o **Corepack**, que já vem junto com o Node e respeita a versão fixada no `package.json` — por isso não é preciso instalar o pnpm separadamente nem escolher versão.

A pasta `AppData/Roaming/npm` já está no PATH do usuário, então não é preciso ser administrador nem mexer em variável de ambiente. Depois de criar, abra um terminal novo e rode `pnpm --version` outra vez.

Três regras que evitam estrago:

1. **Nunca** coloque chave secreta em variável que começa com `NEXT_PUBLIC_`. Tudo que começa assim vai junto para o navegador de qualquer visitante.
2. **Nunca** rode `supabase db reset` apontando para o projeto na nuvem. Esse comando apaga o banco inteiro. Ele só é seguro na stack local.
3. O arquivo `.env.local` fica só na sua máquina. Ele já está no `.gitignore` e não deve ir para o GitHub.

---

## 0. ✅ CONCLUÍDO — a região do Supabase

**Por que importa.** O projeto foi provisionado em **Ohio, nos Estados Unidos**, e não em São Paulo como se pretendia. Isso significa que cada consulta ao banco atravessa o continente: os tutores brasileiros sentem isso como lentidão em toda tela que carrega dados.

Mudar de região **não é possível depois**: exige criar um projeto novo e migrar os dados. Hoje isso custa quase nada, porque só existem dados de teste. Depois do primeiro cliente real, vira uma operação de risco.

**O que fazer.** Decidir uma das duas:

- **Recriar em São Paulo agora.** Cria-se um projeto Supabase novo na região `sa-east-1`, aplicam-se as migrações e trocam-se as variáveis de ambiente. Meio dia de trabalho, sem perda porque não há dado real. O procedimento completo, passo a passo, está em **`docs/migrar-supabase-sao-paulo.md`**.
- **Ficar em Ohio.** Aceitável se a latência extra não incomodar. Registre a decisão para não ser uma surpresa depois.

**Concluído em 05/09/2026.** O projeto foi recriado em São Paulo (`wcxgwjcvhfbddpbncwwf`), as 14 migrações foram aplicadas e a produção foi validada com login real. Falta apenas pausar e depois remover o projeto de Ohio, e revogar a chave antiga do Resend em seguida. Evidências em `docs/external-services.md`.

---

## 1. ✅ CONCLUÍDO — aplicar as migrações

**Por que importa.** "Migração" é um arquivo que altera a estrutura do banco: cria tabela, coluna, regra de segurança. O código novo espera estruturas que ainda não existem no projeto da nuvem. Sem isso, a exclusão de conta falha e o limite de requisições não funciona entre servidores.

**O que fazer.**

Primeiro, conectar a ferramenta ao seu projeto:

```bash
pnpm exec supabase link --project-ref cvxqvfsebpdyshxpoqdj
```

Ele vai pedir a **senha do banco de dados** — aquela criada quando o projeto Supabase nasceu. Se não lembrar: painel do Supabase → *Project Settings* → *Database* → *Reset database password*. Trocar essa senha não apaga nada.

Agora veja o que seria aplicado, **sem aplicar**:

```bash
pnpm exec supabase db push --dry-run
```

Leia a lista com atenção. Devem aparecer apenas arquivos com nome de fase (`p6`, `p7`, … `p14`). Se aparecer algo que você não reconhece, pare e pergunte antes de seguir.

Estando certo, aplique:

```bash
pnpm exec supabase db push
```

Por último, atualize os tipos que o código usa para conversar com o banco. Este passo precisa do **Docker Desktop aberto**:

```bash
pnpm exec supabase start
```

```bash
pnpm db:types
```

**Como saber que deu certo.** Rode `pnpm exec supabase db push --dry-run` de novo: deve dizer que está tudo atualizado. E `git status` deve mostrar `lib/supabase/database.generated.types.ts` alterado.

---

## 2. Stripe: criar os preços e ligar o webhook

**Por que importa.** A conta Stripe existe em modo de teste, mas está vazia: sem produto, sem preço e sem webhook. O webhook é a peça de segurança — é por ele que o sistema fica sabendo que um pagamento foi aprovado. O código **só libera acesso pago por essa via**, nunca porque o navegador disse que pagou.

**O que fazer.** Entre em `dashboard.stripe.com` e confirme que o seletor **Modo de teste** (*Test mode*) está ligado. Enquanto ele estiver ligado, nenhum dinheiro real circula.

**2.1 — Criar três produtos** em *Produtos → Adicionar produto*:

| Produto | Tipo de preço |
|---|---|
| Assinatura mensal | Recorrente, mensal |
| Assinatura anual | Recorrente, anual |
| Programa completo | Pagamento único |

**Os valores são decisão sua.** Não existe preço certo definido no código — ele apenas usa o que você criar.

**2.2 — Copiar os três IDs de preço.** Cada preço tem um identificador que começa com `price_`. Anote qual é qual.

**2.3 — Copiar a chave secreta de teste.** Em *Desenvolvedores → Chaves de API*, copie a **Chave secreta** (começa com `sk_test_`). Ela é secreta de verdade: nunca cole em conversa, print ou arquivo do repositório.

**2.4 — Criar o webhook.** Em *Desenvolvedores → Webhooks → Adicionar endpoint*:

- **URL:** `https://coach.peth.com.br/api/webhooks/stripe`
- **Eventos a escutar:** `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

Depois de criar, copie o **Signing secret** (começa com `whsec_`). É com ele que o sistema confere se a mensagem veio mesmo do Stripe.

**Como saber que deu certo.** Você deve ter em mãos: três IDs `price_...`, uma chave `sk_test_...` e um segredo `whsec_...`. Guarde para o passo 4.

---

## 3. Sentry: enxergar os erros

**Por que importa.** Hoje, se um tutor encontrar um erro, ninguém fica sabendo. O Sentry avisa quando algo quebra em produção. O código já está preparado e já remove dados pessoais antes de enviar qualquer relatório.

**O que fazer.** Crie conta em `sentry.io`, crie um projeto do tipo **Next.js** e copie o **DSN** — um endereço que começa com `https://` e identifica o projeto.

**Como saber que deu certo.** Você tem o DSN copiado. Ele vai em duas variáveis no passo seguinte.

---

## 4. Colocar tudo na Vercel

**Por que importa.** A Vercel é onde o site roda. Ela precisa conhecer as chaves para conversar com Supabase, Stripe, Resend e Sentry.

**O que fazer.** Primeiro, gere dois segredos aleatórios. Rode duas vezes e guarde cada resultado:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O primeiro será o `CRON_SECRET`, o segundo o `ASSESSMENT_TOKEN_SECRET` (se ainda não existir).

Agora vá em **Vercel → projeto `pethcoach` → Settings → Environment Variables** e adicione, marcando o ambiente **Production**:

| Variável | O que colocar | Segredo? |
|---|---|---|
| `STRIPE_SECRET_KEY` | a chave `sk_test_...` | **sim** |
| `STRIPE_WEBHOOK_SECRET` | o segredo `whsec_...` | **sim** |
| `STRIPE_PRICE_MONTHLY` | o `price_...` da mensal | não |
| `STRIPE_PRICE_ANNUAL` | o `price_...` da anual | não |
| `STRIPE_PRICE_SINGLE_PROGRAM` | o `price_...` do programa | não |
| `SUPABASE_SECRET_KEY` | a *service role key* do Supabase | **sim** |
| `RESEND_API_KEY` | a chave do Resend já existente | **sim** |
| `EMAIL_FROM` | `PethCoach <suporte@peth.com.br>` | não |
| `CRON_SECRET` | o primeiro valor aleatório gerado | **sim** |
| `SENTRY_DSN` | o DSN do Sentry | não |
| `NEXT_PUBLIC_SENTRY_DSN` | o mesmo DSN | não |

A *service role key* do Supabase fica em *Project Settings → API*. Ela dá acesso total ao banco, ignorando todas as regras de segurança — trate como senha mestra.

Depois de salvar tudo, force um novo deploy: **Deployments → o mais recente → Redeploy**. Variável nova só passa a valer em deploy novo.

**Como saber que deu certo.** Veja o passo 5.

---

## 5. Conferir se está tudo no ar

**Por que importa.** Antes de convidar qualquer pessoa, você precisa saber que as peças conversam entre si.

**O que fazer.** Rode este comando trocando `SEU_CRON_SECRET` pelo valor que você gerou:

```bash
curl -H "Authorization: Bearer SEU_CRON_SECRET" https://coach.peth.com.br/api/ready
```

**Como saber que deu certo.** A resposta deve trazer `"pronto":true` e, na lista de dependências, `banco` como `ok`. Se `pagamentos` ou `email` aparecerem como `ausente`, alguma variável do passo 4 não foi salva ou o deploy não foi refeito.

Depois, faça uma compra de mentira: entre no site, vá até a tela de planos e pague com o cartão de teste do Stripe — número `4242 4242 4242 4242`, qualquer data futura, qualquer CVC. O acesso ao programa completo deve liberar sozinho. Se liberar, o webhook está funcionando.

---

## 6. Duas revisões humanas que travam o lançamento

Estas não são tarefas de computador. São as duas coisas que impedem o produto de ser aberto ao público, e nenhuma delas eu posso fazer.

**6.1 — Revisão do conteúdo por profissional qualificado.** Todo o texto de orientação comportamental e as mensagens de segurança precisam ser lidos por médico-veterinário ou adestrador que trabalhe com métodos de reforço positivo. O produto orienta pessoas sobre o comportamento de um animal: conteúdo errado causa dano real. Enquanto isso não acontecer, a indexação no Google deve continuar bloqueada — e está.

**6.2 — Revisão jurídica.** Política de privacidade, termos de uso, identificação do controlador de dados e canal de suporte precisam ser revisados por advogado, à luz da LGPD. O produto coleta dados pessoais e cobra dinheiro; os dois pontos têm exigência legal específica.

---

## 7. Só quando for vender de verdade

- **Trocar o plano da Vercel para Pro.** O plano Hobby não autoriza uso comercial.
- **Trocar o Stripe para modo de produção.** Isso significa refazer os produtos e o webhook com as chaves reais (`sk_live_`, `whsec_` de produção) e atualizar a Vercel.
- **Liberar a indexação** apenas das páginas prontas, mantendo a área logada fora do Google.
- **Ensaiar o rollback:** publicar uma versão, voltar para a anterior e conferir `/api/ready`. Vale fazer isso uma vez com calma, antes de precisar às pressas.

---

## Resumo do caminho

1. Decidir a região do Supabase — **quanto antes, mais barato**
2. Aplicar as migrações
3. Criar preços e webhook no Stripe
4. Criar o projeto no Sentry
5. Preencher as variáveis na Vercel e refazer o deploy
6. Conferir `/api/ready` e fazer uma compra de teste
7. Mandar revisar: conteúdo com profissional, textos legais com advogado
8. Migrar para planos comerciais e liberar indexação

Os passos 1 a 6 são de um dia de trabalho. O passo 7 depende de agenda de terceiros — é o que costuma atrasar mais, então vale começar a procurar as pessoas agora.
