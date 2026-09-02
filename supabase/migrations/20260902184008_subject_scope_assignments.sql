alter table public.assignments
  add column if not exists subject_id bigint references public.subjects(id) on delete set null,
  add column if not exists assignment_kind text not null default 'generic';

alter table public.assignments drop constraint if exists assignments_assignment_kind_check;
alter table public.assignments add constraint assignments_assignment_kind_check
  check (assignment_kind in ('danish_writing','math_task','generic'));

create index if not exists assignments_subject_id_idx on public.assignments(subject_id);

update public.assignments a
set subject_id=cs.subject_id
from public.class_subjects cs
where a.class_subject_id=cs.id
  and a.subject_id is distinct from cs.subject_id;

update public.assignments a
set subject_id=s.id,
    assignment_kind='danish_writing'
from public.classes c
join public.subjects s on s.school_id=c.school_id and s.slug='dansk' and s.active=true
where a.class_id=c.id
  and a.subject_id is null
  and a.type in ('Debatindlæg','Fortælling','Artikel','Nyhedsartikel','Novelle','Essay');

create or replace function private.enforce_assignment_subject_context()
returns trigger
language plpgsql
set search_path=public,private
as $$
declare
  v_room_class bigint;
  v_room_subject bigint;
  v_class_school bigint;
  v_subject_school bigint;
  v_subject_slug text;
begin
  select c.school_id into v_class_school from public.classes c where c.id=new.class_id;
  if v_class_school is null then raise exception 'Assignment class does not exist'; end if;

  if new.class_subject_id is not null then
    select cs.class_id,cs.subject_id into v_room_class,v_room_subject
    from public.class_subjects cs
    where cs.id=new.class_subject_id and cs.active=true;
    if v_room_class is null then raise exception 'Subject room does not exist or is inactive'; end if;
    if v_room_class<>new.class_id then raise exception 'Subject room must belong to the assignment class'; end if;
    new.subject_id:=v_room_subject;
  end if;

  if new.subject_id is not null then
    select s.school_id,s.slug into v_subject_school,v_subject_slug
    from public.subjects s where s.id=new.subject_id and s.active=true;
    if v_subject_school is null then raise exception 'Assignment subject does not exist or is inactive'; end if;
    if v_subject_school<>v_class_school then raise exception 'Assignment subject must belong to the class school'; end if;
  end if;

  if new.assignment_kind='danish_writing' then
    if new.subject_id is null or v_subject_slug<>'dansk' then
      raise exception 'Danish writing tasks can only be assigned in Dansk';
    end if;
  elsif new.assignment_kind='math_task' then
    if new.subject_id is null or v_subject_slug<>'matematik' then
      raise exception 'Math tasks can only be assigned in Matematik';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_assignment_subject_context() from public,anon,authenticated;
grant execute on function private.enforce_assignment_subject_context() to service_role;

drop trigger if exists assignments_enforce_subject_context on public.assignments;
create trigger assignments_enforce_subject_context
before insert or update of class_id,class_subject_id,subject_id,assignment_kind on public.assignments
for each row execute function private.enforce_assignment_subject_context();

create or replace function public.create_assignment_and_recipients_v2(
  p_class_subject_id bigint,
  p_title text,
  p_instructions text,
  p_type text,
  p_assignment_kind text,
  p_student_ids bigint[] default null
)
returns jsonb
language plpgsql
set search_path=public
as $$
declare
  v_class_id bigint;
  v_assignment_id bigint;
begin
  select cs.class_id into v_class_id
  from public.class_subjects cs
  where cs.id=p_class_subject_id and cs.active=true;
  if v_class_id is null then raise exception 'Choose an active subject room'; end if;
  if nullif(trim(coalesce(p_title,'')),'') is null then raise exception 'Assignment title is required'; end if;
  if nullif(trim(coalesce(p_type,'')),'') is null then raise exception 'Assignment type is required'; end if;

  if p_student_ids is not null and exists (
    select 1 from unnest(p_student_ids) sid
    left join public.students s on s.id=sid
    where s.id is null or s.class_id<>v_class_id
  ) then raise exception 'All recipients must belong to the assignment class'; end if;

  insert into public.assignments(class_id,title,type,instructions,class_subject_id,assignment_kind)
  values(v_class_id,trim(p_title),trim(p_type),nullif(trim(coalesce(p_instructions,'')),''),p_class_subject_id,p_assignment_kind)
  returning id into v_assignment_id;

  if p_student_ids is not null and coalesce(array_length(p_student_ids,1),0)>0 then
    insert into public.assignment_students(assignment_id,student_id)
    select v_assignment_id,sid from (select distinct unnest(p_student_ids) sid) q;
  end if;

  return jsonb_build_object('ok',true,'assignment_id',v_assignment_id);
