create table if not exists public.user_resume_work_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  school_id bigint not null references public.schools(id) on delete cascade,
  object_type text not null check (object_type in ('subject_unit','lesson','meeting','assignment','student')),
  object_key text not null,
  title text not null,
  subtitle text null,
  href text not null,
  updated_at timestamptz not null default now()
);

alter table public.user_resume_work_state enable row level security;

create policy "Users manage own resume state"
on public.user_resume_work_state
for all
to authenticated
using (user_id = auth.uid() and public.is_school_member(school_id))
with check (user_id = auth.uid() and public.is_school_member(school_id));

create index if not exists user_resume_work_state_school_idx on public.user_resume_work_state(school_id);

grant select, insert, update, delete on public.user_resume_work_state to authenticated;
revoke all on public.user_resume_work_state from anon;
