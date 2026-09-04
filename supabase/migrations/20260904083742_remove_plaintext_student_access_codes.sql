drop function if exists public.get_student_training_progress(text);
drop function if exists public.save_student_draft(text,bigint,jsonb);
drop function if exists public.save_student_grammar_attempt(text,bigint,jsonb,integer,integer);
drop function if exists public.save_student_training_attempt(text,text,text,text,text,jsonb,integer,integer);
drop function if exists public.student_data(text);
drop function if exists public.student_feedback(text);
drop function if exists public.student_grammar_assignments(text);
drop function if exists public.student_login(text);

create or replace function public.admin_create_student(
  p_school_id bigint,
  p_class_id bigint,
  p_name text,
  p_access_code text,
  p_grade_level smallint default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_student_id bigint;
  v_code text;
  v_hash text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if not exists (
    select 1 from public.school_memberships sm
    where sm.user_id=(select auth.uid())
      and sm.school_id=p_school_id
      and sm.role='admin'
      and sm.active=true
  ) then
    raise exception 'Admin access required';
  end if;
  if not exists (
    select 1 from public.classes c
    where c.id=p_class_id and c.school_id=p_school_id
  ) then
    raise exception 'Class does not belong to this school';
  end if;
  if nullif(trim(p_name),'') is null then
    raise exception 'Student name is required';
  end if;
  if p_grade_level is not null and (p_grade_level < 0 or p_grade_level > 10) then
    raise exception 'Invalid grade level';
  end if;

  v_code := upper(trim(coalesce(p_access_code,'')));
  if v_code !~ '^[A-HJ-NP-Z2-9]{12,32}$' then
    raise exception 'Student access code must be 12-32 characters from the approved alphabet';
  end if;
  v_hash := encode(extensions.digest(v_code,'sha256'),'hex');
  if exists(select 1 from private.student_access_credentials where access_code_hash=v_hash) then
    raise exception 'Student access code collision';
  end if;

  insert into public.students(class_id,name,grade_level)
  values(p_class_id,trim(p_name),p_grade_level)
  returning id into v_student_id;

  insert into private.student_access_credentials(student_id,access_code_hash,code_length,needs_rotation)
  values(v_student_id,v_hash,length(v_code),false);

  return jsonb_build_object('ok',true,'student_id',v_student_id);
end;
$$;

revoke all on function public.admin_create_student(bigint,bigint,text,text,smallint) from public, anon;
grant execute on function public.admin_create_student(bigint,bigint,text,text,smallint) to authenticated, service_role;

create or replace function public.admin_rotate_student_access_code(
  p_student_id bigint,
  p_access_code text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_school_id bigint;
  v_code text;
  v_hash text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select c.school_id into v_school_id
  from public.students s
  join public.classes c on c.id=s.class_id
  where s.id=p_student_id;

  if v_school_id is null or not exists (
    select 1 from public.school_memberships sm
    where sm.user_id=(select auth.uid())
      and sm.school_id=v_school_id
      and sm.role='admin'
      and sm.active=true
  ) then
    raise exception 'Admin access required';
  end if;

  v_code := upper(trim(coalesce(p_access_code,'')));
  if v_code !~ '^[A-HJ-NP-Z2-9]{12,32}$' then
    raise exception 'Student access code must be 12-32 characters from the approved alphabet';
  end if;
  v_hash := encode(extensions.digest(v_code,'sha256'),'hex');

  if exists(
    select 1 from private.student_access_credentials
    where access_code_hash=v_hash and student_id<>p_student_id
  ) then
    raise exception 'Student access code collision';
  end if;

  insert into private.student_access_credentials(student_id,access_code_hash,code_length,needs_rotation,updated_at)
  values(p_student_id,v_hash,length(v_code),false,now())
  on conflict(student_id) do update set
    access_code_hash=excluded.access_code_hash,
    code_length=excluded.code_length,
    needs_rotation=false,
    updated_at=now();

  update private.student_sessions set revoked_at=now()
  where student_id=p_student_id and revoked_at is null;

  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.admin_rotate_student_access_code(bigint,text) from public, anon;
grant execute on function public.admin_rotate_student_access_code(bigint,text) to authenticated, service_role;

alter table public.students drop column access_code;
