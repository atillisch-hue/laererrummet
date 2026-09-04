create or replace function public.school_year_staff_resource_impact(
  p_school_year_id bigint,
  p_schedule_version_id bigint default null
)
returns table(
  user_id uuid,
  annual_target_minutes integer,
  employment_percent numeric,
  teaching_minutes bigint,
  scheduled_other_minutes bigint,
  allocation_minutes bigint,
  planned_minutes bigint,
  remaining_minutes bigint,
  utilization_percent numeric,
  resource_status text
)
language plpgsql
stable
security invoker
set search_path=''
as $$
declare
  v_school_id bigint;
  v_teaching_start date;
  v_teaching_end date;
  v_version_id bigint;
begin
  select sy.school_id,sy.teaching_start,sy.teaching_end
  into v_school_id,v_teaching_start,v_teaching_end
  from public.school_years sy
  where sy.id=p_school_year_id;

  if v_school_id is null then raise exception 'School year not found'; end if;
  if v_teaching_start is null or v_teaching_end is null then raise exception 'Teaching period is not configured'; end if;
  if not (public.has_school_role(v_school_id,'admin') or public.has_school_role(v_school_id,'leader')) then
    raise exception 'Leadership access required';
  end if;

  if p_schedule_version_id is not null then
    select sv.id into v_version_id
    from public.school_schedule_versions sv
    where sv.id=p_schedule_version_id and sv.school_year_id=p_school_year_id;
  else
    select sv.id into v_version_id
    from public.school_schedule_versions sv
    where sv.school_year_id=p_school_year_id
    order by case sv.status when 'draft' then 0 when 'published' then 1 else 2 end,sv.created_at desc
    limit 1;
  end if;
  if v_version_id is null then raise exception 'Schedule version not found'; end if;

  return query
  with school_dates as (
    select d::date as work_date
    from generate_series(v_teaching_start,v_teaching_end,interval '1 day') d
    where not exists (
      select 1
      from public.school_year_calendar_events e
      where e.school_year_id=p_school_year_id
        and e.closes_school=true
        and d::date between e.starts_on and e.ends_on
    )
  ), scheduled_occurrences as (
    select st.teacher_id,
           se.entry_kind,
           (extract(epoch from (se.end_time-se.start_time))/60)::bigint as duration_minutes
    from public.schedule_entries se
    join public.classes c on c.id=se.class_id and c.school_id=v_school_id
    join public.schedule_teachers st on st.schedule_entry_id=se.id
    join school_dates sd on extract(dow from sd.work_date)::integer=se.weekday
      and (
        coalesce(se.recurrence_pattern,'weekly')='weekly'
        or (se.recurrence_pattern='odd' and mod(extract(week from sd.work_date)::integer,2)=1)
        or (se.recurrence_pattern='even' and mod(extract(week from sd.work_date)::integer,2)=0)
      )
    where se.schedule_version_id=v_version_id
      and se.entry_kind in ('lesson','assembly','duty','other')
  ), scheduled_by_staff as (
    select so.teacher_id,
           coalesce(sum(so.duration_minutes) filter(where so.entry_kind='lesson'),0)::bigint as teaching_minutes,
           coalesce(sum(so.duration_minutes) filter(where so.entry_kind<>'lesson'),0)::bigint as scheduled_other_minutes
    from scheduled_occurrences so
    group by so.teacher_id
  ), allocations as (
    select a.user_id,coalesce(sum(a.planned_minutes),0)::bigint as allocation_minutes
    from public.staff_year_allocations a
    where a.school_year_id=p_school_year_id and a.active=true
    group by a.user_id
  )
  select swp.user_id,
         swp.annual_target_minutes,
         swp.employment_percent,
         coalesce(sbs.teaching_minutes,0)::bigint,
         coalesce(sbs.scheduled_other_minutes,0)::bigint,
         coalesce(a.allocation_minutes,0)::bigint,
         (coalesce(sbs.teaching_minutes,0)+coalesce(sbs.scheduled_other_minutes,0)+coalesce(a.allocation_minutes,0))::bigint as planned_minutes,
         (swp.annual_target_minutes-(coalesce(sbs.teaching_minutes,0)+coalesce(sbs.scheduled_other_minutes,0)+coalesce(a.allocation_minutes,0)))::bigint as remaining_minutes,
         case when swp.annual_target_minutes>0 then round(
           100.0*(coalesce(sbs.teaching_minutes,0)+coalesce(sbs.scheduled_other_minutes,0)+coalesce(a.allocation_minutes,0))/swp.annual_target_minutes,
           1
         ) else null end::numeric as utilization_percent,
         case
           when (coalesce(sbs.teaching_minutes,0)+coalesce(sbs.scheduled_other_minutes,0)+coalesce(a.allocation_minutes,0))>swp.annual_target_minutes then 'overbooked'
           when (coalesce(sbs.teaching_minutes,0)+coalesce(sbs.scheduled_other_minutes,0)+coalesce(a.allocation_minutes,0))=swp.annual_target_minutes then 'fully_allocated'
           else 'unallocated'
         end::text as resource_status
  from public.staff_work_profiles swp
  left join scheduled_by_staff sbs on sbs.teacher_id=swp.user_id
  left join allocations a on a.user_id=swp.user_id
  where swp.school_year_id=p_school_year_id
    and swp.school_id=v_school_id
  order by swp.user_id;
end;
$$;

revoke all on function public.school_year_staff_resource_impact(bigint,bigint) from public,anon;
grant execute on function public.school_year_staff_resource_impact(bigint,bigint) to authenticated;

create or replace function public.school_year_staff_schedule_health(
  p_school_year_id bigint,
  p_schedule_version_id bigint default null
)
returns table(
  schedule_version_id bigint,
  staff_relevant_entries integer,
  assigned_entries integer,
  unassigned_entries integer
)
language plpgsql
stable
security invoker
set search_path=''
as $$
declare
  v_school_id bigint;
  v_version_id bigint;
begin
  select sy.school_id into v_school_id from public.school_years sy where sy.id=p_school_year_id;
  if v_school_id is null then raise exception 'School year not found'; end if;
  if not (public.has_school_role(v_school_id,'admin') or public.has_school_role(v_school_id,'leader')) then
    raise exception 'Leadership access required';
  end if;

  if p_schedule_version_id is not null then
    select sv.id into v_version_id from public.school_schedule_versions sv
    where sv.id=p_schedule_version_id and sv.school_year_id=p_school_year_id;
  else
    select sv.id into v_version_id from public.school_schedule_versions sv
    where sv.school_year_id=p_school_year_id
    order by case sv.status when 'draft' then 0 when 'published' then 1 else 2 end,sv.created_at desc
    limit 1;
  end if;
  if v_version_id is null then raise exception 'Schedule version not found'; end if;

  return query
  with entries as (
    select se.id,
           exists(select 1 from public.schedule_teachers st where st.schedule_entry_id=se.id) as has_teacher
    from public.schedule_entries se
    join public.classes c on c.id=se.class_id and c.school_id=v_school_id
    where se.schedule_version_id=v_version_id
      and se.entry_kind in ('lesson','assembly','duty','other')
  )
  select v_version_id,
         count(*)::integer,
         count(*) filter(where has_teacher)::integer,
         count(*) filter(where not has_teacher)::integer
  from entries;
end;
$$;

revoke all on function public.school_year_staff_schedule_health(bigint,bigint) from public,anon;
grant execute on function public.school_year_staff_schedule_health(bigint,bigint) to authenticated;
