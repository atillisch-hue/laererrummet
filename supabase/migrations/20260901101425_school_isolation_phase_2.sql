-- Klassevaerelset security hardening phase 2
-- Make root work objects school-owned and scope sensitive data by school/class.

create or replace function public.has_school_role(p_school_id bigint, p_role text)
returns boolean language sql stable security definer set search_path='public' as $$
select exists(select 1 from public.school_memberships sm where sm.user_id=auth.uid() and sm.school_id=p_school_id and sm.role=p_role and sm.active=true);
$$;

create or replace function public.is_school_member(p_school_id bigint)
returns boolean language sql stable security definer set search_path='public' as $$
select exists(select 1 from public.school_memberships sm where sm.user_id=auth.uid() and sm.school_id=p_school_id and sm.active=true);
$$;

create or replace function public.is_school_staff(p_school_id bigint)
returns boolean language sql stable security definer set search_path='public' as $$
select exists(select 1 from public.school_memberships sm where sm.user_id=auth.uid() and sm.school_id=p_school_id and sm.role in ('teacher','admin') and sm.active=true);
$$;

create or replace function public.staff_can_access_student(p_student_id bigint)
returns boolean language sql stable security definer set search_path='public' as $$
select exists(
  select 1 from public.students s join public.classes c on c.id=s.class_id
  where s.id=p_student_id and (
    exists(select 1 from public.teacher_classes tc join public.school_memberships sm on sm.user_id=tc.teacher_id and sm.school_id=c.school_id and sm.role='teacher' and sm.active=true where tc.class_id=s.class_id and tc.teacher_id=auth.uid())
    or exists(select 1 from public.school_memberships sm where sm.user_id=auth.uid() and sm.school_id=c.school_id and sm.role='admin' and sm.active=true)
  )
);
$$;

create or replace function public.parent_can_access_student(p_student_id bigint)
returns boolean language sql stable security definer set search_path='public' as $$
select exists(
 select 1 from public.parent_students ps join public.students s on s.id=ps.student_id join public.classes c on c.id=s.class_id
 join public.school_memberships sm on sm.school_id=c.school_id and sm.user_id=ps.parent_id and sm.role='parent' and sm.active=true
 where ps.parent_id=auth.uid() and ps.student_id=p_student_id
);
$$;

create or replace function public.resolve_single_active_school(p_user_id uuid,p_roles text[] default null)
returns bigint language sql stable security definer set search_path='public' as $$
select case when count(distinct sm.school_id)=1 then min(sm.school_id) else null end
from public.school_memberships sm
where sm.user_id=p_user_id and sm.active=true and (p_roles is null or sm.role=any(p_roles));
$$;

alter table public.calendar_meetings add column if not exists school_id bigint references public.schools(id);
alter table public.noticeboard_posts add column if not exists school_id bigint references public.schools(id);
alter table public.staff_absence add column if not exists school_id bigint references public.schools(id);
alter table public.school_rooms add column if not exists school_id bigint references public.schools(id);
alter table public.resource_bookings add column if not exists school_id bigint references public.schools(id);

update public.calendar_meetings cm set school_id=coalesce((select c.school_id from public.students s join public.classes c on c.id=s.class_id where s.id=cm.student_id),public.resolve_single_active_school(cm.created_by,array['teacher','admin']),(select min(id) from public.schools where (select count(*) from public.schools)=1)) where cm.school_id is null;
update public.noticeboard_posts np set school_id=coalesce(public.resolve_single_active_school(np.author_id,null),(select min(id) from public.schools where (select count(*) from public.schools)=1)) where np.school_id is null;
update public.staff_absence sa set school_id=coalesce((select min(target.school_id) from public.school_memberships target where target.user_id=sa.user_id and target.active=true and (sa.created_by is null or exists(select 1 from public.school_memberships actor where actor.user_id=sa.created_by and actor.school_id=target.school_id and actor.active=true and actor.role='admin'))),public.resolve_single_active_school(sa.user_id,null),(select min(id) from public.schools where (select count(*) from public.schools)=1)) where sa.school_id is null;
update public.school_rooms sr set school_id=(select min(id) from public.schools where (select count(*) from public.schools)=1) where sr.school_id is null;
update public.resource_bookings rb set school_id=coalesce((select cm.school_id from public.calendar_meetings cm where cm.id=rb.meeting_id),(select sr.school_id from public.school_rooms sr where sr.id=rb.room_id),public.resolve_single_active_school(rb.created_by,array['teacher','admin']),(select min(id) from public.schools where (select count(*) from public.schools)=1)) where rb.school_id is null;

