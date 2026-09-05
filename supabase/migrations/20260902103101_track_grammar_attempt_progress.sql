alter table public.grammar_attempts
  add column if not exists attempt_count integer not null default 1,
  add column if not exists best_score integer not null default 0,
  add column if not exists best_max_score integer not null default 0;

update public.grammar_attempts
set attempt_count=greatest(attempt_count,1),
    best_score=coalesce(score,0),
    best_max_score=coalesce(max_score,0)
where best_max_score=0 and max_score is not null;

create or replace function public.student_session_grammar_assignments(p_session_token text)
returns jsonb language plpgsql security definer set search_path='public','private' as $$
declare s public.students;
begin
  select * into s from public.students where id=private.student_id_for_session(p_session_token);
  if s.id is null then return jsonb_build_object('ok',false,'error','invalid_session'); end if;
  return jsonb_build_object('ok',true,'assignments',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',ga.id,'area',ga.area,'topic',ga.topic,'level',ga.level,'title',ga.title,
      'attempted',a.student_id is not null,
      'completed',coalesce(a.best_max_score>0 and a.best_score=a.best_max_score,false),
      'score',a.score,'max_score',a.max_score,
      'attempts',coalesce(a.attempt_count,0),
      'best_score',a.best_score,'best_max_score',a.best_max_score
    ) order by ga.created_at desc)
    from public.grammar_assignments ga
    left join public.grammar_attempts a on a.grammar_assignment_id=ga.id and a.student_id=s.id
    where ga.class_id=s.class_id
      and (
        not exists(select 1 from public.grammar_assignment_students gas0 where gas0.grammar_assignment_id=ga.id)
        or exists(select 1 from public.grammar_assignment_students gas where gas.grammar_assignment_id=ga.id and gas.student_id=s.id)
      )
  ),'[]'::jsonb));
end; $$;

create or replace function public.save_student_grammar_attempt_session(
  p_session_token text,p_assignment_id bigint,p_answers jsonb,p_score integer,p_max_score integer
)
returns jsonb language plpgsql security definer set search_path='public','private' as $$
declare s public.students; saved public.grammar_attempts;
begin
  select * into s from public.students where id=private.student_id_for_session(p_session_token);
  if s.id is null then return jsonb_build_object('ok',false,'error','invalid_session'); end if;
  if p_max_score<=0 or p_score<0 or p_score>p_max_score then return jsonb_build_object('ok',false,'error','invalid_score'); end if;

  if not exists(
    select 1 from public.grammar_assignments ga
    where ga.id=p_assignment_id and ga.class_id=s.class_id
      and (
        not exists(select 1 from public.grammar_assignment_students gas0 where gas0.grammar_assignment_id=ga.id)
        or exists(select 1 from public.grammar_assignment_students gas where gas.grammar_assignment_id=ga.id and gas.student_id=s.id)
      )
  ) then return jsonb_build_object('ok',false,'error','assignment_not_available'); end if;

  insert into public.grammar_attempts(
    grammar_assignment_id,student_id,answers,score,max_score,completed_at,updated_at,
    attempt_count,best_score,best_max_score
  )
  values(
    p_assignment_id,s.id,coalesce(p_answers,'{}'::jsonb),p_score,p_max_score,now(),now(),
    1,p_score,p_max_score
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
      then excluded.score else public.grammar_attempts.best_score end,
    best_max_score=case
      when public.grammar_attempts.best_max_score=0
        or excluded.score::numeric/excluded.max_score>public.grammar_attempts.best_score::numeric/public.grammar_attempts.best_max_score
      then excluded.max_score else public.grammar_attempts.best_max_score end
  returning * into saved;

  return jsonb_build_object(
    'ok',true,'score',saved.score,'max_score',saved.max_score,
    'attempts',saved.attempt_count,'best_score',saved.best_score,'best_max_score',saved.best_max_score,
    'completed',saved.best_max_score>0 and saved.best_score=saved.best_max_score
  );
end; $$;

create or replace function public.teacher_grammar_results(p_assignment_id bigint)
returns jsonb
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_result jsonb;
  v_allowed boolean;
begin
  if auth.uid() is null then
    return jsonb_build_object('ok',false,'error','not_authenticated');
  end if;

  select exists(
    select 1
    from public.grammar_assignments a
    join public.classes c on c.id=a.class_id
    where a.id=p_assignment_id
      and (
        exists(
          select 1
          from public.teacher_classes tc
          join public.school_memberships sm
            on sm.user_id=tc.teacher_id
           and sm.school_id=c.school_id
           and sm.role='teacher'
           and sm.active=true
          where tc.class_id=a.class_id and tc.teacher_id=auth.uid()
        )
        or exists(
          select 1 from public.school_memberships sm
          where sm.user_id=auth.uid()
            and sm.school_id=c.school_id
            and sm.role='admin'
            and sm.active=true
        )
      )
  ) into v_allowed;

  if not coalesce(v_allowed,false) then
    return jsonb_build_object('ok',false,'error','forbidden');
  end if;

  select jsonb_build_object(
    'ok',true,
    'results',coalesce(jsonb_agg(jsonb_build_object(
      'student_id',s.id,
      'student_name',s.name,
      'completed',(ga.student_id is not null),
      'score',ga.score,
      'max_score',ga.max_score,
      'completed_at',ga.completed_at,
      'answers',ga.answers,
      'attempts',coalesce(ga.attempt_count,0),
      'best_score',ga.best_score,
      'best_max_score',ga.best_max_score,
      'mastered',coalesce(ga.best_max_score>0 and ga.best_score=ga.best_max_score,false)
    ) order by s.name),'[]'::jsonb)
  ) into v_result
  from public.grammar_assignments a
  join public.students s on s.class_id=a.class_id
  left join public.grammar_assignment_students gas
    on gas.grammar_assignment_id=a.id and gas.student_id=s.id
  left join public.grammar_attempts ga
    on ga.grammar_assignment_id=a.id and ga.student_id=s.id
  where a.id=p_assignment_id
    and (
      not exists(select 1 from public.grammar_assignment_students z where z.grammar_assignment_id=a.id)
      or gas.student_id=s.id
    );

  return coalesce(v_result,jsonb_build_object('ok',true,'results','[]'::jsonb));
end; $$;
