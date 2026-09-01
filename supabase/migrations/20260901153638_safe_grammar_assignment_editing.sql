drop policy if exists "teachers_manage_grammar_assignments_in_own_classes" on public.grammar_assignments;

create policy "staff read grammar assignments in permitted classes"
on public.grammar_assignments
for select
to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.id=grammar_assignments.class_id
      and (
        public.has_school_role(c.school_id,'admin')
        or (
          public.has_school_role(c.school_id,'teacher')
          and exists (
            select 1 from public.teacher_classes tc
            where tc.class_id=c.id and tc.teacher_id=auth.uid()
          )
        )
      )
  )
);

create policy "staff create grammar assignments in permitted classes"
on public.grammar_assignments
for insert
to authenticated
with check (
  exists (
    select 1 from public.classes c
    where c.id=grammar_assignments.class_id
      and (
        public.has_school_role(c.school_id,'admin')
        or (
          public.has_school_role(c.school_id,'teacher')
          and exists (
            select 1 from public.teacher_classes tc
            where tc.class_id=c.id and tc.teacher_id=auth.uid()
          )
        )
      )
  )
);

create policy "staff update unanswered grammar assignments"
on public.grammar_assignments
for update
to authenticated
using (
  not exists (
    select 1 from public.grammar_attempts ga
    where ga.grammar_assignment_id=grammar_assignments.id
  )
  and exists (
    select 1 from public.classes c
    where c.id=grammar_assignments.class_id
      and (
        public.has_school_role(c.school_id,'admin')
        or (
          public.has_school_role(c.school_id,'teacher')
          and exists (
            select 1 from public.teacher_classes tc
            where tc.class_id=c.id and tc.teacher_id=auth.uid()
          )
        )
      )
  )
)
with check (
  exists (
    select 1 from public.classes c
    where c.id=grammar_assignments.class_id
      and (
        public.has_school_role(c.school_id,'admin')
        or (
          public.has_school_role(c.school_id,'teacher')
          and exists (
            select 1 from public.teacher_classes tc
            where tc.class_id=c.id and tc.teacher_id=auth.uid()
          )
        )
      )
  )
);

create policy "staff delete unanswered grammar assignments"
on public.grammar_assignments
for delete
to authenticated
using (
  not exists (
    select 1 from public.grammar_attempts ga
    where ga.grammar_assignment_id=grammar_assignments.id
  )
  and exists (
    select 1 from public.classes c
    where c.id=grammar_assignments.class_id
      and (
        public.has_school_role(c.school_id,'admin')
        or (
          public.has_school_role(c.school_id,'teacher')
          and exists (
            select 1 from public.teacher_classes tc
            where tc.class_id=c.id and tc.teacher_id=auth.uid()
          )
        )
      )
  )
);

create or replace function public.update_grammar_assignment_atomic(
  p_assignment_id bigint,
  p_class_id bigint,
  p_area text,
  p_topic text,
  p_level text,
  p_title text,
  p_student_ids bigint[] default null
)
returns void
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_old_school_id bigint;
  v_target_school_id bigint;
  v_allowed boolean;
  v_invalid_students integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select c.school_id into v_old_school_id
  from public.grammar_assignments g
  join public.classes c on c.id=g.class_id
  where g.id=p_assignment_id;

  if v_old_school_id is null then raise exception 'Grammar assignment not found'; end if;

  if exists(select 1 from public.grammar_attempts a where a.grammar_assignment_id=p_assignment_id) then
    raise exception 'Grammar assignment has attempts and is locked';
  end if;

  select c.school_id into v_target_school_id from public.classes c where c.id=p_class_id;
  if v_target_school_id is null or v_target_school_id<>v_old_school_id then
    raise exception 'Grammar assignment cannot move across schools';
  end if;

  select (
    public.has_school_role(v_target_school_id,'admin')
    or (
      public.has_school_role(v_target_school_id,'teacher')
      and exists(select 1 from public.teacher_classes tc where tc.class_id=p_class_id and tc.teacher_id=auth.uid())
    )
  ) into v_allowed;
  if not coalesce(v_allowed,false) then raise exception 'Access denied'; end if;

  if trim(coalesce(p_area,''))='' or trim(coalesce(p_topic,''))='' or trim(coalesce(p_level,''))='' or trim(coalesce(p_title,''))='' then
    raise exception 'Area, topic, level and title are required';
  end if;

  if p_student_ids is not null and cardinality(p_student_ids)>0 then
    select count(*) into v_invalid_students
    from unnest(p_student_ids) x(student_id)
    where not exists(select 1 from public.students s where s.id=x.student_id and s.class_id=p_class_id);
    if v_invalid_students>0 then raise exception 'All recipients must belong to the selected class'; end if;
  end if;

  update public.grammar_assignments
  set class_id=p_class_id,area=trim(p_area),topic=trim(p_topic),level=trim(p_level),title=trim(p_title)
  where id=p_assignment_id;

  delete from public.grammar_assignment_students where grammar_assignment_id=p_assignment_id;

  if p_student_ids is not null and cardinality(p_student_ids)>0 then
    insert into public.grammar_assignment_students(grammar_assignment_id,student_id)
    select p_assignment_id,student_id from (select distinct unnest(p_student_ids) as student_id) x;
  end if;
end;
$$;

revoke all on function public.update_grammar_assignment_atomic(bigint,bigint,text,text,text,text,bigint[]) from public,anon;
grant execute on function public.update_grammar_assignment_atomic(bigint,bigint,text,text,text,text,bigint[]) to authenticated,service_role;
