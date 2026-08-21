-- Ensure the admin user directory exposes every role, including board.
-- This keeps multi-role users visible as e.g. Parent + Board member.

create or replace function public.admin_user_directory()
returns table (
  user_id uuid,
  email text,
  roles text[]
)
language sql
security definer
set search_path = public, auth
as $$
  select
    u.id as user_id,
    u.email::text as email,
    coalesce(
      array_agg(distinct ur.role::text order by ur.role::text)
        filter (where ur.role is not null),
      array[]::text[]
    ) as roles
  from auth.users u
  left join public.user_roles ur on ur.user_id = u.id
  group by u.id, u.email
  order by u.email;
$$;

grant execute on function public.admin_user_directory() to authenticated;