alter table public.calendar_meetings alter column school_id set not null;
alter table public.noticeboard_posts alter column school_id set not null;
alter table public.staff_absence alter column school_id set not null;
alter table public.school_rooms alter column school_id set not null;
alter table public.resource_bookings alter column school_id set not null;

create index if not exists idx_calendar_meetings_school_id on public.calendar_meetings(school_id);
create index if not exists idx_noticeboard_posts_school_id on public.noticeboard_posts(school_id);
create index if not exists idx_staff_absence_school_id on public.staff_absence(school_id);
create index if not exists idx_school_rooms_school_id on public.school_rooms(school_id);
create index if not exists idx_resource_bookings_school_id on public.resource_bookings(school_id);

create or replace function public.set_calendar_meeting_school() returns trigger language plpgsql security definer set search_path='public' as $$
declare v_student_school bigint;
begin
 if new.student_id is not null then
   select c.school_id into v_student_school from public.students s join public.classes c on c.id=s.class_id where s.id=new.student_id;
   if v_student_school is null then raise exception 'Student school could not be resolved'; end if;
   if new.school_id is null then new.school_id:=v_student_school; end if;
   if new.school_id<>v_student_school then raise exception 'Meeting and student must belong to the same school'; end if;
 end if;
 if new.school_id is null then new.school_id:=public.resolve_single_active_school(new.created_by,array['teacher','admin']); end if;
 if new.school_id is null then raise exception 'school_id is required when the user belongs to multiple schools'; end if;
 return new;
end; $$;
drop trigger if exists calendar_meetings_set_school on public.calendar_meetings;
create trigger calendar_meetings_set_school before insert or update on public.calendar_meetings for each row execute function public.set_calendar_meeting_school();

create or replace function public.set_noticeboard_post_school() returns trigger language plpgsql security definer set search_path='public' as $$
begin
 if new.school_id is null then new.school_id:=public.resolve_single_active_school(new.author_id,null); end if;
 if new.school_id is null then raise exception 'school_id is required when the author belongs to multiple schools'; end if;
 return new;
end; $$;
drop trigger if exists noticeboard_posts_set_school on public.noticeboard_posts;
create trigger noticeboard_posts_set_school before insert or update on public.noticeboard_posts for each row execute function public.set_noticeboard_post_school();

create or replace function public.set_staff_absence_school() returns trigger language plpgsql security definer set search_path='public' as $$
declare v_school bigint;
begin
 if new.school_id is null then
   select case when count(distinct target.school_id)=1 then min(target.school_id) else null end into v_school
   from public.school_memberships target where target.user_id=new.user_id and target.active=true
   and (auth.uid() is null or exists(select 1 from public.school_memberships actor where actor.user_id=auth.uid() and actor.school_id=target.school_id and actor.active=true and actor.role='admin'));
   new.school_id:=v_school;
 end if;
 if new.school_id is null then raise exception 'school_id is required when staff membership is ambiguous'; end if;
 if not exists(select 1 from public.school_memberships sm where sm.user_id=new.user_id and sm.school_id=new.school_id and sm.active=true) then raise exception 'Staff member does not belong to this school'; end if;
 return new;
end; $$;
drop trigger if exists staff_absence_set_school on public.staff_absence;
create trigger staff_absence_set_school before insert or update on public.staff_absence for each row execute function public.set_staff_absence_school();

create or replace function public.set_school_room_school() returns trigger language plpgsql security definer set search_path='public' as $$
begin
 if new.school_id is null then new.school_id:=public.resolve_single_active_school(auth.uid(),array['teacher','admin']); end if;
 if new.school_id is null then select min(id) into new.school_id from public.schools where (select count(*) from public.schools)=1; end if;
 if new.school_id is null then raise exception 'school_id is required'; end if;
 return new;
