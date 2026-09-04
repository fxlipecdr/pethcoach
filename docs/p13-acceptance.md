# Matriz de Aceite — Fase P13: Admin e Conteúdo

A **Fase P13** entrega a plataforma operacional e o sistema de governança editorial da PethCoach, assegurando controle de acesso baseado em funções (RBAC: `admin`, `reviewer`, `operator`) com Row Level Security (RLS) no Supabase, ciclo de vida editorial para módulos de treino (`draft` $\rightarrow$ `reviewed` $\rightarrow$ `published` $\rightarrow$ `archived`), validação determinística contra técnicas punitivas/aversivas, e um Inspetor Operacional Zero PII estritamente compatível com a LGPD.

---

## 1. Escopo Entregue

| Requisito | Status | Evidência Técnica |
|---|---|---|
| **RBAC de Operadores no Supabase** | Concluído | `supabase/migrations/20260908000000_p13_admin_and_content.sql`: tabela `public.operator_roles` (`admin`, `reviewer`, `operator`). Apenas leitura concedida a autenticados; inserção/atualização bloqueada para clientes (apenas service-role/migrações). |
| **Guarda de Rotas e Autenticação** | Concluído | `lib/security/auth.ts`: `getOperatorRole()`, `requireOperator()`, `requireAdmin()`. Redireciona usuários anônimos para `/entrar?next=...` e emite `notFound()` (404) para autenticados sem permissão de operador (evitando vazamento de rotas administrativas). |
| **Rejeição Determinística Anti-Aversiva** | Concluído | `features/admin/contracts.ts`: função `containsAversiveTerms()` e schema `moduleEditorSchema`. Bloqueia em tempo de validação termos como *enforcador*, *tranco*, *choque*, *castigo*, *alfa*, *submissão*, *bater*, *esganar* e *líder da matilha*. |
| **Ciclo Editorial de Conteúdo** | Concluído | `features/admin/data.ts` e `features/admin/actions.ts`: máquina de estados finitos (`draft` $\rightarrow$ `reviewed` $\rightarrow$ `published` $\rightarrow$ `archived`). Transições para `published` e `archived` restritas ao papel `admin`. Notas técnicas obrigatórias ($\ge$ 10 chars). |
| **Trilha de Auditoria de Revisões** | Concluído | Tabela `public.module_revisions` com RLS: armazena `module_id`, `version`, `status`, `reviewer_id`, `technical_notes` e `module_snapshot` imutável em JSONB. |
| **Inspetor Operacional Zero PII (LGPD)** | Concluído | `app/admin/inspector/page.tsx` e `components/admin/inspector-search-panel.tsx`: busca segura de diagnósticos, entitlements e logs de e-mail com ofuscação de e-mail (`jo***o@exemplo.com`) e sem exposição de dados clínicos ou respostas livres. |
| **UI de Administração Mobile-First** | Concluído | Rotas `/admin`, `/admin/modulos`, `/admin/modulos/[id]`, `/admin/inspector` e preview `/dev/admin`. Testadas a 360px de largura com zero transbordamento horizontal e alvos de toque $\ge 44 \times 44$px. |
| **Acessibilidade WCAG 2.2 AA** | Concluído | Validado com `axe-core`: 0 violações de contraste, estrutura semântica de cabeçalhos (`h1` $\rightarrow$ `h2` $\rightarrow$ `h3`) e atributos ARIA em diálogos/formulários. |
| **Navegação do Workspace Integrada** | Concluído | `components/layouts/workspace-navigation.tsx`: links administrativos ativos para `/admin`, `/admin/modulos` e `/admin/inspector`, substituindo o placeholder "EM PREPARAÇÃO". |

---

## 2. Cobertura e Resultados dos Testes Automatizados

### A. Testes Unitários (`tests/unit/p13-admin.test.ts` — 9 testes aprovados)
- **Validação Anti-Aversiva**:
  - Rejeição imediata de títulos, descrições, etapas, critérios de sucesso e condições de parada contendo termos aversivos ou de dominância.
  - Aprovação de conteúdo baseado em reforço positivo, dessensibilização sistemática e contracondicionamento.
- **Transições da Máquina de Estados**:
  - `draft` $\rightarrow$ `reviewed` permitido para `reviewer` e `admin`.
  - `reviewed` $\rightarrow$ `published` permitido exclusivamente para `admin`.
  - Tentativa de transição direta inválida (ex: `draft` $\rightarrow$ `published`) bloqueada deterministicamente.
  - Tentativa de publicar ou arquivar por `reviewer` ou `operator` rejeitada com erro de autorização.
- **Validação de Notas Técnicas**:
  - Rejeição de notas curtas (< 10 caracteres) ou excedendo 2000 caracteres.
- **Ofuscação de E-mail LGPD**:
  - Máscara estrita de identificadores pessoais (ex: `felipe@peth.com.br` $\rightarrow$ `fe***e@peth.com.br`).

### B. Testes de Integração em Banco (`tests/integration/p13-admin.test.ts` — 4 testes aprovados)
- Executado via **PGlite** com simulação de papéis `anon` e `authenticated`.
- **Visibilidade de Módulos**:
  - Usuários anônimos e autenticados comuns acessam exclusivamente módulos com status `published`.
  - Operadores (`admin`/`reviewer`) visualizam todos os status (`draft`, `reviewed`, `published`, `archived`).
- **Guarda de Inserção**:
  - Usuários autenticados comuns não conseguem inserir nem atualizar módulos em `public.modules`.
- **Trilha de Auditoria (`module_revisions`)**:
  - Criação de snapshots JSONB auditáveis com integridade referencial.
- **Isolamento de `operator_roles`**:
  - Clientes autenticados não possuem permissão de escrita/elevação de privilégio na tabela `operator_roles`.

### C. Testes E2E Smoke Playwright (`tests/e2e/p13.spec.ts` — 4 testes aprovados)
- **Redirecionamento Seguro**:
  - Usuários não autenticados tentando acessar `/admin` são redirecionados para `/entrar?next=%2Fadmin`.
- **Auditoria de Acessibilidade no Preview `/dev/admin`**:
  - Zero violações de acessibilidade (`axe-core`) em conformidade com WCAG 2.2 AA.
- **Responsividade Mobile**:
  - Viewport de 360px validado sem scroll horizontal (`scrollWidth === clientWidth`).
  - Formulários e cartões empilhados confortavelmente.

---

## 3. Resumo dos Quality Gates

- `pnpm lint`: **0 erros, 0 avisos**
- `pnpm typecheck`: **0 erros de tipagem**
- `pnpm test`: **29 arquivos / 218 testes aprovados (100%)**
- `pnpm e2e:smoke`: **68 testes Playwright aprovados (100%)**
- `pnpm build`: **Compilado com sucesso via Turbopack (código de saída 0)**

---

## 4. Próxima Fase

A próxima fase planejada é a **Fase P14: Preços Dinâmicos, Checkout Aprimorado e Upgrades**, que introduzirá suporte a múltiplos planos, personalização de ofertas pós-quiz e fluxos de upgrade no Stripe.
