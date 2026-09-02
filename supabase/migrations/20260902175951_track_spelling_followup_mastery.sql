alter table public.grammar_assignments
  add column if not exists source_kind text null,
  add column if not exists source_assignment_id bigint null;

comment on column public.grammar_assignments.source_kind is 'Optional origin for derived assignments, e.g. spelling_exam.';
comment on column public.grammar_assignments.source_assignment_id is 'Identifier of the originating object within source_kind.';

create index if not exists grammar_assignments_source_idx
  on public.grammar_assignments(source_kind, source_assignment_id)
  where source_kind is not null and source_assignment_id is not null;

create or replace function public.create_spelling_grammar_followup(
  p_spelling_assignment_id bigint,
  p_area text,
  p_topic text,
  p_student_ids bigint[],
  p_title text default null
)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private'
as $$
declare
  v_class_id bigint;
  v_school_id bigint;
  v_target_grade integer;
  v_allowed boolean;
  v_invalid_students integer;
  v_assignment_id bigint;
  v_title text;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  if trim(coalesce(p_area,''))='' or trim(coalesce(p_topic,''))='' then return jsonb_build_object('ok',false,'error','missing_topic'); end if;
  if p_student_ids is null or cardinality(p_student_ids)=0 then return jsonb_build_object('ok',false,'error','missing_recipients'); end if;

  select sea.class_id, c.school_id, sea.target_grade
    into v_class_id, v_school_id, v_target_grade
  from public.spelling_exam_assignments sea
  join public.classes c on c.id=sea.class_id
  where sea.id=p_spelling_assignment_id;

  if v_class_id is null then return jsonb_build_object('ok',false,'error','spelling_assignment_not_found'); end if;

  select (
    public.has_school_role(v_school_id,'admin')
    or (public.has_school_role(v_school_id,'teacher') and exists(
      select 1 from public.teacher_classes tc where tc.class_id=v_class_id and tc.teacher_id=auth.uid()
    ))
  ) into v_allowed;
  if not coalesce(v_allowed,false) then return jsonb_build_object('ok',false,'error','forbidden'); end if;

  select count(*) into v_invalid_students
  from unnest(p_student_ids) x(student_id)
  where not exists(
    select 1
    from public.students s
    where s.id=x.student_id
      and s.class_id=v_class_id
      and (
        not exists(
          select 1 from public.spelling_exam_assignment_students allr
          where allr.spelling_exam_assignment_id=p_spelling_assignment_id
        )
        or exists(
          select 1 from public.spelling_exam_assignment_students r
          where r.spelling_exam_assignment_id=p_spelling_assignment_id
            and r.student_id=s.id
        )
      )
  );
  if v_invalid_students>0 then return jsonb_build_object('ok',false,'error','invalid_recipients'); end if;

  v_title:=coalesce(nullif(trim(p_title),''),trim(p_topic)||' · opfølgning');
  insert into public.grammar_assignments(
    class_id,area,topic,level,title,target_grade,source_kind,source_assignment_id
  ) values (
    v_class_id,trim(p_area),trim(p_topic),'traening',v_title,v_target_grade,'spelling_exam',p_spelling_assignment_id
  ) returning id into v_assignment_id;

  insert into public.grammar_assignment_students(grammar_assignment_id,student_id)
  select v_assignment_id,student_id
  from (select distinct unnest(p_student_ids) student_id) q;

  return jsonb_build_object(
    'ok',true,
    'assignment_id',v_assignment_id,
    'recipient_count',cardinality(array(select distinct unnest(p_student_ids))),
    'target_grade',v_target_grade
  );
end;
$$;

revoke all on function public.create_spelling_grammar_followup(bigint,text,text,bigint[],text) from public, anon;
grant execute on function public.create_spelling_grammar_followup(bigint,text,text,bigint[],text) to authenticated, service_role;

create or replace function public.teacher_spelling_exam_followups(p_assignment_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private'
as $$
declare
  v_allowed boolean;
  v_result jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;

  select exists(
    select 1
    from public.spelling_exam_assignments sea
    join public.classes c on c.id=sea.class_id
    where sea.id=p_assignment_id
      and (
        public.has_school_role(c.school_id,'admin')
        or (
          public.has_school_role(c.school_id,'teacher')
          and exists(select 1 from public.teacher_classes tc where tc.class_id=sea.class_id and tc.teacher_id=auth.uid())
        )
      )
  ) into v_allowed;
  if not coalesce(v_allowed,false) then return jsonb_build_object('ok',false,'error','forbidden'); end if;

  select jsonb_build_object(
    'ok',true,
    'followups',coalesce(jsonb_agg(jsonb_build_object(
      'assignment_id',ga.id,
      'topic',ga.topic,
      'area',ga.area,
      'title',ga.title,
      'target_grade',ga.target_grade,
      'created_at',ga.created_at,
      'recipient_count',coalesce(stats.recipient_count,0),
      'attempted_count',coalesce(stats.attempted_count,0),
      'mastered_count',coalesce(stats.mastered_count,0)
    ) order by ga.created_at desc),'[]'::jsonb)
  ) into v_result
  from public.grammar_assignments ga
  left join lateral (
    select
      count(gas.student_id)::integer as recipient_count,
      count(at.student_id) filter (where at.student_id is not null)::integer as attempted_count,
      count(at.student_id) filter (where at.best_max_score>0 and at.best_score=at.best_max_score)::integer as mastered_count
    from public.grammar_assignment_students gas
    left join public.grammar_attempts at
      on at.grammar_assignment_id=ga.id and at.student_id=gas.student_id
    where gas.grammar_assignment_id=ga.id
  ) stats on true
  where ga.source_kind='spelling_exam'
    and ga.source_assignment_id=p_assignment_id;

  return coalesce(v_result,jsonb_build_object('ok',true,'followups','[]'::jsonb));
end;
$$;

revoke all on function public.teacher_spelling_exam_followups(bigint) from public, anon;
grant execute on function public.teacher_spelling_exam_followups(bigint) to authenticated, service_role;