end; $$;
drop trigger if exists school_rooms_set_school on public.school_rooms;
create trigger school_rooms_set_school before insert or update on public.school_rooms for each row execute function public.set_school_room_school();

create or replace function public.set_resource_booking_school() returns trigger language plpgsql security definer set search_path='public' as $$
declare v_related_school bigint;
begin
 if new.meeting_id is not null then
   select school_id into v_related_school from public.calendar_meetings where id=new.meeting_id;
   if new.school_id is null then new.school_id:=v_related_school; end if;
   if new.school_id<>v_related_school then raise exception 'Booking and meeting must belong to the same school'; end if;
 end if;
 if new.room_id is not null then
   select school_id into v_related_school from public.school_rooms where id=new.room_id;
   if new.school_id is null then new.school_id:=v_related_school; end if;
   if new.school_id<>v_related_school then raise exception 'Booking and room must belong to the same school'; end if;
 end if;
 if new.school_id is null then new.school_id:=public.resolve_single_active_school(new.created_by,array['teacher','admin']); end if;
 if new.school_id is null then raise exception 'school_id is required when the user belongs to multiple schools'; end if;
 return new;
end; $$;
drop trigger if exists resource_bookings_set_school on public.resource_bookings;
create trigger resource_bookings_set_school before insert or update on public.resource_bookings for each row execute function public.set_resource_booking_school();

create or replace function public.can_access_meeting(p_meeting_id bigint) returns boolean language sql stable security definer set search_path='public' as $$
select exists(select 1 from public.calendar_meetings cm where cm.id=p_meeting_id and ((cm.created_by=auth.uid() and public.is_school_staff(cm.school_id)) or public.has_school_role(cm.school_id,'admin') or exists(select 1 from public.meeting_participants mp where mp.meeting_id=cm.id and mp.user_id=auth.uid() and mp.access_type='internal' and public.is_school_member(cm.school_id))));
$$;
create or replace function public.can_edit_meeting(p_meeting_id bigint) returns boolean language sql stable security definer set search_path='public' as $$
select exists(select 1 from public.calendar_meetings cm where cm.id=p_meeting_id and public.is_school_staff(cm.school_id) and (cm.created_by=auth.uid() or public.has_school_role(cm.school_id,'admin') or exists(select 1 from public.meeting_participants mp where mp.meeting_id=cm.id and mp.user_id=auth.uid() and mp.access_type='internal')));
$$;
create or replace function public.get_guardian_meeting(p_meeting_id bigint)
returns table(id bigint,title text,meeting_type text,starts_at timestamptz,ends_at timestamptz,location text,agenda text,minutes text,status text,student_id bigint)
language sql stable security definer set search_path='public' as $$
select cm.id,cm.title,cm.meeting_type,cm.starts_at,cm.ends_at,cm.location,cm.agenda,cm.minutes,cm.status,cm.student_id
from public.calendar_meetings cm where cm.id=p_meeting_id and public.has_school_role(cm.school_id,'parent')
and exists(select 1 from public.meeting_participants mp where mp.meeting_id=cm.id and mp.user_id=auth.uid() and mp.access_type='guardian')
and (cm.student_id is null or public.parent_can_access_student(cm.student_id));
$$;

-- Replace broad policies with school-/class-aware policies.
drop policy if exists "internal users can create meetings" on public.calendar_meetings;
drop policy if exists "meeting creator can update meeting" on public.calendar_meetings;
drop policy if exists "meeting members can view meetings" on public.calendar_meetings;
create policy "school staff create meetings" on public.calendar_meetings for insert to authenticated with check(created_by=(select auth.uid()) and public.is_school_staff(school_id));
create policy "internal meeting members view meetings" on public.calendar_meetings for select to authenticated using(public.can_access_meeting(id));
create policy "meeting creator or school admin update meetings" on public.calendar_meetings for update to authenticated using(created_by=(select auth.uid()) or public.has_school_role(school_id,'admin')) with check(public.is_school_staff(school_id));
create policy "meeting creator or school admin delete meetings" on public.calendar_meetings for delete to authenticated using(created_by=(select auth.uid()) or public.has_school_role(school_id,'admin'));

