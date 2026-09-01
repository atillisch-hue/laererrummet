create or replace function private.validate_assignment_subject_room()
returns trigger
language plpgsql
security definer
set search_path='public','private'
as $$
declare v_room_class bigint;
begin
  if new.class_subject_id is null then return new; end if;

  select cs.class_id into v_room_class
  from public.class_subjects cs
  where cs.id=new.class_subject_id and cs.active=true;

  if v_room_class is null or v_room_class<>new.class_id then
    raise exception 'Assignment subject room must belong to the assignment class';
  end if;

  if not public.can_edit_class_subject(new.class_subject_id) then
    raise exception 'You cannot link an assignment to a subject room you cannot edit';
  end if;

  return new;
end;
$$;

revoke all on function private.validate_assignment_subject_room() from public,anon,authenticated;
