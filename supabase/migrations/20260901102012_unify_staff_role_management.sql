-- Use school_memberships as the authoritative role source for staff administration.

create or replace function public.update_staff_member(p_user_id uuid,p_display_name text,p_role text,p_active boolean)
returns void language plpgsql security definer set search_path='public' as $$
declare v_school_id bigint;
begin
  v_school_id:=public.resolve_single_active_school(auth.uid(),array['admin']);
  if v_school_id is null then raise exception 'Administratorens skole kunne ikke bestemmes entydigt'; end if;
  if not public.has_school_role(v_school_id,'admin') then raise exception 'Kun administratorer kan ændre personale'; end if;
  if not exists(select 1 from public.school_memberships sm where sm.user_id=p_user_id and sm.school_id=v_school_id) then raise exception 'Medarbejderen tilhører ikke denne skole'; end if;
  if nullif(trim(p_display_name),'') is null then raise exception 'Medarbejderen skal have et navn'; end if;
  update public.user_profiles set display_name=trim(p_display_name),active=p_active,role=case when p_role in ('teacher','admin','board','parent','student') then p_role else role end,updated_at=now() where user_id=p_user_id;
  if not found then raise exception 'Medarbejderen blev ikke fundet'; end if;
  update public.school_memberships set active=p_active where user_id=p_user_id and school_id=v_school_id;
end; $$;

create or replace function public.update_staff_roles(p_user_id uuid,p_roles text[])
returns void language plpgsql security definer set search_path='public' as $$
declare v_school_id bigint; v_active boolean; v_primary text;
begin
  v_school_id:=public.resolve_single_active_school(auth.uid(),array['admin']);
  if v_school_id is null then raise exception 'Administratorens skole kunne ikke bestemmes entydigt'; end if;
  if not public.has_school_role(v_school_id,'admin') then raise exception 'Kun administratorer kan ændre brugerroller'; end if;
  if p_roles is null or cardinality(p_roles)=0 then raise exception 'Brugeren skal have mindst én rolle'; end if;
  if exists(select 1 from unnest(p_roles) r where r not in ('teacher','admin','board','parent','student')) then raise exception 'Ugyldig rolle'; end if;
  if not exists(select 1 from public.school_memberships sm where sm.user_id=p_user_id and sm.school_id=v_school_id) then raise exception 'Brugeren tilhører ikke denne skole'; end if;
  select coalesce(up.active,true) into v_active from public.user_profiles up where up.user_id=p_user_id;
  delete from public.school_memberships where user_id=p_user_id and school_id=v_school_id;
  insert into public.school_memberships(school_id,user_id,role,active) select v_school_id,p_user_id,r,coalesce(v_active,true) from (select distinct unnest(p_roles) r) x;
  delete from public.user_roles where user_id=p_user_id;
  insert into public.user_roles(user_id,role) select p_user_id,r from (select distinct unnest(p_roles) r) x;
  select case when 'admin'=any(p_roles) then 'admin' when 'teacher'=any(p_roles) then 'teacher' when 'board'=any(p_roles) then 'board' else p_roles[1] end into v_primary;
  update public.user_profiles set role=v_primary,updated_at=now() where user_id=p_user_id;
end; $$;

create or replace function public.admin_staff_directory()
returns table(user_id uuid,display_name text,role text,active boolean)
language sql stable security definer set search_path='public' as $$
  with visible as (
    select target.user_id,target.role,target.school_id
    from public.school_memberships target
    where target.active=true and target.role in ('teacher','admin','board','parent')
      and exists(select 1 from public.school_memberships me where me.user_id=auth.uid() and me.school_id=target.school_id and me.active=true and me.role='admin')
  )
  select up.user_id,up.display_name,case when bool_or(v.role='admin') then 'admin' when bool_or(v.role='teacher') then 'teacher' when bool_or(v.role='board') then 'board' else 'parent' end,up.active
  from public.user_profiles up join visible v on v.user_id=up.user_id
  group by up.user_id,up.display_name,up.active order by up.active desc,up.display_name;
$$;

create or replace function public.admin_staff_roles()
returns table(user_id uuid,roles text[])
language sql stable security definer set search_path='public' as $$
  select target.user_id,array_agg(distinct target.role order by target.role)
  from public.school_memberships target
  where target.active=true and exists(select 1 from public.school_memberships me where me.user_id=auth.uid() and me.school_id=target.school_id and me.active=true and me.role='admin')
  group by target.user_id;
$$;

revoke execute on function public.has_school_role(bigint,text) from public,anon;
revoke execute on function public.is_school_member(bigint) from public,anon;
revoke execute on function public.is_school_staff(bigint) from public,anon;
revoke execute on function public.staff_can_access_student(bigint) from public,anon;
revoke execute on function public.parent_can_access_student(bigint) from public,anon;
revoke execute on function public.can_edit_meeting(bigint) from public,anon;
