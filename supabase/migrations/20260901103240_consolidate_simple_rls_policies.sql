-- Consolidate straightforward overlapping permissive RLS policies without changing intended access.

-- Classes: school members read; admins write.
drop policy if exists "school_admins_manage_classes" on public.classes;
create policy "school admins insert classes" on public.classes for insert to authenticated
with check (public.has_school_role(school_id,'admin'));
create policy "school admins update classes" on public.classes for update to authenticated
using (public.has_school_role(school_id,'admin')) with check (public.has_school_role(school_id,'admin'));
create policy "school admins delete classes" on public.classes for delete to authenticated
using (public.has_school_role(school_id,'admin'));

-- Rooms: staff read; admins write.
drop policy if exists "school admins manage rooms" on public.school_rooms;
create policy "school admins insert rooms" on public.school_rooms for insert to authenticated
with check (public.has_school_role(school_id,'admin'));
create policy "school admins update rooms" on public.school_rooms for update to authenticated
using (public.has_school_role(school_id,'admin')) with check (public.has_school_role(school_id,'admin'));
create policy "school admins delete rooms" on public.school_rooms for delete to authenticated
using (public.has_school_role(school_id,'admin'));

-- Schedule entries: one read path, admin-only writes.
drop policy if exists "school admins manage schedule" on public.schedule_entries;
drop policy if exists "school staff read schedule" on public.schedule_entries;
drop policy if exists "substitutes read assigned schedule entries" on public.schedule_entries;
create policy "school staff and assigned substitutes read schedule"
on public.schedule_entries for select to authenticated
using (
  exists(select 1 from public.classes c where c.id=schedule_entries.class_id and public.is_school_staff(c.school_id))
  or exists(
    select 1 from public.substitute_assignments sa
    where sa.schedule_entry_id=schedule_entries.id
      and sa.substitute_teacher_id=(select auth.uid())
      and public.is_school_member(sa.school_id)
  )
);
create policy "school admins insert schedule" on public.schedule_entries for insert to authenticated
with check (exists(select 1 from public.classes c where c.id=schedule_entries.class_id and public.has_school_role(c.school_id,'admin')));
create policy "school admins update schedule" on public.schedule_entries for update to authenticated
using (exists(select 1 from public.classes c where c.id=schedule_entries.class_id and public.has_school_role(c.school_id,'admin')))
with check (exists(select 1 from public.classes c where c.id=schedule_entries.class_id and public.has_school_role(c.school_id,'admin')));
create policy "school admins delete schedule" on public.schedule_entries for delete to authenticated
using (exists(select 1 from public.classes c where c.id=schedule_entries.class_id and public.has_school_role(c.school_id,'admin')));

-- Schedule teacher links: staff read; admins write.
drop policy if exists "school admins manage schedule teachers" on public.schedule_teachers;
create policy "school admins insert schedule teachers" on public.schedule_teachers for insert to authenticated
with check (exists(select 1 from public.schedule_entries se join public.classes c on c.id=se.class_id where se.id=schedule_teachers.schedule_entry_id and public.has_school_role(c.school_id,'admin')));
create policy "school admins update schedule teachers" on public.schedule_teachers for update to authenticated
using (exists(select 1 from public.schedule_entries se join public.classes c on c.id=se.class_id where se.id=schedule_teachers.schedule_entry_id and public.has_school_role(c.school_id,'admin')))
with check (exists(select 1 from public.schedule_entries se join public.classes c on c.id=se.class_id where se.id=schedule_teachers.schedule_entry_id and public.has_school_role(c.school_id,'admin')));
create policy "school admins delete schedule teachers" on public.schedule_teachers for delete to authenticated
using (exists(select 1 from public.schedule_entries se join public.classes c on c.id=se.class_id where se.id=schedule_teachers.schedule_entry_id and public.has_school_role(c.school_id,'admin')));

-- Meeting participants: one read policy, editor-only writes.
drop policy if exists "meeting managers manage participants" on public.meeting_participants;
drop policy if exists "internal meeting members view participants" on public.meeting_participants;
create policy "internal meeting members view participants" on public.meeting_participants for select to authenticated
using (public.can_access_meeting(meeting_id));
create policy "meeting editors insert participants" on public.meeting_participants for insert to authenticated
with check (public.can_edit_meeting(meeting_id));
create policy "meeting editors update participants" on public.meeting_participants for update to authenticated
using (public.can_edit_meeting(meeting_id)) with check (public.can_edit_meeting(meeting_id));
create policy "meeting editors delete participants" on public.meeting_participants for delete to authenticated
using (public.can_edit_meeting(meeting_id));

-- Grammar assignment recipients: relevant staff write; staff or the student can read.
drop policy if exists "staff manage grammar assignment students" on public.grammar_assignment_students;
drop policy if exists "students read own grammar recipient links" on public.grammar_assignment_students;
create policy "relevant staff or student read grammar recipients"
on public.grammar_assignment_students for select to authenticated
using (
  exists(
    select 1
    from public.grammar_assignments ga
    join public.students s on s.id=grammar_assignment_students.student_id and s.class_id=ga.class_id
    where ga.id=grammar_assignment_students.grammar_assignment_id
      and (
        public.staff_can_access_student(s.id)
        or s.user_id=(select auth.uid())
      )
  )
);
create policy "relevant staff insert grammar recipients"
on public.grammar_assignment_students for insert to authenticated
with check (
  exists(
    select 1 from public.grammar_assignments ga
    join public.students s on s.id=grammar_assignment_students.student_id and s.class_id=ga.class_id
    where ga.id=grammar_assignment_students.grammar_assignment_id and public.staff_can_access_student(s.id)
  )
);
create policy "relevant staff update grammar recipients"
on public.grammar_assignment_students for update to authenticated
using (
  exists(
    select 1 from public.grammar_assignments ga
    join public.students s on s.id=grammar_assignment_students.student_id and s.class_id=ga.class_id
    where ga.id=grammar_assignment_students.grammar_assignment_id and public.staff_can_access_student(s.id)
  )
)
with check (
  exists(
    select 1 from public.grammar_assignments ga
    join public.students s on s.id=grammar_assignment_students.student_id and s.class_id=ga.class_id
    where ga.id=grammar_assignment_students.grammar_assignment_id and public.staff_can_access_student(s.id)
  )
);
create policy "relevant staff delete grammar recipients"
on public.grammar_assignment_students for delete to authenticated
using (
  exists(
    select 1 from public.grammar_assignments ga
    join public.students s on s.id=grammar_assignment_students.student_id and s.class_id=ga.class_id
    where ga.id=grammar_assignment_students.grammar_assignment_id and public.staff_can_access_student(s.id)
  )
);

-- user_roles is legacy cache only: one combined read policy.
drop policy if exists "admins can view user roles" on public.user_roles;
drop policy if exists "users can view own roles" on public.user_roles;
create policy "users view own roles and admins view school roles"
on public.user_roles for select to authenticated
using (
  user_id=(select auth.uid())
  or exists(
    select 1
    from public.school_memberships target
    where target.user_id=user_roles.user_id
      and exists(
        select 1 from public.school_memberships me
        where me.user_id=(select auth.uid()) and me.school_id=target.school_id and me.role='admin' and me.active=true
      )
  )
);
