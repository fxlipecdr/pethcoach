begin;

alter table public.assessments
  add column safety_rule_version text,
  add column safety_evaluated_at timestamptz,
  add constraint assessments_safety_evaluation_consistent check (
    (
      safety_status = 'pending'
      and safety_rule_version is null
      and safety_evaluated_at is null
    ) or (
      safety_status in ('continue', 'refer', 'block')
      and safety_rule_version is not null
      and safety_evaluated_at is not null
    )
  );

create table public.safety_events (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  code text not null check (code ~ '^[A-Z][A-Z0-9_]{2,79}$'),
  severity text not null check (severity in ('info', 'caution', 'urgent')),
  outcome text not null check (outcome in ('continue', 'refer', 'block')),
  rule_version text not null check (char_length(rule_version) between 1 and 40),
  message_key text not null check (message_key ~ '^[a-z][a-z0-9_.]{2,119}$'),
  evidence_tags text[] not null default '{}',
  recommended_action text not null check (char_length(recommended_action) between 1 and 80),
  user_action text check (user_action is null or char_length(user_action) <= 80),
  created_at timestamptz not null default now(),
  unique (assessment_id, code, rule_version)
);
create index safety_events_assessment_created_idx
  on public.safety_events(assessment_id, created_at desc);
alter table public.safety_events enable row level security;
alter table public.safety_events force row level security;
revoke all on public.safety_events from public, anon, authenticated;

-- Preserve published version 1 for assessments already in progress.
insert into public.quiz_questions(
  id, problem_id, key, type, prompt, help_text, options_json, rules_json,
  order_index, version, status, created_at, updated_at
)
select
  md5(problem_id::text || ':' || key || ':2')::uuid,
  problem_id, key, type, prompt, help_text, options_json, rules_json,
  order_index, 2, status, now(), now()
from public.quiz_questions
where version = 1;

-- Version 2 refines physical-change evidence without changing the visible answer.
update public.quiz_questions q
set rules_json = case q.key
  when 'sudden_change' then '{"optionTags":{"sudden":["sudden_change"],"physical":["sudden_change","suspected_pain","physical_change"]}}'::jsonb
  when 'biting_change' then '{"optionTags":{"sudden":["sudden_change"],"pain":["suspected_pain","physical_change"],"intense_fear":["severe_distress"]}}'::jsonb
  when 'urinary_signs' then '{"optionTags":{"effort_pain":["suspected_pain","physical_change"],"blood":["suspected_pain","physical_change"],"thirst_frequency":["sudden_physical_change","physical_change"]}}'::jsonb
  else q.rules_json
end
where q.version = 2
  and q.key in ('sudden_change', 'biting_change', 'urinary_signs');

insert into public.quiz_questions(
  id, problem_id, key, type, prompt, help_text, options_json, rules_json,
  order_index, version, status
)
select
  ids.id,
  p.id,
  'additional_safety',
  'single_choice',
  'Além do que você já respondeu, alguma destas situações aconteceu?',
  'Marque a situação mais importante para a segurança. Se houver mais de uma, escolha a que envolve maior risco imediato.',
  '[{"key":"none","label":"Nenhuma destas situações"},{"key":"vulnerable_contact","label":"Mordida ou avanço atingiu ou quase atingiu criança, idoso ou pessoa vulnerável"},{"key":"escape_self_harm","label":"Quando sozinho, tentou fugir intensamente ou se feriu"},{"key":"unpredictable_injury","label":"Houve mordida com perfuração ou ataque difícil de prever"}]'::jsonb,
  '{"optionTags":{"vulnerable_contact":["vulnerable_person_risk"],"escape_self_harm":["severe_distress","escape_risk","self_injury"],"unpredictable_injury":["high_risk_bite"]}}'::jsonb,
  9,
  2,
  'published'
from public.problems p
join (values
  ('cachorro-puxa-guia', '30000000-0000-4000-8000-000000000001'::uuid),
  ('filhote-mordendo', '30000000-0000-4000-8000-000000000002'::uuid),
  ('xixi-lugar-errado', '30000000-0000-4000-8000-000000000003'::uuid)
) ids(slug, id) on ids.slug = p.slug;

insert into public.quiz_questions(
  id, problem_id, key, type, prompt, help_text, options_json, rules_json,
  order_index, version, status
)
select
  ids.id,
  p.id,
  'methods_used',
  'single_choice',
  'Ao tentar lidar com essa situação, qual opção mais se aproxima do que vocês fazem?',
  null,
  '[{"key":"reward","label":"Recompensas, pausas e orientação gradual"},{"key":"management","label":"Ajustamos o ambiente e evitamos situações difíceis"},{"key":"aversive","label":"Usamos trancos, sustos, dor, enforcador, choque ou correção física"},{"key":"unsure","label":"Não tenho certeza ou ainda não tentamos"}]'::jsonb,
  '{"optionTags":{"aversive":["aversive_method"]}}'::jsonb,
  10,
  2,
  'published'
