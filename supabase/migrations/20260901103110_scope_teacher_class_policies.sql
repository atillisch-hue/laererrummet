-- Replace legacy JWT-based teacher_classes admin policy with school-membership checks.
-- Also avoid overlapping ALL + SELECT policies.

drop policy if exists "Admins can manage teacher classes" on public.teacher_classes;
drop policy if exists "teachers_read_own_teacher_classes" on public.teacher_classes;

create policy "teachers and school admins read teacher classes"
on public.teacher_classes
for select
to authenticated
using (
  teacher_id = (select auth.uid())
  or exists (
    select 1
    from public.classes c
    where c.id = teacher_classes.class_id
      and public.has_school_role(c.school_id,'admin')
  )
);

create policy "school admins insert teacher classes"
on public.teacher_classes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.classes c
    where c.id = teacher_classes.class_id
      and public.has_school_role(c.school_id,'admin')
      and exists (
        select 1
        from public.school_memberships sm
        where sm.school_id = c.school_id
          and sm.user_id = teacher_classes.teacher_id
          and sm.active = true
          and sm.role in ('teacher','admin')
      )
  )
);

create policy "school admins update teacher classes"
on public.teacher_classes
for update
to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.id = teacher_classes.class_id
      and public.has_school_role(c.school_id,'admin')
  )
)
with check (
  exists (
    select 1
    from public.classes c
    where c.id = teacher_classes.class_id
      and public.has_school_role(c.school_id,'admin')
      and exists (
        select 1
        from public.school_memberships sm
        where sm.school_id = c.school_id
          and sm.user_id = teacher_classes.teacher_id
          and sm.active = true
          and sm.role in ('teacher','admin')
      )
  )
);

create policy "school admins delete teacher classes"
on public.teacher_classes
for delete
to authenticated
using (
  exists (
    select 1 from public.classes c
    where c.id = teacher_classes.class_id
      and public.has_school_role(c.school_id,'admin')
  )
);
