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

  select s.class_id into v_class_id
  from public.students s
  where s.id=v_student_id;

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
          select jsonb_agg(
            jsonb_build_object(
              'id',i.id,
              'item_type',i.item_type,
              'title',i.title,
              'body',i.body,
              'url',i.url,
              'position',i.position
            ) order by i.position,i.created_at
          )
          from public.subject_room_items i
          where i.class_subject_id=cs.id
            and i.visible_to_students=true
            and i.item_type<>'note'
        ),'[]'::jsonb),
        'assignments',coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id',a.id,
              'title',a.title,
              'type',a.type,
              'instructions',a.instructions
            ) order by a.id desc
          )
          from public.assignments a
          where a.class_subject_id=cs.id
            and a.class_id=v_class_id
            and (
              not exists(select 1 from public.assignment_students ast0 where ast0.assignment_id=a.id)
              or exists(select 1 from public.assignment_students ast where ast.assignment_id=a.id and ast.student_id=v_student_id)
            )
        ),'[]'::jsonb)
      ) order by subj.name
    ) filter(where cs.id is not null),'[]'::jsonb)
  ) into v_result
  from public.class_subjects cs
  join public.subjects subj on subj.id=cs.subject_id and subj.active=true
  where cs.class_id=v_class_id
    and cs.active=true;

  return coalesce(v_result,jsonb_build_object('ok',true,'rooms','[]'::jsonb));
end;
$$;

revoke execute on function public.student_session_subject_rooms(text) from public, authenticated;
grant execute on function public.student_session_subject_rooms(text) to anon, service_role;
