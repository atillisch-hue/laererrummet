create or replace function public.admin_retention_preview(
  p_school_id bigint,
  p_category text,
  p_cutoff_at timestamptz
)
returns table(
  category text,
  cutoff_at timestamptz,
  candidate_count bigint,
  oldest_candidate_at timestamptz,
  newest_candidate_at timestamptz,
  readiness text,
  note text
)
language plpgsql
security definer
set search_path=''
as $$
declare
  v_count bigint := 0;
  v_oldest timestamptz;
  v_newest timestamptz;
  v_note text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if coalesce(auth.jwt()->>'aal','') <> 'aal2' then raise exception 'MFA required' using errcode='42501'; end if;
  if not public.has_school_role(p_school_id,'admin') then raise exception 'Admin access required'; end if;
  if p_cutoff_at is null then raise exception 'Cutoff date required'; end if;

  case p_category
    when 'Elevgrunddata' then
      return query select p_category,p_cutoff_at,0::bigint,null::timestamptz,null::timestamptz,
        'not_ready'::text,'Mangler sikker livscyklusdato for udskrivning/inaktivering. Oprettelsesdato må ikke bruges som sletteanker.'::text;
      return;

    when 'Elevfravær' then
      select count(*),min(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),max(sa.absence_date::timestamp at time zone 'Europe/Copenhagen')
      into v_count,v_oldest,v_newest
      from public.student_absence sa
      join public.students s on s.id=sa.student_id
      join public.classes c on c.id=s.class_id
      where c.school_id=p_school_id
        and (sa.absence_date::timestamp at time zone 'Europe/Copenhagen') < p_cutoff_at;
      v_note := 'Kun poster før den valgte skæringsdato. Ingen sletning udføres.';

    when 'Faglige elevforsøg' then
      select count(*),min(x.at),max(x.at) into v_count,v_oldest,v_newest
      from (
        select ga.completed_at as at from public.grammar_attempts ga join public.students s on s.id=ga.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and ga.completed_at < p_cutoff_at
        union all
        select ra.completed_at from public.reading_exam_attempts ra join public.students s on s.id=ra.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and ra.completed_at < p_cutoff_at
        union all
        select spa.completed_at from public.spelling_exam_attempts spa join public.students s on s.id=spa.student_id join public.classes c on c.id=s.class_id where c.school_id=p_school_id and spa.completed_at < p_cutoff_at
      ) x;
      v_note := 'Grammatik-, læseprøve- og staveprøveforsøg før skæringsdatoen.';

    when 'Elevplaner' then
      select count(*),min(sap.closed_at),max(sap.closed_at) into v_count,v_oldest,v_newest
      from public.student_action_plans sap
      join public.students s on s.id=sap.student_id
      join public.classes c on c.id=s.class_id
      where c.school_id=p_school_id and sap.closed_at is not null and sap.closed_at < p_cutoff_at;
      v_note := 'Kun afsluttede planer med closed_at før skæringsdatoen.';

    when 'Møder' then
      select count(*),min(cm.ends_at),max(cm.ends_at) into v_count,v_oldest,v_newest
      from public.calendar_meetings cm where cm.school_id=p_school_id and cm.ends_at < p_cutoff_at;
      v_note := 'Møder afsluttet før skæringsdatoen; kan indeholde elevkoblinger og interne noter.';

    when 'Dokumentarkiv' then
      select count(*),min(sf.archived_at),max(sf.archived_at) into v_count,v_oldest,v_newest
      from public.school_files sf
      where sf.school_id=p_school_id and sf.archived_at is not null and sf.archived_at < p_cutoff_at;
      v_note := 'Kun arkiverede filer. Metadata og Storage-objekt skal altid behandles samlet.';

    when 'Personalefravær' then
      select count(*),min(sa.absence_date::timestamp at time zone 'Europe/Copenhagen'),max(sa.absence_date::timestamp at time zone 'Europe/Copenhagen')
      into v_count,v_oldest,v_newest
      from public.staff_absence sa
      where sa.school_id=p_school_id and (sa.absence_date::timestamp at time zone 'Europe/Copenhagen') < p_cutoff_at;
      v_note := 'Personalefravær før skæringsdatoen.';

    when 'Arbejdstid' then
      select count(*),min(w.work_date::timestamp at time zone 'Europe/Copenhagen'),max(w.work_date::timestamp at time zone 'Europe/Copenhagen')
      into v_count,v_oldest,v_newest
      from public.work_time_entries w
      where w.school_id=p_school_id and (w.work_date::timestamp at time zone 'Europe/Copenhagen') < p_cutoff_at;
      v_note := 'Arbejdstidsposter før skæringsdatoen.';

    when 'Sikkerhedsaudit' then
      select count(*),min(a.created_at),max(a.created_at) into v_count,v_oldest,v_newest
      from private.security_audit_log a
      where a.school_id=p_school_id and a.created_at < p_cutoff_at;
      v_note := 'Audit-events før skæringsdatoen. Endelig periode skal fastsættes efter kontrol- og dokumentationsbehov.';

    when 'Elevsessioner' then
      select count(*),min(coalesce(ss.revoked_at,ss.expires_at)),max(coalesce(ss.revoked_at,ss.expires_at))
      into v_count,v_oldest,v_newest
      from private.student_sessions ss
      join public.students s on s.id=ss.student_id
      join public.classes c on c.id=s.class_id
      where c.school_id=p_school_id
        and (ss.revoked_at is not null or ss.expires_at < now())
        and coalesce(ss.revoked_at,ss.expires_at) < p_cutoff_at;
      v_note := 'Kun udløbne eller tilbagekaldte elevsessioner.';

    when 'Elev-loginforsøg' then
      select count(*),min(sla.attempted_at),max(sla.attempted_at) into v_count,v_oldest,v_newest
      from private.student_login_attempts sla
      join private.student_access_credentials cred on cred.access_code_hash=sla.code_hash
      join public.students s on s.id=cred.student_id
      join public.classes c on c.id=s.class_id
      where c.school_id=p_school_id and sla.attempted_at < p_cutoff_at;
      v_note := 'Sikkerheds-/rate-limit-data før skæringsdatoen. Skoletilknytning kan kun udledes, mens forsøgets kodehash stadig matcher den aktuelle elevcredential.';

    else
      raise exception 'Unknown retention category';
  end case;

  return query select p_category,p_cutoff_at,coalesce(v_count,0),v_oldest,v_newest,'preview_only'::text,v_note;
end;
$$;

revoke all on function public.admin_retention_preview(bigint,text,timestamptz) from public,anon;
grant execute on function public.admin_retention_preview(bigint,text,timestamptz) to authenticated;
