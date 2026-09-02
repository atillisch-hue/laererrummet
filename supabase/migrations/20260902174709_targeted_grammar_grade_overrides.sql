alter table public.grammar_assignments
  add column if not exists target_grade integer null;

alter table public.grammar_assignments
  drop constraint if exists grammar_assignments_target_grade_check;
alter table public.grammar_assignments
  add constraint grammar_assignments_target_grade_check
  check (target_grade is null or target_grade between 1 and 10);

create or replace function public.student_session_grammar_assignments(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private'
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
        'grade_level',coalesce(ga.target_grade,s.grade_level),
        'registered_grade_level',s.grade_level,
        'target_grade',ga.target_grade,
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

create or replace function public.create_targeted_grammar_assignment(
  p_class_id bigint,
  p_area text,
  p_topic text,
  p_target_grade integer,
  p_student_ids bigint[],
  p_title text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','private'
as $function$
declare
  v_school_id bigint;
  v_allowed boolean;
  v_invalid_students integer;
  v_assignment_id bigint;
  v_title text;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  if p_target_grade not between 1 and 10 then return jsonb_build_object('ok',false,'error','invalid_target_grade'); end if;
  if trim(coalesce(p_area,''))='' or trim(coalesce(p_topic,''))='' then return jsonb_build_object('ok',false,'error','missing_topic'); end if;
  if p_student_ids is null or cardinality(p_student_ids)=0 then return jsonb_build_object('ok',false,'error','missing_recipients'); end if;

  select c.school_id into v_school_id from public.classes c where c.id=p_class_id;
  if v_school_id is null then return jsonb_build_object('ok',false,'error','class_not_found'); end if;

  select (
    public.has_school_role(v_school_id,'admin')
    or (public.has_school_role(v_school_id,'teacher') and exists(
      select 1 from public.teacher_classes tc where tc.class_id=p_class_id and tc.teacher_id=auth.uid()
    ))
  ) into v_allowed;
  if not coalesce(v_allowed,false) then return jsonb_build_object('ok',false,'error','forbidden'); end if;

  select count(*) into v_invalid_students
  from unnest(p_student_ids) x(student_id)
  where not exists(select 1 from public.students s where s.id=x.student_id and s.class_id=p_class_id);
  if v_invalid_students>0 then return jsonb_build_object('ok',false,'error','invalid_recipients'); end if;

  v_title:=coalesce(nullif(trim(p_title),''),trim(p_topic)||' · målrettet træning');
  insert into public.grammar_assignments(class_id,area,topic,level,title,target_grade)
  values(p_class_id,trim(p_area),trim(p_topic),'traening',v_title,p_target_grade)
  returning id into v_assignment_id;

  insert into public.grammar_assignment_students(grammar_assignment_id,student_id)
  select v_assignment_id,student_id from (select distinct unnest(p_student_ids) student_id) q;

  return jsonb_build_object('ok',true,'assignment_id',v_assignment_id,'recipient_count',cardinality(array(select distinct unnest(p_student_ids))),'target_grade',p_target_grade);
end;
$function$;

revoke all on function public.create_targeted_grammar_assignment(bigint,text,text,integer,bigint[],text) from public, anon;
grant execute on function public.create_targeted_grammar_assignment(bigint,text,text,integer,bigint[],text) to authenticated, service_role;
