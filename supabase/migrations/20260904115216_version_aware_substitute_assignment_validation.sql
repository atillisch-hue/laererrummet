create or replace function private.validate_substitute_assignment_context()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_school_id bigint;
  v_weekday integer;
  v_recurrence_pattern text;
  v_start_time time;
  v_end_time time;
  v_schedule_version_id bigint;
  v_school_year_id bigint;
  v_selected_version_id bigint;
  v_week integer;
begin
  select c.school_id,se.weekday,se.recurrence_pattern,se.start_time,se.end_time,se.schedule_version_id,sv.school_year_id
    into v_school_id,v_weekday,v_recurrence_pattern,v_start_time,v_end_time,v_schedule_version_id,v_school_year_id
  from public.schedule_entries se
  join public.classes c on c.id=se.class_id
  join public.school_schedule_versions sv on sv.id=se.schedule_version_id
  where se.id=new.schedule_entry_id;

  if v_school_id is null then raise exception 'Schedule entry not found'; end if;

  if not exists(
    select 1 from public.school_years sy
    where sy.id=v_school_year_id
      and sy.school_id=v_school_id
      and sy.teaching_start is not null
      and sy.teaching_end is not null
      and new.assignment_date between sy.teaching_start and sy.teaching_end
      and not exists(
        select 1 from public.school_year_calendar_events ce
        where ce.school_year_id=sy.id
          and ce.closes_school=true
          and new.assignment_date between ce.starts_on and ce.ends_on
      )
  ) then raise exception 'Substitute date is outside teaching days'; end if;

  select sv.id into v_selected_version_id
  from public.school_schedule_versions sv
  where sv.school_year_id=v_school_year_id
    and (
      (
        sv.status in ('published','archived')
        and coalesce(sv.effective_from,new.assignment_date)<=new.assignment_date
        and (sv.effective_to is null or sv.effective_to>=new.assignment_date)
      )
      or (
        sv.status='draft'
        and not private.school_year_has_live_schedule(v_school_year_id)
      )
    )
  order by case sv.status when 'published' then 0 when 'archived' then 1 else 2 end,
           coalesce(sv.effective_from,'0001-01-01'::date) desc,
           sv.created_at desc
  limit 1;

  if v_selected_version_id is null or v_selected_version_id<>v_schedule_version_id then
    raise exception 'Schedule entry is not active on substitute date';
  end if;

  if extract(dow from new.assignment_date)::integer<>v_weekday then
    raise exception 'Substitute date does not match the schedule weekday';
  end if;

  v_week:=extract(week from new.assignment_date)::integer;
  if v_recurrence_pattern='odd' and mod(v_week,2)<>1 then raise exception 'Substitute date does not match the odd-week schedule recurrence'; end if;
  if v_recurrence_pattern='even' and mod(v_week,2)<>0 then raise exception 'Substitute date does not match the even-week schedule recurrence'; end if;
  if new.absent_teacher_id=new.substitute_teacher_id then raise exception 'Absent teacher cannot be their own substitute'; end if;

  if not exists(
    select 1 from public.schedule_teachers st
    where st.schedule_entry_id=new.schedule_entry_id
      and st.teacher_id=new.absent_teacher_id
  ) then raise exception 'Absent teacher is not assigned to this schedule entry'; end if;

  if not exists(
    select 1 from public.school_memberships sm
    where sm.school_id=v_school_id
      and sm.user_id=new.substitute_teacher_id
      and sm.active=true
      and sm.role in ('teacher','staff','admin','leader')
  ) then raise exception 'Substitute must be active staff at the school'; end if;

  if exists(
    select 1 from public.staff_absence sa
    where sa.school_id=v_school_id
      and sa.user_id=new.substitute_teacher_id
      and sa.absence_date=new.assignment_date
  ) then raise exception 'Substitute is registered absent on this date'; end if;

  if exists(
    select 1
    from public.schedule_entries se
    join public.schedule_teachers st on st.schedule_entry_id=se.id
    join public.classes c on c.id=se.class_id and c.school_id=v_school_id
    where st.teacher_id=new.substitute_teacher_id
      and se.schedule_version_id=v_selected_version_id
      and se.id<>new.schedule_entry_id
      and se.weekday=v_weekday
      and se.start_time<v_end_time
      and se.end_time>v_start_time
      and (
        coalesce(se.recurrence_pattern,'weekly')='weekly'
        or (se.recurrence_pattern='odd' and mod(v_week,2)=1)
        or (se.recurrence_pattern='even' and mod(v_week,2)=0)
      )
  ) then raise exception 'Substitute already has overlapping teaching on this date'; end if;

  if exists(
    select 1
    from public.substitute_assignments sa
    join public.schedule_entries se on se.id=sa.schedule_entry_id
    where sa.substitute_teacher_id=new.substitute_teacher_id
      and sa.assignment_date=new.assignment_date
      and sa.id<>coalesce(new.id,-1)
      and se.start_time<v_end_time
      and se.end_time>v_start_time
  ) then raise exception 'Substitute already covers another overlapping lesson'; end if;

  if exists(
    select 1
    from public.calendar_meetings cm
    where cm.school_id=v_school_id
      and cm.status<>'cancelled'
      and (
        cm.created_by=new.substitute_teacher_id
        or exists(
          select 1 from public.meeting_participants mp
          where mp.meeting_id=cm.id and mp.user_id=new.substitute_teacher_id
        )
      )
      and cm.starts_at < ((new.assignment_date+v_end_time) at time zone 'Europe/Copenhagen')
      and coalesce(cm.ends_at,cm.starts_at+interval '1 hour') > ((new.assignment_date+v_start_time) at time zone 'Europe/Copenhagen')
  ) then raise exception 'Substitute has an overlapping meeting on this date'; end if;

  new.school_id:=v_school_id;
  return new;
end;
$$;

revoke all on function private.validate_substitute_assignment_context() from public,anon,authenticated,service_role;
