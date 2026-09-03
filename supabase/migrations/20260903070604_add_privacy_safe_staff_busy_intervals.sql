create or replace function public.staff_busy_intervals(
  p_user_ids uuid[],
  p_start timestamptz,
  p_end timestamptz
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
set search_path=public,private
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_start is null or p_end is null or p_end <= p_start then
    raise exception 'Invalid interval';
  end if;
  if p_end - p_start > interval '31 days' then
    raise exception 'Interval too large';
  end if;
  if coalesce(array_length(p_user_ids,1),0) > 100 then
    raise exception 'Too many users';
  end if;

  return query
  with caller_schools as (
    select sm.school_id
    from public.school_memberships sm
    where sm.user_id=auth.uid()
      and sm.active=true
      and sm.role in ('teacher','admin','leader')
  ),
  allowed_users as (
    select distinct sm.user_id
    from public.school_memberships sm
    join caller_schools cs on cs.school_id=sm.school_id
    where sm.active=true
      and sm.role in ('teacher','admin','leader')
      and sm.user_id=any(coalesce(p_user_ids,array[]::uuid[]))
  ),
  meeting_rows as (
    select distinct
      au.user_id,
      cm.starts_at,
      coalesce(cm.ends_at,cm.starts_at+interval '1 hour') as ends_at,
      'meeting'::text as busy_type
    from allowed_users au
    join public.meeting_participants mp on mp.user_id=au.user_id
    join public.calendar_meetings cm on cm.id=mp.meeting_id
    join caller_schools cs on cs.school_id=cm.school_id
    where cm.status <> 'cancelled'
      and cm.starts_at < p_end
      and coalesce(cm.ends_at,cm.starts_at+interval '1 hour') > p_start

    union

    select distinct
      au.user_id,
      cm.starts_at,
      coalesce(cm.ends_at,cm.starts_at+interval '1 hour') as ends_at,
      'meeting'::text
    from allowed_users au
    join public.calendar_meetings cm on cm.created_by=au.user_id
    join caller_schools cs on cs.school_id=cm.school_id
    where cm.status <> 'cancelled'
      and cm.starts_at < p_end
      and coalesce(cm.ends_at,cm.starts_at+interval '1 hour') > p_start
  ),
  absence_rows as (
    select distinct
      au.user_id,
      (sa.absence_date::timestamp at time zone 'Europe/Copenhagen') as starts_at,
      ((sa.absence_date+1)::timestamp at time zone 'Europe/Copenhagen') as ends_at,
      'absence'::text as busy_type
    from allowed_users au
    join public.staff_absence sa on sa.user_id=au.user_id
    join caller_schools cs on cs.school_id=sa.school_id
    where sa.absence_date between
      (p_start at time zone 'Europe/Copenhagen')::date
      and ((p_end-interval '1 second') at time zone 'Europe/Copenhagen')::date
  )
  select * from meeting_rows
  union all
  select * from absence_rows
  order by user_id,starts_at;
end;
$$;

revoke all on function public.staff_busy_intervals(uuid[],timestamptz,timestamptz) from public,anon;
grant execute on function public.staff_busy_intervals(uuid[],timestamptz,timestamptz) to authenticated,service_role;
