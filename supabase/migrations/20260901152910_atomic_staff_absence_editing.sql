create or replace function public.admin_update_staff_absence(
  p_absence_id bigint,
  p_absence_date date,
  p_status text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_school_id bigint;
  v_user_id uuid;
  v_old_date date;
begin
  select school_id,user_id,absence_date
    into v_school_id,v_user_id,v_old_date
  from public.staff_absence
  where id=p_absence_id;

  if v_school_id is null then
    raise exception 'Staff absence not found';
  end if;

  if not public.has_school_role(v_school_id,'admin') then
    raise exception 'Admin access required';
  end if;

  if p_absence_date is null or p_status is null or trim(p_status)='' then
    raise exception 'Date and status are required';
  end if;

  if p_absence_date is distinct from v_old_date then
    delete from public.substitute_assignments
    where school_id=v_school_id
      and absent_teacher_id=v_user_id
      and assignment_date=v_old_date;
  end if;

  update public.staff_absence
  set absence_date=p_absence_date,
      status=trim(p_status),
      note=nullif(trim(coalesce(p_note,'')),'')
  where id=p_absence_id;
end;
$$;

create or replace function public.admin_delete_staff_absence(p_absence_id bigint)
returns void
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_school_id bigint;
  v_user_id uuid;
  v_absence_date date;
begin
  select school_id,user_id,absence_date
    into v_school_id,v_user_id,v_absence_date
  from public.staff_absence
  where id=p_absence_id;

  if v_school_id is null then
    raise exception 'Staff absence not found';
  end if;

  if not public.has_school_role(v_school_id,'admin') then
    raise exception 'Admin access required';
  end if;

  delete from public.substitute_assignments
  where school_id=v_school_id
    and absent_teacher_id=v_user_id
    and assignment_date=v_absence_date;

  delete from public.staff_absence where id=p_absence_id;
end;
$$;

revoke all on function public.admin_update_staff_absence(bigint,date,text,text) from public,anon;
revoke all on function public.admin_delete_staff_absence(bigint) from public,anon;
grant execute on function public.admin_update_staff_absence(bigint,date,text,text) to authenticated,service_role;
grant execute on function public.admin_delete_staff_absence(bigint) to authenticated,service_role;
