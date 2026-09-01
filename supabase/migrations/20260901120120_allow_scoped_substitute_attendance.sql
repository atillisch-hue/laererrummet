create or replace function public.save_lesson_attendance(
  p_schedule_entry_id bigint,
  p_lesson_date date,
  p_changes jsonb default '[]'::jsonb
)
returns timestamptz
language plpgsql
security definer
set search_path = 'public','private'
as $$
declare
  v_uid uuid := auth.uid();
  v_class_id bigint;
  v_school_id bigint;
  v_weekday integer;
  v_is_teacher boolean := false;
  v_is_substitute boolean := false;
  v_source text := 'teacher';
  v_item jsonb;
  v_student_id bigint;
  v_status text;
  v_note text;
  v_existing_source text;
  v_checked_at timestamptz := now();
begin
  if v_uid is null then raise exception 'Authenticated user required'; end if;

  select se.class_id, c.school_id, se.weekday into v_class_id, v_school_id, v_weekday
  from public.schedule_entries se join public.classes c on c.id = se.class_id
  where se.id = p_schedule_entry_id;

  if v_class_id is null or v_school_id is null then raise exception 'Schedule entry not found'; end if;
  if extract(isodow from p_lesson_date)::integer <> v_weekday then raise exception 'Lesson date does not match schedule weekday'; end if;

  v_is_teacher := public.has_school_role(v_school_id,'admin') or (
    exists (select 1 from public.schedule_teachers st where st.schedule_entry_id=p_schedule_entry_id and st.teacher_id=v_uid)
    and public.has_school_role(v_school_id,'teacher')
  );
  v_is_substitute := exists (
    select 1 from public.substitute_assignments sa
    where sa.schedule_entry_id=p_schedule_entry_id and sa.assignment_date=p_lesson_date
      and sa.substitute_teacher_id=v_uid and sa.school_id=v_school_id
  ) and public.is_school_member(v_school_id);

  if not v_is_teacher and not v_is_substitute then raise exception 'Not allowed to record attendance for this lesson'; end if;
  if v_is_substitute and not v_is_teacher then v_source := 'substitute'; end if;

  if p_changes is null then p_changes := '[]'::jsonb; end if;
  if jsonb_typeof(p_changes) <> 'array' then raise exception 'Attendance changes must be a JSON array'; end if;

  for v_item in select value from jsonb_array_elements(p_changes)
  loop
    begin v_student_id := (v_item->>'student_id')::bigint;
    exception when others then raise exception 'Invalid student id in attendance change'; end;
    v_status := coalesce(nullif(v_item->>'status',''),'present');
    v_note := nullif(btrim(coalesce(v_item->>'note','')),'');
    if v_status not in ('present','sick','excused','unexcused','late','left_early') then raise exception 'Invalid attendance status'; end if;
    if not exists(select 1 from public.students s where s.id=v_student_id and s.class_id=v_class_id) then raise exception 'Student is not in the lesson class'; end if;

    select sa.source into v_existing_source from public.student_absence sa
    where sa.student_id=v_student_id and sa.absence_date=p_lesson_date;
    if v_existing_source='parent' then raise exception 'Parent-reported absence cannot be overwritten here'; end if;

    if v_status='present' then
      delete from public.student_absence where student_id=v_student_id and absence_date=p_lesson_date and source <> 'parent';
    else
      insert into public.student_absence(student_id,absence_date,status,note,source,reported_by)
      values(v_student_id,p_lesson_date,v_status,v_note,v_source,v_uid)
      on conflict(student_id,absence_date) do update set status=excluded.status,note=excluded.note,source=excluded.source,reported_by=excluded.reported_by;
    end if;
  end loop;

  insert into public.lesson_instances(schedule_entry_id,lesson_date,attendance_checked_at,attendance_checked_by)
  values(p_schedule_entry_id,p_lesson_date,v_checked_at,v_uid)
  on conflict(schedule_entry_id,lesson_date) do update set attendance_checked_at=excluded.attendance_checked_at,attendance_checked_by=excluded.attendance_checked_by;

  return v_checked_at;
end;
$$;

revoke all on function public.save_lesson_attendance(bigint,date,jsonb) from public, anon;
grant execute on function public.save_lesson_attendance(bigint,date,jsonb) to authenticated;
