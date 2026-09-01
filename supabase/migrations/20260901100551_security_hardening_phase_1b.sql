-- Klassevaerelset security hardening phase 1b
-- Keep parent-link administration school-scoped.

create or replace function public.admin_parent_links()
returns table(parent_id uuid, student_id bigint)
language sql
stable
security definer
set search_path = 'public'
as $$
  select ps.parent_id, ps.student_id
  from public.parent_students ps
  join public.students s on s.id = ps.student_id
  join public.classes c on c.id = s.class_id
  where public.has_school_role(c.school_id, 'admin');
$$;
