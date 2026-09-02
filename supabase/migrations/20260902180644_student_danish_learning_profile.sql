create or replace function public.teacher_student_danish_learning_profile(p_student_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_class_id bigint;
  v_school_id bigint;
  v_allowed boolean;
  v_reading_history jsonb := '[]'::jsonb;
  v_spelling_history jsonb := '[]'::jsonb;
  v_reading_training jsonb := '[]'::jsonb;
  v_grammar_mastery jsonb := '[]'::jsonb;
  v_reading_focus jsonb := null;
  v_spelling_focus jsonb := null;
  v_reading_delta numeric := null;
  v_spelling_delta numeric := null;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;

  select s.class_id, c.school_id
    into v_class_id, v_school_id
  from public.students s
  join public.classes c on c.id = s.class_id
  where s.id = p_student_id;

  if v_class_id is null or v_school_id is null then
    return jsonb_build_object('ok', false, 'error', 'student_not_found');
  end if;

  select (
    public.has_school_role(v_school_id, 'admin')
    or (
      public.has_school_role(v_school_id, 'teacher')
      and exists (
        select 1 from public.teacher_classes tc
        where tc.class_id = v_class_id and tc.teacher_id = auth.uid()
      )
    )
  ) into v_allowed;

  if not coalesce(v_allowed, false) then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  with rows as (
    select rea.id, rea.title, rea.target_grade, ra.score, ra.max_score, ra.completed_at,
           case when ra.max_score > 0 then round((ra.score::numeric / ra.max_score::numeric) * 100, 1) else null end as accuracy,
           row_number() over(order by ra.completed_at desc, ra.id desc) rn
    from public.reading_exam_attempts ra
    join public.reading_exam_assignments rea on rea.id = ra.reading_exam_assignment_id
    where ra.student_id = p_student_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'assignment_id', id,
    'title', title,
    'target_grade', target_grade,
    'score', score,
    'max_score', max_score,
    'accuracy', accuracy,
    'completed_at', completed_at
  ) order by rn), '[]'::jsonb)
  into v_reading_history
  from rows where rn <= 8;

  with rows as (
    select sea.id, sea.title, sea.target_grade, sa.score, sa.max_score, sa.completed_at,
           case when sa.max_score > 0 then round((sa.score::numeric / sa.max_score::numeric) * 100, 1) else null end as accuracy,
           row_number() over(order by sa.completed_at desc, sa.id desc) rn
    from public.spelling_exam_attempts sa
    join public.spelling_exam_assignments sea on sea.id = sa.spelling_exam_assignment_id
    where sa.student_id = p_student_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'assignment_id', id,
    'title', title,
    'target_grade', target_grade,
    'score', score,
    'max_score', max_score,
    'accuracy', accuracy,
    'completed_at', completed_at
  ) order by rn), '[]'::jsonb)
  into v_spelling_history
  from rows where rn <= 8;

  with ordered as (
    select case when ra.max_score > 0 then (ra.score::numeric / ra.max_score::numeric) * 100 else null end accuracy,
           row_number() over(order by ra.completed_at desc, ra.id desc) rn
    from public.reading_exam_attempts ra
    where ra.student_id = p_student_id
  )
  select round(max(accuracy) filter(where rn=1) - max(accuracy) filter(where rn=2), 1)
    into v_reading_delta
  from ordered where rn <= 2;

  with ordered as (
    select case when sa.max_score > 0 then (sa.score::numeric / sa.max_score::numeric) * 100 else null end accuracy,
           row_number() over(order by sa.completed_at desc, sa.id desc) rn
    from public.spelling_exam_attempts sa
    where sa.student_id = p_student_id
  )
  select round(max(accuracy) filter(where rn=1) - max(accuracy) filter(where rn=2), 1)
    into v_spelling_delta
  from ordered where rn <= 2;

  with latest as (
    select ra.answers
    from public.reading_exam_attempts ra
    where ra.student_id = p_student_id
    order by ra.completed_at desc, ra.id desc
    limit 1
  ), valueset as (
    select value
    from latest, lateral jsonb_each(latest.answers)
  ), grouped as (
    select value->>'strategy' strategy,
           count(*)::int total,
           count(*) filter(where coalesce((value->>'correct')::boolean, false))::int correct
    from valueset
    where nullif(value->>'strategy','') is not null
    group by value->>'strategy'
  )
  select jsonb_build_object(
    'strategy', strategy,
    'correct', correct,
    'total', total,
    'accuracy', round((correct::numeric / nullif(total,0)) * 100, 1)
  ) into v_reading_focus
  from grouped
  where total >= 2 and correct < total
  order by (correct::numeric / nullif(total,0)) asc, total desc, strategy
  limit 1;

  with latest as (
    select sa.answers
    from public.spelling_exam_attempts sa
    where sa.student_id = p_student_id
    order by sa.completed_at desc, sa.id desc
    limit 1
  ), valueset as (
    select value
    from latest, lateral jsonb_each(latest.answers)
  ), grouped as (
    select value->>'section' section,
           count(*)::int total,
           count(*) filter(where coalesce((value->>'correct')::boolean, false))::int correct
    from valueset
    where nullif(value->>'section','') is not null
    group by value->>'section'
  )
  select jsonb_build_object(
    'section', section,
    'correct', correct,
    'total', total,
    'accuracy', round((correct::numeric / nullif(total,0)) * 100, 1)
  ) into v_spelling_focus
  from grouped
  where total >= 2 and correct < total
  order by (correct::numeric / nullif(total,0)) asc, total desc, section
  limit 1;

  select coalesce(jsonb_agg(jsonb_build_object(
    'strategy', stp.skill_id,
    'grade', stp.level_id,
    'attempts', stp.attempts,
    'best_score', stp.best_score,
    'last_score', stp.last_score,
    'max_score', stp.max_score,
    'last_attempt_at', stp.last_attempt_at,
    'mastered', (stp.attempts >= 2 and stp.max_score > 0 and stp.last_score = stp.max_score)
  ) order by stp.last_attempt_at desc nulls last, stp.skill_id), '[]'::jsonb)
  into v_reading_training
  from public.student_training_progress stp
  where stp.student_id = p_student_id
    and stp.subject_id = 'dansk-laesning'
    and stp.area_id = 'laesestrategier';

  with rows as (
    select ga.id, a.topic, a.area, a.target_grade, a.source_kind,
           ga.attempt_count, ga.best_score, ga.best_max_score, ga.score, ga.max_score,
           ga.completed_at, ga.updated_at,
           (ga.best_max_score > 0 and ga.best_score = ga.best_max_score) mastered,
           row_number() over(order by coalesce(ga.completed_at, ga.updated_at) desc, ga.id desc) rn
    from public.grammar_attempts ga
    join public.grammar_assignments a on a.id = ga.grammar_assignment_id
    where ga.student_id = p_student_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'topic', topic,
    'area', area,
    'target_grade', target_grade,
    'source_kind', source_kind,
    'attempts', attempt_count,
    'best_score', best_score,
    'best_max_score', best_max_score,
    'latest_score', score,
    'latest_max_score', max_score,
    'mastered', mastered,
    'updated_at', coalesce(completed_at, updated_at)
  ) order by rn), '[]'::jsonb)
  into v_grammar_mastery
  from rows where rn <= 16;

  return jsonb_build_object(
    'ok', true,
    'reading_history', v_reading_history,
    'spelling_history', v_spelling_history,
    'reading_delta', v_reading_delta,
    'spelling_delta', v_spelling_delta,
    'reading_focus', v_reading_focus,
    'spelling_focus', v_spelling_focus,
    'reading_training', v_reading_training,
    'grammar_mastery', v_grammar_mastery
  );
end;
$$;

revoke all on function public.teacher_student_danish_learning_profile(bigint) from public, anon;
grant execute on function public.teacher_student_danish_learning_profile(bigint) to authenticated;
