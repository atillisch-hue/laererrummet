create or replace function private.audit_school_file_mutation()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_row public.school_files%rowtype;
begin
  v_row := case when tg_op='DELETE' then old else new end;

  if tg_op='INSERT' then
    perform private.write_security_audit_event(
      v_row.school_id,auth.uid(),'school_file_uploaded','school_file',v_row.id::text,
      jsonb_build_object('area',v_row.area,'category',v_row.category)
    );
  elsif tg_op='DELETE' then
    perform private.write_security_audit_event(
      v_row.school_id,auth.uid(),'school_file_deleted','school_file',v_row.id::text,
      jsonb_build_object('area',v_row.area,'category',v_row.category)
    );
  elsif tg_op='UPDATE' then
    if old.archived is distinct from new.archived then
      perform private.write_security_audit_event(
        new.school_id,auth.uid(),case when new.archived then 'school_file_archived' else 'school_file_unarchived' end,
        'school_file',new.id::text,jsonb_build_object('area',new.area,'category',new.category)
      );
    end if;

    if old.display_name is distinct from new.display_name
       or old.category is distinct from new.category
       or old.description is distinct from new.description
       or old.board_meeting_id is distinct from new.board_meeting_id
       or old.noticeboard_post_id is distinct from new.noticeboard_post_id then
      perform private.write_security_audit_event(
        new.school_id,auth.uid(),'school_file_metadata_updated','school_file',new.id::text,
        jsonb_build_object('area',new.area,'category',new.category)
      );
    end if;
  end if;

  return coalesce(new,old);
end;
$function$;

revoke all on function private.audit_school_file_mutation() from public,anon,authenticated;

drop trigger if exists school_files_security_audit on public.school_files;
create trigger school_files_security_audit
after insert or update or delete on public.school_files
for each row execute function private.audit_school_file_mutation();

create or replace function public.record_school_file_access(p_file_id uuid,p_access_kind text default 'open')
returns void
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_school_id bigint;
  v_area text;
  v_category text;
  v_noticeboard_post_id uuid;
  v_author_id uuid;
  v_audiences text[];
  v_allowed boolean:=false;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_access_kind not in ('open','download') then raise exception 'Invalid file access kind'; end if;

  select sf.school_id,sf.area,sf.category,sf.noticeboard_post_id
    into v_school_id,v_area,v_category,v_noticeboard_post_id
  from public.school_files sf
  where sf.id=p_file_id;

  if v_school_id is null then raise exception 'File not found'; end if;

  if v_area='board' then
    v_allowed:=public.has_school_role(v_school_id,'board');
  elsif v_area='noticeboard' then
    select np.author_id,np.audiences into v_author_id,v_audiences
    from public.noticeboard_posts np
    where np.id=v_noticeboard_post_id and np.school_id=v_school_id;

    v_allowed:=public.is_school_member(v_school_id) and (
      v_author_id=auth.uid()
      or public.has_school_role(v_school_id,'admin')
      or exists(
        select 1 from public.school_memberships sm
        where sm.user_id=auth.uid()
          and sm.school_id=v_school_id
          and sm.active=true
          and sm.role=any(coalesce(v_audiences,'{}'::text[]))
      )
    );
  end if;

  if not coalesce(v_allowed,false) then raise exception 'File access denied'; end if;

  perform private.write_security_audit_event(
    v_school_id,auth.uid(),'school_file_accessed','school_file',p_file_id::text,
    jsonb_build_object('area',v_area,'category',v_category,'access_kind',p_access_kind)
  );
end;
$function$;

revoke all on function public.record_school_file_access(uuid,text) from public,anon;
grant execute on function public.record_school_file_access(uuid,text) to authenticated;
