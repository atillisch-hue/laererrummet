alter table public.assignments
add column if not exists class_subject_id bigint null references public.class_subjects(id) on delete set null;

create index if not exists idx_assignments_class_subject_id on public.assignments(class_subject_id);

create or replace function private.validate_assignment_subject_room()
returns trigger
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_room_class bigint;
begin
  if new.class_subject_id is null then
    return new;
  end if;

  select cs.class_id into v_room_class
  from public.class_subjects cs
  where cs.id=new.class_subject_id and cs.active=true;

  if v_room_class is null or v_room_class<>new.class_id then
    raise exception 'Assignment subject room must belong to the assignment class';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_assignment_subject_room() from public,anon,authenticated;

drop trigger if exists assignments_validate_subject_room on public.assignments;
create trigger assignments_validate_subject_room
before insert or update of class_id,class_subject_id on public.assignments
for each row execute function private.validate_assignment_subject_room();
