alter table public.reading_exam_assignments add column if not exists target_grade smallint not null default 9;

do $$ begin
  if not exists (select 1 from pg_constraint where conname='reading_exam_target_grade_check' and conrelid='public.reading_exam_assignments'::regclass) then
    alter table public.reading_exam_assignments add constraint reading_exam_target_grade_check check (target_grade between 6 and 9);
  end if;
end $$;

drop function if exists public.create_reading_exam_assignment(bigint,text,integer,bigint[]);

create or replace function public.create_reading_exam_assignment(p_class_id bigint,p_title text default 'Træn læseprøven',p_time_limit_minutes integer default null,p_student_ids bigint[] default null,p_target_grade integer default 9)
returns jsonb language plpgsql security definer set search_path=public,private as $$
declare v_school_id bigint; v_allowed boolean; v_assignment public.reading_exam_assignments; v_invalid_students integer; v_count integer;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  if p_target_grade not between 6 and 9 then return jsonb_build_object('ok',false,'error','invalid_target_grade'); end if;
  select c.school_id into v_school_id from public.classes c where c.id=p_class_id;
  if v_school_id is null then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  select (public.has_school_role(v_school_id,'admin') or (public.has_school_role(v_school_id,'teacher') and exists(select 1 from public.teacher_classes tc where tc.class_id=p_class_id and tc.teacher_id=auth.uid()))) into v_allowed;
  if not coalesce(v_allowed,false) then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  if p_time_limit_minutes is not null and (p_time_limit_minutes<5 or p_time_limit_minutes>180) then return jsonb_build_object('ok',false,'error','invalid_time_limit'); end if;
  if p_student_ids is not null and cardinality(p_student_ids)>0 then
    select count(*) into v_invalid_students from unnest(p_student_ids) x(student_id) where not exists(select 1 from public.students s where s.id=x.student_id and s.class_id=p_class_id);
    if v_invalid_students>0 then return jsonb_build_object('ok',false,'error','invalid_recipients'); end if;
  end if;
  v_count:=case p_target_grade when 6 then 30 when 7 then 35 when 8 then 40 else 50 end;
  insert into public.reading_exam_assignments(class_id,title,time_limit_minutes,question_count,target_grade)
  values(p_class_id,coalesce(nullif(trim(p_title),''),'Træn læseprøven'),p_time_limit_minutes,v_count,p_target_grade) returning * into v_assignment;
  if p_student_ids is not null and cardinality(p_student_ids)>0 then insert into public.reading_exam_assignment_students(reading_exam_assignment_id,student_id) select v_assignment.id,student_id from (select distinct unnest(p_student_ids) student_id) q; end if;
  return jsonb_build_object('ok',true,'assignment_id',v_assignment.id,'target_grade',v_assignment.target_grade,'question_count',v_assignment.question_count);
end; $$;

create or replace function public.student_session_reading_exam_assignments(p_session_token text)
returns jsonb language plpgsql security definer set search_path=public,private as $$
declare s public.students;
begin
  select * into s from public.students where id=private.student_id_for_session(p_session_token);
  if s.id is null then return jsonb_build_object('ok',false,'error','invalid_session'); end if;
  return jsonb_build_object('ok',true,'assignments',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'title',a.title,'time_limit_minutes',a.time_limit_minutes,'question_count',a.question_count,'target_grade',a.target_grade,'created_at',a.created_at,'started',sess.id is not null,'started_at',sess.started_at,'submitted',att.id is not null,'submitted_at',sess.submitted_at,'score',att.score,'max_score',att.max_score) order by a.created_at desc) from public.reading_exam_assignments a left join public.reading_exam_sessions sess on sess.reading_exam_assignment_id=a.id and sess.student_id=s.id left join public.reading_exam_attempts att on att.reading_exam_assignment_id=a.id and att.student_id=s.id where a.class_id=s.class_id and (not exists(select 1 from public.reading_exam_assignment_students x where x.reading_exam_assignment_id=a.id) or exists(select 1 from public.reading_exam_assignment_students x where x.reading_exam_assignment_id=a.id and x.student_id=s.id))),'[]'::jsonb));
end; $$;

create or replace function public.start_student_reading_exam_session(p_session_token text,p_assignment_id bigint)
returns jsonb language plpgsql security definer set search_path=public,private as $$
declare s public.students; a public.reading_exam_assignments; sess public.reading_exam_sessions; v_remaining integer;
begin
  select * into s from public.students where id=private.student_id_for_session(p_session_token); if s.id is null then return jsonb_build_object('ok',false,'error','invalid_session'); end if;
  select * into a from public.reading_exam_assignments x where x.id=p_assignment_id and x.class_id=s.class_id and (not exists(select 1 from public.reading_exam_assignment_students z where z.reading_exam_assignment_id=x.id) or exists(select 1 from public.reading_exam_assignment_students z where z.reading_exam_assignment_id=x.id and z.student_id=s.id));
  if a.id is null then return jsonb_build_object('ok',false,'error','assignment_not_available'); end if;
  insert into public.reading_exam_sessions(reading_exam_assignment_id,student_id,question_seed) values(a.id,s.id,floor(random()*2147483000)::integer+1) on conflict(reading_exam_assignment_id,student_id) do nothing;
  select * into sess from public.reading_exam_sessions where reading_exam_assignment_id=a.id and student_id=s.id;
  if a.time_limit_minutes is not null then v_remaining:=greatest(0,(extract(epoch from (sess.started_at+make_interval(mins=>a.time_limit_minutes)-now())))::integer); else v_remaining:=null; end if;
  return jsonb_build_object('ok',true,'question_seed',sess.question_seed,'started_at',sess.started_at,'submitted_at',sess.submitted_at,'time_limit_minutes',a.time_limit_minutes,'remaining_seconds',v_remaining,'question_count',a.question_count,'target_grade',a.target_grade,'already_submitted',sess.submitted_at is not null);
