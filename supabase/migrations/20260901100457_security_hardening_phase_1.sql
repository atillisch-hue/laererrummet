-- Security hardening applied to the Klassevaerelset Supabase project on 2026-09-01.
-- This file documents the production migration. School memberships are the
-- authoritative authorization source; user_metadata must never grant access.

create or replace function public.current_user_has_role(p_role text)
returns boolean language sql stable security definer set search_path='public' as $$
  select exists(select 1 from public.school_memberships sm where sm.user_id=auth.uid() and sm.role=p_role and sm.active=true);
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path='public' as $$
  select public.current_user_has_role('admin');
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path='public' as $$
  select public.current_user_has_role('admin');
$$;

create or replace function public.is_internal_platform_user()
returns boolean language sql stable security definer set search_path='public' as $$
  select exists(select 1 from public.school_memberships sm where sm.user_id=auth.uid() and sm.role in ('teacher','admin') and sm.active=true);
$$;

-- Profile rows are presentation data, not authorization data.
drop policy if exists "users_manage_own_profile" on public.user_profiles;
drop policy if exists "users can update own profile" on public.user_profiles;
create policy "users can update own profile" on public.user_profiles for update to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
revoke insert,delete,update,truncate on public.user_profiles from anon,authenticated;
grant select on public.user_profiles to authenticated;
grant update(display_name,initials) on public.user_profiles to authenticated;

-- Internal RPCs are closed to anonymous callers by default. The only anonymous
-- functions left are the intentionally access-code-based student flows.
revoke execute on all functions in schema public from public,anon;
grant execute on all functions in schema public to authenticated,service_role;
revoke execute on function public.create_user_profile() from authenticated;
revoke execute on function public.set_meeting_updated_at() from authenticated;
revoke execute on function public.set_resource_booking_updated_at() from authenticated;
revoke execute on function public.set_action_plan_updated_at() from authenticated;
revoke execute on function public.set_user_profile_updated_at() from authenticated;
grant execute on function public.student_login(text) to anon;
grant execute on function public.student_data(text) to anon;
grant execute on function public.student_feedback(text) to anon;
grant execute on function public.student_grammar_assignments(text) to anon;
grant execute on function public.get_student_training_progress(text) to anon;
grant execute on function public.save_student_grammar_attempt(text,bigint,jsonb,integer,integer) to anon;
grant execute on function public.save_student_training_attempt(text,text,text,text,text,jsonb,integer,integer) to anon;
alter default privileges in schema public revoke execute on functions from public;

-- NOTE: Production also contains the full rewritten/school-scoped definitions
-- for admin_user_directory, parent_portal_data, teacher_grammar_results,
-- get_student_guardians, admin_parent_links, admin_link_parent and
-- admin_unlink_parent, plus scoped class_handover, grammar recipient and
-- noticeboard policies. These should be consolidated into a complete baseline
-- migration as part of the database-reproducibility task before pilot use.
