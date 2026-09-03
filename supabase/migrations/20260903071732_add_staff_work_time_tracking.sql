create table if not exists public.staff_work_profiles (
  id bigserial primary key,
  school_id bigint not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  school_year text not null check (length(trim(school_year)) between 4 and 20),
  period_start date not null,
  period_end date not null,
  annual_target_minutes integer not null check (annual_target_minutes between 1 and 200000),
  weekly_target_minutes integer check (weekly_target_minutes is null or weekly_target_minutes between 1 and 10080),
  employment_percent numeric(5,2) check (employment_percent is null or (employment_percent > 0 and employment_percent <= 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(school_id,user_id,school_year),
  check(period_end >= period_start)
);
create index if not exists idx_staff_work_profiles_user_period on public.staff_work_profiles(user_id,period_start,period_end);
alter table public.staff_work_profiles enable row level security;
drop policy if exists staff_work_profiles_read on public.staff_work_profiles;
create policy staff_work_profiles_read on public.staff_work_profiles for select to authenticated using ((user_id=auth.uid() and public.is_school_member(school_id)) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'));
drop policy if exists staff_work_profiles_admin_insert on public.staff_work_profiles;
create policy staff_work_profiles_admin_insert on public.staff_work_profiles for insert to authenticated with check (public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'));
drop policy if exists staff_work_profiles_admin_update on public.staff_work_profiles;
create policy staff_work_profiles_admin_update on public.staff_work_profiles for update to authenticated using (public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader')) with check (public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'));
drop policy if exists staff_work_profiles_admin_delete on public.staff_work_profiles;
create policy staff_work_profiles_admin_delete on public.staff_work_profiles for delete to authenticated using (public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'));

create table if not exists public.work_time_entries (
  id bigserial primary key,
  school_id bigint not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  work_date date not null,
  starts_at time not null,
  ends_at time not null,
  category text not null default 'other' check (category in ('teaching','preparation','meeting','supervision','administration','other')),
  note text check (note is null or length(note) <= 1000),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(ends_at > starts_at)
);
create index if not exists idx_work_time_entries_user_date on public.work_time_entries(user_id,work_date,starts_at);
create index if not exists idx_work_time_entries_school_date on public.work_time_entries(school_id,work_date);
alter table public.work_time_entries enable row level security;
drop policy if exists work_time_entries_read on public.work_time_entries;
create policy work_time_entries_read on public.work_time_entries for select to authenticated using ((user_id=auth.uid() and public.is_school_member(school_id)) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'));
drop policy if exists work_time_entries_insert on public.work_time_entries;
create policy work_time_entries_insert on public.work_time_entries for insert to authenticated with check (public.is_school_member(school_id) and ((user_id=auth.uid() and created_by=auth.uid()) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader')));
drop policy if exists work_time_entries_update on public.work_time_entries;
create policy work_time_entries_update on public.work_time_entries for update to authenticated using ((user_id=auth.uid() and public.is_school_member(school_id)) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader')) with check (public.is_school_member(school_id) and (user_id=auth.uid() or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader')));
drop policy if exists work_time_entries_delete on public.work_time_entries;
create policy work_time_entries_delete on public.work_time_entries for delete to authenticated using ((user_id=auth.uid() and public.is_school_member(school_id)) or public.has_school_role(school_id,'admin') or public.has_school_role(school_id,'leader'));

create or replace function public.create_work_time_entry(p_user_id uuid,p_work_date date,p_starts_at time,p_ends_at time,p_category text default 'other',p_note text default null)
returns bigint language plpgsql security definer set search_path=public,private as $$
declare v_school_id bigint;v_id bigint;v_target uuid:=coalesce(p_user_id,auth.uid());
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_work_date is null or p_starts_at is null or p_ends_at is null or p_ends_at<=p_starts_at then raise exception 'Invalid work interval'; end if;
  if p_category not in ('teaching','preparation','meeting','supervision','administration','other') then raise exception 'Invalid category'; end if;
  select sm.school_id into v_school_id from public.school_memberships sm join public.school_memberships target on target.school_id=sm.school_id and target.user_id=v_target and target.active=true and target.role in ('teacher','admin','leader') where sm.user_id=auth.uid() and sm.active=true and sm.role in ('teacher','admin','leader') and (v_target=auth.uid() or sm.role in ('admin','leader')) order by sm.school_id limit 1;
  if v_school_id is null then raise exception 'No access to staff member'; end if;
  insert into public.work_time_entries(school_id,user_id,work_date,starts_at,ends_at,category,note,created_by) values(v_school_id,v_target,p_work_date,p_starts_at,p_ends_at,p_category,nullif(trim(coalesce(p_note,'')),''),auth.uid()) returning id into v_id;
  return v_id;
end;$$;
revoke all on function public.create_work_time_entry(uuid,date,time,time,text,text) from public,anon;
grant execute on function public.create_work_time_entry(uuid,date,time,time,text,text) to authenticated,service_role;

create or replace function public.delete_work_time_entry(p_entry_id bigint)
returns void language plpgsql security definer set search_path=public,private as $$
declare v_rows integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.work_time_entries w where w.id=p_entry_id and (w.user_id=auth.uid() or public.has_school_role(w.school_id,'admin') or public.has_school_role(w.school_id,'leader'));
  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception 'Work entry not found'; end if;
end;$$;
revoke all on function public.delete_work_time_entry(bigint) from public,anon;
grant execute on function public.delete_work_time_entry(bigint) to authenticated,service_role;
