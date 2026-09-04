create or replace function public.service_replace_school_user_roles(
  p_actor_user_id uuid,
  p_school_id bigint,
  p_user_id uuid,
  p_roles text[]
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_roles text[];
  v_was_active boolean;
  v_target_is_active_admin boolean;
  v_active_admins integer;
begin
  perform pg_advisory_xact_lock(p_school_id);

  if not exists (
    select 1 from public.school_memberships sm
    where sm.user_id=p_actor_user_id
      and sm.school_id=p_school_id
      and sm.role='admin'
      and sm.active=true
  ) then
    raise exception 'Admin access required';
  end if;

  if not exists (
    select 1 from public.school_memberships sm
    where sm.user_id=p_user_id and sm.school_id=p_school_id
  ) then
    raise exception 'Target user is not a member of this school';
  end if;

  select array_agg(distinct r order by r)
  into v_roles
  from unnest(coalesce(p_roles,'{}'::text[])) r
  where r in ('teacher','staff','leader','parent','board','admin');

  if coalesce(cardinality(v_roles),0)=0
     or cardinality(v_roles)<>cardinality(array(select distinct unnest(coalesce(p_roles,'{}'::text[])))) then
    raise exception 'Invalid roles';
  end if;

  if p_actor_user_id=p_user_id and not ('admin'=any(v_roles)) then
    raise exception 'You cannot remove your own admin role';
  end if;

  select coalesce(bool_or(sm.active),false),
         coalesce(bool_or(sm.active and sm.role='admin'),false)
  into v_was_active,v_target_is_active_admin
  from public.school_memberships sm
  where sm.school_id=p_school_id and sm.user_id=p_user_id;

  if v_target_is_active_admin and not ('admin'=any(v_roles)) then
    select count(distinct sm.user_id) into v_active_admins
    from public.school_memberships sm
    where sm.school_id=p_school_id and sm.role='admin' and sm.active=true;
    if v_active_admins<=1 then
      raise exception 'The school must keep at least one active administrator';
    end if;
  end if;

  delete from public.school_memberships
  where school_id=p_school_id and user_id=p_user_id;

  insert into public.school_memberships(school_id,user_id,role,active)
  select p_school_id,p_user_id,r,v_was_active
  from unnest(v_roles) r;
end;
$$;

revoke all on function public.service_replace_school_user_roles(uuid,bigint,uuid,text[]) from public,anon,authenticated;
grant execute on function public.service_replace_school_user_roles(uuid,bigint,uuid,text[]) to service_role;

create or replace function public.service_set_school_user_active(
  p_actor_user_id uuid,
  p_school_id bigint,
  p_user_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_target_is_active_admin boolean;
  v_active_admins integer;
begin
  perform pg_advisory_xact_lock(p_school_id);

  if not exists (
    select 1 from public.school_memberships sm
    where sm.user_id=p_actor_user_id
      and sm.school_id=p_school_id
      and sm.role='admin'
      and sm.active=true
  ) then
    raise exception 'Admin access required';
  end if;

  if not exists (
    select 1 from public.school_memberships sm
    where sm.user_id=p_user_id and sm.school_id=p_school_id
  ) then
    raise exception 'Target user is not a member of this school';
  end if;

  if p_actor_user_id=p_user_id and not p_active then
    raise exception 'You cannot deactivate your own access';
  end if;

  select coalesce(bool_or(sm.active and sm.role='admin'),false)
  into v_target_is_active_admin
  from public.school_memberships sm
  where sm.school_id=p_school_id and sm.user_id=p_user_id;

  if not p_active and v_target_is_active_admin then
    select count(distinct sm.user_id) into v_active_admins
    from public.school_memberships sm
    where sm.school_id=p_school_id and sm.role='admin' and sm.active=true;
    if v_active_admins<=1 then
      raise exception 'The school must keep at least one active administrator';
    end if;
  end if;

  update public.school_memberships
  set active=p_active
  where school_id=p_school_id and user_id=p_user_id;
end;
$$;

revoke all on function public.service_set_school_user_active(uuid,bigint,uuid,boolean) from public,anon,authenticated;
grant execute on function public.service_set_school_user_active(uuid,bigint,uuid,boolean) to service_role;
