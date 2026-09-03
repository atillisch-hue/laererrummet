alter table public.assignments drop constraint if exists assignments_assignment_kind_check;
alter table public.assignments add constraint assignments_assignment_kind_check
  check (assignment_kind in ('danish_writing','danish_analysis','danish_communication','math_task','generic'));

create or replace function private.enforce_assignment_subject_context()
returns trigger
language plpgsql
set search_path=public,private
as $$
declare
  v_room_class bigint;
  v_room_subject bigint;
  v_class_school bigint;
  v_subject_school bigint;
  v_subject_slug text;
begin
  select c.school_id into v_class_school from public.classes c where c.id=new.class_id;
  if v_class_school is null then raise exception 'Assignment class does not exist'; end if;

  if new.class_subject_id is not null then
    select cs.class_id,cs.subject_id into v_room_class,v_room_subject
    from public.class_subjects cs
    where cs.id=new.class_subject_id and cs.active=true;
    if v_room_class is null then raise exception 'Subject room does not exist or is inactive'; end if;
    if v_room_class<>new.class_id then raise exception 'Subject room must belong to the assignment class'; end if;
    new.subject_id:=v_room_subject;
  end if;

  if new.subject_id is not null then
    select s.school_id,s.slug into v_subject_school,v_subject_slug
    from public.subjects s where s.id=new.subject_id and s.active=true;
    if v_subject_school is null then raise exception 'Assignment subject does not exist or is inactive'; end if;
    if v_subject_school<>v_class_school then raise exception 'Assignment subject must belong to the class school'; end if;
  end if;

  if new.assignment_kind in ('danish_writing','danish_analysis','danish_communication') then
    if new.subject_id is null or v_subject_slug<>'dansk' then
      raise exception 'Danish tasks can only be assigned in Dansk';
    end if;
  elsif new.assignment_kind='math_task' then
    if new.subject_id is null or v_subject_slug<>'matematik' then
      raise exception 'Math tasks can only be assigned in Matematik';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_assignment_subject_context() from public,anon,authenticated;
grant execute on function private.enforce_assignment_subject_context() to service_role;