drop policy if exists "meeting creator can manage participants" on public.meeting_participants;
drop policy if exists "meeting members can view participants" on public.meeting_participants;
create policy "meeting managers manage participants" on public.meeting_participants for all to authenticated using(public.can_edit_meeting(meeting_id)) with check(public.can_edit_meeting(meeting_id));
create policy "internal meeting members view participants" on public.meeting_participants for select to authenticated using(public.can_access_meeting(meeting_id));

drop policy if exists "meeting members can create actions" on public.meeting_actions;
drop policy if exists "meeting members can update actions" on public.meeting_actions;
drop policy if exists "meeting members can view actions" on public.meeting_actions;
create policy "meeting editors create actions" on public.meeting_actions for insert to authenticated with check(created_by=(select auth.uid()) and public.can_edit_meeting(meeting_id));
create policy "meeting editors update actions" on public.meeting_actions for update to authenticated using(public.can_edit_meeting(meeting_id)) with check(public.can_edit_meeting(meeting_id));
create policy "internal meeting members view actions" on public.meeting_actions for select to authenticated using(public.can_access_meeting(meeting_id));

drop policy if exists "meeting members can create decisions" on public.meeting_decisions;
drop policy if exists "meeting members can view decisions" on public.meeting_decisions;
create policy "meeting editors create decisions" on public.meeting_decisions for insert to authenticated with check(created_by=(select auth.uid()) and public.can_edit_meeting(meeting_id));
create policy "internal meeting members view decisions" on public.meeting_decisions for select to authenticated using(public.can_access_meeting(meeting_id));

drop policy if exists "internal users can create action plans" on public.student_action_plans;
drop policy if exists "internal users can update action plans" on public.student_action_plans;
drop policy if exists "internal users can view action plans" on public.student_action_plans;
create policy "relevant staff create action plans" on public.student_action_plans for insert to authenticated with check(created_by=(select auth.uid()) and public.staff_can_access_student(student_id));
create policy "relevant staff update action plans" on public.student_action_plans for update to authenticated using(public.staff_can_access_student(student_id)) with check(public.staff_can_access_student(student_id));
create policy "relevant staff view action plans" on public.student_action_plans for select to authenticated using(public.staff_can_access_student(student_id));

drop policy if exists "internal users can create plan actions" on public.student_plan_actions;
drop policy if exists "internal users can update plan actions" on public.student_plan_actions;
drop policy if exists "internal users can view plan actions" on public.student_plan_actions;
create policy "relevant staff create plan actions" on public.student_plan_actions for insert to authenticated with check(created_by=(select auth.uid()) and exists(select 1 from public.student_action_plans p where p.id=plan_id and public.staff_can_access_student(p.student_id)));
create policy "relevant staff update plan actions" on public.student_plan_actions for update to authenticated using(exists(select 1 from public.student_action_plans p where p.id=plan_id and public.staff_can_access_student(p.student_id))) with check(exists(select 1 from public.student_action_plans p where p.id=plan_id and public.staff_can_access_student(p.student_id)));
create policy "relevant staff view plan actions" on public.student_plan_actions for select to authenticated using(exists(select 1 from public.student_action_plans p where p.id=plan_id and public.staff_can_access_student(p.student_id)));

drop policy if exists "internal users can create plan followups" on public.student_plan_followups;
drop policy if exists "internal users can view plan followups" on public.student_plan_followups;
create policy "relevant staff create plan followups" on public.student_plan_followups for insert to authenticated with check(created_by=(select auth.uid()) and exists(select 1 from public.student_plan_actions a join public.student_action_plans p on p.id=a.plan_id where a.id=action_id and public.staff_can_access_student(p.student_id)));
create policy "relevant staff view plan followups" on public.student_plan_followups for select to authenticated using(exists(select 1 from public.student_plan_actions a join public.student_action_plans p on p.id=a.plan_id where a.id=action_id and public.staff_can_access_student(p.student_id)));

