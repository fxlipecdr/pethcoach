-- P16 — quatro novos programas comportamentais.
--
-- O catálogo tinha três dores. Para tráfego pago isso é pouco: cada dor é um
-- público diferente, e três criativos não sustentam teste de campanha.
--
-- As quatro escolhidas saem do que a literatura e os relatos de tutores
-- apontam como mais frequente, e todas são tratáveis por reforço positivo:
--
--  * latido na porta e na campainha — o protocolo de "lugar de espera" tem
--    resultado medido em estudo com cães de família: latidos caíram de 19,3
--    para 2,1 por minuto e os pulos na porta foram a zero;
--  * pular nas pessoas — a análise funcional mostra que o comportamento é
--    mantido pela atenção de quem chega, inclusive empurrar e falar alto; a
--    intervenção troca a consequência em vez de punir o pulo;
--  * chamado que falhou — reconstruído por valor, em distância curta, com
--    guia longa enquanto não for confiável, porque a falha aqui atropela;
--  * ficar sozinho — este é o delicado. Ansiedade de separação é quadro
--    clínico: só médico-veterinário diagnostica, o tratamento leva de 8 a 16
--    semanas e às vezes envolve medicação. O programa cobre **prevenção e
--    desconforto leve**, e o quiz encaminha o resto. Os sinais de sofrimento
--    real — destruição em saídas, eliminação só na ausência, salivação,
--    automutilação, tentativa de fuga — caem nas tags que o gate já trata
--    como `severe_distress`, `self_injury` e `escape_risk`.
--
-- `reviewed_by` permanece nulo, como nos módulos existentes: nulo significa
-- sem revisão profissional, e inventar revisor foi justamente o defeito que a
-- migração 20260912000000 removeu.

-- ---------------------------------------------------------------- problemas

insert into public.problems(id, slug, title, status, quiz_version) values
  ('10000000-0000-4000-8000-000000000004', 'cachorro-late-muito', 'Meu cachorro late demais', 'published', 1),
  ('10000000-0000-4000-8000-000000000005', 'cachorro-pula-nas-pessoas', 'Meu cachorro pula nas pessoas', 'published', 1),
  ('10000000-0000-4000-8000-000000000006', 'cachorro-nao-vem-quando-chamado', 'Meu cachorro não vem quando chamo', 'published', 1),
  ('10000000-0000-4000-8000-000000000007', 'cachorro-nao-fica-sozinho', 'Meu cachorro não fica sozinho', 'published', 1);

-- ------------------------------------------------------------------- quizzes
--
-- Cada quiz termina com a mesma pergunta de triagem de risco, porque os sinais
-- que exigem veterinário não dependem da dor de entrada.

