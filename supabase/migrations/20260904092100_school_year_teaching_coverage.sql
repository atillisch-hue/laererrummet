create or replace function public.school_year_teaching_coverage(
  p_school_year_id bigint,
  p_schedule_version_id bigint default null
)
returns table(
  class_subject_id bigint,
  class_id bigint,
  class_name text,
  subject_title text,
  required_weekly_minutes integer,
  scheduled_average_weekly_minutes numeric,
  difference_minutes numeric,
  coverage_status text
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
  select sy.school_id into v_school_id
  from public.school_years sy
  where sy.id=p_school_year_id;

  if v_school_id is null then raise exception 'School year not found'; end if;
  if not (public.has_school_role(v_school_id,'admin') or public.has_school_role(v_school_id,'leader')) then
    raise exception 'Leadership access required';
  end if;

  if p_schedule_version_id is not null then
    select sv.id into v_version_id
    from public.school_schedule_versions sv
    where sv.id=p_schedule_version_id and sv.school_year_id=p_school_year_id;
    if v_version_id is null then raise exception 'Schedule version does not belong to school year'; end if;
  else
    select sv.id into v_version_id
    from public.school_schedule_versions sv
    where sv.school_year_id=p_school_year_id
    order by case sv.status when 'draft' then 0 when 'published' then 1 else 2 end,sv.created_at desc
    limit 1;
  end if;

  return query
  with resolved_schedule as (
    select se.id,
      coalesce(se.class_subject_id,(
        select cs2.id from public.class_subjects cs2
        where cs2.class_id=se.class_id and cs2.active=true
          and lower(trim(cs2.title))=lower(trim(se.subject))
        order by cs2.id limit 1
      )) as resolved_subject_id,
      (extract(epoch from (se.end_time-se.start_time))/60.0)
        * case coalesce(se.recurrence_pattern,'weekly') when 'odd' then 0.5 when 'even' then 0.5 else 1.0 end
        as average_weekly_minutes
    from public.schedule_entries se
    where se.schedule_version_id=v_version_id and se.entry_kind='lesson'
  ), scheduled as (
    select rs.resolved_subject_id,sum(rs.average_weekly_minutes)::numeric as scheduled_minutes
    from resolved_schedule rs
    where rs.resolved_subject_id is not null
    group by rs.resolved_subject_id
  )
  select tr.class_subject_id,cs.class_id,c.name::text,cs.title::text,tr.weekly_minutes,
    coalesce(s.scheduled_minutes,0)::numeric,
    (coalesce(s.scheduled_minutes,0)-tr.weekly_minutes)::numeric,
    case when coalesce(s.scheduled_minutes,0)<tr.weekly_minutes then 'missing'
         when coalesce(s.scheduled_minutes,0)>tr.weekly_minutes then 'over'
         else 'covered' end::text
  from public.teaching_requirements tr
  join public.class_subjects cs on cs.id=tr.class_subject_id
  join public.classes c on c.id=cs.class_id
  left join scheduled s on s.resolved_subject_id=tr.class_subject_id
  where tr.school_year_id=p_school_year_id and c.school_id=v_school_id
  order by c.name,cs.title;
end;
$$;
revoke all on function public.school_year_teaching_coverage(bigint,bigint) from public,anon;
grant execute on function public.school_year_teaching_coverage(bigint,bigint) to authenticated;

create or replace function public.school_year_schedule_match_health(
  p_school_year_id bigint,
  p_schedule_version_id bigint default null
)
returns table(
  schedule_version_id bigint,
  lesson_entries integer,
  explicit_subject_links integer,
  fallback_title_matches integer,
  unresolved_lessons integer
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
  with x as (
    select se.id,se.class_subject_id is not null as explicit_link,
      case when se.class_subject_id is null then (
        select cs.id from public.class_subjects cs
        where cs.class_id=se.class_id and cs.active=true
          and lower(trim(cs.title))=lower(trim(se.subject))
        order by cs.id limit 1
      ) end as fallback_id
    from public.schedule_entries se
    join public.classes c on c.id=se.class_id and c.school_id=v_school_id
    where se.schedule_version_id=v_version_id and se.entry_kind='lesson'
  )
  select v_version_id,count(*)::integer,
    count(*) filter(where explicit_link)::integer,
    count(*) filter(where not explicit_link and fallback_id is not null)::integer,
    count(*) filter(where not explicit_link and fallback_id is null)::integer
  from x;
end;
$$;
revoke all on function public.school_year_schedule_match_health(bigint,bigint) from public,anon;
grant execute on function public.school_year_schedule_match_health(bigint,bigint) to authenticated;
