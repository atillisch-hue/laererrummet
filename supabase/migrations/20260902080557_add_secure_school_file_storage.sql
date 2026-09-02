insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'school-files','school-files',false,20971520,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword','application/vnd.ms-excel','application/vnd.ms-powerpoint',
    'text/plain','text/csv','image/jpeg','image/png','image/webp'
  ]::text[]
)
on conflict(id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

create table if not exists public.school_files(
  id uuid primary key default gen_random_uuid(),
  school_id bigint not null references public.schools(id) on delete restrict,
  area text not null check(area in ('board','staff','class','subject','meeting','parent')),
  object_path text not null unique,
  display_name text not null check(length(trim(display_name))>0),
  mime_type text,
  size_bytes bigint check(size_bytes is null or size_bytes>=0),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  archived boolean not null default false
);

create index if not exists idx_school_files_school_area_created on public.school_files(school_id,area,created_at desc);
create index if not exists idx_school_files_created_by on public.school_files(created_by);

create or replace function private.validate_school_file_path()
returns trigger
language plpgsql
security definer
set search_path to 'public','private'
as $$
begin
  if split_part(new.object_path,'/',1) <> ('school-'||new.school_id::text) then
    raise exception 'File path school does not match school_id';
  end if;
  if split_part(new.object_path,'/',2) <> new.area then
    raise exception 'File path area does not match file area';
  end if;
  return new;
end;
$$;

revoke all on function private.validate_school_file_path() from public,anon,authenticated;

drop trigger if exists school_files_validate_path on public.school_files;
create trigger school_files_validate_path
before insert or update of school_id,area,object_path on public.school_files
for each row execute function private.validate_school_file_path();

alter table public.school_files enable row level security;

drop policy if exists board_reads_board_files on public.school_files;
create policy board_reads_board_files on public.school_files
for select to authenticated
using(area='board' and public.has_school_role(school_id,'board'));

drop policy if exists board_inserts_board_files on public.school_files;
create policy board_inserts_board_files on public.school_files
for insert to authenticated
with check(area='board' and created_by=auth.uid() and public.has_school_role(school_id,'board'));

drop policy if exists board_updates_board_files on public.school_files;
create policy board_updates_board_files on public.school_files
for update to authenticated
using(area='board' and public.has_school_role(school_id,'board'))
with check(area='board' and public.has_school_role(school_id,'board'));

drop policy if exists board_deletes_board_files on public.school_files;
create policy board_deletes_board_files on public.school_files
for delete to authenticated
using(area='board' and public.has_school_role(school_id,'board'));

drop policy if exists board_reads_board_storage on storage.objects;
create policy board_reads_board_storage on storage.objects
for select to authenticated
using(
  bucket_id='school-files'
  and split_part(name,'/',2)='board'
  and public.has_school_role((substring(split_part(name,'/',1) from '^school-([0-9]+)$'))::bigint,'board')
);

drop policy if exists board_inserts_board_storage on storage.objects;
create policy board_inserts_board_storage on storage.objects
for insert to authenticated
with check(
  bucket_id='school-files'
  and split_part(name,'/',2)='board'
  and public.has_school_role((substring(split_part(name,'/',1) from '^school-([0-9]+)$'))::bigint,'board')
);

drop policy if exists board_updates_board_storage on storage.objects;
create policy board_updates_board_storage on storage.objects
for update to authenticated
using(
  bucket_id='school-files'
  and split_part(name,'/',2)='board'
  and public.has_school_role((substring(split_part(name,'/',1) from '^school-([0-9]+)$'))::bigint,'board')
)
with check(
  bucket_id='school-files'
  and split_part(name,'/',2)='board'
  and public.has_school_role((substring(split_part(name,'/',1) from '^school-([0-9]+)$'))::bigint,'board')
);

drop policy if exists board_deletes_board_storage on storage.objects;
create policy board_deletes_board_storage on storage.objects
for delete to authenticated
using(
  bucket_id='school-files'
  and split_part(name,'/',2)='board'
  and public.has_school_role((substring(split_part(name,'/',1) from '^school-([0-9]+)$'))::bigint,'board')
);
