create or replace function public.teacher_class_danish_learning_profile(p_class_id bigint)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_school_id bigint;
  v_allowed boolean;
  v_students jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;

  select c.school_id into v_school_id from public.classes c where c.id=p_class_id;
  if v_school_id is null then return jsonb_build_object('ok',false,'error','class_not_found'); end if;

  select (
    public.has_school_role(v_school_id,'admin')
    or (
      public.has_school_role(v_school_id,'teacher')
      and exists(select 1 from public.teacher_classes tc where tc.class_id=p_class_id and tc.teacher_id=auth.uid())
    )
  ) into v_allowed;
  if not coalesce(v_allowed,false) then return jsonb_build_object('ok',false,'error','forbidden'); end if;

  with rows as (
    select s.id,s.name,s.grade_level,
      rl.accuracy reading_latest, rp.accuracy reading_previous, rl.completed_at reading_completed_at,
      sl.accuracy spelling_latest, sp.accuracy spelling_previous, sl.completed_at spelling_completed_at,
      (
        select x.strategy
        from (
          select value->>'strategy' strategy,
                 count(*) total,
                 count(*) filter(where coalesce((value->>'correct')::boolean,false)) correct
          from jsonb_each(coalesce(rl.answers,'{}'::jsonb))
          where nullif(value->>'strategy','') is not null
          group by value->>'strategy'
        ) x
        where x.total>=2 and x.correct<x.total
        order by (x.correct::numeric/nullif(x.total,0)),x.total desc,x.strategy
        limit 1
      ) reading_focus,
      (
        select x.section
        from (
          select value->>'section' section,
                 count(*) total,
                 count(*) filter(where coalesce((value->>'correct')::boolean,false)) correct
          from jsonb_each(coalesce(sl.answers,'{}'::jsonb))
          where nullif(value->>'section','') is not null
          group by value->>'section'
        ) x
        where x.total>=2 and x.correct<x.total
        order by (x.correct::numeric/nullif(x.total,0)),x.total desc,x.section
        limit 1
      ) spelling_focus,
      coalesce(g.mastered_count,0) grammar_mastered_count,
      coalesce(g.in_progress_count,0) grammar_in_progress_count
    from public.students s
    left join lateral (
      select round((ra.score::numeric/nullif(ra.max_score,0))*100,1) accuracy,ra.completed_at,ra.answers
      from public.reading_exam_attempts ra
      join public.reading_exam_assignments a on a.id=ra.reading_exam_assignment_id
      where ra.student_id=s.id and a.class_id=p_class_id
      order by ra.completed_at desc,ra.id desc limit 1
    ) rl on true
    left join lateral (
      select round((ra.score::numeric/nullif(ra.max_score,0))*100,1) accuracy
      from public.reading_exam_attempts ra
      join public.reading_exam_assignments a on a.id=ra.reading_exam_assignment_id
      where ra.student_id=s.id and a.class_id=p_class_id
      order by ra.completed_at desc,ra.id desc offset 1 limit 1
    ) rp on true
    left join lateral (
      select round((sa.score::numeric/nullif(sa.max_score,0))*100,1) accuracy,sa.completed_at,sa.answers
      from public.spelling_exam_attempts sa
      join public.spelling_exam_assignments a on a.id=sa.spelling_exam_assignment_id
      where sa.student_id=s.id and a.class_id=p_class_id
      order by sa.completed_at desc,sa.id desc limit 1
    ) sl on true
    left join lateral (
      select round((sa.score::numeric/nullif(sa.max_score,0))*100,1) accuracy
      from public.spelling_exam_attempts sa
      join public.spelling_exam_assignments a on a.id=sa.spelling_exam_assignment_id
      where sa.student_id=s.id and a.class_id=p_class_id
      order by sa.completed_at desc,sa.id desc offset 1 limit 1
    ) sp on true
    left join lateral (
      select count(*) filter(where ga.best_max_score>0 and ga.best_score=ga.best_max_score)::int mastered_count,
             count(*) filter(where not (ga.best_max_score>0 and ga.best_score=ga.best_max_score))::int in_progress_count
      from public.grammar_attempts ga
      join public.grammar_assignments a on a.id=ga.grammar_assignment_id
      where ga.student_id=s.id and a.class_id=p_class_id
    ) g on true
    where s.class_id=p_class_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'student_id',id,'student_name',name,'grade_level',grade_level,
    'reading_latest',reading_latest,'reading_previous',reading_previous,
    'reading_delta',case when reading_latest is not null and reading_previous is not null then round(reading_latest-reading_previous,1) end,
    'reading_focus',reading_focus,'reading_completed_at',reading_completed_at,
    'spelling_latest',spelling_latest,'spelling_previous',spelling_previous,
    'spelling_delta',case when spelling_latest is not null and spelling_previous is not null then round(spelling_latest-spelling_previous,1) end,
    'spelling_focus',spelling_focus,'spelling_completed_at',spelling_completed_at,
    'grammar_mastered_count',grammar_mastered_count,'grammar_in_progress_count',grammar_in_progress_count
  ) order by name),'[]'::jsonb) into v_students from rows;

  return jsonb_build_object('ok',true,'class_id',p_class_id,'students',v_students);
end;
$$;

revoke all on function public.teacher_class_danish_learning_profile(bigint) from public,anon;
grant execute on function public.teacher_class_danish_learning_profile(bigint) to authenticated;
