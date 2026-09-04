# Klasseværelset – database recovery og restore

Senest opdateret: 2026-09-04

Dette dokument skelner mellem to forskellige problemer:

1. **Kan databasestrukturen genskabes fra repositoryet?** — migration replay.
2. **Kan faktiske produktionsdata gendannes efter tab eller fejl?** — backup/restore.

Begge dele skal virke før platformen betragtes som driftsklar til flere skoler.

## 1. Regler for schemaændringer

`supabase/migrations/` er den autoritative historik for nye databaseændringer.

Fra 2026-09-01 og frem gælder:

- Alle ændringer af tabeller, views, funktioner, triggers, grants, constraints, indekser og RLS-politikker skal være en navngivet Supabase migration.
- Migrationens filnavn i GitHub skal matche den versionsværdi, Supabase registrerer.
- En allerede anvendt migration må ikke redigeres for at ændre produktionsdatabasen. Opret i stedet en ny migration.
- Ad-hoc SQL i produktion må ikke efterlades uden en tilsvarende migration i repositoryet.
- `npm run validate:migrations` skal være grøn før merge/deploy.
- Sikkerhedsfølsomme ændringer efterfølges af Supabase security advisor og, hvor relevant, `supabase/security-audit.sql`.

Legacy SQL-filer i `supabase/` og de ældste migrationsfiler fra august er historisk materiale. De er ikke i sig selv bevis for et rent replay.

## 2. Nuværende replay-status

**Status: Ikke endeligt bevist endnu.**

Produktionen blev etableret før den nuværende sammenhængende migrationshistorik. Den registrerede live-migrationshistorik starter 2026-09-01, mens ældre schemaarbejde findes som legacy SQL-filer i repositoryet.

Derfor må vi ikke påstå, at en tom database kan bygges 100 % korrekt ved blot at afvikle migrationsmappen, før vi har udført en ren test.

### Beviskrav

En fresh-database replay-test er bestået, når vi kan:

1. oprette en tom, isoleret Supabase udviklingsdatabase,
2. etablere den nødvendige baseline uden produktionsdata,
3. afvikle hele den relevante migrationskæde i versionsrækkefølge,
4. køre schema-/RLS-sanity checks,
5. bygge applikationen mod testdatabasen,
6. bekræfte at centrale flows virker,
7. slette testmiljøet igen.

En Supabase development branch kan koste penge. Den test må derfor først oprettes efter eksplicit cost confirmation.

## 3. Data-backup

Migrationer beskytter **strukturen**, ikke produktionsdata.

Supabase-dokumentationen angiver aktuelt, at Pro, Team og Enterprise-projekter får automatiske daglige databasebackups. Pro har 7 dages daglig retention, Team 14 dage og Enterprise op til 30 dage. Point-in-Time Recovery (PITR) er et separat tilvalg med finere gendannelsespunkt.

Officiel dokumentation:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/deployment/going-into-prod

### Vigtig begrænsning

Databasebackup inkluderer databaseindhold og Storage-metadata, men **ikke selve filer/objekter gemt via Supabase Storage**. Når Klasseværelset begynder at lagre elev- eller skolefiler i Storage, skal Storage have en særskilt backup-/eksportstrategi.

## 4. Recovery-mål for pilot

Inden første rigtige pilotskole med data bør vi have besluttet:

- **RPO**: Hvor meget data må vi maksimalt kunne miste? Til en tidlig pilot kan daglig backup være tilstrækkelig, hvis skolen accepterer op til cirka ét døgns datatab i et worst case-scenarie.
- **RTO**: Hvor længe må platformen være utilgængelig under recovery?
- Hvem må igangsætte en restore.
- Hvordan vi dokumenterer tidspunkt og årsag til restore.
- Hvordan vi validerer data og adgang efter restore.

PITR bør vurderes igen før bred produktion; det skal ikke aktiveres automatisk uden en konkret RPO-vurdering og omkostningsbeslutning.

## 5. Restore-runbook

Ved mistanke om datatab eller destruktiv schemafejl:

1. **Stop nye ændringer.** Ingen flere migrations eller administrative masseændringer.
2. **Afklar om problemet er schema eller data.** En kode/schemafejl kræver ikke nødvendigvis data-restore.
3. **Registrer tidspunktet for sidste kendte gode tilstand.**
4. **Tag/forvar eksisterende tilgængelige kopier**, hvis platformen giver mulighed for det, før en destruktiv restore.
5. **Vælg restorepunkt før fejlen.**
6. **Planlæg nedetid.** Supabase oplyser, at projektet er utilgængeligt under en restore.
7. **Gendan.** Brug Supabase Backup/PITR-flowet eller en dokumenteret logisk dump/restore-procedure.
8. **Kør sanity checks:**
   - centrale tabeller findes,
   - migrationshistorik er forventet,
   - RLS er slået til på eksponerede tabeller,
   - skoleisolering fungerer,
   - admin-login virker,
   - elev-/forældredata er afgrænset korrekt,
   - kritiske tællinger stemmer med forventningen.
9. **Kør applikations-build og smoke test.**
10. **Dokumenter hændelsen og luk årsagen**, før normale ændringer genoptages.

## 6. Kvartalsvis restore-drill, når vi er i pilot

En backup er først troværdig, når den er testet.

Mindst kvartalsvist under pilotdrift bør vi:

- lave en restore til et isoleret miljø eller anden sikker testkopi,
- verificere schema + et lille sæt ikke-følsomme testdata,
- teste login og skoleisolering,
- registrere resultat, dato og eventuelle afvigelser,
- aldrig bruge elevernes rigtige data i et ukontrolleret udviklingsmiljø.

## 7. Næste konkrete recovery-opgave

Den næste manglende milepæl er en **fresh-database replay/restore drill i et isoleret Supabase-miljø**. Alt ikke-betalingskrævende forarbejde kan laves først; selve oprettelsen af en betalt development branch eller et nyt projekt kræver eksplicit cost confirmation.
