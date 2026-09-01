begin;

create table public.problems (
  id uuid primary key,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  quiz_version integer not null default 1 check (quiz_version > 0),
  seo_meta jsonb not null default '{}'::jsonb check (jsonb_typeof(seo_meta) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger problems_updated_at before update on public.problems
  for each row execute function public.set_updated_at();
alter table public.problems enable row level security;
alter table public.problems force row level security;
revoke all on public.problems from public, anon, authenticated;
grant select (id, slug, title, status, quiz_version) on public.problems to anon, authenticated;
create policy problems_read_published on public.problems for select to anon, authenticated
  using (status = 'published');

create table public.quiz_questions (
  id uuid primary key,
  problem_id uuid not null references public.problems(id) on delete cascade,
  key text not null check (key ~ '^[a-z][a-z0-9_]*$' and char_length(key) <= 80),
  type text not null check (type = 'single_choice'),
  prompt text not null check (char_length(btrim(prompt)) between 1 and 240),
  help_text text check (help_text is null or char_length(btrim(help_text)) between 1 and 300),
  options_json jsonb not null check (
    jsonb_typeof(options_json) = 'array'
    and jsonb_array_length(options_json) between 2 and 8
    and octet_length(options_json::text) <= 8192
  ),
  rules_json jsonb not null default '{}'::jsonb check (
    jsonb_typeof(rules_json) = 'object' and octet_length(rules_json::text) <= 4096
  ),
  order_index integer not null check (order_index between 1 and 20),
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (problem_id, version, key),
  unique (problem_id, version, order_index)
);
create index quiz_questions_published_idx
  on public.quiz_questions(problem_id, version, order_index) where status = 'published';
create trigger quiz_questions_updated_at before update on public.quiz_questions
  for each row execute function public.set_updated_at();
alter table public.quiz_questions enable row level security;
alter table public.quiz_questions force row level security;
revoke all on public.quiz_questions from public, anon, authenticated;
grant select (id, problem_id, key, type, prompt, help_text, options_json, order_index, version)
  on public.quiz_questions to anon, authenticated;
create policy quiz_questions_read_published on public.quiz_questions for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.problems
      where problems.id = quiz_questions.problem_id
        and problems.status = 'published'
        and problems.quiz_version = quiz_questions.version
    )
  );

create table public.assessments (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_id uuid not null,
  dog_id uuid references public.dogs(id) on delete set null,
  problem_id uuid not null references public.problems(id),
  quiz_version integer not null check (quiz_version > 0),
  answers_json jsonb not null default '{}'::jsonb check (
    jsonb_typeof(answers_json) = 'object' and octet_length(answers_json::text) <= 16384
  ),
  safety_status text not null default 'pending'
    check (safety_status in ('pending', 'continue', 'refer', 'block')),
  segment text check (segment is null or char_length(segment) <= 80),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  anonymous_token_hash text not null
    check (anonymous_token_hash ~ '^[0-9a-f]{64}$'),
  token_expires_at timestamptz not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'completed') = (completed_at is not null))
);
create index assessments_user_created_idx on public.assessments(user_id, created_at desc)
  where user_id is not null;
create index assessments_anonymous_created_idx on public.assessments(anonymous_id, created_at desc);
create index assessments_expiry_idx on public.assessments(token_expires_at)
  where status = 'in_progress';
create trigger assessments_updated_at before update on public.assessments
  for each row execute function public.set_updated_at();
alter table public.assessments enable row level security;
alter table public.assessments force row level security;
revoke all on public.assessments from public, anon, authenticated;

create table private.assessment_rate_limits (
  key_hash text primary key check (key_hash ~ '^([a-z]:)?[0-9a-f]{64}$'),
  request_count integer not null check (request_count > 0),
  window_started_at timestamptz not null,
  updated_at timestamptz not null default now()
);
revoke all on private.assessment_rate_limits from public, anon, authenticated;

create function private.consume_assessment_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row private.assessment_rate_limits%rowtype;
begin
  if p_key_hash !~ '^([a-z]:)?[0-9a-f]{64}$'
     or p_limit not between 1 and 500
     or p_window_seconds not between 10 and 86400 then
    return false;
  end if;
  insert into private.assessment_rate_limits(key_hash, request_count, window_started_at, updated_at)
  values (p_key_hash, 1, v_now, v_now)
  on conflict (key_hash) do nothing;
  if found then return true; end if;
  select * into v_row from private.assessment_rate_limits
    where key_hash = p_key_hash for update;
  if v_row.window_started_at <= v_now - make_interval(secs => p_window_seconds) then
    update private.assessment_rate_limits
      set request_count = 1, window_started_at = v_now, updated_at = v_now
      where key_hash = p_key_hash;
    return true;
  end if;
  if v_row.request_count >= p_limit then return false; end if;
  update private.assessment_rate_limits
    set request_count = request_count + 1, updated_at = v_now
    where key_hash = p_key_hash;
  return true;
