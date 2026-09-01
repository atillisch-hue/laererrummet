# Klassevaerelset Supabase security baseline

Last refreshed: 2026-09-01

This file documents the current security/database baseline after the first hardening passes. It is not a substitute for migrations or automated tests. Re-run `supabase/security-audit.sql` after security-sensitive database changes.

## Current posture

- 37 public tables.
- RLS enabled on all 37 public tables.
- 100 public RLS policies.
- 0 policies with direct per-row `auth.uid()` calls after the RLS performance pass.
- 0 authorization functions detected using `user_metadata` for roles/access.
- 0 foreign keys without a supporting leading index.
- `school_memberships` is the authoritative source for school-scoped roles.
- Root operational objects now carry `school_id`: meetings, noticeboard posts, staff absence, rooms and resource bookings.
- Guardians cannot read raw meeting rows containing internal notes; guardian meeting access goes through a safe RPC projection.
- Student access is now session-based: the short code is accepted only by the session bootstrap RPC and is not reused for normal data/write calls.
- Student session tokens are 256-bit random values; only SHA-256 hashes are stored server-side. Sessions expire after 12 hours and can be revoked on logout.
- Failed student-code login attempts are limited per IP to 30 attempts per 5 minutes.
- Student access codes are case-insensitively unique in the database.
- New/regenerated student codes are generated with browser Web Crypto as 8 characters from a 32-symbol unambiguous alphabet (40 bits). Existing six-character codes remain valid until deliberately rotated.

## Intentional anonymous SECURITY DEFINER RPCs

The student UI does not require a full Supabase Auth user. These functions therefore remain callable by `anon`, but each normal student operation requires a valid limited student-session token:

- `student_start_session(text)` — the only RPC that accepts the short access code; rate-limited.
- `student_session_data(text)`
- `student_session_feedback(text)`
- `student_session_grammar_assignments(text)`
- `get_student_training_progress_session(text)`
- `save_student_draft_session(text,bigint,jsonb)`
- `save_student_grammar_attempt_session(text,bigint,jsonb,integer,integer)`
- `save_student_training_attempt_session(text,text,text,text,text,jsonb,integer,integer)`
- `student_end_session(text)`

The former short-code data/write RPCs still exist temporarily for migration history/rollback compatibility, but EXECUTE has been revoked from both `anon` and `authenticated`. `supabase/security-audit.sql` treats any renewed execute grant on those functions as a regression.

No other SECURITY DEFINER RPC should become anonymously executable without an explicit security review and documentation update here.

## Known accepted warning

`student_training_progress` has RLS enabled and no direct RLS policy. Direct table access is therefore default-deny. Student progress is accessed only through the session-token SECURITY DEFINER RPCs. This is intentional unless the data model changes.

Supabase's advisor also flags the intentional anonymous student session RPCs because they are SECURITY DEFINER. Their anonymous executability is required by the current student UX; the security boundary is the long random session token plus narrow function logic, not anonymous table access.

## Remaining P1 security work

### Student code lifecycle

The largest student-authentication weakness has been removed: the short code is no longer a reusable bearer secret for every RPC. Remaining work is lifecycle hygiene:

1. rotate existing six-character codes gradually to the new eight-character format,
2. consider storing only a hash of the short bootstrap code rather than plaintext once administration/printing/reset workflows are designed,
3. consider session/device management for admins if pilot feedback shows a need.

Do not mass-rotate existing codes without an explicit rollout plan, because it would immediately invalidate codes already handed to students.

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

## Build/release guardrail

GitHub Actions now runs a production `next build` on pushes to `main` and pull requests. The student-session frontend has passed this build and the corresponding Vercel deployment status is green.

The repository still needs a committed lockfile and exact dependency pinning so CI and Vercel use a reproducible dependency graph.

## Migration rule going forward

All schema, function, trigger, grant and RLS changes must be applied as named Supabase migrations and committed under `supabase/migrations/` with the exact migration version recorded by Supabase.

Do not make an untracked production schema change and leave it only in the Supabase dashboard.

## Fresh-database replay status

Not yet proven.

The project existed before the current Supabase migration history was established, and older schema work is spread across legacy SQL files. A clean development-branch replay is the final proof that the repository can recreate the database. Creating a Supabase development branch can incur cost, so this should only be done after explicit cost confirmation.
