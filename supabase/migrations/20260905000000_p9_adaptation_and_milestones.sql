begin;

-- 1. Alter public.daily_checkins to add difficulty_rating and safety_flag
alter table public.daily_checkins
  add column difficulty_rating text not null default 'adequate'
    check (difficulty_rating in ('easy', 'adequate', 'challenging')),
  add column safety_flag text not null default 'none'
    check (safety_flag in ('none', 'pain_suspected', 'distress_extreme', 'aggression_risk'));

-- 2. Plan Milestones (Marcos Comportamentais Conquistados)
create table public.plan_milestones (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null check (key in ('first_training_done', 'pause_honored', 'constancia_serena', 'week_one_done', 'program_completed')),
  title text not null check (char_length(title) <= 120),
  description text not null check (char_length(description) <= 300),
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (plan_id, key)
);

alter table public.plan_milestones enable row level security;
alter table public.plan_milestones force row level security;
revoke all on public.plan_milestones from public, anon, authenticated;
grant select on public.plan_milestones to authenticated;
create policy plan_milestones_owner_read on public.plan_milestones for select to authenticated
  using (user_id = auth.uid());

-- 3. Plan Adaptations (Audit Trail de Ajustes e Adaptações no Cronograma)
create table public.plan_adaptations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_checkin_id uuid references public.daily_checkins(id) on delete set null,
  adaptation_type text not null check (adaptation_type in ('consolidation', 'repeat_day', 'progression', 'safety_pause')),
  reason text not null check (char_length(reason) <= 500),
  created_at timestamptz not null default now()
);

alter table public.plan_adaptations enable row level security;
alter table public.plan_adaptations force row level security;
revoke all on public.plan_adaptations from public, anon, authenticated;
grant select on public.plan_adaptations to authenticated;
create policy plan_adaptations_owner_read on public.plan_adaptations for select to authenticated
  using (user_id = auth.uid());

commit;
