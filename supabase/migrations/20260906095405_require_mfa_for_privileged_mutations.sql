do $$
declare
  v_sig text;
  v_oid regprocedure;
  v_def text;
  v_patched text;
begin
  foreach v_sig in array array[
    'public.admin_create_student(bigint,bigint,text,text,smallint)',
    'public.admin_rotate_student_access_code(bigint,text)',
    'public.admin_link_parent(uuid,bigint)',
    'public.admin_unlink_parent(uuid,bigint)',
    'public.admin_create_schedule_entry_v2(bigint,bigint,integer,time without time zone,time without time zone,text,text,text,uuid[],text,bigint)',
    'public.admin_update_schedule_entry_v2(bigint,bigint,integer,time without time zone,time without time zone,text,text,text,uuid[],text,bigint)',
    'public.admin_delete_schedule_entry_v2(bigint)',
    'public.publish_schedule_version_v2(bigint,date)',
    'public.save_school_year_calendar(bigint,date,date,jsonb,jsonb)'
  ] loop
    v_oid:=to_regprocedure(v_sig);
    if v_oid is null then
      raise exception 'Expected privileged function is missing: %',v_sig;
    end if;
    v_def:=pg_get_functiondef(v_oid);
    if position('MFA required' in v_def)=0 then
      v_patched:=regexp_replace(
        v_def,
        E'(?i)\\nbegin\\n',
        E'\nbegin\n  if auth.role() <> ''service_role'' and coalesce(auth.jwt()->>''aal'','''') <> ''aal2'' then\n    raise exception ''MFA required'' using errcode=''42501'';\n  end if;\n',
        1,1
      );
      if v_patched=v_def or position('MFA required' in v_patched)=0 then
        raise exception 'Could not inject MFA guard into %',v_sig;
      end if;
      execute v_patched;
    end if;
  end loop;
end;
$$;

revoke all on function public.admin_update_schedule_entry(bigint,bigint,integer,time without time zone,time without time zone,text,text,text,uuid[],text) from public,anon,authenticated;

comment on function public.publish_schedule_version_v2(bigint,date) is 'Leadership schedule publication. Requires an authenticated AAL2 MFA session unless invoked by trusted service_role.';
comment on function public.admin_create_student(bigint,bigint,text,text,smallint) is 'Admin-only student creation. Requires an authenticated AAL2 MFA session unless invoked by trusted service_role.';
