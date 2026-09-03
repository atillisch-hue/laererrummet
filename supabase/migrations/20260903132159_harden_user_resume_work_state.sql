drop policy if exists "Users manage own resume state" on public.user_resume_work_state;

create policy "Staff manage own resume state"
on public.user_resume_work_state
for all
to authenticated
using (user_id = (select auth.uid()) and public.is_school_staff(school_id))
with check (user_id = (select auth.uid()) and public.is_school_staff(school_id));

revoke all privileges on table public.user_resume_work_state from authenticated;
grant select, insert, update, delete on table public.user_resume_work_state to authenticated;
revoke all privileges on table public.user_resume_work_state from anon;
