-- Inactive staff should lose access but remain visible in administration.

create or replace function public.admin_staff_directory()
returns table(user_id uuid,display_name text,role text,active boolean)
language sql stable security definer set search_path='public' as $$
  with visible as (
    select target.user_id,target.role,target.school_id,target.active as membership_active
    from public.school_memberships target
    where target.role in ('teacher','admin','board','parent')
      and exists(select 1 from public.school_memberships me where me.user_id=auth.uid() and me.school_id=target.school_id and me.active=true and me.role='admin')
  )
  select up.user_id,up.display_name,
    case when bool_or(v.role='admin') then 'admin' when bool_or(v.role='teacher') then 'teacher' when bool_or(v.role='board') then 'board' else 'parent' end,
    (up.active and bool_or(v.membership_active)) as active
  from public.user_profiles up join visible v on v.user_id=up.user_id
  group by up.user_id,up.display_name,up.active
  order by (up.active and bool_or(v.membership_active)) desc,up.display_name;
$$;

create or replace function public.admin_staff_roles()
returns table(user_id uuid,roles text[])
language sql stable security definer set search_path='public' as $$
  select target.user_id,array_agg(distinct target.role order by target.role)
  from public.school_memberships target
  where exists(select 1 from public.school_memberships me where me.user_id=auth.uid() and me.school_id=target.school_id and me.active=true and me.role='admin')
  group by target.user_id;
$$;
