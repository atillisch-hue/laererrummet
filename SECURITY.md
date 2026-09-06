# Klasseværelset · sikkerhedsbaseline

Sidst opdateret: 6. september 2026.

Dette dokument er den overordnede sikkerhedsbaseline for Klasseværelset. Den tekniske Supabase-status ligger i `supabase/SECURITY_AUDIT.md`, og den operative backup-/restore-procedure ligger i `docs/backup-and-restore.md`.

## Grundprincipper

1. **Privacy/security by design.** Sikkerhed, GDPR og adgangsbegrænsning bygges ind i datamodel og arbejdsflow fra starten.
2. **UI er ikke en sikkerhedsgrænse.** Autorisation håndhæves i server/database/RLS/RPC-lag.
3. **Least privilege.** En bruger får kun adgang via konkrete roller, skolemedlemskab, klasse-/barnrelation og arbejdsobjekt.
4. **Person ≠ rolle.** Samme person kan have flere roller; `school_memberships` er den autoritative skole-/rollekilde.
5. **Personalegruppe ≠ adgangsrolle.** Jobtype og systemrettigheder holdes adskilt.
6. **Tenant-isolation.** Skoleejede data er skoleafgrænsede; adgang må ikke baseres på klientmetadata alene.
7. **RLS + eksplicitte RPC-checks.** Følsomme tabeller har RLS; privilegerede SECURITY DEFINER-funktioner skal have fast `search_path`, eksplicit skole-/rollecheck og snævre EXECUTE-grants.
8. **Service role kun server-side.** Service-role-nøglen må aldrig eksponeres i browseren.
9. **Ingen hemmeligheder i audit/logs.** Adgangskoder, elevkoder, kode-hashes, beskedindhold og følsomme noter må ikke skrives i auditloggen.
10. **Recovery er en sikkerhedsfunktion.** Backup er først troværdig, når database og Storage kan verificeres og restores i et ikke-produktionsmiljø.

## Aktuel adgangsmodel

Adgangsroller:

- `teacher` · undervisning, egne klasser, opgaver og faglige værktøjer.
- `staff` · fælles personalearbejdsrum uden automatisk elev-/læreradgang.
- `leader` · skoleår, ressourcer, skema og ledelsesdrift.
- `admin` · personer, adgang, system-/grunddata samt ledelsesområder.
- `parent` · egne børn via eksplicit forælder↔barn-relation.
- `board` · bestyrelsens arbejdsrum.
- elever bruger et separat begrænset session-token-flow frem for almindelig Supabase Auth.

`admin` giver ikke implicit `teacher`, og `leader` giver ikke implicit systemadmin. En person, der skal kunne begge dele, skal have begge roller.

## MFA for privilegerede konti

Admin- og ledelsesområder kræver nu TOTP-baseret 2-trinsbekræftelse (`aal2`).

Håndhævelsen ligger i flere lag:

- `AccessGuard` sender privilegerede `aal1`-sessioner til MFA-opsætning/challenge.
- `/account/security` håndterer TOTP-enrollment.
- `/mfa` håndterer challenge og opgradering til `aal2`.
- service-role-ruter til brugeroprettelse/rolle-/adgangsændringer afviser bearer-tokens uden `aal2`.
- højrisiko database-RPC'er kræver `aal2` før mutationer.
- restriktive RLS-policies kræver `aal2` ved direkte writes til centrale admin-/ledelsestabeller.

TOTP-MFA er tilgængeligt på projektets nuværende Supabase Free-plan. Telefon-MFA bruges ikke.

Ved seneste kontrol havde 3 privilegerede konti endnu ingen verificeret TOTP-faktor. De bliver derfor guidet gennem enrollment næste gang de åbner Admin/Ledelse.

## Elevadgang

Elevlogin er et separat bootstrap/session-flow:

- selve elevkoden bruges kun til at starte en kortvarig elevsession,
- koder lagres kun som SHA-256-hash i `private.student_access_credentials`,
- sessiontokens er lange tilfældige værdier og lagres kun hash'et,
- sessioner udløber og kan tilbagekaldes,
- kodeforsøg er rate-limited,
- nye elevkoder er 12 tegn fra et menneskevenligt, tvetydighedsfrit alfabet,
- rotation af kode tilbagekalder eksisterende elevsessioner.

