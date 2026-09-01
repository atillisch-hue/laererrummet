create or replace function public.update_meeting_setup_atomic(
  p_meeting_id bigint,
  p_title text,
  p_meeting_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_room_id bigint default null,
  p_status text default 'planned',
  p_student_id bigint default null,
  p_internal_user_ids uuid[] default null,
  p_guardian_user_ids uuid[] default null,
  p_external_name text default null,
  p_external_role text default null,
  p_meeting_leader_user_id uuid default null,
  p_minute_taker_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_school_id bigint;
  v_created_by uuid;
  v_booking_id bigint;
  v_room_name text;
  v_invalid integer;
  v_staff_ids uuid[];
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select school_id,created_by into v_school_id,v_created_by
  from public.calendar_meetings where id=p_meeting_id;
  if v_school_id is null then raise exception 'Meeting not found'; end if;
  if not public.can_edit_meeting(p_meeting_id) then raise exception 'Access denied'; end if;

  if trim(coalesce(p_title,''))='' or trim(coalesce(p_meeting_type,''))='' then
    raise exception 'Title and meeting type are required';
  end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then
    raise exception 'Meeting end must be after start';
  end if;

  if p_room_id is not null then
    select name into v_room_name from public.school_rooms where id=p_room_id and school_id=v_school_id and active=true;
    if v_room_name is null then raise exception 'Room does not belong to the school or is inactive'; end if;
  end if;

  if p_student_id is not null and not exists(
    select 1 from public.students s join public.classes c on c.id=s.class_id
    where s.id=p_student_id and c.school_id=v_school_id
  ) then raise exception 'Student does not belong to the school'; end if;

  if p_internal_user_ids is not null and cardinality(p_internal_user_ids)>0 then
    select count(*) into v_invalid from unnest(p_internal_user_ids) x(user_id)
    where not exists(
      select 1 from public.school_memberships sm
      where sm.school_id=v_school_id and sm.user_id=x.user_id and sm.active=true and sm.role in ('teacher','admin','leader')
    );
    if v_invalid>0 then raise exception 'All internal participants must be active school staff'; end if;
  end if;

  if p_guardian_user_ids is not null and cardinality(p_guardian_user_ids)>0 then
    if p_student_id is null then raise exception 'Guardian participants require a student'; end if;
    select count(*) into v_invalid from unnest(p_guardian_user_ids) x(user_id)
    where not exists(
      select 1 from public.parent_students ps
      join public.school_memberships sm on sm.user_id=ps.parent_id and sm.school_id=v_school_id and sm.role='parent' and sm.active=true
      where ps.student_id=p_student_id and ps.parent_id=x.user_id
    );
    if v_invalid>0 then raise exception 'All guardians must be linked to the selected student'; end if;
  end if;

  v_staff_ids:=array(select distinct x from unnest(array_append(coalesce(p_internal_user_ids,array[]::uuid[]),v_created_by)) x where x is not null);

  if p_meeting_leader_user_id is not null and not (p_meeting_leader_user_id=any(v_staff_ids)) then
    raise exception 'Meeting leader must be booked staff';
  end if;
  if p_minute_taker_user_id is not null and not (p_minute_taker_user_id=any(v_staff_ids)) then
    raise exception 'Minute taker must be booked staff';
  end if;

  select id into v_booking_id from public.resource_bookings where meeting_id=p_meeting_id order by id limit 1;

  if exists(
    select 1 from public.check_resource_booking_conflicts(p_starts_at,p_ends_at,p_room_id,v_staff_ids,v_booking_id)
  ) then raise exception 'Meeting conflicts with an existing room or staff booking'; end if;

  update public.calendar_meetings
  set title=trim(p_title),meeting_type=trim(p_meeting_type),starts_at=p_starts_at,ends_at=p_ends_at,
      location=v_room_name,status=coalesce(nullif(trim(p_status),''),'planned'),student_id=p_student_id,
      meeting_leader_user_id=p_meeting_leader_user_id,minute_taker_user_id=p_minute_taker_user_id,
      updated_at=now()
  where id=p_meeting_id;

  if v_booking_id is null then
    insert into public.resource_bookings(title,starts_at,ends_at,room_id,meeting_id,created_by,school_id)
    values(trim(p_title),p_starts_at,p_ends_at,p_room_id,p_meeting_id,v_created_by,v_school_id)
    returning id into v_booking_id;
  else
    update public.resource_bookings
    set title=trim(p_title),starts_at=p_starts_at,ends_at=p_ends_at,room_id=p_room_id,updated_at=now()
    where id=v_booking_id;
  end if;

  delete from public.resource_booking_staff where booking_id=v_booking_id;
  insert into public.resource_booking_staff(booking_id,user_id)
  select v_booking_id,x from unnest(v_staff_ids) x;

  delete from public.meeting_participants where meeting_id=p_meeting_id;

  insert into public.meeting_participants(meeting_id,user_id,attendance_status,access_type)
  select p_meeting_id,x,'invited','internal'
  from unnest(coalesce(p_internal_user_ids,array[]::uuid[])) x
  where x<>v_created_by;

  insert into public.meeting_participants(meeting_id,user_id,attendance_status,access_type)
  select p_meeting_id,x,'invited','guardian'
  from unnest(coalesce(p_guardian_user_ids,array[]::uuid[])) x;

  if nullif(trim(coalesce(p_external_name,'')),'') is not null then
    insert into public.meeting_participants(meeting_id,external_name,external_role,attendance_status,access_type)
    values(p_meeting_id,trim(p_external_name),nullif(trim(coalesce(p_external_role,'')),''),'invited','external');
  end if;
end;
$$;

revoke all on function public.update_meeting_setup_atomic(bigint,text,text,timestamptz,timestamptz,bigint,text,bigint,uuid[],uuid[],text,text,uuid,uuid) from public,anon;
grant execute on function public.update_meeting_setup_atomic(bigint,text,text,timestamptz,timestamptz,bigint,text,bigint,uuid[],uuid[],text,text,uuid,uuid) to authenticated,service_role;
