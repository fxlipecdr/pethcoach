begin;

alter table public.profiles add column onboarding_source text
  check (onboarding_source is null or char_length(onboarding_source) between 1 and 80);
-- Account deletion must delete auth.users through a reviewed server workflow (P14).
revoke delete on public.profiles from authenticated;
drop policy profiles_delete_owner on public.profiles;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create function private.create_user_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.create_user_profile() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.create_user_profile();
insert into public.profiles (id) select id from auth.users on conflict (id) do nothing;

create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  birth_date date check (birth_date between date '1990-01-01' and current_date),
  sex text check (sex in ('male', 'female')),
  size text check (size in ('small', 'medium', 'large', 'giant')),
  breed_text text check (breed_text is null or char_length(btrim(breed_text)) between 1 and 80),
  neutered boolean,
  environment text check (environment in ('apartment', 'house', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dogs_owner_created_idx on public.dogs(owner_id, created_at desc, id);
create trigger dogs_updated_at before update on public.dogs
  for each row execute function public.set_updated_at();
alter table public.dogs enable row level security;
alter table public.dogs force row level security;
revoke all on public.dogs from public, anon, authenticated;
grant select, delete on public.dogs to authenticated;
grant insert (id, owner_id, name, birth_date, sex, size, breed_text, neutered, environment)
  on public.dogs to authenticated;
grant update (name, birth_date, sex, size, breed_text, neutered, environment)
  on public.dogs to authenticated;
create policy dogs_select_own on public.dogs for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy dogs_insert_own on public.dogs for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy dogs_update_own on public.dogs for update to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy dogs_delete_own on public.dogs for delete to authenticated
  using ((select auth.uid()) = owner_id);

-- Structure only: capture/consent and a trusted write pipeline belong to P11.
-- An anonymous_id is a correlation identifier, NEVER a credential or a claim token.
create table public.attribution_touches (
  id uuid primary key default gen_random_uuid(),
  anonymous_id uuid,
  user_id uuid references auth.users(id) on delete cascade,
  touch_type text not null check (touch_type in ('first', 'last')),
  source text check (char_length(source) <= 120),
  medium text check (char_length(medium) <= 120),
  campaign text check (char_length(campaign) <= 200),
  referrer text check (char_length(referrer) <= 500),
  landing text check (char_length(landing) <= 500),
  click_ids jsonb not null default '{}'::jsonb
    check (jsonb_typeof(click_ids) = 'object' and octet_length(click_ids::text) <= 2048),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (anonymous_id is not null or user_id is not null)
);
create index attribution_user_created_idx on public.attribution_touches(user_id, created_at desc);
create index attribution_anonymous_idx on public.attribution_touches(anonymous_id) where anonymous_id is not null;
create trigger attribution_updated_at before update on public.attribution_touches
  for each row execute function public.set_updated_at();
alter table public.attribution_touches enable row level security;
alter table public.attribution_touches force row level security;
revoke all on public.attribution_touches from public, anon, authenticated;
grant select on public.attribution_touches to authenticated;
create policy attribution_select_own on public.attribution_touches for select to authenticated
  using ((select auth.uid()) = user_id);

commit;
