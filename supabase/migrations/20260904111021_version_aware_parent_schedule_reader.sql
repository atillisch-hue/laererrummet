create or replace function public.parent_schedule_occurrences(
  p_student_id bigint,
  p_start_date date,
  p_end_date date
)
returns table(
  student_id bigint,
  occurrence_date date,
  schedule_entry_id bigint,
  schedule_version_id bigint,
  class_id bigint,
  weekday integer,
  start_time time without time zone,
  end_time time without time zone,
  subject text,
  room text,
  entry_kind text,
  recurrence_pattern text
)
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_uid uuid:=(select auth.uid());
  v_class_id bigint;
  v_school_id bigint;
begin
  if v_uid is null then raise exception 'Authentication required'; end if;
  if p_start_date is null or p_end_date is null or p_end_date<p_start_date then raise exception 'Invalid date range'; end if;
  if p_end_date-p_start_date>31 then raise exception 'Date range too large'; end if;

  select s.class_id,c.school_id
  into v_class_id,v_school_id
  from public.parent_students ps
  join public.students s on s.id=ps.student_id
  join public.classes c on c.id=s.class_id
  join public.school_memberships sm on sm.user_id=ps.parent_id and sm.school_id=c.school_id and sm.role='parent' and sm.active=true
  where ps.parent_id=v_uid and ps.student_id=p_student_id
  limit 1;

  if v_class_id is null or v_school_id is null then raise exception 'Child access denied'; end if;

  return query
  with dates as (
    select d::date as occurrence_date
    from generate_series(p_start_date,p_end_date,interval '1 day') d
  ), year_dates as (
    select d.occurrence_date,sy.id as school_year_id
    from dates d
    join public.school_years sy on sy.school_id=v_school_id
      and sy.teaching_start is not null
      and sy.teaching_end is not null
      and d.occurrence_date between sy.teaching_start and sy.teaching_end
    where not exists(
      select 1 from public.school_year_calendar_events ce
      where ce.school_year_id=sy.id
        and ce.closes_school=true
        and d.occurrence_date between ce.starts_on and ce.ends_on
    )
  ), selected_versions as (
    select yd.occurrence_date,
      (
        select sv.id
        from public.school_schedule_versions sv
        where sv.school_year_id=yd.school_year_id
          and (
            (
              sv.status in ('published','archived')
              and coalesce(sv.effective_from,yd.occurrence_date)<=yd.occurrence_date
              and (sv.effective_to is null or sv.effective_to>=yd.occurrence_date)
            )
            or (
              sv.status='draft'
              and not private.school_year_has_live_schedule(yd.school_year_id)
            )
          )
        order by case sv.status when 'published' then 0 when 'archived' then 1 else 2 end,
                 coalesce(sv.effective_from,'0001-01-01'::date) desc,
                 sv.created_at desc
        limit 1
      ) as schedule_version_id
    from year_dates yd
  )
  select p_student_id,
         svd.occurrence_date,
         se.id,
         se.schedule_version_id,
         se.class_id,
         se.weekday,
         se.start_time,
         se.end_time,
         se.subject,
         se.room,
         se.entry_kind,
         coalesce(se.recurrence_pattern,'weekly')
  from selected_versions svd
  join public.schedule_entries se on se.schedule_version_id=svd.schedule_version_id
    and se.class_id=v_class_id
    and se.entry_kind in ('lesson','assembly','break')
  where se.weekday=extract(dow from svd.occurrence_date)::integer
    and (
      coalesce(se.recurrence_pattern,'weekly')='weekly'
      or (se.recurrence_pattern='odd' and mod(extract(week from svd.occurrence_date)::integer,2)=1)
      or (se.recurrence_pattern='even' and mod(extract(week from svd.occurrence_date)::integer,2)=0)
    )
  order by svd.occurrence_date,se.start_time,se.id;
end;
$$;

revoke all on function public.parent_schedule_occurrences(bigint,date,date) from public,anon;
grant execute on function public.parent_schedule_occurrences(bigint,date,date) to authenticated;
