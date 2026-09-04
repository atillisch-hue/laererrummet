# Klasseværelset · database recovery

Senest opdateret: 2026-09-04

Den **autoritative operative backup- og restore-runbook** ligger nu her:

- [`docs/backup-and-restore.md`](../docs/backup-and-restore.md)

Denne fil beskriver kun den særskilte **schema-/migration replay-status**, fordi det er et andet beviskrav end data-backup.

## Schema og migrationer

`supabase/migrations/` er den autoritative historik for nye databaseændringer.

Fra 2026-09-01 og frem gælder:

- Alle ændringer af tabeller, views, funktioner, triggers, grants, constraints, indekser og RLS-politikker skal være en navngivet Supabase migration.
- En allerede anvendt migration må ikke redigeres for at ændre produktionsdatabasen. Opret i stedet en ny migration.
- Ad-hoc SQL i produktion må ikke efterlades uden en tilsvarende migration i repositoryet.
- `npm run validate:migrations` skal være grøn før deploy.
- Sikkerhedsfølsomme ændringer efterfølges af Supabase security advisor og relevante adgangstests.

Legacy SQL-filer i `supabase/` og de ældste migrationsfiler fra august er historisk materiale. De er ikke i sig selv bevis for et rent replay.

## Nuværende replay-status

**Status: Ikke endeligt bevist endnu.**

Produktionen blev etableret før den nuværende sammenhængende migrationsdisciplin. Derfor må vi ikke påstå, at en helt tom database kan bygges 100 % korrekt ved blot at afvikle migrationsmappen, før vi har udført en isoleret fresh-database replay-test.

En fresh-database replay-test er bestået, når vi kan:

1. oprette en tom, isoleret database,
2. etablere nødvendig baseline uden produktionsdata,
3. afvikle den relevante migrationskæde i rækkefølge,
4. køre schema-/RLS-sanity checks,
5. bygge applikationen mod testdatabasen,
6. bekræfte centrale rolle- og skoleisoleringsflows,
7. dokumentere resultatet og slette testmiljøet igen.

En Supabase development branch kan koste penge. Oprettelse af et sådant miljø kræver derfor eksplicit cost confirmation.

## Data- og Storage-recovery

Se altid [`docs/backup-and-restore.md`](../docs/backup-and-restore.md) for:

- backupfrekvens,
- Free-plan-begrænsningen,
- database- og Storage-eksport,
- checksum-verifikation,
- den produktionssikrede restore-test,
- RPO/RTO og restore-drills.

Kort sagt: **migrationer beskytter strukturen; backups beskytter data; Storage-objekter kræver separat recovery.**