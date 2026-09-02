create or replace function public.teacher_spelling_exam_assignments(p_class_id bigint)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_school_id bigint;
  v_allowed boolean;
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

  return jsonb_build_object(
    'ok',true,
    'assignments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,
        'title',a.title,
        'time_limit_minutes',a.time_limit_minutes,
        'question_count',a.question_count,
        'created_at',a.created_at,
        'recipient_count',case
          when exists(select 1 from public.spelling_exam_assignment_students l0 where l0.spelling_exam_assignment_id=a.id)
          then (select count(*) from public.spelling_exam_assignment_students l where l.spelling_exam_assignment_id=a.id)
          else (select count(*) from public.students s where s.class_id=a.class_id)
        end,
        'started_count',(select count(*) from public.spelling_exam_sessions s where s.spelling_exam_assignment_id=a.id),
        'submitted_count',(select count(*) from public.spelling_exam_attempts x where x.spelling_exam_assignment_id=a.id),
        'locked',exists(select 1 from public.spelling_exam_sessions s where s.spelling_exam_assignment_id=a.id)
      ) order by a.created_at desc)
      from public.spelling_exam_assignments a
      where a.class_id=p_class_id
    ),'[]'::jsonb)
  );
end;
$$;

revoke execute on function public.teacher_spelling_exam_assignments(bigint) from public,anon,authenticated;
grant execute on function public.teacher_spelling_exam_assignments(bigint) to authenticated,service_role;
