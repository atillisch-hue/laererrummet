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
        'schedule',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',se.id,
            'weekday',se.weekday,
            'start_time',se.start_time,
            'end_time',se.end_time,
            'subject',se.subject,
            'room',se.room,
            'entry_kind',se.entry_kind,
            'recurrence_pattern',se.recurrence_pattern
          ) order by se.weekday,se.start_time,se.id)
          from public.schedule_entries se
          where se.class_id=s.class_id
            and se.entry_kind in ('lesson','assembly','break')
        ),'[]'::jsonb),
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

revoke all on function public.parent_portal_data() from public, anon;
grant execute on function public.parent_portal_data() to authenticated, service_role;
