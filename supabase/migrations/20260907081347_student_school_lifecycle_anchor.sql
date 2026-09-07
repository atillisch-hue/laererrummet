alter table public.students add column school_left_at date;
create index students_school_left_at_idx on public.students(school_left_at) where school_left_at is not null;

create or replace function private.audit_student_school_lifecycle()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_school_id bigint;
begin
  if old.school_left_at is distinct from new.school_left_at then
    select c.school_id into v_school_id from public.classes c where c.id=new.class_id;
    perform private.write_security_audit_event(
      v_school_id,auth.uid(),'student_school_lifecycle_changed','student',new.id::text,
      jsonb_build_object('old_school_left_at',old.school_left_at,'new_school_left_at',new.school_left_at)
    );
  end if;
  return new;
end;
$function$;

revoke all on function private.audit_student_school_lifecycle() from public,anon,authenticated;
drop trigger if exists students_school_lifecycle_audit on public.students;
create trigger students_school_lifecycle_audit
after update of school_left_at on public.students
for each row execute function private.audit_student_school_lifecycle();

create or replace function public.admin_retention_inventory(p_school_id bigint)
returns table(category text,record_count bigint,oldest_at timestamptz,newest_at timestamptz,policy_status text,readiness text,retention_anchor text,note text)
language plpgsql
security definer
set search_path=''
as $function$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if coalesce(auth.jwt()->>'aal','') <> 'aal2' then raise exception 'MFA required' using errcode='42501'; end if;
  if not public.has_school_role(p_school_id,'admin') then raise exception 'Admin access required'; end if;

  return query
  with inventory as (
    select 'Elevgrunddata'::text,count(*)::bigint,
           min(s.school_left_at::timestamp at time zone 'Europe/Copenhagen'),
           max(s.school_left_at::timestamp at time zone 'Europe/Copenhagen'),
           'ready_for_policy'::text,'school_left_at (kun elever der har forladt skolen)'::text,
           'students + relationer; datoen er kun retention-anker og er endnu ikke et komplet offboarding-flow'::text
    from public.students s join public.classes c on c.id=s.class_id where c.school_id=p_school_id
    union all
    select 'Elevfravær',count(*)::bigint,min(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),max(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),'ready_for_policy','absence_date','student_absence'
    from public.student_absence sa join public.students s on s.id=sa.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id
    union all
    select 'Faglige elevforsøg',count(*)::bigint,min(x.at),max(x.at),'ready_for_policy','completed_at','grammatik + læseprøve + staveprøve'
    from (
      select ga.completed_at as at from public.grammar_attempts ga join public.students s on s.id=ga.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id
      union all select ra.completed_at from public.reading_exam_attempts ra join public.students s on s.id=ra.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id
      union all select spa.completed_at from public.spelling_exam_attempts spa join public.students s on s.id=spa.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id
    ) x
    union all
    select 'Elevplaner',count(*)::bigint,min(sap.closed_at),max(sap.closed_at),'ready_for_policy','closed_at (kun afsluttede/arkiverede planer)','student_action_plans'
    from public.student_action_plans sap join public.students s on s.id=sap.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id
    union all
    select 'Møder',count(*)::bigint,min(cm.ends_at),max(cm.ends_at),'ready_for_policy','ends_at','calendar_meetings inkl. evt. elevkobling og interne noter'
    from public.calendar_meetings cm where cm.school_id=p_school_id
    union all
    select 'Dokumentarkiv',count(*)::bigint,min(sf.archived_at),max(sf.archived_at),'ready_for_policy','archived_at (kun arkiverede filer)','school_files metadata; Storage skal behandles sammen med metadata'
    from public.school_files sf where sf.school_id=p_school_id
    union all
    select 'Personalefravær',count(*)::bigint,min(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),max(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),'ready_for_policy','absence_date','staff_absence'
    from public.staff_absence sa where sa.school_id=p_school_id
    union all
    select 'Arbejdstid',count(*)::bigint,min(w.work_date::timestamp at time zone 'Europe/Copenhagen'),max(w.work_date::timestamp at time zone 'Europe/Copenhagen'),'ready_for_policy','work_date','work_time_entries'
    from public.work_time_entries w where w.school_id=p_school_id
    union all
    select 'Sikkerhedsaudit',count(*)::bigint,min(a.created_at),max(a.created_at),'ready_for_policy','created_at','private.security_audit_log'
    from private.security_audit_log a where a.school_id=p_school_id
    union all
    select 'Elevsessioner',count(*)::bigint,min(ss.created_at),max(ss.created_at),'ready_for_policy','expires_at/revoked_at','private.student_sessions; udløbne/tilbagekaldte sessions'
    from private.student_sessions ss join public.students s on s.id=ss.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id
    union all
    select 'Elev-loginforsøg',count(*)::bigint,min(sla.attempted_at),max(sla.attempted_at),'ready_for_policy','attempted_at','private.student_login_attempts; kun forsøg der fortsat kan knyttes sikkert til skolen'
    from private.student_login_attempts sla join private.student_access_credentials cred on cred.access_code_hash=sla.code_hash join public.students s on s.id=cred.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id
  )
  select i.column1,i.column2,i.column3,i.column4,'decision_required'::text,i.column5,i.column6,i.column7 from inventory i order by i.column1;
end;
$function$;

revoke all on function public.admin_retention_inventory(bigint) from public,anon;
grant execute on function public.admin_retention_inventory(bigint) to authenticated,service_role;

