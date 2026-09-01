create or replace function public.admin_user_directory_for_school(p_school_id bigint)
returns table(id uuid,email text,roles jsonb,active boolean)
language plpgsql
stable
security definer
set search_path='public'
as $$
begin
  if not public.has_school_role(p_school_id,'admin') then
    raise exception 'Admin access required';
  end if;

  return query
  select
    u.id,
    u.email::text,
    coalesce(jsonb_agg(distinct sm.role),'[]'::jsonb) as roles,
    bool_or(sm.active) as active
  from auth.users u
  join public.school_memberships sm on sm.user_id=u.id
  where sm.school_id=p_school_id
  group by u.id,u.email
  order by u.email;
end;
$$;

revoke all on function public.admin_user_directory_for_school(bigint) from public,anon;
grant execute on function public.admin_user_directory_for_school(bigint) to authenticated,service_role;
