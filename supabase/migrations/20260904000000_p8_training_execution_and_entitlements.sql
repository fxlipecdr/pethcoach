begin;

-- 1. Entitlements (Direitos de Acesso aos Dias 2-14)
create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('full_program', 'subscription')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'expired')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger entitlements_updated_at before update on public.entitlements
  for each row execute function public.set_updated_at();

alter table public.entitlements enable row level security;
alter table public.entitlements force row level security;
revoke all on public.entitlements from public, anon, authenticated;
grant select on public.entitlements to authenticated;
create policy entitlements_owner_read on public.entitlements for select to authenticated
  using (user_id = auth.uid());

-- 2. Daily Check-ins (Avaliação do Tutor ao Final de Cada Dia Concluído)
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  day_number integer not null check (day_number between 1 and 30),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null check (mood in ('calm', 'moderate', 'needed_pause')),
  notes text check (notes is null or char_length(notes) <= 500),
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, day_number)
);

create trigger daily_checkins_updated_at before update on public.daily_checkins
  for each row execute function public.set_updated_at();

alter table public.daily_checkins enable row level security;
alter table public.daily_checkins force row level security;
revoke all on public.daily_checkins from public, anon, authenticated;
grant select, insert, update on public.daily_checkins to authenticated;
create policy daily_checkins_owner_all on public.daily_checkins for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

commit;
