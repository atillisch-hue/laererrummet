create or replace function private.require_aal2()
returns void
language plpgsql
stable
security invoker
set search_path=''
as $function$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  if coalesce(auth.jwt()->>'aal','aal1') <> 'aal2' then
    raise exception 'MFA required' using errcode='42501';
  end if;
end;
$function$;
revoke all on function private.require_aal2() from public,anon,authenticated;

create or replace function public.admin_parent_links()
returns table(parent_id uuid, student_id bigint)
language plpgsql
stable security definer
set search_path=''
as $function$
begin
  perform private.require_aal2();
  return query
  select ps.parent_id,ps.student_id
  from public.parent_students ps
  join public.students s on s.id=ps.student_id
  join public.classes c on c.id=s.class_id
  where public.has_school_role(c.school_id,'admin');
end;
$function$;

create or replace function public.admin_security_audit_events(p_limit integer default 100)
returns table(id bigint, school_id bigint, actor_user_id uuid, actor_name text, action text, entity_type text, entity_id text, metadata jsonb, created_at timestamptz)
language plpgsql
stable security definer
set search_path=''
as $function$
begin
  perform private.require_aal2();
  return query
  select a.id,a.school_id,a.actor_user_id,coalesce(up.display_name,up.initials,'Ukendt/system'),a.action,a.entity_type,a.entity_id,a.metadata,a.created_at
  from private.security_audit_log a
  left join public.user_profiles up on up.user_id=a.actor_user_id
  where exists(
    select 1 from public.school_memberships sm
    where sm.school_id=a.school_id and sm.user_id=auth.uid() and sm.role='admin' and sm.active=true
  )
  order by a.created_at desc,a.id desc
  limit least(greatest(coalesce(p_limit,100),1),500);
end;
$function$;

create or replace function public.admin_staff_directory()
returns table(user_id uuid, display_name text, role text, active boolean)
language plpgsql
stable security definer
set search_path=''
as $function$
begin
  perform private.require_aal2();
  return query
  with visible as (
    select target.user_id,target.role,target.school_id,target.active as membership_active
    from public.school_memberships target
    where target.role in ('teacher','admin','board','parent')
      and exists(select 1 from public.school_memberships me where me.user_id=auth.uid() and me.school_id=target.school_id and me.active=true and me.role='admin')
  )
  select up.user_id,up.display_name,
    case when bool_or(v.role='admin') then 'admin' when bool_or(v.role='teacher') then 'teacher' when bool_or(v.role='board') then 'board' else 'parent' end,
    (up.active and bool_or(v.membership_active)) as active
  from public.user_profiles up join visible v on v.user_id=up.user_id
  group by up.user_id,up.display_name,up.active
  order by (up.active and bool_or(v.membership_active)) desc,up.display_name;
end;
$function$;

create or replace function public.admin_staff_directory_v2()
returns table(user_id uuid, display_name text, abbreviation text, personnel_group text, roles text[], active boolean)
language plpgsql
stable security definer
set search_path=''
as $function$
begin
  perform private.require_aal2();
  return query
  with admin_schools as (
    select distinct sm.school_id
    from public.school_memberships sm
    where sm.user_id=auth.uid() and sm.role='admin' and sm.active=true
  ), staff_users as (
    select sm.school_id,sm.user_id,bool_or(sm.active) as any_active,array_agg(distinct sm.role order by sm.role) as roles
    from public.school_memberships sm join admin_schools a on a.school_id=sm.school_id
    group by sm.school_id,sm.user_id
    having bool_or(sm.role in ('teacher','staff','admin','leader'))
  )
  select su.user_id,up.display_name,sdp.abbreviation,coalesce(sdp.personnel_group,'teacher') as personnel_group,su.roles,
         (coalesce(up.active,true) and su.any_active) as active
  from staff_users su
  join public.user_profiles up on up.user_id=su.user_id
  left join public.staff_directory_profiles sdp on sdp.school_id=su.school_id and sdp.user_id=su.user_id
  order by (coalesce(up.active,true) and su.any_active) desc,sdp.abbreviation nulls last,up.display_name;
end;
$function$;

