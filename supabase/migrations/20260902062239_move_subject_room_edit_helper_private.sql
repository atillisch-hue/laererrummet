alter function public.can_edit_class_subject(bigint) set schema private;
alter function private.can_edit_class_subject(bigint) set search_path = 'public', 'private';

create or replace function private.validate_assignment_subject_room()
returns trigger
language plpgsql
security definer
set search_path = 'public', 'private'
as $$
declare v_room_class bigint;
begin
  if new.class_subject_id is null then return new; end if;

  select cs.class_id into v_room_class
  from public.class_subjects cs
  where cs.id=new.class_subject_id and cs.active=true;

  if v_room_class is null or v_room_class<>new.class_id then
    raise exception 'Assignment subject room must belong to the assignment class';
  end if;

  if not private.can_edit_class_subject(new.class_subject_id) then
    raise exception 'You cannot link an assignment to a subject room you cannot edit';
  end if;

  return new;
end;
$$;

create or replace function public.class_subject_teacher_directory(p_class_subject_id bigint)
returns table(user_id uuid, display_name text, selected boolean)
language plpgsql
stable
security definer
set search_path = 'public', 'private'
as $$
declare v_school_id bigint;
begin
  select cs.school_id into v_school_id from public.class_subjects cs where cs.id=p_class_subject_id and cs.active=true;
  if v_school_id is null then raise exception 'Faglokalet findes ikke'; end if;
  if not private.can_edit_class_subject(p_class_subject_id) then raise exception 'Du kan ikke redigere dette faglokale'; end if;

  return query
  select sm.user_id,
         coalesce(nullif(trim(up.display_name),''),'Lærer')::text as display_name,
         exists(select 1 from public.class_subject_teachers cst where cst.class_subject_id=p_class_subject_id and cst.user_id=sm.user_id) as selected
  from public.school_memberships sm
  left join public.user_profiles up on up.user_id=sm.user_id
  where sm.school_id=v_school_id and sm.role='teacher' and sm.active=true
  order by coalesce(nullif(trim(up.display_name),''),'Lærer'),sm.user_id;
end;
$$;

create or replace function public.update_class_subject_teachers(p_class_subject_id bigint, p_teacher_ids uuid[])
returns void
language plpgsql
security definer
set search_path = 'public', 'private'
as $$
declare v_school_id bigint; v_expected int; v_valid int;
begin
  select cs.school_id into v_school_id from public.class_subjects cs where cs.id=p_class_subject_id and cs.active=true;
  if v_school_id is null then raise exception 'Faglokalet findes ikke'; end if;
  if not private.can_edit_class_subject(p_class_subject_id) then raise exception 'Du kan ikke redigere dette faglokale'; end if;
  if p_teacher_ids is null or cardinality(p_teacher_ids)=0 then raise exception 'Faglokalet skal have mindst én faglærer'; end if;

  select count(distinct x) into v_expected from unnest(p_teacher_ids) x;
  select count(distinct sm.user_id) into v_valid
  from public.school_memberships sm
  where sm.school_id=v_school_id and sm.role='teacher' and sm.active=true and sm.user_id=any(p_teacher_ids);
  if v_expected<>v_valid then raise exception 'Alle valgte faglærere skal være aktive lærere på skolen'; end if;

  delete from public.class_subject_teachers where class_subject_id=p_class_subject_id;
  insert into public.class_subject_teachers(class_subject_id,user_id)
  select p_class_subject_id,x from (select distinct unnest(p_teacher_ids) x) q;
end;
$$;
