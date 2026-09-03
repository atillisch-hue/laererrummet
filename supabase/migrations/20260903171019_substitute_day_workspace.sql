create or replace function public.substitute_day_workspace(p_date date default current_date)
returns table(
  assignment_id bigint,
  school_id bigint,
  schedule_entry_id bigint,
  assignment_date date,
  start_time time without time zone,
  end_time time without time zone,
  subject text,
  room text,
  class_id bigint,
  class_name text,
  substitute_plan text,
  lesson_instance_id bigint,
  subject_unit_title text,
  attendance_checked_at timestamptz,
  resource_count bigint
)
language plpgsql
security definer
set search_path to 'public','private'
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_date is null then raise exception 'Date is required'; end if;
  return query
  select sa.id,sa.school_id,se.id,sa.assignment_date,se.start_time,se.end_time,se.subject,se.room,
         c.id,c.name,sa.substitute_plan,li.id,su.title,li.attendance_checked_at,
         coalesce((select count(*) from public.lesson_resource_links lrl where lrl.lesson_instance_id=li.id),0)::bigint
  from public.substitute_assignments sa
  join public.schedule_entries se on se.id=sa.schedule_entry_id
  join public.classes c on c.id=se.class_id and c.school_id=sa.school_id
  left join public.lesson_instances li on li.schedule_entry_id=se.id and li.lesson_date=sa.assignment_date
  left join public.subject_units su on su.id=li.subject_unit_id
  where sa.substitute_teacher_id=auth.uid()
    and sa.assignment_date=p_date
  order by se.start_time,se.id;
end;
$$;

revoke all on function public.substitute_day_workspace(date) from public,anon;
grant execute on function public.substitute_day_workspace(date) to authenticated;
