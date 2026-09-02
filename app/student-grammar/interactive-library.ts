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