drop policy if exists "Authenticated users can read profiles" on public.user_profiles;
drop policy if exists "users can view own profile" on public.user_profiles;
create policy "school members view shared profiles" on public.user_profiles for select to authenticated using(user_id=(select auth.uid()) or exists(select 1 from public.school_memberships me join public.school_memberships them on them.school_id=me.school_id and them.user_id=user_profiles.user_id and them.active=true where me.user_id=(select auth.uid()) and me.active=true));

drop policy if exists "admins_manage_staff_absence" on public.staff_absence;
create policy "school admins manage staff absence" on public.staff_absence for all to authenticated using(public.has_school_role(school_id,'admin')) with check(public.has_school_role(school_id,'admin') and exists(select 1 from public.school_memberships sm where sm.school_id=staff_absence.school_id and sm.user_id=staff_absence.user_id and sm.active=true));

drop policy if exists "internal users can view rooms" on public.school_rooms;
create policy "school staff view rooms" on public.school_rooms for select to authenticated using(public.is_school_staff(school_id));
create policy "school admins manage rooms" on public.school_rooms for all to authenticated using(public.has_school_role(school_id,'admin')) with check(public.has_school_role(school_id,'admin'));

drop policy if exists "internal users can create bookings" on public.resource_bookings;
drop policy if exists "internal users can delete bookings" on public.resource_bookings;
drop policy if exists "internal users can update bookings" on public.resource_bookings;
drop policy if exists "internal users can view bookings" on public.resource_bookings;
create policy "school staff view bookings" on public.resource_bookings for select to authenticated using(public.is_school_staff(school_id));
create policy "school staff create bookings" on public.resource_bookings for insert to authenticated with check(created_by=(select auth.uid()) and public.is_school_staff(school_id));
create policy "booking creator or admin update bookings" on public.resource_bookings for update to authenticated using(created_by=(select auth.uid()) or public.has_school_role(school_id,'admin')) with check(public.is_school_staff(school_id));
create policy "booking creator or admin delete bookings" on public.resource_bookings for delete to authenticated using(created_by=(select auth.uid()) or public.has_school_role(school_id,'admin'));

drop policy if exists "internal users can add booking staff" on public.resource_booking_staff;
drop policy if exists "internal users can remove booking staff" on public.resource_booking_staff;
drop policy if exists "internal users can view booking staff" on public.resource_booking_staff;
create policy "school staff view booking staff" on public.resource_booking_staff for select to authenticated using(exists(select 1 from public.resource_bookings rb where rb.id=booking_id and public.is_school_staff(rb.school_id)));
create policy "booking managers add booking staff" on public.resource_booking_staff for insert to authenticated with check(exists(select 1 from public.resource_bookings rb where rb.id=booking_id and (rb.created_by=(select auth.uid()) or public.has_school_role(rb.school_id,'admin'))));
create policy "booking managers remove booking staff" on public.resource_booking_staff for delete to authenticated using(exists(select 1 from public.resource_bookings rb where rb.id=booking_id and (rb.created_by=(select auth.uid()) or public.has_school_role(rb.school_id,'admin'))));

drop policy if exists "Teachers can read noticeboard" on public.noticeboard_posts;
drop policy if exists "Authors can delete own noticeboard posts" on public.noticeboard_posts;
drop policy if exists "staff and board can create noticeboard posts" on public.noticeboard_posts;
create policy "school audience reads noticeboard" on public.noticeboard_posts for select to authenticated using(public.is_school_member(school_id) and (author_id=(select auth.uid()) or public.has_school_role(school_id,'admin') or exists(select 1 from public.school_memberships sm where sm.user_id=(select auth.uid()) and sm.school_id=noticeboard_posts.school_id and sm.active=true and sm.role=any(noticeboard_posts.audiences))));
create policy "staff and board create school noticeboard posts" on public.noticeboard_posts for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.school_memberships sm where sm.user_id=(select auth.uid()) and sm.school_id=noticeboard_posts.school_id and sm.active=true and sm.role in ('teacher','admin','board')));
create policy "author or admin deletes school noticeboard posts" on public.noticeboard_posts for delete to authenticated using(author_id=(select auth.uid()) or public.has_school_role(school_id,'admin'));