end;
$$;

create or replace function public.update_assignment_and_recipients_v2(
  p_assignment_id bigint,
  p_title text,
  p_instructions text,
  p_type text,
  p_class_subject_id bigint,
  p_assignment_kind text,
  p_student_ids bigint[] default null
)
returns jsonb
language plpgsql
set search_path=public
as $$
declare
  v_class_id bigint;
begin
  select a.class_id into v_class_id from public.assignments a where a.id=p_assignment_id;
  if v_class_id is null then raise exception 'Assignment not found or not editable'; end if;
  if nullif(trim(coalesce(p_title,'')),'') is null then raise exception 'Assignment title is required'; end if;

  if not exists(
    select 1 from public.class_subjects cs
    where cs.id=p_class_subject_id and cs.class_id=v_class_id and cs.active=true
  ) then raise exception 'Subject room must belong to the assignment class'; end if;

  if p_student_ids is not null and exists(
    select 1 from unnest(p_student_ids) sid
    left join public.students s on s.id=sid
    where s.id is null or s.class_id<>v_class_id
  ) then raise exception 'All recipients must belong to the assignment class'; end if;

  update public.assignments
  set title=trim(p_title),instructions=nullif(trim(coalesce(p_instructions,'')),''),type=trim(p_type),
      class_subject_id=p_class_subject_id,assignment_kind=p_assignment_kind
  where id=p_assignment_id;
  if not found then raise exception 'Assignment could not be updated'; end if;

  delete from public.assignment_students where assignment_id=p_assignment_id;
  if p_student_ids is not null and coalesce(array_length(p_student_ids,1),0)>0 then
    insert into public.assignment_students(assignment_id,student_id)
    select p_assignment_id,sid from (select distinct unnest(p_student_ids) sid) q;
  end if;

  return jsonb_build_object('ok',true,'assignment_id',p_assignment_id);
end;
$$;

revoke all on function public.create_assignment_and_recipients_v2(bigint,text,text,text,text,bigint[]) from public,anon;
revoke all on function public.update_assignment_and_recipients_v2(bigint,text,text,text,bigint,text,bigint[]) from public,anon;
grant execute on function public.create_assignment_and_recipients_v2(bigint,text,text,text,text,bigint[]) to authenticated;
grant execute on function public.update_assignment_and_recipients_v2(bigint,text,text,text,bigint,text,bigint[]) to authenticated;

create or replace function public.student_session_data(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path=public,private
as $$
declare
  v_student_id bigint;
  s public.students;
  c public.classes;
  v_result jsonb;
begin
  v_student_id:=private.student_id_for_session(p_session_token);
  if v_student_id is null then return jsonb_build_object('ok',false,'error','invalid_session'); end if;

  select * into s from public.students where id=v_student_id;
  select * into c from public.classes where id=s.class_id;
  if s.id is null or c.id is null then return jsonb_build_object('ok',false,'error','student_not_found'); end if;

  select jsonb_build_object(
    'ok',true,
    'student',jsonb_build_object('id',s.id,'name',s.name,'class_id',s.class_id,'grade_level',s.grade_level),
    'class',jsonb_build_object('id',c.id,'name',c.name),
    'assignments',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',a.id,'title',a.title,'type',a.type,'instructions',a.instructions,
        'class_subject_id',a.class_subject_id,'subject_id',a.subject_id,'assignment_kind',a.assignment_kind,
        'subject_name',sub.name,'subject_slug',sub.slug
      ) order by a.id)
      from public.assignments a
      left join public.subjects sub on sub.id=a.subject_id
      where a.class_id=s.class_id
        and (
          not exists(select 1 from public.assignment_students ast0 where ast0.assignment_id=a.id)
          or exists(select 1 from public.assignment_students ast where ast.assignment_id=a.id and ast.student_id=s.id)
        )
    ),'[]'::jsonb),
    'drafts',coalesce((
      select jsonb_agg(jsonb_build_object('assignment_id',d.assignment_id,'content',d.content))
      from public.drafts d where d.student_id=s.id
    ),'[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.student_session_data(text) from public,authenticated;
grant execute on function public.student_session_data(text) to anon,service_role;
