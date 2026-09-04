drop policy if exists noticeboard_reads_noticeboard_files on public.school_files;
create policy noticeboard_reads_noticeboard_files
on public.school_files
for select
to authenticated
using (
  area='noticeboard'
  and exists (
    select 1
    from public.noticeboard_posts np
    where np.id=school_files.noticeboard_post_id
      and np.school_id=school_files.school_id
      and public.is_school_member(np.school_id)
      and (
        np.author_id=(select auth.uid())
        or public.has_school_role(np.school_id,'admin')
        or exists (
          select 1
          from public.school_memberships sm
          where sm.user_id=(select auth.uid())
            and sm.school_id=np.school_id
            and sm.active=true
            and sm.role=any(np.audiences)
        )
      )
  )
);

drop policy if exists noticeboard_reads_noticeboard_storage on storage.objects;
create policy noticeboard_reads_noticeboard_storage
on storage.objects
for select
to authenticated
using (
  bucket_id='school-files'
  and exists (
    select 1
    from public.school_files sf
    join public.noticeboard_posts np
      on np.id=sf.noticeboard_post_id
     and np.school_id=sf.school_id
    where sf.object_path=objects.name
      and sf.area='noticeboard'
      and public.is_school_member(np.school_id)
      and (
        np.author_id=(select auth.uid())
        or public.has_school_role(np.school_id,'admin')
        or exists (
          select 1
          from public.school_memberships sm
          where sm.user_id=(select auth.uid())
            and sm.school_id=np.school_id
            and sm.active=true
            and sm.role=any(np.audiences)
        )
      )
  )
);