create or replace function public.admin_staff_directory_for_school_v2(p_school_id bigint)
returns table(user_id uuid, display_name text, abbreviation text, personnel_group text, roles text[], active boolean)
language plpgsql
stable security definer
set search_path=''
as $function$
begin
  perform private.require_aal2();
  return query
  with staff_users as (
    select sm.user_id,bool_or(sm.active) as any_active,array_agg(distinct sm.role order by sm.role) as roles
    from public.school_memberships sm
    where sm.school_id=p_school_id
      and exists (
        select 1 from public.school_memberships me
        where me.school_id=p_school_id and me.user_id=auth.uid() and me.role='admin' and me.active=true
      )
    group by sm.user_id
    having bool_or(sm.role in ('teacher','staff','admin','leader'))
  )
  select su.user_id,up.display_name,sdp.abbreviation,coalesce(sdp.personnel_group,'teacher') as personnel_group,su.roles,
         (coalesce(up.active,true) and su.any_active) as active
  from staff_users su
  join public.user_profiles up on up.user_id=su.user_id
  left join public.staff_directory_profiles sdp on sdp.school_id=p_school_id and sdp.user_id=su.user_id
  order by (coalesce(up.active,true) and su.any_active) desc,sdp.abbreviation nulls last,up.display_name;
end;
$function$;

create or replace function public.admin_staff_roles()
returns table(user_id uuid, roles text[])
language plpgsql
stable security definer
set search_path=''
as $function$
begin
  perform private.require_aal2();
  return query
  select target.user_id,array_agg(distinct target.role order by target.role)
  from public.school_memberships target
  where exists(select 1 from public.school_memberships me where me.user_id=auth.uid() and me.school_id=target.school_id and me.active=true and me.role='admin')
  group by target.user_id;
end;
$function$;

create or replace function public.admin_student_access_status(p_school_id bigint)
returns table(student_id bigint, needs_rotation boolean, code_length smallint, updated_at timestamptz)
language plpgsql
stable security definer
set search_path=''
as $function$
begin
  perform private.require_aal2();
  return query
  select s.id,coalesce(cred.needs_rotation,true),cred.code_length,cred.updated_at
  from public.students s
  join public.classes c on c.id=s.class_id
  left join private.student_access_credentials cred on cred.student_id=s.id
  where c.school_id=p_school_id
    and exists (
      select 1 from public.school_memberships me
      where me.user_id=auth.uid() and me.school_id=p_school_id and me.role='admin' and me.active=true
    )
  order by s.id;
end;
$function$;

create or replace function public.admin_user_directory()
returns table(id uuid, email text, roles jsonb)
language plpgsql
stable security definer
set search_path=''
as $function$
begin
  perform private.require_aal2();
  if not public.current_user_has_role('admin') then raise exception 'Admin access required'; end if;
  return query
  select u.id,u.email::text,coalesce(jsonb_agg(distinct target_sm.role) filter (where target_sm.active),'[]'::jsonb) as roles
  from auth.users u
  join public.school_memberships target_sm on target_sm.user_id=u.id and target_sm.active=true
  where exists (
    select 1 from public.school_memberships me
    where me.user_id=auth.uid() and me.school_id=target_sm.school_id and me.role='admin' and me.active=true
  )
  group by u.id,u.email order by u.email;
end;
$function$;

create or replace function public.admin_user_directory_for_school(p_school_id bigint)
returns table(id uuid, email text, roles jsonb, active boolean)
language plpgsql
stable security definer
set search_path=''
as $function$
begin
  perform private.require_aal2();
  if not public.has_school_role(p_school_id,'admin') then raise exception 'Admin access required'; end if;
  return query
  select u.id,u.email::text,coalesce(jsonb_agg(distinct sm.role),'[]'::jsonb) as roles,bool_or(sm.active) as active
  from auth.users u
  join public.school_memberships sm on sm.user_id=u.id
  where sm.school_id=p_school_id
  group by u.id,u.email order by u.email;
end;
$function$;

