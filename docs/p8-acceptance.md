# P8 — Dashboard, Execução de Treino, Check-in Diário do Tutor e Entitlements com Dia 1 Grátis

P8 concluída tecnicamente em 04/09/2026. A fase consolida a rotina diária de treino do tutor, integrando o Dashboard ao "Treino de Hoje", autorização server-side com Dia 1 100% gratuito e Dias 2-14 protegidos por direitos de acesso (`entitlements`), interface de check-in diário baseada em reforço positivo (sem punição ou streaks de culpa) e persistência auditável.

## Implementado

- **Direitos de Acesso (`public.entitlements`)**:
  - Tabela com RLS habilitado e forçado: leitura permitida apenas ao dono autenticado (`user_id = auth.uid()`).
  - Escopos tipados: `full_program` e `subscription`; status tipados: `active`, `past_due`, `canceled`, `expired`.
  - Mutação restrita: usuários anônimos e clientes autenticados não podem inserir ou alterar permissões diretamente (apenas webhooks de billing verificados ou superusuário).
  - Suporte a expiração: `expires_at` auditado em tempo de consulta server-side.
- **Autorização Server-Side de Treino (`features/plans/data.ts` e `features/plans/actions.ts`)**:
  - Regra inegociável de produto: o **Dia 1 é 100% gratuito** para qualquer tutor cadastrado.
  - Dias 2 a 14 exigem entitlement ativo verificado em `updatePlanTaskAction` e `submitDailyCheckinAction`.
  - Verificação rigorosa no backend: o servidor consulta o plano e o dia da tarefa no banco, rejeitando chamadas forjadas ou sem entitlement (`"entitlement_required"`).
- **Check-in Diário do Tutor (`public.daily_checkins`)**:
  - Tabela com RLS habilitado e forçado: leitura e escrita exclusivas do dono (`user_id = auth.uid()`).
  - Constraint de unicidade: `(plan_id, day_number)` prevenindo check-ins duplicados para o mesmo dia.
  - 3 humores de sessão tipados com foco em reforço positivo:
    - `calm`: "Tranquilo e focado" (Aproveitou e respondeu bem).
    - `moderate`: "Mais ou menos" (Algumas distrações normais).
    - `needed_pause`: "Precisamos pausar" (Pausar também é aprender! Respeito aos limites do cão sem perda de progresso ou culpa).
  - Campo opcional de observações do tutor (até 500 caracteres).
  - Regra de execução: check-in só é liberado quando todas as tarefas do dia foram completadas (`incomplete_tasks` verificado no banco).
  - Avanço condicional: ao registrar o check-in do dia atual, `current_day` do plano é incrementado automaticamente para o próximo dia (até 14).
- **Dashboard Unificado do Tutor (`app/app/page.tsx`)**:
  - Card em destaque "Treino de Hoje" com mascote Peth reactivo (`encouraging` ou `celebrating`).
  - Exibe o progresso do dia atual (ex.: "Dia 1 de 14"), contagem de exercícios pendentes/concluídos, estimativa total de duração e CTA direto para a prática.
- **Interface e Experiência do Tutor (`features/plans/plan-view.tsx`)**:
  - Abas dos 14 dias com identificador visual de bloqueio (`Lock` e tag "Plano") nos dias 2-14 quando o usuário não possui plano completo.
  - Card educativo e não invasivo ao clicar em dia bloqueado: explica que o Dia 1 é gratuito e apresenta opção de conhecer o programa completo ou retornar ao Dia 1.
  - Card de Check-in interativo com mascote expressivo e seleção de humor.
  - Card comemorativo pós-check-in com resumo do humor e notas registradas.
- **Fixture de Desenvolvimento Atualizada (`app/dev/plano-treino/page.tsx`)**:
  - Suporte ao parâmetro `?entitlement=1` para testar visualização bloqueada vs. desbloqueada.
  - Suporte ao modo `preview={true}` para testes de interface offline sem sessão Supabase ativa.

## Verificação

- `tests/unit/p8-entitlements.test.ts`: 12 testes unitários cobrindo:
  - Lógica de desbloqueio `isDayUnlocked`: Dia 1 sempre livre, Dias 2-14 protegidos por entitlement.
  - Validação estrita Zod de `checkinMoodSchema`, `submitDailyCheckinInputSchema`, `dailyCheckinSchema` e `entitlementSchema`.
  - Tratamento de limites de caracteres em notas (<= 500 chars).
- `tests/integration/p8-training-execution.test.ts`: 7 testes no PostgreSQL WASM (PGlite) cobrindo:
  - RLS em `public.entitlements`: usuário lê os seus, não lê os de outros, anônimo negado, mutação de cliente negada.
  - Conclusão de tarefas de treino pelo usuário dono.
  - Inserção de check-in com humor `needed_pause` sem penalidades.
  - RLS em `public.daily_checkins`: isolamento completo entre usuários.
  - Constraint de unicidade em `(plan_id, day_number)`.
  - Avanço de `current_day` no plano após conclusão.
- `tests/e2e/p8.spec.ts`: 4 testes Playwright cobrindo viewports desktop e mobile 360px:
  - Dia 1 livre, Dia 2 bloqueado com card educativo e botão de retorno ao Dia 1.
  - Conclusão das tarefas do dia acionando o formulário de check-in.
  - Seleção de humor `needed_pause`, anotações e confirmação de check-in concluído.
  - Acesso com `?entitlement=1` desbloqueando tarefas do Dia 2.
  - Validação de zero violações de acessibilidade WCAG 2.2 AA (Axe) e zero overflow horizontal em 360px.
- `pnpm verify`: 19 arquivos de teste e 142 testes aprovados, TypeScript strict e ESLint 0 warnings.
- `pnpm e2e:smoke`: 46 testes de ponta a ponta aprovados no desktop e mobile.

## Limites e próximo passo

O fluxo de treino, check-in e validação de direitos de acesso por entitlement está 100% implementado e coberto por testes. A concessão real de entitlements via webhooks de pagamento (Stripe / Asaas) será implementada na **P10 (Billing e Checkout)**. A próxima fase recomendada é a **P9 (Refinamento de Perfil do Cão, Histórico de Check-ins e Notificações/Lembretes)** ou **P10 (Monetização e Checkout)**.
