-- Development database only. All synthetic users/data are rolled back.
-- This tests real PostgreSQL roles/RLS; it does NOT validate Auth/JWT/PKCE.
begin;
set local statement_timeout = '15s';
select set_config('pethcoach.test_owner', gen_random_uuid()::text, true);
select set_config('pethcoach.test_other', gen_random_uuid()::text, true);
select set_config('pethcoach.test_dog', gen_random_uuid()::text, true);

insert into auth.users (id) values
  (current_setting('pethcoach.test_owner')::uuid),
  (current_setting('pethcoach.test_other')::uuid);

do $$ begin
  if (select count(*) from public.profiles where id in (
    current_setting('pethcoach.test_owner')::uuid,
    current_setting('pethcoach.test_other')::uuid
  )) <> 2 then raise exception 'FAIL: profile trigger'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('pethcoach.test_owner'), true);
insert into public.dogs (id, owner_id, name) values (
  current_setting('pethcoach.test_dog')::uuid,
  auth.uid(), 'Verificação temporária P2'
);
update public.dogs set neutered = false where id = current_setting('pethcoach.test_dog')::uuid;
do $$ begin
  if not exists (select 1 from public.dogs where id = current_setting('pethcoach.test_dog')::uuid and neutered = false)
    then raise exception 'FAIL: owner create/update/read'; end if;
end $$;

select set_config('request.jwt.claim.sub', current_setting('pethcoach.test_other'), true);
do $$ declare changed integer; begin
  if exists (select 1 from public.dogs where id = current_setting('pethcoach.test_dog')::uuid)
    then raise exception 'FAIL: cross-owner read'; end if;
  if exists (select 1 from public.profiles where id = current_setting('pethcoach.test_owner')::uuid)
    then raise exception 'FAIL: cross-owner profile'; end if;
  update public.dogs set name = 'Unauthorized' where id = current_setting('pethcoach.test_dog')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: cross-owner update'; end if;
  delete from public.dogs where id = current_setting('pethcoach.test_dog')::uuid;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'FAIL: cross-owner delete'; end if;
  begin
    insert into public.dogs (owner_id, name) values (current_setting('pethcoach.test_owner')::uuid, 'Unauthorized');
    raise exception 'FAIL: forged owner accepted';
  exception when insufficient_privilege then null; end;
  begin
    update public.dogs set owner_id = auth.uid() where id = current_setting('pethcoach.test_dog')::uuid;
    raise exception 'FAIL: owner_id grant';
  exception when insufficient_privilege then null; end;
  begin
    update public.profiles set onboarding_source = 'Unauthorized' where id = auth.uid();
    raise exception 'FAIL: attribution grant';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.attribution_touches (user_id, touch_type) values (auth.uid(), 'first');
    raise exception 'FAIL: attribution insertion';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.profiles where id = auth.uid();
    raise exception 'FAIL: profile deletion grant';
  exception when insufficient_privilege then null; end;
end $$;

reset role;
set local role anon;
do $$ begin
  begin
    perform 1 from public.profiles;
    raise exception 'FAIL: anonymous profiles';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.dogs;
    raise exception 'FAIL: anonymous dogs';
  exception when insufficient_privilege then null; end;
  begin
    perform 1 from public.attribution_touches;
    raise exception 'FAIL: anonymous attribution';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('pethcoach.test_owner'), true);
do $$ declare changed integer; begin
  delete from public.dogs where id = current_setting('pethcoach.test_dog')::uuid;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'FAIL: owner delete'; end if;
end $$;
reset role;
rollback;
select 'PASS: trigger, owner CRUD, IDOR, column grants, attribution and anonymous denial; fixtures rolled back' as result;
