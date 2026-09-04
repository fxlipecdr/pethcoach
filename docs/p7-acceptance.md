# P7 — Catálogo Aprovado e Plan Engine

P7 concluída tecnicamente em 04/09/2026. A fase implementa a biblioteca versionada de módulos comportamentais de reforço positivo, o motor de geração de plano de treino com 14 dias (1 a 3 tarefas/dia, duração visível e critérios de parada obrigatórios), rigoroso controle anti-alucinação de IDs de catálogo, fallback determinístico offline e interface mobile-first com checklist de progresso.

## Implementado

- **Catálogo de Módulos Comportamentais Aprovados (`public.modules`)**:
  - Tabela com RLS habilitado e forçado: leitura permitida para `anon` e `authenticated` exclusivamente onde `status = 'published'`. Modificações são restritas ao superusuário.
  - Schema estrito: slug com regex, título (1..140 chars), categoria (1..60 chars), dificuldade (`beginner`, `intermediate`, `advanced`), duração estimada (2..15 min), setup, array de passos (1..6), critérios de sucesso, critérios de parada (`stop_conditions`), tags e contraindicações.
  - Seed inicial de **12 módulos revisados e publicados** (4 para cada um dos 3 problemas: `cachorro-puxa-guia`, `filhote-mordendo`, `xixi-lugar-errado`), 100% livres de métodos punitivos/aversivos.
- **Tabelas de Planos e Tarefas (`public.plans` e `public.plan_tasks`)**:
  - `public.plans`: armazena `user_id`, `dog_id`, `assessment_id`, `problem_id`, `planner_type` (`deterministic_fallback` ou `llm_structured`), status (`active`, `completed`, `paused`, `archived`), `current_day` e `total_days` (14). RLS restringe acesso e mutações exclusivamente ao dono autenticado.
  - `public.plan_tasks`: armazena tarefas individuais por dia com `day_number` (1..30), `order_index` (1..3), `module_id` com FK, status (`pending`, `completed`, `skipped`), `completed_at` e constraint única `(plan_id, day_number, order_index)` prevenindo slots duplicados. Deleção de plano cascateia para tarefas.
- **Motor de Planejamento Determinístico e Anti-Alucinação (`features/plans/engine.ts`)**:
  - Validador estrito `validateStructuredPlan`: rejeita qualquer proposta externa/LLM que contenha IDs fora do catálogo de módulos publicados (`status = 'published'`), dias faltantes ou dias com menos de 1 ou mais de 3 tarefas.
  - Gerador determinístico `buildDeterministicPlan`: constrói cronograma progressivo de 14 dias:
    - Dias 1-4 (Fundamentos): 1-2 tarefas/dia com módulos introdutórios e de ambientação.
    - Dias 5-9 (Consolidação): 2 tarefas/dia combinando fundação e transição.
    - Dias 10-14 (Generalização e Manutenção): 1-2 tarefas/dia incluindo intermediários.
    - Garante sempre 1 a 3 tarefas por dia, estimativa diária de 3 a 15 minutos e critérios de parada explícitos.
- **Port de AI e Fallback Seguro (`lib/ai/provider.ts` e `features/plans/actions.ts`)**:
  - `AIProvider` tipado para saídas estruturadas com fallback automático transparente para o gerador determinístico caso a IA esteja desconfigurada, rate limited ou produza saídas inválidas.
  - Server Action `generatePlanAction`: valida rate limit do tutor, autenticação, posse do cão e avaliação vinculada. Bloqueia sumariamente tentativas de geração se a avaliação não tiver status `continue` (respeito irrestrito ao Safety Gate).
  - Server Action `updatePlanTaskAction`: permite marcar tarefas como concluídas ou reabrí-las com revalidação de cache.
- **Interface e Experiência do Tutor (Mobile-First, WCAG 2.2 AA)**:
  - Componente `PlanView` em `features/plans/plan-view.tsx`:
    - Abas horizontais para seleção dos 14 dias com indicação de dia atual e tarefas concluídas.
    - Duração estimada do dia em destaque (ex.: "7 minutos total").
    - Cards de exercícios detalhados com categoria, nível, instruções de preparação, passo a passo, critérios de sucesso e caixa de alerta de parada ("Quando pausar: ...").
    - Botão de alternância de conclusão da tarefa com feedback otimista.
  - Botão de chamada para ação `GeneratePlanButton` em `features/plans/generate-plan-button.tsx` exibido no perfil do cão (`app/app/caes/[dogId]/page.tsx`) quando uma avaliação elegível existe e o cão ainda não possui plano ativo.
  - Fixture de prévia de desenvolvimento em `app/dev/plano-treino/page.tsx` para validação visual e testes sem estado de sessão.

## Verificação

- `tests/unit/p7-plan-engine.test.ts`: 9 testes unitários aprovados cobrindo:
  - Geração de 14 dias com 1 a 3 tarefas por dia.
  - Garantia de início do Dia 1 com módulo básico/fundação.
  - Cálculo preciso de duração diária dentro dos limites razoáveis (<= 15 min).
  - Rejeição estrita de IDs alucinados ou não publicados.
  - Rejeição de cronogramas incompletos ou com sobrecarga de tarefas (> 3 tarefas/dia).
- `tests/integration/p7-catalog-plans.test.ts`: 8 testes no PostgreSQL WASM (PGlite) cobrindo:
  - Leitura pública dos 12 módulos publicados por `anon` e `authenticated`.
  - Ocultação de módulos em rascunho/arquivados via RLS.
  - Imutabilidade do catálogo para usuários clientes.
  - Criação de planos e tarefas por usuário autenticado.
  - Isolamento RLS entre usuários e bloqueio de anônimos.
  - Atualização de status de tarefa.
  - Constraint de unicidade `(plan_id, day_number, order_index)`.
  - Deleção em cascata de tarefas ao remover um plano.
- `tests/e2e/p7.spec.ts`: 2 testes Playwright aprovados (desktop e mobile 360px), validando renderização de 1-3 tarefas, duração visível, critério de parada, responsividade e zero violações axe WCAG 2.2 AA.
- `pnpm verify`: 17 arquivos de teste e 123 testes aprovados, TypeScript strict e ESLint 0 warnings.
- `pnpm e2e:smoke`: 42 testes de regressão aprovados nos viewports desktop e mobile.
- `pnpm build`: build de produção Next.js 16.3.3 compilado com sucesso.

## Limites e próximo passo

O plano de 14 dias e o catálogo de módulos aprovados estão plenamente funcionais com fallback determinístico e registro de progresso, mas a execução das tarefas diárias e o checkout/monetização ainda não foram implementados. A próxima fase é a **P8 (Execução de Treino, Check-in Diário e Entitlements/Checkout)**.
