create index if not exists idx_work_time_entries_created_by on public.work_time_entries(created_by);

alter policy staff_work_profiles_read on public.staff_work_profiles
using ((user_id=(select auth.uid()) and public.is_school_member(school_id)) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'));

alter policy work_time_entries_read on public.work_time_entries
using ((user_id=(select auth.uid()) and public.is_school_member(school_id)) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'));

alter policy work_time_entries_insert on public.work_time_entries
with check (public.is_school_member(school_id) and ((user_id=(select auth.uid()) and created_by=(select auth.uid())) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader')));

alter policy work_time_entries_update on public.work_time_entries
using ((user_id=(select auth.uid()) and public.is_school_member(school_id)) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'))
with check (public.is_school_member(school_id) and (user_id=(select auth.uid()) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader')));

alter policy work_time_entries_delete on public.work_time_entries
using ((user_id=(select auth.uid()) and public.is_school_member(school_id)) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'));
