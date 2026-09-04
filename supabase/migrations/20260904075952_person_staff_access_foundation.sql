-- Klasseværelset: person-, personale- og adgangsfundament.
-- Adgangsroller er skoleafgrænsede i school_memberships.
-- Personalegruppe/forkortelse er administrative profiloplysninger og må ikke bruges som autorisationskilde.

alter table public.school_memberships drop constraint if exists school_memberships_role_check;
alter table public.school_memberships add constraint school_memberships_role_check
  check (role in ('admin','leader','teacher','parent','board','student'));

alter table public.user_profiles drop constraint if exists user_profiles_role_valid;
alter table public.user_profiles add constraint user_profiles_role_valid
  check (role in ('teacher','admin','leader','board','parent','student'));

alter table public.user_roles drop constraint if exists user_roles_role_check;
alter table public.user_roles add constraint user_roles_role_check
  check (role in ('teacher','admin','leader','board','parent','student'));

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
      and sm.role in ('teacher','admin','leader')
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
      when new.raw_app_meta_data ->> 'role' in ('teacher','admin','leader','board','parent','student')
      then new.raw_app_meta_data ->> 'role'
      else 'teacher'
    end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create table if not exists public.staff_directory_profiles (
  school_id bigint not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  abbreviation text,
  personnel_group text not null default 'teacher',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (school_id,user_id),
  constraint staff_directory_profiles_group_check
    check (personnel_group in ('teacher','pedagogue','substitute','administration','other')),
  constraint staff_directory_profiles_abbreviation_check
    check (
      abbreviation is null
      or (
        abbreviation = upper(trim(abbreviation))
        and char_length(abbreviation) between 2 and 4
        and abbreviation !~ '[[:space:]]'
      )
    )
);

create unique index if not exists staff_directory_profiles_school_abbreviation_uidx
  on public.staff_directory_profiles (school_id,lower(abbreviation))
  where abbreviation is not null;
create index if not exists staff_directory_profiles_user_idx
  on public.staff_directory_profiles (user_id);
create index if not exists staff_directory_profiles_school_group_idx
  on public.staff_directory_profiles (school_id,personnel_group);

alter table public.staff_directory_profiles enable row level security;

revoke all on table public.staff_directory_profiles from public,anon;
grant select,insert,update,delete on table public.staff_directory_profiles to authenticated;

create policy staff_directory_profiles_read
on public.staff_directory_profiles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_school_staff(school_id)
);

create policy staff_directory_profiles_admin_insert
on public.staff_directory_profiles
for insert
to authenticated
with check (public.has_school_role(school_id,'admin'));

create policy staff_directory_profiles_admin_update
on public.staff_directory_profiles
for update
to authenticated
using (public.has_school_role(school_id,'admin'))
with check (public.has_school_role(school_id,'admin'));

create policy staff_directory_profiles_admin_delete
on public.staff_directory_profiles
for delete
to authenticated
using (public.has_school_role(school_id,'admin'));

insert into public.staff_directory_profiles(school_id,user_id,abbreviation,personnel_group)
select
  sm.school_id,
  sm.user_id,
  case
    when nullif(trim(up.initials),'') is not null
      and char_length(trim(up.initials)) between 2 and 4
      and upper(trim(up.initials)) !~ '[[:space:]]'
    then upper(trim(up.initials))
    else null
  end,
  case
    when bool_or(sm.role='teacher') then 'teacher'
    else 'administration'
  end
from public.school_memberships sm
left join public.user_profiles up on up.user_id=sm.user_id
where sm.role in ('teacher','admin','leader')
group by sm.school_id,sm.user_id,up.initials
on conflict (school_id,user_id) do nothing;

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
    having bool_or(sm.role in ('teacher','admin','leader'))
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

revoke all on function public.admin_staff_directory_v2() from public,anon;
grant execute on function public.admin_staff_directory_v2() to authenticated,service_role;

revoke execute on function public.create_user_profile() from public,anon,authenticated;
