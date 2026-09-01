create table public.school_settings (
  school_id bigint primary key references public.schools(id) on delete cascade,
  school_year_start date null,
  school_year_end date null,
  closed_days jsonb not null default '[]'::jsonb,
  updated_by uuid null references auth.users(id),
  updated_at timestamptz not null default now(),
  constraint school_settings_closed_days_array check (jsonb_typeof(closed_days) = 'array'),
  constraint school_settings_year_order check (school_year_end is null or school_year_start is null or school_year_end >= school_year_start)
);

create or replace function private.touch_school_settings()
returns trigger
language plpgsql
security definer
set search_path = 'public','private'
as $$
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required';
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.touch_school_settings() from public, anon, authenticated;

create trigger school_settings_touch
before insert or update on public.school_settings
for each row execute function private.touch_school_settings();

alter table public.school_settings enable row level security;
revoke all on table public.school_settings from anon, authenticated;
grant select, insert, update, delete on table public.school_settings to authenticated;

create policy "school members read school settings"
on public.school_settings
for select
to authenticated
using (public.is_school_member(school_id));

create policy "school admins insert school settings"
on public.school_settings
for insert
to authenticated
with check (public.has_school_role(school_id,'admin'));

create policy "school admins update school settings"
on public.school_settings
for update
to authenticated
using (public.has_school_role(school_id,'admin'))
with check (public.has_school_role(school_id,'admin'));

create policy "school admins delete school settings"
on public.school_settings
for delete
to authenticated
using (public.has_school_role(school_id,'admin'));