end;
$$;
revoke all on function private.consume_assessment_rate_limit(text, integer, integer)
  from public, anon, authenticated;

create function public.create_anonymous_assessment(
  p_assessment_id uuid,
  p_anonymous_id uuid,
  p_problem_slug text,
  p_token_hash text,
  p_token_expires_at timestamptz,
  p_rate_key text
) returns table (
  assessment_id uuid,
  problem_slug text,
  quiz_version integer,
  started_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_problem public.problems%rowtype;
  v_started timestamptz := clock_timestamp();
begin
  if p_token_hash !~ '^[0-9a-f]{64}$'
     or p_token_expires_at <= v_started
     or p_token_expires_at > v_started + interval '8 days'
     or not private.consume_assessment_rate_limit(p_rate_key, 10, 600) then
    raise exception using errcode = 'P0001', message = 'assessment_request_rejected';
  end if;
  select * into v_problem from public.problems
    where slug = p_problem_slug and status = 'published';
  if not found then
    raise exception using errcode = 'P0001', message = 'assessment_problem_unavailable';
  end if;
  insert into public.assessments(
    id, user_id, anonymous_id, problem_id, quiz_version,
    anonymous_token_hash, token_expires_at, started_at
  ) values (
    p_assessment_id, auth.uid(), p_anonymous_id, v_problem.id, v_problem.quiz_version,
    p_token_hash, p_token_expires_at, v_started
  );
  return query select p_assessment_id, v_problem.slug, v_problem.quiz_version, v_started;
end;
$$;

create function public.read_anonymous_assessment(
  p_assessment_id uuid,
  p_token_hash text
) returns table (
  assessment_id uuid,
  problem_slug text,
  quiz_version integer,
  answers_json jsonb,
  assessment_status text,
  safety_status text,
  started_at timestamptz,
  completed_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select a.id, p.slug, a.quiz_version, a.answers_json, a.status,
         a.safety_status, a.started_at, a.completed_at
  from public.assessments a
  join public.problems p on p.id = a.problem_id
  where a.id = p_assessment_id
    and a.anonymous_token_hash = p_token_hash
    and a.token_expires_at > clock_timestamp()
$$;

create function public.update_anonymous_assessment_answer(
  p_assessment_id uuid,
  p_token_hash text,
  p_question_key text,
  p_option_key text
) returns table (
  answers_json jsonb,
  updated_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_assessment public.assessments%rowtype;
  v_question public.quiz_questions%rowtype;
begin
  if not private.consume_assessment_rate_limit('u:' || p_token_hash, 120, 600) then
    raise exception using errcode = 'P0001', message = 'assessment_rate_limited';
  end if;
  select * into v_assessment from public.assessments
    where id = p_assessment_id
      and anonymous_token_hash = p_token_hash
      and token_expires_at > clock_timestamp()
      and status = 'in_progress'
    for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'assessment_not_available';
  end if;
  select * into v_question from public.quiz_questions
    where problem_id = v_assessment.problem_id
      and version = v_assessment.quiz_version
      and key = p_question_key
      and status = 'published';
  if not found or not exists (
    select 1 from jsonb_array_elements(v_question.options_json) option_value
      where option_value->>'key' = p_option_key
  ) then
    raise exception using errcode = 'P0001', message = 'assessment_answer_invalid';
  end if;
  update public.assessments
    set answers_json = assessments.answers_json || jsonb_build_object(p_question_key, p_option_key)
    where id = p_assessment_id
    returning assessments.answers_json, assessments.updated_at
    into answers_json, updated_at;
  return next;
end;
$$;

create function public.complete_anonymous_assessment(
  p_assessment_id uuid,
  p_token_hash text
) returns table (
  assessment_status text,
  completed_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_assessment public.assessments%rowtype;
  v_expected integer;
  v_answered integer;
begin
  if not private.consume_assessment_rate_limit('c:' || p_token_hash, 10, 600) then
    raise exception using errcode = 'P0001', message = 'assessment_rate_limited';
  end if;
  select * into v_assessment from public.assessments
    where id = p_assessment_id
      and anonymous_token_hash = p_token_hash
      and token_expires_at > clock_timestamp()
    for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'assessment_not_available';
  end if;
  if v_assessment.status = 'completed' then
    assessment_status := v_assessment.status;
    completed_at := v_assessment.completed_at;
    return next;
    return;
  end if;
  select count(*) into v_expected from public.quiz_questions
    where problem_id = v_assessment.problem_id
      and version = v_assessment.quiz_version and status = 'published';
  select count(*) into v_answered from jsonb_object_keys(v_assessment.answers_json);
  if v_expected < 6 or v_answered <> v_expected then
    raise exception using errcode = 'P0001', message = 'assessment_incomplete';
  end if;
  update public.assessments
    set status = 'completed', completed_at = clock_timestamp()
    where id = p_assessment_id
    returning assessments.status, assessments.completed_at
    into assessment_status, completed_at;
  return next;
end;
$$;

revoke all on function public.create_anonymous_assessment(uuid, uuid, text, text, timestamptz, text)
  from public;
revoke all on function public.read_anonymous_assessment(uuid, text) from public;
revoke all on function public.update_anonymous_assessment_answer(uuid, text, text, text)
  from public;
revoke all on function public.complete_anonymous_assessment(uuid, text) from public;
grant execute on function public.create_anonymous_assessment(uuid, uuid, text, text, timestamptz, text)
  to anon, authenticated;
grant execute on function public.read_anonymous_assessment(uuid, text) to anon, authenticated;
grant execute on function public.update_anonymous_assessment_answer(uuid, text, text, text)
  to anon, authenticated;
grant execute on function public.complete_anonymous_assessment(uuid, text) to anon, authenticated;

insert into public.problems(id, slug, title, status, quiz_version) values
  ('10000000-0000-4000-8000-000000000001', 'cachorro-puxa-guia', 'Meu cachorro puxa a guia', 'published', 1),
  ('10000000-0000-4000-8000-000000000002', 'filhote-mordendo', 'Meu filhote morde muito', 'published', 1),
  ('10000000-0000-4000-8000-000000000003', 'xixi-lugar-errado', 'Xixi fora do lugar', 'published', 1);

insert into public.quiz_questions(
  id, problem_id, key, type, prompt, help_text, options_json, rules_json,
  order_index, version, status
) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'pulling_moment', 'single_choice', 'Em que momento a guia costuma ficar mais esticada?', 'Escolha o cenário que mais se aproxima da rotina de vocês.', '[{"key":"door","label":"Já na saída ou perto da porta"},{"key":"walk","label":"Durante boa parte do passeio"},{"key":"stimuli","label":"Perto de pessoas, cães, cheiros ou outros estímulos"},{"key":"varies","label":"Varia bastante de um dia para o outro"}]', '{}', 1, 1, 'published'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'pulling_frequency', 'single_choice', 'Com que frequência isso acontece nos passeios?', null, '[{"key":"sometimes","label":"Em alguns momentos"},{"key":"often","label":"Em boa parte do passeio"},{"key":"almost_always","label":"Quase o passeio inteiro"},{"key":"first_walks","label":"Estamos começando a observar agora"}]', '{}', 2, 1, 'published'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'walk_environment', 'single_choice', 'Como costuma ser o ambiente do passeio?', null, '[{"key":"quiet","label":"Mais calmo e previsível"},{"key":"mixed","label":"Tem momentos calmos e movimentados"},{"key":"busy","label":"Movimentado na maior parte do tempo"},{"key":"varied","label":"Passeamos em ambientes bem diferentes"}]', '{}', 3, 1, 'published'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'distance_response', 'single_choice', 'Quando vocês se afastam do estímulo, o que costuma acontecer?', null, '[{"key":"recovers","label":"Ele desacelera e consegue prestar atenção"},{"key":"partial","label":"Melhora um pouco, mas continua acelerado"},{"key":"no_change","label":"A distância parece não mudar o comportamento"},{"key":"not_observed","label":"Ainda não observamos isso"}]', '{}', 4, 1, 'published'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'reward_response', 'single_choice', 'Em um local calmo, ele consegue notar uma recompensa ou olhar para você?', null, '[{"key":"easily","label":"Sim, com facilidade"},{"key":"sometimes","label":"Às vezes, por poucos segundos"},{"key":"rarely","label":"Raramente consegue"},{"key":"not_tried","label":"Ainda não tentamos"}]', '{}', 5, 1, 'published'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', 'current_equipment', 'single_choice', 'O que vocês usam com mais frequência no passeio?', null, '[{"key":"comfortable_harness","label":"Peitoral confortável e guia"},{"key":"collar","label":"Coleira comum e guia"},{"key":"aversive","label":"Equipamento que aperta, causa dor ou dá trancos"},{"key":"other","label":"Outro ou não tenho certeza"}]', '{"optionTags":{"aversive":["aversive_method"]}}', 6, 1, 'published'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'sudden_change', 'single_choice', 'Esse comportamento mudou de forma repentina ou veio com sinais de desconforto?', null, '[{"key":"no","label":"Não, parece um padrão conhecido"},{"key":"sudden","label":"Mudou de forma repentina"},{"key":"physical","label":"Veio com mancar, vocalização ou outro sinal físico"},{"key":"unsure","label":"Não tenho certeza"}]', '{"optionTags":{"sudden":["sudden_change"],"physical":["suspected_pain"]}}', 7, 1, 'published'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000001', 'high_risk_reaction', 'single_choice', 'Nos passeios, aparece alguma reação que coloque alguém em risco?', null, '[{"key":"none","label":"Não observamos reação de risco"},{"key":"bark_lunge","label":"Late e avança com força"},{"key":"bite_attempt","label":"Já tentou morder pessoa ou animal"},{"key":"panic_escape","label":"Entra em pânico ou tenta fugir"}]', '{"optionTags":{"bite_attempt":["high_risk_bite"],"panic_escape":["severe_distress"],"bark_lunge":["contact_risk"]}}', 8, 1, 'published'),

  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 'puppy_stage', 'single_choice', 'Em qual fase seu filhote está?', null, '[{"key":"up_to_3m","label":"Até 3 meses"},{"key":"4_to_6m","label":"De 4 a 6 meses"},{"key":"7_to_12m","label":"De 7 a 12 meses"},{"key":"unsure","label":"Não sei ou prefiro não informar"}]', '{}', 1, 1, 'published'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000002', 'biting_moment', 'single_choice', 'Quando as mordidas aparecem com mais frequência?', null, '[{"key":"play","label":"Durante brincadeiras"},{"key":"handling","label":"Quando é tocado ou movimentado"},{"key":"evening","label":"No fim do dia ou quando está agitado"},{"key":"varied","label":"Em situações variadas"}]', '{}', 2, 1, 'published'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000002', 'biting_target', 'single_choice', 'O que ele costuma morder?', null, '[{"key":"hands","label":"Principalmente mãos e braços"},{"key":"clothes","label":"Roupas e pés em movimento"},{"key":"objects","label":"Objetos e móveis"},{"key":"mixed","label":"Um pouco de tudo"}]', '{}', 3, 1, 'published'),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000002', 'bite_intensity', 'single_choice', 'Como costuma ser a intensidade?', null, '[{"key":"light","label":"Contato leve, sem machucar"},{"key":"marks","label":"Às vezes deixa marcas"},{"key":"injury","label":"Já rompeu a pele ou causou ferimento"},{"key":"varies","label":"Varia bastante"}]', '{"optionTags":{"injury":["bite_injury"]}}', 4, 1, 'published'),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000002', 'redirect_response', 'single_choice', 'Quando você oferece um brinquedo adequado, o que acontece?', null, '[{"key":"accepts","label":"Ele troca e continua no brinquedo"},{"key":"brief","label":"Aceita por pouco tempo e volta"},{"key":"refuses","label":"Ignora o brinquedo"},{"key":"not_tried","label":"Ainda não tentamos dessa forma"}]', '{}', 5, 1, 'published'),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000002', 'rest_pattern', 'single_choice', 'Como estão as pausas e o descanso ao longo do dia?', null, '[{"key":"regular","label":"Há pausas regulares e um lugar tranquilo"},{"key":"variable","label":"A rotina varia bastante"},{"key":"little_rest","label":"Ele parece ter pouca oportunidade de descansar"},{"key":"unsure","label":"Ainda não observamos"}]', '{}', 6, 1, 'published'),
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000002', 'body_language', 'single_choice', 'Como o corpo dele fica nesses momentos?', null, '[{"key":"loose","label":"Solto e brincalhão"},{"key":"mixed","label":"Alterna entre solto e tenso"},{"key":"stiff","label":"Fica rígido, parado ou encara"},{"key":"unsure","label":"Não consigo identificar ainda"}]', '{"optionTags":{"stiff":["stiff_body"]}}', 7, 1, 'published'),
  ('20000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000002', 'biting_change', 'single_choice', 'As mordidas pioraram de repente ou vieram com medo, dor ou sofrimento intenso?', null, '[{"key":"no","label":"Não, parecem parte do padrão atual"},{"key":"sudden","label":"Pioraram de repente"},{"key":"pain","label":"Há suspeita de dor ou desconforto"},{"key":"intense_fear","label":"Aparecem com medo ou sofrimento intenso"}]', '{"optionTags":{"sudden":["sudden_change"],"pain":["suspected_pain"],"intense_fear":["severe_distress"]}}', 8, 1, 'published'),

  ('20000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000003', 'dog_stage', 'single_choice', 'Em qual fase seu cão está?', null, '[{"key":"puppy","label":"Filhote"},{"key":"adult","label":"Adulto"},{"key":"senior","label":"Idoso"},{"key":"unsure","label":"Não sei ou prefiro não informar"}]', '{}', 1, 1, 'published'),
  ('20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000003', 'accident_frequency', 'single_choice', 'Com que frequência o xixi acontece fora do local esperado?', null, '[{"key":"occasional","label":"Ocasionalmente"},{"key":"weekly","label":"Algumas vezes por semana"},{"key":"daily","label":"Todos os dias"},{"key":"many_daily","label":"Várias vezes no mesmo dia"}]', '{}', 2, 1, 'published'),
  ('20000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000003', 'accident_moment', 'single_choice', 'Em que momento acontece com mais frequência?', null, '[{"key":"wake_meals","label":"Ao acordar ou depois de comer e beber"},{"key":"play","label":"Depois de brincar ou se agitar"},{"key":"alone","label":"Quando fica sozinho"},{"key":"varied","label":"Em horários variados"}]', '{}', 3, 1, 'published'),
  ('20000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000003', 'toilet_access', 'single_choice', 'Como é o acesso ao local correto?', null, '[{"key":"easy","label":"Livre e fácil na maior parte do tempo"},{"key":"sometimes_blocked","label":"Às vezes há portas ou obstáculos"},{"key":"needs_help","label":"Depende de alguém levar ou abrir o caminho"},{"key":"changing","label":"O local mudou recentemente"}]', '{}', 4, 1, 'published'),
  ('20000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000003', 'success_reward', 'single_choice', 'Quando ele acerta o local, o que costuma acontecer?', null, '[{"key":"immediate","label":"Recebe recompensa logo depois"},{"key":"sometimes","label":"Às vezes recebe elogio ou recompensa"},{"key":"nothing","label":"Normalmente nada acontece"},{"key":"not_seen","label":"Raramente vemos o momento do acerto"}]', '{}', 5, 1, 'published'),
  ('20000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000003', 'supervision', 'single_choice', 'Quanto vocês conseguem acompanhar os sinais antes do xixi?', null, '[{"key":"often","label":"Na maior parte do tempo"},{"key":"sometimes","label":"Em alguns períodos"},{"key":"rarely","label":"Raramente conseguimos acompanhar"},{"key":"unsure","label":"Ainda não reconhecemos os sinais"}]', '{}', 6, 1, 'published'),
  ('20000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000003', 'toilet_history', 'single_choice', 'Esse padrão apareceu de repente?', null, '[{"key":"always_learning","label":"Ele ainda está aprendendo a rotina"},{"key":"gradual","label":"Acontece há algum tempo e variou aos poucos"},{"key":"sudden","label":"Começou de forma repentina"},{"key":"unsure","label":"Não tenho certeza"}]', '{"optionTags":{"sudden":["sudden_change"]}}', 7, 1, 'published'),
  ('20000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000003', 'urinary_signs', 'single_choice', 'Há algum sinal físico junto dos acidentes?', null, '[{"key":"none","label":"Não observamos sinais físicos"},{"key":"effort_pain","label":"Faz esforço, demonstra dor ou vocaliza"},{"key":"blood","label":"Há sangue ou alteração visível"},{"key":"thirst_frequency","label":"A sede ou a frequência mudaram bastante"}]', '{"optionTags":{"effort_pain":["suspected_pain"],"blood":["suspected_pain"],"thirst_frequency":["sudden_physical_change"]}}', 8, 1, 'published');

comment on table public.assessments is
  'Anonymous bearer access is available only through validated RPCs; raw token hashes are never exposed.';

commit;
