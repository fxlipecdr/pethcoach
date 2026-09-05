-- P14 — Direitos do titular (LGPD): portabilidade e exclusão.
--
-- A exclusão é por anonimização: todo dado pessoal e comportamental é removido,
-- mas os registros de transação (billing_customers, entitlements) permanecem,
-- porque respondem a obrigação fiscal sobre pagamentos já realizados. Eles
-- passam a apontar para um perfil sem nome e sem rastro de uso.

alter table public.profiles
  add column if not exists deleted_at timestamptz;

comment on column public.profiles.deleted_at is
  'Conta anonimizada a pedido do titular. Sessões existentes devem ser recusadas.';

-- Remove o dado do usuário autenticado. Nunca aceita um id vindo do cliente:
-- opera exclusivamente sobre auth.uid().
create or replace function public.anonymize_account()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'anonymize_account exige um usuário autenticado';
  end if;

  -- Cães levam junto planos, tarefas, check-ins, marcos e adaptações (cascade).
  delete from public.dogs where owner_id = v_user;
  -- Planos órfãos de cão, se existirem, e o restante do rastro comportamental.
  delete from public.plans where user_id = v_user;
  -- Assessments levam junto os safety_events correspondentes (cascade).
  delete from public.assessments where user_id = v_user;
  delete from public.attribution_touches where user_id = v_user;
  delete from public.email_preferences where user_id = v_user;
  delete from public.email_delivery_logs where user_id = v_user;

  update public.profiles
     set name = null,
         deleted_at = now(),
         updated_at = now()
   where id = v_user;
end;
$$;

revoke all on function public.anonymize_account() from public, anon;
grant execute on function public.anonymize_account() to authenticated;
