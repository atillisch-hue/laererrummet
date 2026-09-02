export type ReadingStrategy =
  | "Skimning og overblik"
  | "Scanning og informationssøgning"
  | "Hovedindhold"
  | "Inferens"
  | "Ord i kontekst"
  | "Tekststruktur"
  | "Afsender og formål"
  | "Sammenhæng og cloze";

export type ReadingQuestion = {
  id: string;
  q: string;
  options: string[];
  answer: string;
  strategy: ReadingStrategy;
  minGrade: 6 | 7 | 8 | 9;
  explanation: string;
};

export type ReadingPassage = {
  id: string;
  section: string;
  title: string;
  genre: string;
  blocks: Partial<Record<6 | 7 | 8 | 9, string>>;
  questions: ReadingQuestion[];
};

export type ReadingExamPart = {
  id: string;
  section: string;
  title: string;
  genre: string;
  text: string;
  questions: ReadingQuestion[];
};

export const READING_STRATEGIES: ReadingStrategy[] = [
  "Skimning og overblik",
  "Scanning og informationssøgning",
  "Hovedindhold",
  "Inferens",
  "Ord i kontekst",
  "Tekststruktur",
  "Afsender og formål",
  "Sammenhæng og cloze",
];

export const READING_LEVELS = {
  6: { title: "6. klasse · Strategitræning", questionCount: 30, description: "Kortere og tydeligere tekster. Fokus på at lære strategierne og finde sikre spor i teksten." },
  7: { title: "7. klasse · Begyndende prøveformat", questionCount: 35, description: "Flere teksttyper, længere tekster og begyndende krav om at kombinere oplysninger." },
  8: { title: "8. klasse · Prøveforberedelse", questionCount: 40, description: "Mere komplekse tekster, flere inferenser og større krav til tempo og tekstoverblik." },
  9: { title: "9. klasse · FP9-lignende niveau", questionCount: 50, description: "Den mest krævende version med tættere tekster, nuancer, afsender/formål og 50 delspørgsmål." },
} as const;

const q = (id:string,q:string,options:string[],answer:string,strategy:ReadingStrategy,minGrade:6|7|8|9,explanation:string):ReadingQuestion => ({id,q,options,answer,strategy,minGrade,explanation});

