import type { GradedGrammarLibrary, GradedGrammarQuestion } from "./grade-progression";

const choice=(q:string,options:string[],answer:string,why:string,minGrade:number):GradedGrammarQuestion=>({q,options,answer,why,kind:"choice",minGrade});
const text=(q:string,answer:string,why:string,minGrade:number,acceptedAnswers:string[]=[answer]):GradedGrammarQuestion=>({q,options:[],answer,why,kind:"text",acceptedAnswers,minGrade,placeholder:"Skriv dit svar…"});
const rewrite=(q:string,answer:string,why:string,minGrade:number,acceptedAnswers:string[]=[answer]):GradedGrammarQuestion=>({q,options:[],answer,why,kind:"rewrite",acceptedAnswers,minGrade,placeholder:"Skriv den forbedrede tekst…"});

export const morphologyTextLibrary:GradedGrammarLibrary={
  "Ordfamilier":{
    basis:[
      choice("Hvilke ord hører til samme ordfamilie?",["læse, læser, læsning","læse, cykel, grøn","bog, løbe, lille","hus, hurtigt, skrev"],"læse, læser, læsning","Ordene deler betydningskernen læs-.",4),
      choice("Hvilket ord hører til familien omkring 'skriv-'?",["skriver","spiser","skole","siger"],"skriver","Skriver har samme betydningskerne som skrive.",4),
      choice("Hvad har 'ven', 'venlig' og 'venskab' til fælles?",["De er beslægtede i betydning og ordbygning","De er alle udsagnsord","De betyder præcis det samme","De står altid i flertal"],"De er beslægtede i betydning og ordbygning","De hører til samme ordfamilie.",4),
      text("Skriv et ord fra ordfamilien til 'leg'.","leger","Fx leger, legede, legende og legetøj er beslægtede med leg.",4,["leger","legede","legende","legetøj","lege"]),
      choice("Hvilket ord passer IKKE i familien?",["køre","kører","kørsel","køkken"],"køkken","Køkken ligner lydligt, men har ikke samme betydningskerne som køre.",4)
    ],
    traening:[
      choice("Hvordan kan ordfamilier hjælpe med stavning?",["Man kan genkende den samme betydningsdel i forskellige bøjnings- og afledningsformer","Alle ord i familien staves helt ens","De fjerner behovet for endelser","De viser kun store bogstaver"],"Man kan genkende den samme betydningsdel i forskellige bøjnings- og afledningsformer","Morfologisk slægtskab kan gøre stavemønstre tydeligere.",4),
      choice("Hvilket ord er afledt af 'glad'?",["glæde","glas","glide","gade"],"glæde","Glæde er betydningsmæssigt og historisk beslægtet med glad.",4),
      choice("Hvilken række viser flere ordklasser i samme familie?",["arbejde, arbejder, arbejdsløs","hund, kat, hest","rød, blå, grøn","i, på, under"],"arbejde, arbejder, arbejdsløs","Samme kerne bruges i forskellige former og funktioner.",4),
      text("Skriv et navneord fra ordfamilien til 'at beslutte'.","beslutning","Beslutning er et navneord dannet ud fra beslutte.",4),
      rewrite("Erstat gentagelsen med et beslægtet ord: 'Vi analyserer teksten. Vores analyse af teksten viser...'","Vi analyserer teksten. Vores analyse viser...","Ordfamilien gør det muligt at variere form uden at miste emnet.",4)
    ],
    udfordring:[
      choice("Hvad viser ordfamilien 'demokratisk, demokrati, demokratisere'?",["En betydningskerne kan indgå i forskellige ordklasser og afledninger","Alle tre ord har samme ordklasse","Endelser ændrer aldrig betydning","Kun navneord kan danne familier"],"En betydningskerne kan indgå i forskellige ordklasser og afledninger","Morfologi forbinder betydningskerne og grammatisk funktion.",4),
      choice("Hvorfor kan kendskab til ordfamilier styrke ordforrådet?",["Et kendt ord kan hjælpe eleven med at forstå beslægtede nye ord","Man behøver kun lære ét ord i hele sproget","Alle beslægtede ord er synonymer","Det gør udtale ligegyldig"],"Et kendt ord kan hjælpe eleven med at forstå beslægtede nye ord","Morfologisk bevidsthed kan støtte inferens af betydning.",4),
      text("Skriv et tillægsord i familien 'fare'.","farlig","Farlig er afledt af fare.",4),
      choice("Hvilket ord er længst væk fra familien 'sikker'?",["usikker","sikkerhed","sikre","sikke"],"sikke","Sikke er ikke betydningsmæssigt beslægtet med sikker.",4),
      rewrite("Brug en ordfamilie til at gøre sammenhængen tydelig: 'Forslaget skal vurderes. Denne ___ tager tid.'","Forslaget skal vurderes. Denne vurdering tager tid.","Vurderes/vurdering binder sætningerne sammen tematisk.",4)
    ]
  },
  "Rodmorfemer":{
    basis:[
      choice("Hvad er et rodmorfem?",["Den centrale betydningsbærende del af et ord","Et tegnsætningstegn","Et helt afsnit","Et udsagnsords tid"],"Den centrale betydningsbærende del af et ord","Rodmorfemet bærer ordets grundbetydning.",6),
      choice("Hvad er rodmorfemet i 'hunde'?",["hund","-e","hun","hunde"],"hund","Hund er betydningskernen; -e markerer flertal.",6),
      choice("Hvad er rodmorfemet i 'skolebog'?",["skole og bog","-e","-bog alene","sk"],"skole og bog","Sammensatte ord kan have flere rodmorfemer.",6),
      text("Skriv rodmorfemet i 'læser'.","læs","Læs- bærer den centrale betydning.",6),
      choice("Hvilken del er rod i 'venlig'?",["ven","-lig","v","lig"],"ven","Ven er betydningskernen; -lig er en afledning.",6)
    ],
    traening:[
      choice("Hvor mange rodmorfemer er der i 'cykelhjelm'?",["2","1","3","0"],"2","Cykel og hjelm er hver sit rodmorfem.",6),
      choice("Find rodmorfemet i 'uheldig'.",["held","u-","-ig","uheld"],"held","U- og -ig er afledningsdele omkring roden held.",6),
      choice("Hvilken analyse er bedst af 'husene'?",["hus + -ene","hu + sene","huse + ne som to rødder","husene er ét rodmorfem"],"hus + -ene","Hus er rod; -ene markerer bestemt flertal.",6),
      text("Skriv de to rodmorfemer i 'sommerferie' adskilt med +.","sommer + ferie","Sammensætningen består af to betydningsbærende rødder.",6,["sommer+ferie","sommer + ferie"]),
      choice("Hvorfor er rodmorfemer nyttige i stavning?",["Den stabile betydningskerne kan genkendes på tværs af former","De viser altid komma","De erstatter lydanalyse helt","De bruges kun i latin"],"Den stabile betydningskerne kan genkendes på tværs af former","Morfemprincippet hjælper med at se, hvorfor orddele ofte bevarer stavning.",6)
    ],
    udfordring:[
      choice("Hvilken analyse passer til 'arbejdsløshed'?",["arbejd + -s- + løs + -hed","arbe + jdsløshed","arbejdsløshed som fire tilfældige stavelser","-hed er rodmorfemet"],"arbejd + -s- + løs + -hed","Ordet består af betydningsbærende elementer og afledning.",6),
      choice("Hvad er rodmorfemerne i 'skolegårdsdør'?",["skole, gård, dør","skolegård alene","-s og dør","sk, går, d"],"skole, gård, dør","Tre rødder indgår i den lange sammensætning.",6),
      text("Skriv rodmorfemet i 'uforståelig'.","forstå","Forstå er betydningskernen; u- og -elig ændrer betydning/funktion.",6),
      choice("Hvilken fordel har morfemanalyse af lange fagord?",["Man kan dele ordet i kendte betydningsdele og udlede betydningen","Man behøver ikke læse resten af teksten","Alle fagord bliver navneord","Det ændrer udtalen"],"Man kan dele ordet i kendte betydningsdele og udlede betydningen","Morfologisk analyse er en strategi til ordforståelse.",6),
      rewrite("Del ordet med plusser: 'klimaforandringer'.","klima + forandring + er","Klima og forandring er betydningskerner; -er markerer flertal.",6,["klima+forandring+er","klima + forandring + er"])
    ]
  },
  "Bøjningsmorfemer":{
    basis:[
      choice("Hvad gør et bøjningsmorfem?",["Tilføjer grammatisk information uden at skabe en helt ny betydningskerne","Gør altid ordet til et nyt ord","Er det samme som punktum","Viser kun udtale"],"Tilføjer grammatisk information uden at skabe en helt ny betydningskerne","Bøjning markerer fx tal, bestemthed eller tid.",6),
      choice("Hvad er bøjningsmorfemet i 'katte'?",["-e","kat","k","-te"],"-e","-e markerer flertal i denne form.",6),
      choice("Hvad markerer -r i 'læser'?",["nutid","flertal","bestemthed","ejefald"],"nutid","-r er en del af nutidsbøjningen.",6),
      text("Skriv bøjningsendelsen i 'huset'.","-et","-et markerer bestemt ental for et-ordet hus.",6,["et","-et"]),
      choice("Hvilken del markerer datid i 'spillede'?",["-ede","spil","-s","-r"],"-ede","Endelsen markerer datid i det regelmæssige udsagnsord.",6)
    ],
    traening:[
      choice("Hvad markerer -ne i 'bilerne'?",["bestemt flertal","nutid","højere grad","navnemåde"],"bestemt flertal","Bilerne er de bestemte biler.",6),
      choice("Hvilket ord viser tydeligt et bøjningsmorfem for højere grad?",["hurtigere","hurtig","hurtigst","hurtighed"],"hurtigere","-ere markerer højere grad.",6),
      choice("Hvilken analyse er korrekt: 'hundens'?",["hund + -en + -s","hund + -lig","hun + dens","hunde + ns som rod"],"hund + -en + -s","-en markerer bestemthed, -s ejefald.",6),
      text("Skriv bøjningsmorfemet for flertal i 'bøger'.","-er","-er markerer her flertal.",6,["er","-er"]),
      choice("Hvad er forskellen på bøjning og afledning?",["Bøjning ændrer grammatisk form; afledning kan danne et nyt ord eller ny ordklasse","Der er ingen forskel","Bøjning bruges kun til navneord","Afledning viser kun tid"],"Bøjning ændrer grammatisk form; afledning kan danne et nyt ord eller ny ordklasse","Det er et centralt skel i morfologi.",6)
    ],
    udfordring:[
      choice("Hvilke bøjningsoplysninger findes i 'husenes'?",["bestemt flertal + ejefald","nutid + datid","ubestemt ental","højeste grad"],"bestemt flertal + ejefald","Husene er bestemt flertal, og -s markerer genitiv.",6),
      choice("Hvilken del af 'største' er bøjningsmorfem?",["-st/-e","stor som helhed","s-","-hed"],"-st/-e","Formen markerer højeste grad og bestemt/flertalsform.",6),
      text("Analyser 'spillede' som rod + bøjning.","spil + lede","Ordet kan morfologisk opdeles mere detaljeret, men i skolebrug kan stammen spille- og datidsendelsen -de/-ede identificeres.",6,["spil + lede","spille + de","spil + ede"]),
      choice("Hvorfor kan bøjningsmorfemer hjælpe med læseforståelse?",["De fortæller om fx tid, antal og bestemthed","De gør alle ord konkrete","De viser kildens troværdighed","De er kun pynt"],"De fortæller om fx tid, antal og bestemthed","Grammatisk information påvirker fortolkningen af sætningen.",6),
      rewrite("Marker bøjningsdelene med bindestreg: 'bøgernes'.","bog-er-ne-s","Formen rummer flertal, bestemthed og ejefald efter stammen.",6,["bog-er-ne-s","bøg-er-ne-s"])
    ]
  },
  "Afledningsmorfemer":{
    basis:[
      choice("Hvad gør et afledningsmorfem?",["Det kan ændre betydning eller danne et nyt ord/ordklasse","Det markerer kun komma","Det er altid et rodmorfem","Det bruges kun i flertal"],"Det kan ændre betydning eller danne et nyt ord/ordklasse","Afledning skaber nye leksikalske ord.",7),
      choice("Hvilken del er afledning i 'venlig'?",["-lig","ven","v-","-en"],"-lig","-lig danner et tillægsord ud fra navneordet ven.",7),
      choice("Hvilken del er afledning i 'ulykkelig'?",["u- og -lig","lykke alene","-en","ingen"],"u- og -lig","Forstavelsen og endelsen ændrer betydning og ordtype.",7),
      text("Skriv afledningsendelsen i 'sikkerhed'.","-hed","-hed danner et navneord ud fra sikker.",7,["hed","-hed"]),
      choice("Hvilket ord er dannet ved afledning?",["lærer","biler","husene","spiste"],"lærer","-er kan her danne personbetegnelsen lærer af lære.",7)
    ],
    traening:[
      choice("Hvad sker der i 'mulig' → 'umulig'?",["Forstavelsen u- ændrer betydningen til det modsatte","Ordet bliver datid","Ordet bliver flertal","Intet ændrer sig"],"Forstavelsen u- ændrer betydningen til det modsatte","U- er et produktivt afledningsmorfem.",7),
      choice("Hvilken afledning danner et navneord?",["aktiv → aktivitet","aktiv → aktive","aktiv → aktivt","aktiv → mere aktiv"],"aktiv → aktivitet","-itet danner et abstrakt navneord.",7),
      choice("Hvilket morfem danner ofte en personbetegnelse?",["-er i 'maler'","-ne i 'husene'","-r i 'spiser'","-st i 'størst'"],"-er i 'maler'","Her er -er afledning, ikke blot bøjning.",7),
      text("Skriv et ord dannet af 'fri' med afledningen -hed.","frihed","-hed danner et abstrakt navneord.",7),
      rewrite("Dan et tillægsord: 'fare' + passende afledning.","farlig","-lig danner tillægsordet farlig.",7)
    ],
    udfordring:[
      choice("Hvorfor kan samme endelse have forskellig funktion?",["Morfemer skal analyseres i det konkrete ord; fx -er kan være bøjning eller afledning","Alle endelser betyder altid det samme","Endelser har ingen betydning","Kun rodmorfemer kan analyseres"],"Morfemer skal analyseres i det konkrete ord; fx -er kan være bøjning eller afledning","Funktion afhænger af ordets struktur.",7),
      choice("Hvilken analyse af 'arbejdsløshed' er bedst?",["arbejd + -s- + løs + -hed","arbejd + -er","arbejds + løshed som ét morfem","-hed er bøjningsendelse"],"arbejd + -s- + løs + -hed","-løs og -hed bidrager til afledning omkring roden.",7),
      text("Skriv afledningsmorfemet i 'læselig'.","-lig","-lig skaber tillægsordet læselig.",7,["lig","-lig"]),
      choice("Hvilken afledning ændrer mest tydeligt ordklasse?",["beslutte → beslutning","bog → bøger","stor → større","spise → spiste"],"beslutte → beslutning","Udsagnsord bliver til navneord.",7),
      rewrite("Dan et navneord af 'evaluere'.","evaluering","-ing danner navneordet evaluering.",7)
    ]
  },
  "Forstavelser og endelser":{
    basis:[
      choice("Hvilken forstavelse betyder ofte 'ikke/modsat'?",["u-","be-","-lig","-hed"],"u-","Fx uenig, usikker og umulig.",5),
      choice("Hvilken del står foran roden i 'genlæse'?",["gen-","-se","læs","-e"],"gen-","Gen- betyder her at gøre noget igen.",5),
      choice("Hvilken endelse findes i 'venlig'?",["-lig","ven-","u-","-er"],"-lig","-lig står efter roden.",5),
      text("Skriv forstavelsen i 'misforstå'.","mis-","Mis- bidrager med betydningen forkert/fejl.",5,["mis","mis-"]),
      choice("Hvad betyder gen- ofte?",["igen","ikke","meget","flertal"],"igen","Fx genlæse = læse igen.",5)
    ],
    traening:[
      choice("Hvad gør forstavelsen 'u-' i 'uvenlig'?",["Negerer eller vender betydningen","Gør ordet til datid","Viser flertal","Markerer bestemthed"],"Negerer eller vender betydningen","Uvenlig betyder ikke venlig.",5),
      choice("Hvilket ord har både forstavelse og endelse?",["uheldig","hund","løber","bord"],"uheldig","U- står foran roden held, og -ig står efter.",5),
      choice("Hvilken endelse danner ofte abstrakte navneord?",["-hed","-r","-ne","-st"],"-hed","Fx frihed og sikkerhed.",5),
      text("Dan et ord med gen- af 'starte'.","genstarte","Genstarte betyder at starte igen.",5),
      rewrite("Dan et modsætningsord med u-: 'enig'.","uenig","Forstavelsen u- ændrer betydningen.",5)
    ],
    udfordring:[
      choice("Hvilken betydning har 'mis-' i 'misinformere'?",["forkert eller fejlagtigt","igen","uden","meget"],"forkert eller fejlagtigt","Misinformere betyder at give forkert/misvisende information.",5),
      choice("Hvordan kan forstavelser støtte forståelsen af nye fagord?",["De giver ledetråde til betydningen af ordets dele","De gør alle ord ens","De viser kildens årstal","De bruges kun til navne"],"De giver ledetråde til betydningen af ordets dele","Morfologiske byggesten kan bruges som læsestrategi.",5),
      text("Hvilken forstavelse står i 'overvurdere'?","over-","Over- bidrager med betydningen for meget/højere end passende.",5,["over","over-"]),
      rewrite("Dan et ord der betyder 'vurdere for lavt' ved at bruge en forstavelse.","undervurdere","Under- ændrer betydningen til at vurdere lavere end rimeligt.",5),
      choice("Hvilket par viser samme rod med forskellige afledninger?",["sikkerhed / usikker","bil / cykel","går / hus","og / men"],"sikkerhed / usikker","Begge bygger på roden sikker.",5)
    ]
  },
  "Nominalisering":{
    basis:[
      choice("Hvad er en nominalisering?",["Når en handling eller egenskab udtrykkes som et navneord","Når et navneord bliver til komma","Når en sætning bliver et spørgsmål","Når et ord står i flertal"],"Når en handling eller egenskab udtrykkes som et navneord","Fx evaluere → evaluering.",7),
      choice("Hvilket ord er en nominalisering?",["vurdering","vurdere","vurderer","vurderede"],"vurdering","Handlingen vurdere er gjort til navneordet vurdering.",7),
      choice("Hvilket par viser nominalisering?",["beslutte → beslutning","stor → større","bog → bøger","gå → gik"],"beslutte → beslutning","Et udsagnsord bliver til et navneord.",7),
      text("Skriv nominaliseringen af 'evaluere'.","evaluering","Evaluering er navneordsformen.",7),
      choice("Hvad kan mange nominaliseringer gøre ved en tekst?",["Gøre den tættere og mere abstrakt","Gøre alle sætninger mundtlige","Fjerne navneord","Gøre alt til direkte tale"],"Gøre den tættere og mere abstrakt","Handlinger pakkes ind i navneord.",7)
    ],
    traening:[
      choice("Hvilken version er mest handlingspræget?",["Vi vurderede forslaget.","Der skete en vurdering af forslaget.","Vurderingen af forslaget fandt sted.","En vurdering blev gennemført."],"Vi vurderede forslaget.","Aktivt udsagnsord og tydelig aktør gør handlingen mere direkte.",7),
      rewrite("Gør mindre nominaliseret: 'Der blev foretaget en evaluering af projektet.'","Vi evaluerede projektet.","Udsagnsordet evaluerede gør handlingen tydelig og kan synliggøre aktøren.",7),
      choice("Hvilken nominalisering kan skjule aktøren?",["beslutningen blev truffet","ledelsen besluttede","eleverne foreslog","læreren skrev"],"beslutningen blev truffet","Navneord + passiv gør det uklart, hvem der traf beslutningen.",7),
      text("Gør 'analysere' til et navneord.","analyse","Analyse er nominalformen.",7),
      choice("Hvornår kan nominalisering være nyttig?",["Når et komplekst begreb skal navngives og genbruges præcist","Aldrig","Kun i direkte tale","Kun i 1. klasse"],"Når et komplekst begreb skal navngives og genbruges præcist","Fagtekster bruger ofte nominalisering til begrebsdannelse.",7)
    ],
    udfordring:[
      choice("Hvilken effekt har 'implementeringen af ændringen' sammenlignet med 'vi ændrede praksis'?",["Den første er mere abstrakt og kan gøre aktøren mindre synlig","Den første er altid mere præcis","Den anden har ingen udsagnsord","Der er ingen forskel"],"Den første er mere abstrakt og kan gøre aktøren mindre synlig","Nominalisering ændrer informationsstruktur og stil.",7),
      rewrite("Gør ansvaret tydeligt: 'Gennemførelsen af nedskæringen fandt sted i maj.' Ledelsen gennemførte den.","Ledelsen gennemførte nedskæringen i maj.","Aktiv verbalkonstruktion synliggør aktøren.",7),
      choice("Hvorfor er nominalisering almindelig i faglige tekster?",["Den kan samle processer til begreber, som teksten kan diskutere","Den gør alle tekster nemmere","Den fjerner behovet for definitioner","Den bruges kun for at gøre sætninger lange"],"Den kan samle processer til begreber, som teksten kan diskutere","Abstraktion kan være nyttig, når den bruges bevidst.",7),
      text("Find nominaliseringen i 'Undersøgelsen viser en forbedring af resultaterne.'","forbedring","Forbedring udtrykker processen forbedre som navneord.",7),
      choice("Form → funktion → effekt ved nominalisering?",["Navneordsform → gør proces til begreb → kan skabe faglig tæthed, men også skjule aktører","Udsagnsord → viser sted → humor","Biord → viser køn → tempo","Kendeord → viser tid → objektivitet"],"Navneordsform → gør proces til begreb → kan skabe faglig tæthed, men også skjule aktører","Det grammatiske valg har betydning for stil og ansvar.",7)
    ]
  },
  "Sammenhæng og forbindelsesord":{
    basis:[
      choice("Hvilket ord viser årsag?",["fordi","men","derefter","dog"],"fordi","Fordi kobler en begrundelse til et udsagn.",5),
      choice("Hvilket ord viser rækkefølge i tid?",["derefter","fordi","selvom","derfor"],"derefter","Derefter viser, hvad der sker efter noget andet.",5),
      choice("Hvilket ord viser modsætning?",["men","og","først","derfor"],"men","Men markerer kontrast.",5),
      text("Skriv forbindelsesordet: 'Det regnede. ___ tog vi paraplyer med.'","Derfor","Derfor markerer følge.",5),
      choice("Hvorfor er forbindelsesord vigtige?",["De viser relationen mellem sætninger og tanker","De gør alle ord til navneord","De erstatter tegnsætning","De viser kun antal"],"De viser relationen mellem sætninger og tanker","Læsere får hjælp til at følge argumentation og forløb.",5)
    ],
    traening:[
      choice("Hvilket ord passer bedst: 'Argumentet virker stærkt. ___ mangler der dokumentation.'",["Dog","Derfor","Først","Fordi"],"Dog","Dog markerer kontrast til det foregående.",5),
      choice("Hvilket forbindelsesord viser konklusion?",["derfor","mens","og","selvom"],"derfor","Derfor kobler en følge eller konklusion til tidligere information.",5),
      rewrite("Bind sammen med årsag: 'Hun tog hjem. Hun var syg.'","Hun tog hjem, fordi hun var syg.","Fordi tydeliggør årsagen.",5),
      text("Skriv et ord der kan indlede en modsætning: '___ er der også ulemper.'","Dog","Dog signalerer en modstående pointe.",5,["dog","men","alligevel"]),
      choice("Hvilken rækkefølge giver en tydelig proces?",["først – derefter – til sidst","men – fordi – dog","måske – altid – aldrig","på – under – ved"],"først – derefter – til sidst","Tidslige forbindelser skaber struktur.",5)
    ],
    udfordring:[
      choice("Hvilket forbindelsesord signalerer indrømmelse?",["selvom","derfor","desuden","først"],"selvom","Selvom markerer, at noget gælder trods en omstændighed.",5),
      rewrite("Gør argumentstrukturen tydelig: 'Forslaget er dyrt. Det kan spare energi. Det bør undersøges.'","Forslaget er dyrt, men det kan spare energi. Derfor bør det undersøges.","Men viser kontrast, og derfor markerer konklusion.",5),
      choice("Hvad er problemet med at bruge 'derfor' uden en tydelig årsag før?",["Logikken kan virke springende eller ubegrundet","Det gør sætningen til et spørgsmål","Det ændrer tempus","Der er intet problem"],"Logikken kan virke springende eller ubegrundet","Forbindelsesord lover en relation, som teksten skal kunne bære.",5),
      text("Skriv et forbindelsesord, der kan tilføje et nyt argument.","desuden","Desuden signalerer tilføjelse.",5,["desuden","endvidere","også"]),
      choice("Hvilken sammenkobling er mest præcis?",["Dataene er begrænsede; derfor bør konklusionen være forsigtig.","Dataene er begrænsede; først bør konklusionen være forsigtig.","Dataene er begrænsede; imens bør konklusionen være forsigtig.","Dataene er begrænsede; eller bør konklusionen være forsigtig."],"Dataene er begrænsede; derfor bør konklusionen være forsigtig.","Derfor markerer den logiske følge.",5)
    ]
  },
  "Reference og henvisninger":{
    basis:[
      choice("Hvad henviser 'hun' til i 'Sara tog jakken, fordi hun frøs'?",["Sara","jakken","kulden","ingen"],"Sara","Stedordet peger tilbage på Sara.",5),
      choice("Hvilken sætning har en uklar henvisning?",["Maja talte med Sofie, da hun kom hjem.","Maja kom hjem.","Sofie tog bussen.","Bogen lå på bordet."],"Maja talte med Sofie, da hun kom hjem.","Hun kan henvise til både Maja og Sofie.",5),
      choice("Hvad skal et stedord have for at være tydeligt?",["En klar referent","Et komma efter sig","Altid stort begyndelsesbogstav","Et talord"],"En klar referent","Læseren skal kunne afgøre, hvem eller hvad ordet peger på.",5),
      text("Skriv ordet som 'den' henviser til: 'Jeg tog bogen og lagde den i tasken.'","bogen","Den peger tilbage på bogen.",5),
      rewrite("Gør tydelig: 'Anna ringede til Lea, fordi hun var syg.' Det var Lea, der var syg.","Anna ringede til Lea, fordi Lea var syg.","Gentagelsen fjerner den uklare stedordshenvisning.",5)
    ],
    traening:[
      choice("Hvad er problemet i 'Eleverne lagde bøgerne i taskerne, men de var våde'?",["Det er uklart, om 'de' er eleverne, bøgerne eller taskerne","Der mangler udsagnsord","Sætningen er for kort","Alle ord er navneord"],"Det er uklart, om 'de' er eleverne, bøgerne eller taskerne","Flere mulige referenter gør henvisningen uklar.",5),
      rewrite("Gør referencen klar: 'Læreren gav eleven bogen, og den var træt.'","Læreren gav den trætte elev bogen.","Den oprindelige 'den' kan ikke naturligt henvise til personen; omskrivning gør betydningen klar.",5),
      choice("Hvilket ord kan skabe en tekstlig henvisning til et helt foregående udsagn?",["dette","løber","rød","under"],"dette","Dette kan samle og henvise til en foregående pointe.",5),
      text("Skriv henvisningsordet i 'Forslaget blev afvist. Dette overraskede eleverne.'","Dette","Dette henviser til hele den foregående hændelse.",5),
      choice("Hvorfor er tydelige referencer vigtige?",["De skaber kohæsion og forhindrer, at læseren mister tråden","De gør teksten længere","De bestemmer tekstens skrifttype","De bruges kun i dialog"],"De skaber kohæsion og forhindrer, at læseren mister tråden","Henvisninger binder information sammen.",5)
    ],
    udfordring:[
      choice("Hvilken version er mest præcis?",["Undersøgelsen peger på et mønster. Dette mønster ses især blandt de ældste elever.","Undersøgelsen peger på et mønster. Det ses der.","Undersøgelsen peger på noget. Det gør det.","Undersøgelsen og det og dette."],"Undersøgelsen peger på et mønster. Dette mønster ses især blandt de ældste elever.","Gentaget kerneord kombineret med henvisning gør kohæsionen tydelig.",5),
      rewrite("Fjern uklarheden: 'Kommunen sendte skolen planen, men de ændrede den senere.' Det var kommunen, der ændrede planen.","Kommunen sendte skolen planen, men kommunen ændrede den senere.","Gentagelsen gør aktøren entydig.",5),
      choice("Hvad er en anaforisk reference?",["En henvisning tilbage til noget tidligere i teksten","Et ord der altid peger frem","Et punktum","Et lydligt rim"],"En henvisning tilbage til noget tidligere i teksten","Mange stedord og demonstrativer fungerer anaforisk.",5),
      text("Hvilket ord henviser tilbage i 'Rapporten blev offentliggjort. Den skabte debat.'?","Den","Den peger tilbage på rapporten.",5),
      choice("Hvad kan for mange 'det', 'den' og 'de' uden tydelige referenter gøre?",["Gøre teksten vag og vanskelig at følge","Gøre teksten mere præcis","Fjerne alle gentagelser uden ulemper","Gøre teksten automatisk formel"],"Gøre teksten vag og vanskelig at følge","Økonomi i ordvalg må ikke ske på bekostning af referenceklarhed.",5)
    ]
  },
  "Korrektur i egne tekster":{
    basis:[
      choice("Hvad bør man først kigge efter i korrektur?",["Om sætningerne giver mening og er grammatisk hele","Kun skrifttypen","Kun antallet af linjer","Kun overskriften"],"Om sætningerne giver mening og er grammatisk hele","Indhold og syntaks bør kontrolleres, før småfejl finpudses.",5),
      choice("Hvilken fejl er der i 'Hun cykle hjem hver dag'?",["Udsagnsordet mangler nutids-r","Der mangler et navneord","Hjem skal være stort","Der skal stå spørgsmålstegn"],"Udsagnsordet mangler nutids-r","Det skal være cykler.",5),
      choice("Hvilken fejl er der i 'Min skole taske er blå'?",["Sammensat ord er delt","Udsagnsordet er i forkert tid","Der mangler spørgsmålstegn","Blå er et navneord"],"Sammensat ord er delt","Skoletaske skrives i ét ord.",5),
      rewrite("Ret: 'jeg bor i odense.'","Jeg bor i Odense.","Sætningen og egennavnet skal begynde med stort.",5),
      text("Ret kun udsagnsordet: 'Hun prøve at lære.'","prøver","Prøver står i nutid.",5)
    ],
    traening:[
      rewrite("Ret: 'Maja ligger bogen på bordet og går.'","Maja lægger bogen på bordet og går.","Hun placerer noget, derfor lægger.",5),
      rewrite("Ret: 'Jeg har ikke nogle spørgsmål.'","Jeg har ikke nogen spørgsmål.","Ved nægtelse bruges nogen normalt i denne betydning.",5),
      choice("Hvilken korrekturmetode er bedst til nutids-r?",["Erstat med fx spiser/spise og hør, hvilken form der passer","Sæt r på alle udsagnsord","Fjern alle r'er","Tæl stavelser"],"Erstat med fx spiser/spise og hør, hvilken form der passer","En substitutionsprøve gør grammatisk form tydelig.",5),
      rewrite("Ret: 'På mandag vi afleverer opgaven.'","På mandag afleverer vi opgaven.","Foranstillet tidsled kræver inversion i helsætningen.",5),
      text("Ret det sammensatte ord: 'elev råd'.","elevråd","Sammensatte ord skrives normalt sammen.",5)
    ],
    udfordring:[
      rewrite("Korrekturlæs: 'I går går jeg hjem tidligt fordi jeg var træt.'","I går gik jeg hjem tidligt, fordi jeg var træt.","Tidsskiftet rettes til datid, og ledsætningen markeres med komma efter den valgte kommapraksis.",5,["I går gik jeg hjem tidligt fordi jeg var træt.","I går gik jeg hjem tidligt, fordi jeg var træt."]),
      rewrite("Korrekturlæs: 'Eleverne tog deres bøger frem og læreren forklare reglen.'","Eleverne tog deres bøger frem, og læreren forklarede reglen.","To helsætninger forbindes, og udsagnsordet skal stå i datid.",5),
      choice("Hvorfor bør korrektur ske i flere gennemlæsninger?",["Man kan fokusere på én fejltype ad gangen, fx indhold, syntaks, stavning og tegnsætning","Fordi samme fejl skal rettes flere gange","Fordi teksten skal gøres længere","Fordi første læsning ikke må handle om mening"],"Man kan fokusere på én fejltype ad gangen, fx indhold, syntaks, stavning og tegnsætning","Et systematisk korrekturblik er mere effektivt end at lede efter alt samtidig.",5),
      rewrite("Gør både grammatik og reference tydelig: 'Anna talte med Sofie og hun sagde hendes opgave var god.' Det var Sofie, der roste Annas opgave.","Anna talte med Sofie, og Sofie sagde, at Annas opgave var god.","Navnene erstatter uklare stedord, og sætningsforbindelsen tydeliggøres.",5),
      choice("Hvilken rækkefølge er mest hensigtsmæssig i dyb korrektur?",["mening og struktur → sætninger → ordvalg/grammatik → stavning/tegnsætning","komma → skrifttype → antal ord → mening","stavning alene","alfabetisk orden"],"mening og struktur → sætninger → ordvalg/grammatik → stavning/tegnsætning","Man bør først sikre det store og derefter detaljerne.",5)
    ]
  }
};
