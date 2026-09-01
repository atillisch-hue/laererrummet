alter table public.lesson_instances
  add column attendance_checked_at timestamptz null,
  add column attendance_checked_by uuid null references auth.users(id);

create index idx_lesson_instances_attendance_checked_by
  on public.lesson_instances(attendance_checked_by)
  where attendance_checked_by is not null;
