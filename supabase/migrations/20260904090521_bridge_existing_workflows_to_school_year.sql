create or replace function private.sync_school_settings_to_active_year()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_year_id bigint;
  v_item jsonb;
  v_date date;
  v_kind text;
begin
  select id into v_year_id
  from public.school_years
  where school_id=new.school_id and status='active'
  limit 1;

  if v_year_id is null then
    return new;
  end if;

  if new.school_year_start is not null and new.school_year_end is not null then
    update public.school_years
    set teaching_start=new.school_year_start,
        teaching_end=new.school_year_end,
        updated_by=(select auth.uid()),
        updated_at=now()
    where id=v_year_id
      and new.school_year_start>=period_start
      and new.school_year_end<=period_end
      and new.school_year_end>=new.school_year_start;
    if not found then
      raise exception 'Teaching period must be valid and inside the active school year';
    end if;
  end if;

  delete from public.school_year_calendar_events
  where school_year_id=v_year_id and source='school_calendar';

  for v_item in select value from jsonb_array_elements(coalesce(new.closed_days,'[]'::jsonb)) loop
    v_date=(v_item->>'date')::date;
    insert into public.school_year_calendar_events(
      school_year_id,starts_on,ends_on,title,event_kind,closes_school,visibility,source,created_by,updated_by
    ) values (
      v_year_id,v_date,v_date,coalesce(nullif(trim(v_item->>'label'),''),'Lukkedag'),
      'closure',true,'all','school_calendar',(select auth.uid()),(select auth.uid())
    );
  end loop;

  for v_item in select value from jsonb_array_elements(coalesce(new.calendar_events,'[]'::jsonb)) loop
    v_date=(v_item->>'date')::date;
    v_kind=case when v_item->>'kind' in ('pedagogical','special_week','project','trip','event','other') then v_item->>'kind' else 'other' end;
    insert into public.school_year_calendar_events(
      school_year_id,starts_on,ends_on,title,event_kind,closes_school,visibility,source,created_by,updated_by
    ) values (
      v_year_id,v_date,v_date,coalesce(nullif(trim(v_item->>'label'),''),'Begivenhed'),
      v_kind,false,'staff','school_calendar',(select auth.uid()),(select auth.uid())
    );
  end loop;

  return new;
end;
$$;
revoke all on function private.sync_school_settings_to_active_year() from public,anon,authenticated;

drop trigger if exists sync_school_settings_to_active_year on public.school_settings;
create trigger sync_school_settings_to_active_year
after insert or update of school_year_start,school_year_end,closed_days,calendar_events
on public.school_settings
for each row execute function private.sync_school_settings_to_active_year();

create or replace function private.assign_schedule_version_from_active_year()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
declare
  v_school_id bigint;
begin
  if new.schedule_version_id is not null then return new; end if;

  select c.school_id into v_school_id
  from public.classes c
  where c.id=new.class_id;

  select sv.id into new.schedule_version_id
  from public.school_schedule_versions sv
  join public.school_years sy on sy.id=sv.school_year_id
  where sy.school_id=v_school_id and sy.status='active'
  order by case sv.status when 'draft' then 0 when 'published' then 1 else 2 end,
           sv.created_at desc
  limit 1;

  if new.schedule_version_id is null then
    raise exception 'No schedule version exists for the active school year';
  end if;
  return new;
end;
$$;
revoke all on function private.assign_schedule_version_from_active_year() from public,anon,authenticated;

drop trigger if exists assign_schedule_version_from_active_year on public.schedule_entries;
create trigger assign_schedule_version_from_active_year
before insert on public.schedule_entries
for each row execute function private.assign_schedule_version_from_active_year();

create or replace function private.link_staff_work_profile_to_school_year()
returns trigger
language plpgsql
security invoker
set search_path=''
as $$
begin
  if new.school_year_id is null or
     not exists(select 1 from public.school_years sy where sy.id=new.school_year_id and sy.school_id=new.school_id and sy.label=new.school_year) then
    select sy.id into new.school_year_id
    from public.school_years sy
    where sy.school_id=new.school_id and sy.label=new.school_year
    limit 1;
  end if;
  if new.school_year_id is null then
    raise exception 'School year does not exist for this work profile';
  end if;
  return new;
end;
$$;
revoke all on function private.link_staff_work_profile_to_school_year() from public,anon,authenticated;

drop trigger if exists link_staff_work_profile_to_school_year on public.staff_work_profiles;
create trigger link_staff_work_profile_to_school_year
before insert or update of school_id,school_year,school_year_id
on public.staff_work_profiles
for each row execute function private.link_staff_work_profile_to_school_year();