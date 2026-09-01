alter table public.schedule_entries
  add column if not exists entry_kind text not null default 'lesson';

alter table public.schedule_entries
  drop constraint if exists schedule_entries_entry_kind_check;

alter table public.schedule_entries
  add constraint schedule_entries_entry_kind_check
  check (entry_kind in ('lesson','assembly','break','duty','other'));

update public.schedule_entries
set entry_kind = case
  when class_subject_id is not null then 'lesson'
  when lower(trim(subject))='samling' then 'assembly'
  when lower(trim(subject))='pause' then 'break'
  when lower(trim(subject)) in ('gårdvagt','gaardvagt') then 'duty'
  else 'other'
end;

create or replace function private.sync_schedule_class_subject()
returns trigger
language plpgsql
security definer
set search_path='public','private'
as $$
declare
  v_room_class_id bigint;
begin
  if new.entry_kind <> 'lesson' then
    new.class_subject_id:=null;
    return new;
  end if;

  if tg_op='UPDATE' and (
    (new.subject is distinct from old.subject and new.class_subject_id is not distinct from old.class_subject_id)
    or (new.class_id is distinct from old.class_id and new.class_subject_id is not distinct from old.class_subject_id)
    or (new.entry_kind is distinct from old.entry_kind and new.class_subject_id is not distinct from old.class_subject_id)
  ) then
    new.class_subject_id:=null;
  end if;

  if new.class_subject_id is not null then
    select cs.class_id into v_room_class_id
    from public.class_subjects cs
    where cs.id=new.class_subject_id and cs.active=true;

    if v_room_class_id is null or v_room_class_id<>new.class_id then
      raise exception 'Schedule subject room must belong to the same class';
    end if;
  else
    select cs.id into new.class_subject_id
    from public.class_subjects cs
    join public.subjects s on s.id=cs.subject_id
    where cs.class_id=new.class_id
      and cs.active=true
      and s.active=true
      and lower(trim(s.name))=lower(trim(new.subject))
    order by cs.id
    limit 1;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_schedule_class_subject() from public,anon,authenticated;

drop trigger if exists sync_schedule_class_subject_before_write on public.schedule_entries;
create trigger sync_schedule_class_subject_before_write
before insert or update of class_id,subject,class_subject_id,entry_kind on public.schedule_entries
for each row execute function private.sync_schedule_class_subject();

create index if not exists schedule_entries_kind_idx
  on public.schedule_entries(entry_kind);
