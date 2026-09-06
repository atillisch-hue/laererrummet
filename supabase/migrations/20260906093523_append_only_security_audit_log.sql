create table private.security_audit_log (
  id bigint generated always as identity primary key,
  school_id bigint not null references public.schools(id) on delete restrict,
  actor_user_id uuid,
  action text not null check (length(action) between 1 and 80),
  entity_type text not null check (length(entity_type) between 1 and 80),
  entity_id text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  created_at timestamptz not null default now()
);

create index security_audit_log_school_created_idx
  on private.security_audit_log(school_id,created_at desc,id desc);
create index security_audit_log_actor_created_idx
  on private.security_audit_log(actor_user_id,created_at desc)
  where actor_user_id is not null;

revoke all on table private.security_audit_log from public,anon,authenticated;
revoke all on sequence private.security_audit_log_id_seq from public,anon,authenticated;

create function private.write_security_audit_event(
  p_school_id bigint,
  p_actor_user_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_school_id is null then raise exception 'Audit school is required'; end if;
  if nullif(trim(p_action),'') is null or nullif(trim(p_entity_type),'') is null then
    raise exception 'Audit action and entity type are required';
  end if;
  if jsonb_typeof(coalesce(p_metadata,'{}'::jsonb)) <> 'object' then
    raise exception 'Audit metadata must be a JSON object';
  end if;
  insert into private.security_audit_log(school_id,actor_user_id,action,entity_type,entity_id,metadata)
  values(p_school_id,p_actor_user_id,trim(p_action),trim(p_entity_type),p_entity_id,coalesce(p_metadata,'{}'::jsonb));
end;
$$;
revoke all on function private.write_security_audit_event(bigint,uuid,text,text,text,jsonb) from public,anon,authenticated;

create function private.reject_security_audit_mutation()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  raise exception 'Security audit log is append-only';
end;
$$;
revoke all on function private.reject_security_audit_mutation() from public,anon,authenticated;

create trigger security_audit_log_append_only
before update or delete on private.security_audit_log
for each row execute function private.reject_security_audit_mutation();

create function private.audit_parent_student_link_change()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_school_id bigint;
  v_parent_id uuid;
  v_student_id bigint;
begin
  v_parent_id:=case when tg_op='DELETE' then old.parent_id else new.parent_id end;
  v_student_id:=case when tg_op='DELETE' then old.student_id else new.student_id end;
  select c.school_id into v_school_id
  from public.students s join public.classes c on c.id=s.class_id
  where s.id=v_student_id;
  if v_school_id is not null then
    perform private.write_security_audit_event(
      v_school_id,auth.uid(),
      case when tg_op='DELETE' then 'parent_student_unlinked' else 'parent_student_linked' end,
      'parent_student',
      v_student_id::text||':'||v_parent_id::text,
      jsonb_build_object('student_id',v_student_id,'parent_user_id',v_parent_id)
    );
  end if;
  return case when tg_op='DELETE' then old else new end;
end;
$$;
revoke all on function private.audit_parent_student_link_change() from public,anon,authenticated;

create trigger audit_parent_student_link_change
after insert or delete on public.parent_students
for each row execute function private.audit_parent_student_link_change();

create function private.audit_student_credential_change()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_school_id bigint;
  v_action text;
begin
  if tg_op='INSERT' then
    v_action:='student_access_issued';
  elsif new.access_code_hash is distinct from old.access_code_hash then
    v_action:='student_access_rotated';
  else
    return new;
  end if;
  select c.school_id into v_school_id
  from public.students s join public.classes c on c.id=s.class_id
  where s.id=new.student_id;
  if v_school_id is not null then
    perform private.write_security_audit_event(
      v_school_id,auth.uid(),v_action,'student_access',new.student_id::text,
      jsonb_build_object('student_id',new.student_id,'code_length',new.code_length,'needs_rotation',new.needs_rotation)
    );
  end if;
  return new;
end;
$$;
revoke all on function private.audit_student_credential_change() from public,anon,authenticated;

create trigger audit_student_credential_change
after insert or update on private.student_access_credentials
for each row execute function private.audit_student_credential_change();

create function private.audit_schedule_publish()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare
  v_school_id bigint;
begin
  if old.status is distinct from new.status and new.status='published' then
    select sy.school_id into v_school_id
    from public.school_years sy where sy.id=new.school_year_id;
    if v_school_id is not null then
      perform private.write_security_audit_event(
        v_school_id,coalesce(new.published_by,auth.uid()),'schedule_published','schedule_version',new.id::text,
        jsonb_build_object('schedule_version_id',new.id,'school_year_id',new.school_year_id,'effective_from',new.effective_from)
      );
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.audit_schedule_publish() from public,anon,authenticated;

create trigger audit_schedule_publish
after update on public.school_schedule_versions
for each row execute function private.audit_schedule_publish();

create or replace function public.service_replace_school_user_roles(
  p_actor_user_id uuid,p_school_id bigint,p_user_id uuid,p_roles text[]
) returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_roles text[];
  v_old_roles text[];
  v_was_active boolean;
  v_target_is_active_admin boolean;
  v_active_admins integer;
begin
  perform pg_advisory_xact_lock(p_school_id);
  if not exists(select 1 from public.school_memberships sm where sm.user_id=p_actor_user_id and sm.school_id=p_school_id and sm.role='admin' and sm.active=true) then
    raise exception 'Admin access required';
  end if;
  if not exists(select 1 from public.school_memberships sm where sm.user_id=p_user_id and sm.school_id=p_school_id) then
    raise exception 'Target user is not a member of this school';
  end if;

  select array_agg(distinct r order by r) into v_roles
  from unnest(coalesce(p_roles,'{}'::text[])) r
  where r in ('teacher','staff','leader','parent','board','admin');
  if coalesce(cardinality(v_roles),0)=0 or cardinality(v_roles)<>cardinality(array(select distinct unnest(coalesce(p_roles,'{}'::text[])))) then
    raise exception 'Invalid roles';
  end if;
  if p_actor_user_id=p_user_id and not ('admin'=any(v_roles)) then
    raise exception 'You cannot remove your own admin role';
  end if;

  select array_agg(sm.role order by sm.role),coalesce(bool_or(sm.active),false),coalesce(bool_or(sm.active and sm.role='admin'),false)
    into v_old_roles,v_was_active,v_target_is_active_admin
  from public.school_memberships sm where sm.school_id=p_school_id and sm.user_id=p_user_id;

  if v_target_is_active_admin and not ('admin'=any(v_roles)) then
    select count(distinct sm.user_id) into v_active_admins from public.school_memberships sm
    where sm.school_id=p_school_id and sm.role='admin' and sm.active=true;
    if v_active_admins<=1 then raise exception 'The school must keep at least one active administrator'; end if;
  end if;

  delete from public.school_memberships where school_id=p_school_id and user_id=p_user_id;
  insert into public.school_memberships(school_id,user_id,role,active)
  select p_school_id,p_user_id,r,v_was_active from unnest(v_roles) r;

  if v_old_roles is distinct from v_roles then
    perform private.write_security_audit_event(
      p_school_id,p_actor_user_id,'user_roles_replaced','school_user',p_user_id::text,
      jsonb_build_object('target_user_id',p_user_id,'old_roles',coalesce(to_jsonb(v_old_roles),'[]'::jsonb),'new_roles',to_jsonb(v_roles))
    );
  end if;
end;
$$;

create or replace function public.service_set_school_user_active(
  p_actor_user_id uuid,p_school_id bigint,p_user_id uuid,p_active boolean
) returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  v_target_is_active_admin boolean;
  v_active_admins integer;
  v_old_active boolean;
begin
  perform pg_advisory_xact_lock(p_school_id);
  if not exists(select 1 from public.school_memberships sm where sm.user_id=p_actor_user_id and sm.school_id=p_school_id and sm.role='admin' and sm.active=true) then
    raise exception 'Admin access required';
  end if;
  if not exists(select 1 from public.school_memberships sm where sm.user_id=p_user_id and sm.school_id=p_school_id) then
    raise exception 'Target user is not a member of this school';
  end if;
  if p_actor_user_id=p_user_id and not p_active then raise exception 'You cannot deactivate your own access'; end if;

  select coalesce(bool_or(sm.active),false),coalesce(bool_or(sm.active and sm.role='admin'),false)
    into v_old_active,v_target_is_active_admin
  from public.school_memberships sm where sm.school_id=p_school_id and sm.user_id=p_user_id;

  if not p_active and v_target_is_active_admin then
    select count(distinct sm.user_id) into v_active_admins from public.school_memberships sm
    where sm.school_id=p_school_id and sm.role='admin' and sm.active=true;
    if v_active_admins<=1 then raise exception 'The school must keep at least one active administrator'; end if;
  end if;

  update public.school_memberships set active=p_active where school_id=p_school_id and user_id=p_user_id;

  if v_old_active is distinct from p_active then
    perform private.write_security_audit_event(
      p_school_id,p_actor_user_id,'user_access_status_changed','school_user',p_user_id::text,
      jsonb_build_object('target_user_id',p_user_id,'old_active',v_old_active,'new_active',p_active)
    );
  end if;
end;
$$;

create or replace function public.admin_security_audit_events(p_limit integer default 100)
returns table(
  id bigint,
  school_id bigint,
  actor_user_id uuid,
  actor_name text,
  action text,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path=''
as $$
  select a.id,a.school_id,a.actor_user_id,coalesce(up.display_name,up.initials,'Ukendt/system'),a.action,a.entity_type,a.entity_id,a.metadata,a.created_at
  from private.security_audit_log a
  left join public.user_profiles up on up.user_id=a.actor_user_id
  where exists(
    select 1 from public.school_memberships sm
    where sm.school_id=a.school_id and sm.user_id=auth.uid() and sm.role='admin' and sm.active=true
  )
  order by a.created_at desc,a.id desc
  limit least(greatest(coalesce(p_limit,100),1),500);
$$;
revoke all on function public.admin_security_audit_events(integer) from public,anon;
grant execute on function public.admin_security_audit_events(integer) to authenticated;

revoke all on function public.update_staff_roles(uuid,text[]) from public,anon,authenticated;
revoke all on function public.update_staff_member(uuid,text,text,boolean) from public,anon,authenticated;

comment on table private.security_audit_log is 'Append-only security audit events. Never store passwords, access codes, hashes, message content, or sensitive notes.';
comment on function public.admin_security_audit_events(integer) is 'Admin-only read surface for append-only security audit events in schools where the caller is an active admin.';
