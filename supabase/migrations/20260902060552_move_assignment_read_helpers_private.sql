alter function public.parent_can_read_assignment(bigint) set schema private;
alter function public.student_can_read_assignment(bigint) set schema private;

revoke execute on function private.parent_can_read_assignment(bigint) from public, anon;
revoke execute on function private.student_can_read_assignment(bigint) from public, anon;
grant execute on function private.parent_can_read_assignment(bigint) to authenticated, service_role;
grant execute on function private.student_can_read_assignment(bigint) to authenticated, service_role;
