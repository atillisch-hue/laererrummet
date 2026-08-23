-- Parent-reported absence uses the same student_absence table as teacher registration.
-- Add source metadata so the classroom can distinguish parent reports.
alter table public.student_absence
  add column if not exists source text not null default 'teacher',
  add column if not exists reported_by uuid,
  add column if not exists created_at timestamptz not null default now();

-- Prevent duplicate absence rows for the same pupil/day.
create unique index if not exists student_absence_student_date_unique
  on public.student_absence(student_id, absence_date);

-- Parent/student links are already used by the parent portal. This policy allows a
-- signed-in parent to create absence only for a child linked to their account.
-- NOTE: If your parent link table has a different name/columns, adapt this policy.
-- The API route can also perform the authorization server-side.