const passages: ReadingPassage[] = [
  {
    id: "festival",
    section: "Søgelæsning",
    title: "Program: Fjordby Natur- og Kulturdag",
    genre: "Program og praktisk information",
    blocks: {
      6: `FJORDBy NATUR- OG KULTURDAG · LØRDAG 12. SEPTEMBER

Mødested: Fjordby Havn og området omkring det gamle pakhus.

10.00 · ÅBNING VED PAKHUSET
Borgmesteren byder velkommen. Varighed ca. 20 minutter. Gratis.

10.30 · FUGLETUR LANGS FJORDEN
Mød naturvejleder Samira ved den blå informationstavle. Turen er 3 km og varer ca. 75 minutter. Medbring gode sko. Børn under 12 år skal følges med en voksen. Gratis, men tilmelding er nødvendig.

11.00 · BYG EN MINI-VINDMØLLE
Værksted i pakhusets lokale 2. For børn og unge fra 9 år. Der er 24 pladser. Materialer er inkluderet. Pris: 20 kr.

11.30 · HISTORIER FRA HAVNEN
Skuespiller Mikkel Vang fortæller lokale historier på scenen ved kajen. 40 minutter. Gratis. Ingen tilmelding.

12.15 · MADPAUSE
Madboderne ligger mellem pakhuset og legepladsen. Der er vegetariske retter. Egen mad må gerne medbringes.

13.00 · KAJAKINTRODUKTION
Mød ved roklubben. Fra 12 år. Redningsvest udleveres. Deltagerne skal kunne svømme 200 meter. Varighed 60 minutter. Pris: 40 kr. Tilmelding nødvendig.

13.30 · PLANTER I BYEN
Kort byvandring med biolog Ellen Wu. Mød ved bibliotekets pop-up-telt. 45 minutter. Gratis.

14.15 · REPARATIONSVÆRKSTED
Tag en defekt cykellygte, taske eller lille elektronisk genstand med. Frivillige hjælper med at undersøge, om den kan repareres. Gratis. Reservedele betales af deltageren.

15.00 · KONCERT PÅ KAJEN
Ungdomsskolens band spiller. 50 minutter. Gratis.

PRAKTISK
Tilmelding til aktiviteter med begrænsede pladser åbner mandag 31. august kl. 18 på kommunens hjemmeside. Parkering ved havnen er lukket på dagen. Cykler kan stilles ved biblioteket. Bus 4 og 7 stopper ved Torvegade, ca. 500 meter fra havnen.`,
      7: `

Hvis en aktivitet er fuldt booket, kan man skrive sig på venteliste. Ledige pladser gives videre i den rækkefølge, deltagerne står på listen. Afbud skal meldes senest fredag kl. 16.

Ved kraftig regn flyttes vindmølleværkstedet og historierne fra havnen ind i pakhuset. Fugleturen gennemføres i let regn, men kan aflyses ved torden. Besked om ændringer lægges på kommunens hjemmeside kl. 8 på dagen.`,
      8: `

TILGÆNGELIGHED
Pakhusets stueetage, madområdet og kajscenen er tilgængelige for kørestole. Fugleturen følger en grussti med to korte, stejle passager. Deltagere, der har brug for en alternativ rute, kan kontakte naturvejlederen ved informationsteltet senest kl. 10.15. Kajakaktiviteten foregår fra en lav flydebro og kræver, at deltageren selv eller med ledsager kan komme ned i kajakken.

ARRANGØRER
Dagen arrangeres af Fjordby Kommune i samarbejde med biblioteket, naturforeningen, roklubben og lokale frivillige.`,
      9: `

BILLETTER OG BETALING
Gratis aktiviteter kræver ikke billet, medmindre der står “tilmelding nødvendig”. Betalte aktiviteter betales ved tilmeldingen. Ved arrangørens aflysning refunderes beløbet automatisk. Hvis deltageren selv melder afbud efter fredag kl. 16, refunderes beløbet kun, hvis pladsen overtages af en person fra ventelisten.

FIND DEN RIGTIGE INFORMATION
Programmet opdateres løbende. Tidspunkter på plakater i byen kan derfor være ældre end oplysningerne på kommunens hjemmeside. På selve dagen er informationsteltet ved biblioteket den officielle kilde til ændringer i programmet.`,
    },
    questions: [
      q("festival-1","Hvor skal man møde til fugleturen?",["Ved den blå informationstavle","Ved roklubben","Ved kajscenen","Ved legepladsen"],"Ved den blå informationstavle","Scanning og informationssøgning",6,"Oplysningen står direkte ved aktiviteten Fugletur langs fjorden."),
      q("festival-2","Hvilken aktivitet begynder kl. 13.00?",["Kajakintroduktion","Planter i byen","Reparationsværksted","Koncert på kajen"],"Kajakintroduktion","Scanning og informationssøgning",6,"Ved at scanne tiderne finder man 13.00 ud for Kajakintroduktion."),
      q("festival-3","Hvad skal en 10-årig gøre for at deltage i fugleturen?",["Følges med en voksen","Kunne svømme 200 meter","Betale 20 kr.","Medbringe en cykellygte"],"Følges med en voksen","Scanning og informationssøgning",6,"Børn under 12 år skal følges med en voksen."),
      q("festival-4","Hvor kan man stille sin cykel?",["Ved biblioteket","Ved roklubben","På havneparkeringen","Bag pakhuset"],"Ved biblioteket","Scanning og informationssøgning",6,"Den praktiske information siger, at cykler kan stilles ved biblioteket."),
      q("festival-5","Hvilken aktivitet kræver både en bestemt alder og en bestemt færdighed?",["Kajakintroduktion","Koncert på kajen","Historier fra havnen","Planter i byen"],"Kajakintroduktion","Hovedindhold",6,"Kajak kræver, at man er mindst 12 år og kan svømme 200 meter."),
      q("festival-6","Hvis kajakholdet er fuldt, hvad kan man gøre?",["Skrive sig på venteliste","Møde op en time tidligere","Købe billet ved roklubben","Tilmeldes automatisk næste år"],"Skrive sig på venteliste","Scanning og informationssøgning",7,"Tillægget forklarer, at fuldt bookede aktiviteter bruger venteliste."),
      q("festival-7","En elev bruger kørestol og vil deltage i fugleturen. Hvad er den bedste handling?",["Kontakte naturvejlederen om en alternativ rute","Møde ved kajscenen i stedet","Vælge kajak, fordi den er helt niveaufri","Parkere ved havnen"],"Kontakte naturvejlederen om en alternativ rute","Inferens",8,"Man skal kombinere oplysningerne om grussti/stejle passager med muligheden for en alternativ rute."),
      q("festival-8","En plakat siger, at koncerten starter 14.45, mens hjemmesiden siger 15.00. Hvilken oplysning bør man følge?",["Hjemmesiden eller informationsteltet","Plakaten, fordi den er trykt","Den tid man selv synes passer","Begge tider er lige sikre"],"Hjemmesiden eller informationsteltet","Afsender og formål",9,"Teksten siger, at programmet opdateres løbende, og at hjemmeside/informationstelt er de officielle kilder."),
    ],
  },
  {
    id: "varmeby",
    section: "Informerende tekst",
    title: "Når byen holder på varmen",
    genre: "Faglig artikel",
    blocks: {
      6: `En varm sommerdag kan temperaturen være mærkbart højere midt i en by end uden for byen. Fænomenet kaldes en urban varmeø. Det betyder ikke, at byen bogstaveligt talt er en ø. Navnet beskriver, at et tæt bebygget område på et temperaturkort kan ligne et varmt felt omgivet af køligere områder.

En vigtig forklaring findes i de materialer, byen er bygget af. Mørk asfalt, mursten og tage optager energi fra solen. Når solen går ned, afgiver materialerne langsomt varmen igen. Jord, græs og træer opfører sig anderledes. Planter bruger en del af solens energi til vækst og til fordampning af vand. Når vand fordamper fra blade og jord, køles omgivelserne en smule.

Bygninger påvirker også luftens bevægelse. I smalle gader kan vinden have sværere ved at føre varm luft væk. Samtidig kommer der varme fra trafik, aircondition, butikker og andre aktiviteter. Hver enkelt varmekilde er måske lille, men tilsammen kan de bidrage til, at temperaturen bliver højere.

Varmeøer er især et problem om natten. Hvis luften ikke køler ordentligt ned, får kroppen mindre pause fra dagens varme. Det kan være belastende for ældre mennesker, små børn og personer med bestemte sygdomme. Derfor arbejder mange byer med at skabe mere skygge og flere grønne områder.

Et træ hjælper på flere måder. Kronen skygger for solen, og bladene afgiver vanddamp. Men ét træ løser ikke hele problemet. Effekten afhænger blandt andet af træets størrelse, hvor det står, og om der er vand nok i jorden.`,
      7: `

Nogle kommuner arbejder også med lyse tage og belægninger. En lys overflade sender en større del af sollyset tilbage end en mørk overflade. Det kaldes høj refleksion. Løsningen kan sænke overfladetemperaturen, men den skal planlægges med omtanke. Meget blanke materialer kan for eksempel sende lys og varme mod andre bygninger eller mennesker på gaden.

Vand kan også spille en rolle. Springvand og åbne kanaler kan lokalt give en kølende virkning gennem fordampning. I perioder med tørke er det dog ikke altid fornuftigt at bruge store mængder drikkevand til køling. Derfor kobler flere byer varmeplanlægning sammen med opsamling af regnvand.`,
      8: `

Det er ikke nok at måle én temperatur og derefter konkludere, at en hel bydel er varm. Temperatur varierer med tidspunkt, vind, skygge, højde over jorden og placering af måleudstyret. Forskere bruger derfor ofte mange sensorer og sammenligner målinger over længere tid. Satellitbilleder kan vise temperaturen på overflader, mens sensorer tæt på jorden fortæller mere om den luft, mennesker faktisk opholder sig i. De to slags data svarer ikke på præcis det samme spørgsmål.

Der er også en social side af problemet. Nogle kvarterer har mange gamle træer, private haver og parker. Andre har store parkeringsarealer og få grønne steder. Hvis de varmeste områder samtidig bebos af mennesker, der har færre muligheder for at køle boligen ned eller rejse væk under en hedebølge, bliver varme ikke kun et spørgsmål om vejret, men også om ulighed.`,
      9: `

Tiltag kan desuden have modsatrettede virkninger. Tætte træer giver skygge om sommeren, men kan på bestemte steder mindske luftcirkulationen. Aircondition sænker temperaturen indendørs, men bruger energi og afgiver varme udenfor. En ny park kan gøre et område mere behageligt, men hvis boligpriserne bagefter stiger kraftigt, kan nogle af de oprindelige beboere blive presset væk. Derfor taler forskere om, at klimatilpasning ikke kun skal være effektiv, men også retfærdig.

Den bedste løsning er sjældent ét enkelt greb. Byplanlæggere kombinerer ofte træer, skygge, vandhåndtering, materialevalg og adgang til kølige offentlige rum. Først undersøger de, hvor varmen er størst, hvem der er mest udsat, og hvilke lokale forhold der betyder mest. På den måde bliver målet ikke blot at sænke en gennemsnitstemperatur, men at mindske den varme, mennesker faktisk oplever i deres hverdag.`,
    },
    questions: [
      q("varme-1","Hvad er en urban varmeø?",["Et byområde der er varmere end omgivelserne","En kunstig ø midt i en by","Et område med mange springvand","En park omgivet af bygninger"],"Et byområde der er varmere end omgivelserne","Hovedindhold",6,"Første afsnit forklarer selve begrebet."),
      q("varme-2","Hvorfor kan asfalt bidrage til høj temperatur om aftenen?",["Den lagrer solenergi og afgiver varmen langsomt","Den producerer selv sollys","Den fordamper meget vand","Den får vinden til at blæse hurtigere"],"Den lagrer solenergi og afgiver varmen langsomt","Hovedindhold",6,"Teksten beskriver, at mørke materialer optager energi og senere afgiver den."),
      q("varme-3","Hvordan kan træer køle et område?",["Ved skygge og fordampning fra blade","Ved at gøre asfalten mørkere","Ved at standse al vind","Ved at varme jorden om natten"],"Ved skygge og fordampning fra blade","Scanning og informationssøgning",6,"Der nævnes både skygge og vanddamp fra bladene."),
      q("varme-4","Hvorfor er varme om natten særlig problematisk?",["Kroppen får mindre pause fra varmen","Solen skinner stærkere om natten","Planter stopper med at eksistere","Alle bygninger lukker"],"Kroppen får mindre pause fra varmen","Hovedindhold",6,"Teksten fremhæver netop manglende afkøling som en belastning."),
      q("varme-5","Hvad er artiklens vigtigste formål?",["At forklare hvorfor byer kan blive varme, og hvordan problemet kan mindskes","At reklamere for aircondition","At advare mod at plante træer","At beskrive én bestemt by"],"At forklare hvorfor byer kan blive varme, og hvordan problemet kan mindskes","Afsender og formål",6,"Artiklen forklarer både årsager, konsekvenser og forskellige løsninger."),
      q("varme-6","Hvad betyder det i teksten, at en lys overflade har høj refleksion?",["Den sender en større del af sollyset tilbage","Den opsuger mere vand","Den bliver automatisk ru","Den producerer mindre vind"],"Den sender en større del af sollyset tilbage","Ord i kontekst",7,"Betydningen forklares direkte i samme afsnit."),
      q("varme-7","Hvorfor kan man ikke bruge én temperaturmåling til at beskrive en hel bydel?",["Temperaturen afhænger af blandt andet tidspunkt, vind, skygge og placering","Termometre virker kun uden for byer","Alle gader har altid samme temperatur","Satellitter måler kun regn"],"Temperaturen afhænger af blandt andet tidspunkt, vind, skygge og placering","Inferens",8,"Afsnittet om målinger oplister flere forhold, der ændrer resultatet."),
      q("varme-8","Hvilken pointe viser eksemplet med en ny park og stigende boligpriser?",["En klimatilpasning kan have sociale konsekvenser","Parker gør altid byer varmere","Boligpriser bestemmer vindretningen","Kun private haver kan køle"],"En klimatilpasning kan have sociale konsekvenser","Inferens",9,"Eksemplet bruges til at vise, at en fysisk forbedring også kan påvirke, hvem der har råd til at bo i området."),
      q("varme-9","Hvilken konklusion ligger tættest på hele teksten?",["Effektiv varmeplanlægning kræver flere løsninger og viden om lokale forhold","Der findes én universel løsning: flere springvand","Aircondition bør erstatte alle andre tiltag","Satellitbilleder gør målinger på jorden overflødige"],"Effektiv varmeplanlægning kræver flere løsninger og viden om lokale forhold","Hovedindhold",9,"Slutningen samler artiklen i en flerstrenget, lokalt tilpasset tilgang."),
    ],
  },
  {
    id: "bus",
    section: "Fortællende tekst",
    title: "Den sidste bus",
    genre: "Novelleuddrag",
    blocks: {
      6: `Da Selma kom ud fra hallen, var parkeringspladsen næsten tom. De andre fra holdet var kørt for ti minutter siden, og regnen lå som et blankt lag over asfalten. Hun trak hætten op og kiggede på skærmen. 21.42. Bussen gik 21.47 fra stoppestedet ved rundkørslen.

“Det når du,” havde træneren sagt, da Selma havde samlet sine ting. Det havde også lydt sandsynligt inde i den varme hal. Udenfor virkede afstanden pludselig længere.

Hun løb. Tasken slog mod hoften, og hendes våde snørebånd gjorde hvert skridt usikkert. Da hun nåede rundt om hjørnet, kunne hun se busskuret. En mand stod der med en gul pose. Selma sænkede farten et øjeblik. Hvis han stadig stod der, var bussen ikke kommet.

Manden løftede hånden, men ikke til hende. Bag Selma svingede bussen ud fra sidevejen. Hun vendte sig og løb de sidste meter. Dørene lukkede netop, da hun nåede frem.

“Vent!” råbte hun og bankede med flad hånd på ruden.

Chaufføren så ikke i hendes retning. Bussen satte i gang.

Selma stod stille og så de røde baglygter blive mindre. Regnen løb ned over hendes kinder. Hun mærkede først irritationen og derefter den tungere følelse i maven. Mor var på nattevagt. Far boede tre kvarter væk. Hun havde sagt, at hun sagtens kunne klare turen selv.

“Øv,” sagde manden med den gule pose.

Selma svarede ikke. Hun åbnede rejseplanen. Næste bus: 23.02.

Manden pegede mod pakhusene på den anden side af vejen. “Der er en tankstation ti minutter herfra. Den har åbent.”

Selma kiggede på ham, på den mørke vej og tilbage på telefonen. Batteri: 12 procent.`,
      7: `

Hun skrev til mor: Mistede bussen. Alt ok. Finder ud af det. Beskeden stod længe med ét lille flueben, før det andet kom frem. Ingen svar.

“Jeg går den vej,” sagde manden. “Men du skal selvfølgelig ikke gå med en fremmed, bare fordi han siger det.” Han smilede skævt og trak den gule pose højere op under armen. “Tankstationen ligger efter lyskrydset. Der er fortov hele vejen.”

Selma nikkede. Det var mærkeligt, at hans forsøg på at gøre hende mindre utryg faktisk gjorde hende mere opmærksom på, at hun stod alene.

Hun ringede til far. Telefonsvareren tog den efter fem toner. Hun lagde på uden at indtale noget. Derefter ringede hun til sin veninde Asta. Intet svar.

Manden begyndte at gå. “God aften,” sagde han og forsvandt efter få sekunder i regnen.

Selma blev stående i skuret. Hun kunne vente der i mere end en time. Der var lys fra hallen bag træerne, men hun vidste, at dørene plejede at blive låst kort efter sidste træning.`,
      8: `

Hun tænkte på det, hendes klasselærer havde sagt på en tur til København: Når du skal træffe en beslutning hurtigt, så skel mellem det, du ved, og det, du forestiller dig. Selma havde syntes, det lød irriterende voksent dengang.

Det hun vidste: Tankstationen var ifølge manden ti minutter væk. Der var fortov. Telefonen havde lidt strøm. Hun havde sendt sin placering til mor gennem familiens app. Hun kunne også gå tilbage mod hallen og undersøge, om nogen stadig var der.

Det hun forestillede sig: At alle mørke veje var farlige. At hun ville se dum ud, hvis hun bankede på hallens dør. At far blev sur over at skulle køre. At mor tænkte, hun ikke kunne klare noget selv.

Hun vendte om mod hallen.

Ved sidedøren stod trænerens cykel stadig. Selma mærkede en lettelse, der næsten gjorde hende vred. Hun bankede. Ingen reaktion. Hun bankede igen, hårdere.

Døren gik op, og rengøringsmedarbejderen stak hovedet ud. “Er du ikke fra håndboldholdet?”

“Jo. Jeg missede bussen.”

“Kom ind. Du er drivvåd.”`,
      9: `

Inde i forhallen duftede der af vådt gulv og den sæbe, rengøringsmaskinen efterlod. Selma satte sig på bænken. Rengøringsmedarbejderen, der hed Noor, tilbød hende te fra en termokande og fandt et stik til telefonen.

“Vil du have, at jeg ringer til nogen?” spurgte Noor.

Selma var lige ved at sige nej. Ordet lå klar som en refleks. Hun havde brugt meget af året på at bevise, at hun ikke længere var et barn, der skulle hentes alle steder. Men hun så på det lille batterisymbol, der nu viste 14 procent, og tænkte på, hvor tæt hendes plan havde været på bare at være stædighed med et pænere navn.

“Jeg ringer selv til min far igen,” sagde hun.

Denne gang tog han telefonen.

“Selma? Jeg var i bad. Er alt okay?”

Hun forklarede det kort. Der blev stille et sekund.

“Jeg kører nu.”

“Du behøver ikke skynde dig.”

“Det gør jeg heller ikke. Jeg kører forsvarligt,” sagde han, og hun kunne høre smilet i stemmen.

Mens hun ventede, skrev mor endelig: Godt du skrev. Ring hvis du har brug for mig. Elsker dig.

Da far fyrre minutter senere kom ind ad døren, rejste Selma sig. Hun havde forberedt en forklaring om bussen, regnen og træningen, men han spurgte kun: “Fik du teen drukket?”

På vej hjem kørte de forbi tankstationen. Den lå ganske rigtigt efter lyskrydset, oplyst og åben. Selma kiggede ud på den uden at føle, at hun havde valgt forkert.

“Jeg troede, det at klare sig selv betød, at man ikke skulle bede om hjælp,” sagde hun.

Far holdt blikket på vejen. “Det lyder besværligt.”

Selma grinede. “Ja.”`,
    },
    questions: [
      q("bus-1","Hvorfor sænker Selma kort farten, da hun ser manden ved stoppestedet?",["Hun tænker, at bussen nok ikke er kommet endnu","Hun kender manden","Hun vil købe den gule pose","Hun har besluttet at gå hjem"],"Hun tænker, at bussen nok ikke er kommet endnu","Inferens",6,"Hun bruger mandens tilstedeværelse som tegn på, at der stadig ventes på bussen."),
      q("bus-2","Hvad sker der lige efter, at Selma banker på bussens rude?",["Bussen kører videre","Chaufføren åbner døren","Manden stopper bussen","Selma ringer til sin mor"],"Bussen kører videre","Scanning og informationssøgning",6,"Handlingen står direkte i den følgende linje."),
      q("bus-3","Hvorfor bliver Selma særligt bekymret efter at have mistet bussen?",["Hun har svært ved at finde en voksen, der kan hente hende","Hun har glemt sin taske i hallen","Hun er bange for håndboldtræneren","Hun skal nå en koncert"],"Hun har svært ved at finde en voksen, der kan hente hende","Hovedindhold",6,"Mor er på arbejde, far langt væk, og hun har sagt, at hun kunne klare turen selv."),
      q("bus-4","Hvilken oplysning på telefonen gør situationen mere presset?",["Batteriet er på 12 procent","Klokken er 20.00","Der er gratis wifi","Asta har sendt mange beskeder"],"Batteriet er på 12 procent","Scanning og informationssøgning",6,"Den lave batteriprocent begrænser hendes mulighed for at kommunikere."),
      q("bus-5","Hvilket ord beskriver bedst stemningen i begyndelsen?",["Utryg og presset","Festlig og støjende","Rolig og hyggelig","Komisk og fjollet"],"Utryg og presset","Hovedindhold",6,"Mørke, regn, den missede bus og manglende hjælp skaber pres."),
      q("bus-6","Hvorfor virker mandens bemærkning om ikke at følge en fremmed dobbelt på Selma?",["Den er beroligende, men minder hende samtidig om, at hun står alene","Den får hende til straks at stole på ham","Den betyder, at tankstationen er lukket","Den får hendes telefon til at virke igen"],"Den er beroligende, men minder hende samtidig om, at hun står alene","Inferens",7,"Teksten siger direkte, at hans forsøg på at berolige hende også gør hende mere opmærksom på situationen."),
      q("bus-7","Hvad ændrer Selmas beslutning, da hun opdeler situationen i det, hun ved, og det, hun forestiller sig?",["Hun vælger at undersøge hallen igen","Hun går med manden","Hun venter uden at gøre noget","Hun slukker telefonen"],"Hun vælger at undersøge hallen igen","Tekststruktur",8,"Refleksionen fungerer som vendepunkt: bagefter vender hun om mod hallen."),
      q("bus-8","Hvad mener teksten med, at hendes plan næsten var “stædighed med et pænere navn”?",["At ønsket om selvstændighed var ved at forhindre hende i at tage imod fornuftig hjælp","At hun havde løjet om bussens tidspunkt","At hun ikke kunne lide te","At hun burde have fulgt manden"],"At ønsket om selvstændighed var ved at forhindre hende i at tage imod fornuftig hjælp","Ord i kontekst",9,"Udtrykket viser hendes erkendelse af, at selvstændighed ikke er det samme som at afvise hjælp."),
      q("bus-9","Hvilken udvikling gennemgår Selma?",["Hun går fra at forbinde selvstændighed med at klare alt alene til at se hjælp som en del af at handle ansvarligt","Hun beslutter aldrig mere at tage bus","Hun lærer, at fremmede altid er farlige","Hun holder op med håndbold"],"Hun går fra at forbinde selvstændighed med at klare alt alene til at se hjælp som en del af at handle ansvarligt","Hovedindhold",9,"Slutreplikken samler fortællingens udvikling i hendes syn på selvstændighed."),
    ],
  },
  {
    id: "mobil",
    section: "Argumenterende tekst",
    title: "Mobilfri betyder ikke tankefri",
    genre: "Debatindlæg",
    blocks: {
      6: `Når skoler diskuterer mobiltelefoner, ender samtalen ofte i to yderpunkter: Enten skal mobilen væk hele dagen, eller også skal eleverne selv bestemme alt. Begge løsninger er efter min mening for enkle.

Telefonen kan forstyrre. En besked, en vibration eller bare tanken om, at nogen måske har skrevet, kan trække opmærksomheden væk fra en opgave. Det gælder ikke kun børn. Voksne kender præcis den samme mekanisme. Derfor giver det god mening, at telefonen ikke ligger på bordet under en forklaring, en prøve eller en samtale, hvor alle skal være til stede.

Men telefonen er også et redskab. Den kan bruges til at optage lyd, tage billeder af et forsøg, slå et ord op, bruge en tidsmåler eller læse en QR-kode. Hvis skolen forbyder den i alle situationer, mister læreren også muligheden for at vælge den, når den faktisk hjælper undervisningen.

Jeg foreslår derfor mobilfrie zoner og perioder frem for et totalt forbud. I undervisningen bestemmer læreren, om telefonen skal være væk eller bruges fagligt. I bestemte pauser kan skolen have områder uden telefoner, så det bliver lettere at vælge samtale, spil eller bevægelse. Andre steder kan eleverne bruge mobilen.

Pointen er ikke, at mobilen er god eller dårlig. Pointen er, at vi skal lære at styre vores opmærksomhed.`,
      7: `

Nogle vil indvende, at regler kun virker, hvis de er helt enkle: Hvis telefonen nogle gange er tilladt og andre gange ikke er, opstår der diskussioner. Det er et reelt problem. Men skolen har allerede regler, der afhænger af situationen. Man må tale på bestemte tidspunkter og være stille på andre. Man må bruge en computer til en opgave, men ikke til spil midt i undervisningen. Elever kan godt lære forskellen, hvis reglerne er tydelige og voksne håndhæver dem ensartet.

Et andet argument for totalforbud er, at pauserne bliver bedre uden skærme. Det kan de blive. Men en regel skaber ikke automatisk fællesskab. Hvis en elev ikke ved, hvem vedkommende skal være sammen med, forsvinder problemet ikke, bare fordi telefonen ligger i et skab. Skolen skal samtidig skabe aktiviteter og steder, hvor det er let at deltage.`,
      8: `

Der er også et spørgsmål om træning. Unge skal før eller siden kunne håndtere digitale forstyrrelser uden en voksen, der samler telefonen ind. Det betyder ikke, at de skal overlades til sig selv fra første skoledag. Tværtimod kan skolen være et sted, hvor man øver konkrete strategier: slå notifikationer fra, lægge telefonen uden for synsfeltet, aftale fokustid og bagefter undersøge, om man faktisk arbejdede bedre.

Kritikere kan med rette spørge, om skolen dermed gør eleverne ansvarlige for teknologivirksomhedernes design. Mange apps er udviklet til at holde på vores opmærksomhed. Derfor bør undervisning i digitale vaner ikke erstatte regler. Den bør supplere dem. En cykelhjelm gør ikke trafikregler unødvendige; trafikregler gør heller ikke, at vi kan undvære at lære at cykle.`,
      9: `

Debatten bliver desuden let moralsk. En elev, der ser på sin telefon, beskrives som udisciplineret, mens den voksne, der svarer på en arbejdsmail under et møde, kalder det nødvendigt. Den forskel bør vi være opmærksomme på. Hvis skolen vil lære elever at beskytte deres opmærksomhed, må de voksne også vise, hvordan det ser ud i praksis.

Mit forslag er derfor ikke den “nemme mellemvej”. Det kræver faktisk mere af skolen end et totalforbud. Reglerne skal være konkrete, eleverne skal kende begrundelserne, og lærerne skal kunne ændre en regel, når den ikke virker. Til gengæld træner modellen det, eleverne har brug for uden for skolen: at kunne vurdere, hvornår teknologien er et værktøj, og hvornår den overtager styringen.

Vi bør altså ikke spørge: “Mobil eller ingen mobil?” Det bedre spørgsmål er: “Hvilke rammer hjælper os med at bruge vores opmærksomhed med vilje?”`,
    },
    questions: [
      q("mobil-1","Hvad er skribentens hovedforslag?",["Mobilfrie zoner og perioder kombineret med faglig brug efter lærerens valg","At alle elever skal have to telefoner","At mobilen altid skal være fri i timerne","At telefoner kun må bruges af voksne"],"Mobilfrie zoner og perioder kombineret med faglig brug efter lærerens valg","Hovedindhold",6,"Forslaget står tydeligt midt i teksten og nuancerer de to yderpunkter."),
      q("mobil-2","Hvilken fordel ved telefonen nævner skribenten?",["Den kan bruges som fagligt redskab","Den får automatisk alle til at koncentrere sig","Den erstatter læreren","Den gør regler overflødige"],"Den kan bruges som fagligt redskab","Scanning og informationssøgning",6,"Teksten giver flere konkrete eksempler på faglig brug."),
      q("mobil-3","Hvad mener skribenten er vigtigere end at kalde mobilen god eller dårlig?",["At lære at styre sin opmærksomhed","At købe en nyere telefon","At bruge mobilen i alle pauser","At fjerne computere"],"At lære at styre sin opmærksomhed","Hovedindhold",6,"Det står som konklusionen på grundteksten."),
      q("mobil-4","Hvilket argument bruger teksten for, at telefonen bør være væk under bestemte aktiviteter?",["Den kan trække opmærksomheden væk","Den virker aldrig indendørs","Den er for tung","Den kan kun bruges til spil"],"Den kan trække opmærksomheden væk","Scanning og informationssøgning",6,"Første argument handler om notifikationer og opmærksomhed."),
      q("mobil-5","Hvilken teksttype er dette først og fremmest?",["Et debatindlæg med et synspunkt og argumenter","En neutral busplan","En novelle uden holdning","En opskrift"],"Et debatindlæg med et synspunkt og argumenter","Skimning og overblik",6,"Skribenten fremsætter et forslag, argumenterer og møder modargumenter."),
      q("mobil-6","Hvorfor nævner skribenten regler om tale og computerbrug?",["For at vise, at elever allerede håndterer regler, der afhænger af situationen","For at bevise, at computere bør forbydes","For at ændre emnet til støj","For at vise, at alle regler skal være ens"],"For at vise, at elever allerede håndterer regler, der afhænger af situationen","Tekststruktur",7,"Eksemplerne understøtter svaret på modargumentet om, at nuancerede regler er for komplicerede."),
      q("mobil-7","Hvad betyder sammenligningen med cykelhjelm og trafikregler?",["Individuelle strategier og fælles regler kan supplere hinanden","Telefoner bør bruges på cykel","Alle digitale problemer skyldes trafik","Regler er unødvendige, hvis man er dygtig"],"Individuelle strategier og fælles regler kan supplere hinanden","Inferens",8,"Analogien viser, at to forskellige former for beskyttelse/træning ikke udelukker hinanden."),
      q("mobil-8","Hvad er funktionen af eksemplet med den voksne, der svarer på arbejdsmail under et møde?",["At pege på en mulig dobbeltstandard i debatten","At bevise, at voksne aldrig bruger telefoner","At anbefale flere arbejdsmails","At forklare hvordan mail virker"],"At pege på en mulig dobbeltstandard i debatten","Inferens",9,"Skribenten viser, at samme adfærd kan bedømmes forskelligt hos unge og voksne."),
    ],
  },
  {
    id: "svampe",
    section: "Fagtekst",
    title: "Skovens skjulte forbindelser",
    genre: "Naturvidenskabelig formidling",
    blocks: {
      6: `Når man går gennem en skov, ser man træstammer, blade, mos og måske svampe. Men en stor del af skovens liv findes under jorden. Her vokser fine svampetråde mellem jordpartikler og omkring planternes rødder. Trådene kaldes hyfer, og et netværk af hyfer kaldes et mycelium.

Mange svampe lever i tæt samarbejde med planter. Samarbejdet kaldes mykorrhiza. Svampens tråde kan nå ud i meget små rum i jorden og optage vand og mineraler. Planten kan derfor få adgang til stoffer, som dens egne rødder har sværere ved at nå. Til gengæld får svampen sukkerstoffer, som planten har dannet gennem fotosyntese.

Det er fristende at beskrive forholdet som en handel: mineraler mod sukker. I virkeligheden er systemet mere kompliceret. Forskellige svampearter fungerer forskelligt, og samme plante kan samarbejde med flere svampe på én gang. Jordens surhed, fugtighed og mængden af næringsstoffer påvirker også forbindelsen.

Svampene er desuden vigtige nedbrydere. Når blade og dødt træ falder til jorden, kan svampe være med til at nedbryde materialet. På den måde bliver grundstoffer frigivet og kan indgå i nye organismer. Uden nedbrydning ville næringsstoffer i langt højere grad blive bundet i dødt materiale.

Forskere undersøger derfor svampe for at forstå hele skovens kredsløb, ikke kun de svampehatte, vi kan se.`,
      7: `

I medier bliver mykorrhiza-netværk nogle gange kaldt “skovens internet”. Billedet er fængende, fordi svampetråde kan forbinde rødder fra flere planter. I forsøg har forskere også målt bevægelse af kulstof eller andre stoffer mellem planter og svampe. Men sammenligningen med et menneskeskabt internet kan føre tankerne for langt. Et biologisk netværk har ikke kabler, servere og beskeder med bevidste afsendere.

Når en metafor er god, gør den noget svært lettere at forestille sig. Når den bliver taget for bogstaveligt, kan den skjule usikkerhed. Derfor er forskere ofte mere forsigtige med ord som “kommunikerer” og “hjælper”, end populære artikler er.`,
      8: `

Et centralt spørgsmål er, hvordan man beviser, hvor et stof kommer fra. Hvis forskere finder kulstof fra én plante i en anden, kan kulstoffet have bevæget sig gennem svampen, men der kan også være andre veje. Eksperimenter forsøger derfor at kontrollere forhold som jordkontakt, luft og mikroorganismer. Nogle forsøg bruger kulstof med en særlig isotopsammensætning som et slags sporstof. Derefter måler forskerne, hvor sporet dukker op.

Selv når en overførsel er målt, er næste spørgsmål, hvad den betyder for planterne. En lille mængde kulstof er ikke nødvendigvis afgørende for en naboplantes vækst. Det er derfor forskelligt at vise, at noget kan bevæge sig, og at bevægelsen har stor økologisk betydning.`,
      9: `

Diskussionen handler også om ordet samarbejde. I daglig tale forbinder vi samarbejde med et fælles mål. Evolution fungerer ikke på den måde. En svamp og en plante kan begge få en fordel af forbindelsen uden at “ønske” at hjælpe hinanden. Under andre forhold kan balancen ændre sig, så den ene organisme får mere ud af relationen end den anden.

Det gør ikke mykorrhiza mindre interessant. Tværtimod viser forskningen, hvor vanskeligt det er at presse levende systemer ind i enkle kategorier som ven, fjende eller netværkskabel. Skoven består af relationer, der ændrer sig med arter, årstid og miljø.

Når man læser om nye resultater, er det derfor nyttigt at skelne mellem tre ting: Hvad har forskerne faktisk målt? Hvilken forklaring foreslår de? Og hvilken metafor bruger formidleren for at gøre resultatet forståeligt? De tre lag kan ligne hinanden i en kort overskrift, men de er ikke det samme.`,
    },
    questions: [
      q("svamp-1","Hvad er et mycelium?",["Et netværk af svampetråde","En type trærod","En svampehat","Et mineral i jorden"],"Et netværk af svampetråde","Scanning og informationssøgning",6,"Begrebet defineres i første afsnit."),
      q("svamp-2","Hvad kan planten få gennem mykorrhiza?",["Bedre adgang til vand og mineraler","Direkte sollys under jorden","Nye blade fra svampen","Mere vind"],"Bedre adgang til vand og mineraler","Hovedindhold",6,"Svampetrådene kan optage vand og mineraler i små rum i jorden."),
      q("svamp-3","Hvad får svampen typisk fra planten?",["Sukkerstoffer","Sten","Ilt fra en pumpe","Svampehatte"],"Sukkerstoffer","Scanning og informationssøgning",6,"Planten danner sukker gennem fotosyntese og leverer en del til svampen."),
      q("svamp-4","Hvorfor er svampe vigtige som nedbrydere?",["De hjælper med at frigive næringsstoffer fra dødt materiale","De stopper alt planteliv","De gør alle blade levende igen","De fjerner sollys"],"De hjælper med at frigive næringsstoffer fra dødt materiale","Hovedindhold",6,"Nedbrydningen frigiver grundstoffer, som kan indgå i nye organismer."),
      q("svamp-5","Hvad er tekstens overordnede emne?",["Svampes rolle og forbindelser i skovens økosystem","Hvordan man tilbereder spisesvampe","Historien om internettet","Hvordan man bygger en skovsti"],"Svampes rolle og forbindelser i skovens økosystem","Skimning og overblik",6,"Alle afsnit handler om svampe, planter og deres rolle i skoven."),
      q("svamp-6","Hvorfor kan udtrykket “skovens internet” være både nyttigt og problematisk?",["Det gør netværket let at forestille sig, men kan få biologien til at lyde mere menneskestyret end den er","Det er svampens officielle latinske navn","Det viser, at der ligger computere i jorden","Det betyder, at træer sender e-mails"],"Det gør netværket let at forestille sig, men kan få biologien til at lyde mere menneskestyret end den er","Ord i kontekst",7,"Teksten forklarer både metaforens formidlingsværdi og risikoen ved at tage den bogstaveligt."),
      q("svamp-7","Hvorfor bruger nogle forsøg særlige isotoper?",["For at kunne spore hvor et stof bevæger sig","For at gøre svampene større","For at ændre vejret","For at tælle træernes blade"],"For at kunne spore hvor et stof bevæger sig","Scanning og informationssøgning",8,"Isotopsammensætningen fungerer som et spor, forskerne kan følge."),
      q("svamp-8","Hvad er forskellen på at påvise overførsel af kulstof og at vise stor økologisk betydning?",["Et stof kan godt flytte sig i små mængder uden at ændre naboplantens vækst væsentligt","Der er ingen forskel","Økologisk betydning kan kun måles om vinteren","Kulstof kan aldrig flytte sig"],"Et stof kan godt flytte sig i små mængder uden at ændre naboplantens vækst væsentligt","Inferens",9,"Teksten advarer mod at slutte fra registreret bevægelse til stor biologisk effekt."),
    ],
  },
  {
    id: "cloze",
    section: "Cloze",
    title: "At læse med forskellige gear",
    genre: "Cloze-tekst om læsning",
    blocks: {
      6: `En god læser læser ikke nødvendigvis alle tekster på samme måde. Før man begynder, kan man spørge sig selv, hvad man skal bruge teksten til. Hvis opgaven er at finde et bestemt klokkeslæt i et program, er det sjældent nødvendigt at læse hvert ord langsomt. Her kan man i stedet ___(1)___ efter tider, overskrifter og nøgleord.

Hvis man derimod skal forklare hovedideen i en artikel, er det nyttigt først at skabe ___(2)___. Man kan kigge på titel, mellemoverskrifter og begyndelsen af afsnittene. Derefter læser man mere grundigt de steder, der ser vigtige ud.

Nogle svar står direkte i teksten. Andre kræver, at læseren forbinder flere oplysninger. Det kaldes ofte at læse mellem linjerne eller lave en ___(3)___. En sådan slutning skal stadig kunne begrundes med spor i teksten; den er ikke bare et frit gæt.

Når man møder et ukendt ord, kan man først undersøge ordene og sætningerne omkring det. Denne ___(4)___ kan ofte give en sandsynlig betydning, før man bruger en ordbog.

Til sidst er det vigtigt at kontrollere, om ens svar faktisk passer til spørgsmålet. Det kan lyde enkelt, men under tidspres kan man let svare på noget, teksten siger, uden at det er præcis det, der bliver ___(5)___.`,
      7: `

Strategier virker bedst, når de vælges efter formålet. Hvis man altid læser hurtigt, overser man nuancer. Hvis man altid læser langsomt, kan man bruge så meget tid på begyndelsen, at man ikke når resten. Derfor handler prøvelæsning ikke kun om fart, men om at kunne ___(6)___ tempo og metode.

Et godt trick er at markere usikre spørgsmål og gå videre. Når man vender tilbage, har man ofte et bedre overblik over teksten.`,
      8: `

Ved svære spørgsmål kan man undersøge svarmulighederne én ad gangen. Nogle kan afvises, fordi de modsiger teksten. Andre er måske sande i virkeligheden, men kan ikke dokumenteres i den tekst, man har fået. Man skal altså skelne mellem sin egen viden og tekstens ___(7)___.

Det gælder især spørgsmål om afsender og formål. Her må man se på ordvalg, genre, kilde og den sammenhæng, teksten indgår i.`,
      9: `

Den mest krævende læsning opstår ofte, når flere svarmuligheder virker næsten rigtige. Så er opgaven ikke blot at finde en sætning med de samme ord, men at afgøre, hvilken mulighed der er mest ___(8)___ i forhold til hele teksten.

Efter en prøve kan fejl bruges som data. Hvis de fleste fejl kommer i spørgsmål, hvor information står direkte, skal man måske træne scanning og koncentration. Hvis fejlene især ligger i inferens eller afsender/formål, kræver det en anden strategi. På den måde bliver resultatet ikke kun et tal, men et udgangspunkt for den næste ___(9)___.`,
    },
    questions: [
      q("cloze-1","Hvilket ord passer bedst i hul (1)?",["scanne","synge","tegne","sove"],"scanne","Sammenhæng og cloze",6,"Sætningen handler om hurtigt at lede efter bestemte oplysninger."),
      q("cloze-2","Hvilket ord passer bedst i hul (2)?",["overblik","støj","afstand","tvivl"],"overblik","Sammenhæng og cloze",6,"Titel og mellemoverskrifter bruges til at skabe overblik."),
      q("cloze-3","Hvilket ord passer bedst i hul (3)?",["inferens","overskrift","stavelse","pause"],"inferens","Sammenhæng og cloze",6,"At forbinde spor og læse mellem linjerne beskrives som inferens."),
      q("cloze-4","Hvilket ord passer bedst i hul (4)?",["kontekst","parkeringsplads","tabel","lydprøve"],"kontekst","Sammenhæng og cloze",6,"Ordene omkring et ukendt ord udgør dets kontekst."),
      q("cloze-5","Hvilket ord passer bedst i hul (5)?",["spurgt om","malet","gemt væk","udtalt"],"spurgt om","Sammenhæng og cloze",6,"Sætningen handler om at svare på det konkrete spørgsmål."),
      q("cloze-6","Hvilket ord passer bedst i hul (6)?",["tilpasse","glemme","fordoble","skjule"],"tilpasse","Sammenhæng og cloze",8,"Pointen er at ændre tempo og metode efter læseformålet."),
      q("cloze-7","Hvilket ord passer bedst i hul (7)?",["belæg","humør","farve","længde"],"belæg","Sammenhæng og cloze",9,"Man skal kunne finde belæg i teksten frem for at bruge løs baggrundsviden."),
      q("cloze-8","Hvilket ord passer bedst i hul (8)?",["præcis","farverig","kort","overraskende"],"præcis","Sammenhæng og cloze",9,"Når flere muligheder er næsten rigtige, skal man vælge den mest præcise i forhold til teksten."),
    ],
  },
];

