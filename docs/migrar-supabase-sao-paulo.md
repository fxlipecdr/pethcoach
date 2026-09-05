# Mudar o banco para São Paulo

**A região de um projeto Supabase não pode ser alterada.** Ela é definida na criação e some do formulário depois. Mudar de Ohio para São Paulo significa criar um projeto novo e apontar a aplicação para ele.

A boa notícia: como o projeto atual só tem dados de teste, **não é preciso migrar dado nenhum**. Isso transforma uma operação de risco em algo de meio período.

O plano gratuito do Supabase permite dois projetos ativos, então o antigo continua no ar enquanto você monta o novo. Nada fica fora do ar durante a troca.

---

## Antes de tudo: confirmar que não há dado real

Abra o projeto atual no painel do Supabase, vá em **SQL Editor** e rode:

```sql
select
  (select count(*) from auth.users) as contas,
  (select count(*) from public.dogs) as caes,
  (select count(*) from public.plans) as planos,
  (select count(*) from public.entitlements) as acessos_pagos;
```

Se aparecerem apenas as suas contas de teste, siga em frente sem migrar dados — é o caminho recomendado.

Se houver conta de alguém real, **pare e leia a seção "Se precisar levar os dados" no fim**. Migrar usuários entre projetos Supabase é trabalhoso, porque a identidade de login vive no schema `auth`, fora do alcance de um dump comum.

---

## 1. Criar o projeto em São Paulo

### Antes de clicar em nada

O plano gratuito permite **dois projetos ativos**. Você tem um (o de Ohio), então há espaço para o novo. Se em algum momento o botão de criar aparecer bloqueado, é esse o limite — e a saída é pausar algum projeto antigo, nunca apagar o de Ohio antes da migração terminar.

### O formulário, campo a campo

No painel do Supabase, botão **New project**, no canto superior.

**Organization.** Escolha a mesma organização de hoje, **PethCoach**. Se criar em outra, o projeto fica em uma conta separada de cobrança e permissões.

**Project name.** Use `pethcoach-dev-sp`. O nome não muda nada no funcionamento, mas ter "sp" no nome evita o erro clássico de rodar um comando apontando para o projeto errado enquanto os dois existem lado a lado.

**Database Password.** Clique em *Generate a password* e **salve imediatamente no seu gerenciador de senhas**. Essa senha:

- é pedida pelo `supabase link` no passo 2;
- não pode ser consultada depois, só redefinida;
- não é a senha da sua conta Supabase — é a do banco.

**Region.** É o campo que motiva toda esta migração. Abra a lista e procure **South America (São Paulo)**. O identificador técnico é `sa-east-1`.

Escolha só depois de ler o campo com calma. A lista é longa, tem várias entradas começando com "South" e "US East", e a região **não pode ser alterada depois de criar**.

**Demais campos.** Deixe como vêm. A versão do Postgres e as opções avançadas não precisam de ajuste para este projeto.

Clique em **Create new project**. O provisionamento leva por volta de dois minutos.

### Conferir que a região foi mesmo São Paulo

**Não pule esta conferência.** No projeto atual, a seleção de São Paulo não resultou em São Paulo — o projeto acabou provisionado em Ohio e isso só foi descoberto depois. É a razão desta migração existir.

Duas formas de verificar, e vale fazer as duas:

1. *Settings → General* deve exibir a região como **South America (São Paulo)**.
2. *Settings → Database → Connection string* deve trazer um endereço contendo **`sa-east-1`**, algo como `aws-0-sa-east-1.pooler.supabase.com`. Se aparecer `us-east-2` ou qualquer outra coisa, o projeto **não** está em São Paulo.

Se a região vier errada, apague este projeto recém-criado — ele está vazio, não há o que perder — e crie outro. Descobrir agora custa dois minutos; descobrir depois de migrar custa a migração inteira.

### Anotar o identificador do projeto

Em *Settings → General*, copie o **Project ID** (também chamado de *reference ID*): uma sequência de vinte letras, que também aparece na URL do painel. Ele será o `NOVO_REF` do próximo passo.

---

## 2. Aplicar as 14 migrações

No terminal, dentro da pasta do projeto:

```bash
pnpm exec supabase link --project-ref NOVO_REF
```

```bash
pnpm exec supabase db push --dry-run
```

Confira que a lista traz as 14 migrações, da `20260831000000_profiles_baseline` até a `20260910000000_p14_shared_rate_limit`. Estando certo:

```bash
pnpm exec supabase db push
```

**Como saber que deu certo.** Rode o `--dry-run` de novo: deve dizer que está atualizado. No painel, *Table Editor* deve mostrar as tabelas `profiles`, `dogs`, `plans`, `modules` e as demais.

---

## 3. Reconfigurar o Auth — o passo que todo mundo esquece

As migrações criam as tabelas, mas **não configuram autenticação**. Isso vive no painel e precisa ser refeito à mão no projeto novo. Se você pular esta etapa, o banco funciona e o login não.