end; $$;

create or replace function public.teacher_reading_exam_results(p_assignment_id bigint)
returns jsonb language plpgsql security definer set search_path=public,private as $$
declare v_school_id bigint; v_class_id bigint; v_allowed boolean; v_time_limit integer; v_target_grade integer; v_result jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  select a.class_id,c.school_id,a.time_limit_minutes,a.target_grade into v_class_id,v_school_id,v_time_limit,v_target_grade from public.reading_exam_assignments a join public.classes c on c.id=a.class_id where a.id=p_assignment_id; if v_school_id is null then return jsonb_build_object('ok',false,'error','not_found'); end if;
  select (public.has_school_role(v_school_id,'admin') or (public.has_school_role(v_school_id,'teacher') and exists(select 1 from public.teacher_classes tc where tc.class_id=v_class_id and tc.teacher_id=auth.uid()))) into v_allowed; if not coalesce(v_allowed,false) then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  select jsonb_build_object('ok',true,'time_limit_minutes',v_time_limit,'target_grade',v_target_grade,'results',coalesce(jsonb_agg(jsonb_build_object('student_id',s.id,'student_name',s.name,'started',sess.id is not null,'started_at',sess.started_at,'submitted',att.id is not null,'submitted_at',sess.submitted_at,'score',att.score,'max_score',att.max_score,'elapsed_seconds',case when sess.id is null then null else extract(epoch from (coalesce(sess.submitted_at,now())-sess.started_at))::integer end,'timed_out',case when v_time_limit is null or sess.id is null then false else extract(epoch from (coalesce(sess.submitted_at,now())-sess.started_at))>v_time_limit*60 end,'answers',att.answers) order by s.name),'[]'::jsonb)) into v_result from public.students s left join public.reading_exam_assignment_students link on link.reading_exam_assignment_id=p_assignment_id and link.student_id=s.id left join public.reading_exam_sessions sess on sess.reading_exam_assignment_id=p_assignment_id and sess.student_id=s.id left join public.reading_exam_attempts att on att.reading_exam_assignment_id=p_assignment_id and att.student_id=s.id where s.class_id=v_class_id and (not exists(select 1 from public.reading_exam_assignment_students z where z.reading_exam_assignment_id=p_assignment_id) or link.student_id=s.id);
  return coalesce(v_result,jsonb_build_object('ok',true,'time_limit_minutes',v_time_limit,'target_grade',v_target_grade,'results','[]'::jsonb));
end; $$;

create or replace function public.teacher_reading_exam_assignments(p_class_id bigint)
returns jsonb language plpgsql security definer set search_path=public,private as $$
declare v_school_id bigint; v_allowed boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  select c.school_id into v_school_id from public.classes c where c.id=p_class_id;
  if v_school_id is null then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  select (public.has_school_role(v_school_id,'admin') or (public.has_school_role(v_school_id,'teacher') and exists(select 1 from public.teacher_classes tc where tc.class_id=p_class_id and tc.teacher_id=auth.uid()))) into v_allowed;
  if not coalesce(v_allowed,false) then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  return jsonb_build_object('ok',true,'assignments',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'title',a.title,'time_limit_minutes',a.time_limit_minutes,'question_count',a.question_count,'target_grade',a.target_grade,'created_at',a.created_at,'recipient_count',case when exists(select 1 from public.reading_exam_assignment_students l0 where l0.reading_exam_assignment_id=a.id) then (select count(*) from public.reading_exam_assignment_students l where l.reading_exam_assignment_id=a.id) else (select count(*) from public.students s where s.class_id=a.class_id) end,'started_count',(select count(*) from public.reading_exam_sessions s where s.reading_exam_assignment_id=a.id),'submitted_count',(select count(*) from public.reading_exam_attempts x where x.reading_exam_assignment_id=a.id),'locked',exists(select 1 from public.reading_exam_sessions s where s.reading_exam_assignment_id=a.id)) order by a.created_at desc) from public.reading_exam_assignments a where a.class_id=p_class_id),'[]'::jsonb));
end; $$;

revoke execute on function public.create_reading_exam_assignment(bigint,text,integer,bigint[],integer) from public,anon,authenticated;
grant execute on function public.create_reading_exam_assignment(bigint,text,integer,bigint[],integer) to authenticated,service_role;
revoke execute on function public.teacher_reading_exam_results(bigint) from public,anon,authenticated;
grant execute on function public.teacher_reading_exam_results(bigint) to authenticated,service_role;
revoke execute on function public.teacher_reading_exam_assignments(bigint) from public,anon,authenticated;
grant execute on function public.teacher_reading_exam_assignments(bigint) to authenticated,service_role;
revoke execute on function public.student_session_reading_exam_assignments(text) from public,authenticated,anon;
grant execute on function public.student_session_reading_exam_assignments(text) to anon,service_role;
revoke execute on function public.start_student_reading_exam_session(text,bigint) from public,authenticated,anon;
grant execute on function public.start_student_reading_exam_session(text,bigint) to anon,service_role;
