create or replace function private.schedule_version_visible_to_staff(p_version_id bigint)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.school_schedule_versions sv
    join public.school_years sy on sy.id=sv.school_year_id
    where sv.id=p_version_id
      and (
        public.has_school_role(sy.school_id,'admin')
        or public.has_school_role(sy.school_id,'leader')
        or (
          public.is_school_staff(sy.school_id)
          and (
            sv.status in ('published','archived')
            or (sv.status='draft' and not private.school_year_has_live_schedule(sv.school_year_id))
          )
        )
      )
  );
$$;
revoke all on function private.schedule_version_visible_to_staff(bigint) from public,anon;
grant execute on function private.schedule_version_visible_to_staff(bigint) to authenticated;

drop policy if exists "school staff and assigned substitutes read schedule" on public.schedule_entries;
create policy "version aware staff read schedule" on public.schedule_entries
for select to authenticated
using (
  private.schedule_version_visible_to_staff(schedule_version_id)
  or exists(
    select 1
    from public.substitute_assignments sa
    join public.school_schedule_versions sv on sv.id=schedule_entries.schedule_version_id
    join public.school_years sy on sy.id=sv.school_year_id
    where sa.schedule_entry_id=schedule_entries.id
      and sa.substitute_teacher_id=(select auth.uid())
      and public.is_school_member(sa.school_id)
      and sa.school_id=sy.school_id
      and (
        sv.status in ('published','archived')
        or (sv.status='draft' and not private.school_year_has_live_schedule(sv.school_year_id))
      )
  )
);

drop policy if exists "school staff read schedule teachers" on public.schedule_teachers;
create policy "version aware staff read schedule teachers" on public.schedule_teachers
for select to authenticated
using (
  exists(
    select 1
    from public.schedule_entries se
    where se.id=schedule_teachers.schedule_entry_id
      and private.schedule_version_visible_to_staff(se.schedule_version_id)
  )
);
