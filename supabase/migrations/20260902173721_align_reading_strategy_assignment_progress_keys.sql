create or replace function public.student_session_reading_strategy_assignments(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private'
as $function$
declare
  s public.students;
begin
  select * into s from public.students where id=private.student_id_for_session(p_session_token);
  if s.id is null then return jsonb_build_object('ok',false,'error','invalid_session'); end if;

  return jsonb_build_object('ok',true,'assignments',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',a.id,'title',a.title,'strategy',a.strategy,'target_grade',a.target_grade,'created_at',a.created_at,
      'completed',p.last_attempt_at is not null and p.last_attempt_at>=a.created_at,
      'attempts',case when p.last_attempt_at>=a.created_at then p.attempts else 0 end,
      'best_score',case when p.last_attempt_at>=a.created_at then p.best_score else null end,
      'max_score',case when p.last_attempt_at>=a.created_at then p.max_score else null end,
      'last_score',case when p.last_attempt_at>=a.created_at then p.last_score else null end,
      'last_attempt_at',case when p.last_attempt_at>=a.created_at then p.last_attempt_at else null end
    ) order by a.created_at desc)
    from public.reading_strategy_assignments a
    left join public.student_training_progress p
      on p.student_id=s.id and p.subject_id='dansk-laesning' and p.area_id='laesestrategier' and p.skill_id=a.strategy and p.level_id=a.target_grade::text
    where a.class_id=s.class_id
      and (not exists(select 1 from public.reading_strategy_assignment_students x where x.reading_strategy_assignment_id=a.id)
           or exists(select 1 from public.reading_strategy_assignment_students x where x.reading_strategy_assignment_id=a.id and x.student_id=s.id))
  ),'[]'::jsonb));
end;
$function$;

create or replace function public.teacher_reading_strategy_assignments(p_class_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private'
as $function$
declare v_school_id bigint; v_allowed boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  select c.school_id into v_school_id from public.classes c where c.id=p_class_id;
  if v_school_id is null then return jsonb_build_object('ok',false,'error','class_not_found'); end if;
  select (public.has_school_role(v_school_id,'admin') or (public.has_school_role(v_school_id,'teacher') and exists(select 1 from public.teacher_classes tc where tc.class_id=p_class_id and tc.teacher_id=auth.uid()))) into v_allowed;
  if not coalesce(v_allowed,false) then return jsonb_build_object('ok',false,'error','forbidden'); end if;

  return jsonb_build_object('ok',true,'assignments',coalesce((
    select jsonb_agg(jsonb_build_object(
      'id',a.id,'title',a.title,'strategy',a.strategy,'target_grade',a.target_grade,'created_at',a.created_at,
      'recipient_count',case when exists(select 1 from public.reading_strategy_assignment_students x0 where x0.reading_strategy_assignment_id=a.id)
        then (select count(*) from public.reading_strategy_assignment_students x where x.reading_strategy_assignment_id=a.id)
        else (select count(*) from public.students s where s.class_id=a.class_id) end,
      'completed_count',(select count(*) from public.students s left join public.student_training_progress p
        on p.student_id=s.id and p.subject_id='dansk-laesning' and p.area_id='laesestrategier' and p.skill_id=a.strategy and p.level_id=a.target_grade::text
        where s.class_id=a.class_id and (not exists(select 1 from public.reading_strategy_assignment_students z where z.reading_strategy_assignment_id=a.id)
          or exists(select 1 from public.reading_strategy_assignment_students z where z.reading_strategy_assignment_id=a.id and z.student_id=s.id)) and p.last_attempt_at>=a.created_at),
      'locked',exists(select 1 from public.students s join public.student_training_progress p
        on p.student_id=s.id and p.subject_id='dansk-laesning' and p.area_id='laesestrategier' and p.skill_id=a.strategy and p.level_id=a.target_grade::text
        where s.class_id=a.class_id and (not exists(select 1 from public.reading_strategy_assignment_students z where z.reading_strategy_assignment_id=a.id)
          or exists(select 1 from public.reading_strategy_assignment_students z where z.reading_strategy_assignment_id=a.id and z.student_id=s.id)) and p.last_attempt_at>=a.created_at)
    ) order by a.created_at desc) from public.reading_strategy_assignments a where a.class_id=p_class_id
  ),'[]'::jsonb));
end;
$function$;

create or replace function public.delete_reading_strategy_assignment(p_assignment_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = 'public', 'private'
as $function$
declare a public.reading_strategy_assignments; v_school_id bigint; v_allowed boolean; v_started boolean;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  select * into a from public.reading_strategy_assignments where id=p_assignment_id;
  if a.id is null then return jsonb_build_object('ok',false,'error','not_found'); end if;
  select school_id into v_school_id from public.classes where id=a.class_id;
  select (public.has_school_role(v_school_id,'admin') or (public.has_school_role(v_school_id,'teacher') and exists(select 1 from public.teacher_classes tc where tc.class_id=a.class_id and tc.teacher_id=auth.uid()))) into v_allowed;
  if not coalesce(v_allowed,false) then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  select exists(select 1 from public.students s join public.student_training_progress p
    on p.student_id=s.id and p.subject_id='dansk-laesning' and p.area_id='laesestrategier' and p.skill_id=a.strategy and p.level_id=a.target_grade::text
    where s.class_id=a.class_id and (not exists(select 1 from public.reading_strategy_assignment_students z where z.reading_strategy_assignment_id=a.id)
      or exists(select 1 from public.reading_strategy_assignment_students z where z.reading_strategy_assignment_id=a.id and z.student_id=s.id)) and p.last_attempt_at>=a.created_at) into v_started;
  if v_started then return jsonb_build_object('ok',false,'error','assignment_started'); end if;
  delete from public.reading_strategy_assignments where id=a.id;
  return jsonb_build_object('ok',true);
end;
$function$;

revoke all on function public.student_session_reading_strategy_assignments(text) from public, authenticated;
revoke all on function public.teacher_reading_strategy_assignments(bigint) from public, anon;
revoke all on function public.delete_reading_strategy_assignment(bigint) from public, anon;
grant execute on function public.student_session_reading_strategy_assignments(text) to anon, service_role;
grant execute on function public.teacher_reading_strategy_assignments(bigint) to authenticated, service_role;
grant execute on function public.delete_reading_strategy_assignment(bigint) to authenticated, service_role;
