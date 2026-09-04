begin;

-- 1. Email Preferences (Per-purpose LGPD consent & unsubscribe token)
create table public.email_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  training_reminders boolean not null default true,
  milestone_celebrations boolean not null default true,
  billing_notifications boolean not null default true,
  marketing_tips boolean not null default false,
  unsubscribed_all boolean not null default false,
  unsubscribe_token text not null unique check (char_length(unsubscribe_token) >= 32 and char_length(unsubscribe_token) <= 255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger email_preferences_updated_at before update on public.email_preferences
  for each row execute function public.set_updated_at();

alter table public.email_preferences enable row level security;
alter table public.email_preferences force row level security;
revoke all on public.email_preferences from public, anon, authenticated;
grant select, update on public.email_preferences to authenticated;

create policy email_preferences_owner_select on public.email_preferences for select to authenticated
  using (user_id = auth.uid());

create policy email_preferences_owner_update on public.email_preferences for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 2. Email Delivery Logs (Idempotency ledger and audit trail)
create table public.email_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  recipient_email text not null check (char_length(recipient_email) <= 255),
  template_key text not null check (char_length(template_key) <= 60),
  idempotency_key text not null unique check (char_length(idempotency_key) <= 255),
  status text not null check (status in ('pending', 'sent', 'skipped', 'failed')),
  skip_reason text check (char_length(skip_reason) <= 120),
  provider_message_id text check (char_length(provider_message_id) <= 255),
  metadata jsonb not null default '{}'::jsonb,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index email_delivery_logs_user_idx on public.email_delivery_logs (user_id);
create index email_delivery_logs_status_idx on public.email_delivery_logs (status);

alter table public.email_delivery_logs enable row level security;
alter table public.email_delivery_logs force row level security;
revoke all on public.email_delivery_logs from public, anon, authenticated;

commit;
