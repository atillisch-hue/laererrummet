create or replace function private.school_year_has_live_schedule(p_school_year_id bigint)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.school_schedule_versions sv
    where sv.school_year_id=p_school_year_id
      and sv.status in ('published','archived')
  );
$$;
revoke all on function private.school_year_has_live_schedule(bigint) from public,anon;
grant execute on function private.school_year_has_live_schedule(bigint) to authenticated;

drop policy if exists school_schedule_versions_read on public.school_schedule_versions;
create policy school_schedule_versions_read on public.school_schedule_versions
for select to authenticated
using (
  exists(
    select 1 from public.school_years sy
    where sy.id=school_year_id
      and (
        public.has_school_role(sy.school_id,'admin')
        or public.has_school_role(sy.school_id,'leader')
        or (
          public.is_school_staff(sy.school_id)
          and (
            status in ('published','archived')
            or (
              status='draft'
              and not private.school_year_has_live_schedule(school_year_id)
            )
          )
        )
      )
  )
);

create or replace function public.staff_schedule_occurrences(
  p_user_ids uuid[],
  p_start_date date,
  p_end_date date
)
returns table(
  user_id uuid,
  occurrence_date date,
  schedule_entry_id bigint,
  schedule_version_id bigint,
  school_id bigint,
  class_id bigint,
  weekday integer,
  start_time time without time zone,
  end_time time without time zone,
  subject text,
  room text,
  class_subject_id bigint,
  entry_kind text,
  recurrence_pattern text
)
language plpgsql
stable
security invoker
set search_path=''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_start_date is null or p_end_date is null or p_end_date<p_start_date then raise exception 'Invalid date range'; end if;
  if p_end_date-p_start_date>31 then raise exception 'Date range too large'; end if;
  if coalesce(array_length(p_user_ids,1),0)=0 then return; end if;
  if coalesce(array_length(p_user_ids,1),0)>100 then raise exception 'Too many users'; end if;

  return query
  with dates as (
    select d::date as occurrence_date
    from generate_series(p_start_date,p_end_date,interval '1 day') d
  ), year_dates as (
    select d.occurrence_date,sy.id as school_year_id,sy.school_id
    from dates d
    join public.school_years sy
      on d.occurrence_date between sy.period_start and sy.period_end
  ), selected_versions as (
    select yd.occurrence_date,yd.school_id,yd.school_year_id,
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
        order by
          case sv.status when 'published' then 0 when 'archived' then 1 else 2 end,
          coalesce(sv.effective_from,'0001-01-01'::date) desc,
          sv.created_at desc
        limit 1
      ) as schedule_version_id
    from year_dates yd
  )
  select st.teacher_id,
         svd.occurrence_date,
         se.id,
         se.schedule_version_id,
         c.school_id,
         se.class_id,
         se.weekday,
         se.start_time,
         se.end_time,
         se.subject,
         se.room,
         se.class_subject_id,
         se.entry_kind,
         coalesce(se.recurrence_pattern,'weekly')
  from selected_versions svd
  join public.schedule_entries se on se.schedule_version_id=svd.schedule_version_id
  join public.classes c on c.id=se.class_id and c.school_id=svd.school_id
  join public.schedule_teachers st on st.schedule_entry_id=se.id
  where st.teacher_id=any(p_user_ids)
    and se.weekday=extract(dow from svd.occurrence_date)::integer
    and (
      coalesce(se.recurrence_pattern,'weekly')='weekly'
      or (se.recurrence_pattern='odd' and mod(extract(week from svd.occurrence_date)::integer,2)=1)
      or (se.recurrence_pattern='even' and mod(extract(week from svd.occurrence_date)::integer,2)=0)
    )
  order by st.teacher_id,svd.occurrence_date,se.start_time,se.id;
end;
$$;

revoke all on function public.staff_schedule_occurrences(uuid[],date,date) from public,anon;
grant execute on function public.staff_schedule_occurrences(uuid[],date,date) to authenticated;
