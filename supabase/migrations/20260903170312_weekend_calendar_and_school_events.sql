alter table public.school_settings
  add column if not exists calendar_events jsonb not null default '[]'::jsonb;

alter table public.school_settings
  drop constraint if exists school_settings_calendar_events_array;

alter table public.school_settings
  add constraint school_settings_calendar_events_array
  check (jsonb_typeof(calendar_events) = 'array');

alter table public.schedule_entries
  drop constraint if exists schedule_entries_weekday_check;

alter table public.schedule_entries
  add constraint schedule_entries_weekday_check
  check (weekday between 0 and 6);

create or replace function public.admin_update_schedule_entry(
  p_entry_id bigint,
  p_class_id bigint,
  p_weekday integer,
  p_start_time time without time zone,
  p_end_time time without time zone,
  p_subject text,
  p_entry_kind text,
  p_room text,
  p_teacher_ids uuid[],
  p_recurrence_pattern text default 'weekly'::text
)
returns void
language plpgsql
security definer
set search_path to 'public','private'
as $$
declare
  v_current_school_id bigint;
  v_target_school_id bigint;
  v_invalid_teachers integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_subject is null or trim(p_subject)='' then raise exception 'Subject or activity is required'; end if;
  if p_weekday not between 0 and 6 then raise exception 'Weekday must be between 0 and 6'; end if;
  if p_start_time >= p_end_time then raise exception 'End time must be after start time'; end if;
  if p_entry_kind not in ('lesson','assembly','break','duty','other') then raise exception 'Invalid schedule entry kind'; end if;
  if coalesce(p_recurrence_pattern,'weekly') not in ('weekly','odd','even') then raise exception 'Invalid recurrence pattern'; end if;
  if p_teacher_ids is null or cardinality(p_teacher_ids)=0 then raise exception 'At least one teacher is required'; end if;

  select c.school_id into v_current_school_id
  from public.schedule_entries se join public.classes c on c.id=se.class_id
  where se.id=p_entry_id;
  if v_current_school_id is null then raise exception 'Schedule entry not found'; end if;

  select c.school_id into v_target_school_id from public.classes c where c.id=p_class_id;
  if v_target_school_id is null or v_target_school_id<>v_current_school_id then raise exception 'Schedule entry cannot be moved across schools'; end if;
  if not public.has_school_role(v_current_school_id,'admin') then raise exception 'Admin access required'; end if;

  select count(*) into v_invalid_teachers
  from unnest(p_teacher_ids) as t(user_id)
  where not exists (
    select 1 from public.school_memberships sm
    where sm.school_id=v_current_school_id and sm.user_id=t.user_id and sm.role='teacher' and sm.active=true
  );
  if v_invalid_teachers>0 then raise exception 'All selected teachers must be active teachers at the school'; end if;

  update public.schedule_entries
  set class_id=p_class_id, weekday=p_weekday, start_time=p_start_time, end_time=p_end_time,
      subject=trim(p_subject), entry_kind=p_entry_kind,
      room=nullif(trim(coalesce(p_room,'')),''), recurrence_pattern=coalesce(p_recurrence_pattern,'weekly')
  where id=p_entry_id;

  delete from public.schedule_teachers where schedule_entry_id=p_entry_id;
  insert into public.schedule_teachers(schedule_entry_id,teacher_id)
  select p_entry_id,user_id from (select distinct unnest(p_teacher_ids) as user_id) x;
end;
$$;