create or replace function public.admin_update_staff_absence(p_absence_id bigint,p_absence_date date,p_status text,p_note text)
returns void
language plpgsql
security definer
set search_path=''
as $function$
declare v_school_id bigint; v_user_id uuid; v_old_date date;
begin
  perform private.require_aal2();
  select school_id,user_id,absence_date into v_school_id,v_user_id,v_old_date from public.staff_absence where id=p_absence_id;
  if v_school_id is null then raise exception 'Staff absence not found'; end if;
  if not public.has_school_role(v_school_id,'admin') then raise exception 'Admin access required'; end if;
  if p_absence_date is null or p_status is null or trim(p_status)='' then raise exception 'Date and status are required'; end if;
  if p_absence_date is distinct from v_old_date then
    delete from public.substitute_assignments where school_id=v_school_id and absent_teacher_id=v_user_id and assignment_date=v_old_date;
  end if;
  update public.staff_absence set absence_date=p_absence_date,status=trim(p_status),note=nullif(trim(coalesce(p_note,'')),'') where id=p_absence_id;
end;
$function$;

create or replace function public.admin_delete_staff_absence(p_absence_id bigint)
returns void
language plpgsql
security definer
set search_path=''
as $function$
declare v_school_id bigint; v_user_id uuid; v_absence_date date;
begin
  perform private.require_aal2();
  select school_id,user_id,absence_date into v_school_id,v_user_id,v_absence_date from public.staff_absence where id=p_absence_id;
  if v_school_id is null then raise exception 'Staff absence not found'; end if;
  if not public.has_school_role(v_school_id,'admin') then raise exception 'Admin access required'; end if;
  delete from public.substitute_assignments where school_id=v_school_id and absent_teacher_id=v_user_id and assignment_date=v_absence_date;
  delete from public.staff_absence where id=p_absence_id;
end;
$function$;

revoke all on function public.admin_parent_links() from public,anon;
revoke all on function public.admin_security_audit_events(integer) from public,anon;
revoke all on function public.admin_staff_directory() from public,anon;
revoke all on function public.admin_staff_directory_v2() from public,anon;
revoke all on function public.admin_staff_directory_for_school_v2(bigint) from public,anon;
revoke all on function public.admin_staff_roles() from public,anon;
revoke all on function public.admin_student_access_status(bigint) from public,anon;
revoke all on function public.admin_user_directory() from public,anon;
revoke all on function public.admin_user_directory_for_school(bigint) from public,anon;
revoke all on function public.admin_update_staff_absence(bigint,date,text,text) from public,anon;
revoke all on function public.admin_delete_staff_absence(bigint) from public,anon;

grant execute on function public.admin_parent_links() to authenticated;
grant execute on function public.admin_security_audit_events(integer) to authenticated;
grant execute on function public.admin_staff_directory() to authenticated;
grant execute on function public.admin_staff_directory_v2() to authenticated;
grant execute on function public.admin_staff_directory_for_school_v2(bigint) to authenticated;
grant execute on function public.admin_staff_roles() to authenticated;
grant execute on function public.admin_student_access_status(bigint) to authenticated;
grant execute on function public.admin_user_directory() to authenticated;
grant execute on function public.admin_user_directory_for_school(bigint) to authenticated;
grant execute on function public.admin_update_staff_absence(bigint,date,text,text) to authenticated;
grant execute on function public.admin_delete_staff_absence(bigint) to authenticated;

drop policy if exists school_admins_manage_substitute_assignments on public.substitute_assignments;
create policy school_admins_manage_substitute_assignments
on public.substitute_assignments
for all
to authenticated
using (
  coalesce(auth.jwt()->>'aal','')='aal2'
  and exists (
    select 1 from public.school_memberships sm
    where sm.school_id=substitute_assignments.school_id
      and sm.user_id=(select auth.uid())
      and sm.active=true
      and sm.role=any(array['admin'::text,'leader'::text])
  )
)
with check (
  coalesce(auth.jwt()->>'aal','')='aal2'
  and exists (
    select 1 from public.school_memberships sm
    where sm.school_id=substitute_assignments.school_id
      and sm.user_id=(select auth.uid())
      and sm.active=true
      and sm.role=any(array['admin'::text,'leader'::text])
  )
);
