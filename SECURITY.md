# Klasseværelset – sikkerhedsbaseline

Dette dokument er et levende sikkerhedsregister for udviklingen af Klasseværelset.

## Grundprincipper

1. Ingen rigtige elevdata i udviklings- eller testmiljøer.
2. Adgang må aldrig alene beskyttes i brugergrænsefladen. Autorisation skal håndhæves server-/database-side.
3. Least privilege: en bruger får kun adgang til data, der er nødvendige for den aktive rolle og tilknytning.
4. Alle skoleejede data skal på sigt have en `school_id`, så skoler kan isoleres fra hinanden.
5. Roller skal kunne kombineres, men rettigheder skal vurderes ud fra den aktive kontekst (fx forælder vs. bestyrelse).
6. Row Level Security (RLS) skal være aktiveret på tabeller med bruger-, elev-, forældre-, klasse-, opgave-, fraværs- og bestyrelsesdata, og policies skal være eksplicitte.
7. `security definer`-funktioner skal have snævert formål, eksplicit autentificering/autorisation og fast `search_path`.
8. Service-role-nøgler må aldrig eksponeres i klientkode.
9. Nye funktioner skal beskrive: hvilke persondata de bruger, hvem der kan se dem, formål, sletning og eventuelle eksterne databehandlere.

## Audit 2026-08-22

### Kritisk / høj prioritet

- `supabase/board.sql`: RLS er aktiveret, men policies giver alle autentificerede brugere fuld læse- og skriveadgang (`using (true)` / `with check (true)`). Board/admin skal håndhæves i databasen, ikke kun i appens AccessGuard.
- `supabase/grammar-schema.sql`: policies giver alle autentificerede brugere adgang til at administrere grammatikopgaver/spørgsmål og læse elevforsøg. Skal afgrænses efter skole, rolle og relevant klasse.
- `app/AccessGuard.tsx`: klient-side rollecheck er kun UX og må ikke betragtes som en sikkerhedsgrænse.

### Mellem prioritet

- `supabase/noticeboard.sql`: alle autentificerede brugere kan læse opslag. Policy-navnet siger lærere, men databasen verificerer ikke lærerrollen. Skal afgrænses efter skole og målgruppe/rolle.
- `supabase/school-day.sql`: RLS er aktiveret på skema og fravær, men SQL-filen definerer ingen policies. Vi skal verificere den deployede databases faktiske policies før brug med rigtige data.
- `supabase/assignment-recipients.sql`: RLS er aktiveret uden policies i filen. Server-side/service-role adgang skal gennemgås, så endpoints ikke kan udlevere eller ændre koblinger uden korrekt autorisation.

### Positivt eksisterende fundament

- `supabase/parent-portal.sql` har RLS på forælder/elev-koblingen og begrænser direkte læsning til `parent_id = auth.uid()`.
- Admin-RPC'er i `supabase/admin-directory.sql` udfører et admin-check før handlinger.
- Projektet bruger allerede Supabase Auth og RLS, så vi kan stramme den eksisterende arkitektur frem for at starte forfra.

## Næste sikkerhedsmilepæl

Før rigtige elevdata anvendes:

- Introducer skole/tenant-model (`schools`, medlemskab og `school_id`).
- Flyt rolle-/medlemskabsautorisation til database/server-side frem for kun JWT user metadata og klientnavigation.
- Definer klassemedlemskab for lærere og elever.
- Erstat brede `authenticated ... using (true)` policies med skole-, rolle- og klasserestriktioner.
- Gennemgå alle API-ruter og alle anvendelser af Supabase service role.
- Test negativ adgang systematisk: lærer A må ikke se lærer B's uvedkommende klasse; forælder må kun se egne børn; board må ikke få elevadgang via board-rollen; skole A må aldrig kunne se skole B.

## Fremtidige krav

- MFA for privilegerede konti, når løsningen går fra prototype til reel brug.
- Audit/logging af relevante administrative og følsomme handlinger.
- Slette-/opbevaringspolitik og procedurer for indsigt/sletning.
- Backup/restore-procedure.
- Databehandleroversigt og databehandleraftaler før ekstern pilot.
- Særskilt risikovurdering/DPIA-vurdering før AI får adgang til personhenførbare elevdata.
