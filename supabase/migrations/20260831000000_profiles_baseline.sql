-- Foundation baseline. Auth/profile UX and dog tables belong to P2.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text check (name is null or char_length(name) between 1 and 100),
  locale text not null default 'pt-BR' check (char_length(locale) between 2 and 20),
  timezone text not null default 'America/Sao_Paulo' check (char_length(timezone) between 1 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select, delete on public.profiles to authenticated;
grant insert (id, name, locale, timezone) on public.profiles to authenticated;
grant update (name, locale, timezone) on public.profiles to authenticated;

create policy profiles_select_owner on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_insert_owner on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update_owner on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete_owner on public.profiles for delete to authenticated
  using ((select auth.uid()) = id);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

comment on table public.profiles is 'Owner-only personal data. No user-editable admin or billing fields.';
commit;
