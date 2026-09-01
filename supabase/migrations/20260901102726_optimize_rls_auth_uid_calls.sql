-- Wrap direct auth.uid() calls in SELECT so PostgreSQL can initialize them once per statement.
do $$
declare
  r record;
  new_qual text;
  new_check text;
begin
  for r in
    select schemaname,tablename,policyname,qual,with_check
    from pg_policies
    where schemaname='public'
      and (coalesce(qual,'') ~* '(?<!SELECT )auth\.uid\(\)' or coalesce(with_check,'') ~* '(?<!SELECT )auth\.uid\(\)')
  loop
    new_qual := case when r.qual is null then null else regexp_replace(r.qual,'(?<!SELECT )auth\.uid\(\)','(select auth.uid())','gi') end;
    new_check := case when r.with_check is null then null else regexp_replace(r.with_check,'(?<!SELECT )auth\.uid\(\)','(select auth.uid())','gi') end;

    if new_qual is not null and new_check is not null then
      execute format('alter policy %I on %I.%I using (%s) with check (%s)',r.policyname,r.schemaname,r.tablename,new_qual,new_check);
    elsif new_qual is not null then
      execute format('alter policy %I on %I.%I using (%s)',r.policyname,r.schemaname,r.tablename,new_qual);
    elsif new_check is not null then
      execute format('alter policy %I on %I.%I with check (%s)',r.policyname,r.schemaname,r.tablename,new_check);
    end if;
  end loop;
end $$;

-- Remove an exact duplicate legacy policy.
drop policy if exists "teachers read own substitute assignments" on public.substitute_assignments;
