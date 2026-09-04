begin;

-- 1. Behavior Modules Catalog
create table public.modules (
  id uuid primary key,
  problem_id uuid not null references public.problems(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(btrim(title)) between 1 and 140),
  category text not null check (char_length(btrim(category)) between 1 and 60),
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  estimated_duration_minutes integer not null check (estimated_duration_minutes between 2 and 15),
  setup_instructions text not null check (char_length(btrim(setup_instructions)) >= 1),
  steps jsonb not null check (
    jsonb_typeof(steps) = 'array'
    and jsonb_array_length(steps) between 1 and 6
  ),
  success_criteria text not null check (char_length(btrim(success_criteria)) >= 1),
  stop_conditions text not null check (char_length(btrim(stop_conditions)) >= 1),
  tags text[] not null default '{}',
  contraindications text[] not null default '{}',
  version integer not null default 1 check (version > 0),
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'archived')),
  reviewed_by text check (reviewed_by is null or char_length(reviewed_by) <= 120),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger modules_updated_at before update on public.modules
  for each row execute function public.set_updated_at();

alter table public.modules enable row level security;
alter table public.modules force row level security;
revoke all on public.modules from public, anon, authenticated;
grant select on public.modules to anon, authenticated;
create policy modules_read_published on public.modules for select to anon, authenticated
  using (status = 'published');

-- 2. Training Plans
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  problem_id uuid not null references public.problems(id),
  status text not null default 'active' check (status in ('active', 'completed', 'paused', 'archived')),
  current_day integer not null default 1 check (current_day between 1 and 30),
  total_days integer not null default 14 check (total_days in (7, 14, 21, 30)),
  planner_type text not null check (planner_type in ('deterministic_fallback', 'llm_structured')),
  prompt_version text check (prompt_version is null or char_length(prompt_version) <= 40),
  model_version text check (model_version is null or char_length(model_version) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plans_updated_at before update on public.plans
  for each row execute function public.set_updated_at();

alter table public.plans enable row level security;
alter table public.plans force row level security;
revoke all on public.plans from public, anon, authenticated;
grant select, insert, update, delete on public.plans to authenticated;
create policy plans_owner_all on public.plans for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3. Plan Tasks (1 to 3 tasks per day)
create table public.plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 30),
  order_index integer not null check (order_index between 1 and 3),
  module_id uuid not null references public.modules(id),
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped')),
  completed_at timestamptz,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, day_number, order_index)
);

create trigger plan_tasks_updated_at before update on public.plan_tasks
  for each row execute function public.set_updated_at();

alter table public.plan_tasks enable row level security;
alter table public.plan_tasks force row level security;
revoke all on public.plan_tasks from public, anon, authenticated;
grant select, insert, update, delete on public.plan_tasks to authenticated;
create policy plan_tasks_owner_all on public.plan_tasks for all to authenticated
  using (exists (select 1 from public.plans where plans.id = plan_tasks.plan_id and plans.user_id = auth.uid()))
  with check (exists (select 1 from public.plans where plans.id = plan_tasks.plan_id and plans.user_id = auth.uid()));

