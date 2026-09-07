# Klasseværelset · Supabase security baseline

Sidst opdateret: 7. september 2026.

Dette dokument beskriver den tekniske database-/Supabase-sikkerhedsbaseline. Den overordnede produktbaseline ligger i `SECURITY.md`, recovery-proceduren i `docs/backup-and-restore.md`, og retentiondesignet i `docs/data-retention-and-deletion.md`.

## Aktuel posture

Seneste målte status:

- 76 public-tabeller.
- RLS aktiveret på alle 76 public-tabeller.
- 243 public RLS-policies.
- `school_memberships` er autoritativ kilde til skoleafgrænsede adgangsroller.
- 3 forskellige konti har aktive `admin`/`leader`-rettigheder.
- 1 verificeret TOTP-faktor findes aktuelt på privilegerede konti.
- 22 elevkoder står stadig `needs_rotation=true`.
- 0 policy-versioner er publiceret; policy-acknowledgement-fundamentet blokerer derfor ingen brugere.

Roller kommer ikke fra `user_metadata`. `admin` giver ikke implicit læreradgang, og `leader` giver ikke implicit systemadmin.

## Tenant- og rolleafgrænsning

Skole-/rolleautorisation håndhæves server-/database-side via medlemskab, relationer, klassekoblinger, RLS og snævre RPC'er. Centrale negative adgangstests er gennemført for lærer, personale, leder, admin, forælder og bestyrelse.

Verificeret adfærd omfatter:

- lærer-only ser kun elever i egne tilknyttede klasser,
- `staff` udvider ikke elevsynlighed,
- forældre ser kun egne børn via `parent_students`,
- bestyrelsesrolle giver ikke intern personale-/adminadgang,
- leder kan bruge ledelsesområder men ikke admin-kataloget,
- kombinerede roller giver summen af eksplicit tildelte rettigheder.

## Privileged MFA / AAL2

Admin- og ledelsesområder kræver TOTP-baseret MFA (`aal2`). Håndhævelsen findes i flere lag:

1. `app/AccessGuard.tsx` sender privilegerede `aal1`-sessioner til enrollment/challenge.
2. `/account/security` håndterer TOTP-enrollment.
3. `/mfa` håndterer challenge og opgradering til `aal2`.
4. service-role API-ruter til bruger-/rolle-/adgangsmutationer kræver `aal2` før service role bruges.
5. højrisiko-RPC'er kræver `aal2` før mutation.
6. restriktive RLS-policies kræver `aal2` ved direkte writes til centrale admin-/ledelsestabeller.

Regressionstests:

- privilegeret RPC med `aal1` stoppes med `MFA required`,
- samme RPC med `aal2` passerer MFA-gaten og rammer normal objekt-/rollevalidering,
- direkte admin-write med `aal1` gav 0 skrivbare klasser,
- samme no-op write med `aal2` passerede den eksisterende admin-policy.

Den gamle `admin_update_schedule_entry`-RPC er ikke længere executable for `authenticated`; v2-editoren er den kanoniske vej.

TOTP er tilgængeligt på projektets nuværende Supabase Free-plan. En fuld browser-login/challenge E2E-test er endnu ikke dokumenteret, fordi den tilgængelige connector ikke har givet en pålidelig app-URL + eksisterende session. Backend/database-håndhævelsen og builds er testet.

Leaked-password protection er fortsat slået fra og kræver plan-/Auth-konfigurationsafklaring før bred drift.

## Elevadgang

Elevadgang bruger et separat bootstrap/session-flow frem for almindelig Supabase Auth:

- elevkoden accepteres kun ved session-bootstrap,
- adgangskoder lagres kun som SHA-256-hash i `private.student_access_credentials`,
- nye koder skal være 12–32 tegn fra det godkendte entydige alfabet,
- session-hemmeligheder lagres kun hash'et,
- sessioner udløber og kan tilbagekaldes,
- kodeforsøg er rate-limited,
- rotation tilbagekalder eksisterende aktive elevsessioner.

Alle 22 eksisterende elevkoder er stadig legacy-koder og skal roteres kontrolleret før bred pilot. Admin-UI viser status og understøtter rotation én elev ad gangen. Der masseroteres ikke uden en sikker udleveringsplan.

## Intentional anonymous SECURITY DEFINER RPCs

Elev-UI'et bruger ikke almindelig Supabase Auth. Derfor er de session-token-baserede elev-RPC'er fortsat intentionelt callable af `anon`. De må kun give adgang gennem en gyldig, begrænset elevsession.

Supabase Security Advisor markerer derfor disse som warnings. Det er en kendt arkitektonisk undtagelse, ikke i sig selv bevis på en læk. Nye anonyme SECURITY DEFINER-funktioner må ikke tilføjes uden særskilt sikkerhedsreview.

