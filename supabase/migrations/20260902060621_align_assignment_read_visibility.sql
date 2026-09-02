create or replace function private.student_can_read_assignment(p_assignment_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.assignments a
    join public.students s on s.class_id=a.class_id
    where a.id=p_assignment_id
      and s.user_id=auth.uid()
      and (
        not exists (select 1 from public.assignment_students ast where ast.assignment_id=a.id)
        or exists (select 1 from public.assignment_students ast where ast.assignment_id=a.id and ast.student_id=s.id)
      )
  );
$$;

create or replace function private.parent_can_read_assignment(p_assignment_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.assignments a
    join public.classes c on c.id=a.class_id
    join public.students s on s.class_id=a.class_id
    join public.parent_students ps on ps.student_id=s.id and ps.parent_id=auth.uid()
    join public.school_memberships sm on sm.user_id=ps.parent_id and sm.school_id=c.school_id and sm.role='parent' and sm.active=true
    where a.id=p_assignment_id
      and (
        not exists (select 1 from public.assignment_students ast where ast.assignment_id=a.id)
        or exists (select 1 from public.assignment_students ast where ast.assignment_id=a.id and ast.student_id=s.id)
      )
  );
$$;

revoke execute on function private.student_can_read_assignment(bigint) from public, anon;
revoke execute on function private.parent_can_read_assignment(bigint) from public, anon;
grant execute on function private.student_can_read_assignment(bigint) to authenticated, service_role;
grant execute on function private.parent_can_read_assignment(bigint) to authenticated, service_role;
