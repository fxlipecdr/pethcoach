-- P14 — limite de requisições compartilhado entre instâncias.
--
-- `lib/security/rate-limit.ts` conta em memória e protege um processo só; com
-- várias instâncias o limite deixa de valer. Era dívida anotada no próprio
-- arquivo. A contagem passa a viver no banco, que já servia ao quiz desde P4.

-- A tabela nunca foi específica de assessment; o nome é que era.
alter table private.assessment_rate_limits rename to rate_limits;

comment on table private.rate_limits is
  'Contadores de limite de requisição, compartilhados por todas as instâncias.';

-- Mesma assinatura de P4, apontando para o nome novo: os cinco chamadores em
-- SQL continuam funcionando sem alteração.
create or replace function private.consume_assessment_rate_limit(
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_row private.rate_limits%rowtype;
begin
  if p_key_hash !~ '^([a-z]:)?[0-9a-f]{64}$'
     or p_limit not between 1 and 500
     or p_window_seconds not between 10 and 86400 then
    return false;
  end if;
  insert into private.rate_limits(key_hash, request_count, window_started_at, updated_at)
  values (p_key_hash, 1, v_now, v_now)
  on conflict (key_hash) do nothing;
  if found then return true; end if;
  select * into v_row from private.rate_limits
    where key_hash = p_key_hash for update;
  if v_row.window_started_at <= v_now - make_interval(secs => p_window_seconds) then
    update private.rate_limits
      set request_count = 1, window_started_at = v_now, updated_at = v_now
      where key_hash = p_key_hash;
    return true;
  end if;
  if v_row.request_count >= p_limit then return false; end if;
  update private.rate_limits
    set request_count = request_count + 1, updated_at = v_now
    where key_hash = p_key_hash;
  return true;
end;
$$;

revoke all on function private.consume_assessment_rate_limit(text, integer, integer)
  from public, anon, authenticated;

-- Os limites ficam no servidor. O cliente escolhe a ação; nunca o teto.
create table private.rate_limit_rules (
  action text primary key check (action ~ '^[a-z][a-z0-9_]{2,39}$'),
  max_requests integer not null check (max_requests between 1 and 500),
  window_seconds integer not null check (window_seconds between 10 and 86400)
);
revoke all on private.rate_limit_rules from public, anon, authenticated;

-- Espelhado em `lib/security/rate-limit-rules.ts`, com teste de integração
-- comparando os dois lados.
insert into private.rate_limit_rules (action, max_requests, window_seconds) values
  ('dog_write', 30, 60),
  ('plan_generate', 10, 3600),
  ('plan_task_write', 120, 60),
  ('checkin_write', 30, 60),
  ('email_preferences_write', 20, 60),
  ('profile_write', 20, 60),
  ('account_export', 3, 60),
  ('account_delete', 3, 300),
  ('assessment_claim', 20, 60);

-- Consome uma unidade do balde do usuário autenticado. A chave é derivada de
-- `auth.uid()` dentro da função, então ninguém consome o balde de outro.
create function public.consume_action_rate_limit(p_action text)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_rule private.rate_limit_rules%rowtype;
  v_key text;
begin
  if v_user is null then return false; end if;
  select * into v_rule from private.rate_limit_rules where action = p_action;
  -- Ação desconhecida nega em vez de liberar sem contagem.
  if not found then return false; end if;
  v_key := encode(
    pg_catalog.sha256(
      pg_catalog.convert_to(v_user::text || ':' || p_action, 'UTF8')
    ),
    'hex'
  );
  return private.consume_assessment_rate_limit(
    v_key, v_rule.max_requests, v_rule.window_seconds
  );
end;
$$;

revoke all on function public.consume_action_rate_limit(text) from public, anon;
grant execute on function public.consume_action_rate_limit(text) to authenticated;
