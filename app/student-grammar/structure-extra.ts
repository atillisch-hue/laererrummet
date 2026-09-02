import type { GrammarQuestion } from "./grammar-library";

type Levels = Record<string, GrammarQuestion[]>;
const q = (text: string, options: string[], answer: string, why: string): GrammarQuestion => ({ q: text, options, answer, why });
const set = (rows: Array<[string, string[], string, string]>): GrammarQuestion[] => rows.map(([text, options, answer, why]) => q(text, options, answer, why));

export const structureExtraLibrary: Record<string, Levels> = {
  Navneord: {
    basis: set([
      ["Hvilket ord er et navneord?", ["frihed", "løber", "smuk", "meget"], "frihed", "Frihed betegner et begreb og er derfor et navneord."],
      ["Hvilket ord er et egennavn?", ["Danmark", "land", "by", "skole"], "Danmark", "Danmark er navnet på et bestemt land og skrives med stort begyndelsesbogstav."],
      ["Hvilket navneord er konkret?", ["stol", "glæde", "venskab", "mod"], "stol", "En stol er en fysisk ting, man kan sanse."],
      ["Hvilket navneord er abstrakt?", ["tålmodighed", "kop", "hund", "cykel"], "tålmodighed", "Tålmodighed er et begreb og kan ikke sanses som en fysisk genstand."],
      ["Hvilket ord står i bestemt form ental?", ["bogen", "bog", "bøger", "bøgerne"], "bogen", "Bogen er ental og bestemt form."],
    ]),
    traening: set([
      ["Hvilket ord er et sammensat navneord?", ["skolebibliotek", "skole", "bibliotek", "læser"], "skolebibliotek", "Skolebibliotek består af to navneord: skole + bibliotek."],
      ["Hvilket navneord er dannet af et udsagnsord?", ["beslutning", "bord", "sommer", "elev"], "beslutning", "Beslutning er dannet af verbet beslutte."],
      ["Hvad er navneordet i 'Hendes mod overraskede alle'?", ["mod", "Hendes", "overraskede", "alle"], "mod", "Mod betegner et abstrakt begreb og fungerer som grundled."],
      ["Hvilket ord står i bestemt form flertal?", ["husene", "huse", "huset", "hus"], "husene", "Husene er flertal og bestemt form."],
      ["Hvilken række består kun af navneord?", ["ansvar, stemme, mulighed", "ansvarlig, stemme, muligt", "ansvar, taler, mulig", "meget, mulighed, stemme"], "ansvar, stemme, mulighed", "Alle tre ord er navneord."],
    ]),
    udfordring: set([
      ["Hvilken formulering bruger nominalisering?", ["Gennemførelsen af testen tog tid.", "Vi gennemførte testen.", "Vi testede eleverne.", "Eleverne skrev testen."], "Gennemførelsen af testen tog tid.", "Handlingen 'at gennemføre' er gjort til navneordet 'gennemførelsen'."],
      ["Hvad kan nominalisering gøre ved en tekst?", ["Gøre handlingen mere abstrakt og skjule aktøren", "Gøre alle sætninger kortere", "Fjerne alle navneord", "Gøre teksten til direkte tale"], "Gøre handlingen mere abstrakt og skjule aktøren", "Når handlinger bliver til navneord, træder den handlende ofte mindre tydeligt frem."],
      ["Hvilket navneord er mest værdiladet?", ["svigt", "hændelse", "valg", "resultat"], "svigt", "Svigt indeholder en tydelig negativ vurdering."],
      ["Hvilken omskrivning gør teksten mest konkret?", ["Eleverne protesterede.", "Der opstod en protest.", "Protesten fandt sted.", "Der var forekomst af protest."], "Eleverne protesterede.", "Aktør og handling bliver tydelige i stedet for at være pakket ind i abstrakte navneord."],
      ["Hvilken analyse er korrekt i 'Frygten voksede'?", ["Frygten er et abstrakt navneord, der er gjort til grundled", "Frygten er et biord", "Voksede er et navneord", "Sætningen har intet grundled"], "Frygten er et abstrakt navneord, der er gjort til grundled", "Et abstrakt begreb kan grammatisk fungere som grundled og fremstilles næsten som en aktør."],
    ]),
  },

  Udsagnsord: {
    basis: set([
      ["Hvilket udsagnsord står i nutid?", ["skriver", "skrev", "skrive", "skrevet"], "skriver", "Skriver står i nutid."],
      ["Hvilket udsagnsord står i datid?", ["fandt", "finder", "finde", "fundet"], "fandt", "Fandt står i datid."],
      ["Hvilken form er 'at løbe'?", ["Navnemåde", "Nutid", "Datid", "Bydemåde"], "Navnemåde", "At + grundformen er navnemåde/infinitiv."],
      ["Hvilket udsagnsord står i bydemåde?", ["Kom!", "kommer", "kom", "kommet"], "Kom!", "Bydemåde bruges til opfordringer og ordrer."],
      ["Hvad er udsagnsleddet i 'Hun har læst'?", ["har læst", "Hun", "læst", "har"], "har læst", "Udsagnsleddet består her af hjælpeverbet 'har' og hovedverbet 'læst'."],
    ]),
    traening: set([
      ["Hvilken sætning står i førdatid?", ["Hun havde spist.", "Hun har spist.", "Hun spiste.", "Hun spiser."], "Hun havde spist.", "Havde + kort tillægsform danner førdatid."],
      ["Hvilken sætning står i førnutid?", ["De har rejst.", "De rejser.", "De rejste.", "De havde rejst."], "De har rejst.", "Har + kort tillægsform danner førnutid."],
      ["Hvilken sætning er passiv?", ["Døren blev åbnet.", "Maja åbnede døren.", "Maja åbner døren.", "Åbn døren!"], "Døren blev åbnet.", "Blive + kort tillægsform danner her passiv."],
      ["Hvilket ord er et modalverbum?", ["skal", "løber", "skriver", "sover"], "skal", "Skal er et modalverbum, som udtrykker nødvendighed eller forpligtelse."],
      ["Hvilken sætning har et sammensat verballed?", ["Vi vil rejse.", "Vi rejser.", "Vi rejste.", "Rejs!"], "Vi vil rejse.", "Vil + rejse fungerer samlet som verballed."],
    ]),
    udfordring: set([
      ["Hvilken formulering skjuler aktøren mest?", ["Reglerne blev ændret.", "Ledelsen ændrede reglerne.", "Lærerne ændrede reglerne.", "Eleverne ændrede reglerne."], "Reglerne blev ændret.", "Passiv gør det muligt at udelade, hvem der udførte handlingen."],
      ["Hvilket verbum signalerer størst sikkerhed?", ["fastslår", "gætter", "antyder", "overvejer"], "fastslår", "Fastslår fremstiller udsagnet som sikkert og bestemt."],
      ["Hvilken analyse er korrekt i 'Hun må have glemt det'?", ["Verballeddet indeholder både modalverbum og perfektum", "Kun 'glemt' er verballed", "Må er et navneord", "Sætningen står i bydemåde"], "Verballeddet indeholder både modalverbum og perfektum", "Må + have + glemt udtrykker en modal vurdering af en afsluttet handling."],
      ["Hvilken ændring gør sproget mere handlingspræget?", ["Foretage en vurdering → vurdere", "Løbe → foretage et løb", "Skrive → udførelse af skrivning", "Beslutte → beslutningstagning"], "Foretage en vurdering → vurdere", "Et direkte verbum gør handlingen tydeligere og mindre tung."],
      ["Hvad er effekten af 'kan' i 'Det kan være farligt'?", ["Det graderer sikkerheden og gør udsagnet mindre kategorisk", "Det gør sætningen til datid", "Det gør verbet til navneord", "Det markerer direkte tale"], "Det graderer sikkerheden og gør udsagnet mindre kategorisk", "Modalverbet kan viser mulighed frem for sikkerhed."],
    ]),
  },

  Tillægsord: {
    basis: set([
      ["Hvilket ord er et tillægsord?", ["rolig", "ro", "roligt", "sover"], "rolig", "Rolig beskriver en egenskab."],
      ["Hvad er højere grad af 'lille'?", ["mindre", "mindst", "lillere", "mere lille"], "mindre", "Lille bøjes uregelmæssigt: lille, mindre, mindst."],
      ["Hvad er højeste grad af 'smuk'?", ["smukkest", "smukkere", "smukker", "mest smukke"], "smukkest", "Smuk bøjes smuk, smukkere, smukkest."],
      ["Find tillægsordet: 'Den gamle cykel knirkede.'", ["gamle", "cykel", "knirkede", "Den"], "gamle", "Gamle beskriver cyklen."],
      ["Hvilken sætning bruger et tillægsord som omsagnsled?", ["Huset er stort.", "Det store hus står der.", "Huset står der.", "Huset vokser."], "Huset er stort.", "Stort beskriver grundleddet gennem verbet 'er'."],
    ]),
    traening: set([
      ["Hvilken form passer? 'Et ___ hus'", ["gammelt", "gammel", "gamle", "ældre"], "gammelt", "Tillægsordet bøjes efter et intetkønsord i ubestemt ental."],
      ["Hvilken form passer? 'De ___ huse'", ["gamle", "gammel", "gammelt", "gamler"], "gamle", "I flertal bruges typisk -e-formen."],
      ["Hvilket tillægsord er mest værdiladet?", ["fremragende", "rund", "lang", "tofarvet"], "fremragende", "Fremragende udtrykker en tydelig positiv vurdering."],
      ["Hvilket ord beskriver grundleddet i 'Eleverne blev stille'?", ["stille", "Eleverne", "blev", "ingen"], "stille", "Stille er et tillægsord, der fungerer som omsagnsled til grundleddet."],
      ["Hvilken række viser korrekt gradbøjning?", ["god, bedre, bedst", "god, godere, godest", "god, bedst, bedre", "god, mere god, mest god"], "god, bedre, bedst", "God gradbøjes uregelmæssigt."],
    ]),
    udfordring: set([
      ["Hvad er effekten af 'brutal' i 'en brutal beslutning'?", ["Det tilfører en negativ vurdering", "Det gør beslutning til udsagnsord", "Det viser tid", "Det gør sætningen passiv"], "Det tilfører en negativ vurdering", "Tillægsord kan styre læserens vurdering af et navneord."],
      ["Hvilken formulering er mest neutral?", ["en stor ændring", "en katastrofal ændring", "en genial ændring", "en vanvittig ændring"], "en stor ændring", "Stor beskriver omfang uden samme tydelige vurdering som de øvrige ord."],
      ["Hvilken analyse er korrekt i 'Den anklagede elev svarede'?", ["Anklagede fungerer som tillægsord og beskriver elev", "Anklagede er altid udsagnsled", "Elev er et biord", "Den er et udsagnsord"], "Anklagede fungerer som tillægsord og beskriver elev", "En kort tillægsform kan bruges adjektivisk og beskrive et navneord."],
      ["Hvorfor kan tillægsord gøre argumentation mindre neutral?", ["De kan indbygge vurderinger i beskrivelsen", "De fjerner alle navneord", "De gør alle udsagn til spørgsmål", "De markerer altid fortid"], "De kan indbygge vurderinger i beskrivelsen", "Ord som uansvarlig eller fremragende påvirker læserens syn på det beskrevne."],
      ["Hvilken omskrivning viser mest præcis karakteristik?", ["en nervøs elev → en rastløs, flakkende elev", "en nervøs elev → en elev", "en nervøs elev → eleven var der", "en nervøs elev → en meget ting"], "en nervøs elev → en rastløs, flakkende elev", "Mere specifikke egenskaber giver et tydeligere billede, hvis de passer til teksten."],
    ]),
  },

  Stedord: {
    basis: set([
      ["Hvilket ord er et stedord?", ["hun", "pige", "løber", "glad"], "hun", "Hun står i stedet for et navneord eller navn."],
      ["Hvilket er et personligt stedord?", ["jeg", "min", "denne", "som"], "jeg", "Jeg er et personligt stedord."],
      ["Hvilket er et ejestedord?", ["min", "jeg", "mig", "hvem"], "min", "Min viser ejerskab og er et possessivt stedord."],
      ["Hvilket stedord passer? 'Maja så ___ i spejlet.'", ["sig", "hende", "hun", "sin"], "sig", "Når Maja ser sig selv, bruges det refleksive stedord sig."],
      ["Hvad henviser 'de' til i 'Eleverne kom. De satte sig.'?", ["Eleverne", "kom", "satte", "sig"], "Eleverne", "Stedordet de erstatter navneordet eleverne."],
    ]),
    traening: set([
      ["Vælg korrekt: 'Anna tog ___ jakke på.'", ["sin", "hendes", "hun", "sig"], "sin", "Når jakken tilhører sætningens grundled Anna, bruges sin."],
      ["Vælg korrekt: 'Anna tog Marias jakke og tog ___ på.'", ["den", "sin", "sig", "hun"], "den", "Den henviser til jakken og fungerer som personligt/demonstrativt stedord i sammenhængen."],
      ["Hvilket ord er et relativt stedord i 'Bogen, som jeg læser, er god'?", ["som", "Bogen", "jeg", "god"], "som", "Som indleder her en relativ ledsætning og henviser til bogen."],
      ["Hvilket er et påpegende stedord?", ["denne", "min", "jeg", "hvem"], "denne", "Denne peger på en bestemt person eller ting."],
      ["Vælg korrekt: 'Drengene vaskede ___ hænder.'", ["deres", "sig", "de", "dem"], "deres", "Deres er ejestedord og viser, at hænderne tilhører drengene."],
    ]),
    udfordring: set([
      ["Hvad er forskellen på 'sin' og 'hendes' i 'Sara tog sin/hendes bog'?", ["Sin henviser til Sara; hendes henviser normalt til en anden kvinde", "De betyder altid præcis det samme", "Sin er et udsagnsord", "Hendes kan kun bruges i flertal"], "Sin henviser til Sara; hendes henviser normalt til en anden kvinde", "Refleksivt ejestedord knytter ejerskabet til sætningens grundled."],
      ["Hvor er henvisningen uklar?", ["Da Maja talte med Sara, sagde hun, at prøven var svær.", "Maja sagde: 'Prøven er svær.'", "Sara læste prøven.", "Prøven var svær."], "Da Maja talte med Sara, sagde hun, at prøven var svær.", "Hun kan grammatisk henvise til både Maja og Sara."],
      ["Hvilken omskrivning fjerner pronomen-tvetydigheden?", ["Da Maja talte med Sara, sagde Maja, at prøven var svær.", "Da Maja talte med Sara, sagde hun det.", "Da hun talte med hende, sagde hun noget.", "Hun sagde, at hun var enig med hende."], "Da Maja talte med Sara, sagde Maja, at prøven var svær.", "Navnet gør det entydigt, hvem der taler."],
      ["Hvilken effekt kan 'vi' have i argumentation?", ["Det kan konstruere et fællesskab mellem afsender og modtagere", "Det gør teksten automatisk objektiv", "Det er altid et ejestedord", "Det markerer fortid"], "Det kan konstruere et fællesskab mellem afsender og modtagere", "Pronomenvalg kan placere mennesker indenfor eller udenfor et fællesskab."],
      ["Hvilken formulering skaber størst afstand til en gruppe?", ["De forstår ikke problemet.", "Vi forstår problemet.", "Jeg forstår problemet.", "Du forstår problemet."], "De forstår ikke problemet.", "De kan fremstille gruppen som nogen udenfor afsenderens fællesskab."],
    ]),
  },

  Biord: {
    basis: set([
      ["Hvilket ord er et biord?", ["meget", "stor", "hus", "løber"], "meget", "Meget kan graduere fx et tillægsord: meget stor."],
      ["Hvilket biord viser tid?", ["i går", "der", "langsomt", "måske"], "i går", "I går fortæller, hvornår noget sker."],
      ["Hvilket biord viser sted?", ["her", "ofte", "meget", "måske"], "her", "Her fortæller, hvor noget sker."],
      ["Hvilket biord viser måde?", ["roligt", "snart", "der", "måske"], "roligt", "Roligt fortæller, hvordan handlingen udføres."],
      ["Hvilket ord negerer sætningen i 'Hun kommer ikke'?", ["ikke", "Hun", "kommer", "ingen"], "ikke", "Ikke er et nægtende biord."],
    ]),
    traening: set([
      ["Hvilket er et modalbiord?", ["måske", "der", "i går", "hurtigt"], "måske", "Måske udtrykker usikkerhed eller mulighed."],
      ["Hvad gør 'meget' i 'meget vanskelig'?", ["Graderer tillægsordet", "Er grundled", "Viser sted", "Er udsagnsled"], "Graderer tillægsordet", "Meget forstærker graden af egenskaben vanskelig."],
      ["Hvilket biord kommenterer hele udsagnet?", ["heldigvis", "hurtigt", "der", "i morgen"], "heldigvis", "Heldigvis udtrykker afsenderens vurdering af hele situationen."],
      ["Hvilken sætning bruger 'hurtigt' som biord?", ["Hun løber hurtigt.", "Den hurtige bil kører.", "Bilen er hurtig.", "En hurtig løber kom."], "Hun løber hurtigt.", "Hurtigt beskriver her måden, hun løber på."],
      ["Hvilket ord viser hyppighed?", ["ofte", "her", "måske", "meget"], "ofte", "Ofte fortæller, hvor hyppigt noget sker."],
    ]),
    udfordring: set([
      ["Hvad er effekten af 'måske' i 'Det er måske rigtigt'?", ["Det gør udsagnet mindre sikkert", "Det gør udsagnet mere kategorisk", "Det viser sted", "Det gør sætningen passiv"], "Det gør udsagnet mindre sikkert", "Modalbiordet markerer usikkerhed eller forbehold."],
      ["Hvilket biord gør udsagnet mest kategorisk?", ["helt sikkert", "måske", "muligvis", "formentlig"], "helt sikkert", "Hele udtrykket signalerer høj sikkerhed."],
      ["Hvilken analyse er korrekt i 'Desværre tabte holdet'?", ["Desværre er et sætningsbiord, der viser afsenderens vurdering", "Desværre beskriver holdet", "Desværre er et navneord", "Desværre er grundled"], "Desværre er et sætningsbiord, der viser afsenderens vurdering", "Biordet kommenterer hele udsagnet."],
      ["Hvordan ændres tonen ved 'Du har åbenbart glemt det'?", ["Åbenbart kan signalere irritation eller vurdering af modtageren", "Åbenbart gør sætningen neutral", "Åbenbart viser kun sted", "Åbenbart fjerner grundleddet"], "Åbenbart kan signalere irritation eller vurdering af modtageren", "Sætningsbiord kan bære en tydelig pragmatisk tone."],
      ["Hvilken formulering er mest forsigtig?", ["Det er muligvis en fejl.", "Det er en fejl.", "Det er helt sikkert en fejl.", "Det er uden tvivl en fejl."], "Det er muligvis en fejl.", "Muligvis nedtoner sikkerheden og gør udsagnet mindre kategorisk."],
    ]),
  },

  "Grundled og udsagnsled": {
    basis: set([
      ["Find grundleddet: 'Katten sover.'", ["Katten", "sover", "Katten sover", "ingen"], "Katten", "Katten er den, der udfører handlingen."],
      ["Find udsagnsleddet: 'Katten sover.'", ["sover", "Katten", "Katten sover", "ingen"], "sover", "Sover fortæller handlingen."],
      ["Hvad er grundleddet i 'Børnene har spist'?", ["Børnene", "har spist", "spist", "har"], "Børnene", "Børnene er dem, der har spist."],
      ["Hvad er udsagnsleddet i 'Børnene har spist'?", ["har spist", "Børnene", "spist", "har"], "har spist", "Hele verbalkæden udgør udsagnsleddet."],
      ["Find grundleddet: 'I morgen kommer læreren.'", ["læreren", "I morgen", "kommer", "I morgen kommer"], "læreren", "Ordstillingen ændrer ikke, at læreren er den, der kommer."],
    ]),
    traening: set([
      ["Hvad er udsagnsleddet i 'Hun vil gerne rejse'?", ["vil rejse", "Hun", "gerne", "rejse"], "vil rejse", "Modalverbet vil og hovedverbet rejse udgør verballeddet."],
      ["Find grundleddet i spørgsmålet 'Kommer du i morgen?'", ["du", "Kommer", "i morgen", "Kommer du"], "du", "I spørgsmål står verbet ofte før grundleddet, men du er stadig den, der kommer."],
      ["Find udsagnsleddet: 'Planen blev ændret.'", ["blev ændret", "Planen", "ændret", "blev"], "blev ændret", "Passivkonstruktionen består af hjælpeverbum og kort tillægsform."],
      ["Hvilken sætning har omvendt ordstilling?", ["I går læste vi bogen.", "Vi læste bogen i går.", "Vi læser bogen.", "Bogen er spændende."], "I går læste vi bogen.", "Når et andet led står først, står det finitte verbum typisk før grundleddet i en helsætning."],
      ["Hvilket spørgsmål hjælper med at finde grundleddet i 'På bordet ligger bogen'?", ["Hvad ligger?", "Hvor ligger?", "Hvornår ligger?", "Hvordan ligger?"], "Hvad ligger?", "Svaret 'bogen' er grundleddet."],
    ]),
    udfordring: set([
      ["Hvad er grundleddet i 'Der står tre elever udenfor'?", ["tre elever", "Der", "står", "udenfor"], "tre elever", "Der er formelt forfelt, mens 'tre elever' er det egentlige indholdsmæssige grundled."],
      ["Hvad er udsagnsleddet i 'Hun må være blevet forsinket'?", ["må være blevet forsinket", "må", "blevet forsinket", "Hun"], "må være blevet forsinket", "Hele verbalkæden udgør udsagnsleddet."],
      ["Hvilken analyse er korrekt i 'Kun én elev bestod'?", ["'én elev' er grundled; 'bestod' er udsagnsled", "'Kun' er grundled", "'elev bestod' er udsagnsled", "Sætningen har intet grundled"], "'én elev' er grundled; 'bestod' er udsagnsled", "Kun fokuserer grundleddet, men er ikke selv grundled."],
      ["Hvorfor kan man ikke altid finde grundleddet ved at tage første ord?", ["Dansk tillader andre led i forfeltet før verbet og grundleddet", "Grundled står altid sidst", "Første ord er altid et biord", "Kun spørgsmål har grundled"], "Dansk tillader andre led i forfeltet før verbet og grundleddet", "Tid, sted, objekt m.m. kan placeres først."],
      ["Hvad er det underforståede grundled i 'Luk døren!'?", ["du", "døren", "Luk", "ingen overhovedet"], "du", "I bydemåde er grundleddet ofte ikke skrevet, men forstås som du/I."],
    ]),
  },

  Genstandsled: {
    basis: set([
      ["Find genstandsleddet: 'Maja læser bogen.'", ["bogen", "Maja", "læser", "Maja læser"], "bogen", "Bogen er det, handlingen retter sig mod: Maja læser hvad?"],
      ["Find genstandsleddet: 'Han spiser æblet.'", ["æblet", "Han", "spiser", "ingen"], "æblet", "Spiser hvad? Æblet."],
      ["Hvilket spørgsmål kan hjælpe med at finde genstandsleddet?", ["Hvad/hvem + grundled + udsagnsled?", "Hvornår?", "Hvor?", "Hvorfor?"], "Hvad/hvem + grundled + udsagnsled?", "Man spørger fx: Hvad læser Maja?"],
      ["Hvad er genstandsleddet i 'Vi så hende'?", ["hende", "Vi", "så", "ingen"], "hende", "Så hvem? Hende."],
      ["Hvilken sætning har et genstandsled?", ["Hun købte en bog.", "Hun sov.", "Hun blev træt.", "Hun er lærer."], "Hun købte en bog.", "Købte hvad? En bog."],
    ]),
    traening: set([
      ["Find det direkte genstandsled: 'Læreren gav eleven en bog.'", ["en bog", "eleven", "Læreren", "gav"], "en bog", "Det direkte genstandsled er det, der gives: en bog."],
      ["Find det indirekte genstandsled: 'Læreren gav eleven en bog.'", ["eleven", "en bog", "Læreren", "gav"], "eleven", "Eleven er modtageren og fungerer som indirekte genstandsled."],
      ["Hvilket stedord kan erstatte genstandsleddet i 'Jeg læser bogen'?", ["den", "jeg", "min", "som"], "den", "Bogen kan erstattes af stedordet den: Jeg læser den."],
      ["Hvad er genstandsleddet i 'Hun fortalte os historien'?", ["historien", "os", "Hun", "fortalte"], "historien", "Historien er det direkte genstandsled; os er modtageren."],
      ["Hvilken sætning har ikke et genstandsled?", ["Barnet sover.", "Barnet læser bogen.", "Barnet sparker bolden.", "Barnet ser filmen."], "Barnet sover.", "Sover er her intransitivt og tager ikke et objekt."],
    ]),
    udfordring: set([
      ["Hvad sker der ofte med genstandsleddet ved passiv? 'Læreren rettede opgaven' → 'Opgaven blev rettet.'", ["Det bliver grundled i passivsætningen", "Det forsvinder altid", "Det bliver biord", "Det bliver udsagnsled"], "Det bliver grundled i passivsætningen", "Det direkte objekt i aktiv kan typisk blive subjekt i passiv."],
      ["Hvilken sætning indeholder både direkte og indirekte genstandsled?", ["Hun sendte ham brevet.", "Hun sov længe.", "Hun blev glad.", "Hun løb hjem."], "Hun sendte ham brevet.", "Ham er modtager; brevet er det, der sendes."],
      ["Hvad er genstandsleddet i 'Det overraskede mig, at hun kom'?", ["mig", "Det", "overraskede", "at hun kom"], "mig", "Overraskede hvem? Mig. At-ledsætningen udfylder samtidig indholdet i det foreløbige 'det'."],
      ["Hvilken test understøtter, at 'planen' er objekt i 'De ændrede planen'?", ["Planen kan blive grundled i passiv: 'Planen blev ændret'", "Planen står sidst", "Planen er et navneord", "Der er et punktum"], "Planen kan blive grundled i passiv: 'Planen blev ændret'", "Passivtesten er et stærkt grammatisk tegn på direkte objekt."],
      ["Hvilken analyse er korrekt i 'Hun kaldte ham en helt'?", ["Ham er genstandsled; 'en helt' er omsagnsled til genstandsleddet", "En helt er udsagnsled", "Ham er grundled", "Kaldte er genstandsled"], "Ham er genstandsled; 'en helt' er omsagnsled til genstandsleddet", "Ham er den person, handlingen retter sig mod, mens 'en helt' beskriver ham."],
    ]),
  },

  Omsagnsled: {
    basis: set([
      ["Find omsagnsleddet: 'Maja er lærer.'", ["lærer", "Maja", "er", "ingen"], "lærer", "Lærer fortæller, hvad Maja er."],
      ["Find omsagnsleddet: 'Huset er rødt.'", ["rødt", "Huset", "er", "ingen"], "rødt", "Rødt beskriver grundleddet huset gennem verbet er."],
      ["Hvilken sætning har omsagnsled?", ["Hun blev træt.", "Hun løb hurtigt.", "Hun læste bogen.", "Hun spiste."], "Hun blev træt.", "Træt beskriver grundleddet efter kopulaverbet blev."],
      ["Hvilket udsagnsord bruges ofte sammen med omsagnsled til grundled?", ["være", "sparke", "læse", "købe"], "være", "Være forbinder ofte grundleddet med en beskrivelse eller identitet."],
      ["Hvad beskriver 'glad' i 'Eleven virker glad'?", ["Eleven", "virker", "ingen", "en skjult genstand"], "Eleven", "Glad fungerer som omsagnsled og beskriver grundleddet."],
    ]),
    traening: set([
      ["Hvad er omsagnsleddet i 'Hun blev klassens formand'?", ["klassens formand", "Hun", "blev", "klassens"], "klassens formand", "Udtrykket identificerer, hvad hun blev."],
      ["Hvad er omsagnsleddet i 'Planen virker realistisk'?", ["realistisk", "Planen", "virker", "ingen"], "realistisk", "Realistisk beskriver grundleddet gennem verbet virker."],
      ["Hvilken sætning har omsagnsled til genstandsled?", ["De malede døren blå.", "De malede døren.", "Døren var blå.", "De købte maling."], "De malede døren blå.", "Blå beskriver genstandsleddet døren efter handlingen."],
      ["Hvad er omsagnsled til genstandsled i 'De kaldte hende modig'?", ["modig", "hende", "De", "kaldte"], "modig", "Modig beskriver genstandsleddet hende."],
      ["Hvilken sætning har ikke omsagnsled?", ["Han åbnede døren.", "Han er træt.", "Han blev lærer.", "Han virker rolig."], "Han åbnede døren.", "Åbnede tager et objekt, men beskriver ikke grundleddet gennem et omsagnsled."],
    ]),
    udfordring: set([
      ["Hvilken analyse er korrekt i 'De valgte hende til formand'?", ["Hende er genstandsled; 'til formand' fungerer som prædikativ beskrivelse af hende", "Formand er udsagnsled", "Hende er grundled", "De er omsagnsled"], "Hende er genstandsled; 'til formand' fungerer som prædikativ beskrivelse af hende", "Udtrykket fortæller, hvilken rolle genstandsleddet får."],
      ["Hvordan skelner man 'Hun blev vred' fra 'Hun slog vredt i bordet'?", ["Vred er omsagnsled; vredt er biord til handlingen", "Begge er genstandsled", "Begge er grundled", "Vredt er navneord"], "Vred er omsagnsled; vredt er biord til handlingen", "I første sætning beskrives personen; i anden beskrives måden, hun slog på."],
      ["Hvilken sætning har et navneord som omsagnsled?", ["Han er læge.", "Han arbejder længe.", "Han læser bøger.", "Han taler roligt."], "Han er læge.", "Læge identificerer grundleddet og fungerer som omsagnsled."],
      ["Hvilken sætning har et tillægsord som omsagnsled til genstandsled?", ["De gjorde opgaven lettere.", "Opgaven var lettere.", "De læste opgaven.", "De skrev hurtigt."], "De gjorde opgaven lettere.", "Lettere beskriver objektet opgaven som resultat af handlingen."],
      ["Hvorfor er 'lærer' ikke genstandsled i 'Hun er lærer'?", ["Verbet 'er' udtrykker identitet, så 'lærer' beskriver grundleddet", "Lærer er et biord", "Sætningen mangler grundled", "Lærer er udsagnsled"], "Verbet 'er' udtrykker identitet, så 'lærer' beskriver grundleddet", "Kopulaverbet forbinder subjektet med et prædikativt led i stedet for et objekt."],
    ]),
  },

  "Hel- og ledsætninger": {
    basis: set([
      ["Hvilken del er en helsætning?", ["Hun læser bogen.", "fordi hun læser bogen", "når bogen slutter", "som hun læser"], "Hun læser bogen.", "En helsætning kan stå selvstændigt som en fuld ytring."],
      ["Hvilken del er en ledsætning?", ["fordi hun er træt", "Hun er træt.", "Hun går hjem.", "De læser."], "fordi hun er træt", "Fordi indleder en underordnet sætning, som ikke normalt står alene."],
      ["Hvilket ord indleder ledsætningen i 'Jeg går, fordi jeg er træt'?", ["fordi", "Jeg", "går", "træt"], "fordi", "Fordi er en underordnende konjunktion."],
      ["Find ledsætningen: 'Når skolen slutter, går vi hjem.'", ["Når skolen slutter", "går vi hjem", "skolen", "vi hjem"], "Når skolen slutter", "Når-leddet er underordnet helsætningen."],
      ["Hvad er en vigtig forskel?", ["En helsætning kan normalt stå alene; en ledsætning er underordnet", "Ledsætninger har aldrig verber", "Helsætninger har aldrig grundled", "Ledsætninger er altid spørgsmål"], "En helsætning kan normalt stå alene; en ledsætning er underordnet", "Begge kan have grundled og udsagnsled, men de har forskellig syntaktisk status."],
    ]),
    traening: set([
      ["Brug ikke-prøven: Hvilken er en ledsætning?", ["fordi hun ikke kommer", "hun kommer ikke", "de læser ikke", "vi går ikke"], "fordi hun ikke kommer", "I ledsætningen står ikke typisk før det finitte udsagnsord."],
      ["Hvilken er helsætningens ordstilling?", ["Hun kommer ikke.", "fordi hun ikke kommer", "at hun ikke kommer", "når hun ikke kommer"], "Hun kommer ikke.", "I en almindelig helsætning står ikke efter det finitte verbum."],
      ["Hvad er ledsætningen i 'Jeg ved, at hun ikke kommer'?", ["at hun ikke kommer", "Jeg ved", "hun ikke", "ved at"], "at hun ikke kommer", "At-leddet fungerer som underordnet indhold til 'Jeg ved'."],
      ["Hvilken sætning begynder med en foranstillet ledsætning?", ["Hvis det regner, bliver vi hjemme.", "Vi bliver hjemme.", "Vi bliver måske hjemme.", "Hjemme bliver vi."], "Hvis det regner, bliver vi hjemme.", "Hvis-ledsætningen står før helsætningen."],
      ["Hvilket ord kan indlede en relativ ledsætning?", ["som", "men", "og", "eller"], "som", "Som kan indlede en relativ ledsætning, der beskriver et navneord."],
    ]),
    udfordring: set([
      ["Hvilken analyse er korrekt i 'Jeg tror, at når hun kommer, går vi'?", ["'at når hun kommer, går vi' er en ledsætning, som indeholder endnu en ledsætning", "Der er kun én sætning", "Alle dele er helsætninger", "'når hun kommer' er grundled"], "'at når hun kommer, går vi' er en ledsætning, som indeholder endnu en ledsætning", "Sætninger kan være indlejret i hinanden."],
      ["Hvorfor er 'at løbe' ikke en ledsætning?", ["Det mangler et finit udsagnsord og er en infinitivforbindelse", "At kan aldrig indlede ledsætninger", "Løbe er et navneord", "Det står forrest"], "Det mangler et finit udsagnsord og er en infinitivforbindelse", "En ledsætning har normalt et finit verballed, fx 'at hun løber'."],
      ["Hvilken del er relativ ledsætning i 'Eleven, som vandt prisen, smilede'?", ["som vandt prisen", "Eleven", "smilede", "vandt prisen smilede"], "som vandt prisen", "Relativsætningen beskriver eleven."],
      ["Hvilken test er mest nyttig ved tvivl om hel- og ledsætning?", ["Se placeringen af sætningsadverbial som 'ikke' og find finit verbum", "Tæl bogstaver", "Se om sætningen er lang", "Find et komma og stop analysen"], "Se placeringen af sætningsadverbial som 'ikke' og find finit verbum", "Ikke-prøven sammen med analyse af grundled og finit verbum er mere sikker end længde eller pauser."],
      ["Hvilken forklaring er korrekt om 'men'?", ["Men sideordner typisk helsætninger; det gør ikke den ene til ledsætning", "Men indleder altid ledsætning", "Men er et udsagnsord", "Men fjerner grundleddet"], "Men sideordner typisk helsætninger; det gør ikke den ene til ledsætning", "Sideordnende konjunktioner forbinder led på samme syntaktiske niveau."],
    ]),
  },
};