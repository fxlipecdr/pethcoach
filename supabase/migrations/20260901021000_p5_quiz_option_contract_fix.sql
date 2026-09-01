-- Align the legacy puppy-stage option with the public API key contract.
-- Existing anonymous answers are migrated with the catalog value so resumable
-- version 1 assessments remain valid.

update public.quiz_questions
set options_json = (
  select jsonb_agg(
    case
      when option_item.value->>'key' in ('4_to_6m', '7_to_12m')
        then jsonb_set(
          option_item.value,
          '{key}',
          to_jsonb(('age_' || (option_item.value->>'key'))::text)
        )
      else option_item.value
    end
    order by option_item.ordinality
  )
  from jsonb_array_elements(options_json) with ordinality as option_item(value, ordinality)
)
where key = 'puppy_stage'
  and (
    options_json @> '[{"key":"4_to_6m"}]'::jsonb
    or options_json @> '[{"key":"7_to_12m"}]'::jsonb
  );

update public.assessments as assessment
set answers_json = jsonb_set(
      assessment.answers_json,
      '{puppy_stage}',
      to_jsonb(('age_' || (assessment.answers_json->>'puppy_stage'))::text)
    ),
    updated_at = now()
from public.problems as problem
where problem.id = assessment.problem_id
  and problem.slug = 'filhote-mordendo'
  and assessment.answers_json->>'puppy_stage' in ('4_to_6m', '7_to_12m');
