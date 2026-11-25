# Release 0.1 · Lærerens arbejdsdag

Status: klargøring til afgrænset medarbejderpilot.

## Formål

Release 0.1 skal bevise én sammenhængende lærerrejse i faktisk skolebrug:

**Log ind → Min dag → Kalender/lektion → Forberedelse → tilbage til dagens arbejde.**

Piloten åbnes modulvist. At en funktion findes i repository betyder ikke, at den er med i Release 0.1.

## Med i piloten

- Min dag / dagens overblik.
- Kalender og lærerens eget skema.
- Åbning af en konkret lektion.
- Forberedelse og kobling af undervisningsarbejde til lektion.
- Fortsæt arbejdet-genveje, hvor de allerede indgår i ovenstående flow.

## Ikke med i piloten endnu

- Forældreunivers.
- Elevlogin og elevopgaver som selvstændig release.
- Admin- og ledelsesdrift.
- Bestyrelsesunivers.
- Fraværsadministration og vikardækning som administrativt modul.
- Handleplaner og øvrige følsomme elevnoter.
- Bred brug af faglige elevprofiler.

De eksisterende funktioner fjernes ikke. De er blot uden for pilotens godkendte scope.

## Release-gates

Før Release 0.1 bruges med rigtige medarbejdere skal følgende være opfyldt:

- [x] Egen release-branch oprettet: `release/teacher-day-pilot`.
- [x] Afgrænset pilotindgang oprettet: `/pilot/teacher-day`.
- [x] GitHub Actions-produktionsbuild er grøn på release-branchen; Vercel-preview verificeres separat.
- [ ] Navigation i pilotflow er gennemgået uden døde links.
- [ ] Supabase-projektet er aktivt i et aftalt testvindue.
- [ ] Lærerlogin er testet i browser.
- [ ] Lærer A kan kun se de skema-/lektionsdata, som adgangsmodellen tillader.
- [ ] En konkret lektion kan åbnes og gemmes uden fejl.
- [ ] Forberedelse kan kobles til en lektion og findes igen.
- [ ] Ingen blocker-fejl i runtime logs under testen.
- [ ] Backup/recovery-risiko er eksplicit vurderet før bredere brug af persondata.

## Pilotprincip

En funktion kan åbnes, når dens egen arbejdsrejse og datagrænser er verificeret. Den behøver ikke vente på, at hele Klasseværelset er færdigt.

UI-skjulning er ikke en sikkerhedsgrænse. Adgang til data skal fortsat håndhæves af Supabase/RLS/RPC og eksisterende rollechecks.

## Testfeedback

Pilotfeedback kategoriseres kun som:

1. **STOPPER ARBEJDET** – brugeren kan ikke gennemføre opgaven.
2. **UKLART** – brugeren kan gennemføre, men ved ikke intuitivt hvordan.
3. **SENERE** – forbedring eller ny funktion, som ikke blokerer Release 0.1.

Nye featureønsker må ikke udvide scope, før blocker-listen for Release 0.1 er lukket.


Senest retriggeret: 25. november 2026.

Preview retrigger: 25. november 2026, anden kontrol.


## Auditstatus 25. november 2026

### STOPPER PILOT
- Supabase-projektet er aktuelt pauset/inaktivt, så login og databaseflow kan ikke live-verificeres endnu.
- Vercel preview-deployment er endnu ikke endeligt verificeret som READY. Selve Next.js/TypeScript-buildet er grønt i GitHub Actions.

### RETTET I RELEASE-BRANCHEN
- Lærerlogin lander på Release 0.1 frem for den gamle brede lærerflade.
- Pilotområdet er registreret i den centrale AccessGuard.
- Klasseværelset-logoet fører læreren tilbage til pilotens start.
- Lærernavigation er begrænset til I dag, Kalender og Forberedelse.
- Der er oprettet en fokuseret I dag-side uden opslagstavle, filupload og målgruppefunktioner.
- Lektionen sender ikke længere læreren videre til elevoversigt, fraværsmodul, fagrum eller opgaveoversigt.
- Forberedelsesflowet holder brugeren inden for pilotens godkendte modulgrænse.

### BØR RETTES / VERIFICERES FØR INTERN PILOT
- Live lærerlogin mod aktiv Supabase.
- Min dag → lektion → gem → genåbn.
- Kalender → lektion.
- Lektion → Forberedelse → gem → tilbage til lektion.
- RLS/adgangstest med mindst to læreridentiteter.
- Runtime-fejl i previewmiljøet.

### KAN VENTE
- Elevopgaver og besvarelser.
- Fraværsadministration.
- Fagrum som selvstændigt modul.
- Forældre.
- Bestyrelse.
- Handleplaner og øvrige følsomme elevdata.
