alter table public.schedule_entries
  add column if not exists based_on_schedule_entry_id bigint references public.schedule_entries(id) on delete set null;

create index if not exists schedule_entries_based_on_idx
  on public.schedule_entries(based_on_schedule_entry_id)
  where based_on_schedule_entry_id is not null;

create unique index if not exists schedule_entries_version_lineage_key
  on public.schedule_entries(schedule_version_id,based_on_schedule_entry_id)
  where based_on_schedule_entry_id is not null;

create or replace function public.publish_schedule_version_v2(
  p_version_id bigint,
  p_effective_from date default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_year_id bigint;
  v_school_id bigint;
  v_status text;
  v_version_name text;
  v_period_start date;
  v_period_end date;
  v_teaching_start date;
  v_teaching_end date;
  v_start date;
  v_today date:=(now() at time zone 'Europe/Copenhagen')::date;
  v_current_id bigint;
  v_current_start date;
  v_conflicts integer:=0;
  v_unresolved integer:=0;
  v_unassigned integer:=0;
  v_inactive_staff integer:=0;
  v_missing integer:=0;
  v_over integer:=0;
  v_overbooked integer:=0;
  v_prepared_unmatched integer:=0;
  v_target_conflicts integer:=0;
  v_migrated_preparations integer:=0;
  v_new_draft_id bigint;
  v_new_entry_id bigint;
  v_entry record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select sv.school_year_id,sy.school_id,sv.status,sv.name,sy.period_start,sy.period_end,sy.teaching_start,sy.teaching_end
    into v_year_id,v_school_id,v_status,v_version_name,v_period_start,v_period_end,v_teaching_start,v_teaching_end
  from public.school_schedule_versions sv
  join public.school_years sy on sy.id=sv.school_year_id
  where sv.id=p_version_id;

  if v_year_id is null then raise exception 'Schedule version not found'; end if;
  if v_status<>'draft' then raise exception 'Only a draft schedule version can be published'; end if;
  if not (public.has_school_role(v_school_id,'admin') or public.has_school_role(v_school_id,'leader')) then
    raise exception 'Leadership access required';
  end if;

  v_start:=coalesce(p_effective_from,v_teaching_start,v_period_start);
  if v_start<v_period_start or v_start>v_period_end then raise exception 'Effective date must be inside the school year'; end if;
  if v_teaching_start is not null and v_start<v_teaching_start then raise exception 'Effective date cannot be before teaching starts'; end if;
  if v_teaching_end is not null and v_start>v_teaching_end then raise exception 'Effective date cannot be after teaching ends'; end if;

  select sv.id,sv.effective_from into v_current_id,v_current_start
  from public.school_schedule_versions sv
  where sv.school_year_id=v_year_id and sv.status='published' and sv.id<>p_version_id
  limit 1;

  if v_current_id is not null then
    if v_current_start is null then raise exception 'Current published schedule is missing an effective date'; end if;
    if v_start<=v_current_start then raise exception 'A new schedule revision must start after the current version'; end if;
    if v_current_start<v_today and v_start<v_today then raise exception 'A schedule revision cannot rewrite past operational dates'; end if;
  end if;

  if not exists(select 1 from public.schedule_entries se where se.schedule_version_id=p_version_id) then
    raise exception 'An empty schedule cannot be published';
  end if;

  select count(*) into v_conflicts
  from public.school_year_schedule_conflicts(v_year_id,p_version_id);
  if v_conflicts>0 then raise exception 'Resolve all schedule conflicts before publishing (% conflicts)',v_conflicts; end if;

  select coalesce(h.unresolved_lessons,0) into v_unresolved
  from public.school_year_schedule_match_health(v_year_id,p_version_id) h
  limit 1;
  if coalesce(v_unresolved,0)>0 then raise exception 'All lessons must have a safe class-subject link before publishing (% unresolved)',v_unresolved; end if;

  select coalesce(h.unassigned_entries,0) into v_unassigned
  from public.school_year_staff_schedule_health(v_year_id,p_version_id) h
  limit 1;
  if coalesce(v_unassigned,0)>0 then raise exception 'All staff-relevant schedule entries must be assigned before publishing (% unassigned)',v_unassigned; end if;

  select count(*) into v_inactive_staff
  from public.schedule_teachers st
  join public.schedule_entries se on se.id=st.schedule_entry_id
  join public.classes c on c.id=se.class_id
  where se.schedule_version_id=p_version_id
    and not private.is_active_school_staff_member(c.school_id,st.teacher_id);
  if v_inactive_staff>0 then raise exception 'Schedule contains inactive staff assignments (% links)',v_inactive_staff; end if;

  if v_current_id is not null then
    select count(*) into v_prepared_unmatched
    from public.lesson_instances li
    join public.schedule_entries old_se on old_se.id=li.schedule_entry_id and old_se.schedule_version_id=v_current_id
    where li.lesson_date>=v_start
      and old_se.entry_kind='lesson'
      and (
        coalesce(trim(li.plan),'')<>''
        or coalesce(trim(li.learning_goals),'')<>''
        or li.subject_unit_id is not null
        or li.materials<>'[]'::jsonb
        or li.carry_forward_to is not null
        or coalesce(trim(li.carry_forward_note),'')<>''
        or exists(select 1 from public.lesson_resource_links lrl where lrl.lesson_instance_id=li.id)
      )
      and not exists(
        select 1
        from public.schedule_entries new_se
        where new_se.schedule_version_id=p_version_id
          and new_se.based_on_schedule_entry_id=old_se.id
          and new_se.entry_kind='lesson'
          and new_se.class_id=old_se.class_id
          and new_se.class_subject_id is not distinct from old_se.class_subject_id
          and new_se.weekday=extract(dow from li.lesson_date)::integer
          and (
            coalesce(new_se.recurrence_pattern,'weekly')='weekly'
            or (new_se.recurrence_pattern='odd' and mod(extract(week from li.lesson_date)::integer,2)=1)
            or (new_se.recurrence_pattern='even' and mod(extract(week from li.lesson_date)::integer,2)=0)
          )
      );
    if v_prepared_unmatched>0 then
      raise exception 'Publishing would detach % prepared future lesson(s). Resolve the affected preparation before publishing',v_prepared_unmatched;
    end if;

    select count(*) into v_target_conflicts
    from public.lesson_instances li
    join public.schedule_entries old_se on old_se.id=li.schedule_entry_id and old_se.schedule_version_id=v_current_id
    join public.schedule_entries new_se on new_se.schedule_version_id=p_version_id
      and new_se.based_on_schedule_entry_id=old_se.id
      and new_se.entry_kind='lesson'
      and new_se.class_id=old_se.class_id
      and new_se.class_subject_id is not distinct from old_se.class_subject_id
      and new_se.weekday=extract(dow from li.lesson_date)::integer
      and (
        coalesce(new_se.recurrence_pattern,'weekly')='weekly'
        or (new_se.recurrence_pattern='odd' and mod(extract(week from li.lesson_date)::integer,2)=1)
        or (new_se.recurrence_pattern='even' and mod(extract(week from li.lesson_date)::integer,2)=0)
      )
    where li.lesson_date>=v_start
      and exists(
        select 1 from public.lesson_instances target
        where target.schedule_entry_id=new_se.id
          and target.lesson_date=li.lesson_date
          and target.id<>li.id
      );
    if v_target_conflicts>0 then
      raise exception 'Publishing found % conflicting prepared lesson target(s)',v_target_conflicts;
    end if;

    update public.lesson_instances li
    set schedule_entry_id=new_se.id,updated_by=auth.uid(),updated_at=now()
    from public.schedule_entries old_se
    join public.schedule_entries new_se on new_se.schedule_version_id=p_version_id
      and new_se.based_on_schedule_entry_id=old_se.id
      and new_se.entry_kind='lesson'
      and new_se.class_id=old_se.class_id
      and new_se.class_subject_id is not distinct from old_se.class_subject_id
    where li.schedule_entry_id=old_se.id
      and old_se.schedule_version_id=v_current_id
      and li.lesson_date>=v_start
      and new_se.weekday=extract(dow from li.lesson_date)::integer
      and (
        coalesce(new_se.recurrence_pattern,'weekly')='weekly'
        or (new_se.recurrence_pattern='odd' and mod(extract(week from li.lesson_date)::integer,2)=1)
        or (new_se.recurrence_pattern='even' and mod(extract(week from li.lesson_date)::integer,2)=0)
      );
    get diagnostics v_migrated_preparations = row_count;
  end if;

  select count(*) filter(where coverage_status='missing'),count(*) filter(where coverage_status='over')
    into v_missing,v_over
  from public.school_year_teaching_coverage(v_year_id,p_version_id);
  select count(*) filter(where resource_status='overbooked')
    into v_overbooked
  from public.school_year_staff_resource_impact(v_year_id,p_version_id);

  if v_current_id is not null then
    update public.school_schedule_versions
    set status='archived',effective_to=v_start-1,updated_by=auth.uid(),updated_at=now()
    where id=v_current_id;
  end if;

  update public.school_schedule_versions
  set status='published',effective_from=v_start,effective_to=null,
      published_at=now(),published_by=auth.uid(),updated_by=auth.uid(),updated_at=now()
  where id=p_version_id;

  insert into public.school_schedule_versions(
    school_year_id,name,status,effective_from,effective_to,based_on_version_id,created_by,updated_by
  ) values(
    v_year_id,
    'Næste kladde · '||to_char(now() at time zone 'Europe/Copenhagen','DD-MM-YYYY HH24:MI'),
    'draft',null,null,p_version_id,auth.uid(),auth.uid()
  ) returning id into v_new_draft_id;

  for v_entry in
    select se.id,se.class_id,se.weekday,se.start_time,se.end_time,se.subject,se.teacher,se.room,se.class_subject_id,se.entry_kind,se.recurrence_pattern
    from public.schedule_entries se
    where se.schedule_version_id=p_version_id
    order by se.id
  loop
    insert into public.schedule_entries(
      class_id,weekday,start_time,end_time,subject,teacher,room,class_subject_id,entry_kind,recurrence_pattern,schedule_version_id,based_on_schedule_entry_id
    ) values(
      v_entry.class_id,v_entry.weekday,v_entry.start_time,v_entry.end_time,v_entry.subject,v_entry.teacher,v_entry.room,
      v_entry.class_subject_id,v_entry.entry_kind,v_entry.recurrence_pattern,v_new_draft_id,v_entry.id
    ) returning id into v_new_entry_id;

    insert into public.schedule_teachers(schedule_entry_id,teacher_id)
    select v_new_entry_id,st.teacher_id
    from public.schedule_teachers st
    where st.schedule_entry_id=v_entry.id;
  end loop;

  return jsonb_build_object(
    'published_version_id',p_version_id,
    'published_name',v_version_name,
    'effective_from',v_start,
    'new_draft_version_id',v_new_draft_id,
    'preparations_migrated',coalesce(v_migrated_preparations,0),
    'warnings',jsonb_build_object(
      'teaching_missing',coalesce(v_missing,0),
      'teaching_over',coalesce(v_over,0),
      'staff_overbooked',coalesce(v_overbooked,0)
    )
  );
end;
$$;

revoke all on function public.publish_schedule_version_v2(bigint,date) from public,anon;
grant execute on function public.publish_schedule_version_v2(bigint,date) to authenticated;
comment on function public.publish_schedule_version_v2(bigint,date) is 'Atomically validates and publishes a schedule draft, preserves future lesson preparation through entry lineage, archives the prior live version, and creates a cloned next draft.';