import { READING_STRATEGIES, type ReadingStrategy } from "../student-reading-exam/reading-exam-bank";

export type StrategyTrainingQuestion = {
  id: string;
  q: string;
  options: string[];
  answer: string;
  why: string;
  strategy: ReadingStrategy;
  minGrade: 6 | 7 | 8 | 9;
};

export type StrategyTrainingPassage = {
  strategy: ReadingStrategy;
  title: string;
  genre: string;
  blocks: Partial<Record<6 | 7 | 8 | 9, string>>;
  questions: StrategyTrainingQuestion[];
};

export type StrategyTrainingRound = {
  strategy: ReadingStrategy;
  title: string;
  genre: string;
  text: string;
  questions: StrategyTrainingQuestion[];
  freshCount: number;
  availableCount: number;
};

const q = (id:string,text:string,options:string[],answer:string,why:string,strategy:ReadingStrategy,minGrade:6|7|8|9):StrategyTrainingQuestion => ({id,q:text,options,answer,why,strategy,minGrade});

const passages: Record<ReadingStrategy, StrategyTrainingPassage> = {
  "Skimning og overblik": {
    strategy: "Skimning og overblik",
    title: "Ungdomshuset åbner nye værksteder",
    genre: "Kommunal informationsside",
    blocks: {
      6: `UNGDOMSHUSET NORD · NYT EFTERÅRSPROGRAM

Fra oktober åbner Ungdomshuset Nord tre nye værksteder for unge fra 11 til 16 år.

KREATIVT VÆRKSTED
Tirsdag kl. 15.30–17.00. Her kan man arbejde med tegning, tryk, foto og små designprojekter. Man behøver ikke have prøvet det før.

TEKNOLOGILAB
Onsdag kl. 16.00–18.00. Deltagerne kan bygge små robotter, programmere enkle spil og prøve 3D-print. Der er plads til 18 deltagere.

MAD FRA VERDEN
Torsdag kl. 16.30–18.30. Hver uge vælger holdet et nyt land og laver en ret sammen. Råvarer er inkluderet.

TILMELDING
Alle aktiviteter er gratis. Man tilmelder sig på ungdomshusets hjemmeside. Hvis et hold er fyldt, kan man skrive sig på venteliste.`,
      7: `

HVEM KAN DELTAGE?
Man behøver ikke bo i bydelen, men deltagere under 13 år skal have en forælder til at godkende tilmeldingen digitalt. Man kan godt være tilmeldt flere værksteder samtidig.

ÅBENT HUS
Lørdag 26. september kl. 11–14 kan man besøge huset, møde underviserne og prøve korte aktiviteter uden tilmelding.`,
      8: `

HVORFOR NYE VÆRKSTEDER?
Ungdomshuset har spurgt 214 unge om, hvad de savnede efter skoletid. Flest ønskede kreative aktiviteter, madlavning og teknologi. Huset vil evaluere de nye værksteder efter tre måneder og justere programmet efter deltagernes feedback.`,
      9: `

PRAKTISK OM DATA
Ved tilmelding registrerer ungdomshuset navn, alder og kontaktoplysninger. Oplysningerne bruges til holdadministration og slettes efter sæsonens afslutning, medmindre deltageren aktivt vælger at modtage information om næste sæson.`,
    },
    questions: [
      q("skim-1","Hvad handler siden overordnet om?",["Nye fritidsværksteder i et ungdomshus","En skoleudflugt til et museum","Regler for offentlig transport","En konkurrence om mad"],"Nye fritidsværksteder i et ungdomshus","Titel og mellemoverskrifter viser hurtigt, at siden præsenterer nye aktiviteter.","Skimning og overblik",6),
      q("skim-2","Hvilken teksttype er det først og fremmest?",["Praktisk informationsside","Novelle","Personligt brev","Anmeldelse"],"Praktisk informationsside","Teksten er opdelt i overskrifter med tider, aktiviteter og tilmelding.","Skimning og overblik",6),
      q("skim-3","Hvilken mellemoverskrift vil være mest relevant, hvis du vil vide, hvordan man får en plads?",["TILMELDING","KREATIVT VÆRKSTED","MAD FRA VERDEN","TEKNOLOGILAB"],"TILMELDING","Ved skimning bruger man overskrifter til hurtigt at finde det relevante område.","Skimning og overblik",6),
      q("skim-4","Hvad viser tekstens opbygning?",["At læseren skal kunne finde praktiske oplysninger hurtigt","At teksten skal læses som en spændingshistorie","At forfatteren skjuler hovedpointen til sidst","At alle afsnit handler om samme aktivitet"],"At læseren skal kunne finde praktiske oplysninger hurtigt","Korte sektioner og tydelige overskrifter gør teksten let at orientere sig i.","Skimning og overblik",6),
      q("skim-5","Hvis du kun har 15 sekunder, hvad bør du læse først for at skabe overblik?",["Titel og mellemoverskrifter","Alle sætninger fra start til slut","Kun den sidste linje","Kun klokkeslættene"],"Titel og mellemoverskrifter","Skimning starter med tekstens signaler: titel, overskrifter og tydelige nøgleord.","Skimning og overblik",6),
      q("skim-6","Hvilken sektion fortæller mest direkte, om aktiviteterne koster noget?",["TILMELDING","TEKNOLOGILAB","KREATIVT VÆRKSTED","MAD FRA VERDEN"],"TILMELDING","Overskriften leder dig til den praktiske information, hvor det står, at aktiviteterne er gratis.","Skimning og overblik",6),
      q("skim-7","Hvilken ny del bliver vigtigst for en 12-årig, der vil tilmelde sig?",["HVEM KAN DELTAGE?","ÅBENT HUS","KREATIVT VÆRKSTED","NYT EFTERÅRSPROGRAM"],"HVEM KAN DELTAGE?","Alderskravet og forældregodkendelsen står samlet under denne overskrift.","Skimning og overblik",7),
      q("skim-8","Hvilken overskrift peger tydeligst på tekstens begrundelse frem for praktiske oplysninger?",["HVORFOR NYE VÆRKSTEDER?","TILMELDING","ÅBENT HUS","TEKNOLOGILAB"],"HVORFOR NYE VÆRKSTEDER?","Den sektion forklarer baggrunden og ikke bare hvad, hvor og hvornår.","Skimning og overblik",8),
      q("skim-9","Hvilken læser har især brug for sektionen PRAKTISK OM DATA?",["En der vil vide, hvordan personoplysninger bruges","En der vil lære at 3D-printe","En der vil kende opskriften fra madholdet","En der vil vide, hvem underviserne er"],"En der vil vide, hvordan personoplysninger bruges","Ved skimning kobler man læseformålet til den overskrift, der sandsynligvis rummer svaret.","Skimning og overblik",9),
    ],
  },
  "Scanning og informationssøgning": {
    strategy: "Scanning og informationssøgning",
    title: "En lørdag på Scienceværftet",
    genre: "Program, priser og praktisk information",
    blocks: {
      6: `SCIENCEVÆRFTET · LØRDAGSPROGRAM

09.30 Dørene åbner
10.00 Eksperimentshow i Sal A · 35 min · gratis med entré
10.30 Robotværksted i Lab 2 · 60 min · fra 10 år · 25 kr.
11.15 Planetarievisning · 40 min · 30 pladser
12.00 Frokostforedrag: Liv i havet · 30 min
13.00 Byg en bro-konkurrence · 75 min · hold på 2–4 personer
13.30 Eksperimentshow i Sal A · 35 min
14.30 Kemi i køkkenet · 50 min · fra 12 år
15.30 Sidste planetarievisning · 40 min
16.30 Scienceværftet lukker

ENTRÉ
Børn 6–15 år: 55 kr. Voksne: 95 kr. Børn under 6 år: gratis.

MAD
Caféen er åben 10.00–16.00. Medbragt mad må spises i gårdhaven.`,
      7: `

BOOKING
Robotværksted og planetarievisning kan bookes hjemmefra. Uafhentede reservationer frigives 10 minutter før start. Bro-konkurrencen kræver tilmelding i informationsskranken senest kl. 12.30.

TRANSPORT
Bus 21 stopper ved Havnegade, 250 meter fra indgangen. Cykelparkering findes ved den østlige port.`,
      8: `

TILGÆNGELIGHED
Sal A, caféen og planetariet kan nås med elevator. Lab 2 har en arbejdsstation med hæve-sænkebord. Gæster, der har brug for ekstra tid ved indgang eller aktivitet, kan henvende sig i informationsskranken.`,
      9: `

BILLETTER
Onlinebilletter kan refunderes indtil 24 timer før besøget. Aktivitetsgebyrer refunderes kun, hvis Scienceværftet aflyser aktiviteten. Årskortholdere betaler ikke entré, men betaler stadig eventuelle aktivitetsgebyrer.`,
    },
    questions: [
      q("scan-1","Hvornår begynder Robotværksted?",["10.30","10.00","11.15","13.00"],"10.30","Scan programmet efter ordet Robotværksted og læs tidspunktet ved siden af.","Scanning og informationssøgning",6),
      q("scan-2","Hvor længe varer den første planetarievisning?",["40 minutter","35 minutter","50 minutter","75 minutter"],"40 minutter","Find Planetarievisning og læs varigheden direkte.","Scanning og informationssøgning",6),
      q("scan-3","Hvad koster entré for en 13-årig?",["55 kr.","95 kr.","25 kr.","Gratis"],"55 kr.","Scan prisafsnittet efter aldersgruppen 6–15 år.","Scanning og informationssøgning",6),
      q("scan-4","Hvor må man spise medbragt mad?",["I gårdhaven","I Lab 2","I planetariet","Kun udenfor området"],"I gårdhaven","Nøgleordet medbragt mad leder direkte til madsektionen.","Scanning og informationssøgning",6),
      q("scan-5","Hvilken aktivitet starter kl. 14.30?",["Kemi i køkkenet","Eksperimentshow","Byg en bro-konkurrence","Planetarievisning"],"Kemi i køkkenet","Scan venstre side efter 14.30 og læs aktiviteten på samme linje.","Scanning og informationssøgning",6),
      q("scan-6","Hvor gammel skal man mindst være for Kemi i køkkenet?",["12 år","10 år","6 år","15 år"],"12 år","Alderskravet står direkte på aktivitetslinjen.","Scanning og informationssøgning",6),
      q("scan-7","Hvornår skal man senest tilmelde sig bro-konkurrencen?",["12.30","13.00","11.30","10 minutter før"],"12.30","Bookingafsnittet giver et præcist tidspunkt for denne aktivitet.","Scanning og informationssøgning",7),
      q("scan-8","Hvor findes en arbejdsstation med hæve-sænkebord?",["I Lab 2","I Sal A","I caféen","Ved den østlige port"],"I Lab 2","Scan tilgængelighedsafsnittet efter hæve-sænkebord.","Scanning og informationssøgning",8),
      q("scan-9","En årskortholder vil på Robotværksted. Hvilken betaling nævnes stadig?",["Aktivitetsgebyret","Fuld voksenentré","Et særligt årskortgebyr","Ingen betaling overhovedet"],"Aktivitetsgebyret","Billettillægget siger, at årskortholdere stadig betaler eventuelle aktivitetsgebyrer.","Scanning og informationssøgning",9),
    ],
  },
  "Hovedindhold": {
    strategy: "Hovedindhold",
    title: "Hvorfor pauser kan gøre læring bedre",
    genre: "Faglig artikel",
    blocks: {
      6: `Når man lærer noget nyt, kan det virke logisk at arbejde så længe som muligt uden stop. Men hjernen arbejder ikke nødvendigvis bedst på den måde. Opmærksomhed falder ofte, når vi laver den samme krævende opgave længe.

En kort pause kan hjælpe, fordi man skifter aktivitet og giver opmærksomheden mulighed for at blive friskere. Det betyder ikke, at enhver pause automatisk hjælper. Hvis fem minutters pause bliver til tyve minutters video, kan det være svært at komme tilbage til arbejdet.

Gode pauser er derfor tydelige og afgrænsede. Man kan rejse sig, hente vand, kigge ud ad vinduet eller gå en kort tur. Pointen er ikke at undgå arbejde, men at vende tilbage med bedre fokus.

Pauser virker bedst sammen med en plan. Hvis man på forhånd beslutter, hvad man skal nå i næste arbejdsperiode, bliver det lettere at begynde igen.`,
      7: `

Forskellige opgaver kræver forskellige rytmer. En let læseopgave kan måske klares i længere tid, mens en vanskelig matematisk problemløsning kræver hyppigere stop. Derfor findes der ikke ét perfekt antal minutter, der passer til alle mennesker og alle opgaver.`,
      8: `

Forskning i læring peger også på, at pauser mellem øvesessioner kan styrke hukommelsen. Når man vender tilbage til stoffet senere, skal hjernen hente informationen frem igen. Selve genkaldelsen er en del af læringen. Det er en anden effekt end den korte pause, der først og fremmest hjælper opmærksomheden her og nu.`,
      9: `

Det er derfor vigtigt at skelne mellem pause som restitution og mellemrum mellem øvesessioner som læringsstrategi. De to kan ligne hinanden i kalenderen, men de har ikke helt samme funktion. En god studieplan kan bruge begge dele bevidst.`,
    },
    questions: [
      q("main-1","Hvad er tekstens vigtigste pointe?",["Planlagte pauser kan støtte fokus og læring","Man bør altid arbejde uden stop","Alle pauser skal vare 20 minutter","Video er den bedste form for pause"],"Planlagte pauser kan støtte fokus og læring","Flere afsnit forklarer, hvordan korte, tydelige pauser kan hjælpe arbejdet.","Hovedindhold",6),
      q("main-2","Hvilket udsagn opsummerer bedst afsnittet om gode pauser?",["Pauser bør være korte og gøre det let at vende tilbage","Pauser skal være så underholdende som muligt","Man bør altid forlade skolen i pausen","Pauser virker kun ved læsning"],"Pauser bør være korte og gøre det let at vende tilbage","Afsnittets detaljer peger samlet på afgrænsning og tilbagevenden til opgaven.","Hovedindhold",6),
      q("main-3","Hvad er hovedformålet med at have en plan for næste arbejdsperiode?",["At gøre det lettere at komme i gang igen","At gøre pausen længere","At undgå svære opgaver","At erstatte selve arbejdet"],"At gøre det lettere at komme i gang igen","Planen nævnes som støtte til at genoptage arbejdet efter pausen.","Hovedindhold",6),
      q("main-4","Hvilken detalje er et eksempel og ikke tekstens hovedpointe?",["Man kan hente vand i en kort pause","Pauser kan hjælpe opmærksomheden","Pauser bør være afgrænsede","En plan hjælper tilbagevenden"],"Man kan hente vand i en kort pause","At hente vand er ét konkret eksempel på den bredere pointe om korte pauser.","Hovedindhold",6),
      q("main-5","Hvad advarer teksten imod?",["At en kort pause glider over i en lang afbrydelse","At man rejser sig fra stolen","At man planlægger sit arbejde","At man drikker vand"],"At en kort pause glider over i en lang afbrydelse","Videoeksemplet bruges til at vise, at en pause kan blive så lang, at det er svært at vende tilbage.","Hovedindhold",6),
      q("main-6","Hvilken overskrift passer bedst til hele teksten?",["Pauser med et formål","Sådan undgår du alt skolearbejde","Den perfekte pause er 20 minutter","Hvorfor video altid hjælper"],"Pauser med et formål","Overskriften samler tekstens hovedidé om bevidste pauser frem for bare afbrydelse.","Hovedindhold",6),
      q("main-7","Hvad tilføjer 7.-klasseafsnittet til hovedpointen?",["At den gode arbejdsrytme afhænger af opgaven og personen","At alle skal bruge samme tidsplan","At matematik aldrig kræver pauser","At lette opgaver er unødvendige"],"At den gode arbejdsrytme afhænger af opgaven og personen","Afsnittet nuancerer idéen ved at afvise én universel rytme.","Hovedindhold",7),
      q("main-8","Hvilken ny hovedidé kommer ind på 8.-klasseniveau?",["Mellemrum mellem øvesessioner kan styrke hukommelsen","Pauser gør hukommelsen dårligere","Kun fysisk aktivitet tæller som pause","Opmærksomhed er det samme som hukommelse"],"Mellemrum mellem øvesessioner kan styrke hukommelsen","Afsnittet udvider fra kortvarigt fokus til læring og genkaldelse over tid.","Hovedindhold",8),
      q("main-9","Hvilken skelnen er vigtigst i slutningen?",["Restitutionspause og mellemrum som læringsstrategi har forskellige funktioner","Alle pauser er grundlæggende ens","Kun lange pauser virker","Kalenderen bestemmer læringen"],"Restitutionspause og mellemrum som læringsstrategi har forskellige funktioner","Slutningen samler og præciserer forskellen mellem de to typer pauser.","Hovedindhold",9),
    ],
  },
  "Inferens": {
    strategy: "Inferens",
    title: "Den glemte mappe",
    genre: "Kort fortælling",
    blocks: {
      6: `Mira stod uden for naturfagslokalet og gennemgik tasken for tredje gang. Penalhus. Madpakke. Computer. Ingen blå mappe.

Inde fra lokalet kunne hun høre stole blive flyttet. I dag skulle grupperne vise deres modeller frem. Mira havde lavet tegningerne og skrevet gruppens forklaringer i den blå mappe.

“Kommer du?” spurgte Noah gennem døren.

“Om lidt.”

Mira tænkte på køkkenbordet derhjemme. Hun havde siddet der sent aftenen før. Da hun gik i seng, havde far sagt: “Jeg lægger dine ting ved døren, så du ikke glemmer dem.”

Hun tog telefonen frem. Der var en besked fra far sendt kl. 7.42: Ring når du ser det her.

Mira trykkede på opkald. Far svarede med det samme.

“Den blå?” spurgte han.

Mira lukkede øjnene. “Ja.”

“Jeg er allerede på vej.”`,
      7: `

Da Mira gik ind i lokalet, havde de andre grupper stillet deres modeller på bordene. Noah havde åbnet deres præsentation på computeren.

“Vi kan godt begynde uden mappen,” sagde han. “Du kan jo forklare tegningen.”

Mira kiggede på modellen. Hun havde troet, at hun ville blive lettet, når hun vidste, at mappen var på vej. I stedet mærkede hun, at skuldrene stadig sad helt oppe ved ørerne.`,
      8: `

Da læreren kom hen, sagde Mira selv: “Vi mangler vores mappe lige nu, men vi kan vise modellen og forklare processen. Dokumentationen kommer om lidt.”

Læreren nikkede og gik videre. Noah smilede skævt. “Det lød meget mere roligt, end du ser ud.”

“Det var også meningen,” sagde Mira.`,
      9: `

Tyve minutter senere stod far i døren med mappen. Mira vinkede tak, men tog den ikke straks. Noah var midt i forklaringen af deres forsøg, og hun ventede, til han var færdig.

Senere tænkte hun, at mappen havde været vigtig. Bare ikke på helt den måde, hun havde forestillet sig uden for døren.`,
    },
    questions: [
      q("infer-1","Hvor er den blå mappe sandsynligvis?",["Hjemme hos Mira","I naturfagslokalet","Hos Noah","På biblioteket"],"Hjemme hos Mira","Køkkenbordet, farens besked og hans svar peger samlet på, at mappen er blevet hjemme.","Inferens",6),
      q("infer-2","Hvorfor ringer far sandsynligvis allerede før Mira kontakter ham?",["Han har opdaget den glemte mappe","Han vil spørge om aftensmad","Han har glemt sin telefon","Han vil aflyse præsentationen"],"Han har opdaget den glemte mappe","Beskeden 'Ring når du ser det her' og hans første ord 'Den blå?' er tekstspor, der peger på det.","Inferens",6),
      q("infer-3","Hvordan har Mira det i begyndelsen?",["Stresset og bekymret","Ligeglad","Stolt og afslappet","Vred på Noah"],"Stresset og bekymret","Hun gennemgår tasken tre gange, bliver stående udenfor og tænker på den manglende dokumentation.","Inferens",6),
      q("infer-4","Hvorfor siger Noah, at de godt kan begynde uden mappen?",["Han vurderer, at Mira kan forklare arbejdet uden den","Han vil skjule modellen","Han har selv mappen","Han vil gå hjem"],"Han vurderer, at Mira kan forklare arbejdet uden den","Hans næste sætning er, at Mira jo kan forklare tegningen.","Inferens",6),
      q("infer-5","Hvad viser farens svar 'Den blå?'?",["Han ved allerede, hvilken ting Mira mangler","Han kan ikke huske Mira","Han tror mappen er grøn","Han har ikke læst sin egen besked"],"Han ved allerede, hvilken ting Mira mangler","Han behøver ikke få forklaret problemet, hvilket viser, at han allerede har set mappen.","Inferens",6),
      q("infer-6","Hvorfor lukker Mira øjnene, da far spørger 'Den blå?'?",["Hun får bekræftet det, hun frygtede","Hun er ved at falde i søvn","Lyset er for stærkt","Hun er vred på læreren"],"Hun får bekræftet det, hun frygtede","Reaktionen kommer netop, da det bliver klart, at mappen faktisk er glemt.","Inferens",6),
      q("infer-7","Hvad fortæller det om Mira, at hendes skuldre stadig er spændte efter farens opkald?",["Problemet handler også om selve præsentationen og ikke kun mappen","Hun er blevet kold","Hun vil ikke have mappen længere","Hun har glemt sin computer"],"Problemet handler også om selve præsentationen og ikke kun mappen","Selv da den praktiske løsning er på vej, er kroppen stadig spændt; derfor ligger noget af presset i at skulle præstere.","Inferens",7),
      q("infer-8","Hvad viser Miras rolige forklaring til læreren?",["Hun prøver at handle trods sin nervøsitet","Hun er ikke længere nervøs overhovedet","Hun vil have læreren til at aflyse","Hun har glemt, hvad projektet handler om"],"Hun prøver at handle trods sin nervøsitet","Noahs kommentar viser, at hendes rolige fremtoning ikke betyder, at følelsen er væk.","Inferens",8),
      q("infer-9","Hvad har Mira sandsynligvis lært til sidst?",["At hun kunne mere uden mappen, end hun først troede","At mapper aldrig er nyttige","At Noah bør lave alt arbejdet","At præsentationer kun handler om papir"],"At hun kunne mere uden mappen, end hun først troede","Hun lader Noah tale færdig og tænker, at mappen var vigtig, men ikke på den måde hun først forestillede sig.","Inferens",9),
    ],
  },
  "Ord i kontekst": {
    strategy: "Ord i kontekst",
    title: "Når elektronik får et længere liv",
    genre: "Faglig formidling",
    blocks: {
      6: `Mange telefoner, computere og høretelefoner bliver udskiftet, selv om kun én del er gået i stykker. Derfor arbejder flere værksteder med reparation og genbrug af elektronik.

Når en tekniker først undersøger en defekt enhed, laver teknikeren en diagnose. Her betyder diagnose ikke en sygdom. Det betyder, at man forsøger at finde årsagen til fejlen. Måske er batteriet slidt, måske er et kabel løst, eller måske er en lille komponent brændt af.

Hvis fejlen kan repareres, kan produktets levetid forlænges. Levetid betyder her den periode, hvor produktet faktisk kan bruges. Jo længere en telefon fungerer, desto senere bliver der behov for at fremstille en ny.

Nogle dele kan også høstes fra elektronik, der ikke kan reddes. At høste dele betyder, at brugbare komponenter tages ud og anvendes i andre enheder.`,
      7: `

Reparation er dog ikke altid enkel. Nogle produkter er konstrueret, så batteriet er limet fast, eller så særlige skruer kræver specialværktøj. Derfor taler man om reparerbarhed: hvor let eller svært et produkt er at skille ad, reparere og samle igen.`,
      8: `

Et andet begreb er materialegenvinding. Her bruges materialerne fra et kasseret produkt som råstof til nye produkter. Det er ikke det samme som direkte genbrug af en hel komponent. Begge dele kan mindske behovet for nye råstoffer, men processerne er forskellige.`,
      9: `

Når virksomheder beskriver et produkt som cirkulært, kan ordet derfor dække flere ting: lang levetid, mulighed for reparation, genbrug af komponenter og genanvendelse af materialer. Man må læse den konkrete forklaring for at se, hvad virksomheden faktisk mener med betegnelsen.`,
    },
    questions: [
      q("context-1","Hvad betyder 'diagnose' i denne tekst?",["At finde årsagen til en teknisk fejl","At behandle en sygdom","At købe en ny telefon","At måle skærmens størrelse"],"At finde årsagen til en teknisk fejl","Sætningen efter ordet forklarer direkte, hvordan begrebet bruges her.","Ord i kontekst",6),
      q("context-2","Hvad betyder 'levetid' her?",["Den periode produktet kan bruges","Hvor hurtigt produktet oplades","Hvor gammelt firmaet er","Hvor længe en reparation tager"],"Den periode produktet kan bruges","Teksten omformulerer ordet i den næste sætning.","Ord i kontekst",6),
      q("context-3","Hvad betyder det at 'høste dele'?",["At tage brugbare komponenter ud til andre enheder","At dyrke planter ved fabrikken","At smide hele produktet ud","At rense skærmen"],"At tage brugbare komponenter ud til andre enheder","Konteksten giver en direkte forklaring på udtrykket.","Ord i kontekst",6),
      q("context-4","Hvilket ord kan bedst erstatte 'defekt' i første afsnit?",["Fejlramt","Ny","Gratis","Trådløs"],"Fejlramt","Resten af sætningen handler om en enhed, der ikke fungerer korrekt.","Ord i kontekst",6),
      q("context-5","Hvad betyder 'komponent' bedst i teksten?",["En mindre del af et produkt","En butik","En bruger","En garanti"],"En mindre del af et produkt","Batteri, kabel og andre dele fungerer som eksempler omkring ordet.","Ord i kontekst",6),
      q("context-6","Hvad betyder 'forlænges' i sætningen om produktets levetid?",["Gøres længere","Gøres dyrere","Gøres tungere","Gøres hemmelig"],"Gøres længere","Sammenhængen modsætter hurtig udskiftning og længere brugstid.","Ord i kontekst",6),
      q("context-7","Hvad betyder 'reparerbarhed'?",["Hvor let et produkt kan repareres","Hvor populært et produkt er","Hvor hurtigt det kan sælges","Hvor mange farver det findes i"],"Hvor let et produkt kan repareres","Kolonet efter begrebet efterfølges af en forklaring på betydningen.","Ord i kontekst",7),
      q("context-8","Hvad betyder 'råstof' i afsnittet om materialegenvinding?",["Materiale der bruges til at fremstille noget nyt","En færdig telefon","Et reparationsværktøj","En brugermanual"],"Materiale der bruges til at fremstille noget nyt","Konteksten siger, at materialer fra kasserede produkter bruges til nye produkter.","Ord i kontekst",8),
      q("context-9","Hvorfor kan ordet 'cirkulært' ikke forstås helt uden den konkrete forklaring?",["Det kan dække flere forskellige praksisser","Det betyder altid kun genbrug af batterier","Det er et navn på et bestemt firma","Det handler kun om produktets form"],"Det kan dække flere forskellige praksisser","Slutafsnittet oplister flere betydninger, som betegnelsen kan rumme.","Ord i kontekst",9),
    ],
  },
  "Tekststruktur": {
    strategy: "Tekststruktur",
    title: "Hvorfor byen har brug for vilde hjørner",
    genre: "Forklarende artikel",
    blocks: {
      6: `Mange forbinder en velholdt bypark med kort græs og rene kanter. Men nogle kommuner lader nu små områder vokse mere vildt. Det kan se mindre ordnet ud, men formålet er at skabe flere levesteder for insekter.

Et tætklippet græsareal har ofte få blomster. Hvis en del af græsset får lov til at vokse, kan flere planter blomstre. Blomsterne giver pollen og nektar til blandt andet bier og sommerfugle.

Vilde områder behøver ikke fylde hele parken. En kommune kan for eksempel klippe stier gennem det høje græs. På den måde kan mennesker stadig gå gennem området, mens en del af planterne får lov til at stå.

Det vigtigste er altså ikke, at al græspleje stopper. Pointen er at variere plejen, så parken både kan bruges af mennesker og give plads til flere arter.`,
      7: `

Der kan opstå konflikter, fordi mennesker har forskellige forventninger til en park. Nogle synes, højt græs ser forsømt ud. Derfor sætter flere kommuner skilte op, der forklarer, hvorfor et område ikke bliver slået. Forklaringen ændrer ikke selve græsset, men den kan ændre, hvordan området bliver forstået.`,
      8: `

Effekten afhænger samtidig af, hvad der faktisk vokser. Et område med få blomstrende arter hjælper ikke nødvendigvis bestøvere meget. Derfor kombineres ændret slåning nogle steder med udsåning af lokale plantearter og registrering af, hvilke insekter der bruger området.`,
      9: `

Vilde hjørner er dermed et eksempel på en større udfordring i naturforvaltning: Et enkelt synligt tiltag kan være let at kommunikere, men naturens respons afhænger af flere forhold. God forvaltning kræver derfor både et tydeligt mål, løbende observationer og vilje til at justere metoden.`,
    },
    questions: [
      q("structure-1","Hvad gør første afsnit i teksten?",["Præsenterer emnet og en modsætning","Giver en opskrift","Afslører resultatet af et forsøg","Fortæller en personlig historie"],"Præsenterer emnet og en modsætning","Afsnittet stiller den velholdte park over for idéen om vilde områder.","Tekststruktur",6),
      q("structure-2","Hvilken funktion har andet afsnit?",["Forklarer hvorfor højere græs kan gavne insekter","Skifter emne til trafik","Giver tekstens konklusion","Beskriver kommunens budget"],"Forklarer hvorfor højere græs kan gavne insekter","Afsnittet bygger en årsagskæde fra længere græs til blomster og føde.","Tekststruktur",6),
      q("structure-3","Hvorfor bruges ordene 'for eksempel' i tredje afsnit?",["De indleder et konkret eksempel på en løsning","De viser en konklusion","De viser, at noget er forkert","De markerer et citat"],"De indleder et konkret eksempel på en løsning","Forbindelsesordet signalerer, at der nu kommer et eksempel på, hvordan området kan indrettes.","Tekststruktur",6),
      q("structure-4","Hvad gør sidste afsnit på 6.-klasseniveau?",["Samler og nuancerer hovedpointen","Starter et helt nyt emne","Gentager kun første sætning ordret","Laver en tidsplan"],"Samler og nuancerer hovedpointen","'Det vigtigste er altså' signalerer en opsamling og præcisering.","Tekststruktur",6),
      q("structure-5","Hvilket ord markerer tydeligst en modsætning i første afsnit?",["Men","Derfor","Altså","For eksempel"],"Men","'Men' viser kontrasten mellem det velordnede ideal og de vilde områder.","Tekststruktur",6),
      q("structure-6","Hvad er forholdet mellem tredje og fjerde afsnit?",["Tredje giver et eksempel, fjerde generaliserer pointen","Begge handler om helt forskellige emner","Fjerde modsiger alt i tredje","Tredje er en konklusion, fjerde er en indledning"],"Tredje giver et eksempel, fjerde generaliserer pointen","Stierne er en konkret løsning, hvorefter teksten samler princippet om varieret pleje.","Tekststruktur",6),
      q("structure-7","Hvorfor kommer afsnittet om skilte efter forklaringen af de biologiske fordele?",["Teksten går fra naturens behov til menneskers reaktion på løsningen","Skiltene får blomster til at vokse","Afsnittet er tilfældigt placeret","Det gentager kun prisoplysninger"],"Teksten går fra naturens behov til menneskers reaktion på løsningen","Strukturen udvider problemet fra økologi til kommunikation og forventninger.","Tekststruktur",7),
      q("structure-8","Hvad gør ordet 'samtidig' i 8.-klasseafsnittet?",["Tilføjer et vigtigt forbehold til den tidligere forklaring","Afslutter teksten","Viser et tidspunkt på dagen","Indleder direkte tale"],"Tilføjer et vigtigt forbehold til den tidligere forklaring","Afsnittet nuancerer: længere græs er ikke i sig selv garanti for stor effekt.","Tekststruktur",8),
      q("structure-9","Hvilken funktion har 9.-klasseafsnittet i hele teksten?",["Løfter det konkrete eksempel til et generelt princip om naturforvaltning","Giver kun flere navne på blomster","Skifter til en fortælling om én bi","Fjerner den tidligere konklusion"],"Løfter det konkrete eksempel til et generelt princip om naturforvaltning","'Dermed et eksempel på en større udfordring' viser, at teksten generaliserer fra parkens vilde hjørner.","Tekststruktur",9),
    ],
  },
  "Afsender og formål": {
    strategy: "Afsender og formål",
    title: "Kom med på Grøn Skoleuge",
    genre: "Kampagnetekst fra en kommune",
    blocks: {
      6: `GRØN SKOLEUGE · FEM DAGE MED SMÅ HANDLINGER

I uge 41 inviterer Fjordby Kommune alle skoler til Grøn Skoleuge. Målet er at gøre det lettere for elever og voksne at opdage, hvor ressourcer bruges i hverdagen.

Mandag handler om madspild. Tirsdag undersøger klasserne skolens energiforbrug. Onsdag er cykel- og gådag. Torsdag arbejder eleverne med reparation og genbrug. Fredag samler skolerne deres idéer og deler dem på kommunens hjemmeside.

Det er gratis at deltage. Lærere kan hente materialer, elevark og forslag til aktiviteter på kommunens læringsportal.

Tilmeld din klasse senest 25. september, og vær med til at vise, at mange små valg kan gøre en forskel.`,
      7: `

Kommunen sender desuden en lille materialepakke til de første 40 tilmeldte skoler. Pakken indeholder plakater, målekort og reparationsmærker. Skolerne kan også vælge kun at bruge de digitale materialer.`,
      8: `

Grøn Skoleuge er en del af kommunens klimahandleplan. Kommunen vil efter ugen indsamle anonyme svar fra lærere om, hvilke aktiviteter der fungerede bedst. Resultaterne bruges til at planlægge næste års forløb.`,
      9: `

Teksten er udarbejdet af Fjordby Kommunes Klima- og Læringssekretariat. Sekretariatet samarbejder med det lokale affaldsselskab, cyklistforbundet og tre ungdomsuddannelser om materialerne. Samarbejdspartnerne har bidraget med faglig viden, men kommunen har redigeret og godkendt det endelige indhold.`,
    },
    questions: [
      q("sender-1","Hvem er den tydelige afsender?",["Fjordby Kommune","En anonym elev","En privat webshop","Et sportshold"],"Fjordby Kommune","Kommunens navn står både i invitationen og i beskrivelsen af materialerne.","Afsender og formål",6),
      q("sender-2","Hvad er tekstens vigtigste formål?",["At få skoler til at deltage i Grøn Skoleuge","At anmelde en film","At advare mod cykler","At sælge computere"],"At få skoler til at deltage i Grøn Skoleuge","Invitationen, aktivitetsoversigten og den direkte opfordring til tilmelding peger på formålet.","Afsender og formål",6),
      q("sender-3","Hvem er den vigtigste målgruppe?",["Skoler og lærere, der kan tilmelde klasser","Turister","Bilforhandlere","Kun kommunens ansatte"],"Skoler og lærere, der kan tilmelde klasser","Teksten tilbyder lærermaterialer og beder om tilmelding af en klasse.","Afsender og formål",6),
      q("sender-4","Hvilken formulering er mest tydeligt handlingsorienteret?",["Tilmeld din klasse senest 25. september","Mandag handler om madspild","Det er gratis at deltage","Fredag samler skolerne deres idéer"],"Tilmeld din klasse senest 25. september","Imperativet 'Tilmeld' viser direkte, hvad afsenderen ønsker, læseren skal gøre.","Afsender og formål",6),
      q("sender-5","Hvorfor nævner teksten, at det er gratis at deltage?",["Det fjerner en mulig barriere for tilmelding","Det viser, at kommunen sælger billetter","Det er en tilfældig detalje uden betydning","Det betyder, at aktiviteterne er obligatoriske"],"Det fjerner en mulig barriere for tilmelding","Oplysningen understøtter tekstens overtalende formål ved at gøre deltagelse lettere.","Afsender og formål",6),
      q("sender-6","Hvilket ordvalg prøver mest tydeligt at motivere læseren?",["vær med","uge 41","onsdag","læringsportal"],"vær med","'Vær med' er en direkte invitation, der søger engagement.","Afsender og formål",6),
      q("sender-7","Hvorfor kan tilbuddet om en materialepakke styrke kampagnens formål?",["Det giver en ekstra grund til at tilmelde sig tidligt","Det gør kampagnen hemmelig","Det erstatter alle aktiviteter","Det betyder, at kun 40 elever må deltage"],"Det giver en ekstra grund til at tilmelde sig tidligt","En begrænset fordel til de første tilmeldte kan øge motivationen til handling.","Afsender og formål",7),
      q("sender-8","Hvilken interesse har kommunen også i at indsamle lærersvar?",["At forbedre og planlægge næste års forløb","At give elever karakterer","At sælge svarene til butikker","At aflyse klimahandleplanen"],"At forbedre og planlægge næste års forløb","Teksten siger direkte, at resultaterne bruges til planlægning; det viser et organisatorisk formål ud over selve invitationen.","Afsender og formål",8),
      q("sender-9","Hvorfor er oplysningerne om samarbejdspartnerne relevante, når man vurderer afsenderen?",["De viser, hvem der har bidraget fagligt, og hvem der har det endelige redaktionelle ansvar","De beviser, at teksten er skrevet af elever","De betyder, at kommunen ikke står bag teksten","De handler kun om layout"],"De viser, hvem der har bidraget fagligt, og hvem der har det endelige redaktionelle ansvar","Afsenderkritik handler også om produktionen af teksten og hvilke interesser og faglige kilder der står bag.","Afsender og formål",9),
    ],
  },
  "Sammenhæng og cloze": {
    strategy: "Sammenhæng og cloze",
    title: "Når en gruppe skal blive enig",
    genre: "Kort fagtekst med huller",
    blocks: {
      6: `Et gruppearbejde bliver ikke automatisk godt, bare fordi flere elever sidder ved samme bord. Først skal gruppen vide, hvad opgaven går ud på. ___(1)___ kan medlemmerne fordele roller og aftale, hvad de vil nå.

Det er også vigtigt at lytte til hinanden. Hvis to personer har forskellige forslag, behøver gruppen ikke straks vælge det ene. De kan først undersøge, ___(2)___ forslagene måske løser forskellige dele af problemet.

En tidsplan kan hjælpe, ___(3)___ den gør det synligt, hvornår gruppen skal være færdig med de enkelte dele. Men planen virker kun, hvis medlemmerne faktisk bruger den.

Til sidst bør gruppen læse produktet igennem samlet. På den måde opdager de lettere, om teksten hænger sammen, ___(4)___ om nogle dele gentager hinanden.`,
      7: `

Uenighed kan være nyttig, ___(5)___ den handler om idéerne og ikke om personerne. Et modargument kan tvinge gruppen til at forklare sit valg tydeligere.`,
      8: `

Nogle grupper deler arbejdet så skarpt op, at hvert medlem kun kender sin egen del. Det er effektivt på kort sigt; ___(6)___ kan resultatet blive ujævnt, fordi ingen har ansvar for helheden.`,
      9: `

Godt samarbejde kræver derfor både arbejdsdeling og fælles ejerskab. Rollen som koordinator er nyttig, ___(7)___ den ikke bliver til en chefrolle, hvor én person træffer alle beslutninger. Gruppen bør med andre ord organisere arbejdet uden at ___(8)___ ansvaret hos én person.`,
    },
    questions: [
      q("cloze-train-1","Hvilket ord passer bedst i hul (1)?",["Derefter","Alligevel","Pludselig","Derimod"],"Derefter","Teksten beskriver en rækkefølge: forstå opgaven først og fordel derefter roller.","Sammenhæng og cloze",6),
      q("cloze-train-2","Hvilket ord passer bedst i hul (2)?",["om","fordi","selvom","mens"],"om","Man undersøger, om noget er tilfældet; både grammatik og betydning peger på 'om'.","Sammenhæng og cloze",6),
      q("cloze-train-3","Hvilket ord passer bedst i hul (3)?",["fordi","men","eller","selvom"],"fordi","Den næste del forklarer årsagen til, at tidsplanen kan hjælpe.","Sammenhæng og cloze",6),
      q("cloze-train-4","Hvilket ord passer bedst i hul (4)?",["eller","fordi","derfor","hvis"],"eller","Sætningen nævner to forskellige ting, gruppen kan opdage: manglende sammenhæng eller gentagelser.","Sammenhæng og cloze",6),
      q("cloze-train-5","Hvilket ord kan bedst erstatte 'På den måde' uden at ændre meningen meget?",["Sådan","Til gengæld","Alligevel","Først"],"Sådan","Udtrykket henviser tilbage til metoden med at læse produktet samlet.","Sammenhæng og cloze",6),
      q("cloze-train-6","Hvad henviser 'den' til i sætningen 'Men planen virker kun, hvis medlemmerne faktisk bruger den'?",["tidsplanen","gruppen","opgaven","teksten"],"tidsplanen","Stedordet skal kobles til det nærmeste passende navneord i sammenhængen.","Sammenhæng og cloze",6),
      q("cloze-train-7","Hvilket ord passer bedst i hul (5)?",["hvis","fordi","derfor","før"],"hvis","Uenighed er nyttig på en betingelse: at den handler om idéer og ikke personer.","Sammenhæng og cloze",7),
      q("cloze-train-8","Hvilket forbindelsesord passer bedst i hul (6)?",["til gengæld","derfor","for eksempel","samtidig"],"til gengæld","Første del nævner en fordel, mens næste del introducerer en ulempe; 'til gengæld' markerer kontrasten.","Sammenhæng og cloze",8),
      q("cloze-train-9","Hvilken kombination passer bedst i hul (7) og (8)?",["så længe / placere","fordi / dele","selvom / glemme","når / undersøge"],"så længe / placere","Koordinatorrollen er nyttig under en betingelse, og ansvaret bør ikke placeres hos én person.","Sammenhæng og cloze",9),
    ],
  },
};

