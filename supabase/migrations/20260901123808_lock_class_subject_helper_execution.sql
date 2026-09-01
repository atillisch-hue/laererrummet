revoke execute on function public.can_edit_class_subject(bigint) from public, anon;
grant execute on function public.can_edit_class_subject(bigint) to authenticated, service_role;