Trænings-/forsøgstabeller med RLS men ingen direkte policies er tilsvarende default-deny og tilgås gennem snævre session-RPC'er.

## SECURITY DEFINER-regel

Alle nye/ændrede privilegerede funktioner kontrolleres for:

1. eksplicit autentificering,
2. eksplicit skole-/rolle-/relation-check,
3. fast og helst tomt `search_path` med kvalificerede objekter,
4. least-privilege EXECUTE-grants,
5. ingen læk af rå følsomme kolonner, hvis en projektion er tilstrækkelig,
6. MFA/AAL2 på privilegerede mutationer,
7. audit-event hvor handlingen er sikkerheds-/adgangsrelevant.

Advisoren markerer mange legitime authenticated SECURITY DEFINER-RPC'er alene på funktionsformen. Hver warning klassificeres derfor ud fra faktisk intern autorisation frem for at blive mekanisk gjort grøn.

## Append-only auditspor

`private.security_audit_log` er append-only fra appens perspektiv. Admin har kun en snæver læse-RPC og UI'et **Admin → Sikkerhed & historik**.

Auditmotoren logger bl.a.:

- rolle-/adgangsændringer,
- aktivering/deaktivering,
- forælder↔barn kobling/frakobling,
- elevkode udstedelse/rotation,
- skemapublicering,
- ændring af elevens `school_left_at`-livscyklusanker,
- `school_files` upload, metadataændring, arkivering/genåbning og sletning.

Audit-events må ikke indeholde adgangskoder, elevkoder, kode-hashes, beskedindhold eller følsomme noter. UPDATE/DELETE-afvisning og fravær af elevkode/hash i metadata er testet.

### Dokumentadgang

Databasefundamentet til dokumentadgang findes: `record_school_file_access(file_id, 'open'|'download')` validerer brugerens adgang og skriver et `school_file_accessed`-event.

**UI-wiring er endnu ikke komplet.** Bestyrelsens aktuelle `app/board/archive/page.tsx` opretter signed URL direkte ved åbning og kalder ikke access-RPC'en. Derfor må vi ikke endnu påstå, at alle dokumentåbninger/downloads logges. Dette færdiggøres som den særskilte archive/privacy-gate sammen med brugerinformation om logning. Beskedmodulet skal senere bruge samme fælles auditmotor.

## Retention / opbevaringsbegrænsning

Retentionlaget er bevidst read-only. Der findes ingen automatisk sletning og ingen hardkodede juridiske frister.

### Inventar

`admin_retention_inventory(bigint)` giver en MFA- og adminbeskyttet oversigt over:

- Elevgrunddata
- Elevfravær
- Faglige elevforsøg
- Elevplaner
- Møder
- Dokumentarkiv
- Personalefravær
- Arbejdstid
- Sikkerhedsaudit
- Elevsessioner
- Elev-loginforsøg

RPC'en returnerer kun kategori, antal, ældste/nyeste tidspunkt og teknisk retention-anchor — aldrig navne, noter, dokumenttitler eller andet personindhold.

### Livscyklusankre

Følgende ankertyper findes nu:

- elevgrunddata: `students.school_left_at` — kun dato for at eleven har forladt skolen; endnu ikke et komplet offboarding-flow,
- elevfravær: `absence_date`,
- faglige elevforsøg: `completed_at`,
- elevplaner: `student_action_plans.closed_at`,
- møder: `ends_at`,
- dokumentarkiv: `school_files.archived_at`,
- personalefravær: `absence_date`,
- arbejdstid: `work_date`,
- audit: `created_at`,
- elevsessioner: `expires_at` / `revoked_at`,
- loginforsøg: `attempted_at` med en kendt begrænsning i skoleattribution efter kode-rotation.

`school_left_at` eksponeres endnu ikke som en halv “udskriv elev”-funktion. Et fremtidigt offboarding-flow skal atomisk håndtere elevsessioner/login, relevante relationer/adgang og arkivering/retention før brugeren kan udføre handlingen.

### Dry-run

`admin_retention_preview(bigint,text,timestamptz)` er en read-only MFA/admin-RPC. Admin kan vælge en kategori og hypotetisk skæringsdato og få:

- kandidatantal,
- ældste kandidatdato,
- nyeste kandidatdato,
- forklarende note.

Den returnerer ingen personidentitet eller indhold og indeholder ingen DELETE/UPDATE-logik.

Verificeret:

- `aal1` bliver afvist,
- `aal2` + aktiv adminrolle kan simulere,
- en test på Elevfravær fandt 4 kandidater før en fremtidig skæringsdato uden at ændre data,
- Elevgrunddata giver 0 kandidater, når ingen elever har `school_left_at`.

Admin-UI viser **Dataopbevaring** og et tydeligt **DRY-RUN · INGEN DATA ER SLETTET**-panel.

