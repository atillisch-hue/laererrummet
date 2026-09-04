drop policy if exists school_schedule_versions_read on public.school_schedule_versions;
create policy school_schedule_versions_read on public.school_schedule_versions
for select to authenticated
using (
  exists(
    select 1 from public.school_years sy
    where sy.id=school_schedule_versions.school_year_id
      and (
        public.has_school_role(sy.school_id,'admin')
        or public.has_school_role(sy.school_id,'leader')
        or (
          public.is_school_staff(sy.school_id)
          and (
            school_schedule_versions.status in ('published','archived')
            or (
              school_schedule_versions.status='draft'
              and not private.school_year_has_live_schedule(school_schedule_versions.school_year_id)
            )
          )
        )
      )
  )
);
