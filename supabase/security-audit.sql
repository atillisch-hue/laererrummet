-- Klassevaerelset: repeatable non-destructive database security audit.
-- Run after security-sensitive schema/RLS/function changes.

-- 1. High-level security posture.
select jsonb_build_object(
  'public_tables',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
  'rls_enabled_tables',(select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity),
  'policies',(select count(*) from pg_policies where schemaname='public'),
  'functions',(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'),
  'security_definer_functions',(select count(*) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f' and p.prosecdef),
  'anon_executable_security_definers',(
    select coalesce(jsonb_agg(p.oid::regprocedure::text order by p.oid::regprocedure::text),'[]'::jsonb)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.prokind='f' and p.prosecdef and has_function_privilege('anon',p.oid,'EXECUTE')
  ),
  'tables_without_rls',(
    select coalesce(jsonb_agg(c.relname order by c.relname),'[]'::jsonb)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity
  ),
  'tables_rls_no_policy',(
    select coalesce(jsonb_agg(t.tablename order by t.tablename),'[]'::jsonb)
    from (
      select c.relname tablename
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relrowsecurity
        and not exists(select 1 from pg_policies p where p.schemaname='public' and p.tablename=c.relname)
    ) t
  ),
  'direct_auth_uid_policies',(
    select count(*) from pg_policies
    where schemaname='public'
      and (coalesce(qual,'') ~* '(?<!SELECT )auth\.uid\(\)' or coalesce(with_check,'') ~* '(?<!SELECT )auth\.uid\(\)')
  )
) as security_posture;

-- 2. Functions/policies that reference user_metadata together with authorization concepts.
-- Expected result: no rows.
select p.oid::regprocedure::text as function_name
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind='f'
  and pg_get_functiondef(p.oid) ilike '%user_metadata%'
  and pg_get_functiondef(p.oid) ~* '(role|admin|permission|access)'
order by 1;

-- 3. Anonymous SECURITY DEFINER surface.
-- Production target: only explicitly documented student-code/session bootstrap RPCs.
select p.oid::regprocedure::text as function_name
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.prokind='f' and p.prosecdef
  and has_function_privilege('anon',p.oid,'EXECUTE')
order by 1;

-- 4. Foreign keys without a supporting leading index.
-- Expected result: 0 rows.
with fk as (
  select con.oid,con.conrelid,con.conname,con.conkey,n.nspname as schema_name,c.relname as table_name,
         array_agg(a.attname order by u.ord) as columns
  from pg_constraint con
  join pg_class c on c.oid=con.conrelid
  join pg_namespace n on n.oid=c.relnamespace
  join unnest(con.conkey) with ordinality u(attnum,ord) on true
  join pg_attribute a on a.attrelid=con.conrelid and a.attnum=u.attnum
  where con.contype='f' and n.nspname='public'
  group by con.oid,con.conrelid,con.conname,con.conkey,n.nspname,c.relname
)
select schema_name,table_name,conname,columns
from fk
where not exists (
  select 1 from pg_index i
  where i.indrelid=fk.conrelid and i.indisvalid and i.indisready
    and (i.indkey::smallint[])[0:cardinality(fk.conkey)-1]=fk.conkey
)
order by table_name,conname;

-- 5. Root objects that must always carry a school id.
select 'calendar_meetings' as table_name,count(*) filter(where school_id is null) as missing_school from public.calendar_meetings
union all select 'noticeboard_posts',count(*) filter(where school_id is null) from public.noticeboard_posts
union all select 'staff_absence',count(*) filter(where school_id is null) from public.staff_absence
union all select 'school_rooms',count(*) filter(where school_id is null) from public.school_rooms
union all select 'resource_bookings',count(*) filter(where school_id is null) from public.resource_bookings;
