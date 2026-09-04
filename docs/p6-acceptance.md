# P6 — Resultado Observável e Claim Seguro

P6 concluída tecnicamente em 04/09/2026. A fase entrega a síntese das observações comportamentais do quiz para o desfecho `CONTINUE`, preserva o isolamento rigoroso de `REFER`/`BLOCK` fora do funil comercial e implementa o mecanismo autenticado de claim para vincular a avaliação à conta do tutor e ao seu cão, sem repetir o questionário.

## Implementado

- **Síntese Observável Determinística**:
  - Geração estruturada baseada no catálogo de perguntas e respostas reais em `features/assessments/data.ts` (`buildObservableSummary`).
  - Totalmente livre de linguagem diagnóstica, prognóstico clínico ou recomendações medicamentosas.
  - Apresenta situações observadas no ambiente, pontos positivos já praticados e três focos iniciais de treino baseados estritamente em reforço positivo.
- **Isolamento de Segurança**:
  - Desfechos `REFER` e `BLOCK` mantêm exclusivamente as orientações de segurança e o botão para `/ajuda`.
  - Nenhum componente de claim, CTA de cadastro ou paywall é exibido em situações de risco.
- **Mecanismo de Claim Criptograficamente Seguro**:
  - Migration `20260902000000_p6_assessment_claim.sql` com RPC `public.claim_assessment(p_assessment_id, p_token_hash, p_dog_id)`.
  - Exige usuário autenticado (`auth.uid()`).
  - Exige posse do token assinado HMAC via cookie HttpOnly, prevenindo ataques de enumeração/IDOR.
  - Bloqueia claim se o assessment não tiver status `completed`.
  - Bloqueia claim se o assessment tiver status `REFER` ou `BLOCK` (`assessment_not_claimable`).
  - Impede apropriação indevida (não permite que outro usuário reivindique um assessment já atribuído).
  - Valida que o `dog_id` informado pertença ao tutor autenticado (`owner_id = auth.uid()`).
  - Rate limit por token de assessment (`l:<hash>`) e limite de segurança no servidor.
- **Controle de Acesso RLS no Supabase**:
  - Política `assessments_read_owned`: tutores autenticados leem exclusivamente suas próprias avaliações reivindicadas.
  - Política `assessments_update_dog`: permite atualizar `dog_id` apenas para cães pertencentes ao mesmo tutor.
  - Acesso direto de leitura/escrita continua estritamente negado para `anon`.
- **Interface e Fluxo do Tutor**:
  - `ClaimCard` interativo em `features/assessments/claim-card.tsx` com estados para visitante ("Salvar avaliação e criar conta" com `next` parametrizado), usuário logado com cães (seleção de cão) e avaliação já salva ("Avaliação salva").
  - `ObservableSummaryView` em `features/assessments/observable-summary-view.tsx` com renderização semântica e acessível (WCAG 2.2 AA).
  - Exibição de histórico de avaliações vinculadas no perfil do cão em `app/app/caes/[dogId]/page.tsx`.

## Verificação

- `tests/unit/p6-claim.test.ts`: 4 testes aprovados cobrindo schemas de claim e síntese observável.
- `tests/integration/p6-claim.test.ts`: 8 testes no PostgreSQL WASM (PGlite) cobrindo:
  - Claim bem-sucedido com cão.
  - Negação de claim para anônimos.
  - Negação de claim com hash de token inválido.
  - Prevenção de apropriação indevida entre usuários distintos.
  - Bloqueio estrito de claim para assessments com desfecho `BLOCK`.
  - Rejeição de cão pertencente a outro tutor.
  - Políticas RLS de isolamento de leitura entre tutores e negação anônima.
  - Política RLS de atualização de `dog_id`.
- `tests/e2e/p6.spec.ts`: 2 testes Playwright aprovados (desktop e mobile 360px), validando renderização da síntese observável, CTA de claim, ausência de overflow horizontal e zero violações axe.
- `pnpm verify`: 15 arquivos de teste e 106 testes aprovados, TypeScript strict e ESLint 0 warnings.
- `pnpm e2e:smoke`: 38 testes de regressão aprovados nos viewports desktop e mobile.
- `pnpm build`: build de produção Next.js 16.3.3 compilado com sucesso.

## Limites e próximo passo

O claim associa com segurança a avaliação ao tutor e ao cão, mas ainda não existe um motor de geração de plano de treino nem catálogo de módulos aprovados. A próxima fase é a **P7 (Catálogo aprovado e Plan Engine)**, que introduzirá a biblioteca versionada de exercícios de reforço positivo e o planner com saídas estruturadas e fallback determinístico seguro.
