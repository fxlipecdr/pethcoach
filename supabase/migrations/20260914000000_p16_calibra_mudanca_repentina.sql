-- P16 — corrige encaminhamento indevido por "começou de repente".
--
-- O gate encaminha quando há mudança repentina **junto de** sinal físico:
--
--   SUDDEN_CHANGE_WITH_PHYSICAL_SIGNS =
--     sudden_physical_change  OU  (sudden_change E (physical_change OU suspected_pain))
--
-- A regra foi desenhada para exigir dois sinais, e os quizzes originais a
-- respeitam: em `sudden_change`, a opção "mudou de repente" não carrega tag
-- nenhuma, e só "veio com mancar, vocalização ou outro sinal físico" dispara.
--
-- As perguntas de início criadas na migração 20260913000000 quebraram isso:
-- puseram `sudden_change` **e** `physical_change` na mesma opção simples. Com
-- isso, quem respondia apenas "começou de repente" recebia a tela de
-- encaminhamento dizendo que as respostas incluíam "mudança física" — algo que
-- essa pessoa nunca relatou. Começar de repente é resposta comum, então o
-- encaminhamento indevido virou o caminho mais frequente do quiz.
--
-- A correção devolve o desenho de dois sinais e, para não perder triagem, cria
-- a opção explícita de sinal físico que faltava nesses dois quizzes.

update public.quiz_questions
   set options_json = '[{"key":"always","label":"Desde sempre, é o jeito dele"},{"key":"gradual","label":"Foi aumentando aos poucos"},{"key":"routine","label":"Piorou depois de uma mudança de rotina"},{"key":"sudden","label":"Começou de repente, em um cão que não latia"},{"key":"sudden_physical","label":"De repente, junto com mancar, dor, perda de audição ou outro sinal físico"}]'::jsonb,
       rules_json = '{"optionTags":{"sudden":["sudden_change"],"sudden_physical":["sudden_change","suspected_pain","physical_change"]}}'::jsonb,
       updated_at = now()
 where key = 'barking_onset';

update public.quiz_questions
   set options_json = '[{"key":"always","label":"Desde que chegou em casa"},{"key":"routine","label":"Depois de uma mudança de rotina ou de casa"},{"key":"gradual","label":"Foi piorando com o tempo"},{"key":"sudden","label":"De repente, em um cão que ficava bem sozinho"},{"key":"sudden_physical","label":"De repente, junto com mancar, dor ou outro sinal físico"}]'::jsonb,
       rules_json = '{"optionTags":{"sudden":["sudden_change"],"sudden_physical":["sudden_change","suspected_pain","physical_change"]}}'::jsonb,
       updated_at = now()
 where key = 'alone_onset';