function mulberry32(seed:number){let value=seed>>>0;return()=>{value+=0x6d2b79f5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function shuffled<T>(items:T[],random:()=>number){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
function gradeValue(targetGrade:number){return Math.max(6,Math.min(9,Math.round(targetGrade))) as 6|7|8|9}
function textForGrade(passage:StrategyTrainingPassage,grade:6|7|8|9){return ([6,7,8,9] as const).filter(g=>g<=grade).map(g=>passage.blocks[g]||"").join("\n").trim()}

export function isReadingStrategy(value:string|null|undefined):value is ReadingStrategy{return Boolean(value&&READING_STRATEGIES.includes(value as ReadingStrategy))}

export function strategyTrainingAvailableCount(strategy:ReadingStrategy,targetGrade:number){const grade=gradeValue(targetGrade);return passages[strategy].questions.filter(question=>question.minGrade<=grade).length}

export function buildStrategyTrainingRound(strategy:ReadingStrategy,targetGrade:number,seenIds:string[]=[],roundSize=3,seed=1):StrategyTrainingRound{
  const grade=gradeValue(targetGrade),passage=passages[strategy],random=mulberry32(Number.isFinite(seed)?seed:1);
  const eligible=passage.questions.filter(question=>question.minGrade<=grade),seen=new Set(seenIds);
  const fresh=shuffled(eligible.filter(question=>!seen.has(question.id)),random),repeats=shuffled(eligible.filter(question=>seen.has(question.id)),random);
  const selected=[...fresh,...repeats].slice(0,Math.min(roundSize,eligible.length)).map(question=>({...question,options:shuffled(question.options,random)}));
  return {strategy,title:passage.title,genre:passage.genre,text:textForGrade(passage,grade),questions:selected,freshCount:Math.min(fresh.length,selected.length),availableCount:eligible.length};
}

export function strategyTrainingPassages(){return passages}
