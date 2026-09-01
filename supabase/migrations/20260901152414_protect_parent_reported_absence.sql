drop policy if exists "teachers_manage_absence_in_own_classes" on public.student_absence;

create policy "teachers_read_absence_in_own_classes"
on public.student_absence
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.teacher_classes tc on tc.class_id=s.class_id
    join public.classes c on c.id=s.class_id
    join public.school_memberships sm on sm.school_id=c.school_id
    where s.id=student_absence.student_id
      and tc.teacher_id=auth.uid()
      and sm.user_id=auth.uid()
      and sm.role='teacher'
      and sm.active=true
  )
);

create policy "teachers_create_staff_absence_in_own_classes"
on public.student_absence
for insert
to authenticated
with check (
  source in ('teacher','substitute')
  and exists (
    select 1
    from public.students s
    join public.teacher_classes tc on tc.class_id=s.class_id
    join public.classes c on c.id=s.class_id
    join public.school_memberships sm on sm.school_id=c.school_id
    where s.id=student_absence.student_id
      and tc.teacher_id=auth.uid()
      and sm.user_id=auth.uid()
      and sm.role='teacher'
      and sm.active=true
  )
);

create policy "teachers_update_staff_absence_in_own_classes"
on public.student_absence
for update
to authenticated
using (
  source in ('teacher','substitute')
  and exists (
    select 1
    from public.students s
    join public.teacher_classes tc on tc.class_id=s.class_id
    join public.classes c on c.id=s.class_id
    join public.school_memberships sm on sm.school_id=c.school_id
    where s.id=student_absence.student_id
      and tc.teacher_id=auth.uid()
      and sm.user_id=auth.uid()
      and sm.role='teacher'
      and sm.active=true
  )
)
with check (
  source in ('teacher','substitute')
  and exists (
    select 1
    from public.students s
    join public.teacher_classes tc on tc.class_id=s.class_id
    join public.classes c on c.id=s.class_id
    join public.school_memberships sm on sm.school_id=c.school_id
    where s.id=student_absence.student_id
      and tc.teacher_id=auth.uid()
      and sm.user_id=auth.uid()
      and sm.role='teacher'
      and sm.active=true
  )
);

create policy "teachers_delete_staff_absence_in_own_classes"
on public.student_absence
for delete
to authenticated
using (
  source in ('teacher','substitute')
  and exists (
    select 1
    from public.students s
    join public.teacher_classes tc on tc.class_id=s.class_id
    join public.classes c on c.id=s.class_id
    join public.school_memberships sm on sm.school_id=c.school_id
    where s.id=student_absence.student_id
      and tc.teacher_id=auth.uid()
      and sm.user_id=auth.uid()
      and sm.role='teacher'
      and sm.active=true
  )
);
