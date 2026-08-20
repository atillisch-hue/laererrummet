-- Klasseværelset: sikker kobling mellem forældre og elever
-- Kan køres igen i Supabase SQL Editor ved opdateringer.

create table if not exists public.parent_students (
  parent_id uuid not null references auth.users(id) on delete cascade,
  student_id bigint not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

alter table public.parent_students enable row level security;

drop policy if exists "parents_read_own_children" on public.parent_students;
create policy "parents_read_own_children"
on public.parent_students
for select
to authenticated
using (parent_id = auth.uid());

create or replace function public.parent_portal_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
  metadata jsonb;
  has_parent_role boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  metadata := coalesce(auth.jwt() -> 'user_metadata', '{}'::jsonb);
  has_parent_role :=
    metadata ->> 'role' = 'parent'
    or coalesce(metadata -> 'roles', '[]'::jsonb) ? 'parent';

  if not has_parent_role then
    raise exception 'Parent access required';
  end if;

  select jsonb_build_object(
    'children', coalesce(jsonb_agg(jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'class_id', s.class_id,
      'class_name', c.name
    ) order by s.name) filter (where s.id is not null), '[]'::jsonb)
  )
  into result
  from public.parent_students ps
  join public.students s on s.id = ps.student_id
  left join public.classes c on c.id = s.class_id
  where ps.parent_id = auth.uid();

  return coalesce(result, jsonb_build_object('children','[]'::jsonb));
end;
$$;

revoke all on function public.parent_portal_data() from public;
grant execute on function public.parent_portal_data() to authenticated;
