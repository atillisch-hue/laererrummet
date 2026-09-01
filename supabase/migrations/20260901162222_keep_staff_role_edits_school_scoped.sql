create or replace function public.update_staff_member(p_user_id uuid,p_display_name text,p_role text,p_active boolean)
returns void
language plpgsql
security definer
set search_path='public'
as $$
declare v_school_id bigint; v_any_active boolean;
begin
  v_school_id:=public.resolve_single_active_school(auth.uid(),array['admin']);
  if v_school_id is null then raise exception 'Administratorens skole kunne ikke bestemmes entydigt'; end if;
  if not public.has_school_role(v_school_id,'admin') then raise exception 'Kun administratorer kan ændre personale'; end if;
  if not exists(select 1 from public.school_memberships sm where sm.user_id=p_user_id and sm.school_id=v_school_id) then raise exception 'Medarbejderen tilhører ikke denne skole'; end if;
  if nullif(trim(p_display_name),'') is null then raise exception 'Medarbejderen skal have et navn'; end if;

  update public.school_memberships set active=p_active where user_id=p_user_id and school_id=v_school_id;
  select exists(select 1 from public.school_memberships sm where sm.user_id=p_user_id and sm.active=true) into v_any_active;

  update public.user_profiles
  set display_name=trim(p_display_name),active=v_any_active,
      role=case when p_role in ('teacher','admin','board','parent','student') then p_role else role end,
      updated_at=now()
  where user_id=p_user_id;
  if not found then raise exception 'Medarbejderen blev ikke fundet'; end if;
end;
$$;

create or replace function public.update_staff_roles(p_user_id uuid,p_roles text[])
returns void
language plpgsql
security definer
set search_path='public'
as $$
declare v_school_id bigint; v_active boolean; v_primary text;
begin
  v_school_id:=public.resolve_single_active_school(auth.uid(),array['admin']);
  if v_school_id is null then raise exception 'Administratorens skole kunne ikke bestemmes entydigt'; end if;
  if not public.has_school_role(v_school_id,'admin') then raise exception 'Kun administratorer kan ændre brugerroller'; end if;
  if p_roles is null or cardinality(p_roles)=0 then raise exception 'Brugeren skal have mindst én rolle'; end if;
  if exists(select 1 from unnest(p_roles) r where r not in ('teacher','admin','board','parent','student')) then raise exception 'Ugyldig rolle'; end if;
  if not exists(select 1 from public.school_memberships sm where sm.user_id=p_user_id and sm.school_id=v_school_id) then raise exception 'Brugeren tilhører ikke denne skole'; end if;

  select coalesce(bool_or(sm.active),true) into v_active
  from public.school_memberships sm
  where sm.user_id=p_user_id and sm.school_id=v_school_id;

  delete from public.school_memberships where user_id=p_user_id and school_id=v_school_id;
  insert into public.school_memberships(school_id,user_id,role,active)
  select v_school_id,p_user_id,r,v_active from (select distinct unnest(p_roles) r) x;

  delete from public.user_roles where user_id=p_user_id;
  insert into public.user_roles(user_id,role) select p_user_id,r from (select distinct unnest(p_roles) r) x;

  select case when 'admin'=any(p_roles) then 'admin' when 'teacher'=any(p_roles) then 'teacher' when 'board'=any(p_roles) then 'board' else p_roles[1] end into v_primary;
  update public.user_profiles set role=v_primary,updated_at=now() where user_id=p_user_id;
end;
$$;

revoke all on function public.update_staff_member(uuid,text,text,boolean) from public,anon;
revoke all on function public.update_staff_roles(uuid,text[]) from public,anon;
grant execute on function public.update_staff_member(uuid,text,text,boolean) to authenticated,service_role;
grant execute on function public.update_staff_roles(uuid,text[]) to authenticated,service_role;
