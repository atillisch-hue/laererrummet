drop policy if exists "author or admin updates school noticeboard posts" on public.noticeboard_posts;
create policy "author or admin updates school noticeboard posts"
on public.noticeboard_posts
for update
to authenticated
using (
  author_id = (select auth.uid())
  or has_school_role(school_id,'admin')
)
with check (
  is_school_member(school_id)
  and (
    author_id = (select auth.uid())
    or has_school_role(school_id,'admin')
  )
);

drop policy if exists "staff update permitted class handover" on public.class_handover;
create policy "staff update permitted class handover"
on public.class_handover
for update
to authenticated
using (
  author_id = (select auth.uid())
  or exists (
    select 1
    from public.classes c
    join public.school_memberships sm on sm.school_id=c.school_id
    where c.id=class_handover.class_id
      and sm.user_id=(select auth.uid())
      and sm.role='admin'
      and sm.active=true
  )
)
with check (
  (
    author_id = (select auth.uid())
    and exists (
      select 1
      from public.classes c
      join public.teacher_classes tc on tc.class_id=c.id
      join public.school_memberships sm
        on sm.user_id=tc.teacher_id
       and sm.school_id=c.school_id
       and sm.role='teacher'
       and sm.active=true
      where c.id=class_handover.class_id
        and tc.teacher_id=(select auth.uid())
    )
  )
  or exists (
    select 1
    from public.classes c
    join public.school_memberships sm on sm.school_id=c.school_id
    where c.id=class_handover.class_id
      and sm.user_id=(select auth.uid())
      and sm.role='admin'
      and sm.active=true
  )
);

drop policy if exists "meeting editors delete actions" on public.meeting_actions;
create policy "meeting editors delete actions"
on public.meeting_actions
for delete
to authenticated
using (can_edit_meeting(meeting_id));

drop policy if exists "meeting editors update decisions" on public.meeting_decisions;
create policy "meeting editors update decisions"
on public.meeting_decisions
for update
to authenticated
using (can_edit_meeting(meeting_id))
with check (can_edit_meeting(meeting_id));

drop policy if exists "meeting editors delete decisions" on public.meeting_decisions;
create policy "meeting editors delete decisions"
on public.meeting_decisions
for delete
to authenticated
using (can_edit_meeting(meeting_id));
