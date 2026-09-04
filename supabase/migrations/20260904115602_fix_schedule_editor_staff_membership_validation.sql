create or replace function private.is_active_school_staff_member(p_school_id bigint,p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.school_memberships sm
    where sm.school_id=p_school_id
      and sm.user_id=p_user_id
      and sm.active=true
      and sm.role in ('teacher','staff','admin','leader')
  );
$$;
revoke all on function private.is_active_school_staff_member(bigint,uuid) from public,anon;
grant execute on function private.is_active_school_staff_member(bigint,uuid) to authenticated;

create or replace function public.admin_create_schedule_entry_v2(
  p_schedule_version_id bigint,
  p_class_id bigint,
  p_weekday integer,
  p_start_time time without time zone,
  p_end_time time without time zone,
  p_subject text,
  p_entry_kind text,
  p_room text,
  p_teacher_ids uuid[],
  p_recurrence_pattern text,
  p_class_subject_id bigint
)
returns bigint
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_school_id bigint;
  v_version_status text;
  v_subject text;
  v_invalid_teachers integer;
  v_entry_id bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_weekday not between 0 and 6 then raise exception 'Weekday must be between 0 and 6'; end if;
  if p_start_time>=p_end_time then raise exception 'End time must be after start time'; end if;
  if p_entry_kind not in ('lesson','assembly','break','duty','other') then raise exception 'Invalid schedule entry kind'; end if;
  if coalesce(p_recurrence_pattern,'weekly') not in ('weekly','odd','even') then raise exception 'Invalid recurrence pattern'; end if;

  select sy.school_id,sv.status into v_school_id,v_version_status
  from public.school_schedule_versions sv
  join public.school_years sy on sy.id=sv.school_year_id
  where sv.id=p_schedule_version_id;
  if v_school_id is null then raise exception 'Schedule version not found'; end if;
  if v_version_status<>'draft' then raise exception 'Only draft schedule versions can be edited'; end if;
  if not (public.has_school_role(v_school_id,'admin') or public.has_school_role(v_school_id,'leader')) then raise exception 'Leadership access required'; end if;
  if not exists(select 1 from public.classes c where c.id=p_class_id and c.school_id=v_school_id) then raise exception 'Class does not belong to this school'; end if;

  if p_entry_kind='lesson' then
    if p_class_subject_id is null then raise exception 'A lesson must be linked to a class subject'; end if;
    select cs.title into v_subject
    from public.class_subjects cs
    where cs.id=p_class_subject_id and cs.class_id=p_class_id and cs.active=true;
    if v_subject is null then raise exception 'Class subject does not belong to the selected class'; end if;
  else
    if p_subject is null or trim(p_subject)='' then raise exception 'Activity title is required'; end if;
    v_subject=trim(p_subject);
    p_class_subject_id=null;
  end if;

  if p_entry_kind<>'break' and coalesce(cardinality(p_teacher_ids),0)=0 then raise exception 'At least one staff member is required'; end if;
  select count(*) into v_invalid_teachers
  from unnest(coalesce(p_teacher_ids,'{}'::uuid[])) as t(user_id)
  where not private.is_active_school_staff_member(v_school_id,t.user_id);
  if v_invalid_teachers>0 then raise exception 'All selected staff members must be active staff at the school'; end if;

  insert into public.schedule_entries(class_id,weekday,start_time,end_time,subject,teacher,room,class_subject_id,entry_kind,recurrence_pattern,schedule_version_id)
  values(p_class_id,p_weekday,p_start_time,p_end_time,v_subject,null,nullif(trim(coalesce(p_room,'')),''),p_class_subject_id,p_entry_kind,coalesce(p_recurrence_pattern,'weekly'),p_schedule_version_id)
  returning id into v_entry_id;

  if coalesce(cardinality(p_teacher_ids),0)>0 then
    insert into public.schedule_teachers(schedule_entry_id,teacher_id)
    select v_entry_id,user_id from (select distinct unnest(p_teacher_ids) as user_id) x;
  end if;

  return v_entry_id;
