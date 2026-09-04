alter table public.student_absence
  add constraint student_absence_student_day_key unique (student_id, absence_date);
