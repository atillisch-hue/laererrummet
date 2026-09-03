alter table public.user_resume_work_state add column if not exists next_step text null;

create or replace function private.reset_resume_next_step_on_object_change()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  if new.object_type is distinct from old.object_type or new.object_key is distinct from old.object_key then
    new.next_step := null;
  end if;
  return new;
end;
$$;

revoke all on function private.reset_resume_next_step_on_object_change() from public, anon, authenticated;

drop trigger if exists reset_resume_next_step_on_object_change on public.user_resume_work_state;
create trigger reset_resume_next_step_on_object_change
before update on public.user_resume_work_state
for each row execute function private.reset_resume_next_step_on_object_change();
