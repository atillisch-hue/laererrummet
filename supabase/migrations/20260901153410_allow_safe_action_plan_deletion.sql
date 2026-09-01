create policy "relevant staff delete unused active plan actions"
on public.student_plan_actions
for delete
to authenticated
using (
  status='active'
  and not exists (
    select 1 from public.student_plan_followups f
    where f.action_id=student_plan_actions.id
  )
  and exists (
    select 1 from public.student_action_plans p
    where p.id=student_plan_actions.plan_id
      and public.staff_can_access_student(p.student_id)
  )
);
