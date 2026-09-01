create or replace function public.get_lesson_attendance(p_schedule_entry_id bigint, p_lesson_date date)
returns table(student_id bigint, student_name text, status text, note text, source text)
language plpgsql
stable
security definer
set search_path = 'public','private'
as $$
declare
  v_uid uuid := auth.uid();
  v_class_id bigint;
  v_school_id bigint;
  v_weekday integer;
  v_allowed boolean := false;
begin
  if v_uid is null then raise exception 'Authenticated user required'; end if;
  select se.class_id,c.school_id,se.weekday into v_class_id,v_school_id,v_weekday
  from public.schedule_entries se join public.classes c on c.id=se.class_id
  where se.id=p_schedule_entry_id;
  if v_class_id is null or v_school_id is null then raise exception 'Schedule entry not found'; end if;
  if extract(isodow from p_lesson_date)::integer <> v_weekday then raise exception 'Lesson date does not match schedule weekday'; end if;
  v_allowed := public.has_school_role(v_school_id,'admin')
    or (exists(select 1 from public.schedule_teachers st where st.schedule_entry_id=p_schedule_entry_id and st.teacher_id=v_uid) and public.has_school_role(v_school_id,'teacher'))
    or (exists(select 1 from public.substitute_assignments sa where sa.schedule_entry_id=p_schedule_entry_id and sa.assignment_date=p_lesson_date and sa.substitute_teacher_id=v_uid and sa.school_id=v_school_id) and public.is_school_member(v_school_id));
  if not v_allowed then raise exception 'Not allowed to read attendance for this lesson'; end if;
  return query
    select s.id,s.name,coalesce(sa.status,'present')::text,sa.note,sa.source
    from public.students s
    left join public.student_absence sa on sa.student_id=s.id and sa.absence_date=p_lesson_date
    where s.class_id=v_class_id
    order by s.name;
end;
$$;
revoke all on function public.get_lesson_attendance(bigint,date) from public,anon;
grant execute on function public.get_lesson_attendance(bigint,date) to authenticated;