insert into public.quiz_questions(
  id, problem_id, key, type, prompt, help_text, options_json, rules_json,
  order_index, version, status
) values
  -- latido
  ('20000000-0000-4000-8000-000000000401', '10000000-0000-4000-8000-000000000004', 'barking_trigger', 'single_choice', 'O que costuma disparar o latido?', 'Escolha o gatilho mais frequente na rotina de vocês.', '[{"key":"doorbell","label":"Campainha, batida ou interfone"},{"key":"passersby","label":"Ver pessoas ou cães pela janela ou portão"},{"key":"alone","label":"Principalmente quando fica sozinho"},{"key":"varies","label":"Varia bastante, sem padrão claro"}]', '{"optionTags":{"alone":["severe_distress"]}}', 1, 1, 'published'),
  ('20000000-0000-4000-8000-000000000402', '10000000-0000-4000-8000-000000000004', 'barking_duration', 'single_choice', 'Quanto tempo o latido costuma durar?', null, '[{"key":"seconds","label":"Alguns segundos e ele para sozinho"},{"key":"minutes","label":"Alguns minutos, até a situação passar"},{"key":"long","label":"Continua mesmo depois que a pessoa já entrou"},{"key":"hours","label":"Chega a durar horas quando não estamos"}]', '{"optionTags":{"hours":["severe_distress"]}}', 2, 1, 'published'),
  ('20000000-0000-4000-8000-000000000403', '10000000-0000-4000-8000-000000000004', 'barking_body', 'single_choice', 'Como é o corpo dele enquanto late?', 'Se não tiver certeza, observe no próximo episódio antes de responder.', '[{"key":"alert","label":"Alerta e agitado, mas solto"},{"key":"excited","label":"Animado, abanando o rabo"},{"key":"stiff","label":"Rígido, encarando, pelo arrepiado"},{"key":"lunge","label":"Avança em direção à porta ou à pessoa"}]', '{"optionTags":{"stiff":["stiff_body"],"lunge":["contact_risk"]}}', 3, 1, 'published'),
  ('20000000-0000-4000-8000-000000000404', '10000000-0000-4000-8000-000000000004', 'barking_onset', 'single_choice', 'Desde quando isso acontece?', null, '[{"key":"always","label":"Desde sempre, é o jeito dele"},{"key":"gradual","label":"Foi aumentando aos poucos"},{"key":"routine","label":"Piorou depois de uma mudança de rotina"},{"key":"sudden","label":"Começou de repente, em um cão que não latia"}]', '{"optionTags":{"sudden":["sudden_change","physical_change"]}}', 4, 1, 'published'),

  -- pular
  ('20000000-0000-4000-8000-000000000501', '10000000-0000-4000-8000-000000000005', 'jumping_target', 'single_choice', 'Em quem ele pula com mais frequência?', null, '[{"key":"family","label":"Na gente, quando chegamos em casa"},{"key":"visitors","label":"Principalmente em visitas"},{"key":"everyone","label":"Em qualquer pessoa que apareça"},{"key":"vulnerable","label":"Inclusive em crianças, idosos ou gestantes"}]', '{"optionTags":{"vulnerable":["vulnerable_person_risk"]}}', 1, 1, 'published'),
  ('20000000-0000-4000-8000-000000000502', '10000000-0000-4000-8000-000000000005', 'jumping_reaction', 'single_choice', 'O que as pessoas costumam fazer quando ele pula?', 'Não existe resposta errada aqui. Isso ajuda a entender o que mantém o comportamento.', '[{"key":"pet","label":"Fazem carinho ou falam com ele"},{"key":"push","label":"Empurram ou afastam com as mãos"},{"key":"shout","label":"Falam alto, mandam descer"},{"key":"ignore","label":"Tentam ignorar e virar de lado"}]', '{}', 2, 1, 'published'),
  ('20000000-0000-4000-8000-000000000503', '10000000-0000-4000-8000-000000000005', 'jumping_mouth', 'single_choice', 'Ele usa a boca enquanto pula?', null, '[{"key":"no","label":"Não, só as patas"},{"key":"clothes","label":"Pega a roupa, sem machucar"},{"key":"skin","label":"Belisca a pele, deixa marca vermelha"},{"key":"injury","label":"Já machucou alguém, com sangramento"}]', '{"optionTags":{"skin":["contact_risk"],"injury":["bite_injury"]}}', 3, 1, 'published'),
  ('20000000-0000-4000-8000-000000000504', '10000000-0000-4000-8000-000000000005', 'jumping_settle', 'single_choice', 'Quanto tempo até ele se acalmar?', null, '[{"key":"seconds","label":"Poucos segundos"},{"key":"minute","label":"Cerca de um minuto"},{"key":"long","label":"Fica agitado enquanto a visita estiver de pé"},{"key":"cannot","label":"Não consegue se desligar de jeito nenhum"}]', '{"optionTags":{"cannot":["severe_distress"]}}', 4, 1, 'published'),

  -- chamado
  ('20000000-0000-4000-8000-000000000601', '10000000-0000-4000-8000-000000000006', 'recall_context', 'single_choice', 'Onde o chamado ainda funciona?', 'É daqui que o treino vai começar, então vale observar antes de responder.', '[{"key":"indoors","label":"Dentro de casa, em ambiente calmo"},{"key":"yard","label":"No quintal ou área cercada"},{"key":"leash","label":"Só quando ele está na guia"},{"key":"never","label":"Praticamente não funciona em lugar nenhum"}]', '{}', 1, 1, 'published'),
  ('20000000-0000-4000-8000-000000000602', '10000000-0000-4000-8000-000000000006', 'recall_competition', 'single_choice', 'O que costuma vencer o chamado?', null, '[{"key":"smell","label":"Cheiros no chão"},{"key":"dogs","label":"Outros cães"},{"key":"people","label":"Pessoas passando"},{"key":"running","label":"Qualquer coisa em movimento, inclusive carro"}]', '{"optionTags":{"running":["escape_risk"]}}', 2, 1, 'published'),
  ('20000000-0000-4000-8000-000000000603', '10000000-0000-4000-8000-000000000006', 'recall_history', 'single_choice', 'O que costuma acontecer quando ele vem?', 'Isso explica boa parte dos chamados que param de funcionar.', '[{"key":"reward","label":"Ganha carinho ou petisco"},{"key":"leash","label":"É colocado na guia e o passeio acaba"},{"key":"bath","label":"Vai para banho, remédio ou caixa de transporte"},{"key":"scold","label":"Às vezes leva bronca por ter demorado"}]', '{}', 3, 1, 'published'),
  ('20000000-0000-4000-8000-000000000604', '10000000-0000-4000-8000-000000000006', 'recall_escape', 'single_choice', 'Ele já fugiu ou escapou?', null, '[{"key":"no","label":"Nunca"},{"key":"almost","label":"Quase, mas conseguimos segurar"},{"key":"yes","label":"Sim, já saiu para a rua sozinho"},{"key":"often","label":"Acontece com alguma frequência"}]', '{"optionTags":{"yes":["escape_risk"],"often":["escape_risk"]}}', 4, 1, 'published'),

  -- ficar sozinho
  ('20000000-0000-4000-8000-000000000701', '10000000-0000-4000-8000-000000000007', 'alone_tolerance', 'single_choice', 'Quanto tempo ele fica bem sozinho hoje?', 'Se nunca observou, vale gravar um vídeo dos primeiros cinco minutos antes de responder.', '[{"key":"hours","label":"Horas, sem problema"},{"key":"minutes","label":"Alguns minutos, depois começa a reclamar"},{"key":"seconds","label":"Reage assim que saímos de perto"},{"key":"unknown","label":"Nunca consegui observar"}]', '{}', 1, 1, 'published'),
  ('20000000-0000-4000-8000-000000000702', '10000000-0000-4000-8000-000000000007', 'alone_behavior', 'single_choice', 'O que ele faz quando fica sozinho?', 'Esta é a pergunta que separa desconforto leve de sofrimento que precisa de veterinário.', '[{"key":"settles","label":"Reclama um pouco e depois deita"},{"key":"vocal","label":"Chora ou late boa parte do tempo"},{"key":"destroys_exits","label":"Destrói portas, janelas ou batentes"},{"key":"soils","label":"Faz xixi ou cocô só quando está sozinho"}]', '{"optionTags":{"vocal":["severe_distress"],"destroys_exits":["severe_distress","escape_risk"],"soils":["severe_distress"]}}', 2, 1, 'published'),
  ('20000000-0000-4000-8000-000000000703', '10000000-0000-4000-8000-000000000007', 'alone_physical', 'single_choice', 'Você já notou algum destes sinais?', 'Marque o mais grave que você já viu.', '[{"key":"none","label":"Nenhum deles"},{"key":"drool","label":"Baba muito, deixa poça de saliva"},{"key":"self_harm","label":"Machucou patas, unhas ou focinho tentando sair"},{"key":"escape","label":"Conseguiu fugir de casa na nossa ausência"}]', '{"optionTags":{"drool":["severe_distress"],"self_harm":["self_injury"],"escape":["escape_risk"]}}', 3, 1, 'published'),
  ('20000000-0000-4000-8000-000000000704', '10000000-0000-4000-8000-000000000007', 'alone_onset', 'single_choice', 'Quando isso começou?', null, '[{"key":"always","label":"Desde que chegou em casa"},{"key":"routine","label":"Depois de uma mudança de rotina ou de casa"},{"key":"gradual","label":"Foi piorando com o tempo"},{"key":"sudden","label":"De repente, em um cão que ficava bem sozinho"}]', '{"optionTags":{"sudden":["sudden_change","physical_change"]}}', 4, 1, 'published');

