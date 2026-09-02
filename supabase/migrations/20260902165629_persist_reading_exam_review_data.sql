create or replace function public.student_session_reading_exam_assignments(p_session_token text)
returns jsonb language plpgsql security definer set search_path=public,private as $$
declare s public.students;
begin
  select * into s from public.students where id=private.student_id_for_session(p_session_token);
  if s.id is null then return jsonb_build_object('ok',false,'error','invalid_session'); end if;
  return jsonb_build_object('ok',true,'assignments',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',a.id,'title',a.title,'time_limit_minutes',a.time_limit_minutes,'question_count',a.question_count,'target_grade',a.target_grade,'created_at',a.created_at,
      'started',sess.id is not null,'started_at',sess.started_at,'submitted',att.id is not null,'submitted_at',sess.submitted_at,
      'score',att.score,'max_score',att.max_score,'answers',att.answers,
      'elapsed_seconds',case when sess.id is null then null else extract(epoch from (coalesce(sess.submitted_at,now())-sess.started_at))::integer end
    ) order by a.created_at desc)
    from public.reading_exam_assignments a
    left join public.reading_exam_sessions sess on sess.reading_exam_assignment_id=a.id and sess.student_id=s.id
    left join public.reading_exam_attempts att on att.reading_exam_assignment_id=a.id and att.student_id=s.id
    where a.class_id=s.class_id
      and (not exists(select 1 from public.reading_exam_assignment_students x where x.reading_exam_assignment_id=a.id)
           or exists(select 1 from public.reading_exam_assignment_students x where x.reading_exam_assignment_id=a.id and x.student_id=s.id))
  ),'[]'::jsonb));
end; $$;

revoke execute on function public.student_session_reading_exam_assignments(text) from public,authenticated,anon;
grant execute on function public.student_session_reading_exam_assignments(text) to anon,service_role;