drop policy if exists "school_admins_manage_schedule" on public.schedule_entries;
drop policy if exists "substitutes read assigned schedule entries" on public.schedule_entries;
create policy "school staff read schedule" on public.schedule_entries for select to authenticated using(exists(select 1 from public.classes c where c.id=class_id and public.is_school_staff(c.school_id)));
create policy "school admins manage schedule" on public.schedule_entries for all to authenticated using(exists(select 1 from public.classes c where c.id=class_id and public.has_school_role(c.school_id,'admin'))) with check(exists(select 1 from public.classes c where c.id=class_id and public.has_school_role(c.school_id,'admin')));
create policy "substitutes read assigned schedule entries" on public.schedule_entries for select to authenticated using(exists(select 1 from public.substitute_assignments sa where sa.schedule_entry_id=schedule_entries.id and sa.substitute_teacher_id=(select auth.uid()) and public.is_school_member(sa.school_id)));

drop policy if exists "Authenticated users can read schedule teachers" on public.schedule_teachers;
drop policy if exists "school_admins_manage_schedule_teachers" on public.schedule_teachers;
create policy "school staff read schedule teachers" on public.schedule_teachers for select to authenticated using(exists(select 1 from public.schedule_entries se join public.classes c on c.id=se.class_id where se.id=schedule_entry_id and public.is_school_staff(c.school_id)));
create policy "school admins manage schedule teachers" on public.schedule_teachers for all to authenticated using(exists(select 1 from public.schedule_entries se join public.classes c on c.id=se.class_id where se.id=schedule_entry_id and public.has_school_role(c.school_id,'admin'))) with check(exists(select 1 from public.schedule_entries se join public.classes c on c.id=se.class_id where se.id=schedule_entry_id and public.has_school_role(c.school_id,'admin')));

create or replace function public.parent_can_read_assignment(p_assignment_id bigint) returns boolean language sql stable security definer set search_path='public' as $$ select exists(select 1 from public.assignment_students ast where ast.assignment_id=p_assignment_id and public.parent_can_access_student(ast.student_id)); $$;
create or replace function public.parent_portal_data() returns jsonb language plpgsql security definer set search_path='public' as $$
declare result jsonb; begin if auth.uid() is null then raise exception 'Not authenticated'; end if; select jsonb_build_object('children',coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'class_id',s.class_id,'class_name',c.name) order by s.name) filter(where s.id is not null),'[]'::jsonb)) into result from public.parent_students ps join public.students s on s.id=ps.student_id join public.classes c on c.id=s.class_id where ps.parent_id=auth.uid() and public.has_school_role(c.school_id,'parent'); return coalesce(result,jsonb_build_object('children','[]'::jsonb)); end; $$;

