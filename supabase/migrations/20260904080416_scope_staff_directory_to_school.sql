create or replace function public.admin_staff_directory_for_school_v2(p_school_id bigint)
returns table(
  user_id uuid,
  display_name text,
  abbreviation text,
  personnel_group text,
  roles text[],
  active boolean
)
language sql
stable
security definer
set search_path=''
as $$
  with staff_users as (
    select
      sm.user_id,
      bool_or(sm.active) as any_active,
      array_agg(distinct sm.role order by sm.role) as roles
    from public.school_memberships sm
    where sm.school_id=p_school_id
      and exists (
        select 1
        from public.school_memberships me
        where me.school_id=p_school_id
          and me.user_id=(select auth.uid())
          and me.role='admin'
          and me.active=true
      )
    group by sm.user_id
    having bool_or(sm.role in ('teacher','staff','admin','leader'))
  )
  select
    su.user_id,
    up.display_name,
    sdp.abbreviation,
    coalesce(sdp.personnel_group,'teacher') as personnel_group,
    su.roles,
    (coalesce(up.active,true) and su.any_active) as active
  from staff_users su
  join public.user_profiles up on up.user_id=su.user_id
  left join public.staff_directory_profiles sdp
    on sdp.school_id=p_school_id and sdp.user_id=su.user_id
  order by (coalesce(up.active,true) and su.any_active) desc,
           sdp.abbreviation nulls last,
           up.display_name;
$$;

revoke all on function public.admin_staff_directory_for_school_v2(bigint) from public,anon;
grant execute on function public.admin_staff_directory_for_school_v2(bigint) to authenticated,service_role;
