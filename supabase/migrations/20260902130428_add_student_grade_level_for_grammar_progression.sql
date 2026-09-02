alter table public.students
  add column if not exists grade_level smallint;

alter table public.students
  drop constraint if exists students_grade_level_check;

alter table public.students
  add constraint students_grade_level_check
  check (grade_level is null or grade_level between 0 and 10);

comment on column public.students.grade_level is
  'Elevens aktuelle klassetrin (0-10). Bruges bl.a. til alders- og trinpasset grammatikprogression.';

create or replace function public.student_session_grammar_assignments(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare s public.students;
begin
  select * into s from public.students where id=private.student_id_for_session(p_session_token);
  if s.id is null then return jsonb_build_object('ok',false,'error','invalid_session'); end if;
  return jsonb_build_object(
    'ok',true,
    'grade_level',s.grade_level,
    'assignments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',ga.id,'area',ga.area,'topic',ga.topic,'level',ga.level,'title',ga.title,
        'grade_level',s.grade_level,
        'attempted',a.student_id is not null,
        'completed',coalesce(a.best_max_score>0 and a.best_score=a.best_max_score,false),
        'score',a.score,'max_score',a.max_score,
        'attempts',coalesce(a.attempt_count,0),
        'best_score',a.best_score,'best_max_score',a.best_max_score,
        'seen_question_keys',coalesce(a.seen_question_keys,'{}'::text[])
      ) order by ga.created_at desc)
      from public.grammar_assignments ga
      left join public.grammar_attempts a on a.grammar_assignment_id=ga.id and a.student_id=s.id
      where ga.class_id=s.class_id
        and (
          not exists(select 1 from public.grammar_assignment_students gas0 where gas0.grammar_assignment_id=ga.id)
          or exists(select 1 from public.grammar_assignment_students gas where gas.grammar_assignment_id=ga.id and gas.student_id=s.id)
        )
    ),'[]'::jsonb)
  );
end;
$function$;

revoke all on function public.student_session_grammar_assignments(text) from public, authenticated;
grant execute on function public.student_session_grammar_assignments(text) to anon, service_role;