from public.problems p
join (values
  ('cachorro-puxa-guia', '30000000-0000-4000-8000-000000000004'::uuid),
  ('filhote-mordendo', '30000000-0000-4000-8000-000000000005'::uuid),
  ('xixi-lugar-errado', '30000000-0000-4000-8000-000000000006'::uuid)
) ids(slug, id) on ids.slug = p.slug;

update public.problems set quiz_version = 2;

drop policy quiz_questions_read_published on public.quiz_questions;
create policy quiz_questions_read_published on public.quiz_questions for select to anon, authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.problems
      where problems.id = quiz_questions.problem_id
        and problems.status = 'published'
    )
  );

create function private.assessment_safety_tags(p_assessment_id uuid)
returns setof text
language sql stable security definer set search_path = '' as $$
  select distinct tag.value
  from public.assessments a
  join public.quiz_questions q
    on q.problem_id = a.problem_id
   and q.version = a.quiz_version
   and q.status = 'published'
  cross join lateral jsonb_array_elements_text(
    case
      when jsonb_typeof(q.rules_json -> 'optionTags' -> (a.answers_json ->> q.key)) = 'array'
      then q.rules_json -> 'optionTags' -> (a.answers_json ->> q.key)
      else '[]'::jsonb
    end
  ) tag(value)
  where a.id = p_assessment_id
$$;
revoke all on function private.assessment_safety_tags(uuid)
  from public, anon, authenticated;

create function private.evaluate_assessment_safety(p_assessment_id uuid)
returns table (
  safety_status text,
  safety_codes text[],
  safety_rule_version text,
  safety_evaluated_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_rule_version constant text := 'p5-v1';
  v_tags text[] := '{}';
  v_unknown text[] := '{}';
  v_outcome text;
  v_evaluated_at timestamptz := clock_timestamp();
begin
  if not exists (select 1 from public.assessments where id = p_assessment_id) then
    raise exception using errcode = 'P0001', message = 'assessment_not_available';
  end if;

  select coalesce(array_agg(tag order by tag), '{}') into v_tags
  from private.assessment_safety_tags(p_assessment_id) tag;

  select coalesce(array_agg(tag order by tag), '{}') into v_unknown
  from unnest(v_tags) tag
  where not tag = any(array[
    'aversive_method', 'bite_injury', 'contact_risk', 'escape_risk',
    'high_risk_bite', 'physical_change', 'self_injury', 'severe_distress',
    'stiff_body', 'sudden_change', 'sudden_physical_change',
    'suspected_pain', 'vulnerable_person_risk'
  ]::text[]);

  if v_tags && array['high_risk_bite', 'bite_injury']::text[] then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'HIGH_RISK_BITE', 'urgent', 'block', v_rule_version,
      'safety.block.high_risk_bite',
      array(select unnest(v_tags) intersect select unnest(array['high_risk_bite', 'bite_injury']::text[])),
      'stop_and_seek_qualified_help'
    ) on conflict do nothing;
  end if;

  if 'vulnerable_person_risk' = any(v_tags) then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'VULNERABLE_PERSON_RISK', 'urgent', 'block', v_rule_version,
      'safety.block.vulnerable_person_risk', array['vulnerable_person_risk'],
      'separate_supervise_and_seek_help'
    ) on conflict do nothing;
  end if;

  if v_tags && array['self_injury', 'escape_risk']::text[] then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'SELF_INJURY_OR_ESCAPE_RISK', 'urgent', 'block', v_rule_version,
      'safety.block.self_injury_or_escape',
      array(select unnest(v_tags) intersect select unnest(array['self_injury', 'escape_risk']::text[])),
      'prevent_exposure_and_seek_help'
    ) on conflict do nothing;
  end if;

  if 'suspected_pain' = any(v_tags) then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'SUSPECTED_PAIN', 'urgent', 'refer', v_rule_version,
      'safety.refer.suspected_pain', array['suspected_pain'],
      'veterinary_assessment_first'
    ) on conflict do nothing;
  end if;

  if (
    'sudden_physical_change' = any(v_tags)
    or (
      'sudden_change' = any(v_tags)
      and v_tags && array['physical_change', 'suspected_pain']::text[]
    )
  ) then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'SUDDEN_CHANGE_WITH_PHYSICAL_SIGNS', 'urgent', 'refer', v_rule_version,
      'safety.refer.sudden_physical_change',
      array(select unnest(v_tags) intersect select unnest(array['sudden_change', 'sudden_physical_change', 'physical_change', 'suspected_pain']::text[])),
      'veterinary_assessment_first'
    ) on conflict do nothing;
  end if;

  if 'severe_distress' = any(v_tags) then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'SEVERE_DISTRESS', 'urgent', 'refer', v_rule_version,
      'safety.refer.severe_distress', array['severe_distress'],
      'qualified_behavior_help'
    ) on conflict do nothing;
  end if;

  if 'contact_risk' = any(v_tags) then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'CONTACT_RISK', 'caution', 'refer', v_rule_version,
      'safety.refer.contact_risk', array['contact_risk'],
      'manage_distance_and_seek_help'
    ) on conflict do nothing;
  end if;

  if 'aversive_method' = any(v_tags) then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'AVERSIVE_METHOD_REPORTED', 'caution', 'continue', v_rule_version,
      'safety.continue.aversive_method', array['aversive_method'],
      'switch_to_reward_based_methods'
    ) on conflict do nothing;
  end if;

  if cardinality(v_unknown) > 0 then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'UNRECOGNIZED_SAFETY_SIGNAL', 'caution', 'refer', v_rule_version,
      'safety.refer.unrecognized_signal', v_unknown,
      'manual_safety_review'
    ) on conflict do nothing;
  end if;

  if not exists (
    select 1 from public.safety_events
    where assessment_id = p_assessment_id and rule_version = v_rule_version
  ) then
    insert into public.safety_events(
      assessment_id, code, severity, outcome, rule_version, message_key,
      evidence_tags, recommended_action
    ) values (
      p_assessment_id, 'SAFETY_GATE_CLEAR', 'info', 'continue', v_rule_version,
      'safety.continue.clear', '{}', 'continue_without_safety_claim'
    );
  end if;

  select case
    when bool_or(outcome = 'block') then 'block'
    when bool_or(outcome = 'refer') then 'refer'
    else 'continue'
  end into v_outcome
  from public.safety_events
  where assessment_id = p_assessment_id and rule_version = v_rule_version;

  update public.assessments
  set safety_status = v_outcome,
      safety_rule_version = v_rule_version,
      safety_evaluated_at = v_evaluated_at
  where id = p_assessment_id;

  return query
  select
    v_outcome,
    array_agg(e.code order by
      case e.outcome when 'block' then 1 when 'refer' then 2 else 3 end,
      e.code
    ),
    v_rule_version,
    v_evaluated_at
  from public.safety_events e
  where e.assessment_id = p_assessment_id and e.rule_version = v_rule_version;
