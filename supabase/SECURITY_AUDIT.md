# Klasseværelset · Supabase security baseline

Sidst opdateret: 6. september 2026.

Dette dokument beskriver den tekniske database-/Supabase-sikkerhedsbaseline. Den overordnede produktbaseline ligger i `SECURITY.md`, og den operative recovery-procedure ligger i `docs/backup-and-restore.md`.

## Aktuel posture

Seneste målte status:

- 74 public-tabeller.
- RLS aktiveret på alle 74 public-tabeller.
- 239 public RLS-policies.
- `school_memberships` er autoritativ kilde til skoleafgrænsede adgangsroller.
- 3 forskellige konti har aktive `admin`/`leader`-rettigheder.
- 1 verificeret TOTP-faktor findes aktuelt på privilegerede konti.
- 22 elevkoder står stadig `needs_rotation=true`.
- 0 elevkoder er endnu roteret til den aktuelle 12+ tegns standard.

Roller kommer ikke fra `user_metadata`. `admin` giver ikke implicit læreradgang, og `leader` giver ikke implicit systemadmin.

## Tenant- og rolleafgrænsning

Skole-/rolleautorisation håndhæves server-/database-side via medlemskab, relationer, klassekoblinger, RLS og snævre RPC'er. Centrale negative adgangstests er gennemført for lærer, personale, leder, admin, forælder og bestyrelse.

Eksempler på verificeret adfærd:

- lærer-only ser kun elever i egne tilknyttede klasser,
- `staff` udvider ikke elevsynlighed,
- forældre ser kun egne børn via `parent_students`,
- bestyrelsesrolle giver ikke intern personale-/adminadgang,
- leder kan bruge ledelsesområder men ikke admin-kataloget,
- kombinerede roller giver summen af de eksplicit tildelte rettigheder.

## Privileged MFA / AAL2

Admin- og ledelsesområder kræver TOTP-baseret MFA (`aal2`). Håndhævelsen findes i flere lag:

1. `app/AccessGuard.tsx` sender privilegerede `aal1`-sessioner til enrollment/challenge.
2. `/account/security` håndterer TOTP-enrollment.
3. `/mfa` håndterer challenge og opgradering til `aal2`.
4. service-role API-ruter til bruger-/rolle-/adgangsmutationer validerer bearer-token og kræver `aal2` før service role bruges.
5. højrisiko-RPC'er kræver `aal2` før mutation.
6. restriktive RLS-policies kræver `aal2` ved direkte writes til centrale admin-/ledelsestabeller.

Verificerede regressionstests:

- privilegeret RPC med `aal1` stoppes med `MFA required`,
- samme RPC med `aal2` passerer MFA-gaten og rammer den normale objekt-/rollevalidering,
- direkte admin-write med `aal1` gav 0 skrivbare klasser,
- samme no-op write med `aal2` passerede den eksisterende admin-policy.

Den gamle `admin_update_schedule_entry`-RPC er ikke længere executable for `authenticated`; v2-editoren er den kanoniske vej.

TOTP er tilgængeligt på projektets nuværende Free-plan. Leaked-password protection er fortsat slået fra og kræver plan-/Auth-konfigurationsafklaring før bred drift.

## Elevadgang

Elevadgang bruger et separat bootstrap/session-flow frem for almindelig Supabase Auth:

- elevkoden accepteres kun ved session-bootstrap,
- adgangskoder lagres kun som SHA-256-hash i `private.student_access_credentials`,
- nye koder skal være 12–32 tegn fra det godkendte entydige alfabet,
- sessions hemmelighed lagres kun hash'et,
- sessioner udløber og kan tilbagekaldes,
- kodeforsøg er rate-limited,
- rotation tilbagekalder eksisterende aktive elevsessioner.

Alle 22 eksisterende elevkoder er stadig gamle koder og skal roteres kontrolleret før bred pilot. Admin-UI viser status og understøtter rotation én elev ad gangen. Der masseroteres ikke uden en sikker udleveringsplan.

## Intentional anonymous SECURITY DEFINER RPCs

Elev-UI'et bruger ikke almindelig Supabase Auth. Derfor er de session-token-baserede elev-RPC'er fortsat intentionelt callable af `anon`. De må kun give adgang gennem en gyldig, begrænset elevsession.

Supabase Security Advisor markerer derfor disse som warnings. Det er en kendt arkitektonisk undtagelse, ikke i sig selv bevis på en læk. Nye anonyme SECURITY DEFINER-funktioner må ikke tilføjes uden særskilt sikkerhedsreview.

