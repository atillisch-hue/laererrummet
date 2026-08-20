-- Klasseværelset: individuelle modtagere af opgaver
create table if not exists public.assignment_students (
  assignment_id bigint not null references public.assignments(id) on delete cascade,
  student_id bigint not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (assignment_id, student_id)
);

create index if not exists assignment_students_student_idx on public.assignment_students(student_id);
alter table public.assignment_students enable row level security;

-- Lærere/admin bruger den eksisterende app-adgang til at oprette koblinger.
-- Forældreportalen læser koblingerne server-side med service role og udleverer
-- kun opgaver for børn, der allerede er knyttet til den aktuelle forælder.
