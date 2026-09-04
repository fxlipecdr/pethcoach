begin;

-- 1. Alter public.entitlements to track Stripe customer and subscription IDs
alter table public.entitlements
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text unique;

-- 2. Billing Customers (Mapping between Supabase user and Stripe Customer)
create table public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  stripe_customer_id text not null unique check (char_length(stripe_customer_id) <= 255),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger billing_customers_updated_at before update on public.billing_customers
  for each row execute function public.set_updated_at();

alter table public.billing_customers enable row level security;
alter table public.billing_customers force row level security;
revoke all on public.billing_customers from public, anon, authenticated;
grant select on public.billing_customers to authenticated;
create policy billing_customers_owner_read on public.billing_customers for select to authenticated
  using (user_id = auth.uid());

-- 3. Processed Webhook Events (Idempotency ledger for incoming webhooks)
create table public.processed_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique check (char_length(event_id) <= 255),
  event_type text not null check (char_length(event_type) <= 120),
  processed_at timestamptz not null default now()
);

alter table public.processed_webhook_events enable row level security;
alter table public.processed_webhook_events force row level security;
revoke all on public.processed_webhook_events from public, anon, authenticated;

commit;
