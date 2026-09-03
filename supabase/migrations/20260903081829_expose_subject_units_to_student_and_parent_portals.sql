create or replace function public.student_session_subject_rooms(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_student_id bigint;
  v_class_id bigint;
  v_result jsonb;
begin
  v_student_id:=private.student_id_for_session(p_session_token);
  if v_student_id is null then
    return jsonb_build_object('ok',false,'error','invalid_session','rooms','[]'::jsonb);
  end if;

  select s.class_id into v_class_id from public.students s where s.id=v_student_id;
  if v_class_id is null then
    return jsonb_build_object('ok',false,'error','student_not_found','rooms','[]'::jsonb);
  end if;

  select jsonb_build_object(
    'ok',true,
    'rooms',coalesce(jsonb_agg(
      jsonb_build_object(
        'id',cs.id,
        'subject_id',subj.id,
        'subject_name',subj.name,
        'title',coalesce(cs.title,subj.name),
        'intro',cs.intro,
        'items',coalesce((
          select jsonb_agg(jsonb_build_object('id',i.id,'item_type',i.item_type,'title',i.title,'body',i.body,'url',i.url,'position',i.position) order by i.position,i.created_at)
          from public.subject_room_items i
          where i.class_subject_id=cs.id and i.visible_to_students=true and i.item_type<>'note'
        ),'[]'::jsonb),
        'assignments',coalesce((
          select jsonb_agg(jsonb_build_object('id',a.id,'title',a.title,'type',a.type,'instructions',a.instructions) order by a.id desc)
          from public.assignments a
          where a.class_subject_id=cs.id and a.class_id=v_class_id
            and (not exists(select 1 from public.assignment_students ast0 where ast0.assignment_id=a.id)
              or exists(select 1 from public.assignment_students ast where ast.assignment_id=a.id and ast.student_id=v_student_id))
        ),'[]'::jsonb),
        'units',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',u.id,'title',u.title,'driving_question',u.driving_question,'summary',u.summary,'learning_goals',u.learning_goals,
            'start_date',u.start_date,'end_date',u.end_date,'status',u.status,
            'assignment_ids',coalesce((
              select jsonb_agg(ua.assignment_id order by ua.position,ua.assignment_id)
              from public.subject_unit_assignments ua
              join public.assignments a on a.id=ua.assignment_id
              where ua.subject_unit_id=u.id and a.class_subject_id=cs.id and a.class_id=v_class_id
                and (not exists(select 1 from public.assignment_students ast0 where ast0.assignment_id=a.id)
                  or exists(select 1 from public.assignment_students ast where ast.assignment_id=a.id and ast.student_id=v_student_id))
            ),'[]'::jsonb)
          ) order by u.start_date nulls last,u.position,u.id)
          from public.subject_units u
          where u.class_subject_id=cs.id and u.visible_to_students=true and u.status<>'archived'
        ),'[]'::jsonb)
      ) order by subj.name
    ) filter(where cs.id is not null),'[]'::jsonb)
  ) into v_result
  from public.class_subjects cs
  join public.subjects subj on subj.id=cs.subject_id and subj.active=true
  where cs.class_id=v_class_id and cs.active=true;

  return coalesce(v_result,jsonb_build_object('ok',true,'rooms','[]'::jsonb));
end;
$$;

revoke all on function public.student_session_subject_rooms(text) from public,authenticated;
grant execute on function public.student_session_subject_rooms(text) to anon,service_role;

create or replace function public.parent_portal_data()
returns jsonb
language plpgsql
security definer
set search_path to 'public','private'
as $$
declare
  v_uid uuid:=auth.uid();
  v_result jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select jsonb_build_object('children',coalesce(jsonb_agg(child_payload order by child_name),'[]'::jsonb)) into v_result
  from (
    select s.name as child_name,
      jsonb_build_object(
        'id',s.id,'name',s.name,'class_id',s.class_id,'class_name',c.name,
        'closed_days',coalesce((select ss.closed_days from public.school_settings ss where ss.school_id=c.school_id),'[]'::jsonb),
        'assignments',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',a.id,'title',a.title,'type',a.type,'instructions',a.instructions,'class_subject_id',a.class_subject_id,
            'subject_title',coalesce(cs.title,sub.name),'created_at',a.created_at
          ) order by a.created_at desc,a.id desc)
          from public.assignments a
          left join public.class_subjects cs on cs.id=a.class_subject_id
          left join public.subjects sub on sub.id=cs.subject_id
          where a.class_id=s.class_id
            and (not exists(select 1 from public.assignment_students ax where ax.assignment_id=a.id)
              or exists(select 1 from public.assignment_students ax where ax.assignment_id=a.id and ax.student_id=s.id))
        ),'[]'::jsonb),
        'subject_units',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',u.id,'subject_title',coalesce(cs.title,sub.name),'title',u.title,'driving_question',u.driving_question,
            'summary',u.summary,'learning_goals',u.learning_goals,'start_date',u.start_date,'end_date',u.end_date,'status',u.status
          ) order by u.start_date nulls last,sub.name,u.position,u.id)
          from public.subject_units u
          join public.class_subjects cs on cs.id=u.class_subject_id and cs.class_id=s.class_id and cs.active=true
          join public.subjects sub on sub.id=cs.subject_id and sub.active=true
          where u.visible_to_guardians=true and u.status<>'archived'
        ),'[]'::jsonb),
        'schedule',coalesce((
          select jsonb_agg(jsonb_build_object('id',se.id,'weekday',se.weekday,'start_time',se.start_time,'end_time',se.end_time,'subject',se.subject,'room',se.room,'entry_kind',se.entry_kind,'recurrence_pattern',se.recurrence_pattern) order by se.weekday,se.start_time,se.id)
          from public.schedule_entries se
          where se.class_id=s.class_id and se.entry_kind in ('lesson','assembly','break')
        ),'[]'::jsonb),
        'absence',coalesce((
          select jsonb_agg(jsonb_build_object('id',sa.id,'absence_date',sa.absence_date,'status',sa.status,'source',sa.source,'created_at',sa.created_at) order by sa.absence_date desc,sa.created_at desc)
          from public.student_absence sa where sa.student_id=s.id
        ),'[]'::jsonb)
      ) as child_payload
    from public.parent_students ps
    join public.students s on s.id=ps.student_id
    join public.classes c on c.id=s.class_id
    where ps.parent_id=v_uid and public.has_school_role(c.school_id,'parent')
  ) q;

  return coalesce(v_result,jsonb_build_object('children','[]'::jsonb));
end;
$$;

revoke all on function public.parent_portal_data() from public,anon;
grant execute on function public.parent_portal_data() to authenticated,service_role;
