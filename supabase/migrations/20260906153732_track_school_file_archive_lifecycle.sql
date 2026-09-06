alter table public.school_files add column archived_at timestamptz;

create or replace function private.sync_school_file_archived_at()
returns trigger
language plpgsql
set search_path=''
as $function$
begin
  if new.archived is true and coalesce(old.archived,false) is false then
    new.archived_at := now();
  elsif new.archived is false then
    new.archived_at := null;
  end if;
  return new;
end;
$function$;

revoke all on function private.sync_school_file_archived_at() from public, anon, authenticated;

drop trigger if exists school_files_sync_archived_at on public.school_files;
create trigger school_files_sync_archived_at
before update of archived on public.school_files
for each row execute function private.sync_school_file_archived_at();
