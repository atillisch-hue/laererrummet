create table if not exists private.student_login_attempts (
  id bigint generated always as identity primary key,
  ip inet not null,
  attempted_at timestamptz not null default now()
);

create index if not exists student_login_attempts_ip_attempted_at_idx
  on private.student_login_attempts (ip, attempted_at desc);

revoke all on table private.student_login_attempts from public, anon, authenticated;

create unique index if not exists students_access_code_upper_unique_idx
  on public.students (upper(access_code))
  where access_code is not null;

create or replace function public.student_start_session(p_access_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  s public.students;
  v_token text;
  v_hash text;
  v_expires timestamptz;
  v_ip_text text;
  v_ip inet;
  v_failures integer := 0;
begin
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

  if v_ip is not null then
    delete from private.student_login_attempts
    where ip = v_ip
      and attempted_at < now() - interval '1 day';

    select count(*)
      into v_failures
    from private.student_login_attempts
    where ip = v_ip
      and attempted_at >= now() - interval '5 minutes';

    if v_failures >= 30 then
      return jsonb_build_object('ok', false, 'error', 'rate_limited');
    end if;
  end if;

  select * into s
  from public.students
  where upper(access_code) = upper(trim(p_access_code))
  limit 1;

  if s.id is null then
    if v_ip is not null then
      insert into private.student_login_attempts(ip) values(v_ip);
    end if;
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

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

revoke all on function public.student_data(text) from public, anon, authenticated;
revoke all on function public.student_feedback(text) from public, anon, authenticated;
revoke all on function public.student_grammar_assignments(text) from public, anon, authenticated;
revoke all on function public.student_login(text) from public, anon, authenticated;
revoke all on function public.save_student_draft(text,bigint,jsonb) from public, anon, authenticated;
revoke all on function public.save_student_grammar_attempt(text,bigint,jsonb,integer,integer) from public, anon, authenticated;
revoke all on function public.save_student_training_attempt(text,text,text,text,text,jsonb,integer,integer) from public, anon, authenticated;
revoke all on function public.get_student_training_progress(text) from public, anon, authenticated;

revoke all on function public.student_start_session(text) from public;
grant execute on function public.student_start_session(text) to anon, authenticated;

grant execute on function public.student_session_data(text) to anon, authenticated;
grant execute on function public.student_session_feedback(text) to anon, authenticated;
grant execute on function public.student_session_grammar_assignments(text) to anon, authenticated;
grant execute on function public.save_student_draft_session(text,bigint,jsonb) to anon, authenticated;
grant execute on function public.save_student_grammar_attempt_session(text,bigint,jsonb,integer,integer) to anon, authenticated;
grant execute on function public.save_student_training_attempt_session(text,text,text,text,text,jsonb,integer,integer) to anon, authenticated;
grant execute on function public.get_student_training_progress_session(text) to anon, authenticated;
grant execute on function public.student_end_session(text) to anon, authenticated;
