alter table public.substitute_assignments
  add column if not exists handover_done text null,
  add column if not exists handover_not_done text null,
  add column if not exists handover_note text null,
  add column if not exists handover_updated_at timestamptz null;

drop function if exists public.substitute_day_workspace(date);
drop function if exists private.substitute_day_workspace_core(date);

create or replace function private.substitute_day_workspace_core(p_date date default current_date)
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
  resource_count bigint,
  handover_done text,
  handover_not_done text,
  handover_note text,
  handover_updated_at timestamptz
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
         coalesce((select count(*) from public.lesson_resource_links lrl where lrl.lesson_instance_id=li.id),0)::bigint,
         sa.handover_done,sa.handover_not_done,sa.handover_note,sa.handover_updated_at
  from public.substitute_assignments sa
  join public.schedule_entries se on se.id=sa.schedule_entry_id
  join public.classes c on c.id=se.class_id and c.school_id=sa.school_id
  left join public.lesson_instances li on li.schedule_entry_id=se.id and li.lesson_date=sa.assignment_date
  left join public.subject_units su on su.id=li.subject_unit_id
  where sa.substitute_teacher_id=auth.uid()
    and sa.assignment_date=p_date
    and exists (
      select 1 from public.school_memberships sm
      where sm.school_id=sa.school_id
        and sm.user_id=auth.uid()
        and sm.active=true
        and sm.role in ('teacher','admin')
    )
  order by se.start_time,se.id;
end;
$$;

revoke all on function private.substitute_day_workspace_core(date) from public,anon;
grant execute on function private.substitute_day_workspace_core(date) to authenticated;

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
  resource_count bigint,
  handover_done text,
  handover_not_done text,
  handover_note text,
  handover_updated_at timestamptz
)
language sql
security invoker
set search_path to 'public','private'
as $$
  select * from private.substitute_day_workspace_core(p_date);
$$;

revoke all on function public.substitute_day_workspace(date) from public,anon;
grant execute on function public.substitute_day_workspace(date) to authenticated;

create or replace function private.save_substitute_handover_core(
  p_assignment_id bigint,
  p_done text,
  p_not_done text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path to 'public','private'
as $$
declare
  v_school_id bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_assignment_id is null then raise exception 'Assignment is required'; end if;
  if char_length(coalesce(p_done,'')) > 5000
     or char_length(coalesce(p_not_done,'')) > 5000
     or char_length(coalesce(p_note,'')) > 5000 then
    raise exception 'Handover fields may contain at most 5000 characters each';
  end if;

  select sa.school_id into v_school_id
  from public.substitute_assignments sa
  where sa.id=p_assignment_id
    and sa.substitute_teacher_id=auth.uid();

  if v_school_id is null then raise exception 'Substitute assignment not found or access denied'; end if;

  if not exists (
    select 1 from public.school_memberships sm
    where sm.school_id=v_school_id
      and sm.user_id=auth.uid()
      and sm.active=true
      and sm.role in ('teacher','admin')
  ) then
    raise exception 'Active staff membership required';
  end if;

  update public.substitute_assignments
  set handover_done=nullif(trim(coalesce(p_done,'')),''),
      handover_not_done=nullif(trim(coalesce(p_not_done,'')),''),
      handover_note=nullif(trim(coalesce(p_note,'')),''),
      handover_updated_at=now()
  where id=p_assignment_id
    and substitute_teacher_id=auth.uid();
end;
$$;

revoke all on function private.save_substitute_handover_core(bigint,text,text,text) from public,anon;
grant execute on function private.save_substitute_handover_core(bigint,text,text,text) to authenticated;

create or replace function public.save_substitute_handover(
  p_assignment_id bigint,
  p_done text default null,
  p_not_done text default null,
  p_note text default null
)
returns void
language sql
security invoker
set search_path to 'public','private'
as $$
  select private.save_substitute_handover_core(p_assignment_id,p_done,p_not_done,p_note);
$$;

revoke all on function public.save_substitute_handover(bigint,text,text,text) from public,anon;
grant execute on function public.save_substitute_handover(bigint,text,text,text) to authenticated;
