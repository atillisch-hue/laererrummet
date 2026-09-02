alter table public.board_decisions
  add column if not exists responsible_user_id uuid references auth.users(id) on delete set null,
  add column if not exists created_by uuid default auth.uid() references auth.users(id) on delete set null,
  add column if not exists completed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_board_decisions_responsible_open
  on public.board_decisions(responsible_user_id,due_date)
  where completed=false and responsible_user_id is not null;

create or replace function private.validate_board_decision_responsible()
returns trigger
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_school_id bigint;
  v_responsible_name text;
begin
  select bm.school_id into v_school_id
  from public.board_meetings bm
  where bm.id=new.meeting_id;

  if v_school_id is null then
    raise exception 'Board meeting not found';
  end if;

  if new.responsible_user_id is not null then
    if not exists(
      select 1
      from public.school_memberships sm
      where sm.school_id=v_school_id
        and sm.user_id=new.responsible_user_id
        and sm.role='board'
        and sm.active=true
    ) then
      raise exception 'Responsible user must be an active board member at the same school';
    end if;

    select coalesce(nullif(trim(up.display_name),''),nullif(trim(up.initials),''),'Bestyrelsesmedlem')
      into v_responsible_name
    from public.user_profiles up
    where up.user_id=new.responsible_user_id;

    new.responsible=coalesce(v_responsible_name,'Bestyrelsesmedlem');
  end if;

  new.completed_at=case
    when new.completed then coalesce(new.completed_at,now())
    else null
  end;
  new.updated_at=now();
  return new;
end;
$$;

revoke all on function private.validate_board_decision_responsible() from public,anon,authenticated;

drop trigger if exists validate_board_decision_responsible on public.board_decisions;
create trigger validate_board_decision_responsible
before insert or update of meeting_id,responsible_user_id,completed
on public.board_decisions
for each row execute function private.validate_board_decision_responsible();

create or replace function public.board_member_directory()
returns table(user_id uuid,display_name text)
language sql
stable
security definer
set search_path=public,private
as $$
  select distinct
    target.user_id,
    coalesce(nullif(trim(up.display_name),''),nullif(trim(up.initials),''),'Bestyrelsesmedlem') as display_name
  from public.school_memberships me
  join public.school_memberships target
    on target.school_id=me.school_id
   and target.role='board'
   and target.active=true
  left join public.user_profiles up
    on up.user_id=target.user_id
  where auth.uid() is not null
    and me.user_id=auth.uid()
    and me.role='board'
    and me.active=true
  order by display_name,user_id;
$$;

revoke all on function public.board_member_directory() from public,anon;
grant execute on function public.board_member_directory() to authenticated,service_role;

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
  select
    task_key,source,action_id,context_id,title,description,due_date,completed,
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
        select 1
        from public.school_memberships sm
        where sm.school_id=bm.school_id
          and sm.user_id=auth.uid()
          and sm.role='board'
          and sm.active=true
      )
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
declare
  v_rows integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_source='meeting' then
    update public.meeting_actions ma
    set completed=coalesce(p_completed,false),
        completed_at=case when coalesce(p_completed,false) then now() else null end,
        updated_at=now()
    where ma.id=p_action_id
      and ma.responsible_user_id=auth.uid()
      and exists(
        select 1
        from public.calendar_meetings cm
        where cm.id=ma.meeting_id
          and public.is_school_member(cm.school_id)
      );
  elsif p_source='board' then
    update public.board_decisions bd
    set completed=coalesce(p_completed,false)
    where bd.id=p_action_id
      and bd.responsible_user_id=auth.uid()
      and exists(
        select 1
        from public.board_meetings bm
        join public.school_memberships sm
          on sm.school_id=bm.school_id
         and sm.user_id=auth.uid()
         and sm.role='board'
         and sm.active=true
        where bm.id=bd.meeting_id
      );
  else
    raise exception 'Unknown action source';
  end if;

  get diagnostics v_rows=row_count;
  if v_rows<>1 then
    raise exception 'Handlingen tilhører ikke dig';
  end if;
end;
$$;

revoke all on function public.set_my_action_completed(text,bigint,boolean) from public,anon;
grant execute on function public.set_my_action_completed(text,bigint,boolean) to authenticated,service_role;
