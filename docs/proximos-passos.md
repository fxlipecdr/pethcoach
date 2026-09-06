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

## 3. ✅ CONCLUÍDO — Sentry

**Por que importa.** Hoje, se um tutor encontrar um erro, ninguém fica sabendo. O Sentry avisa quando algo quebra em produção. O código já está preparado e já remove dados pessoais antes de enviar qualquer relatório.

**O que fazer.** Crie conta em `sentry.io`, crie um projeto do tipo **Next.js** e copie o **DSN** — um endereço que começa com `https://` e identifica o projeto.

**Concluído em 05/09/2026.** DSN configurado e confirmado no bundle de produção. Falta apenas o `SENTRY_AUTH_TOKEN`, opcional, que faz os erros aparecerem com o código legível em vez de minificado.

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

## 6. Dados cadastrais: um confirmado, dois adiados

Os documentos legais já estão escritos e publicados. Para preenchê-los, consultei o CNPJ **68.660.298/0001-08** na base pública da Receita Federal. Aqui fica o estado de cada ponto, com as suas decisões de 05/09/2026.

**6.1 — Endereço: ✅ confirmado, nada a fazer.**

O endereço correto é o do cadastro:

> Rua Joaquim Emanoel Igreja, 36 — Centro — União da Vitória/PR — CEP 84600-113

É o que está em `content/legal.ts`, e portanto o que aparece na política, nos termos e no rodapé. A *Rua Valentin Varacoski* foi engano de memória, não mudança de endereço.

**6.2 — CNAE: divergente, atualização adiada por decisão sua.**

O CNAE principal do cadastro é **4789-0/04 — comércio varejista de animais vivos e de artigos e alimentos para animais de estimação**. O PethCoach não vende animais nem produtos: vende acesso a conteúdo digital por assinatura.

Você optou por resolver depois. Fica registrado o que isso implica enquanto não for resolvido: o problema aparece **na emissão da nota fiscal**, não no site — vender serviço fora da atividade registrada é irregularidade fiscal. Então o prazo real não é "antes do lançamento", é **antes da primeira nota**. Se a cobrança começar antes da atualização, cada venda entra irregular.

A inclusão do CNAE de serviço é pedida pelo contador e é rápida.

**6.3 — MEI: teto de faturamento, migração para LTDA planejada.**

A empresa está hoje como **Empresário Individual, enquadrada como MEI**. Você pretende migrar para LTDA mais adiante.

Enquanto isso não acontece, o que importa acompanhar é o **teto anual de receita do MEI**: estourar sem ter migrado gera cobrança retroativa dos tributos do enquadramento correto. A migração é planejamento, não emergência — mas quem decide a hora é o faturamento, não o calendário, então vale combinar com o contador o número que dispara a mudança e acompanhá-lo.

Quando a migração acontecer, **três campos de `content/legal.ts` mudam**: `razaoSocial`, `cnpj` e `naturezaJuridica`. Alterar ali corrige a política, os termos e o rodapé de uma vez; `tests/e2e/legal.spec.ts` precisa do CNPJ novo na constante do topo.

---

## 6.5 Tráfego pago: o que configurar antes de gastar o primeiro real

O código para medir conversão já está pronto. O que falta é ligar as contas.

**6.5.1 — Pixel e Conversions API da Meta.**

No Gerenciador de Eventos da Meta, crie um pixel e pegue duas coisas: o **ID do pixel** e um **token de acesso da Conversions API**. Coloque na Vercel:

- `NEXT_PUBLIC_META_PIXEL_ID` — o ID. É público por natureza, pode ir numa variável `NEXT_PUBLIC_`.
- `META_CAPI_ACCESS_TOKEN` — o token. **É segredo.** Nunca coloque numa variável que comece com `NEXT_PUBLIC_`, porque tudo que começa assim vai para o navegador de qualquer visitante.

Para conferir se está chegando, preencha `META_TEST_EVENT_CODE` com o código que o Gerenciador de Eventos mostra na aba de teste, faça uma compra de teste, veja o evento aparecer — e **apague a variável depois**. Evento marcado como teste não conta para otimização de campanha.

Como funciona, para você saber o que esperar:

- O **pixel** mede visita e início de checkout no navegador, e só carrega depois do aceite de cookies.
- A **compra** é enviada pelo servidor, a partir do webhook do Stripe, porque é lá que a venda é fato confirmado. Isso recupera as conversões que o pixel perde com bloqueador de anúncio, Safari ou aba fechada antes do retorno.
- Os dois usam o mesmo identificador de evento, então a Meta descarta a duplicata em vez de contar a compra duas vezes.
- **Sem aceite de cookies, nada é enviado** — nem no navegador, nem depois da compra. É o que a sua política de privacidade promete.

