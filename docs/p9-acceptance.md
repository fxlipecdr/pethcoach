# P9 — Histórico de Check-ins, Adaptação de Ritmo, Marcos Comportamentais e Linha do Tempo

P9 concluída tecnicamente em 05/09/2026. A fase entrega o motor determinístico de adaptação de cronograma, portão de segurança no check-in diário com encaminhamento preventivo sem culpa, concessão idempotente de marcos comportamentais (`plan_milestones`), trilha de auditoria de adaptações (`plan_adaptations`), e interface mobile-first com abas de Treino do Dia vs. Marcos & Linha do Tempo.

## Implementado

- **Evolução do Check-in Diário (`public.daily_checkins`)**:
  - Adição de colunas estruturadas:
    - `difficulty_rating text not null default 'adequate' check (difficulty_rating in ('easy', 'adequate', 'challenging'))`: autoavaliação pelo tutor da fluidez e percepção de esforço do cão na sessão.
    - `safety_flag text not null default 'none' check (safety_flag in ('none', 'pain_suspected', 'distress_extreme', 'aggression_risk'))`: portão determinístico de segurança durante a sessão.
- **Marcos Comportamentais Conquistados (`public.plan_milestones`)**:
  - Tabela com RLS habilitado e forçado (`force row level security`): leitura restrita ao usuário dono autenticado (`user_id = auth.uid()`).
  - Constraint de unicidade `unique (plan_id, key)` garantindo total idempotência.
  - Chaves de marcos tipadas:
    - `first_training_done`: "Primeiro Passo" (conclusão da primeira sessão).
    - `pause_honored`: "Pausa Consciente" (tutor soube pausar respeitando limites sem frustração).
    - `constancia_serena`: "Constância Serena" (3 sessões concluídas no ritmo da dupla).
    - `week_one_done`: "Fundamentos Sólidos" (Dia 7 concluído com foco e cooperação).
    - `program_completed`: "Jornada Concluída" (14 dias de dedicação e reforço positivo completados).
- **Trilha de Auditoria de Adaptações (`public.plan_adaptations`)**:
  - Tabela com RLS habilitado e forçado (`user_id = auth.uid()`).
  - Registra ajustes de cronograma com vínculo ao check-in disparador (`trigger_checkin_id`) e tipo: `consolidation`, `repeat_day`, `progression`, `safety_pause`.
- **Motor Determinístico de Adaptação (`features/plans/adaptation.ts`)**:
  - `evaluateCheckinSafety`: intercepta imediatamente sinais de dor aguda, estresse extremo/pânico ou risco de agressividade/mordida, pausando o plano (`status = 'paused'`) e emitindo orientações presenciais claras sem barreiras comerciais.
  - `determineAdaptation`: consolida o ritmo sem elevação súbita de critérios quando o cão precisou pausar ou o exercício foi desafiador; reconhece progressão suave quando há constância calma e fluida.
  - `calculateNewMilestones`: avalia marcos alcançados idempotentemente com base nos dados do check-in e contagem histórica.
- **Server Action e Camada de Dados (`features/plans/actions.ts` e `features/plans/data.ts`)**:
  - `submitDailyCheckinAction` integrado ao portão de segurança: se `evaluateCheckinSafety` disparar, aciona `pausePlanDueToSafety`, registra adaptação de segurança e retorna status `safety_pause`.
  - Persiste `difficultyRating` e `safetyFlag` no banco.
  - Concede e persiste novos marcos comportamentais de forma idempotente.
  - Registra decisões de adaptação no histórico.
- **Interface e Linha do Tempo (`features/plans/plan-view.tsx` e `features/plans/timeline-view.tsx`)**:
  - Alternador de visualização no topo: "Treino do Dia" vs "Marcos & Linha do Tempo" com contador de conquistas.
  - Aba de Linha do Tempo:
    - Grade de Marcos Comportamentais com badges de status ("Conquistado" vs "A conquistar") em alto contraste WCAG 2.2 AA.
    - Banner de Adaptação de Ritmo ativa quando houver ajustes no cronograma.
    - Histórico cronológico de sessões de treino com data, humor, percepção de dificuldade e notas do tutor.
  - Tela de Pausa Consciente: acionada ao relatar sinais de alerta clínicos ou comportamentais, exibindo o mascote Peth em repouso (`resting`), explicação compassiva e recomendação presencial especializada.
- **Fixture de Desenvolvimento Atualizada (`app/dev/plano-treino/page.tsx`)**:
  - Suporte completo a marcos e adaptações em modo prévia (`preview={true}`) para testes offline.

## Verificação

- `tests/unit/p9-adaptation.test.ts`: 19 testes unitários cobrindo:
  - Portão de segurança para todas as flags (`none`, `pain_suspected`, `distress_extreme`, `aggression_risk`).
  - Decisões de adaptação (consolidação na pausa/desafio, progressão na constância calma).
  - Cálculo de todos os 5 marcos comportamentais e garantia estrita de idempotência.
  - Schemas e contratos Zod para `difficultyRatingSchema`, `safetyFlagSchema`, `milestoneKeySchema`, `adaptationTypeSchema`, `planMilestoneSchema` e `planAdaptationSchema`.
- `tests/integration/p9-adaptation.test.ts`: 6 testes em PostgreSQL WASM (PGlite) cobrindo:
  - Migração `20260905000000_p9_adaptation_and_milestones.sql`.
  - Check constraints em `difficulty_rating` e `safety_flag`.
  - RLS em `public.plan_milestones` (leitura do dono, isolamento entre usuários, negação a anônimos).
  - Constraint de unicidade em `(plan_id, key)`.
  - RLS em `public.plan_adaptations`.
  - Operação de pausa de segurança com atualização de status do plano e inserção de adaptação.
- `tests/e2e/p9.spec.ts`: 6 testes Playwright nos viewports desktop e mobile 360px:
  - Visualização da aba Marcos & Linha do Tempo com badges e banner de adaptação.
  - Check-in completo com percepção de dificuldade e desbloqueio de marco refletido na Linha do Tempo.
  - Sinal de alerta de segurança disparando imediatamente a tela de Pausa Consciente e orientações veterinárias.
  - Acessibilidade WCAG 2.2 AA (Axe) com zero violações em todas as telas e ausência de overflow horizontal em 360px.
- `pnpm lint`: zero erros e zero avisos (ESLint).
- `pnpm typecheck`: TypeScript strict com zero erros.
- `pnpm test`: 21 suítes de teste e 167 testes unitários e de integração aprovados.
- `pnpm e2e:smoke`: 52 testes de ponta a ponta aprovados no desktop e mobile.
- `pnpm build`: compilação de produção com Turbopack concluída com sucesso.

## Limites e próximo passo

O histórico, as autoavaliações com dificuldade, os marcos comportamentais e o portão de adaptação/segurança estão 100% integrados e auditados. A próxima fase na ordem do roadmap é a **P10 (Stripe, Billing e Concessão Automática de Entitlements via Webhooks Assinados)**.
