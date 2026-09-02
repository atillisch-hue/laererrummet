revoke execute on function public.is_admin() from public, anon, authenticated;
revoke execute on function public.is_guardian_meeting_participant(bigint) from public, anon, authenticated;
revoke execute on function public.is_internal_platform_user() from public, anon, authenticated;
revoke execute on function public.is_platform_admin() from public, anon, authenticated;

grant execute on function public.is_admin() to service_role;
grant execute on function public.is_guardian_meeting_participant(bigint) to service_role;
grant execute on function public.is_internal_platform_user() to service_role;
grant execute on function public.is_platform_admin() to service_role;
