-- Trigger/helper functions should not be directly callable through the API.
revoke execute on function public.resolve_single_active_school(uuid,text[]) from public,anon,authenticated;
revoke execute on function public.set_calendar_meeting_school() from public,anon,authenticated;
revoke execute on function public.set_noticeboard_post_school() from public,anon,authenticated;
revoke execute on function public.set_staff_absence_school() from public,anon,authenticated;
revoke execute on function public.set_school_room_school() from public,anon,authenticated;
revoke execute on function public.set_resource_booking_school() from public,anon,authenticated;
revoke execute on function public.create_user_profile() from public,anon,authenticated;
revoke execute on function public.set_meeting_updated_at() from public,anon,authenticated;
revoke execute on function public.set_resource_booking_updated_at() from public,anon,authenticated;
revoke execute on function public.set_action_plan_updated_at() from public,anon,authenticated;
revoke execute on function public.set_user_profile_updated_at() from public,anon,authenticated;
