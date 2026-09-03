create or replace function private.protect_substitute_assignment_update_columns()
returns trigger
language plpgsql
security definer
set search_path to 'public','private'
as $$
declare
  v_uid uuid:=auth.uid();
  v_is_admin boolean:=false;
begin
  if v_uid is null then
    return new;
  end if;

  select exists(
    select 1 from public.school_memberships sm
    where sm.school_id=old.school_id
      and sm.user_id=v_uid
      and sm.active=true
      and sm.role='admin'
  ) into v_is_admin;

  if v_is_admin then
    return new;
  end if;

  if v_uid=old.absent_teacher_id then
    if (to_jsonb(new)-'substitute_plan') is distinct from (to_jsonb(old)-'substitute_plan') then
      raise exception 'Absent teacher may only update the substitute plan';
    end if;
    return new;
  end if;

  if v_uid=old.substitute_teacher_id then
    if (to_jsonb(new)-'handover_done'-'handover_not_done'-'handover_note'-'handover_updated_at')
       is distinct from
       (to_jsonb(old)-'handover_done'-'handover_not_done'-'handover_note'-'handover_updated_at') then
      raise exception 'Substitute may only update handover fields';
    end if;
    return new;
  end if;

  raise exception 'You may not update this substitute assignment';
end;
$$;

revoke all on function private.protect_substitute_assignment_update_columns() from public,anon,authenticated;

drop trigger if exists protect_substitute_assignment_update_columns_before_update on public.substitute_assignments;
create trigger protect_substitute_assignment_update_columns_before_update
before update on public.substitute_assignments
for each row execute function private.protect_substitute_assignment_update_columns();
