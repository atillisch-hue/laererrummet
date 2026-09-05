create or replace function public.get_internal_staff_directory()
returns table(user_id uuid, display_name text, role text)
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    up.user_id,
    up.display_name,
    case
      when bool_or(target.role='admin') then 'admin'
      when bool_or(target.role='leader') then 'leader'
      when bool_or(target.role='teacher') then 'teacher'
      when bool_or(target.role='staff') then 'staff'
      else 'board'
    end as role
  from public.user_profiles up
  join public.school_memberships target
    on target.user_id=up.user_id
   and target.active=true
   and target.role in ('teacher','staff','admin','leader','board')
  where up.active=true
    and public.is_school_staff(target.school_id)
  group by up.user_id,up.display_name
  order by up.display_name;
$function$;

revoke all on function public.get_internal_staff_directory() from public, anon;
grant execute on function public.get_internal_staff_directory() to authenticated, service_role;

create or replace function public.create_personal_task(
  p_title text,
  p_description text default null::text,
  p_due_date date default null::date
)
returns bigint
language plpgsql
security definer
set search_path to 'public', 'private'
as $function$
declare
  v_school_id bigint;
  v_id bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(coalesce(p_title,'')))=0 then raise exception 'Title required'; end if;

  select sm.school_id into v_school_id
  from public.school_memberships sm
  where sm.user_id=auth.uid()
    and sm.active=true
    and sm.role in ('teacher','staff','admin','leader')
  order by sm.school_id
  limit 1;

  if v_school_id is null then raise exception 'Active staff membership required'; end if;

  insert into public.personal_tasks(school_id,user_id,title,description,due_date)
  values(v_school_id,auth.uid(),trim(p_title),nullif(trim(coalesce(p_description,'')),''),p_due_date)
  returning id into v_id;
  return v_id;
end;
$function$;

revoke all on function public.create_personal_task(text,text,date) from public, anon;
grant execute on function public.create_personal_task(text,text,date) to authenticated, service_role;
