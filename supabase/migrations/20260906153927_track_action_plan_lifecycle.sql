alter table public.student_action_plans add column closed_at timestamptz;

create or replace function private.sync_student_action_plan_closed_at()
returns trigger
language plpgsql
set search_path=''
as $function$
begin
  if new.status='active' then
    new.closed_at := null;
  elsif old.status='active' and new.status in ('completed','archived') then
    new.closed_at := coalesce(new.closed_at,now());
  elsif new.status in ('completed','archived') then
    new.closed_at := coalesce(new.closed_at,old.closed_at,now());
  end if;
  return new;
end;
$function$;

revoke all on function private.sync_student_action_plan_closed_at() from public, anon, authenticated;

drop trigger if exists student_action_plans_sync_closed_at on public.student_action_plans;
create trigger student_action_plans_sync_closed_at
before update of status on public.student_action_plans
for each row execute function private.sync_student_action_plan_closed_at();
