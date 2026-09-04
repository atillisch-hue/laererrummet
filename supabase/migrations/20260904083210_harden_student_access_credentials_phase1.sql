create table if not exists private.student_access_credentials (
  student_id bigint primary key references public.students(id) on delete cascade,
  access_code_hash text not null unique,
  code_length smallint not null check (code_length between 6 and 64),
  needs_rotation boolean not null default false,
  updated_at timestamptz not null default now()
);

revoke all on table private.student_access_credentials from public, anon, authenticated;

insert into private.student_access_credentials(student_id, access_code_hash, code_length, needs_rotation)
select
  s.id,
  encode(extensions.digest(upper(trim(s.access_code)), 'sha256'), 'hex'),
  length(trim(s.access_code)),
  length(trim(s.access_code)) < 12
from public.students s
where s.access_code is not null and trim(s.access_code) <> ''
on conflict (student_id) do update set
  access_code_hash = excluded.access_code_hash,
  code_length = excluded.code_length,
  needs_rotation = excluded.needs_rotation,
  updated_at = now();

alter table private.student_login_attempts
  add column if not exists code_hash text;

alter table private.student_login_attempts
  alter column ip drop not null;

create index if not exists student_login_attempts_ip_recent_idx
  on private.student_login_attempts(ip, attempted_at desc)
  where ip is not null;

create index if not exists student_login_attempts_code_recent_idx
  on private.student_login_attempts(code_hash, attempted_at desc)
  where code_hash is not null;

create or replace function public.student_start_session(p_access_code text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private','extensions'
as $$
declare
  s public.students;
  v_normalized_code text;
  v_code_hash text;
  v_token text;
  v_hash text;
  v_expires timestamptz;
  v_ip_text text;
  v_ip inet;
  v_ip_failures integer := 0;
  v_code_failures integer := 0;
begin
  v_normalized_code := upper(trim(coalesce(p_access_code,'')));
  if length(v_normalized_code) < 6 or length(v_normalized_code) > 64 then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  v_code_hash := encode(extensions.digest(v_normalized_code,'sha256'),'hex');

  v_ip_text := split_part(
    coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
    ',',
    1
  );

  begin
    v_ip := nullif(trim(v_ip_text), '')::inet;
  exception when others then
    v_ip := null;
  end;

  delete from private.student_login_attempts
  where attempted_at < now() - interval '1 day';

  if v_ip is not null then
    select count(*) into v_ip_failures
    from private.student_login_attempts
    where ip = v_ip
      and attempted_at >= now() - interval '5 minutes';
  end if;

  select count(*) into v_code_failures
  from private.student_login_attempts
  where code_hash = v_code_hash
    and attempted_at >= now() - interval '15 minutes';

  if v_ip_failures >= 30 or v_code_failures >= 10 then
    return jsonb_build_object('ok', false, 'error', 'rate_limited');
  end if;

  select st.* into s
  from private.student_access_credentials cred
  join public.students st on st.id = cred.student_id
  where cred.access_code_hash = v_code_hash
  limit 1;

  if s.id is null then
    insert into private.student_login_attempts(ip, code_hash)
    values(v_ip, v_code_hash);
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  delete from private.student_login_attempts
  where code_hash = v_code_hash;

  delete from private.student_sessions
  where student_id = s.id
    and (expires_at <= now() or revoked_at is not null);

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');
  v_expires := now() + interval '12 hours';

  insert into private.student_sessions(student_id, token_hash, expires_at)
  values(s.id, v_hash, v_expires);

  return jsonb_build_object(
    'ok', true,
    'session_token', v_token,
    'expires_at', v_expires,
    'student_id', s.id,
    'student_name', s.name,
    'class_id', s.class_id
  );
end;
$$;

revoke all on function public.student_start_session(text) from public, authenticated;
grant execute on function public.student_start_session(text) to anon, service_role;

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

  insert into public.students(class_id,name,grade_level,access_code)
  values(p_class_id,trim(p_name),p_grade_level,null)
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

  update public.students set access_code=null where id=p_student_id;
  update private.student_sessions set revoked_at=now()
  where student_id=p_student_id and revoked_at is null;

  return jsonb_build_object('ok',true);
end;
$$;

revoke all on function public.admin_rotate_student_access_code(bigint,text) from public, anon;
grant execute on function public.admin_rotate_student_access_code(bigint,text) to authenticated, service_role;

create or replace function public.admin_student_access_status(p_school_id bigint)
returns table(student_id bigint, needs_rotation boolean, code_length smallint, updated_at timestamptz)
language sql
stable
security definer
set search_path to ''
as $$
  select s.id, coalesce(cred.needs_rotation,true), cred.code_length, cred.updated_at
  from public.students s
  join public.classes c on c.id=s.class_id
  left join private.student_access_credentials cred on cred.student_id=s.id
  where c.school_id=p_school_id
    and exists (
      select 1 from public.school_memberships me
      where me.user_id=(select auth.uid())
        and me.school_id=p_school_id
        and me.role='admin'
        and me.active=true
    )
  order by s.id;
$$;

revoke all on function public.admin_student_access_status(bigint) from public, anon;
grant execute on function public.admin_student_access_status(bigint) to authenticated, service_role;