end;
$$;
revoke all on function public.admin_create_schedule_entry_v2(bigint,bigint,integer,time without time zone,time without time zone,text,text,text,uuid[],text,bigint) from public,anon;
grant execute on function public.admin_create_schedule_entry_v2(bigint,bigint,integer,time without time zone,time without time zone,text,text,text,uuid[],text,bigint) to authenticated;

create or replace function public.admin_update_schedule_entry_v2(
  p_entry_id bigint,
  p_class_id bigint,
  p_weekday integer,
  p_start_time time without time zone,
  p_end_time time without time zone,
  p_subject text,
  p_entry_kind text,
  p_room text,
  p_teacher_ids uuid[],
  p_recurrence_pattern text,
  p_class_subject_id bigint
)
returns void
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_school_id bigint;
  v_version_status text;
  v_subject text;
  v_invalid_teachers integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_weekday not between 0 and 6 then raise exception 'Weekday must be between 0 and 6'; end if;
  if p_start_time>=p_end_time then raise exception 'End time must be after start time'; end if;
  if p_entry_kind not in ('lesson','assembly','break','duty','other') then raise exception 'Invalid schedule entry kind'; end if;
  if coalesce(p_recurrence_pattern,'weekly') not in ('weekly','odd','even') then raise exception 'Invalid recurrence pattern'; end if;

  select c.school_id,sv.status into v_school_id,v_version_status
  from public.schedule_entries se
  join public.classes c on c.id=se.class_id
  join public.school_schedule_versions sv on sv.id=se.schedule_version_id
  where se.id=p_entry_id;
  if v_school_id is null then raise exception 'Schedule entry not found'; end if;
  if v_version_status<>'draft' then raise exception 'Published schedule versions cannot be edited'; end if;
  if not (public.has_school_role(v_school_id,'admin') or public.has_school_role(v_school_id,'leader')) then raise exception 'Leadership access required'; end if;
  if not exists(select 1 from public.classes c where c.id=p_class_id and c.school_id=v_school_id) then raise exception 'Schedule entry cannot be moved across schools'; end if;

  if p_entry_kind='lesson' then
    if p_class_subject_id is null then raise exception 'A lesson must be linked to a class subject'; end if;
    select cs.title into v_subject from public.class_subjects cs where cs.id=p_class_subject_id and cs.class_id=p_class_id and cs.active=true;
    if v_subject is null then raise exception 'Class subject does not belong to the selected class'; end if;
  else
    if p_subject is null or trim(p_subject)='' then raise exception 'Activity title is required'; end if;
    v_subject=trim(p_subject);
    p_class_subject_id=null;
  end if;

  if p_entry_kind<>'break' and coalesce(cardinality(p_teacher_ids),0)=0 then raise exception 'At least one staff member is required'; end if;
  select count(*) into v_invalid_teachers
  from unnest(coalesce(p_teacher_ids,'{}'::uuid[])) as t(user_id)
  where not private.is_active_school_staff_member(v_school_id,t.user_id);
  if v_invalid_teachers>0 then raise exception 'All selected staff members must be active staff at the school'; end if;

  update public.schedule_entries
  set class_id=p_class_id,weekday=p_weekday,start_time=p_start_time,end_time=p_end_time,
      subject=v_subject,class_subject_id=p_class_subject_id,entry_kind=p_entry_kind,
      room=nullif(trim(coalesce(p_room,'')),''),recurrence_pattern=coalesce(p_recurrence_pattern,'weekly')
  where id=p_entry_id;

  delete from public.schedule_teachers where schedule_entry_id=p_entry_id;
  if coalesce(cardinality(p_teacher_ids),0)>0 then
    insert into public.schedule_teachers(schedule_entry_id,teacher_id)
    select p_entry_id,user_id from (select distinct unnest(p_teacher_ids) as user_id) x;
  end if;
end;
$$;
revoke all on function public.admin_update_schedule_entry_v2(bigint,bigint,integer,time without time zone,time without time zone,text,text,text,uuid[],text,bigint) from public,anon;
grant execute on function public.admin_update_schedule_entry_v2(bigint,bigint,integer,time without time zone,time without time zone,text,text,text,uuid[],text,bigint) to authenticated;
