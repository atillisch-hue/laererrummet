import type { GrammarQuestion } from "./grammar-library";

export type InteractiveGrammarQuestion = GrammarQuestion & {
  kind?: "choice" | "text" | "rewrite";
  acceptedAnswers?: string[];
  placeholder?: string;
};

type Levels = Record<string, InteractiveGrammarQuestion[]>;

const text = (
  q: string,
  answer: string,
  why: string,
  acceptedAnswers: string[] = [answer],
  placeholder = "Skriv dit svar…"
): InteractiveGrammarQuestion => ({ q, options: [], answer, why, kind: "text", acceptedAnswers, placeholder });

const rewrite = (
  q: string,
  answer: string,
  why: string,
  acceptedAnswers: string[] = [answer]
): InteractiveGrammarQuestion => ({ q, options: [], answer, why, kind: "rewrite", acceptedAnswers, placeholder: "Skriv den rettede sætning…" });

export const interactiveGrammarLibrary: Record<string, Levels> = {
  "Navneord": {
    basis: [
      text("Skriv navneordet i sætningen: 'Hunden sover.'", "Hunden", "Hunden betegner et dyr og er et navneord."),
      text("Skriv navneordet: 'Hun købte en cykel.'", "cykel", "Man kan sætte 'en' foran cykel."),
      text("Skriv egennavnet i sætningen: 'Maja bor i Odense.'", "Odense", "Odense er navnet på et bestemt sted."),
    ],
    traening: [
      text("Skriv navneordet i flertal: 'en bog' → ?", "bøger", "Bøger er ubestemt flertal af bog."),
      text("Skriv det abstrakte navneord i sætningen: 'Frihed betyder meget for hende.'", "Frihed", "Frihed betegner et abstrakt begreb."),
      text("Skriv det sammensatte navneord: 'Eleverne står i skolegården.'", "skolegården", "Skolegården er et sammensat navneord dannet af skole + gård."),
    ],
    udfordring: [
      text("Gør 'ting' mere præcist i sætningen 'Der stod en ting på bordet.' Skriv ét konkret navneord.", "krus", "Et specifikt navneord skaber et tydeligere billede.", ["krus", "glas", "kop", "bog", "tallerken"]),
      text("Skriv navneordet, der samler temaet i sætningen: 'Ensomhed fylder hele fortællingen.'", "Ensomhed", "Ensomhed er et abstrakt navneord, der kan fungere som tematisk nøgleord."),
      text("Omskriv 'gennemførelsen af undersøgelsen' med et udsagnsord. Skriv kun verbet.", "undersøge", "Nominaliseringen kan pakkes ud til et mere direkte verbum.", ["undersøge", "undersøgte", "undersøger"]),
    ],
  },

  "Udsagnsord": {
    basis: [
      text("Skriv udsagnsordet i sætningen: 'Maja løber hjem.'", "løber", "Løber fortæller, hvad Maja gør."),
      text("Skriv udsagnsordet i datid: 'Hun spiser morgenmad.'", "spiste", "Spiste er datid af spise."),
      text("Skriv navneformen af 'cykler'.", "cykle", "Navneformen findes ofte ved at sætte 'at' foran: at cykle."),
    ],
    traening: [
      text("Skriv hele udsagnsleddet: 'Hun har læst bogen.'", "har læst", "Verballeddet består af hjælpeverbet har og hovedverbet læst."),
      text("Skriv et mere præcist verbum end 'gik hurtigt'.", "løb", "Et mere præcist verbum kan samle handling og tempo.", ["løb", "sprintede", "styrtede"]),
      text("Skriv verbet i nutid: 'De byggede en hule.'", "bygger", "Bygger er nutidsformen af bygge."),
    ],
    udfordring: [
      text("Skriv hele udsagnsleddet: 'De ville have afsluttet arbejdet.'", "ville have afsluttet", "Modalverbum og hjælpe-/hovedverbum udgør tilsammen udsagnsleddet."),
      text("Erstat 'sagde vredt' med ét præcist verbum.", "snerrede", "Et præcist verbum kan rumme både talehandling og attitude.", ["snerrede", "vrissede", "hvæsede"]),
      text("Omskriv passiv til aktiv: 'Planen blev ændret af eleverne.'", "Eleverne ændrede planen.", "Aktiv form gør aktøren tydelig."),
    ],
  },

  "Tillægsord": {
    basis: [
      text("Skriv tillægsordet: 'Den røde cykel står ude.'", "røde", "Røde beskriver navneordet cykel."),
      text("Skriv tillægsordet i sætningen: 'Huset er gammelt.'", "gammelt", "Gammelt beskriver huset."),
      text("Skriv grundformen af 'større'.", "stor", "Stor er grundformen; større er højere grad."),
    ],
    traening: [
      text("Skriv højeste grad af 'hurtig'.", "hurtigst", "Hurtigst er superlativ/højeste grad."),
      text("Skriv højere grad af 'god'.", "bedre", "God bøjes uregelmæssigt: god, bedre, bedst."),
      text("Skriv tillægsordet, der beskriver eleven: 'Den nervøse elev ventede.'", "nervøse", "Nervøse knytter en egenskab til eleven."),
    ],
    udfordring: [
      text("Erstat 'meget kold' med ét stærkere tillægsord.", "iskold", "Et mere præcist tillægsord kan intensivere betydningen.", ["iskold", "isnende"]),
      text("Skriv det værdiladede tillægsord i 'en arrogant leder'.", "arrogant", "Arrogant beskriver og vurderer samtidig personen negativt."),
      text("Gør 'god' mere præcist i 'en god forklaring'. Skriv ét mere præcist tillægsord.", "tydelig", "Et præcist tillægsord gør vurderingen mere konkret.", ["tydelig", "grundig", "overbevisende", "præcis"]),
    ],
  },

  "Stedord": {
    basis: [
      text("Skriv stedordet: 'Hun læser bogen.'", "Hun", "Hun står i stedet for navnet på en person."),
      text("Erstat 'Mikkel' med et stedord: 'Mikkel løber.'", "Han", "Han kan stå i stedet for et mandligt personnavn."),
      text("Skriv stedordet i sætningen: 'De spiller fodbold.'", "De", "De henviser til flere personer eller ting."),
    ],
    traening: [
      text("Udfyld korrekt: 'Emil vaskede ___ hænder.'", "sine", "Når ejeren er sætningens grundled, bruges det refleksive stedord sine."),
      text("Udfyld korrekt: 'Maja tog ___ jakke.'", "sin", "Maja ejer selv jakken, derfor bruges sin."),
      text("Skriv hvad 'den' henviser til: 'Jeg fandt bogen og lagde den på bordet.'", "bogen", "Den peger tilbage på bogen."),
    ],
    udfordring: [
      rewrite("Fjern tvetydigheden, hvis Laura er bekymret: 'Laura ringede til Emma, fordi hun var bekymret.'", "Laura ringede bekymret til Emma.", "Omskrivningen gør det klart, at bekymringen knytter sig til Laura."),
      text("Skriv stedordet, der skaber fællesskab i '___ kan løse det sammen.'", "Vi", "Vi inkluderer afsender og andre i samme gruppe."),
      text("Skriv stedordet, der skaber afstand mellem grupper i '___ forstår os aldrig.'", "De", "De kan placere en gruppe uden for afsenderens eget fællesskab."),
    ],
  },

  "Biord": {
    basis: [
      text("Skriv biordet: 'Hun løber hurtigt.'", "hurtigt", "Hurtigt fortæller, hvordan hun løber."),
      text("Skriv tidsudtrykket i sætningen: 'Vi kom i går.'", "i går", "I går fortæller, hvornår handlingen fandt sted."),
      text("Skriv biordet: 'Han talte stille.'", "stille", "Stille beskriver måden, han talte på."),
    ],
    traening: [
      text("Skriv benægtelsesordet i 'Jeg kommer ikke.'", "ikke", "Ikke benægter udsagnet."),
      text("Skriv ordet, der forstærker 'dygtig' i 'Hun er utrolig dygtig.'", "utrolig", "Utrolig fungerer her som gradsangivelse."),
      text("Skriv et biord, der gør udsagnet usikkert: 'Det er ___ sandt.'", "måske", "Måske dæmper sikkerheden i udsagnet.", ["måske", "muligvis", "sandsynligvis"]),
    ],
    udfordring: [
      text("Skriv et biord, der gør 'Det er forkert' mere kategorisk.", "helt klart", "Udtrykket markerer stærk sikkerhed.", ["helt klart", "tydeligvis", "bestemt"]),
      text("Skriv timingordet, der skaber et brat skift i '___ smækkede døren.'", "Pludselig", "Pludselig signalerer en uventet overgang."),
      text("Skriv biordet i 'Du lytter aldrig.'", "aldrig", "Aldrig angiver frekvens og gør udsagnet meget kategorisk."),
    ],
  },

  "Grundled og udsagnsled": {
    basis: [
      text("Skriv grundleddet i sætningen: 'Katten sover på sofaen.'", "Katten", "Grundleddet er den eller det, der udfører handlingen."),
      text("Skriv udsagnsleddet i sætningen: 'Børnene leger i haven.'", "leger", "Udsagnsleddet fortæller, hvad grundleddet gør."),
      text("Skriv grundleddet: 'Min lillebror cykler hurtigt.'", "Min lillebror", "Hele navneordsleddet 'Min lillebror' fungerer som grundled."),
    ],
    traening: [
      text("Skriv både grundled og udsagnsled adskilt med komma: 'Eleverne afleverede opgaven.'", "Eleverne, afleverede", "Eleverne er grundled, og afleverede er udsagnsled.", ["Eleverne, afleverede", "Eleverne,afleverede"]),
      text("Skriv udsagnsleddet: 'Hun har læst hele bogen.'", "har læst", "Udsagnsleddet kan bestå af flere verbalformer: 'har læst'."),
      text("Skriv grundleddet: 'På bordet ligger tre bøger.'", "tre bøger", "Selvom sætningen begynder med et stedsled, er 'tre bøger' grundled."),
    ],
    udfordring: [
      text("Skriv grundleddet: 'Efter pausen begyndte den lange prøve.'", "den lange prøve", "Grundleddet står efter verbet på grund af foranstillet tidsled."),
      text("Skriv hele udsagnsleddet: 'De ville have afsluttet arbejdet tidligere.'", "ville have afsluttet", "Det samlede verballed består af modalverbum og hjælpe-/hovedverbum."),
      text("Skriv grundleddet: 'At læse hver dag styrker ordforrådet.'", "At læse hver dag", "En infinitivforbindelse kan fungere som grundled."),
    ],
  },

  "Genstandsled": {
    basis: [
      text("Skriv genstandsleddet: 'Maja læser bogen.'", "bogen", "Spørg: Maja læser hvad? – bogen."),
      text("Skriv genstandsleddet: 'Hunden hentede bolden.'", "bolden", "Bolden er det, handlingen retter sig mod."),
      text("Skriv genstandsleddet: 'Vi så filmen i går.'", "filmen", "Vi så hvad? – filmen."),
    ],
    traening: [
      text("Skriv genstandsleddet: 'Læreren gav eleverne en opgave.'", "en opgave", "Det direkte genstandsled er det, der gives: en opgave."),
      text("Skriv det indirekte genstandsled: 'Læreren gav eleverne en opgave.'", "eleverne", "Eleverne er modtagerne og fungerer som indirekte genstandsled."),
      text("Skriv genstandsleddet: 'Hun fortalte historien langsomt.'", "historien", "Hun fortalte hvad? – historien."),
    ],
    udfordring: [
      text("Skriv genstandsleddet: 'Den besked havde ingen forventet.'", "Den besked", "Genstandsleddet er flyttet frem i forfeltet for at få fokus."),
      text("Skriv det direkte genstandsled: 'Kommunen tilbød skolen en ny løsning.'", "en ny løsning", "Løsningen er det, kommunen tilbyder; skolen er modtager."),
      text("Skriv det indirekte genstandsled: 'Kommunen tilbød skolen en ny løsning.'", "skolen", "Skolen er modtageren af løsningen."),
    ],
  },

  "Hel- og ledsætninger": {
    basis: [
      text("Skriv ledsætningen: 'Jeg bliver hjemme, fordi jeg er syg.'", "fordi jeg er syg", "'fordi jeg er syg' er underordnet helsætningen."),
      text("Skriv helsætningen: 'Når filmen slutter, går vi hjem.'", "går vi hjem", "'går vi hjem' kan fungere som den overordnede helsætning."),
      text("Skriv ordet, der indleder ledsætningen: 'Jeg tror, at hun kommer.'", "at", "'at' indleder ledsætningen 'at hun kommer'."),
    ],
    traening: [
      text("Skriv ledsætningen: 'Hvis det regner, tager vi bussen.'", "Hvis det regner", "Hvis-leddet er en betingelsesledsætning."),
      text("Skriv ledsætningen: 'Pigen, som vandt løbet, smilede.'", "som vandt løbet", "Som-leddet beskriver pigen og er en relativ ledsætning."),
      text("Brug ikke-prøven. Skriv ledsætningen i: 'Jeg går, fordi jeg ikke fryser.'", "fordi jeg ikke fryser", "I ledsætningen står 'ikke' før det finitte verbum 'fryser'."),
    ],
    udfordring: [
      text("Skriv den inderste ledsætning: 'Jeg ved, at når han kommer, går vi.'", "når han kommer", "Når-ledsætningen ligger inde i den større at-ledsætning."),
      text("Skriv den relative ledsætning: 'Bogen, der ligger på bordet, er min.'", "der ligger på bordet", "'der ligger på bordet' beskriver navneordet 'bogen'."),
      text("Skriv ledsætningen: 'Selvom hun ikke havde øvet, klarede hun prøven.'", "Selvom hun ikke havde øvet", "Selvom-leddet er underordnet og viser modsætning/indrømmelse."),
    ],
  },

  "Komma mellem helsætninger": {
    basis: [
      rewrite("Ret tegnsætningen: 'Solen skinnede og vi gik ud.'", "Solen skinnede, og vi gik ud.", "Der er to helsætninger med hvert sit grundled og udsagnsled."),
      rewrite("Ret tegnsætningen: 'Jeg læser men min bror spiller.'", "Jeg læser, men min bror spiller.", "To helsætninger forbindes med 'men'."),
      rewrite("Ret sætningen, hvis det er nødvendigt: 'Maja synger og danser.'", "Maja synger og danser.", "Maja er fælles grundled for begge udsagnsled, så der skal ikke komma."),
    ],
    traening: [
      rewrite("Indsæt korrekt komma: 'Bussen kom ikke så vi gik hjem.'", "Bussen kom ikke, så vi gik hjem.", "'Bussen kom ikke' og 'vi gik hjem' er to helsætninger."),
      rewrite("Ret tegnsætningen: 'Hun åbnede døren, og gik ind.'", "Hun åbnede døren og gik ind.", "Hun er fælles grundled for 'åbnede' og 'gik', så kommaet skal væk."),
      rewrite("Indsæt korrekt komma: 'Vi kan tage toget eller vi kan cykle.'", "Vi kan tage toget, eller vi kan cykle.", "Eller forbinder to selvstændige helsætninger."),
    ],
    udfordring: [
      rewrite("Ret tegnsætningen: 'Eleven læste, og skrev et svar.'", "Eleven læste og skrev et svar.", "Der er ét fælles grundled, 'Eleven', til begge udsagnsled."),
      rewrite("Ret sætningen: 'Hun protesterede men ingen lyttede.'", "Hun protesterede, men ingen lyttede.", "To sideordnede helsætninger forbindes med 'men'."),
      rewrite("Ret tegnsætningen: 'Læreren forklarede opgaven og eleverne begyndte.'", "Læreren forklarede opgaven, og eleverne begyndte.", "Der er to helsætninger med hvert sit grundled."),
    ],
  },

  "Komma ved ledsætninger": {
    basis: [
      rewrite("Indsæt slutkomma: 'Jeg bliver hjemme fordi jeg er syg.'", "Jeg bliver hjemme, fordi jeg er syg.", "Den efterstillede ledsætning afgrænses fra helsætningen."),
      rewrite("Indsæt slutkomma: 'Vi går hjem når filmen slutter.'", "Vi går hjem, når filmen slutter.", "Når-ledsætningen står efter helsætningen."),
      rewrite("Ret tegnsætningen: 'Hvis det regner bliver kampen aflyst.'", "Hvis det regner, bliver kampen aflyst.", "En foranstillet ledsætning afsluttes med komma."),
    ],
    traening: [
      rewrite("Ret tegnsætningen: 'Hun gik da mødet sluttede.'", "Hun gik, da mødet sluttede.", "Da-ledsætningen er efterstillet og afgrænses med slutkomma."),
      rewrite("Ret tegnsætningen: 'Når hun kommer starter vi.'", "Når hun kommer, starter vi.", "Den foranstillede ledsætning afsluttes med komma."),
      rewrite("Ret tegnsætningen: 'Jeg tror at hun har ret.'", "Jeg tror, at hun har ret.", "At-ledsætningen står efter helsætningen og afgrænses med slutkomma."),
    ],
    udfordring: [
      rewrite("Ret tegnsætningen: 'Min bror som bor i Aarhus kommer i morgen.'", "Min bror, som bor i Aarhus, kommer i morgen.", "Den indskudte relative ledsætning afgrænses på begge sider."),
      rewrite("Ret tegnsætningen: 'Jeg ved at når han kommer går vi.'", "Jeg ved, at når han kommer, går vi.", "Der er både en at-ledsætning og en indlejret når-ledsætning."),
      rewrite("Ret tegnsætningen: 'Bogen som jeg lånte var spændende.'", "Bogen, som jeg lånte, var spændende.", "Den indskudte relative ledsætning afgrænses med to kommaer."),
    ],
  },

  "Præcise verber": {
    basis: [
      text("Erstat 'gik hurtigt' med ét mere præcist verbum: 'Han gik hurtigt over vejen.'", "styrtede", "Et præcist verbum kan samle bevægelse og fart i ét ord.", ["styrtede", "sprintede", "løb"]),
      text("Skriv et mere præcist verbum end 'sagde' til en vred replik.", "snerrede", "Verber som 'snerrede', 'vrissede' og 'hvæsede' viser både tale og tone.", ["snerrede", "vrissede", "hvæsede"]),
      text("Erstat 'gik stille' med ét præcist verbum.", "listede", "'Listede' viser en lydløs/forsigtig bevægelse.", ["listede", "sneg"]),
    ],
    traening: [
      text("Omskriv 'Vinden bevægede sig gennem træerne' med et mere sanseligt verbum.", "susede", "'Susede' giver både bevægelse og lyd.", ["susede", "suste"]),
      text("Skriv et verbum, der viser en langsom og afslappet måde at gå på.", "slentrede", "'Slentrede' signalerer rolig, afslappet bevægelse.", ["slentrede", "daskede"]),
      text("Erstat 'foretog en undersøgelse af' med ét direkte verbum.", "undersøgte", "Det direkte verbum gør formuleringen kortere og mere handlingsbåret."),
    ],
    udfordring: [
      text("Skriv et verbum, der kan gøre 'Han sagde' tydeligt skeptisk eller afvisende i tonen.", "vrissede", "Et præcist verbalvalg kan indbygge attitude i selve handlingen.", ["vrissede", "snerrede", "hvæsede"]),
      text("Omskriv 'Regnen faldt mod taget' med ét mere lydligt og sanseligt verbum.", "trommede", "'Trommede' giver læseren en tydelig lydlig oplevelse.", ["trommede", "hamrede"]),
      text("Erstat 'Planen blev ændret af eleverne' med aktiv form. Skriv hele sætningen.", "Eleverne ændrede planen.", "Aktiv form gør aktøren tydelig og øger agentiviteten."),
    ],
  },
};