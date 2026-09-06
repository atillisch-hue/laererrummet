# Klasseværelset · opbevaring og sletning

Sidst opdateret: 6. september 2026.

Dette dokument beskriver den tekniske model for opbevaringsbegrænsning, sletning og anonymisering i Klasseværelset. Det fastsætter **ikke** juridiske opbevaringsfrister på skolens vegne.

## Grundregel

Personoplysninger må ikke gemmes længere end nødvendigt for det formål, de blev indsamlet til. Den dataansvarlige skole skal derfor fastsætte og kunne begrunde en opbevaringsperiode for hver kategori af personoplysninger og tage højde for anden lovgivning.

Klasseværelset må derfor ikke have én global “slet efter X år”-regel.

## Produktprincip

Retention skal være en kontrolleret proces:

1. **Inventér** hvilke datakategorier skolen behandler.
2. **Fastlæg** formål, behandlingsgrundlag, ansvarlig og opbevaringsperiode.
3. **Preview** hvilke konkrete poster der vil blive berørt.
4. **Godkend** regler og eventuelle undtagelser.
5. **Slet eller anonymisér** efter den valgte mekanisme.
6. **Auditér handlingen** uden at kopiere det slettede følsomme indhold ind i auditloggen.
7. **Kontrollér** regelmæssigt, at processen faktisk virker.

Ingen automatisk destruktiv sletning må aktiveres alene på baggrund af en udvikler-default.

## Datakategorier i den nuværende løsning

### 1. Identitet og adgang

Eksempler:

- `school_memberships`
- `user_profiles`
- `staff_directory_profiles`
- `teacher_classes`
- `parent_students`
- `student_guardians`

Livscyklus bør knyttes til relationen til skolen og eventuelle dokumentationskrav. Inaktiv adgang skal ikke være det samme som straks at slette historisk ansvar/audit-referencer.

### 2. Elevgrunddata

Eksempler:

- `students`
- klassetrin og klassekobling
- forælder-/værgerelationer

Elevens aktive skoleforløb og tiden efter udskrivning kræver en særskilt skolebeslutning. Sletning skal tage højde for afhængige faglige, fraværs-, møde- og dokumentdata.

### 3. Faglige produkter og progression

Eksempler:

- opgaver og elevtildelinger
- kladder
- feedback
- grammatik-/læse-/stave-/træningsforsøg
- `student_training_progress`
- forløb og faglige materialekoblinger

Der bør skelnes mellem lærerens genanvendelige undervisningsmateriale og elevhenførbar historik.

### 4. Fravær

Eksempler:

- `student_absence`
- `staff_absence`

Fraværsdata har et andet formål og en anden livscyklus end fx elevopgaver og bør have sin egen opbevaringsregel.

### 5. Møder, handlinger og elevplaner

Eksempler:

- `calendar_meetings`
- mødedeltagere, beslutninger og handlinger
- `student_action_plans`
- opfølgninger og planhandlinger
- `class_handover`

Denne kategori kan indeholde meget følsomme oplysninger og kræver derfor både snæver adgang, audit ved relevante opslag og en særskilt retentionbeslutning.

### 6. Skema, skoleår og ressourcehistorik

Eksempler:

- `school_years`
- skolekalender
- skemaversioner
- arbejdstidsprofiler/-registreringer
- årsallokeringer og undervisningskrav

Publicerede skemaversioner fungerer også som historisk dokumentation. Det skal afklares, hvor længe historikken er nødvendig, og hvilke dele der kan anonymiseres i stedet for at blive slettet.

### 7. Dokumentarkiv / Storage

Eksempler:

- `school_files`
- tilsvarende Storage-objekter

Database-metadata og selve Storage-filen er ét logisk objekt og skal slettes/arkiveres sammen. Det er ikke tilstrækkeligt at skjule dokumentet i UI'et.

Før bred pilot skal relevante dokumenthandlinger kunne auditlogges, herunder som minimum åbning/læsning, download, upload, ændring/erstatning, sletning og ændring af målgruppe/adgang, når dokumentet indeholder personoplysninger.

Auditloggen må ikke kopiere dokumentindholdet.

### 8. Beskeder (fremtidigt modul)

Beskedmodulet er endnu ikke bygget. Retention skal være en del af datamodellen fra første version.

Relevante audit-events forventes at være sendt, redigeret, slettet, videresendt, modtagere/adgang ændret og relevante opslag i andres beskeder. “Læst” bør kun logges i det omfang formålet kræver det.

Beskedtekst må ikke kopieres ind i sikkerhedsauditloggen.

### 9. Sikkerhedsdata

Private tabeller:

- `student_access_credentials`
- `student_sessions`
- `student_login_attempts`
- `security_audit_log`

Disse data har forskellige formål:

- credentials lever så længe loginforholdet er aktivt,
- sessions er kortlivede og kan ryddes efter udløb/tilbagekaldelse efter en fastlagt kort sikkerhedsperiode,
- loginforsøg skal ikke gemmes længere end nødvendigt for rate limiting/sikkerhedshændelser,
- auditlogs skal opbevares længe nok til faktisk at kunne opdage og undersøge misbrug, men også have en dokumenteret slettefrist.

## Backup er en separat retention-kopi

Sletning i live-databasen er ikke det samme som øjeblikkelig fysisk fjernelse fra allerede eksisterende backups.

Backup-politikken skal derfor dokumentere:

- hvor ofte backups tages,
- hvor længe de gemmes,
- hvornår gamle backups destrueres,
- hvordan en restore håndterer data, der allerede var slettet i produktion,
- hvem der har adgang til backupkopier.

## Førstegangs-information og policy-versionering

Før bred brugerstart skal brugere møde en versioneret førstegangs-information, der som minimum forklarer:

- vilkår for brug,
- behandling af personoplysninger,
- at relevante anvendelser af personoplysninger kan logges af sikkerheds- og dokumentationshensyn,
- at oplysninger kun må tilgås, når rollen/arbejdsopgaven kræver det.

Systemet skal kunne dokumentere mindst:

`user_id + policy_version + accepted_at`

Dette er som udgangspunkt dokumentation for information/accept af vilkår — **ikke automatisk GDPR-samtykke** til behandling, som skolen har et andet lovligt behandlingsgrundlag for.

Hvis en funktion reelt bygger på samtykke, skal dette modelleres særskilt med formål, version, tidspunkt og mulighed for tilbagetrækning.

## Teknisk næste trin

Før automatisk sletning bygges:

- lav en read-only retention-inventarvisning med antal og ældste post pr. kategori,
- fastlæg skolens opbevaringsperioder og juridiske/organisatoriske begrundelser,
- tilføj dry-run/preview af slettekandidater,
- design anonymisering hvor historisk dokumentation kan bevares uden identifikation,
- log selve retention-jobbet som en administrativ sikkerhedshændelse,
- test deletion mod database **og** Storage,
- test at restore-proceduren ikke utilsigtet genintroducerer slettede data i aktiv drift.
