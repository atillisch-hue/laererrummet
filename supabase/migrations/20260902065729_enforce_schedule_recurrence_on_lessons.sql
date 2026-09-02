create or replace function private.sync_lesson_instance_context()
returns trigger
language plpgsql
security definer
set search_path to 'public','private'
as $$
declare
  v_school_id bigint;
  v_weekday integer;
  v_recurrence_pattern text;
  v_week integer;
  v_uid uuid;
begin
  select c.school_id, se.weekday, se.recurrence_pattern
    into v_school_id, v_weekday, v_recurrence_pattern
  from public.schedule_entries se
  join public.classes c on c.id = se.class_id
  where se.id = new.schedule_entry_id;

  if v_school_id is null then
    raise exception 'Lesson schedule entry is not linked to a school';
  end if;

  if extract(isodow from new.lesson_date)::integer <> v_weekday then
    raise exception 'Lesson date does not match the schedule weekday';
  end if;

  v_week := extract(week from new.lesson_date)::integer;
  if v_recurrence_pattern='odd' and mod(v_week,2)<>1 then
    raise exception 'Lesson date does not match the odd-week schedule recurrence';
  end if;
  if v_recurrence_pattern='even' and mod(v_week,2)<>0 then
    raise exception 'Lesson date does not match the even-week schedule recurrence';
  end if;

  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Authenticated user required';
  end if;

  new.school_id := v_school_id;
  new.updated_by := v_uid;
  new.updated_at := now();

  if tg_op = 'INSERT' then
    new.created_by := v_uid;
    new.created_at := coalesce(new.created_at, now());
  end if;

  return new;
end;
$$;

revoke all on function private.sync_lesson_instance_context() from public, anon, authenticated, service_role;
