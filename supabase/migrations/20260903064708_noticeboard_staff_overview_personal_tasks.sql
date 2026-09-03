create table if not exists public.personal_tasks (
  id bigserial primary key,
  school_id bigint not null references public.schools(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (length(trim(title)) between 1 and 300),
  description text check (description is null or length(description) <= 2000),
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_personal_tasks_user_open_due
  on public.personal_tasks(user_id,completed,due_date,created_at);

alter table public.personal_tasks enable row level security;

drop policy if exists personal_tasks_owner_select on public.personal_tasks;
create policy personal_tasks_owner_select on public.personal_tasks
for select to authenticated
using (user_id=auth.uid() and public.is_school_member(school_id));

drop policy if exists personal_tasks_owner_insert on public.personal_tasks;
create policy personal_tasks_owner_insert on public.personal_tasks
for insert to authenticated
with check (user_id=auth.uid() and public.is_school_member(school_id));

drop policy if exists personal_tasks_owner_update on public.personal_tasks;
create policy personal_tasks_owner_update on public.personal_tasks
for update to authenticated
using (user_id=auth.uid() and public.is_school_member(school_id))
with check (user_id=auth.uid() and public.is_school_member(school_id));

drop policy if exists personal_tasks_owner_delete on public.personal_tasks;
create policy personal_tasks_owner_delete on public.personal_tasks
for delete to authenticated
using (user_id=auth.uid() and public.is_school_member(school_id));

create or replace function public.create_personal_task(
  p_title text,
  p_description text default null,
  p_due_date date default null
)
returns bigint
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_school_id bigint;
  v_id bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(coalesce(p_title,'')))=0 then raise exception 'Title required'; end if;

  select sm.school_id into v_school_id
  from public.school_memberships sm
  where sm.user_id=auth.uid()
    and sm.active=true
    and sm.role in ('teacher','admin','leader')
  order by sm.school_id
  limit 1;

  if v_school_id is null then raise exception 'Active staff membership required'; end if;

  insert into public.personal_tasks(school_id,user_id,title,description,due_date)
  values(v_school_id,auth.uid(),trim(p_title),nullif(trim(coalesce(p_description,'')),''),p_due_date)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_personal_task(text,text,date) from public,anon;
grant execute on function public.create_personal_task(text,text,date) to authenticated,service_role;

create or replace function public.delete_personal_task(p_task_id bigint)
returns void
language plpgsql
security definer
set search_path=public,private
as $$
declare v_rows integer;
begin
  delete from public.personal_tasks
  where id=p_task_id and user_id=auth.uid();
  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception 'Task not found'; end if;
end;
$$;

revoke all on function public.delete_personal_task(bigint) from public,anon;
grant execute on function public.delete_personal_task(bigint) to authenticated,service_role;

create or replace function public.my_action_inbox(p_include_completed boolean default false)
returns table(
  task_key text,
  source text,
  action_id bigint,
  context_id bigint,
  title text,
  description text,
  due_date date,
  completed boolean,
  context_title text,
  context_type text,
  starts_at timestamptz,
  can_open_context boolean
)
language sql
stable
security definer
set search_path=public,private
as $$
  select task_key,source,action_id,context_id,title,description,due_date,completed,
         context_title,context_type,starts_at,can_open_context
  from (
    select
      'meeting:'||ma.id::text as task_key,
      'meeting'::text as source,
      ma.id as action_id,
      ma.meeting_id as context_id,
      ma.title,
      ma.description,
      ma.due_date,
      ma.completed,
      case when private.can_access_meeting(cm.id) then cm.title else null end as context_title,
      case when private.can_access_meeting(cm.id) then cm.meeting_type else null end as context_type,
      case when private.can_access_meeting(cm.id) then cm.starts_at else null end as starts_at,
      private.can_access_meeting(cm.id) as can_open_context,
      ma.created_at
    from public.meeting_actions ma
    join public.calendar_meetings cm on cm.id=ma.meeting_id
    where ma.responsible_user_id=auth.uid()
      and public.is_school_member(cm.school_id)

    union all

    select
      'board:'||bd.id::text,
      'board'::text,
      bd.id,
      bd.meeting_id,
      bd.decision,
      null::text,
      bd.due_date,
      bd.completed,
      bm.title,
      'Bestyrelsesmøde'::text,
      ((bm.meeting_date+coalesce(bm.start_time,time '00:00')) at time zone 'Europe/Copenhagen'),
      true,
      bd.created_at
    from public.board_decisions bd
    join public.board_meetings bm on bm.id=bd.meeting_id
    where bd.responsible_user_id=auth.uid()
      and exists(
        select 1 from public.school_memberships sm
        where sm.school_id=bm.school_id and sm.user_id=auth.uid()
          and sm.role='board' and sm.active=true
      )

    union all

    select
      'personal:'||pt.id::text,
      'personal'::text,
      pt.id,
      null::bigint,
      pt.title,
      pt.description,
      pt.due_date,
      pt.completed,
      null::text,
      'Egen opgave'::text,
      null::timestamptz,
      false,
      pt.created_at
    from public.personal_tasks pt
    where pt.user_id=auth.uid()
      and public.is_school_member(pt.school_id)
  ) actions
  where coalesce(p_include_completed,false) or actions.completed=false
  order by due_date asc nulls last,created_at asc;
$$;

revoke all on function public.my_action_inbox(boolean) from public,anon;
grant execute on function public.my_action_inbox(boolean) to authenticated,service_role;

create or replace function public.set_my_action_completed(
  p_source text,
  p_action_id bigint,
  p_completed boolean
)
returns void
language plpgsql
security definer
set search_path=public,private
as $$
declare v_rows integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  if p_source='meeting' then
    update public.meeting_actions ma
    set completed=coalesce(p_completed,false),
        completed_at=case when coalesce(p_completed,false) then now() else null end,
        updated_at=now()
    where ma.id=p_action_id and ma.responsible_user_id=auth.uid()
      and exists(select 1 from public.calendar_meetings cm where cm.id=ma.meeting_id and public.is_school_member(cm.school_id));
  elsif p_source='board' then
    update public.board_decisions bd
    set completed=coalesce(p_completed,false)
    where bd.id=p_action_id and bd.responsible_user_id=auth.uid()
      and exists(
        select 1 from public.board_meetings bm
        join public.school_memberships sm on sm.school_id=bm.school_id and sm.user_id=auth.uid() and sm.role='board' and sm.active=true
        where bm.id=bd.meeting_id
      );
  elsif p_source='personal' then
    update public.personal_tasks
    set completed=coalesce(p_completed,false),
        completed_at=case when coalesce(p_completed,false) then now() else null end,
        updated_at=now()
    where id=p_action_id and user_id=auth.uid();
  else
    raise exception 'Unknown action source';
  end if;

  get diagnostics v_rows=row_count;
  if v_rows<>1 then raise exception 'Handlingen tilhører ikke dig'; end if;
end;
$$;

revoke all on function public.set_my_action_completed(text,bigint,boolean) from public,anon;
grant execute on function public.set_my_action_completed(text,bigint,boolean) to authenticated,service_role;

create or replace function public.staff_absence_summary(p_date date default current_date)
returns table(user_id uuid,display_name text,initials text)
language sql
stable
security definer
set search_path=public,private
as $$
  select distinct
    sa.user_id,
    coalesce(nullif(trim(up.display_name),''),nullif(trim(up.initials),''),'Kollega') as display_name,
    nullif(trim(up.initials),'') as initials
  from public.staff_absence sa
  join public.school_memberships caller
    on caller.school_id=sa.school_id
   and caller.user_id=auth.uid()
   and caller.active=true
   and caller.role in ('teacher','admin','leader')
  left join public.user_profiles up on up.user_id=sa.user_id
  where auth.uid() is not null
    and sa.absence_date=coalesce(p_date,current_date)
  order by display_name,user_id;
$$;

revoke all on function public.staff_absence_summary(date) from public,anon;
grant execute on function public.staff_absence_summary(date) to authenticated,service_role;

alter table public.school_files drop constraint if exists school_files_area_check;
alter table public.school_files add constraint school_files_area_check
  check(area in ('board','staff','class','subject','meeting','parent','noticeboard'));

alter table public.school_files
  add column if not exists noticeboard_post_id uuid references public.noticeboard_posts(id) on delete cascade;

create index if not exists idx_school_files_noticeboard_post
  on public.school_files(noticeboard_post_id)
  where noticeboard_post_id is not null;

alter table public.school_files drop constraint if exists school_files_noticeboard_post_check;
alter table public.school_files add constraint school_files_noticeboard_post_check
  check(area<>'noticeboard' or noticeboard_post_id is not null);

drop policy if exists noticeboard_reads_noticeboard_files on public.school_files;
create policy noticeboard_reads_noticeboard_files on public.school_files
for select to authenticated
using(
  area='noticeboard'
  and exists(
    select 1 from public.noticeboard_posts np
    where np.id=school_files.noticeboard_post_id
      and np.school_id=school_files.school_id
  )
);

drop policy if exists noticeboard_inserts_noticeboard_files on public.school_files;
create policy noticeboard_inserts_noticeboard_files on public.school_files
for insert to authenticated
with check(
  area='noticeboard'
  and created_by=auth.uid()
  and exists(
    select 1 from public.noticeboard_posts np
    where np.id=school_files.noticeboard_post_id
      and np.school_id=school_files.school_id
      and np.author_id=auth.uid()
  )
);

drop policy if exists noticeboard_deletes_noticeboard_files on public.school_files;
create policy noticeboard_deletes_noticeboard_files on public.school_files
for delete to authenticated
using(
  area='noticeboard'
  and exists(
    select 1 from public.noticeboard_posts np
    where np.id=school_files.noticeboard_post_id
      and np.school_id=school_files.school_id
      and (np.author_id=auth.uid() or public.has_school_role(np.school_id,'admin'))
  )
);

drop policy if exists noticeboard_reads_noticeboard_storage on storage.objects;
create policy noticeboard_reads_noticeboard_storage on storage.objects
for select to authenticated
using(
  bucket_id='school-files'
  and exists(
    select 1 from public.school_files sf
    where sf.object_path=storage.objects.name and sf.area='noticeboard'
  )
);

drop policy if exists noticeboard_inserts_noticeboard_storage on storage.objects;
create policy noticeboard_inserts_noticeboard_storage on storage.objects
for insert to authenticated
with check(
  bucket_id='school-files'
  and split_part(name,'/',2)='noticeboard'
  and exists(
    select 1 from public.noticeboard_posts np
    where np.id::text=split_part(storage.objects.name,'/',3)
      and np.author_id=auth.uid()
      and split_part(storage.objects.name,'/',1)='school-'||np.school_id::text
  )
);

drop policy if exists noticeboard_deletes_noticeboard_storage on storage.objects;
create policy noticeboard_deletes_noticeboard_storage on storage.objects
for delete to authenticated
using(
  bucket_id='school-files'
  and exists(
    select 1 from public.school_files sf
    join public.noticeboard_posts np on np.id=sf.noticeboard_post_id
    where sf.object_path=storage.objects.name
      and sf.area='noticeboard'
      and (np.author_id=auth.uid() or public.has_school_role(np.school_id,'admin'))
  )
);
