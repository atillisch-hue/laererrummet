create or replace function public.parent_portal_data()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid:=auth.uid();
  v_result jsonb;
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;

  select jsonb_build_object(
    'children',coalesce(jsonb_agg(child_payload order by child_name),'[]'::jsonb)
  )
  into v_result
  from (
    select
      s.name as child_name,
      jsonb_build_object(
        'id',s.id,
        'name',s.name,
        'class_id',s.class_id,
        'class_name',c.name,
        'closed_days',coalesce((select ss.closed_days from public.school_settings ss where ss.school_id=c.school_id),'[]'::jsonb),
        'assignments',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',a.id,
            'title',a.title,
            'type',a.type,
            'instructions',a.instructions,
            'class_subject_id',a.class_subject_id,
            'subject_title',coalesce(cs.title,sub.name),
            'created_at',a.created_at
          ) order by a.created_at desc,a.id desc)
          from public.assignments a
          left join public.class_subjects cs on cs.id=a.class_subject_id
          left join public.subjects sub on sub.id=cs.subject_id
          where a.class_id=s.class_id
            and (
              not exists(select 1 from public.assignment_students ax where ax.assignment_id=a.id)
              or exists(select 1 from public.assignment_students ax where ax.assignment_id=a.id and ax.student_id=s.id)
            )
        ),'[]'::jsonb),
        'subject_units',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',u.id,
            'subject_title',coalesce(cs.title,sub.name),
            'title',u.title,
            'driving_question',u.driving_question,
            'summary',u.summary,
            'learning_goals',u.learning_goals,
            'start_date',u.start_date,
            'end_date',u.end_date,
            'status',u.status,
            'assignment_ids',coalesce((
              select jsonb_agg(ua.assignment_id order by ua.position,ua.assignment_id)
              from public.subject_unit_assignments ua
              join public.assignments a on a.id=ua.assignment_id
              where ua.subject_unit_id=u.id
                and a.class_id=s.class_id
                and a.class_subject_id=u.class_subject_id
                and (
                  not exists(select 1 from public.assignment_students ax where ax.assignment_id=a.id)
                  or exists(select 1 from public.assignment_students ax where ax.assignment_id=a.id and ax.student_id=s.id)
                )
            ),'[]'::jsonb),
            'materials',coalesce((
              select jsonb_agg(jsonb_build_object(
                'id',i.id,
                'item_type',i.item_type,
                'title',i.title,
                'body',i.body,
                'url',i.url
              ) order by ui.position,ui.id)
              from public.subject_unit_items ui
              join public.subject_room_items i on i.id=ui.subject_room_item_id
              where ui.subject_unit_id=u.id
                and i.class_subject_id=u.class_subject_id
                and i.visible_to_students=true
                and i.item_type<>'note'
            ),'[]'::jsonb)
          ) order by u.start_date nulls last,sub.name,u.position,u.id)
          from public.subject_units u
          join public.class_subjects cs on cs.id=u.class_subject_id and cs.class_id=s.class_id and cs.active=true
          join public.subjects sub on sub.id=cs.subject_id and sub.active=true
          where u.visible_to_guardians=true
            and u.status<>'archived'
        ),'[]'::jsonb),
        'schedule','[]'::jsonb,
        'absence',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',sa.id,
            'absence_date',sa.absence_date,
            'status',sa.status,
            'source',sa.source,
            'created_at',sa.created_at
          ) order by sa.absence_date desc,sa.created_at desc)
          from public.student_absence sa
          where sa.student_id=s.id
        ),'[]'::jsonb)
      ) as child_payload
    from public.parent_students ps
    join public.students s on s.id=ps.student_id
    join public.classes c on c.id=s.class_id
    where ps.parent_id=v_uid
      and public.has_school_role(c.school_id,'parent')
  ) q;

  return coalesce(v_result,jsonb_build_object('children','[]'::jsonb));
end;
$$;

revoke all on function public.parent_portal_data() from public,anon;
grant execute on function public.parent_portal_data() to authenticated;
