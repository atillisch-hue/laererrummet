drop policy if exists "school admins insert schedule" on public.schedule_entries;
drop policy if exists "school admins update schedule" on public.schedule_entries;
drop policy if exists "school admins delete schedule" on public.schedule_entries;

create policy "leadership insert draft schedule" on public.schedule_entries
for insert to authenticated
with check (
  exists (
    select 1
    from public.classes c
    join public.school_schedule_versions sv on sv.id=schedule_entries.schedule_version_id
    join public.school_years sy on sy.id=sv.school_year_id
    where c.id=schedule_entries.class_id
      and c.school_id=sy.school_id
      and sv.status='draft'
      and (public.has_school_role(c.school_id,'admin') or public.has_school_role(c.school_id,'leader'))
  )
);

create policy "leadership update draft schedule" on public.schedule_entries
for update to authenticated
using (
  exists (
    select 1
    from public.classes c
    join public.school_schedule_versions sv on sv.id=schedule_entries.schedule_version_id
    join public.school_years sy on sy.id=sv.school_year_id
    where c.id=schedule_entries.class_id
      and c.school_id=sy.school_id
      and sv.status='draft'
      and (public.has_school_role(c.school_id,'admin') or public.has_school_role(c.school_id,'leader'))
  )
)
with check (
  exists (
    select 1
    from public.classes c
    join public.school_schedule_versions sv on sv.id=schedule_entries.schedule_version_id
    join public.school_years sy on sy.id=sv.school_year_id
    where c.id=schedule_entries.class_id
      and c.school_id=sy.school_id
      and sv.status='draft'
      and (public.has_school_role(c.school_id,'admin') or public.has_school_role(c.school_id,'leader'))
  )
);

create policy "leadership delete draft schedule" on public.schedule_entries
for delete to authenticated
using (
  exists (
    select 1
    from public.classes c
    join public.school_schedule_versions sv on sv.id=schedule_entries.schedule_version_id
    join public.school_years sy on sy.id=sv.school_year_id
    where c.id=schedule_entries.class_id
      and c.school_id=sy.school_id
      and sv.status='draft'
      and (public.has_school_role(c.school_id,'admin') or public.has_school_role(c.school_id,'leader'))
  )
);

drop policy if exists "school admins insert schedule teachers" on public.schedule_teachers;
drop policy if exists "school admins update schedule teachers" on public.schedule_teachers;
drop policy if exists "school admins delete schedule teachers" on public.schedule_teachers;

create policy "leadership insert draft schedule teachers" on public.schedule_teachers
for insert to authenticated
with check (
  exists (
    select 1
    from public.schedule_entries se
    join public.classes c on c.id=se.class_id
    join public.school_schedule_versions sv on sv.id=se.schedule_version_id
    join public.school_years sy on sy.id=sv.school_year_id
    where se.id=schedule_teachers.schedule_entry_id
      and c.school_id=sy.school_id
      and sv.status='draft'
      and private.is_active_school_staff_member(c.school_id,schedule_teachers.teacher_id)
      and (public.has_school_role(c.school_id,'admin') or public.has_school_role(c.school_id,'leader'))
  )
);

create policy "leadership update draft schedule teachers" on public.schedule_teachers
for update to authenticated
using (
  exists (
    select 1
    from public.schedule_entries se
    join public.classes c on c.id=se.class_id
    join public.school_schedule_versions sv on sv.id=se.schedule_version_id
    join public.school_years sy on sy.id=sv.school_year_id
    where se.id=schedule_teachers.schedule_entry_id
      and c.school_id=sy.school_id
      and sv.status='draft'
      and (public.has_school_role(c.school_id,'admin') or public.has_school_role(c.school_id,'leader'))
  )
)
with check (
  exists (
    select 1
    from public.schedule_entries se
    join public.classes c on c.id=se.class_id
    join public.school_schedule_versions sv on sv.id=se.schedule_version_id
    join public.school_years sy on sy.id=sv.school_year_id
    where se.id=schedule_teachers.schedule_entry_id
      and c.school_id=sy.school_id
      and sv.status='draft'
      and private.is_active_school_staff_member(c.school_id,schedule_teachers.teacher_id)
      and (public.has_school_role(c.school_id,'admin') or public.has_school_role(c.school_id,'leader'))
  )
);

create policy "leadership delete draft schedule teachers" on public.schedule_teachers
for delete to authenticated
using (
  exists (
    select 1
    from public.schedule_entries se
    join public.classes c on c.id=se.class_id
    join public.school_schedule_versions sv on sv.id=se.schedule_version_id
    join public.school_years sy on sy.id=sv.school_year_id
    where se.id=schedule_teachers.schedule_entry_id
      and c.school_id=sy.school_id
      and sv.status='draft'
      and (public.has_school_role(c.school_id,'admin') or public.has_school_role(c.school_id,'leader'))
  )
);
