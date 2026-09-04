begin;

create function public.claim_assessment(
  p_assessment_id uuid,
  p_token_hash text,
  p_dog_id uuid default null
) returns table (
  assessment_id uuid,
  user_id uuid,
  dog_id uuid,
  problem_slug text,
  safety_status text,
  claimed_at timestamptz
)
language plpgsql security definer set search_path = '' as $$
declare
  v_user_id uuid := auth.uid();
  v_assessment public.assessments%rowtype;
  v_problem public.problems%rowtype;
  v_dog public.dogs%rowtype;
  v_now timestamptz := clock_timestamp();
begin
  if v_user_id is null then
    raise exception using errcode = 'P0001', message = 'claim_unauthorized';
  end if;

  if p_token_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = 'P0001', message = 'claim_invalid_token';
  end if;

  -- Rate limit claim requests per assessment token
  if not private.consume_assessment_rate_limit('l:' || p_token_hash, 20, 600) then
    raise exception using errcode = 'P0001', message = 'assessment_rate_limited';
  end if;

  select * into v_assessment from public.assessments
    where id = p_assessment_id
      and anonymous_token_hash = p_token_hash
      and token_expires_at > v_now
    for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'assessment_not_available';
  end if;

  if v_assessment.status <> 'completed' then
    raise exception using errcode = 'P0001', message = 'assessment_incomplete';
  end if;

  -- P6 safety boundary: Only 'continue' assessments can be claimed for coaching/plan onboarding
  if v_assessment.safety_status <> 'continue' then
    raise exception using errcode = 'P0001', message = 'assessment_not_claimable';
  end if;

  -- Hijacking prevention: Assessment must be unassigned or already owned by caller
  if v_assessment.user_id is not null and v_assessment.user_id <> v_user_id then
    raise exception using errcode = 'P0001', message = 'assessment_already_claimed';
  end if;

  -- If dog_id is specified, ensure it belongs to the authenticated user
  if p_dog_id is not null then
    select * into v_dog from public.dogs
      where id = p_dog_id and owner_id = v_user_id;
    if not found then
      raise exception using errcode = 'P0001', message = 'dog_not_found';
    end if;
  end if;

  update public.assessments
    set user_id = v_user_id,
        dog_id = coalesce(p_dog_id, v_assessment.dog_id),
        updated_at = v_now
    where id = p_assessment_id
    returning * into v_assessment;

  select * into v_problem from public.problems where id = v_assessment.problem_id;

  assessment_id := v_assessment.id;
  user_id := v_assessment.user_id;
  dog_id := v_assessment.dog_id;
  problem_slug := v_problem.slug;
  safety_status := v_assessment.safety_status;
  claimed_at := v_now;
  return next;
end;
$$;

revoke all on function public.claim_assessment(uuid, text, uuid) from public;
grant execute on function public.claim_assessment(uuid, text, uuid) to authenticated;

-- Grant selective read and update permissions on user's own assessments
grant select (
  id, user_id, anonymous_id, dog_id, problem_id, quiz_version, answers_json,
  safety_status, safety_rule_version, safety_evaluated_at, segment, status,
  started_at, completed_at, created_at, updated_at
) on public.assessments to authenticated;

grant update (dog_id) on public.assessments to authenticated;

create policy assessments_read_owned on public.assessments
  for select to authenticated
  using (user_id = auth.uid());

create policy assessments_update_dog on public.assessments
  for update to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      dog_id is null
      or exists (
        select 1 from public.dogs
        where dogs.id = assessments.dog_id
          and dogs.owner_id = auth.uid()
      )
    )
  );

comment on function public.claim_assessment(uuid, text, uuid) is
  'Claims an anonymous assessment with continue outcome for an authenticated tutor and attaches it to a dog.';

commit;