Trænings-/forsøgstabeller med RLS men ingen direkte policies er tilsvarende default-deny og tilgås via de snævre session-RPC'er. Advisorens `rls_enabled_no_policy`-INFO på disse tabeller er derfor forventet, så længe direkte table grants ikke genåbnes.

## SECURITY DEFINER-regel

Alle nye/ændrede privilegerede funktioner skal kontrolleres for:

1. eksplicit autentificering,
2. eksplicit skole-/rolle-/relation-check,
3. fast og helst tomt `search_path` med kvalificerede objekter,
4. least-privilege EXECUTE-grants,
5. ingen læk af rå følsomme kolonner, hvis en projektion er tilstrækkelig,
6. MFA/AAL2 på privilegerede mutationer,
7. audit-event, hvor handlingen er sikkerheds-/adgangsrelevant.

Advisoren markerer mange legitime authenticated SECURITY DEFINER-RPC'er alene på funktionsformen. Hver warning skal derfor klassificeres ud fra faktisk intern autorisation frem for at blive ignoreret eller mekanisk “gjort grøn”.

## Append-only auditspor

`private.security_audit_log` er append-only fra appens perspektiv. Admin har kun en snæver læse-RPC.

Første version logger:

- rolle-/adgangsændringer,
- aktivering/deaktivering,
- forælder↔barn kobling/frakobling,
- elevkode udstedelse/rotation,
- skemapublicering.

Audit-events må ikke indeholde adgangskoder, elevkoder, kode-hashes, beskedindhold eller følsomme noter. UPDATE/DELETE-afvisning og fravær af elevkode/hash i metadata er testet.

Planlagt før bred pilot: adgang/redigering/download af følsomme arkivdokumenter og relevante beskedhandlinger skal indgå i samme fælles auditmotor. Brugerne skal samtidig informeres om logningen og databehandlingen ved førstegangsbrug/versioneret policy-accept.

## Versionssikkert skema

Skemaet bruger skoleår + versionslag:

- draft redigeres,
- published/archived versioner er operationelle/historiske,
- publicering validerer konflikter, fagkoblinger, bemanding og forberedelseskontinuitet,
- publicering er atomisk,
- næste draft oprettes automatisk,
- forberedte fremtidige lektioner flyttes til sikker efterfølger eller blokerer publicering.

Version-aware readers bruges til lærer, klasse, forælder, booking og vikarflow. Direkte write-policies på kladdeskema kræver både korrekt ledelsesrolle og `aal2`.

## Backup / restore

Repoet har scripts og runbook til:

- database-dump,
- migrationshistorik,
- Storage-eksport,
- SHA-256-manifest,
- Storage format v2 med mapping af original bucket/object path,
- database restore-test med hard-stop mod produktion,
- Storage restore-test med hard-stop mod produktion og checksum-verifikation efter restore.

En rigtig end-to-end recovery drill er endnu ikke gennemført, fordi den kræver hemmelige forbindelsesdata og et separat disposable restore-target.

## Migration discipline

Alle schema-, function-, trigger-, grant- og RLS-ændringer skal:

1. anvendes som navngiven Supabase migration,
2. committed under `supabase/migrations/`,
3. have præcis samme versionsnummer som produktionshistorikken.

Historisk migration drift fra 3. september er ryddet op, og den manglende `track_grammar_attempt_progress`-migration er rekonstrueret fra produktionshistorikken.

Seneste sikkerhedsrelaterede migrationslag omfatter bl.a.:

- `20260906093523_append_only_security_audit_log`
- `20260906095405_require_mfa_for_privileged_mutations`
- `20260906095612_require_mfa_for_privileged_table_writes`

## Aktuelle pilotgates

Før bred pilot med rigtige følsomme data:

- [ ] roter de 22 legacy elevkoder med sikker udleveringsplan,
- [ ] få alle privilegerede konti på verificeret TOTP og gennemfør browser-login/challenge-test,
- [ ] gennemfør rigtig database + Storage backup,
- [ ] gennemfør database + Storage restore på separat target,
- [ ] fastlæg retention/slettepolitik pr. datatype,
- [ ] fastlæg førstegangs-information/vilkårsaccept og versionering,
- [ ] udvid audit til følsomt dokumentarkiv og senere beskedmodul,
- [ ] færdiggør DPIA-/databehandler-/fortegnelsesarbejde,
- [ ] afklar leaked-password protection før bred drift.

## Build/release guardrails

Vercel-build validerer bl.a. app-build, migrationsfilnavne/-duplikater og syntax på backup/restore-scripts. Interne statiske links kontrolleres også for at reducere døde brugerrejser.

Det erstatter ikke en fresh-database replay. En fuld clean replay/restore på et separat miljø er stadig den endelige dokumentation for, at repository + backup faktisk kan rekonstruere løsningen.
