# Analytics e atribuição

## Estado atual

Contrato de eventos e wrapper PostHog preparados. Nenhum evento, cookie analítico ou replay é iniciado automaticamente. P11 implementará consentimento, captura, persistência e dashboards. O callback `setAnalyticsConsent` é API interna, ainda não conectado a UI.

## Eventos obrigatórios do blueprint

| Evento | Origem / propriedades previstas |
|---|---|
| landing_view | Cliente com consentimento; slug, UTMs, referrer sanitizado, first_touch_id |
| quiz_started | Primeira resposta; problem_slug, anonymous_id |
| quiz_completed | Validação concluída; duration_s, safety_status |
| result_viewed | Resultado renderizado; segment, plan_eligible |
| account_created | Cadastro confirmado; source, first/last_touch_id |
| day1_started | Abertura do exercício; program_slug, exercise_id |
| paywall_viewed | Oferta visível; variant, plan_type |
| checkout_started | Backend confirmou checkout; price_id, offer_variant |
| purchase_completed | **Somente servidor após webhook**; amount, currency, product, attribution_id |
| task_completed | Conclusão idempotente; difficulty, confidence, duration_s |
| checkin_submitted | Check-in salvo; improvement_score, issue_tags |
| plan_adjusted | Nova versão salva; reason_code, ai_run_id |

O tipo do wrapper cliente exclui `purchase_completed`. P11 deve aplicar validação runtime, allowlists de propriedades e deduplicação por event_id. Não enviar e-mail, nome, resposta livre, prompt, query string completa, cookies ou URL de magic link.

## Atribuição futura

Registrar anonymous_id e first/last touch com data, landing, UTMs e click IDs permitidos (gclid/fbclid/ttclid), conforme consentimento/base jurídica revisados. First touch imutável. Last touch atualizado apenas por visita elegível. Preservar vínculo ao fazer claim após login e registrar associação à compra no backend. Não mesclar dados pessoais de projetos/ambientes.

## Dashboards previstos

- Aquisição: visita → início → conclusão do quiz por source/campaign/landing.
- Ativação: resultado → conta → Dia 1.
- Receita: paywall → checkout → compra; segmentar first e last touch.
- Retenção: retorno D1/D3/D7 e razões de cancelamento.
- Qualidade de programa: dificuldade e melhora autorrelatada, sem score clínico.
- IA/safety: falhas de schema, retries, bloqueios, custo/plano e latência.

Sem metas universais inventadas. Experimentos de preço e cadência ficam para fases próprias; não rodar experimentos críticos concorrentes com baixo volume.