### 3.1 Provedor de e-mail

*Authentication → Sign In / Providers → Email*:

- Enable email provider: **ligado**
- Confirm email: **ligado**

### 3.2 Endereços autorizados

*Authentication → URL Configuration*:

- **Site URL:** `https://coach.peth.com.br`
- **Redirect URLs** — adicione as três:
  - `https://coach.peth.com.br/auth/callback**`
  - `http://127.0.0.1:3000/auth/callback**`
  - `http://127.0.0.1:3100/auth/callback**`

Os dois endereços locais são o que permite você testar na sua máquina. Os asteriscos no fim fazem parte do padrão e devem ser digitados.

### 3.3 SMTP pelo Resend

*Authentication → Emails → SMTP Settings*, com os mesmos valores que já funcionam hoje:

| Campo | Valor |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | a chave restrita do Resend (a mesma de hoje) |
| Sender email | `suporte@peth.com.br` |
| Sender name | `PethCoach` |
| Minimum interval | `60` segundos |

Sem isso, o Supabase envia pelo servidor compartilhado dele, que tem limite baixo e cai em spam.

### 3.4 Templates em português

*Authentication → Emails → Templates*. Cole o conteúdo dos arquivos do repositório:

- `emails/auth/magic-link.html` → template **Magic Link**
- `emails/auth/confirm-signup.html` → template **Confirm signup**

**Preserve o `{{ .ConfirmationURL }}`** exatamente como está. É ele que vira o link de acesso; sem ele o e-mail chega sem link.

---

## 4. Pegar as chaves novas

*Settings → API* do projeto novo. Você precisa de três valores:

| No painel | Vai para a variável |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| Publishable key (ou `anon` `public`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `service_role` key | `SUPABASE_SECRET_KEY` |

A `service_role` ignora todas as regras de segurança do banco. Ela só existe no servidor: nunca em variável `NEXT_PUBLIC_`, nunca em print, nunca no repositório.

---

## 5. Apontar a aplicação para o projeto novo

### Na sua máquina

Edite o `.env.local` e troque os três valores. Depois reinicie o servidor local.

### Na Vercel

*Settings → Environment Variables*, ambiente **Production**. Edite as três variáveis com os valores novos e então force um **Redeploy** em *Deployments → o mais recente → Redeploy*. Variável nova só vale em deploy novo.

---

## 6. Verificar antes de desligar o antigo

Três provas, na ordem. Se qualquer uma falhar, o projeto antigo ainda está no ar e você pode voltar as variáveis.

**Prova 1 — o banco responde:**

```bash
curl -H "Authorization: Bearer SEU_CRON_SECRET" https://coach.peth.com.br/api/ready
```

Deve trazer `"pronto":true` e `banco` como `ok`.

**Prova 2 — o login real funciona.** Entre em `coach.peth.com.br/entrar` com um e-mail seu, receba o link e conclua o acesso. Isso prova de uma vez o SMTP, os redirects e o Auth.

**Prova 3 — o produto funciona.** Crie um perfil de cão e responda um quiz até o resultado. Isso prova as migrações, a RLS e o gate de segurança.

Localmente, dá para rodar a suíte inteira contra a stack descartável:

```bash
pnpm e2e:funnel
```

---

## 7. Só então: desativar o projeto antigo

**Pause primeiro, não apague.** No projeto antigo, *Settings → General → Pause project*. Pausar é reversível.

Espere alguns dias de uso normal. Se nada faltar, aí sim *Delete project*. **Apagar é definitivo e não tem desfazer.**

Por último, atualize `docs/external-services.md` com o ID e a região do projeto novo, para o histórico não apontar para um projeto que não existe mais.

---

## Se precisar levar os dados

Só faça isto se o passo inicial mostrou dado de alguém real. Duas partes, com dificuldades bem diferentes.

**Os dados da aplicação** (cães, avaliações, planos) saem por dump:

```bash
pnpm exec supabase link --project-ref REF_ANTIGO
```

```bash
pnpm exec supabase db dump --data-only -f dados.sql
```

E entram no novo com `psql`, usando a string de conexão que fica em *Settings → Database → Connection string* do projeto novo.

**As contas de login são o problema.** Elas vivem no schema `auth`, que o dump comum não leva, e o Supabase não oferece exportação de usuários entre projetos no plano gratuito. As alternativas:

- **Recriar as contas.** Como o acesso é por link no e-mail e não por senha, um tutor simplesmente pede um link novo e entra. O que se perde é o vínculo com os dados antigos, a menos que você reassocie os registros ao novo `id` de cada pessoa — trabalhoso e sujeito a erro.
- **Adiar a mudança de região.** Se já existem clientes, o custo da migração passou a ser maior que o ganho de latência. Aí a decisão honesta é ficar em Ohio e registrar o motivo.

É exatamente por isso que a troca precisa acontecer **antes** do primeiro tutor real.
