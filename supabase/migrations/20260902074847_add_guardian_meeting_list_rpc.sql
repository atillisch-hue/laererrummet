create or replace function public.guardian_meetings()
returns table(
  id bigint,
  title text,
  meeting_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  agenda text,
  minutes text,
  status text,
  student_id bigint
)
language sql
stable
security definer
set search_path to 'public'
as $$
  select cm.id,cm.title,cm.meeting_type,cm.starts_at,cm.ends_at,cm.location,cm.agenda,cm.minutes,cm.status,cm.student_id
  from public.calendar_meetings cm
  where public.has_school_role(cm.school_id,'parent')
    and exists (
      select 1
      from public.meeting_participants mp
      where mp.meeting_id=cm.id
        and mp.user_id=auth.uid()
        and mp.access_type='guardian'
    )
    and (cm.student_id is null or public.parent_can_access_student(cm.student_id))
  order by cm.starts_at desc, cm.id desc;
$$;

revoke all on function public.guardian_meetings() from public, anon;
grant execute on function public.guardian_meetings() to authenticated, service_role;
