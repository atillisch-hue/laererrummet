-- Klasseværelset: admin-katalog til lærere, forældre og familiekoblinger
-- Kør denne fil én gang i Supabase SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role','') = 'admin'
    or coalesce(auth.jwt() -> 'user_metadata' -> 'roles','[]'::jsonb) ? 'admin';
$$;

create or replace function public.admin_user_directory()
returns table(id uuid,email text,roles jsonb)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query
  select
    u.id,
    u.email,
    case
      -- Some existing accounts use the older singular `role` field.
      -- Prefer an explicitly populated `roles` array, otherwise fall back to `role`.
      when jsonb_typeof(u.raw_user_meta_data->'roles') = 'array'
           and jsonb_array_length(u.raw_user_meta_data->'roles') > 0
        then u.raw_user_meta_data->'roles'
      when nullif(u.raw_user_meta_data->>'role','') is not null
        then jsonb_build_array(u.raw_user_meta_data->>'role')
      else '[]'::jsonb
    end as roles
  from auth.users u
  order by u.email;
end;
$$;

create or replace function public.admin_parent_links()
returns table(parent_id uuid,student_id bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  return query select ps.parent_id,ps.student_id from public.parent_students ps;
end;
$$;

create or replace function public.admin_link_parent(p_parent_id uuid,p_student_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  insert into public.parent_students(parent_id,student_id) values(p_parent_id,p_student_id) on conflict do nothing;
end;
$$;

create or replace function public.admin_unlink_parent(p_parent_id uuid,p_student_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Admin access required'; end if;
  delete from public.parent_students where parent_id=p_parent_id and student_id=p_student_id;
end;
$$;

grant execute on function public.admin_user_directory() to authenticated;
grant execute on function public.admin_parent_links() to authenticated;
grant execute on function public.admin_link_parent(uuid,bigint) to authenticated;
grant execute on function public.admin_unlink_parent(uuid,bigint) to authenticated;
