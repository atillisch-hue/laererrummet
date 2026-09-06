drop function if exists public.admin_retention_inventory(bigint);

create function public.admin_retention_inventory(p_school_id bigint)
returns table(
  category text,
  record_count bigint,
  oldest_at timestamptz,
  newest_at timestamptz,
  policy_status text,
  readiness text,
  retention_anchor text,
  note text
)
language plpgsql
security definer
set search_path=''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if coalesce(auth.jwt()->>'aal','') <> 'aal2' then
    raise exception 'MFA required' using errcode='42501';
  end if;
  if not public.has_school_role(p_school_id,'admin') then
    raise exception 'Admin access required';
  end if;

  return query
  with inventory as (
    select 'Elevgrunddata'::text as category,
           count(*)::bigint as record_count,
           min(s.created_at) as oldest_at,
           max(s.created_at) as newest_at,
           'needs_lifecycle'::text as readiness,
           'Mangler dato for udskrivning/inaktivering'::text as retention_anchor,
           'students + relationer'::text as note
    from public.students s
    join public.classes c on c.id=s.class_id
    where c.school_id=p_school_id

    union all
    select 'Elevfravær',count(*)::bigint,
           min(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),
           max(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),
           'ready_for_policy','absence_date','student_absence'
    from public.student_absence sa
    join public.students s on s.id=sa.student_id
    join public.classes c on c.id=s.class_id
    where c.school_id=p_school_id

    union all
    select 'Faglige elevforsøg',count(*)::bigint,min(x.at),max(x.at),
           'ready_for_policy','completed_at','grammatik + læseprøve + staveprøve'
    from (
      select ga.completed_at as at
      from public.grammar_attempts ga
      join public.students s on s.id=ga.student_id
      join public.classes c on c.id=s.class_id
      where c.school_id=p_school_id
      union all
      select ra.completed_at
      from public.reading_exam_attempts ra
      join public.students s on s.id=ra.student_id
      join public.classes c on c.id=s.class_id
      where c.school_id=p_school_id
      union all
      select spa.completed_at
      from public.spelling_exam_attempts spa
      join public.students s on s.id=spa.student_id
      join public.classes c on c.id=s.class_id
      where c.school_id=p_school_id
    ) x

    union all
    select 'Elevplaner',count(*)::bigint,min(sap.created_at),max(sap.created_at),
           'needs_lifecycle','Mangler entydig lukket_at/livscyklus','student_action_plans'
    from public.student_action_plans sap
    join public.students s on s.id=sap.student_id
    join public.classes c on c.id=s.class_id
    where c.school_id=p_school_id

    union all
    select 'Møder',count(*)::bigint,min(cm.ends_at),max(cm.ends_at),
           'ready_for_policy','ends_at','calendar_meetings inkl. evt. elevkobling og interne noter'
    from public.calendar_meetings cm
    where cm.school_id=p_school_id

    union all
    select 'Dokumentarkiv',count(*)::bigint,min(sf.created_at),max(sf.created_at),
           'needs_lifecycle','Mangler archived_at/retention-anchor','school_files metadata; Storage skal behandles sammen med metadata'
    from public.school_files sf
    where sf.school_id=p_school_id

    union all
    select 'Personalefravær',count(*)::bigint,
           min(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),
           max(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),
           'ready_for_policy','absence_date','staff_absence'
    from public.staff_absence sa
    where sa.school_id=p_school_id

    union all
    select 'Arbejdstid',count(*)::bigint,
           min(w.work_date::timestamp at time zone 'Europe/Copenhagen'),
           max(w.work_date::timestamp at time zone 'Europe/Copenhagen'),
           'ready_for_policy','work_date','work_time_entries'
    from public.work_time_entries w
    where w.school_id=p_school_id

    union all
    select 'Sikkerhedsaudit',count(*)::bigint,min(a.created_at),max(a.created_at),
           'ready_for_policy','created_at','private.security_audit_log'
    from private.security_audit_log a
    where a.school_id=p_school_id

    union all
    select 'Elevsessioner',count(*)::bigint,min(ss.created_at),max(ss.created_at),
           'ready_for_policy','expires_at/revoked_at','private.student_sessions; udløbne/tilbagekaldte sessions'
    from private.student_sessions ss
    join public.students s on s.id=ss.student_id
    join public.classes c on c.id=s.class_id
    where c.school_id=p_school_id

    union all
    select 'Elev-loginforsøg',count(*)::bigint,min(sla.attempted_at),max(sla.attempted_at),
           'ready_for_policy','attempted_at','private.student_login_attempts; kun sikkerheds-/rate-limit-data'
    from private.student_login_attempts sla
    join private.student_access_credentials cred on cred.access_code_hash=sla.code_hash
    join public.students s on s.id=cred.student_id
    join public.classes c on c.id=s.class_id
    where c.school_id=p_school_id
  )
  select i.category,i.record_count,i.oldest_at,i.newest_at,
         'decision_required'::text as policy_status,
         i.readiness,i.retention_anchor,i.note
  from inventory i
  order by i.category;
end;
$function$;

revoke all on function public.admin_retention_inventory(bigint) from public, anon;
grant execute on function public.admin_retention_inventory(bigint) to authenticated, service_role;