create or replace function public.get_internal_student_directory() returns table(id bigint,name text,class_id bigint) language sql stable security definer set search_path='public' as $$ select s.id,s.name,s.class_id from public.students s where public.staff_can_access_student(s.id) order by s.name; $$;
create or replace function public.get_internal_staff_directory() returns table(user_id uuid,display_name text,role text) language sql stable security definer set search_path='public' as $$ select up.user_id,up.display_name,case when bool_or(target.role='admin') then 'admin' when bool_or(target.role='teacher') then 'teacher' else 'board' end from public.user_profiles up join public.school_memberships target on target.user_id=up.user_id and target.active=true and target.role in ('teacher','admin','board') where up.active=true and exists(select 1 from public.school_memberships me where me.user_id=auth.uid() and me.school_id=target.school_id and me.active=true and me.role in ('teacher','admin')) group by up.user_id,up.display_name order by up.display_name; $$;
create or replace function public.get_meeting_user_directory() returns table(user_id uuid,display_name text,role text) language sql stable security definer set search_path='public' as $$ select * from public.get_internal_staff_directory(); $$;
create or replace function public.admin_staff_directory() returns table(user_id uuid,display_name text,role text,active boolean) language sql stable security definer set search_path='public' as $$ select up.user_id,up.display_name,case when bool_or(target.role='admin') then 'admin' when bool_or(target.role='teacher') then 'teacher' else 'board' end,up.active from public.user_profiles up join public.school_memberships target on target.user_id=up.user_id and target.active=true and target.role in ('teacher','admin','board') where exists(select 1 from public.school_memberships me where me.user_id=auth.uid() and me.school_id=target.school_id and me.active=true and me.role='admin') group by up.user_id,up.display_name,up.active order by up.active desc,up.display_name; $$;
create or replace function public.get_staff_admin_directory() returns table(user_id uuid,display_name text,role text,active boolean) language sql stable security definer set search_path='public' as $$ select * from public.admin_staff_directory(); $$;
create or replace function public.admin_staff_roles() returns table(user_id uuid,roles text[]) language sql stable security definer set search_path='public' as $$ select target.user_id,array_agg(distinct target.role order by target.role) from public.school_memberships target where target.active=true and exists(select 1 from public.school_memberships me where me.user_id=auth.uid() and me.school_id=target.school_id and me.active=true and me.role='admin') group by target.user_id; $$;
create or replace function public.admin_parent_links() returns table(parent_id uuid,student_id bigint) language sql stable security definer set search_path='public' as $$ select ps.parent_id,ps.student_id from public.parent_students ps join public.students s on s.id=ps.student_id join public.classes c on c.id=s.class_id where public.has_school_role(c.school_id,'admin'); $$;

create or replace function public.admin_link_parent(p_parent_id uuid,p_student_id bigint) returns void language plpgsql security definer set search_path='public' as $$ declare v_school bigint; begin select c.school_id into v_school from public.students s join public.classes c on c.id=s.class_id where s.id=p_student_id; if v_school is null or not public.has_school_role(v_school,'admin') then raise exception 'Admin access required for this school'; end if; if not exists(select 1 from public.school_memberships sm where sm.user_id=p_parent_id and sm.school_id=v_school and sm.role='parent' and sm.active=true) then raise exception 'Parent does not belong to this school'; end if; insert into public.parent_students(parent_id,student_id) values(p_parent_id,p_student_id) on conflict do nothing; end; $$;
create or replace function public.admin_unlink_parent(p_parent_id uuid,p_student_id bigint) returns void language plpgsql security definer set search_path='public' as $$ declare v_school bigint; begin select c.school_id into v_school from public.students s join public.classes c on c.id=s.class_id where s.id=p_student_id; if v_school is null or not public.has_school_role(v_school,'admin') then raise exception 'Admin access required for this school'; end if; delete from public.parent_students where parent_id=p_parent_id and student_id=p_student_id; end; $$;

create or replace function public.check_resource_booking_conflicts(p_starts_at timestamptz,p_ends_at timestamptz,p_room_id bigint default null,p_user_ids uuid[] default null,p_exclude_booking_id bigint default null)
returns table(booking_id bigint,title text,starts_at timestamptz,ends_at timestamptz,room_name text,conflicting_user_id uuid)
language sql stable security definer set search_path='public' as $$
select distinct rb.id,rb.title,rb.starts_at,rb.ends_at,sr.name,rbs.user_id from public.resource_bookings rb left join public.school_rooms sr on sr.id=rb.room_id left join public.resource_booking_staff rbs on rbs.booking_id=rb.id where public.is_school_staff(rb.school_id) and rb.starts_at<p_ends_at and rb.ends_at>p_starts_at and ((p_room_id is not null and rb.room_id=p_room_id) or (p_user_ids is not null and rbs.user_id=any(p_user_ids))) and (p_exclude_booking_id is null or rb.id<>p_exclude_booking_id);
$$;

revoke execute on function public.resolve_single_active_school(uuid,text[]) from anon,authenticated;
revoke execute on function public.set_calendar_meeting_school() from anon,authenticated;
revoke execute on function public.set_noticeboard_post_school() from anon,authenticated;
revoke execute on function public.set_staff_absence_school() from anon,authenticated;
revoke execute on function public.set_school_room_school() from anon,authenticated;
revoke execute on function public.set_resource_booking_school() from anon,authenticated;
