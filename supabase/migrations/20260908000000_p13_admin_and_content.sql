begin;

-- 1. Operator Roles (RBAC for platform management)
create table public.operator_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  role text not null check (role in ('admin', 'reviewer', 'operator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger operator_roles_updated_at before update on public.operator_roles
  for each row execute function public.set_updated_at();

alter table public.operator_roles enable row level security;
alter table public.operator_roles force row level security;
revoke all on public.operator_roles from public, anon, authenticated;
grant select on public.operator_roles to authenticated;

create policy operator_roles_owner_read on public.operator_roles for select to authenticated
  using (user_id = auth.uid());

-- 2. Module Editorial Revisions (Audit trail for content lifecycle)
create table public.module_revisions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  operator_id uuid not null references auth.users(id),
  action text not null check (action in ('create', 'update', 'submit_review', 'approve_publish', 'archive')),
  from_status text not null,
  to_status text not null,
  notes text not null check (char_length(btrim(notes)) >= 3 and char_length(notes) <= 1000),
  created_at timestamptz not null default now()
);

create index module_revisions_module_idx on public.module_revisions (module_id);
create index module_revisions_operator_idx on public.module_revisions (operator_id);

alter table public.module_revisions enable row level security;
alter table public.module_revisions force row level security;
revoke all on public.module_revisions from public, anon, authenticated;
grant select, insert on public.module_revisions to authenticated;

create policy module_revisions_operator_read on public.module_revisions for select to authenticated
  using (
    exists (
      select 1 from public.operator_roles
      where operator_roles.user_id = auth.uid()
        and operator_roles.role in ('admin', 'reviewer')
    )
  );

create policy module_revisions_operator_insert on public.module_revisions for insert to authenticated
  with check (
    operator_id = auth.uid() and
    exists (
      select 1 from public.operator_roles
      where operator_roles.user_id = auth.uid()
        and operator_roles.role in ('admin', 'reviewer')
    )
  );

-- 3. Extend public.modules RLS so operators can view and edit all lifecycle statuses
grant insert, update on public.modules to authenticated;

create policy modules_operator_read on public.modules for select to authenticated
  using (
    exists (
      select 1 from public.operator_roles
      where operator_roles.user_id = auth.uid()
        and operator_roles.role in ('admin', 'reviewer')
    )
  );

create policy modules_operator_update on public.modules for update to authenticated
  using (
    exists (
      select 1 from public.operator_roles
      where operator_roles.user_id = auth.uid()
        and operator_roles.role in ('admin', 'reviewer')
    )
  )
  with check (
    exists (
      select 1 from public.operator_roles
      where operator_roles.user_id = auth.uid()
        and operator_roles.role in ('admin', 'reviewer')
    )
  );

create policy modules_operator_insert on public.modules for insert to authenticated
  with check (
    exists (
      select 1 from public.operator_roles
      where operator_roles.user_id = auth.uid()
        and operator_roles.role in ('admin', 'reviewer')
    )
  );

commit;