-- 4. Initial Seed: 12 Reviewed & Published Positive Reinforcement Modules (4 per problem)
insert into public.modules (
  id, problem_id, slug, title, category, difficulty, estimated_duration_minutes,
  setup_instructions, steps, success_criteria, stop_conditions,
  tags, contraindications, version, status, reviewed_by, reviewed_at
) values
  -- Problem 1: cachorro-puxa-guia
  (
    '70000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'pausa-antes-da-porta',
    'Pausa tranquila antes da porta',
    'ambientacao',
    'beginner',
    3,
    'Ambiente interno, peitoral confortável, guia frouxa e petiscos pequenos.',
    '["Fique parado em frente à porta fechada com a guia sem tensão.", "Aguarde o cão relaxar ou olhar para você voluntariamente.", "Marque com elogio e recompense imediatamente.", "Abra a porta lentamente apenas se a guia permanecer relaxada."]'::jsonb,
    '3 repetições onde o cão permanece calmo com a porta se abrindo.',
    'Se o cão ganir, pular na porta ou apresentar agitação intensa, interrompa o exercício.',
    array['door', 'quiet', 'focus'],
    array['bite_injury', 'severe_distress'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'atencao-voluntaria-guia-frouxa',
    'Atenção voluntária e guia frouxa',
    'foco',
    'beginner',
    4,
    'Área com poucas distrações (corredor ou quintal calmo), guia de 1,5m a 2m.',
    '["Caminhe em ritmo natural e calmo.", "Sempre que a guia estiver com folga em U, marque e entregue a recompensa rente à sua perna.", "Se a guia esticar, pare suavemente sem dar trancos e espere o cão aliviar a tensão."]'::jsonb,
    'Manter a guia frouxa por pelo menos 10 passos contínuos.',
    'Não dê puxões de volta. Se houver cansaço ou frustração, pause a sessão.',
    array['walk', 'reward', 'reinforcement'],
    array['suspected_pain'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'manejo-de-distancia',
    'Manejo calmo de distância de estímulos',
    'manejo',
    'intermediate',
    5,
    'Espaço aberto com estímulos previsíveis a pelo menos 15 metros de distância.',
    '["Identifique o estímulo antes do cão ficar rígido.", "Aumente a distância até o cão conseguir olhar para você e aceitar petiscos.", "Recompense o olhar calmo em direção ao estímulo seguido de olhar para você."]'::jsonb,
    'O cão observa o estímulo à distância sem latir ou avançar na guia.',
    'Se o cão fixar o olhar com rigidez ou avançar, aumente a distância imediatamente.',
    array['stimuli', 'distance', 'threshold'],
    array['high_risk_bite'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000001',
    'curva-e-redirecionamento',
    'Mudança de direção sem tranco',
    'direcionamento',
    'intermediate',
    4,
    'Ambiente com estímulos moderados, recompensas de alto valor prontas na mão.',
    '["Antes da guia esticar completamente, faça um som amigável e mude a trajetória em curva suave.", "Quando o cão seguir seu movimento, recompense com entusiasmo calmo.", "Retome o passeio no novo sentido sem pressa."]'::jsonb,
    '3 mudanças de direção suaves sem tensão na guia.',
    'Não use enforcador nem correções mecânicas.',
    array['turn', 'redirection', 'loose_leash'],
    array['aversive_method'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),

  -- Problem 2: filhote-mordendo
  (
    '70000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    'troca-calma-por-brinquedo',
    'Troca calma por um brinquedo',
    'redirecionamento',
    'beginner',
    3,
    'Dois brinquedos apropriados com texturas que o filhote prefere (corda, borracha macia).',
    '["Apresente o brinquedo antes que as mãos virem o alvo.", "Mova o brinquedo de forma estimulante no chão.", "Quando o filhote morder o objeto certo, elogie e brinque por 15 segundos.", "Se dentes tocarem a pele, pare o movimento e afaste as mãos com calma."]'::jsonb,
    'Filhote engaja no brinquedo e não nas mãos durante a sessão.',
    'Nunca segure a boca do filhote nem dê broncas com gritos.',
    array['play', 'hands', 'toy_swap'],
    array['bite_injury'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000002',
    'pausa-estruturada-de-descanso',
    'Pausa estruturada e rotina de sono',
    'rotina',
    'beginner',
    5,
    'Ambiente calmo, cama confortável, pouca luz e ruído reduzido.',
    '["Perceba os sinais de cansaço (mordidas frenéticas, olhos esbugalhados).", "Leve o filhote com voz baixa para a área de descanso.", "Ofereça um item de mastigação segura ou carinho lento no peito.", "Permita que ele adormeça sem novos estímulos."]'::jsonb,
    'Filhote desacelera e relaxa após a brincadeira.',
    'Não force contenção física se houver pânico.',
    array['rest', 'evening', 'sleep_routine'],
    array['severe_distress'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000002',
    'mastigacao-segura-direcionada',
    'Mordedores e enriquecimento mastigatório',
    'enriquecimento',
    'beginner',
    5,
    'Mordedores de nylon macio, brinquedo recheável com comida úmida congelada.',
    '["Ofereça o mordedor nos horários de pico de agitação.", "Segure uma ponta para ajudar o filhote a começar a roer.", "Deixe o filhote focado na atividade mastigatória com supervisão."]'::jsonb,
    'Filhote mastiga o objeto adequado por pelo menos 5 minutos seguidos.',
    'Verifique sempre o desgaste do item para evitar engasgos.',
    array['chewing', 'enrichment', 'calm'],
    array['suspected_pain'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000002',
    'interrupcao-sem-confronto',
    'Pausa neutra sem confronto',
    'manejo',
    'intermediate',
    3,
    'Local sem barreiras pontiagudas, tutor calmo e paciente.',
    '["Se o filhote morder roupas ou pés, fique imóvel imediatamente (como uma árvore).", "Não puxe com força para não virar cabo de guerra.", "Assim que os dentes soltarem, dê 3 segundos de pausa e ofereça um brinquedo."]'::jsonb,
    'Filhote solta a roupa ou pele ao perceber a imobilidade.',
    'Se o filhote rosnar com rigidez ou demonstrar ferimentos, chame um profissional.',
    array['clothes', 'freeze', 'neutral_pause'],
    array['vulnerable_person_risk'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),

  -- Problem 3: xixi-lugar-errado
  (
    '70000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000003',
    'ida-previsivel-ao-local',
    'Uma ida previsível ao local certo',
    'rotina',
    'beginner',
    5,
    'Local do tapete higiênico ou grama, petiscos saborosos no bolso.',
    '["Leve o cão ao local imediatamente ao acordar, 15 min após comer e após brincar.", "Fique em silêncio por até 5 minutos no local, permitindo que ele cheire.", "Não brinque nem converse em excesso nesse momento."]'::jsonb,
    'O cão utiliza o local correto em pelo menos uma oportunidade previsível.',
    'Se o cão chorar de dor ou fizer esforço sem urinar, procure avaliação veterinária imediata.',
    array['wake_meals', 'toilet_schedule', 'routine'],
    array['suspected_pain'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000003',
    'reforco-imediato-do-acerto',
    'Recompensa de alto valor no instante do acerto',
    'reforco',
    'beginner',
    3,
    'Recompensas irresistíveis prontas na mão.',
    '["Aguarde o cão terminar completamente a micção.", "Assim que ele terminar, elogie com carinho e entregue o petisco em até 2 segundos.", "Permita alguns minutos de circulação tranquila em seguida."]'::jsonb,
    'Associação clara entre terminar no local e receber a recompensa.',
    'Nunca recompense antes de terminar para não interromper a fisiologia do cão.',
    array['immediate_reward', 'toilet_success', 'positive'],
    array['sudden_change'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000003',
    'supervisao-momentos-chave',
    'Supervisão atenta aos sinais precursores',
    'supervisao',
    'intermediate',
    5,
    'Ambiente integrado, olhos atentos aos movimentos corporais do cão.',
    '["Observe sinais discretos: cheirar o chão em círculos, parar de brincar de repente, andar em direção aos cantos.", "Ao notar o sinal, convide o cão amigavelmente para o local correto.", "Recompense assim que fizer no local."]'::jsonb,
    'Identificar o sinal precursor e antecipar a ida ao local correto.',
    'Nunca grite ou assuste o cão quando notar o início do comportamento.',
    array['supervision', 'body_signals', 'prevention'],
    array['severe_distress'],
    1,
    'published',
    'educador-supervisor',
    now()
  ),
  (
    '70000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000003',
    'organizacao-e-limpeza-neutra',
    'Acesso livre e limpeza enzimática neutra',
    'ambiente',
    'beginner',
    4,
    'Limpador enzimático (sem amônia), tapetes limpos com base fixa sem deslizar.',
    '["Garanta que a área de higiene seja estável e não fique bloqueada por portas ou móveis.", "Mantenha longe dos potes de comida e água.", "Em caso de acidentes, limpe sem o cão ver, sem broncas e sem esfregar focinho."]'::jsonb,
    'Ambiente estruturado e livre de odores residuais de amônia.',
    'Proibido qualquer punição física ou repreensão verbal em acidentes passados.',
    array['toilet_access', 'neutral_cleaning', 'environment'],
    array['aversive_method'],
    1,
    'published',
    'educador-supervisor',
    now()
  );

commit;
