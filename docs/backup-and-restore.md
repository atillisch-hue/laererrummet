# Klasseværelset · backup og restore

Denne procedure er et driftskrav, ikke kun udviklerdokumentation. Klasseværelset kan behandle oplysninger om børn og skolepersonale, så backupfiler skal behandles som følsomme skoledata.

## Nuværende situation

- Supabase-projekt: `jxmxiaiagknlvfxkluzu` (`Klasseværelset`).
- Plan pr. 6. september 2026: **Free**.
- Supabase dokumenterer automatiske daglige platform-backups for Pro, Team og Enterprise. På Free skal vi derfor ikke basere recovery-planen på platformens daglige backups.
- Databaseskemaet er versionsstyret i `supabase/migrations` og valideres ved hver build.
- Backupscriptet eksporterer database + migrationshistorik og kan desuden hente alle Supabase Storage-objekter.
- Backupformat v2 gemmer en eksplicit mapping fra original `bucket/object-path` til den lokale backupfil, så danske tegn, mellemrum og mapper kan genskabes præcist.
- Backupmapper og almindelige dumpfilnavne er eksplicit ignoreret i `.gitignore`.

## Tre lag i recovery

1. **Kode og migrationshistorik** · GitHub er kilden til appkode og reproducerbare skemaændringer.
2. **Databasebackup** · roller, schema, data og `supabase_migrations` eksporteres med Supabase CLI.
3. **Storagebackup** · selve filobjekterne eksporteres separat med original bucket/path og checksum.

Ingen af disse lag kan erstatte de andre.

## Backupfrekvens

### Mens projektet er på Free og før pilot

- Kør backup efter en udviklingssession, der ændrer væsentlige data eller databasestruktur.
- Kør mindst én komplet backup om ugen, også hvis der ikke har været større ændringer.
- Tag altid en komplet backup før risikofyldte datamigrationer eller større import.

### Før rigtige skolebrugere/elevdata sættes i drift

Én af disse skal være opfyldt:

- Supabase opgraderes til en plan med automatiske daglige platform-backups, **eller**
- der etableres en dokumenteret, automatisk og krypteret off-site backup med tilsvarende frekvens.

Selv med Supabase daglige backups anbefales en uafhængig periodisk eksport. Point-in-Time Recovery kan senere være relevant, når platformen er driftskritisk.

## Hvor backup må ligge

Backupfiler kan indeholde elev-, forældre- og personaleoplysninger.

De må **ikke**:

- committes til GitHub,
- uploades som almindelige CI-artifacts,
- deles i chat,
- ligge ukrypteret på en tilfældig privat cloudkonto.

Brug et godkendt, adgangsbegrænset og krypteret backupmål. `KLASSEVAERELSET_BACKUP_ROOT` kan pege på dette mål.

## Forudsætninger for databasebackup

Supabases anbefalede CLI-metode bruger `supabase db dump`. Brug en **Session Pooler** databaseforbindelse som `SUPABASE_DB_URL`.

Hemmelige værdier må ikke skrives i repoet. På Windows PowerShell kan de sættes for den aktuelle terminalsession:

```powershell
$env:SUPABASE_DB_URL="<session-pooler-connection-string>"
$env:SUPABASE_URL="https://jxmxiaiagknlvfxkluzu.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
$env:KLASSEVAERELSET_BACKUP_ROOT="D:\Klassevaerelset-backup"
```

`SUPABASE_URL` og `SUPABASE_SERVICE_ROLE_KEY` er nødvendige, hvis Storage-objekter skal med. Service role-nøglen er meget følsom og må aldrig deles eller committes.

## Lav en backup

```powershell
npm run backup:supabase
```

Scriptet:

1. kontrollerer at `SUPABASE_DB_URL` faktisk peger på Klasseværelsets produktions-ref,
2. laver `roles.sql`,
3. laver `schema.sql`,
4. laver `data.sql`,
5. eksporterer Supabases migrationshistorik,
6. henter Storage-objekter, hvis Storage-credentials er sat,
7. gemmer original bucket/path + relevante bucket/object-metadata i manifestet,
8. opretter `manifest.json` med filstørrelser og SHA-256 checksums.

Hvis Storage-credentials ikke er sat, gennemføres databasebackuppen, men backupen markeres som **ufuldstændig i forhold til Storage**.

