create or replace function public.update_assignment_and_recipients(
  p_assignment_id bigint,
  p_title text,
  p_instructions text,
  p_type text,
  p_class_subject_id bigint,
  p_student_ids bigint[] default null
)
returns void
language plpgsql
security invoker
set search_path='public'
as $$
declare
  v_class_id bigint;
begin
  select a.class_id into v_class_id
  from public.assignments a
  where a.id=p_assignment_id;

  if v_class_id is null then
    raise exception 'Assignment not found or not editable';
  end if;

  if nullif(trim(p_title),'') is null then
    raise exception 'Assignment title is required';
  end if;

  if p_class_subject_id is not null and not exists (
    select 1 from public.class_subjects cs
    where cs.id=p_class_subject_id
      and cs.class_id=v_class_id
      and cs.active=true
  ) then
    raise exception 'Subject room must belong to the assignment class';
  end if;

  if p_student_ids is not null and exists (
    select 1
    from unnest(p_student_ids) sid
    left join public.students s on s.id=sid
    where s.id is null or s.class_id<>v_class_id
  ) then
    raise exception 'All recipients must belong to the assignment class';
  end if;

  update public.assignments
  set title=trim(p_title),
      instructions=nullif(trim(coalesce(p_instructions,'')),''),
      type=p_type,
      class_subject_id=p_class_subject_id
  where id=p_assignment_id;

  if not found then
    raise exception 'Assignment could not be updated';
  end if;

  delete from public.assignment_students
  where assignment_id=p_assignment_id;

  if p_student_ids is not null and coalesce(array_length(p_student_ids,1),0)>0 then
    insert into public.assignment_students(assignment_id,student_id)
    select p_assignment_id,sid
    from (select distinct unnest(p_student_ids) as sid) q;
  end if;
end;
$$;

revoke all on function public.update_assignment_and_recipients(bigint,text,text,text,bigint,bigint[]) from public,anon;
grant execute on function public.update_assignment_and_recipients(bigint,text,text,text,bigint,bigint[]) to authenticated;