Der må ikke bygges automatisk sletning før skolens konkrete perioder og begrundelser er fastlagt. Se `docs/data-retention-and-deletion.md`.

## Versioneret førstegangs-information

Datamodellen indeholder:

- `school_policy_versions`
- `user_policy_acknowledgements`
- `my_required_policy_acknowledgements()`
- `acknowledge_policy(bigint)`

Policy-typerne er adskilt i brugsvilkår, privatlivsinformation og sikkerheds-/logningsinformation. En acknowledgement gemmer bruger, policy-version og tidspunkt; der gemmes ikke IP eller anden unødvendig tracking.

Der er aktuelt 0 publicerede policy-versioner, og `AccessGuard` håndhæver endnu ikke acknowledgement. `/account/policies` er bygget som fremtidig visnings-/bekræftelsesside, men kobles først på som gate, når de reelle tekster er godkendt. Dette er dokumentation for information/vilkår — ikke automatisk GDPR-samtykke.

Elevflowet skal have en separat børnevenlig informationsmodel, fordi elever bruger session-token-login frem for almindelig Auth.

## Versionssikkert skema

Skemaet bruger skoleår + versionslag:

- draft redigeres,
- published/archived versioner er operationelle/historiske,
- publicering validerer konflikter, fagkoblinger, bemanding og forberedelseskontinuitet,
- publicering er atomisk,
- næste draft oprettes automatisk,
- forberedte fremtidige lektioner flyttes til sikker efterfølger eller blokerer publicering.

Version-aware readers bruges til lærer, klasse, forælder, booking og vikarflow. Direkte write-policies på kladdeskema kræver korrekt ledelsesrolle + `aal2`.

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

## Build- og migrationsdisciplin

Alle schema-, function-, trigger-, grant- og RLS-ændringer skal anvendes som navngiven Supabase migration og committed under `supabase/migrations/` med præcis samme versionsnummer som produktionshistorikken.

Seneste governance-/retentionlag omfatter bl.a.:

- `20260906093523_append_only_security_audit_log`
- `20260906095405_require_mfa_for_privileged_mutations`
- `20260906095612_require_mfa_for_privileged_table_writes`
- `20260906152726_admin_retention_inventory`
- `20260906153039_retention_inventory_readiness`
- `20260906153305_policy_acknowledgement_foundation`
- `20260906153732_track_school_file_archive_lifecycle`
- `20260906153927_track_action_plan_lifecycle`
- `20260906154037_use_lifecycle_anchors_in_retention_inventory`
- `20260906154345_audit_school_file_access_and_mutations`
- `20260907080828_admin_retention_preview`
- `20260907081347_student_school_lifecycle_anchor`
- `20260907081417_fix_student_lifecycle_retention_inventory`

Den oprindelige `20260907081347`-migration indeholdt en fejl i et read-only retention-inventar-CTE. Fejlen blev fanget straks ved regressionstest og rettet i en særskilt `20260907081417`-migration. Begge beholdes, så replay-historikken matcher produktionen ærligt.

`package-lock.json` er committed, og top-level dependencies er eksakt pinnet. Vercel-build validerer app-build, migrationsfilnavne/-duplikater, backup/restore-script-syntax og interne statiske links.

## Aktuelle pilotgates

Før bred pilot med rigtige følsomme data:

- [ ] roter de 22 legacy elevkoder med sikker udleveringsplan,
- [ ] få alle privilegerede konti på verificeret TOTP og gennemfør browser-login/challenge-test,
- [ ] gennemfør rigtig database + Storage backup,
- [ ] gennemfør database + Storage restore på separat target,
- [ ] fastlæg retention/slettepolitik pr. datatype,
- [ ] design det komplette elev-offboarding-flow før `school_left_at` bliver en brugerhandling,
- [ ] godkend og publicér førstegangs-information/vilkår før acknowledgement kobles ind som gate,
- [ ] wire `record_school_file_access` ind i alle reelle åbne/download-veje og informer brugerne om logningen,
- [ ] log relevante beskedhandlinger, når beskedmodulet bygges,
- [ ] færdiggør DPIA-/databehandler-/fortegnelsesarbejde,
- [ ] afklar leaked-password protection før bred drift,
- [ ] gennemfør fresh-database replay / restore på separat miljø.

## Hvad der ikke må påstås endnu

- At alle dokumentåbninger/downloads logges: **nej, DB-motoren findes, men UI-wiring mangler**.
- At retentionfrister er besluttet: **nej**.
- At automatisk sletning findes: **nej**.
- At elev-offboarding er bygget: **nej, kun retention-ankeret findes**.
- At MFA-browserflowet er E2E-testet: **nej; database/API/build er testet**.
- At recovery er bevist: **nej; værktøjerne findes, men restore-drill mangler**.
