drop function if exists public.create_meeting_atomic(text,text,timestamptz,timestamptz,bigint,bigint,uuid[],uuid[],text,text,uuid,uuid);

create function public.create_meeting_atomic(
  p_title text,
  p_meeting_type text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_room_id bigint default null,
  p_student_id bigint default null,
  p_internal_user_ids uuid[] default null,
  p_guardian_user_ids uuid[] default null,
  p_external_name text default null,
  p_external_role text default null,
  p_meeting_leader_user_id uuid default null,
  p_minute_taker_user_id uuid default null,
  p_agenda text default null,
  p_internal_notes text default null
) returns bigint
language plpgsql
security definer
set search_path to 'public','private'
as $function$
declare
  v_user_id uuid:=auth.uid();
  v_school_id bigint;
  v_related_school bigint;
  v_room_name text;
  v_meeting_id bigint;
  v_booking_id bigint;
  v_staff_ids uuid[];
  v_invalid integer;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if trim(coalesce(p_title,''))='' then raise exception 'Mødet skal have en titel'; end if;
  if p_meeting_type is null or p_meeting_type not in ('Elevmøde','Netværksmøde','Teammøde','Personalemøde','Bestyrelsesmøde','AMR/TR-møde','Andet') then raise exception 'Ugyldig mødetype'; end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then raise exception 'Sluttidspunktet skal ligge efter starttidspunktet'; end if;

  if p_student_id is not null then
    select c.school_id into v_related_school from public.students s join public.classes c on c.id=s.class_id where s.id=p_student_id;
    if v_related_school is null then raise exception 'Elevens skole kunne ikke bestemmes'; end if;
    v_school_id:=v_related_school;
  end if;

  if p_room_id is not null then
    select sr.school_id,sr.name into v_related_school,v_room_name from public.school_rooms sr where sr.id=p_room_id and sr.active=true;
    if v_related_school is null then raise exception 'Lokalet findes ikke eller er inaktivt'; end if;
    if v_school_id is not null and v_school_id<>v_related_school then raise exception 'Elev og lokale tilhører ikke samme skole'; end if;
    v_school_id:=v_related_school;
  end if;

  if v_school_id is null then v_school_id:=public.resolve_single_active_school(v_user_id,array['teacher','admin']); end if;
  if v_school_id is null then raise exception 'Skolen kunne ikke bestemmes entydigt'; end if;
  if not public.is_school_staff(v_school_id) then raise exception 'Kun aktive medarbejdere kan oprette møder'; end if;

  if p_student_id is not null and not exists(select 1 from public.students s join public.classes c on c.id=s.class_id where s.id=p_student_id and c.school_id=v_school_id) then raise exception 'Eleven tilhører ikke skolen'; end if;

  if p_internal_user_ids is not null and cardinality(p_internal_user_ids)>0 then
    select count(*) into v_invalid from unnest(p_internal_user_ids) x(user_id)
    where not exists(select 1 from public.school_memberships sm where sm.school_id=v_school_id and sm.user_id=x.user_id and sm.active=true and sm.role in ('teacher','admin','board'));
    if v_invalid>0 then raise exception 'Alle interne deltagere skal have aktiv adgang til skolen'; end if;
  end if;

  if p_guardian_user_ids is not null and cardinality(p_guardian_user_ids)>0 then
    if p_student_id is null then raise exception 'Forældredeltagere kræver en valgt elev'; end if;
    select count(*) into v_invalid from unnest(p_guardian_user_ids) x(user_id)
    where not exists(select 1 from public.parent_students ps join public.school_memberships sm on sm.user_id=ps.parent_id and sm.school_id=v_school_id and sm.role='parent' and sm.active=true where ps.student_id=p_student_id and ps.parent_id=x.user_id);
    if v_invalid>0 then raise exception 'Alle valgte forældre skal være koblet til eleven'; end if;
  end if;

  select array_agg(distinct x) into v_staff_ids from unnest(array_append(coalesce(p_internal_user_ids,array[]::uuid[]),v_user_id)) x where x is not null;
  if p_meeting_leader_user_id is not null and not (p_meeting_leader_user_id=any(v_staff_ids)) then raise exception 'Mødelederen skal være booket til mødet'; end if;
  if p_minute_taker_user_id is not null and not (p_minute_taker_user_id=any(v_staff_ids)) then raise exception 'Referenten skal være booket til mødet'; end if;

  if exists(select 1 from public.resource_bookings rb left join public.resource_booking_staff rbs on rbs.booking_id=rb.id where rb.school_id=v_school_id and rb.starts_at<p_ends_at and rb.ends_at>p_starts_at and ((p_room_id is not null and rb.room_id=p_room_id) or rbs.user_id=any(v_staff_ids))) then raise exception 'Tidspunktet kolliderer med et booket lokale eller en booket deltager'; end if;

  insert into public.calendar_meetings(title,meeting_type,starts_at,ends_at,location,agenda,internal_notes,status,created_by,student_id,meeting_leader_user_id,minute_taker_user_id,school_id)
  values(trim(p_title),p_meeting_type,p_starts_at,p_ends_at,v_room_name,nullif(trim(coalesce(p_agenda,'')),''),nullif(trim(coalesce(p_internal_notes,'')),''),'planned',v_user_id,p_student_id,p_meeting_leader_user_id,p_minute_taker_user_id,v_school_id)
  returning id into v_meeting_id;

  insert into public.resource_bookings(title,starts_at,ends_at,room_id,meeting_id,created_by,school_id) values(trim(p_title),p_starts_at,p_ends_at,p_room_id,v_meeting_id,v_user_id,v_school_id) returning id into v_booking_id;
  insert into public.resource_booking_staff(booking_id,user_id) select v_booking_id,x from unnest(v_staff_ids) x;
  insert into public.meeting_participants(meeting_id,user_id,attendance_status,access_type) select v_meeting_id,x,'invited','internal' from (select distinct x from unnest(coalesce(p_internal_user_ids,array[]::uuid[])) x) q where x<>v_user_id;
  insert into public.meeting_participants(meeting_id,user_id,attendance_status,access_type) select v_meeting_id,x,'invited','guardian' from (select distinct x from unnest(coalesce(p_guardian_user_ids,array[]::uuid[])) x) q;
  if nullif(trim(coalesce(p_external_name,'')),'') is not null then insert into public.meeting_participants(meeting_id,external_name,external_role,attendance_status,access_type) values(v_meeting_id,trim(p_external_name),nullif(trim(coalesce(p_external_role,'')),''),'invited','external'); end if;
  return v_meeting_id;
end;
$function$;

revoke all on function public.create_meeting_atomic(text,text,timestamptz,timestamptz,bigint,bigint,uuid[],uuid[],text,text,uuid,uuid,text,text) from public, anon;
grant execute on function public.create_meeting_atomic(text,text,timestamptz,timestamptz,bigint,bigint,uuid[],uuid[],text,text,uuid,uuid,text,text) to authenticated, service_role;