create or replace function public.admin_retention_preview(p_school_id bigint,p_category text,p_cutoff_at timestamptz)
returns table(category text,cutoff_at timestamptz,candidate_count bigint,oldest_candidate_at timestamptz,newest_candidate_at timestamptz,readiness text,note text)
language plpgsql
security definer
set search_path=''
as $function$
declare v_count bigint:=0; v_oldest timestamptz; v_newest timestamptz; v_note text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if coalesce(auth.jwt()->>'aal','') <> 'aal2' then raise exception 'MFA required' using errcode='42501'; end if;
  if not public.has_school_role(p_school_id,'admin') then raise exception 'Admin access required'; end if;
  if p_cutoff_at is null then raise exception 'Cutoff date required'; end if;

  case p_category
    when 'Elevgrunddata' then
      select count(*),min(s.school_left_at::timestamp at time zone 'Europe/Copenhagen'),max(s.school_left_at::timestamp at time zone 'Europe/Copenhagen') into v_count,v_oldest,v_newest
      from public.students s join public.classes c on c.id=s.class_id
      where c.school_id=p_school_id and s.school_left_at is not null and (s.school_left_at::timestamp at time zone 'Europe/Copenhagen') < p_cutoff_at;
      v_note:='Kun elever med en registreret dato for at have forladt skolen. Dette er ikke et slette- eller offboarding-flow.';
    when 'Elevfravær' then
      select count(*),min(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),max(sa.absence_date::timestamp at time zone 'Europe/Copenhagen') into v_count,v_oldest,v_newest from public.student_absence sa join public.students s on s.id=sa.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and (sa.absence_date::timestamp at time zone 'Europe/Copenhagen')<p_cutoff_at; v_note:='Elevfravær før skæringsdatoen.';
    when 'Faglige elevforsøg' then
      select count(*),min(x.at),max(x.at) into v_count,v_oldest,v_newest from (
        select ga.completed_at at from public.grammar_attempts ga join public.students s on s.id=ga.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and ga.completed_at<p_cutoff_at
        union all select ra.completed_at from public.reading_exam_attempts ra join public.students s on s.id=ra.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and ra.completed_at<p_cutoff_at
        union all select spa.completed_at from public.spelling_exam_attempts spa join public.students s on s.id=spa.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and spa.completed_at<p_cutoff_at) x; v_note:='Faglige elevforsøg før skæringsdatoen.';
    when 'Elevplaner' then
      select count(*),min(sap.closed_at),max(sap.closed_at) into v_count,v_oldest,v_newest from public.student_action_plans sap join public.students s on s.id=sap.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and sap.closed_at is not null and sap.closed_at<p_cutoff_at; v_note:='Kun afsluttede/arkiverede elevplaner.';
    when 'Møder' then
      select count(*),min(cm.ends_at),max(cm.ends_at) into v_count,v_oldest,v_newest from public.calendar_meetings cm where cm.school_id=p_school_id and cm.ends_at<p_cutoff_at; v_note:='Møder afsluttet før skæringsdatoen.';
    when 'Dokumentarkiv' then
      select count(*),min(sf.archived_at),max(sf.archived_at) into v_count,v_oldest,v_newest from public.school_files sf where sf.school_id=p_school_id and sf.archived_at is not null and sf.archived_at<p_cutoff_at; v_note:='Kun arkiverede filer; metadata og Storage-objekt skal behandles samlet.';
    when 'Personalefravær' then
      select count(*),min(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),max(sa.absence_date::timestamp at time zone 'Europe/Copenhagen') into v_count,v_oldest,v_newest from public.staff_absence sa where sa.school_id=p_school_id and (sa.absence_date::timestamp at time zone 'Europe/Copenhagen')<p_cutoff_at; v_note:='Personalefravær før skæringsdatoen.';
    when 'Arbejdstid' then
      select count(*),min(w.work_date::timestamp at time zone 'Europe/Copenhagen'),max(w.work_date::timestamp at time zone 'Europe/Copenhagen') into v_count,v_oldest,v_newest from public.work_time_entries w where w.school_id=p_school_id and (w.work_date::timestamp at time zone 'Europe/Copenhagen')<p_cutoff_at; v_note:='Arbejdstidsposter før skæringsdatoen.';
    when 'Sikkerhedsaudit' then
      select count(*),min(a.created_at),max(a.created_at) into v_count,v_oldest,v_newest from private.security_audit_log a where a.school_id=p_school_id and a.created_at<p_cutoff_at; v_note:='Audit-events før skæringsdatoen; endelig periode skal begrundes særskilt.';
    when 'Elevsessioner' then
      select count(*),min(coalesce(ss.revoked_at,ss.expires_at)),max(coalesce(ss.revoked_at,ss.expires_at)) into v_count,v_oldest,v_newest from private.student_sessions ss join public.students s on s.id=ss.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and (ss.revoked_at is not null or ss.expires_at<now()) and coalesce(ss.revoked_at,ss.expires_at)<p_cutoff_at; v_note:='Kun udløbne eller tilbagekaldte elevsessioner.';
    when 'Elev-loginforsøg' then
      select count(*),min(sla.attempted_at),max(sla.attempted_at) into v_count,v_oldest,v_newest from private.student_login_attempts sla join private.student_access_credentials cred on cred.access_code_hash=sla.code_hash join public.students s on s.id=cred.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and sla.attempted_at<p_cutoff_at; v_note:='Kun loginforsøg der fortsat kan knyttes sikkert til skolens aktuelle elevcredential.';
    else raise exception 'Unknown retention category';
  end case;

  return query select p_category,p_cutoff_at,coalesce(v_count,0),v_oldest,v_newest,'preview_only'::text,v_note;
end;
$function$;

revoke all on function public.admin_retention_preview(bigint,text,timestamptz) from public,anon;
grant execute on function public.admin_retention_preview(bigint,text,timestamptz) to authenticated;
