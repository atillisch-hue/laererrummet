create or replace function private.validate_substitute_assignment_context()
returns trigger
language plpgsql
security definer
set search_path to 'public','private'
as $$
declare
  v_school_id bigint;
  v_weekday integer;
  v_recurrence_pattern text;
  v_start_time time;
  v_end_time time;
  v_week integer;
begin
  select c.school_id,se.weekday,se.recurrence_pattern,se.start_time,se.end_time
    into v_school_id,v_weekday,v_recurrence_pattern,v_start_time,v_end_time
  from public.schedule_entries se
  join public.classes c on c.id=se.class_id
  where se.id=new.schedule_entry_id;

  if v_school_id is null then
    raise exception 'Schedule entry not found';
  end if;

  if extract(isodow from new.assignment_date)::integer<>v_weekday then
    raise exception 'Substitute date does not match the schedule weekday';
  end if;

  v_week:=extract(week from new.assignment_date)::integer;
  if v_recurrence_pattern='odd' and mod(v_week,2)<>1 then
    raise exception 'Substitute date does not match the odd-week schedule recurrence';
  end if;
  if v_recurrence_pattern='even' and mod(v_week,2)<>0 then
    raise exception 'Substitute date does not match the even-week schedule recurrence';
  end if;

  if new.absent_teacher_id=new.substitute_teacher_id then
    raise exception 'Absent teacher cannot be their own substitute';
  end if;

  if not exists(
    select 1 from public.schedule_teachers st
    where st.schedule_entry_id=new.schedule_entry_id
      and st.teacher_id=new.absent_teacher_id
  ) then
    raise exception 'Absent teacher is not assigned to this schedule entry';
  end if;

  if not exists(
    select 1 from public.school_memberships sm
    where sm.school_id=v_school_id
      and sm.user_id=new.substitute_teacher_id
      and sm.active=true
      and sm.role in ('teacher','admin','leader')
  ) then
    raise exception 'Substitute must be active staff at the school';
  end if;

  if exists(
    select 1 from public.staff_absence sa
    where sa.user_id=new.substitute_teacher_id
      and sa.absence_date=new.assignment_date
  ) then
    raise exception 'Substitute is registered absent on this date';
  end if;

  if exists(
    select 1
    from public.schedule_entries se
    join public.schedule_teachers st on st.schedule_entry_id=se.id
    where st.teacher_id=new.substitute_teacher_id
      and se.id<>new.schedule_entry_id
      and se.weekday=v_weekday
      and se.start_time<v_end_time
      and se.end_time>v_start_time
      and (
        se.recurrence_pattern='weekly'
        or (se.recurrence_pattern='odd' and mod(v_week,2)=1)
        or (se.recurrence_pattern='even' and mod(v_week,2)=0)
      )
  ) then
    raise exception 'Substitute already has overlapping teaching on this date';
  end if;

  if exists(
    select 1
    from public.substitute_assignments sa
    join public.schedule_entries se on se.id=sa.schedule_entry_id
    where sa.substitute_teacher_id=new.substitute_teacher_id
      and sa.assignment_date=new.assignment_date
      and sa.id<>coalesce(new.id,-1)
      and se.start_time<v_end_time
      and se.end_time>v_start_time
  ) then
    raise exception 'Substitute already covers another overlapping lesson';
  end if;

  new.school_id:=v_school_id;
  return new;
end;
$$;

revoke all on function private.validate_substitute_assignment_context() from public,anon,authenticated,service_role;

drop trigger if exists validate_substitute_assignment_context_before_write on public.substitute_assignments;
create trigger validate_substitute_assignment_context_before_write
before insert or update of school_id,schedule_entry_id,assignment_date,absent_teacher_id,substitute_teacher_id
on public.substitute_assignments
for each row execute function private.validate_substitute_assignment_context();
