create or replace function public.staff_booking_busy_intervals(
  p_user_ids uuid[],
  p_date date
)
returns table(
  user_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  busy_type text
)
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_date is null then raise exception 'Date is required'; end if;
  if coalesce(array_length(p_user_ids,1),0)=0 then return; end if;
  if coalesce(array_length(p_user_ids,1),0)>100 then raise exception 'Too many users'; end if;

  v_start := (p_date::timestamp at time zone 'Europe/Copenhagen');
  v_end := ((p_date+1)::timestamp at time zone 'Europe/Copenhagen');

  return query
  with caller_schools as (
    select distinct sm.school_id
    from public.school_memberships sm
    where sm.user_id=auth.uid()
      and sm.active=true
      and sm.role in ('teacher','admin','leader')
  ), allowed_users as (
    select distinct sm.user_id,sm.school_id
    from public.school_memberships sm
    join caller_schools cs on cs.school_id=sm.school_id
    where sm.active=true
      and sm.role in ('teacher','admin','leader')
      and sm.user_id=any(p_user_ids)
  ), meeting_rows as (
    select distinct au.user_id,
      cm.starts_at,
      coalesce(cm.ends_at,cm.starts_at+interval '1 hour') as ends_at,
      'meeting'::text as busy_type
    from allowed_users au
    join public.calendar_meetings cm on cm.school_id=au.school_id
    where cm.status<>'cancelled'
      and cm.starts_at<v_end
      and coalesce(cm.ends_at,cm.starts_at+interval '1 hour')>v_start
      and (
        cm.created_by=au.user_id
        or exists(
          select 1 from public.meeting_participants mp
          where mp.meeting_id=cm.id and mp.user_id=au.user_id
        )
      )
  ), absence_rows as (
    select distinct au.user_id,
      v_start as starts_at,
      v_end as ends_at,
      'absence'::text as busy_type
    from allowed_users au
    join public.staff_absence sa
      on sa.school_id=au.school_id
     and sa.user_id=au.user_id
     and sa.absence_date=p_date
  ), schedule_rows as (
    select distinct au.user_id,
      ((p_date+se.start_time) at time zone 'Europe/Copenhagen') as starts_at,
      ((p_date+se.end_time) at time zone 'Europe/Copenhagen') as ends_at,
      'schedule'::text as busy_type
    from allowed_users au
    join public.school_years sy
      on sy.school_id=au.school_id
     and sy.teaching_start is not null
     and sy.teaching_end is not null
     and p_date between sy.teaching_start and sy.teaching_end
     and not exists(
       select 1 from public.school_year_calendar_events ce
       where ce.school_year_id=sy.id
         and ce.closes_school=true
         and p_date between ce.starts_on and ce.ends_on
     )
    join lateral (
      select sv.id
      from public.school_schedule_versions sv
      where sv.school_year_id=sy.id
        and (
          (
            sv.status in ('published','archived')
            and coalesce(sv.effective_from,p_date)<=p_date
            and (sv.effective_to is null or sv.effective_to>=p_date)
          )
          or (
            sv.status='draft'
            and not private.school_year_has_live_schedule(sy.id)
          )
        )
      order by
        case sv.status when 'published' then 0 when 'archived' then 1 else 2 end,
        coalesce(sv.effective_from,'0001-01-01'::date) desc,
        sv.created_at desc
      limit 1
    ) chosen on true
    join public.schedule_entries se on se.schedule_version_id=chosen.id
    join public.classes c on c.id=se.class_id and c.school_id=au.school_id
    join public.schedule_teachers st on st.schedule_entry_id=se.id and st.teacher_id=au.user_id
    where se.weekday=extract(dow from p_date)::integer
      and (
        coalesce(se.recurrence_pattern,'weekly')='weekly'
        or (se.recurrence_pattern='odd' and mod(extract(week from p_date)::integer,2)=1)
        or (se.recurrence_pattern='even' and mod(extract(week from p_date)::integer,2)=0)
      )
  ), substitute_rows as (
    select distinct au.user_id,
      ((p_date+se.start_time) at time zone 'Europe/Copenhagen') as starts_at,
      ((p_date+se.end_time) at time zone 'Europe/Copenhagen') as ends_at,
      'substitute'::text as busy_type
    from allowed_users au
    join public.substitute_assignments sa
      on sa.school_id=au.school_id
     and sa.substitute_teacher_id=au.user_id
     and sa.assignment_date=p_date
    join public.schedule_entries se on se.id=sa.schedule_entry_id
  )
  select * from meeting_rows
  union all select * from absence_rows
  union all select * from schedule_rows
  union all select * from substitute_rows
  order by user_id,starts_at,busy_type;
end;
$$;

revoke all on function public.staff_booking_busy_intervals(uuid[],date) from public,anon;
grant execute on function public.staff_booking_busy_intervals(uuid[],date) to authenticated;
