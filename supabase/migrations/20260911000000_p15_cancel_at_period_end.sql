-- P15 — distinguir assinatura que renova de assinatura já cancelada.
--
-- Cancelar pelo portal do Stripe não encerra o acesso na hora: por padrão o
-- Stripe marca `cancel_at_period_end` e mantém a assinatura `active` até o fim
-- do período já pago. O acesso continuar é correto — a pessoa pagou por ele.
--
-- O problema era a leitura: sem esta coluna, uma assinatura cancelada e uma
-- que vai renovar ficam idênticas no banco (`status = 'active'` com
-- `expires_at` preenchido), e a interface anunciava "próxima renovação" para
-- quem acabara de cancelar.

alter table public.entitlements
  add column if not exists cancel_at_period_end boolean not null default false;

comment on column public.entitlements.cancel_at_period_end is
  'Assinatura cancelada no portal: mantém acesso até expires_at e não renova.';
