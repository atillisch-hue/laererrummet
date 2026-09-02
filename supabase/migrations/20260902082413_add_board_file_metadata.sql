alter table public.school_files
  add column if not exists category text not null default 'other',
  add column if not exists description text,
  add column if not exists board_meeting_id bigint references public.board_meetings(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists(
    select 1 from pg_constraint
    where conname='school_files_category_check'
      and conrelid='public.school_files'::regclass
  ) then
    alter table public.school_files
      add constraint school_files_category_check
      check(category in ('agenda','attachment','minutes','finance','policy','personnel','other'));
  end if;

  if not exists(
    select 1 from pg_constraint
    where conname='school_files_description_length_check'
      and conrelid='public.school_files'::regclass
  ) then
    alter table public.school_files
      add constraint school_files_description_length_check
      check(description is null or length(description)<=2000);
  end if;

  if not exists(
    select 1 from pg_constraint
    where conname='school_files_display_name_length_check'
      and conrelid='public.school_files'::regclass
  ) then
    alter table public.school_files
      add constraint school_files_display_name_length_check
      check(length(display_name)<=255);
  end if;
end $$;

create index if not exists idx_school_files_board_meeting
  on public.school_files(board_meeting_id)
  where board_meeting_id is not null;

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
  if new.board_meeting_id is not null then
    if new.area <> 'board' then
      raise exception 'Only board files can be linked to board meetings';
    end if;
    if not exists(
      select 1 from public.board_meetings bm
      where bm.id=new.board_meeting_id and bm.school_id=new.school_id
    ) then
      raise exception 'Board meeting does not belong to file school';
    end if;
  end if;
  new.updated_at=now();
  return new;
end;
$$;

revoke all on function private.validate_school_file_path() from public,anon,authenticated;