-- ------------------------------------------------------------------- módulos

insert into public.modules (
  id, problem_id, slug, title, category, difficulty, estimated_duration_minutes,
  setup_instructions, steps, success_criteria, stop_conditions,
  tags, contraindications, version, status, reviewed_by, reviewed_at
) values
  -- latido na porta
  (
    '70000000-0000-4000-8000-000000000401',
    '10000000-0000-4000-8000-000000000004',
    'lugar-de-espera-com-valor',
    'Um lugar bom de esperar',
    'ambientacao',
    'beginner',
    4,
    'Tapete ou caminha a cerca de dois metros da porta, petiscos pequenos, ambiente silencioso. Sem campainha nesta etapa.',
    '["Jogue um petisco no tapete e deixe o cão ir sozinho até lá.", "Com as quatro patas no tapete, recompense ali mesmo, no tapete.", "Solte-o para sair do tapete e repita.", "Encerre enquanto ele ainda quer continuar."]'::jsonb,
    'O cão volta sozinho ao tapete esperando o petisco, em 8 de 10 repetições.',
    'Se ele não sair do tapete por medo, congelar ou recusar o petisco, encerre e reduza o barulho do ambiente.',
    array['door', 'quiet', 'station'],
    array['severe_distress', 'bite_injury'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000402',
    '10000000-0000-4000-8000-000000000004',
    'som-fraco-no-lugar-de-espera',
    'Som fraco, calma no lugar',
    'ambiente',
    'beginner',
    5,
    'Mesmo tapete. Uma segunda pessoa bate de leve na parede, longe da porta. O som precisa ser fraco o bastante para não disparar o latido.',
    '["Com o cão no tapete, peça a batida fraca.", "Recompense imediatamente se ele continuar no tapete.", "Se ele latir, o som foi alto demais: diminua e recomece.", "Faça no máximo cinco repetições por sessão."]'::jsonb,
    'Três repetições seguidas com o som e sem latido.',
    'Se latir em duas repetições seguidas, pare a sessão e volte ao som mais fraco no próximo dia.',
    array['door', 'sound', 'station'],
    array['severe_distress', 'contact_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000403',
    '10000000-0000-4000-8000-000000000004',
    'campainha-em-volume-crescente',
    'Campainha, um degrau por vez',
    'foco',
    'intermediate',
    6,
    'Campainha real ou gravada, em volume baixo. Petiscos de valor alto à mão.',
    '["Toque a campainha no menor volume possível e recompense a permanência no tapete.", "Suba o volume só quando três repetições saírem sem latido.", "Alterne com repetições fáceis para não subir rápido demais.", "Termine sempre com uma repetição que ele acerta."]'::jsonb,
    'Campainha em volume normal com o cão permanecendo no tapete.',
    'Se ele sair do tapete e latir, o degrau foi grande: volte dois níveis de volume.',
    array['door', 'sound', 'generalization'],
    array['severe_distress', 'contact_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000404',
    '10000000-0000-4000-8000-000000000004',
    'pessoa-entrando-de-verdade',
    'Alguém entrando de verdade',
    'manejo',
    'advanced',
    7,
    'Uma pessoa conhecida combinada de antemão, guia presa por segurança e o tapete no lugar de sempre.',
    '["A pessoa toca a campainha e espera do lado de fora.", "Recompense a permanência no tapete antes de abrir.", "Abra a porta; a pessoa entra devagar e sem falar com o cão.", "Libere o cão para cumprimentar só depois de alguns segundos de calma."]'::jsonb,
    'A pessoa entra e o cão permanece no tapete até ser liberado.',
    'Interrompa se houver rosnado, corpo rígido ou investida em direção à pessoa.',
    array['door', 'people', 'generalization'],
    array['contact_risk', 'bite_injury', 'high_risk_bite'],
    1, 'published', null, null
  ),

  -- pular nas pessoas
  (
    '70000000-0000-4000-8000-000000000501',
    '10000000-0000-4000-8000-000000000005',
    'quatro-patas-valem-petisco',
    'Quatro patas valem petisco',
    'reforco',
    'beginner',
    3,
    'Ambiente interno, só com gente da casa, petiscos pequenos na mão.',
    '["Aproxime-se devagar do cão.", "Com as quatro patas no chão, entregue o petisco no chão, perto das patas.", "Se ele pular, fique parado e em silêncio, sem empurrar nem olhar.", "Repita em sessões curtas, várias vezes ao dia."]'::jsonb,
    'Dez entregas seguidas com as quatro patas no chão.',
    'Se ele beliscar a pele ou a roupa com força, encerre a sessão.',
    array['greeting', 'reinforcement'],
    array['bite_injury', 'vulnerable_person_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000502',
    '10000000-0000-4000-8000-000000000005',
    'cumprimento-com-a-pessoa-parada',
    'Cumprimento com a pessoa parada',
    'direcionamento',
    'beginner',
    4,
    'Uma pessoa da casa, em pé, parada. O cão solto no ambiente.',
    '["A pessoa fica parada, braços ao longo do corpo.", "Assim que as quatro patas estiverem no chão perto dela, recompense no chão.", "A pessoa só faz carinho quando as patas estão embaixo.", "Se ele pular, ela vira o corpo de lado e espera."]'::jsonb,
    'O cão se aproxima e permanece com as patas no chão para receber carinho.',
    'Encerre se o cão travar o corpo, rosnar ou não conseguir se acalmar.',
    array['greeting', 'people'],
    array['bite_injury', 'vulnerable_person_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000503',
    '10000000-0000-4000-8000-000000000005',
    'chegada-em-partes',
    'A chegada, em partes',
    'foco',
    'intermediate',
    6,
    'Guia presa por segurança. A chegada é dividida: som da porta, porta abrindo, pessoa parada, pessoa andando.',
    '["Treine só o som da porta, recompensando as patas no chão.", "Depois a porta abrindo, sem ninguém entrar.", "Depois a pessoa parada na soleira.", "Só então a pessoa entrando e caminhando."]'::jsonb,
    'Cada etapa com três repetições sem pulo antes de passar para a próxima.',
    'Se ele pular em duas repetições seguidas, volte uma etapa.',
    array['greeting', 'door', 'generalization'],
    array['bite_injury', 'contact_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000504',
    '10000000-0000-4000-8000-000000000005',
    'visita-de-verdade-com-combinado',
    'Visita de verdade, com combinado',
    'manejo',
    'advanced',
    7,
    'Uma visita avisada antes do que vai acontecer, guia presa e petiscos com quem chega.',
    '["Combine com a visita: só faz carinho com as quatro patas no chão.", "Receba com o cão na guia, dando distância.", "Recompense cada instante de patas no chão.", "Solte a guia apenas quando ele estiver calmo."]'::jsonb,
    'A visita entra e cumprimenta sem que o cão pule.',
    'Interrompa se houver boca na pele, rosnado ou risco de derrubar alguém.',
    array['greeting', 'people', 'generalization'],
    array['vulnerable_person_risk', 'bite_injury', 'high_risk_bite'],
    1, 'published', null, null
  ),

  -- chamado
  (
    '70000000-0000-4000-8000-000000000601',
    '10000000-0000-4000-8000-000000000006',
    'recarregar-a-palavra',
    'Recarregar a palavra',
    'reforco',
    'beginner',
    3,
    'Cômodo calmo, cão a dois passos, petiscos de valor alto em pedaços pequenos.',
    '["Diga o chamado uma única vez, com voz animada.", "No primeiro movimento na sua direção, comemore.", "Entregue vários petiscos seguidos, um de cada vez.", "Solte-o para voltar ao que fazia."]'::jsonb,
    'Dez chamados seguidos com resposta imediata, dentro de casa.',
    'Se ele não vier, não repita o chamado: reduza a distância e recomece na próxima sessão.',
    array['recall', 'reinforcement'],
    array['escape_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000602',
    '10000000-0000-4000-8000-000000000006',
    'chamado-entre-comodos',
    'Chamado entre cômodos',
    'foco',
    'beginner',
    4,
    'Mesma palavra, agora de outro cômodo, sem o cão ver você.',
    '["Chame uma vez de um cômodo vizinho.", "Comemore assim que ouvir os passos vindo.", "Entregue a recompensa quando ele chegar até você.", "Termine antes de ele cansar do jogo."]'::jsonb,
    'Oito de dez chamados com o cão vindo de outro cômodo.',
    'Se ele parar no meio do caminho, aproxime-se e facilite. Nunca chame de novo mais alto.',
    array['recall', 'distance'],
    array['escape_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000603',
    '10000000-0000-4000-8000-000000000006',
    'guia-longa-com-distracao',
    'Guia longa com distração',
    'direcionamento',
    'intermediate',
    7,
    'Guia longa de cinco a dez metros, peitoral confortável, área externa tranquila. A guia é obrigatória: o chamado ainda não é confiável.',
    '["Deixe o cão explorar na ponta da guia longa.", "Chame quando ele estiver distraído, mas não absorto.", "Comemore e recompense generosamente quando vier.", "Solte-o de volta para explorar: vir até você não encerra a diversão."]'::jsonb,
    'Sete de dez chamados com resposta em ambiente externo, na guia longa.',
    'Se ele ignorar duas vezes seguidas, o ambiente está difícil demais: volte para um lugar mais calmo.',
    array['recall', 'outdoor', 'distraction'],
    array['escape_risk', 'contact_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000604',
    '10000000-0000-4000-8000-000000000006',
    'chamado-em-emergencia',
    'Chamado de emergência',
    'manejo',
    'advanced',
    6,
    'Uma segunda palavra, diferente do chamado do dia a dia, reservada só para urgência. Guia longa mantida.',
    '["Escolha uma palavra que você nunca usou com ele.", "Diga a palavra e entregue imediatamente uma recompensa excepcional, sem pedir nada em troca.", "Repita algumas vezes por dia, por vários dias, sempre com a mesma recompensa.", "Só depois comece a dizê-la quando ele estiver a poucos passos."]'::jsonb,
    'O cão interrompe o que está fazendo e olha para você ao ouvir a palavra.',
    'Nunca use essa palavra para algo que ele não gosta. Uma única vez já reduz o valor dela.',
    array['recall', 'emergency'],
    array['escape_risk'],
    1, 'published', null, null
  ),

  -- ficar sozinho
  (
    '70000000-0000-4000-8000-000000000701',
    '10000000-0000-4000-8000-000000000007',
    'descobrir-o-tempo-que-ele-suporta',
    'Descobrir o tempo que ele suporta',
    'ambientacao',
    'beginner',
    5,
    'Celular gravando o cômodo onde ele fica. Você sai apenas do cômodo, sem sair de casa.',
    '["Deixe o cão no cômodo e saia por três segundos.", "Volte com calma, sem festa e sem falar com ele.", "Assista ao vídeo depois: procure o instante exato em que ele muda de postura.", "Anote esse tempo. Ele é o ponto de partida do programa."]'::jsonb,
    'Você sabe, em segundos, quanto tempo ele fica tranquilo.',
    'Se ele reagir antes de você sair, o ponto de partida é a saída em si: pare aqui e avance com o exercício de sinais de saída.',
    array['alone', 'baseline'],
    array['severe_distress', 'self_injury', 'escape_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000702',
    '10000000-0000-4000-8000-000000000007',
    'sinais-de-saida-sem-significado',
    'Sinais de saída sem significado',
    'ambiente',
    'beginner',
    4,
    'As pistas que anunciam sua saída: pegar a chave, calçar o sapato, pegar a bolsa. O cão relaxado no ambiente.',
    '["Pegue a chave e volte a guardá-la, sem sair.", "Repita várias vezes ao longo do dia, sem nenhuma consequência.", "Faça o mesmo com o sapato e a bolsa, um sinal por vez.", "Só siga adiante quando ele parar de se levantar ao ver a pista."]'::jsonb,
    'Ele permanece deitado quando você pega a chave.',
    'Se ele se levantar e seguir você a cada repetição, faça menos repetições e mais espaçadas.',
    array['alone', 'departure-cues'],
    array['severe_distress', 'self_injury'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000703',
    '10000000-0000-4000-8000-000000000007',
    'ausencia-que-cresce-devagar',
    'Ausência que cresce devagar',
    'foco',
    'intermediate',
    6,
    'Comece no tempo que ele suporta, medido no primeiro exercício, e sempre um pouco abaixo dele.',
    '["Saia pelo tempo que ele tolera bem e volte antes de qualquer sinal de incômodo.", "Alterne ausências curtas e um pouco mais longas, sem seguir uma escada fixa.", "Aumente em poucos segundos, não em minutos.", "Encerre a sessão sempre com uma ausência fácil."]'::jsonb,
    'Ausências no tempo alvo com o cão permanecendo deitado, confirmado em vídeo.',
    'Qualquer vocalização, andar em círculos ou tentativa de segui-lo significa que o tempo foi longo demais. Volte ao anterior.',
    array['alone', 'duration'],
    array['severe_distress', 'self_injury', 'escape_risk'],
    1, 'published', null, null
  ),
  (
    '70000000-0000-4000-8000-000000000704',
    '10000000-0000-4000-8000-000000000007',
    'saida-real-pela-porta',
    'Saída real pela porta',
    'manejo',
    'advanced',
    7,
    'Agora a porta de casa, com o vídeo gravando. Nada de despedida longa nem de volta comemorada.',
    '["Saia pela porta e volte em poucos segundos.", "Aumente o tempo apenas quando o vídeo mostrar um cão indiferente.", "Mantenha a rotina de sempre ao sair e ao voltar.", "Se precisar sair por mais tempo do que ele tolera, combine com alguém para ficar com ele."]'::jsonb,
    'Saídas pela porta no tempo alvo, com o cão deitado durante toda a ausência.',
    'Interrompa o programa e procure um médico-veterinário se aparecer destruição em portas ou janelas, salivação intensa, eliminação na ausência ou qualquer machucado.',
    array['alone', 'door', 'generalization'],
    array['severe_distress', 'self_injury', 'escape_risk'],
    1, 'published', null, null
  );

comment on table public.modules is
  'Catálogo de exercícios por problema. `reviewed_by` nulo significa sem revisão profissional.';