De 22 eksisterende elever har stadig ældre 6-tegnskoder og står derfor som `needs_rotation=true`. Admin → Klasser & elever viser en tydelig sikkerhedsstatus og understøtter sikker rotation én elev ad gangen. Koder masseroteres ikke uden en udleveringsplan.

## Auditspor

Der findes et append-only sikkerhedsspor i `private.security_audit_log`.

Det registrerer i første version:

- rolleændringer,
- aktivering/deaktivering af skoleadgang,
- forælder↔barn-kobling/frakobling,
- elevkode-udstedelse/rotation,
- skemapublicering.

Auditloggen kan ikke UPDATE/DELETE'es gennem appen. Administratorer har kun en snæver læse-RPC og en brugerflade under **Admin → Sikkerhed & historik**.

## Skema og skoleår

Skemapublicering er versionsbaseret og atomisk:

- kun kladder kan redigeres,
- publicerede skemaversioner er immutable,
- konflikt-/bemandings-/fagvalidering sker før publicering,
- historiske versioner bevares,
- næste kladde oprettes automatisk,
- forberedte fremtidige lektioner migreres sikkert eller blokerer publicering, hvis der ikke findes en sikker efterfølger.

Skemalæsere for lærer, forælder, klasse, vikar og booking bruger versions-/dato-bevidste projections frem for rå fremtidige kladder.

## Backup og restore

Repoet indeholder:

- databasebackup via Supabase CLI,
- migrationshistorik-backup,
- Storage-eksport,
- backupmanifest med SHA-256,
- format v2 mapping fra original bucket/object-path til lokal backupfil,
- database restore-test med hard-stop mod produktionsprojektet,
- Storage restore-test med hard-stop mod produktion og checksum-verifikation efter re-upload.

En rigtig recovery-drill er **ikke** gennemført endnu. Den kræver en komplet backup med hemmelige forbindelsesdata og et separat disposable restore-target. Se `docs/backup-and-restore.md`.

## Kendte åbne pilotgates

Før bred pilot med rigtige følsomme skoledata skal følgende være lukket eller eksplicit accepteret:

- [ ] de 22 gamle elevkoder roteres og nye koder udleveres sikkert,
- [ ] de 3 privilegerede konti tilmelder TOTP-MFA og MFA-flowet afprøves i browseren,
- [ ] mindst én komplet database + Storage backup tages og verificeres,
- [ ] database + Storage restore gennemføres på et separat ikke-produktions-target,
- [ ] leaked-password protection aktiveres ved opgradering til Supabase Pro eller registreres som accepteret midlertidig pilotrisiko; funktionen er ikke tilgængelig på Free,
- [ ] retention-/slettepolitik fastlægges for fravær, mødenoter, opgaver, elevprogression, auditlog og dokumenter,
- [ ] procedure for indsigt, rettelse og sletning dokumenteres,
- [ ] databehandler-/underleverandøroversigt og aftalegrundlag færdiggøres,
- [ ] DPIA-/risikovurdering færdiggøres før AI får adgang til personhenførbare elevdata,
- [ ] mindst én empirisk cross-school isolationstest gennemføres i et rigtigt separat tenant/testmiljø,
- [ ] fresh-database replay af hele migrationshistorikken bevises i et isoleret miljø.

## SECURITY DEFINER-regel

Supabase Advisor markerer bevidst flere `SECURITY DEFINER`-funktioner. En warning er ikke i sig selv bevis på en læk, men hver funktion skal klassificeres.

Ved nye/ændrede funktioner kontrolleres:

1. fast `search_path`,
2. eksplicit autentificering,
3. eksplicit rolle-/skole-/relationstjek,
4. mindst mulige EXECUTE-grants,
5. ingen rå følsomme data når en sikker projection kan bruges,
6. MFA-krav hvis funktionen udfører en privilegeret admin-/ledelsesmutation.

De anonyme elevsession-RPC'er er en bevidst arkitektur: de accepterer kun et begrænset session-token og giver ikke anonym direkte tabeladgang.

## Migrationsregel

Alle schema-, trigger-, grant-, RLS- og funktionsændringer skal:

1. anvendes som navngiven Supabase migration,
2. gemmes under `supabase/migrations/` med **præcis samme versionsnummer** som Supabase registrerer,
3. passere migrationsvalidatoren og produktionsbuildet.

Ingen sikkerhedsændring må kun eksistere i Supabase Dashboard.
