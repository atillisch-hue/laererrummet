alter table public.lesson_instances
  add column if not exists subject_unit_id bigint null references public.subject_units(id) on delete set null;

create index if not exists lesson_instances_subject_unit_idx
  on public.lesson_instances(subject_unit_id)
  where subject_unit_id is not null;

create or replace function private.validate_lesson_subject_unit()
returns trigger
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_schedule_room bigint;
  v_unit_room bigint;
begin
  if new.subject_unit_id is null then
    return new;
  end if;

  select se.class_subject_id into v_schedule_room
  from public.schedule_entries se
  where se.id=new.schedule_entry_id;

  if v_schedule_room is null then
    raise exception 'Lesson subject unit requires a schedule entry linked to a subject room';
  end if;

  select u.class_subject_id into v_unit_room
  from public.subject_units u
  where u.id=new.subject_unit_id;

  if v_unit_room is null then
    raise exception 'Subject unit does not exist';
  end if;

  if v_unit_room<>v_schedule_room then
    raise exception 'Lesson subject unit must belong to the same subject room';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_lesson_subject_unit() from public,anon,authenticated;

drop trigger if exists lesson_instances_validate_subject_unit on public.lesson_instances;
create trigger lesson_instances_validate_subject_unit
before insert or update of schedule_entry_id,subject_unit_id on public.lesson_instances
for each row execute function private.validate_lesson_subject_unit();
