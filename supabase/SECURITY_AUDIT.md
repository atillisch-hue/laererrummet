# Klassevaerelset Supabase security baseline

Last refreshed: 2026-09-01

This file documents the current security/database baseline after the first hardening passes. It is not a substitute for migrations or automated tests. Re-run `supabase/security-audit.sql` after security-sensitive database changes.

## Current posture

- 37 public tables.
- RLS enabled on all 37 public tables.
- 88 public RLS policies.
- 0 policies with direct per-row `auth.uid()` calls after the RLS performance pass.
- 0 authorization functions detected using `user_metadata` for roles/access.
- 0 foreign keys without a supporting leading index.
- `school_memberships` is the authoritative source for school-scoped roles.
- Root operational objects now carry `school_id`: meetings, noticeboard posts, staff absence, rooms and resource bookings.
- Guardians cannot read raw meeting rows containing internal notes; guardian meeting access goes through a safe RPC projection.

## Intentional anonymous SECURITY DEFINER RPCs

These are currently public because the student experience still uses a short access code rather than a normal authenticated Supabase session:

- `student_login(text)`
- `student_data(text)`
- `student_feedback(text)`
- `student_grammar_assignments(text)`
- `get_student_training_progress(text)`
- `save_student_grammar_attempt(text,bigint,jsonb,integer,integer)`
- `save_student_training_attempt(text,text,text,text,text,jsonb,integer,integer)`

No other SECURITY DEFINER RPC should become anonymously executable without an explicit security review and documentation update here.

## Known accepted warning

`student_training_progress` has RLS enabled and no direct RLS policy. Direct table access is therefore default-deny. The current student-code functions access it through controlled SECURITY DEFINER RPCs. Revisit this when the student authentication/session model changes.

## Remaining P1 security work

### Student authentication/session model

Current student access codes are short codes and are used directly by anonymous RPCs. Before production with real student data, replace this with a limited authenticated student session/token model (or normal Supabase Auth) with rate limiting / brute-force resistance. Preserve the simple student UX while removing the access code as a reusable bearer secret.

### Auth account hardening

Supabase currently reports leaked-password protection as disabled. Enable it before real production use. Consider MFA for privileged administrator/leader accounts as the platform matures.

### SECURITY DEFINER review

Many authenticated app RPCs remain SECURITY DEFINER. They are now school/role scoped, but each new/changed function should be reviewed for:

1. fixed `search_path`,
2. explicit caller/role/school checks,
3. least-privilege EXECUTE grants,
4. no exposure of raw sensitive rows when a safe projection is appropriate.

## Performance/maintainability backlog

Supabase still reports multiple permissive RLS policies on several older tables. This is primarily a performance/maintainability issue rather than a known active security leak. Consolidate these carefully rather than changing access semantics merely to make the advisor green.

New FK indexes may temporarily appear as unused because the alpha database is small. Do not remove them solely because of the unused-index advisor until realistic workloads exist.

## Migration rule going forward

All schema, function, trigger, grant and RLS changes must be applied as named Supabase migrations and committed under `supabase/migrations/` with the exact migration version recorded by Supabase.

Do not make an untracked production schema change and leave it only in the Supabase dashboard.

## Fresh-database replay status

Not yet proven.

The project existed before the current Supabase migration history was established, and older schema work is spread across legacy SQL files. A clean development-branch replay is the final proof that the repository can recreate the database. Creating a Supabase development branch can incur cost, so this should only be done after explicit cost confirmation.