## Verificér backupen

```powershell
npm run backup:verify -- "D:\Klassevaerelset-backup\<backup-mappe>"
```

Verifikationen kontrollerer:

- at de obligatoriske databasefiler findes,
- at manifestet tilhører Klasseværelset,
- filstørrelser og SHA-256 checksums,
- om Storage-eksporten blev gennemført,
- at format v2 har en entydig og sikker mapping fra hver original Storage-path til en backupfil.

En backup er ikke godkendt, hvis verifikationen fejler.

## Database restore-test

En backup er først troværdig, når vi har bevist, at den kan restores.

Database-restore må **aldrig** køres mod produktion. Scriptet nægter at køre, hvis `RESTORE_DB_URL` indeholder produktions-ref `jxmxiaiagknlvfxkluzu`.

Restore-test kræver `psql` og en tom/disposable Postgres/Supabase testdatabase:

```powershell
$env:RESTORE_DB_URL="<connection-string-til-disposable-testdatabase>"
$env:KLASSEVAERELSET_RESTORE_TEST="YES"
npm run restore:test -- "D:\Klassevaerelset-backup\<backup-mappe>"
```

Scriptet:

1. verificerer backup-manifestet,
2. nægter produktion som target,
3. restores roller, schema og data i en fejlstoppende restore,
4. restores migrationshistorikken,
5. smoke-tester centrale Klasseværelset-tabeller.

## Storage restore-test

Database-restore genskaber ikke i sig selv de fysiske Storage-objekter. Kør derfor Storage-restore mod et **disposable Supabase-testprojekt** efter database-restore.

```powershell
$env:RESTORE_SUPABASE_URL="https://<test-project-ref>.supabase.co"
$env:RESTORE_SUPABASE_SERVICE_ROLE_KEY="<test-project-service-role-key>"
$env:KLASSEVAERELSET_RESTORE_STORAGE_TEST="YES"
npm run restore:storage:test -- "D:\Klassevaerelset-backup\<backup-mappe>"
```

Storage-restore-scriptet:

1. kræver en verificeret format v2-backup med komplet Storage-status,
2. nægter Klasseværelsets produktions-ref som target,
3. opretter eller justerer de forventede buckets på testtarget,
4. afviser target-buckets med ekstra, uvedkommende objekter,
5. uploader hvert objekt til **præcis den originale path**,
6. downloader hvert objekt igen,
7. sammenligner SHA-256 med backupfilen,
8. kontrollerer at der hverken mangler eller er kommet ekstra object paths.

Dermed tester vi ikke kun, at filerne findes på backupdisken, men at de faktisk kan genskabes via Supabase Storage.

## Hvornår vi skal udføre en rigtig restore-test

- før første pilot med rigtige brugere,
- efter større ændringer i auth/skoleisolering/datamodel,
- efter ændring af backupmetoden,
- derefter mindst kvartalsvist, når systemet er i reel drift.

Supabase development branches kan være velegnede til isolerede migrationstests, men kan koste penge. Oprettelse af en branch skal derfor ske bevidst og med omkostningen godkendt først.

## Efter en restore-test

Dokumentér mindst:

- backupens timestamp,
- targetmiljø,
- om schema/data/migrationshistorik blev restored,
- row-count/smoke-test resultat,
- om Storage blev restored og checksum-verificeret,
- eventuelle fejl og rettelser,
- hvem der udførte testen.

Slet det disposable target igen, når testen er dokumenteret og ikke længere nødvendig.

## Pilotgate

Før rigtige følsomme skoledata bruges i piloten, skal vi kunne sætte flueben ved:

- [ ] mindst én komplet format v2-backup med `Storage status=complete`,
- [ ] backup-verifikation uden fejl,
- [ ] database restore-test på ikke-produktions-target,
- [ ] Storage restore-test på ikke-produktions-target,
- [ ] restore-resultatet dokumenteret,
- [ ] fast aftale om backupfrekvens og krypteret off-site opbevaring.

## Vigtigt om Supabase Storage

Databasebackup beskytter databaseindhold og Storage-metadata, men de fysiske filobjekter er en separat recovery-komponent. Derfor må en database-only restore aldrig betragtes som en fuld Klasseværelset-recovery, når dokumentarkivet er i brug.