end;
$$;
revoke all on function private.evaluate_assessment_safety(uuid)
  from public, anon, authenticated;

drop function public.read_anonymous_assessment(uuid, text);
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
  safety_codes text[],
  safety_rule_version text,
  safety_evaluated_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
)
language sql stable security definer set search_path = '' as $$
  select a.id, p.slug, a.quiz_version, a.answers_json, a.status,
         a.safety_status,
         coalesce((
           select array_agg(e.code order by
             case e.outcome when 'block' then 1 when 'refer' then 2 else 3 end,
             e.code
           )
           from public.safety_events e
           where e.assessment_id = a.id
             and e.rule_version = a.safety_rule_version
         ), '{}'),
         a.safety_rule_version, a.safety_evaluated_at,
         a.started_at, a.completed_at
  from public.assessments a
  join public.problems p on p.id = a.problem_id
  where a.id = p_assessment_id
    and a.anonymous_token_hash = p_token_hash
    and a.token_expires_at > clock_timestamp()
$$;

drop function public.complete_anonymous_assessment(uuid, text);
create function public.complete_anonymous_assessment(
  p_assessment_id uuid,
  p_token_hash text
) returns table (
  assessment_status text,
  safety_status text,
  safety_codes text[],
  safety_rule_version text,
  completed_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_assessment public.assessments%rowtype;
  v_expected integer;
  v_answered integer;
  v_safety record;
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

  if v_assessment.status = 'in_progress' then
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
      returning * into v_assessment;
  end if;

  if v_assessment.safety_status = 'pending' then
    select * into v_safety
    from private.evaluate_assessment_safety(p_assessment_id);
  else
    select
      v_assessment.safety_status as safety_status,
      coalesce(array_agg(e.code order by
        case e.outcome when 'block' then 1 when 'refer' then 2 else 3 end,
        e.code
      ), '{}') as safety_codes,
      v_assessment.safety_rule_version as safety_rule_version,
      v_assessment.safety_evaluated_at as safety_evaluated_at
    into v_safety
    from public.safety_events e
    where e.assessment_id = p_assessment_id
      and e.rule_version = v_assessment.safety_rule_version;
  end if;

  assessment_status := 'completed';
  safety_status := v_safety.safety_status;
  safety_codes := v_safety.safety_codes;
  safety_rule_version := v_safety.safety_rule_version;
  select a.completed_at into completed_at
  from public.assessments a where a.id = p_assessment_id;
  return next;
end;
$$;

revoke all on function public.read_anonymous_assessment(uuid, text) from public;
revoke all on function public.complete_anonymous_assessment(uuid, text) from public;
grant execute on function public.read_anonymous_assessment(uuid, text) to anon, authenticated;
grant execute on function public.complete_anonymous_assessment(uuid, text) to anon, authenticated;

comment on table public.safety_events is
  'Deterministic, versioned safety-gate audit events. No LLM or client writes are permitted.';

commit;