**6.5.2 — Pix: você ainda não pode habilitar, e isso é normal.**

No Brasil, o Pix no Stripe é **liberado só por convite**. Não existe botão para ativar. Os requisitos são:

- conta em situação regular, e
- **no mínimo 60 dias processando pagamentos** no Stripe

Como a conta é nova, o Pix não aparece nas configurações de formas de pagamento. Não é erro seu nem falta do produto.

**O que fazer:** anote na agenda para 60 dias depois da primeira venda real. Passado o prazo, confira em [Configurações → Formas de pagamento](https://dashboard.stripe.com/settings/payment_methods) se o Pix apareceu. Se não aparecer e você já tiver histórico, fale com o suporte do Stripe e peça avaliação de risco para Pix.

**O que o código faz enquanto isso:** nada quebra. O checkout **não fixa** métodos de pagamento — ele usa o que estiver ativo no seu painel. No dia em que o Pix for aprovado, ele passa a aparecer sozinho, sem mexer em código nem fazer deploy.

Isso é deliberado: se o código pedisse Pix explicitamente, o Stripe **rejeitaria a criação da sessão** enquanto o método não estivesse ativo, e a venda do programa completo quebraria inteira.

**Dois limites do Pix para você saber de antemão:**

- Cada Pix aceita de **R$ 0,50 a R$ 3.000**. Se algum plano passar disso, aquele preço não pode ser pago por Pix.
- **Assinatura por Pix não existe no Brasil.** O Pix Automático, que faria cobrança recorrente, não está disponível para contas brasileiras. Então mensalidade e anuidade continuam só no cartão; o Pix, quando vier, vale para a compra à vista do programa completo.

**6.5.3 — O que o código ainda não faz.**

Só a Meta está implementada, porque foi a sua escolha. Google Ads e TikTok exigiriam trabalho equivalente. O `gclid` e o `ttclid` já são capturados e guardados, então a base de atribuição está pronta se você mudar de ideia.

---

## 7. As duas revisões profissionais — decisão tomada em 05/09/2026

Estas nunca foram tarefas de computador, e nenhuma delas eu posso fazer.

**Você decidiu seguir sem elas.** Leu e aprovou, como responsável pela empresa, tanto os documentos jurídicos quanto o conteúdo comportamental e a copy de segurança. A decisão está registrada em `docs/release-checklist.md` e `docs/pre-revisao-conteudo-e-juridica.md` como **risco assumido pelo controlador** — não como revisão profissional, porque não foi.

O que isso significa na prática, sem rodeio: se houver reclamação no Procon, questionamento da ANPD ou um acidente com um cão que seguiu um plano do produto, o que existe é a sua palavra como responsável. Não há advogado nem veterinário respondendo junto. Isso não impede lançar; muda quem responde.

Dois efeitos concretos no código e na operação:

- **`reviewed_by` dos 12 módulos continua nulo.** A coluna guarda nome e registro de profissional. Sua aprovação não é isso, e gravá-la ali recriaria o revisor fictício que a migração `20260912000000_p15_revisor_real_do_catalogo.sql` acabou de remover.
- **A indexação no Google continua bloqueada** e é uma escolha separada desta. Ela estava condicionada à revisão do conteúdo; agora depende de você decidir liberar. Está em `robots.txt`, controlado por `NEXT_PUBLIC_SITE_URL`, e é o item "Indexação liberada apenas para landings prontas" do checklist.

**Se mudar de ideia mais adiante**, o caminho fica pronto: leve ao advogado os dois documentos e ao profissional de comportamento o `docs/pre-revisao-conteudo-e-juridica.md`, que traz o levantamento factual já verificável no código — o trabalho deles começa pela metade. Com nome e registro em mãos, é uma migração curta para gravar `reviewed_by` e `reviewed_at` reais.

---

## 8. Só quando for vender de verdade

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
7. Atualizar o CNAE com o contador — **antes da primeira nota fiscal**
8. ✅ Decidido: seguir sem revisão profissional, com o risco assumido por você
9. Migrar para planos comerciais e liberar indexação

Os passos 1 a 6 são de um dia de trabalho. O passo 7 depende do seu contador e tem prazo próprio: antes da primeira nota fiscal, não antes do lançamento. O passo 8 já está decidido, e o 9 é a virada para operação comercial.
