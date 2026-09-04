-- En generisk staff-rolle gør det muligt at være medarbejder uden automatisk læreradgang.

alter table public.school_memberships drop constraint if exists school_memberships_role_check;
alter table public.school_memberships add constraint school_memberships_role_check
  check (role in ('admin','leader','teacher','staff','parent','board','student'));

alter table public.user_profiles drop constraint if exists user_profiles_role_valid;
alter table public.user_profiles add constraint user_profiles_role_valid
  check (role in ('teacher','staff','admin','leader','board','parent','student'));

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('teacher','staff','admin','leader','board','parent','student'));

create or replace function public.is_school_staff(p_school_id bigint)
returns boolean
language sql
stable
security definer
set search_path='public'
as $$
  select exists (
    select 1
    from public.school_memberships sm
    where sm.user_id = auth.uid()
      and sm.school_id = p_school_id
      and sm.role in ('teacher','staff','admin','leader')
      and sm.active = true
  );
$$;

create or replace function public.create_user_profile()
returns trigger
language plpgsql
security definer
set search_path='public'
as $$
begin
  insert into public.user_profiles(user_id,display_name,role)
  values(
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      new.email,
      'Bruger'
    ),
    case
      when new.raw_app_meta_data ->> 'role' in ('teacher','staff','admin','leader','board','parent','student')
      then new.raw_app_meta_data ->> 'role'
      else 'teacher'
    end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.admin_staff_directory_v2()
returns table(
  user_id uuid,
  display_name text,
  abbreviation text,
  personnel_group text,
  roles text[],
  active boolean
)
language sql
stable
security definer
set search_path=''
as $$
  with admin_schools as (
    select distinct sm.school_id
    from public.school_memberships sm
    where sm.user_id=(select auth.uid())
      and sm.role='admin'
      and sm.active=true
  ), staff_users as (
    select
      sm.school_id,
      sm.user_id,
      bool_or(sm.active) as any_active,
      array_agg(distinct sm.role order by sm.role) as roles
    from public.school_memberships sm
    join admin_schools a on a.school_id=sm.school_id
    group by sm.school_id,sm.user_id
    having bool_or(sm.role in ('teacher','staff','admin','leader'))
  )
  select
    su.user_id,
    up.display_name,
    sdp.abbreviation,
    coalesce(sdp.personnel_group,'teacher') as personnel_group,
    su.roles,
    (coalesce(up.active,true) and su.any_active) as active
  from staff_users su
  join public.user_profiles up on up.user_id=su.user_id
  left join public.staff_directory_profiles sdp
    on sdp.school_id=su.school_id and sdp.user_id=su.user_id
  order by (coalesce(up.active,true) and su.any_active) desc,
           sdp.abbreviation nulls last,
           up.display_name;
$$;

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
      role=case when p_role in ('teacher','staff','admin','leader','board','parent','student') then p_role else role end,
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
  if exists(select 1 from unnest(p_roles) r where r not in ('teacher','staff','admin','leader','board','parent','student')) then raise exception 'Ugyldig rolle'; end if;
  if not exists(select 1 from public.school_memberships sm where sm.user_id=p_user_id and sm.school_id=v_school_id) then raise exception 'Brugeren tilhører ikke denne skole'; end if;

  select coalesce(bool_or(sm.active),true) into v_active
  from public.school_memberships sm
  where sm.user_id=p_user_id and sm.school_id=v_school_id;

  delete from public.school_memberships where user_id=p_user_id and school_id=v_school_id;
  insert into public.school_memberships(school_id,user_id,role,active)
  select v_school_id,p_user_id,r,v_active from (select distinct unnest(p_roles) r) x;

  delete from public.user_roles where user_id=p_user_id;
  insert into public.user_roles(user_id,role) select p_user_id,r from (select distinct unnest(p_roles) r) x;

  select case
    when 'admin'=any(p_roles) then 'admin'
    when 'leader'=any(p_roles) then 'leader'
    when 'teacher'=any(p_roles) then 'teacher'
    when 'staff'=any(p_roles) then 'staff'
    when 'board'=any(p_roles) then 'board'
    else p_roles[1]
  end into v_primary;
  update public.user_profiles set role=v_primary,updated_at=now() where user_id=p_user_id;
end;
$$;

revoke execute on function public.create_user_profile() from public,anon,authenticated;
revoke all on function public.update_staff_member(uuid,text,text,boolean) from public,anon;
revoke all on function public.update_staff_roles(uuid,text[]) from public,anon;
grant execute on function public.update_staff_member(uuid,text,text,boolean) to authenticated,service_role;
grant execute on function public.update_staff_roles(uuid,text[]) to authenticated,service_role;
