create or replace function public.get_lesson_resources(p_lesson_instance_id bigint)
returns jsonb
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_uid uuid;
  v_school_id bigint;
  v_schedule_entry_id bigint;
  v_lesson_date date;
  v_allowed boolean := false;
  v_result jsonb;
begin
  v_uid:=auth.uid();
  if v_uid is null then raise exception 'Authenticated user required'; end if;

  select li.school_id,li.schedule_entry_id,li.lesson_date
    into v_school_id,v_schedule_entry_id,v_lesson_date
  from public.lesson_instances li
  where li.id=p_lesson_instance_id;
  if v_school_id is null then raise exception 'Lesson not found'; end if;

  v_allowed := public.has_school_role(v_school_id,'admin')
    or exists (
      select 1 from public.schedule_teachers st
      where st.schedule_entry_id=v_schedule_entry_id
        and st.teacher_id=v_uid
        and public.is_school_staff(v_school_id)
    )
    or exists (
      select 1 from public.substitute_assignments sa
      where sa.schedule_entry_id=v_schedule_entry_id
        and sa.assignment_date=v_lesson_date
        and sa.substitute_teacher_id=v_uid
        and public.is_school_member(v_school_id)
    );

  if not v_allowed then raise exception 'Not allowed to read lesson resources'; end if;

  select jsonb_build_object(
    'ok',true,
    'resources',coalesce(jsonb_agg(resource order by position,link_id) filter(where resource is not null),'[]'::jsonb)
  ) into v_result
  from (
    select lrl.position,lrl.id as link_id,
      case
        when lrl.subject_room_item_id is not null then jsonb_build_object(
          'link_id',lrl.id,
          'kind','item',
          'source_id',sri.id,
          'source_label',coalesce(cs.title,subj.name,'Fag'),
          'item_type',sri.item_type,
          'title',sri.title,
          'body',sri.body,
          'url',sri.url
        )
        when lrl.assignment_id is not null then jsonb_build_object(
          'link_id',lrl.id,
          'kind','assignment',
          'source_id',a.id,
          'assignment_type',a.type,
          'title',a.title,
          'instructions',a.instructions
        )
        else null
      end as resource
    from public.lesson_resource_links lrl
    left join public.subject_room_items sri on sri.id=lrl.subject_room_item_id
    left join public.class_subjects cs on cs.id=sri.class_subject_id
    left join public.subjects subj on subj.id=cs.subject_id
    left join public.assignments a on a.id=lrl.assignment_id
    where lrl.lesson_instance_id=p_lesson_instance_id
  ) q;

  return coalesce(v_result,jsonb_build_object('ok',true,'resources','[]'::jsonb));
end;
$$;

revoke execute on function public.get_lesson_resources(bigint) from public,anon;
grant execute on function public.get_lesson_resources(bigint) to authenticated,service_role;
