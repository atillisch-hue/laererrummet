create or replace function public.student_session_data(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_student_id bigint;
  s public.students;
  c public.classes;
  v_result jsonb;
begin
  v_student_id:=private.student_id_for_session(p_session_token);
  if v_student_id is null then return jsonb_build_object('ok',false,'error','invalid_session'); end if;

  select * into s from public.students where id=v_student_id;
  select * into c from public.classes where id=s.class_id;
  if s.id is null or c.id is null then return jsonb_build_object('ok',false,'error','student_not_found'); end if;

  select jsonb_build_object(
    'ok',true,
    'student',jsonb_build_object('id',s.id,'name',s.name,'class_id',s.class_id,'grade_level',s.grade_level),
    'class',jsonb_build_object('id',c.id,'name',c.name),
    'assignments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'title',a.title,'type',a.type,'instructions',a.instructions
      ) order by a.id)
      from public.assignments a
      where a.class_id=s.class_id
        and (
          not exists(select 1 from public.assignment_students ast0 where ast0.assignment_id=a.id)
          or exists(select 1 from public.assignment_students ast where ast.assignment_id=a.id and ast.student_id=s.id)
        )
    ),'[]'::jsonb),
    'drafts',coalesce((
      select jsonb_agg(jsonb_build_object('assignment_id',d.assignment_id,'content',d.content))
      from public.drafts d where d.student_id=s.id
    ),'[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.student_session_data(text) from public, authenticated;
grant execute on function public.student_session_data(text) to anon, service_role;
