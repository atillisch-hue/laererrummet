create or replace function public.school_year_schedule_conflicts(
  p_school_year_id bigint,
  p_schedule_version_id bigint default null
)
returns table(
  conflict_type text,
  entry_a_id bigint,
  entry_b_id bigint,
  weekday integer,
  overlap_start time without time zone,
  overlap_end time without time zone,
  overlap_pattern text,
  class_a text,
  class_b text,
  subject_a text,
  subject_b text,
  room text,
  teacher_ids uuid[]
)
language plpgsql
stable
security invoker
set search_path=''
as $$
declare
  v_school_id bigint;
  v_version_id bigint;
begin
  select sy.school_id into v_school_id
  from public.school_years sy
  where sy.id=p_school_year_id;

  if v_school_id is null then raise exception 'School year not found'; end if;
  if not (public.has_school_role(v_school_id,'admin') or public.has_school_role(v_school_id,'leader')) then
    raise exception 'Leadership access required';
  end if;

  if p_schedule_version_id is not null then
    select sv.id into v_version_id
    from public.school_schedule_versions sv
    where sv.id=p_schedule_version_id and sv.school_year_id=p_school_year_id;
  else
    select sv.id into v_version_id
    from public.school_schedule_versions sv
    where sv.school_year_id=p_school_year_id
    order by case sv.status when 'draft' then 0 when 'published' then 1 else 2 end,sv.created_at desc
    limit 1;
  end if;
  if v_version_id is null then raise exception 'Schedule version not found'; end if;

  return query
  with pairs as (
    select
      a.id as a_id,
      b.id as b_id,
      a.class_id as a_class_id,
      b.class_id as b_class_id,
      a.weekday,
      greatest(a.start_time,b.start_time) as overlap_start,
      least(a.end_time,b.end_time) as overlap_end,
      case
        when coalesce(a.recurrence_pattern,'weekly')='weekly' then coalesce(b.recurrence_pattern,'weekly')
        when coalesce(b.recurrence_pattern,'weekly')='weekly' then coalesce(a.recurrence_pattern,'weekly')
        else coalesce(a.recurrence_pattern,'weekly')
      end::text as overlap_pattern,
      ca.name::text as class_a,
      cb.name::text as class_b,
      a.subject::text as subject_a,
      b.subject::text as subject_b,
      case when a.room is not null and b.room is not null and lower(trim(a.room))=lower(trim(b.room)) then a.room else null end::text as shared_room,
      array(
        select st1.teacher_id
        from public.schedule_teachers st1
        join public.schedule_teachers st2 on st2.teacher_id=st1.teacher_id
        where st1.schedule_entry_id=a.id and st2.schedule_entry_id=b.id
        order by st1.teacher_id
      )::uuid[] as shared_teachers
    from public.schedule_entries a
    join public.schedule_entries b on b.id>a.id
      and b.schedule_version_id=a.schedule_version_id
      and b.weekday=a.weekday
      and a.start_time<b.end_time
      and b.start_time<a.end_time
      and (
        coalesce(a.recurrence_pattern,'weekly')='weekly'
        or coalesce(b.recurrence_pattern,'weekly')='weekly'
        or coalesce(a.recurrence_pattern,'weekly')=coalesce(b.recurrence_pattern,'weekly')
      )
    join public.classes ca on ca.id=a.class_id and ca.school_id=v_school_id
    join public.classes cb on cb.id=b.class_id and cb.school_id=v_school_id
    where a.schedule_version_id=v_version_id
  ), conflicts as (
    select 'class'::text as conflict_type,p.* from pairs p where p.a_class_id=p.b_class_id
    union all
    select 'teacher'::text as conflict_type,p.* from pairs p where cardinality(p.shared_teachers)>0
    union all
    select 'room'::text as conflict_type,p.* from pairs p where p.shared_room is not null
  )
  select c.conflict_type,c.a_id,c.b_id,c.weekday,c.overlap_start,c.overlap_end,c.overlap_pattern,
         c.class_a,c.class_b,c.subject_a,c.subject_b,c.shared_room,c.shared_teachers
  from conflicts c
  order by c.weekday,c.overlap_start,c.a_id,c.b_id,c.conflict_type;
end;
$$;

revoke all on function public.school_year_schedule_conflicts(bigint,bigint) from public,anon;
grant execute on function public.school_year_schedule_conflicts(bigint,bigint) to authenticated;
