revoke execute on function public.current_user_has_role(text) from public, anon, authenticated;
revoke execute on function public.parent_can_access_student(bigint) from public, anon, authenticated;

grant execute on function public.current_user_has_role(text) to service_role;
grant execute on function public.parent_can_access_student(bigint) to service_role;
