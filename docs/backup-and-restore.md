# Klasseværelset · backup og restore

Denne procedure er et driftskrav, ikke kun udviklerdokumentation. Klasseværelset kan behandle oplysninger om børn og skolepersonale, så backupfiler skal behandles som følsomme skoledata.

## Nuværende situation

- Supabase-projekt: `jxmxiaiagknlvfxkluzu` (`Klasseværelset`).
- Plan pr. 4. september 2026: **Free**.
- Supabase dokumenterer automatiske daglige platform-backups for Pro, Team og Enterprise. På Free skal vi derfor ikke basere vores recovery-plan på platformens daglige backups.
- Databaseskemaet er versionsstyret i `supabase/migrations` og valideres ved hver build.
- Backupscriptet eksporterer database + migrationshistorik og kan desuden hente Supabase Storage-objekter.
- Backupmapper og almindelige dumpfilnavne er eksplicit ignoreret i `.gitignore`.
- Storage-bucket `school-files` havde 0 objekter ved etablering af denne procedure. Det ændrer ikke kravet: filobjekter skal indgå, før rigtige filer tages i brug.

## Tre lag i recovery

1. **Kode og migrationshistorik** · GitHub er kilden til appkode og reproducerbare skemaændringer.
2. **Databasebackup** · roller, schema, data og `supabase_migrations` eksporteres med Supabase CLI.
3. **Storagebackup** · selve filobjekterne eksporteres separat. Databasebackup alene er ikke nok til at genskabe slettede Storage-filer.

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

Supabases aktuelle anbefalede metode bruger Supabase CLI, som kører `pg_dump` med Supabase-specifik filtrering. Docker skal være tilgængelig for CLI-dumpet.

Brug en **Session Pooler** databaseforbindelse som `SUPABASE_DB_URL`.

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
7. opretter `manifest.json` med filstørrelser og SHA-256 checksums.

Hvis Storage-credentials ikke er sat, gennemføres databasebackuppen, men scriptet markerer backupen som **ufuldstændig i forhold til Storage**.

## Verificér backupen

Kør efter hver backup:

```powershell
npm run backup:verify -- "D:\Klassevaerelset-backup\<backup-mappe>"
```

Verifikationen kontrollerer:

- at de obligatoriske databasefiler findes,
- at manifestet tilhører Klasseværelset,
- filstørrelser,
- SHA-256 checksum for hver fil,
- om Storage-eksporten blev gennemført.

En backup er ikke godkendt, hvis verifikationen fejler.

## Restore-test

En backup er først troværdig, når vi har bevist, at den kan restores.

Restore-testen må **aldrig** køres mod produktion. Scriptet indeholder en ekstra hard-stop og nægter at køre, hvis `RESTORE_DB_URL` indeholder produktions-ref `jxmxiaiagknlvfxkluzu`.

Restore-test kræver `psql` og en tom/disposable Postgres/Supabase testdatabase:

```powershell
$env:RESTORE_DB_URL="<connection-string-til-disposable-testdatabase>"
$env:KLASSEVAERELSET_RESTORE_TEST="YES"
npm run restore:test -- "D:\Klassevaerelset-backup\<backup-mappe>"
```

Scriptet:

1. verificerer backup-manifestet,
2. nægter produktion som target,
3. restores roller, schema og data i én fejlstoppende restore,
4. restores migrationshistorikken,
5. smoke-tester centrale Klasseværelset-tabeller.

Storage-objekter uploades ikke af database-restore-scriptet. Storage restore skal testes separat, når `school-files` reelt indeholder filer.

## Hvornår vi skal udføre en rigtig restore-test

- før første pilot med rigtige brugere,
- efter større ændringer i auth/skoleisolering/datamodel,
- efter ændring af backupmetoden,
- derefter mindst kvartalsvist, når systemet er i reel drift.

Supabase development branches er velegnede til en isoleret restore-/migrationstest, men kan koste penge. Oprettelse af en sådan branch skal derfor ske bevidst og med omkostningen godkendt først.

## Efter en restore-test

Dokumentér mindst:

- backupens timestamp,
- targetmiljø,
- om schema/data/migrationshistorik blev restored,
- row-count/smoke-test resultat,
- eventuelle fejl og rettelser,
- om Storage blev testet,
- hvem der udførte testen.

Slet det disposable target igen, når testen er dokumenteret og ikke længere nødvendig.

## Vigtigt om Supabase Storage

Supabase databasebackups beskytter databaseindhold og Storage-metadata, men ikke nødvendigvis de fysiske filobjekter. Derfor er `school-files` en separat recovery-komponent.

Inden skolen begynder at bruge dokumentarkiv/upload i praksis skal vi have testet:

1. komplet download af `school-files`,
2. checksum/verifikation,
3. upload til en tom test-bucket,
4. at databasefilreferencer igen peger på eksisterende objekter.

## Kilder / metode

Proceduren følger Supabases aktuelle dokumentation for **Database Backups**, `supabase db dump` og **Backup and Restore using the CLI**. Supabase anbefaler Session Pooler til dump/restore og beskriver separat, at Storage-objekter ikke genskabes alene ved database-restore.
