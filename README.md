# PethCoach

Fundação de um SaaS de orientação comportamental canina para o Brasil. **Prompt Mestre + P0 + P1 + P2 + P3 concluídos tecnicamente; próxima fase: P4.** Base: `PethCoach_Blueprint_Completo_Codex.pdf` (31/08/2026). Não é o MVP completo e não está liberado para clientes. Configuração externa e evidências: `docs/external-services.md`.

## Executar localmente

Requisitos: Node.js 24 LTS e pnpm 11.23.0 (versão fixada em `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abra `http://127.0.0.1:3000`. O projeto funciona **sem `.env.local` e sem serviços externos**. O kit visual fica em `/dev/ui-kit`, com links para `/dev/layouts/auth`, `/dev/layouts/app`, `/dev/layouts/flow` e `/dev/layouts/admin`. Todas essas páginas de demonstração retornam 404 em produção. Use `pnpm dev` para revisá-las.

Ao conectar serviços, copie `.env.example` para `.env.local` e preencha apenas as integrações necessárias. Chaves do Supabase devem usar o formato público `sb_publishable_`; não coloque `sb_secret_` nem service role em variáveis `NEXT_PUBLIC_*`. Alterações de variáveis públicas exigem novo build.

## O que está entregue

- Next.js App Router, React, TypeScript strict, Tailwind, Geist local, Radix e componentes com padrão shadcn.
- Home em PT-BR, três entradas de programas e rotas-base de marketing, auth, app, admin e checkout.
- Home refinada com prévia interativa, abas Radix, transições Motion, menu mobile em Sheet e FAQ expansível.
- Kit visual interativo: botões, inputs, select, escolhas, badges, progresso, stepper, dialog, feedback Sonner, skeleton e empty state.
- ChoiceCard reutilizável, Field/Feedback, estados de formulário e loading de botão; Drawer inferior com cancelar/aplicar e foco acessível.
- Layouts próprios de acesso, área pessoal e administração; fluxo limitado a 720 px e conteúdo geral a 1200 px. Guards reais preservados.
- Identidade substituível: cores em `app/globals.css`, nome/logo em `lib/brand.ts`; guia em `docs/ui-design.md`.
- Clients Supabase browser/server, refresh de sessão e guards no servidor; ausência de configuração nunca libera área privada.
- Migration de `profiles` com RLS, grants mínimos, timestamps e exclusão em cascata.
- P2: magic link PKCE, callback, logout, cadastro/edição de cães e conta do tutor; migration de cães, trigger de profiles e atribuição protegida. Configuração em `docs/p2-setup.md` e aceite em `docs/p2-acceptance.md`.
- P3: três landings estáticas por problema com conteúdo próprio, prática curta baseada em recompensa, encaminhamento de segurança, metadata, canonical condicional, sitemap e imagem Open Graph. Aceite em `docs/p3-acceptance.md`.
- Prévia `/dev/perfil-cao`: formulário vazio com validação local, sem salvar e sem liberar as rotas privadas; disponível só em development.
- Validação de ambiente, wrappers PostHog/Sentry e adapters desativados de IA, pagamentos e e-mail.
- Vitest, testes de RLS com PostgreSQL embarcado, Playwright, axe e GitHub Actions.

## Limites desta versão

Login por e-mail e dados de perfil estão implementados, mas desabilitados sem Supabase configurado. Não há quiz, catálogo de exercícios, plano, check-in, checkout ou publicação de conteúdo. Os adapters de IA/pagamento/e-mail de retenção continuam desativados; o e-mail de acesso usa Supabase Auth. Nenhum preço, modelo de IA, domínio público, depoimento ou aprovação profissional foi inventado.

`/app` e todas as mutações exigem usuário Supabase validado; `/admin` exige `app_metadata.role = admin`, gerenciado por servidor. Magic link/refresh e RLS foram aceitos no projeto dev e na stack descartável conforme `docs/p2-acceptance.md`. O limitador em memória é adicional aos limites do Supabase e deve ser substituído por um armazenamento compartilhado antes de publicação com múltiplas instâncias.

Toda a fundação usa `noindex` e `robots: disallow /`. As páginas jurídicas são avisos explícitos de desenvolvimento, não políticas finais. Publicação comercial depende das fases restantes e das revisões do catálogo/jurídico.

## Verificação

```sh
pnpm verify                 # lint + typecheck + unit + integration (RLS)
pnpm test:integration       # somente RLS
pnpm exec supabase start    # stack descartável para os dois comandos abaixo
pnpm db:types               # regenera a introspecção física do schema local
pnpm test:p2:session        # expiração/refresh/falhas; demora cerca de 3 min
pnpm exec playwright install chromium
pnpm e2e:smoke              # inicia servidor isolado em 3100
pnpm build
pnpm start
```

Para testar também o bundle de produção, rode `pnpm build` e execute `pnpm e2e:smoke` com `E2E_PRODUCTION=1`. No PowerShell: `$env:E2E_PRODUCTION='1'`; ao terminar, `Remove-Item Env:E2E_PRODUCTION`. O servidor de teste deve estar livre na porta 3100.

## Navegação técnica

| Local | Responsabilidade |
|---|---|
| `app/` | Rotas, layouts e boundaries Next.js |
| `components/ui/` | Primitivos de interface |
| `components/pethcoach/` | Componentes do produto |
| `features/` | Domínios; implementar por fase |
| `lib/` | Ambiente, providers, auth e observabilidade |
| `content/` | Conteúdo editorial das landings; ainda não é o catálogo aprovado do planner |
| `supabase/` | Migrations e configuração local |
| `tests/` | Unitários, integração RLS e smoke E2E |
| `docs/p1-acceptance.md` | Matriz de aceite, contratos dos componentes e limites da P1 |
| `docs/roadmap.md` | Sequência das fases e critérios de avanço |

Leia `AGENTS.md`, `docs/architecture.md`, `docs/safety.md`, `docs/testing.md` e `docs/release-checklist.md` antes de continuar. **Próximo passo: iniciar a P4 com quiz e assessments, sem liberar indexação ou cobrança.** Cores e logo permanecem substituíveis por escolha do usuário.
