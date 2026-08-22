-- Klasseværelset: secure student draft writes and board data
-- Run this migration in Supabase SQL Editor / migrations.

-- Student drafts are saved through a narrowly scoped RPC using the student's
-- personal access code. The browser never gets anonymous table write access.
create or replace function public.save_student_draft(
  p_access_code text,
  p_assignment_id bigint,
  p_content jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id bigint;
  v_class_id bigint;
begin
  select s.id, s.class_id
    into v_student_id, v_class_id
  from public.students s
  where upper(s.access_code) = upper(trim(p_access_code))
  limit 1;

  if v_student_id is null then
    raise exception 'Invalid student access code';
  end if;

  if not exists (
    select 1
    from public.assignments a
    left join public.assignment_students ast
      on ast.assignment_id = a.id and ast.student_id = v_student_id
    where a.id = p_assignment_id
      and (a.class_id = v_class_id or ast.student_id = v_student_id)
  ) then
    raise exception 'Assignment is not available to this student';
  end if;

  insert into public.drafts (student_id, assignment_id, content, updated_at)
  values (v_student_id, p_assignment_id, p_content, now())
  on conflict (student_id, assignment_id)
  do update set content = excluded.content, updated_at = now();
end;
$$;

revoke all on function public.save_student_draft(text,bigint,jsonb) from public;
grant execute on function public.save_student_draft(text,bigint,jsonb) to anon, authenticated;

-- Remove the old broad drafts policy. Authenticated staff should only read
-- drafts for pupils in their own school / assigned classes.
alter table public.drafts enable row level security;
drop policy if exists "authenticated drafts access" on public.drafts;
drop policy if exists "Authenticated drafts access" on public.drafts;
drop policy if exists "staff_read_drafts" on public.drafts;

create policy "staff_read_drafts"
on public.drafts
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.classes c on c.id = s.class_id
    join public.school_memberships sm on sm.school_id = c.school_id
    where s.id = drafts.student_id
      and sm.user_id = auth.uid()
      and sm.active = true
      and sm.role in ('teacher','admin')
      and (
        sm.role = 'admin'
        or exists (
          select 1 from public.teacher_classes tc
          where tc.teacher_id = auth.uid() and tc.class_id = s.class_id
        )
      )
  )
);

-- Board access is board-role only. Admin/leader is deliberately NOT included.
alter table public.board_meetings enable row level security;
alter table public.board_decisions enable row level security;

drop policy if exists "Authenticated users can read board meetings" on public.board_meetings;
drop policy if exists "Authenticated users can manage board meetings" on public.board_meetings;
drop policy if exists "board_members_manage_meetings" on public.board_meetings;
create policy "board_members_manage_meetings"
on public.board_meetings
for all
to authenticated
using (
  coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '[]'::jsonb) ? 'board'
  or auth.jwt() -> 'user_metadata' ->> 'role' = 'board'
  or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ? 'board'
  or auth.jwt() -> 'app_metadata' ->> 'role' = 'board'
)
with check (
  coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '[]'::jsonb) ? 'board'
  or auth.jwt() -> 'user_metadata' ->> 'role' = 'board'
  or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ? 'board'
  or auth.jwt() -> 'app_metadata' ->> 'role' = 'board'
);

drop policy if exists "Authenticated users can read board decisions" on public.board_decisions;
drop policy if exists "Authenticated users can manage board decisions" on public.board_decisions;
drop policy if exists "board_members_manage_decisions" on public.board_decisions;
create policy "board_members_manage_decisions"
on public.board_decisions
for all
to authenticated
using (
  coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '[]'::jsonb) ? 'board'
  or auth.jwt() -> 'user_metadata' ->> 'role' = 'board'
  or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ? 'board'
  or auth.jwt() -> 'app_metadata' ->> 'role' = 'board'
)
with check (
  coalesce(auth.jwt() -> 'user_metadata' -> 'roles', '[]'::jsonb) ? 'board'
  or auth.jwt() -> 'user_metadata' ->> 'role' = 'board'
  or coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb) ? 'board'
  or auth.jwt() -> 'app_metadata' ->> 'role' = 'board'
);
