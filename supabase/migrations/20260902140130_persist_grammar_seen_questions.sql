alter table public.grammar_attempts
add column if not exists seen_question_keys text[] not null default '{}'::text[];

create or replace function public.save_student_grammar_attempt_session(
  p_session_token text,
  p_assignment_id bigint,
  p_answers jsonb,
  p_score integer,
  p_max_score integer
)
returns jsonb
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  s public.students;
  saved public.grammar_attempts;
  v_seen_question_keys text[] := '{}'::text[];
begin
  select * into s
  from public.students
  where id=private.student_id_for_session(p_session_token);

  if s.id is null then
    return jsonb_build_object('ok',false,'error','invalid_session');
  end if;

  if p_max_score<=0 or p_score<0 or p_score>p_max_score then
    return jsonb_build_object('ok',false,'error','invalid_score');
  end if;

  if not exists(
    select 1
    from public.grammar_assignments ga
    where ga.id=p_assignment_id
      and ga.class_id=s.class_id
      and (
        not exists(
          select 1
          from public.grammar_assignment_students gas0
          where gas0.grammar_assignment_id=ga.id
        )
        or exists(
          select 1
          from public.grammar_assignment_students gas
          where gas.grammar_assignment_id=ga.id
            and gas.student_id=s.id
        )
      )
  ) then
    return jsonb_build_object('ok',false,'error','assignment_not_available');
  end if;

  select coalesce(array_agg(distinct q.question_key), '{}'::text[])
  into v_seen_question_keys
  from (
    select (entry.value->>'question') || '::' || (entry.value->>'correctAnswer') as question_key
    from jsonb_each(coalesce(p_answers,'{}'::jsonb)) entry
    where coalesce(entry.value->>'question','')<>''
      and coalesce(entry.value->>'correctAnswer','')<>''
  ) q;

  insert into public.grammar_attempts(
    grammar_assignment_id,
    student_id,
    answers,
    score,
    max_score,
    completed_at,
    updated_at,
    attempt_count,
    best_score,
    best_max_score,
    seen_question_keys
  )
  values(
    p_assignment_id,
    s.id,
    coalesce(p_answers,'{}'::jsonb),
    p_score,
    p_max_score,
    now(),
    now(),
    1,
    p_score,
    p_max_score,
    v_seen_question_keys
  )
  on conflict(grammar_assignment_id,student_id)
  do update set
    answers=excluded.answers,
    score=excluded.score,
    max_score=excluded.max_score,
    completed_at=excluded.completed_at,
    updated_at=excluded.updated_at,
    attempt_count=public.grammar_attempts.attempt_count+1,
    best_score=case
      when public.grammar_attempts.best_max_score=0
        or excluded.score::numeric/excluded.max_score>public.grammar_attempts.best_score::numeric/public.grammar_attempts.best_max_score
      then excluded.score
      else public.grammar_attempts.best_score
    end,
    best_max_score=case
      when public.grammar_attempts.best_max_score=0
        or excluded.score::numeric/excluded.max_score>public.grammar_attempts.best_score::numeric/public.grammar_attempts.best_max_score
      then excluded.max_score
      else public.grammar_attempts.best_max_score
    end,
    seen_question_keys=(
      select coalesce(array_agg(distinct x.question_key), '{}'::text[])
      from unnest(public.grammar_attempts.seen_question_keys || excluded.seen_question_keys) as x(question_key)
    )
  returning * into saved;

  return jsonb_build_object(
    'ok',true,
    'score',saved.score,
    'max_score',saved.max_score,
    'attempts',saved.attempt_count,
    'best_score',saved.best_score,
    'best_max_score',saved.best_max_score,
    'completed',saved.best_max_score>0 and saved.best_score=saved.best_max_score,
    'seen_question_keys',saved.seen_question_keys
  );
end;
$$;

create or replace function public.student_session_grammar_assignments(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  s public.students;
begin
  select * into s
  from public.students
  where id=private.student_id_for_session(p_session_token);

  if s.id is null then
    return jsonb_build_object('ok',false,'error','invalid_session');
  end if;

  return jsonb_build_object(
    'ok',true,
    'assignments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',ga.id,
        'area',ga.area,
        'topic',ga.topic,
        'level',ga.level,
        'title',ga.title,
        'attempted',a.student_id is not null,
        'completed',coalesce(a.best_max_score>0 and a.best_score=a.best_max_score,false),
        'score',a.score,
        'max_score',a.max_score,
        'attempts',coalesce(a.attempt_count,0),
        'best_score',a.best_score,
        'best_max_score',a.best_max_score,
        'seen_question_keys',coalesce(a.seen_question_keys,'{}'::text[])
      ) order by ga.created_at desc)
      from public.grammar_assignments ga
      left join public.grammar_attempts a
        on a.grammar_assignment_id=ga.id
       and a.student_id=s.id
      where ga.class_id=s.class_id
        and (
          not exists(
            select 1
            from public.grammar_assignment_students gas0
            where gas0.grammar_assignment_id=ga.id
          )
          or exists(
            select 1
            from public.grammar_assignment_students gas
            where gas.grammar_assignment_id=ga.id
              and gas.student_id=s.id
          )
        )
    ),'[]'::jsonb)
  );
end;
$$;

revoke all on function public.save_student_grammar_attempt_session(text,bigint,jsonb,integer,integer) from public,authenticated;
grant execute on function public.save_student_grammar_attempt_session(text,bigint,jsonb,integer,integer) to anon,service_role;

revoke all on function public.student_session_grammar_assignments(text) from public,authenticated;
grant execute on function public.student_session_grammar_assignments(text) to anon,service_role;
