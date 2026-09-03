create or replace function public.teacher_class_math_learning_profile(p_class_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare
  v_school_id bigint;
  v_allowed boolean;
  v_class_name text;
begin
  if (select auth.uid()) is null then
    return jsonb_build_object('ok',false,'error','not_authenticated');
  end if;

  select c.school_id,c.name into v_school_id,v_class_name
  from public.classes c
  where c.id=p_class_id;
  if v_school_id is null then
    return jsonb_build_object('ok',false,'error','class_not_found');
  end if;

  select (
    public.has_school_role(v_school_id,'admin')
    or (
      public.has_school_role(v_school_id,'teacher')
      and exists(
        select 1 from public.teacher_classes tc
        where tc.class_id=p_class_id and tc.teacher_id=(select auth.uid())
      )
    )
  ) into v_allowed;
  if not coalesce(v_allowed,false) then
    return jsonb_build_object('ok',false,'error','forbidden');
  end if;

  return jsonb_build_object(
    'ok',true,
    'class',jsonb_build_object('id',p_class_id,'name',v_class_name),
    'students',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,
        'name',s.name,
        'grade_level',s.grade_level
      ) order by s.name)
      from public.students s
      where s.class_id=p_class_id
    ),'[]'::jsonb),
    'progress',coalesce((
      select jsonb_agg(jsonb_build_object(
        'student_id',p.student_id,
        'area_id',p.area_id,
        'skill_id',p.skill_id,
        'level_id',p.level_id,
        'attempts',p.attempts,
        'best_score',p.best_score,
        'last_score',p.last_score,
        'max_score',p.max_score,
        'first_attempt_at',p.first_attempt_at,
        'last_attempt_at',p.last_attempt_at
      ) order by p.student_id,p.area_id,p.skill_id,p.last_attempt_at desc nulls last)
      from public.student_training_progress p
      join public.students s on s.id=p.student_id
      where s.class_id=p_class_id and p.subject_id='matematik' and p.attempts>0
    ),'[]'::jsonb)
  );
end;
$function$;

revoke all on function public.teacher_class_math_learning_profile(bigint) from public,anon,authenticated;
grant execute on function public.teacher_class_math_learning_profile(bigint) to authenticated,service_role;
