drop policy if exists board_inserts_board_files on public.school_files;
create policy board_inserts_board_files on public.school_files
for insert to authenticated
with check(
  area='board'
  and created_by=(select auth.uid())
  and public.has_school_role(school_id,'board')
);
