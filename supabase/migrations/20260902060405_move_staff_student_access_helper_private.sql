grant usage on schema private to authenticated;

alter function public.staff_can_access_student(bigint) set schema private;
revoke execute on function private.staff_can_access_student(bigint) from public, anon;
grant execute on function private.staff_can_access_student(bigint) to authenticated, service_role;

create or replace function public.get_internal_student_directory()
returns table(id bigint, name text, class_id bigint)
language sql
stable
security definer
set search_path = public, private
as $$
  select s.id,s.name,s.class_id
  from public.students s
  where private.staff_can_access_student(s.id)
  order by s.name;
$$;

revoke execute on function public.get_internal_student_directory() from public, anon;
grant execute on function public.get_internal_student_directory() to authenticated, service_role;
