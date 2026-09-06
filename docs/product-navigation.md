# Klasseværelset · produktnavigation

Denne fil er den kanoniske informationsarkitektur for de primære arbejdsrum. Formålet er at holde navigation, navngivning og adgangsroller sammenhængende, når produktet vokser.

## Grundprincipper

1. **Klasseværelset er produktets navn** – ikke navnet på én menu eller én bestemt lærervisning.
2. **Én funktion har ét naturligt hjem.** En funktion må gerne have kontekstuelle genveje, men ikke flere parallelle redigeringsflader.
3. **Adgangsrolle og personalegruppe er forskellige ting.** En pædagog kan fx have personalegruppen `pedagogue` og adgangsrollen `staff`.
4. **Flere roller giver flere eksplicitte indgange.** `admin` giver ikke automatisk lærerarbejde; `leader` giver ikke automatisk personale- eller lærerrettigheder. En person med flere roller får adgang til de arbejdsrum, som hver rolle giver.
5. **Databasen er den autoritative adgangsgrænse.** Navigation og route guards skal afspejle RLS/RPC-reglerne – ikke erstatte dem.
6. **Gamle URL'er må være redirects, ikke parallelle produkter.** Historiske bogmærker må gerne virke, men skal lande på den kanoniske funktion.
7. **Ingen tomme løfter i brugerfladen.** Funktioner, som ikke findes endnu, hører til backloggen og vises ikke som aktive kort eller knapper.
8. **Kontekst følger brugeren.** Hvis man vælger en klasse, elev, barn, dato eller fag, skal næste naturlige skærm bevare den kontekst, hvor det er sikkert og relevant.

## Lærer

Primær navigation:

- **I dag** – dagens skema, næste handling, personalefravær, mødehandlinger og fælles opslag.
- **Klasser** – lærerens egne klasser, elever, fagrum, opgaver og faglige overblik.
- **Kalender** – skema, møder og arbejdstid.
- **Lærerværelset** – fælles medarbejderarbejde, egne opgaver, vikardag, arkiv og kollegaer.
- **Forberedelse** – forløb, opgaver, fagmaterialer og kobling til konkrete lektioner.

Undervisningsarbejde kræver den eksplicitte adgangsrolle `teacher`.

### Fagrum

Brugerordet er **Fagrum**, ikke “faglokale”.

Typiske værktøjer i et fagrum:

- Fagligt overblik
- Forløb & årsplan
- Opgaver & besvarelser
- Deltagere
- Fagspecifik træning/værktøjer
- Ny opgave

## Personale / pædagog / andet personale

Primær navigation:

- **Kalender** – egen kalender og arbejdstid.
- **Lærerværelset** – egne opgaver, eventuelle vikartimer, arkiv og kollegaer.

Adgangsrollen er `staff`. Rollen må ikke i sig selv udvide adgang til elevdata eller undervisningsværktøjer.

## Vikar

Det primære arbejdsrum er **Min vikardag**.

Vikaroplevelsen skal være opgaveorienteret og minimal:

- Nu / næste time
- Kun egne tildelte vikartimer
- Vikarplan
- Relevante materialer
- Fremmøde
- Kort overlevering til læreren

Vikaren skal ikke behøve at forstå lærerens normale klasse- eller forberedelsesstruktur.

## Ledelse

Ledelse er et selvstændigt arbejdsrum, ikke en variant af systemadministration.

Kanoniske ledelsesområder:

- **Skoleår & ressourcer**
- **Skema**
- **Skolekalender**
- **Personaleopgaver**
- **Kalender / arbejdstid & norm**

Adgangsrollen er `leader`. Ledelse giver ikke automatisk adgang til login-/rolleadministration eller lærerens undervisningsrum.

## Administrator

Administratorens primære ansvar er system- og grunddata:

- **Personer & adgang** – login, roller, aktiv/inaktiv adgang og forælder-barn-relationer.
- **Personaleprofiler** – navn, forkortelse, personalegruppe og profilstatus.
- **Klasser & elever** – klasser, elever, klasseskift og elevkoder.
- **Klasser & undervisning** – klassetrin/differentiering og lærer-klasse-tilknytninger.
- **Skolens grunddata og sikker adgang**.

En administrator kan også have ledelsesrollen eller lærerrollen, men `admin` alene skal ikke implicit give disse arbejdsrum.

## Forælder

Startside: **Dit barns skolehverdag**.

Kanoniske veje pr. valgt barn:

- Skema
- Meld syg / fravær
- Møder & officielle referater
- Delte forløb, opgaver og materialer

Hvis en forælder har flere børn, skal valgt barn følge med mellem relevante undersider og tilbage igen. Mødearkivet må tilbyde **Alle børn**.

Forældreportalen viser ikke elevens kladder, interne lærernoter eller andre elevers oplysninger.

## Elev

Elevens struktur er bevidst enkel:

- **Dine fag**
- **Fra din lærer**
- **Træn selv**

Eleven skal møde elevsprog, ikke systemord som “faglokale”, “administration” eller lærerens interne arbejdsbegreber.

## Bestyrelse

Startside: **Bestyrelsens arbejdsrum**.

Kanoniske funktioner:

- Kommende møder
- Åbne beslutninger og opfølgning
- Bestyrelsesdokumenter/referater
- Besked til relevante medarbejdermålgrupper

Bestyrelsesrollen giver ikke adgang til elevsager eller lærerinterne data.

## Navngivning

Foretrukne brugerord:

- Fagrum
- Deltagere
- Kollegaer
- Dagens vikardækning
- Personer & adgang
- Personaleprofiler
- Klasser & elever
- Skoleår & ressourcer
- I dag

Undgå at genindføre:

- Faglokale/faglokaler som digitalt begreb
- “Brugere” som fælles navn for personer, elever, forældre og personale
- Flere forskellige “overblik”-sider med samme formål
- Parallel administration af samme felt, fx initialer både i skema og personaleprofil
- Admin som implicit lærerrolle

## Når en ny funktion bygges

Før en ny rute eller hovedknap tilføjes, afklar:

1. Hvilken rolle udfører opgaven?
2. Hvilket eksisterende arbejdsrum er dens naturlige hjem?
3. Findes der allerede en funktion med samme formål?
4. Hvilken kontekst skal følge med ind og tilbage?
5. Er navnet forståeligt uden kendskab til datamodellen?
6. Matcher frontend-adgangen de faktiske RLS/RPC-rettigheder?

Hvis svaret på nr. 2 er “ingen”, er det først dér, et nyt hovedområde bør overvejes.