const countsByGrade: Record<6|7|8|9, Record<string, number>> = {
  6: { "Søgelæsning":5, "Informerende tekst":5, "Fortællende tekst":5, "Argumenterende tekst":5, "Fagtekst":5, "Cloze":5 },
  7: { "Søgelæsning":6, "Informerende tekst":6, "Fortællende tekst":6, "Argumenterende tekst":6, "Fagtekst":6, "Cloze":5 },
  8: { "Søgelæsning":7, "Informerende tekst":7, "Fortællende tekst":7, "Argumenterende tekst":7, "Fagtekst":6, "Cloze":6 },
  9: { "Søgelæsning":8, "Informerende tekst":9, "Fortællende tekst":9, "Argumenterende tekst":8, "Fagtekst":8, "Cloze":8 },
};

function mulberry32(seed:number){let value=seed>>>0;return()=>{value+=0x6d2b79f5;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function shuffled<T>(items:T[],random:()=>number){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}

function textForGrade(passage:ReadingPassage,grade:6|7|8|9){return ([6,7,8,9] as const).filter(g=>g<=grade).map(g=>passage.blocks[g]||"").join("\n").trim()}

export function buildReadingExamSet(seed:number,targetGrade:number):ReadingExamPart[]{
  const grade=(Math.max(6,Math.min(9,Math.round(targetGrade))) as 6|7|8|9);
  const random=mulberry32(Number.isFinite(seed)?seed:1);
  return passages.map(passage=>{
    const wanted=countsByGrade[grade][passage.section]||0;
    const eligible=passage.questions.filter(question=>question.minGrade<=grade);
    if(eligible.length<wanted)throw new Error(`Læsebanken mangler spørgsmål: ${passage.section} · ${grade}. klasse (${eligible.length}/${wanted})`);
    const selected=eligible.slice(0,wanted).map(question=>({...question,options:shuffled(question.options,random)}));
    return {...passage,text:textForGrade(passage,grade),questions:selected};
  });
}

export function readingQuestionCount(parts:ReadingExamPart[]){return parts.reduce((sum,part)=>sum+part.questions.length,0)}
export function readingWordCount(parts:ReadingExamPart[]){return parts.reduce((sum,part)=>sum+(part.text.match(/[\p{L}\p{N}]+/gu)||[]).length,0)}
export function strategyCounts(parts:ReadingExamPart[]){const result:Record<string,number>={};for(const part of parts)for(const question of part.questions)result[question.strategy]=(result[question.strategy]||0)+1;return result}
