import type { GradedGrammarLibrary, GradedGrammarQuestion } from "./grade-progression";

const choice=(q:string,options:string[],answer:string,why:string,minGrade:number):GradedGrammarQuestion=>({q,options,answer,why,kind:"choice",minGrade});
const text=(q:string,answer:string,why:string,minGrade:number,acceptedAnswers:string[]=[answer]):GradedGrammarQuestion=>({q,options:[],answer,why,kind:"text",acceptedAnswers,minGrade,placeholder:"Skriv dit svar…"});
const rewrite=(q:string,answer:string,why:string,minGrade:number,acceptedAnswers:string[]=[answer]):GradedGrammarQuestion=>({q,options:[],answer,why,kind:"rewrite",acceptedAnswers,minGrade,placeholder:"Skriv den rettede sætning…"});

export const spellingTrapsLibrary:GradedGrammarLibrary={
  "Enkelt og dobbelt konsonant":{
    basis:[
      choice("Hvilket ord er stavet korrekt?",["katte","kate","katteh","katee"],"katte","I katte står dobbelt t mellem den korte vokal og endelsen.",3),
      choice("Vælg korrekt: 'En ___ løber over vejen.'",["kat","katt","kad","kadt"],"kat","Grundformen kat har ét t til sidst.",3),
      choice("Hvilket ord har dobbelt konsonant?",["hoppe","håbe","male","cykel"],"hoppe","Hoppe skrives med dobbelt p.",3),
      text("Skriv ordet korrekt: 'kome'.","komme","Komme skrives med dobbelt m.",3),
      choice("Hvilket par er begge korrekt stavet?",["sove / komme","sovve / kome","sovve / komme","sove / kome"],"sove / komme","Sove har ét v, komme har dobbelt m.",3)
    ],
    traening:[
      choice("Hvilket ord passer: 'Hun ___ bolden.'",["taber","tapper","tabber","taper"],"taber","Taber kommer af tabe og har ét b; tapper er et andet ord.",3),
      choice("Hvilken betydningsforskel viser stavningen?",["'håber' og 'hopper' er forskellige ord","Enkelt/dobbelt konsonant ændrer aldrig betydning","Kun store bogstaver ændrer betydning","Der findes ingen regelmæssigheder"],"'håber' og 'hopper' er forskellige ord","Konsonantfordobling kan være afgørende for ordets betydning og vokallyd.",3),
      rewrite("Ret stavefejlen: 'Hun komer hjem efter skole.'","Hun kommer hjem efter skole.","Komme har dobbelt m, og nutidsformen er kommer.",3),
      text("Skriv nutid af 'at hoppe'.","hopper","Stammen bevarer dobbelt p: hopper.",3),
      choice("Hvilket ord er korrekt?",["klasse","klase","klazze","klassee"],"klasse","Klasse skrives med dobbelt s.",3)
    ],
    udfordring:[
      choice("Hvorfor er 'læser' ikke skrevet med dobbelt s?",["Stavningen følger ordets stamme 'læs-' og bøjningsendelsen -er","Alle ord med lang vokal får dobbelt konsonant","Fordi s aldrig kan fordobles","Fordi ordet er et navneord"],"Stavningen følger ordets stamme 'læs-' og bøjningsendelsen -er","Morfologisk kendskab er vigtigere end en simpel lydregel alene.",3),
      choice("Hvilket par viser betydningsforskel knyttet til konsonant/vokal-mønster?",["håber / hopper","bog / bøger","stor / større","jeg / mig"],"håber / hopper","De to ord ligner hinanden, men har forskellig stavning og betydning.",3),
      rewrite("Ret: 'Hun vile gerne kome, men hun nåde det ikke.'","Hun ville gerne komme, men hun nåede det ikke.","Ville og komme har dobbelt konsonant; nåede følger bøjningen af nå.",3),
      text("Skriv korrekt: 'paralel'.","parallel","Parallel skrives med dobbelt l til sidst.",3),
      choice("Hvilken strategi er bedst ved tvivl om dobbelt konsonant?",["Brug ordets bøjningsformer, ordfamilie og ordbog frem for kun at gætte efter lyden","Sæt altid dobbelt konsonant efter a","Skriv altid kun én konsonant","Fjern endelsen"],"Brug ordets bøjningsformer, ordfamilie og ordbog frem for kun at gætte efter lyden","Dansk stavning kræver både lydlig og morfologisk viden.",3)
    ]
  },
  "Stumme bogstaver":{
    basis:[
      choice("Hvilket ord har et stumt bogstav?",["hvad","kat","sol","løbe"],"hvad","D'et i hvad udtales normalt ikke tydeligt.",3),
      choice("Hvilket bogstav er stumt i 'hvem'?",["h","v","e","m"],"h","H'et udtales ikke i standardudtalen af hvem.",3),
      choice("Vælg korrekt stavning.",["hjem","jem","hjæm","gjem"],"hjem","H'et er en del af den korrekte stavning, selv om lydforbindelsen ikke udtales bogstav for bogstav.",3),
      text("Skriv korrekt: 'vem'.","hvem","Hvem skrives med stumt h.",3),
      choice("Hvilket ord er stavet korrekt?",["hvor","vor","hvoor","hvr"],"hvor","Hvor skrives med h, selv om h ikke høres som en selvstændig lyd.",3)
    ],
    traening:[
      choice("Hvilken række består af ord med stumt h?",["hvad, hvem, hvor","hus, hat, hop","hund, hest, hånd","have, hale, hive"],"hvad, hvem, hvor","I hv-ordene er h normalt stumt.",3),
      choice("Hvilket ord har et bogstav, som ofte ikke høres tydeligt i udtalen?",["bord","bi","ko","is"],"bord","D'et i bord er ofte svagt eller ikke realiseret som et tydeligt d.",3),
      rewrite("Ret: 'Vordan ved du vad hun hedder?'","Hvordan ved du, hvad hun hedder?","Hvordan og hvad skrives med hv-, selv om h'et ikke høres.",3,["Hvordan ved du hvad hun hedder?","Hvordan ved du, hvad hun hedder?"]),
      text("Skriv korrekt: 'jælp'.","hjælp","Hjælp skrives med hj-.",3),
      choice("Hvorfor kan stumme bogstaver være svære?",["Man kan ikke altid høre alle bogstaver i ordets stavning","De findes kun i fremmedord","De kan altid fjernes","De viser ordklasse"],"Man kan ikke altid høre alle bogstaver i ordets stavning","Stavningen kan ikke altid udledes direkte af udtalen.",3)
    ],
    udfordring:[
      choice("Hvilken strategi hjælper med 'hvid/hvide'?",["Se på ordfamilien og de beslægtede former","Fjern alle h'er","Skriv ordet som det lyder i hurtig tale","Sæt altid d efter v"],"Se på ordfamilien og de beslægtede former","Bøjningsformer kan gøre dele af stavningen mere synlige.",3),
      choice("Hvorfor bevares bogstaver, som ikke altid høres tydeligt?",["Dansk stavning afspejler også morfologi, historie og slægtskab mellem ord","De er tilfældige fejl i alfabetet","Kun for at gøre ord længere","De har altid en skjult lyd i alle dialekter"],"Dansk stavning afspejler også morfologi, historie og slægtskab mellem ord","Retskrivning er ikke rent lydret.",3),
      rewrite("Ret de lydrette fejl: 'Vem ved vor de jemme?'","Hvem ved, hvor de er hjemme?","Hv- og hj-/hjemme skal staves efter normen, ikke kun efter lyden.",3,["Hvem ved hvor de er hjemme?","Hvem ved, hvor de er hjemme?"]),
      text("Skriv korrekt det ord, der betyder farven: 'vid' med stumt begyndelsesbogstav.","hvid","Farven hvid skrives med h.",3),
      choice("Hvad er vigtigst at lære om stumme bogstaver?",["Genkende almindelige mønstre og bruge ordfamilier/ordbog ved tvivl","At alle stumme bogstaver kan slettes","At de kun findes i navneord","At de altid står sidst"],"Genkende almindelige mønstre og bruge ordfamilier/ordbog ved tvivl","Strategier er mere robuste end at memorere isolerede undtagelser.",3)
    ]
  },
  "Endelser":{
    basis:[
      choice("Hvilken endelse gør 'hund' til flertal?",["-e i hunde","-r i hundr","-t","-s"],"-e i hunde","Hunde er flertal af hund.",4),
      choice("Vælg korrekt: 'Hun arbejd___ i går.'",["ede","er","e","et"],"ede","Arbejdede er datid.",4),
      choice("Hvilket ord har endelsen -lig?",["venlig","ven","venskab","venner"],"venlig","-lig står efter betydningskernen ven.",4),
      text("Skriv flertalsendelsen i 'biler'.","-er","Biler dannes med -er.",4,["er","-er"]),
      choice("Hvilken endelse står i 'frihed'?",["-hed","fri-","-r","-en"],"-hed","-hed bruges til at danne et abstrakt navneord.",4)
    ],
    traening:[
      choice("Hvilken stavning er korrekt?",["interesseret","interessered","interesseretd","interesserede"],"interesseret","Kort tillægsform/participium har her endelsen -et.",4),
      choice("Hvilken endelse markerer bestemt flertal i 'bøgerne'?",["-ne","-er","-e","-s"],"-ne","-ne gør den allerede flertalsbøjede form bestemt.",4),
      rewrite("Ret endelsen: 'Eleverne arbejdte koncentreret og afleveret til tiden.'","Eleverne arbejdede koncentreret og afleverede til tiden.","Begge udsagnsord skal stå i datid med korrekt bøjningsendelse.",4),
      text("Skriv navneordet dannet af 'venlig' med -hed.","venlighed","-hed danner navneordet venlighed.",4),
      choice("Hvorfor er endelser vigtige?",["De kan vise tid, tal, bestemthed og ordklasse","De er kun pynt","De bestemmer alle vokaler","De bruges kun efter egennavne"],"De kan vise tid, tal, bestemthed og ordklasse","Endelser bærer grammatisk og ordbyggende information.",4)
    ],
    udfordring:[
      choice("Hvilken analyse er korrekt af 'arbejdernes'?",["arbejd + -er + -ne + -s","arbejdernes er én rod","arbejd + -hed","ar + bej + der"],"arbejd + -er + -ne + -s","Formen indeholder flere lag af afledning/bøjning og genitiv.",4),
      choice("Hvilken endelse danner typisk et abstrakt navneord?",["-tion i information","-r i går","-t i stort","-ne i bilerne"],"-tion i information","-tion bruges i mange lånte/afledte navneord.",4),
      rewrite("Ret bøjningsendelserne: 'De interessant bøger blev læst af elev.'","De interessante bøger blev læst af eleverne.","Tillægsordet skal bøjes, og navneordets antal/bestemthed skal passe til betydningen.",4),
      text("Skriv endelsen, der danner 'læsning' af 'læs-'.","-ning","-ning danner et navneord for handling/processen.",4,["ning","-ning"]),
      choice("Hvad er forskellen på bøjnings- og afledningsendelser?",["Bøjning ændrer grammatisk form; afledning kan danne et nyt ord eller ny ordklasse","Ingen forskel","Bøjning står altid først","Afledning bruges kun til flertal"],"Bøjning ændrer grammatisk form; afledning kan danne et nyt ord eller ny ordklasse","Endelsens funktion afhænger af ordets struktur.",4)
    ]
  },
  "Fremmedord":{
    basis:[
      choice("Hvilket ord er et almindeligt fremmedord/låneord i dansk?",["computer","hus","sol","barn"],"computer","Computer er lånt fra engelsk og bruges i dansk.",7),
      choice("Hvilken stavning er korrekt?",["interesse","interese","enteresse","intresse"],"interesse","Interesse følger den etablerede danske stavning.",7),
      choice("Vælg korrekt: 'Hun lavede en grundig ___.'",["analyse","anallyse","analize","analisse"],"analyse","Analyse er den normerede danske form.",7),
      text("Skriv korrekt: 'komunikation'.","kommunikation","Kommunikation skrives med dobbelt m.",7),
      choice("Hvad er en god strategi ved usikkert fremmedord?",["Brug en autoritativ ordbog og se på ordets etablerede danske form","Skriv altid som på engelsk","Fjern alle dobbeltkonsonanter","Gæt efter første lyd"],"Brug en autoritativ ordbog og se på ordets etablerede danske form","Låneord følger ikke altid simple danske lydregler.",7)
    ],
    traening:[
      choice("Hvilken stavning er korrekt?",["diskussion","diskution","disskussion","diskusjon"],"diskussion","Diskussion har den normerede stavning med -ssion.",7),
      choice("Hvilket ord er korrekt?",["konklusion","konklussion","konklution","konklusjon"],"konklusion","Konklusion skrives med -sion.",7),
      rewrite("Ret: 'Raporten indeholder en interesant analyse.'","Rapporten indeholder en interessant analyse.","Rapport og interessant har dobbelt konsonant i de korrekte former.",7),
      text("Skriv korrekt: 'argumentasion'.","argumentation","Argumentation skrives med -tion.",7),
      choice("Hvorfor er fremmedord ofte svære at stave?",["De kan følge stavemønstre fra andre sprog eller ældre låneformer","De har ingen vokaler","De kan aldrig bøjes på dansk","De skrives altid med stort"],"De kan følge stavemønstre fra andre sprog eller ældre låneformer","Stavningen er ikke altid gennemsigtigt lydret.",7)
    ],
    udfordring:[
      choice("Hvilket par er begge korrekt stavet?",["professionel / interessant","proffesionel / interesant","professionel / interesant","proffessionel / interessant"],"professionel / interessant","Begge kræver opmærksomhed på konsonanter og lånt stavemønster.",7),
      choice("Hvad bør man gøre, hvis både dansk og engelsk stavning virker mulig?",["Slå den danske normerede form op","Vælg altid engelsk","Bland formerne","Skriv ordet fonetisk"],"Slå den danske normerede form op","Danske tekster følger dansk retskrivning, også når ordet er lånt.",7),
      rewrite("Ret: 'Organisationen lavede en evaluering af projektets implementation.'","Organisationen lavede en evaluering af projektets implementering.","Implementering er den almindelige danske form i denne sammenhæng.",7),
      text("Skriv korrekt: 'priviligeret'.","privilegeret","Privilegeret staves med -leger-.",7),
      choice("Hvilket udsagn er mest præcist?",["Låneord kan blive tilpasset dansk bøjning og stavning over tid","Låneord må aldrig bøjes","Alle låneord beholder præcis original stavning","Fremmedord er altid engelske"],"Låneord kan blive tilpasset dansk bøjning og stavning over tid","Lån er en almindelig del af sprogets udvikling.",7)
    ]
  },
  "Forkortelser":{
    basis:[
      choice("Hvad betyder 'fx'?",["for eksempel","for ekstra","før eksamen","færdig tekst"],"for eksempel","Fx er en almindelig forkortelse for for eksempel.",5),
      choice("Hvad betyder 'bl.a.'?",["blandt andet","bliv altid","blandt alle","blad andet"],"blandt andet","Bl.a. er en punktumforkortelse.",5),
      choice("Hvilken forkortelse er korrekt?",["ca.","ca","c.a.","cca"],"ca.","Ca. er forkortelse for cirka.",5),
      text("Skriv forkortelsen for 'for eksempel'.","fx","Fx skrives normalt uden punktum i moderne dansk retskrivning.",5,["fx","f.eks."]),
      choice("Hvad bør man undgå?",["Uklare private forkortelser, som læseren ikke kan forstå","Alle almindelige forkortelser","Tal","Punktum"],"Uklare private forkortelser, som læseren ikke kan forstå","Forkortelser skal være genkendelige for modtageren.",5)
    ],
    traening:[
      choice("Hvilken skrivemåde er korrekt for 'med mere'?",["m.m.","mm","m,m","m.m"],"m.m.","M.m. er en punktumforkortelse.",5),
      choice("Hvilken forkortelse står for 'det vil sige'?",["dvs.","d.v.s","ds.","dv"],"dvs.","Dvs. er den almindelige forkortelse.",5),
      rewrite("Ret: 'Vi arbejder med fx. navneord, verber og adjektiver.'","Vi arbejder med fx navneord, verber og adjektiver.","Fx skrives normalt uden punktum.",5),
      text("Skriv forkortelsen for 'blandt andet'.","bl.a.","Bl.a. består af forkortede ord med punktummer.",5),
      choice("Hvornår bør et ord hellere skrives helt ud?",["Når forkortelsen kan være ukendt eller skabe tvivl hos målgruppen","Altid","Aldrig","Kun i overskrifter"],"Når forkortelsen kan være ukendt eller skabe tvivl hos målgruppen","Modtagerhensyn er vigtigere end at spare få tegn.",5)
    ],
    udfordring:[
      choice("Hvilken version er mest læsevenlig i en formel elevtekst?",["Undersøgelsen viser blandt andet tre mønstre.","Undersøgelsen viser bl.a. 3 mstr.","Undersøg. viser bl a mønstre.","Undersøgelsen v. b.a. tre."],"Undersøgelsen viser blandt andet tre mønstre.","Unødige forkortelser kan gøre løbende prosa mindre flydende.",5),
      choice("Hvad er forskellen på en initialforkortelse og en almindelig punktumforkortelse?",["Initialforkortelser består typisk af begyndelsesbogstaver; punktumforkortelser er forkortede ord/udtryk","Der er ingen forskel","Initialforkortelser er altid tal","Punktumforkortelser må ikke have punktum"],"Initialforkortelser består typisk af begyndelsesbogstaver; punktumforkortelser er forkortede ord/udtryk","Fx EU over for bl.a.",5),
      rewrite("Gør teksten mere læsevenlig: 'Eleverne arbejdede m. div. opg. om bl.a. gramm.'","Eleverne arbejdede med forskellige opgaver om blandt andet grammatik.","Uformelle forkortelser er skrevet ud for en klarere faglig tekst.",5),
      text("Skriv den almindelige forkortelse for 'og så videre'.","osv.","Osv. er en etableret forkortelse.",5),
      choice("Hvorfor kan mange forkortelser være problematiske for tilgængelighed?",["De kræver, at læseren kender koden og kan øge læsebelastningen","De gør teksten automatisk mere præcis","De forbedrer altid oplæsning","De gør alle ord kortere uden ulempe"],"De kræver, at læseren kender koden og kan øge læsebelastningen","Klart sprog tager hensyn til læserens forudsætninger.",5)
    ]
  },
  "Parentes og citationstegn":{
    basis:[
      choice("Hvad kan en parentes bruges til?",["Et indskud eller en ekstra oplysning","At afslutte alle spørgsmål","At vise flertal","At bøje udsagnsord"],"Et indskud eller en ekstra oplysning","Parentesen kan rumme information, der står lidt ved siden af hovedsætningen.",6),
      choice("Hvad bruges citationstegn ofte til?",["At markere direkte citat eller et ord, der omtales som ord","At vise datid","At markere alle navneord","At erstatte punktum"],"At markere direkte citat eller et ord, der omtales som ord","Citationstegn kan tydeliggøre gengivne ord eller sproglige eksempler.",6),
      choice("Hvilken version bruger parentes naturligt?",["Maja (klassens elevrådsrepræsentant) tog ordet.","Maja ) klassens ( elevråd tog ordet.","Maja (( tog ordet.","Maja parentes tog ordet."],"Maja (klassens elevrådsrepræsentant) tog ordet.","Indskuddet kan fjernes uden at ødelægge hovedsætningen.",6),
      text("Skriv det ord, der står i citationstegn: Hun kaldte løsningen 'genial'.","genial","Citationstegnene afgrænser ordet genial.",6),
      choice("Hvilket tegnpar hører sammen?",["( )","( ]","[ )","' )"],"( )","En parentes åbnes og lukkes med matchende tegn.",6)
    ],
    traening:[
      choice("Hvornår er parentes ofte bedre end komma?",["Når informationen tydeligt er et sideindskud med lavere vægt","Ved alle grundled","Efter hvert udsagnsord","Før hvert citat"],"Når informationen tydeligt er et sideindskud med lavere vægt","Parentes kan signalere, at informationen er sekundær.",6),
      rewrite("Indsæt parentes om sideoplysningen: 'Maja klassens yngste elev vandt.'","Maja (klassens yngste elev) vandt.","Sideoplysningen markeres som indskud.",6),
      choice("Hvilken version omtaler ordet som sprogligt eksempel?",["Ordet 'fordi' er et bindeord.","Ordet fordi er et bindeord?","Ordet (fordi er) et bindeord.","Ordet: fordi: er."],"Ordet 'fordi' er et bindeord.","Citationstegn gør det tydeligt, at vi taler om selve ordet.",6),
      text("Skriv det citerede udsagn med citationstegn: Hun sagde: Jeg kommer.","'Jeg kommer.'","Citatet markeres med citationstegn.",6,["'Jeg kommer.'","\"Jeg kommer.\""]),
      choice("Hvad sker der, hvis parenteser ikke lukkes?",["Sætningsstrukturen bliver uklar","Teksten bliver automatisk korrekt","Det bliver et spørgsmål","Det ændrer ordklassen"],"Sætningsstrukturen bliver uklar","Parenteser skal normalt optræde som et matchende par.",6)
    ],
    udfordring:[
      choice("Hvilken effekt kan parenteser have stilistisk?",["De kan skabe en sidebemærkning eller en mere indskudt stemme","De gør altid teksten objektiv","De betyder, at informationen er falsk","De bruges kun i matematik"],"De kan skabe en sidebemærkning eller en mere indskudt stemme","Tegnsætning påvirker læserens oplevelse af informationshierarki.",6),
      rewrite("Gør hovedpointen tydeligere ved at parentesere detaljen: 'Undersøgelsen der omfattede 48 elever viser en tydelig tendens.'","Undersøgelsen (der omfattede 48 elever) viser en tydelig tendens.","Detaljen nedtones som sideinformation.",6),
      choice("Hvorfor kan citationstegn omkring et enkelt ord være tvetydige?",["De kan markere citat, afstand, ironi eller ordet som sprogligt objekt afhængigt af kontekst","De betyder altid ironi","De betyder altid sandhed","De kan kun bruges om navne"],"De kan markere citat, afstand, ironi eller ordet som sprogligt objekt afhængigt af kontekst","Konteksten afgør funktionen.",6),
      text("Skriv tegnene omkring sidebemærkningen i: Resultatet ___ overraskende nok ___ var positivt.","( overraskende nok )","Parenteserne markerer sidebemærkningen.",6,["(overraskende nok)","( overraskende nok )"]),
      choice("Hvilken version er mest neutral?",["Afsenderen kalder forslaget 'urealistisk'.","Forslaget er 'urealistisk'.","Forslaget er totalt urealistisk!!!","'Forslaget' 'er' urealistisk."],"Afsenderen kalder forslaget 'urealistisk'.","Formuleringen gør det tydeligt, hvem vurderingen tilhører.",6)
    ]
  },
  "Apostrof":{
    basis:[
      choice("Hvornår bruges apostrof typisk ved genitiv på dansk?",["Efter navne, der ender på s, x eller z","Efter alle navneord","Før alle flertalsendelser","I alle sammensatte ord"],"Efter navne, der ender på s, x eller z","Fx Jens' cykel.",7),
      choice("Hvilken genitivform er korrekt?",["Jens' bog","Jens's bog","Jen's bog","Jenses bog"],"Jens' bog","Efter et navn på s tilføjes apostrof.",7),
      choice("Hvilken form er korrekt?",["Sofies cykel","Sofie’s cykel","Sofie' cykel","Sofies' cykel"],"Sofies cykel","Almindelig genitiv dannes med -s uden apostrof.",7),
      text("Skriv genitiv af navnet 'Max'.","Max'","Navne på x får apostrof i genitiv.",7,["Max'","Max’"]),
      choice("Hvilket udsagn er korrekt?",["Dansk bruger ikke apostrof før almindeligt genitiv-s","Dansk bruger altid apostrof før s","Apostrof markerer datid","Apostrof bruges efter alle vokaler"],"Dansk bruger ikke apostrof før almindeligt genitiv-s","Man skriver fx Annas bog, ikke Anna's bog.",7)
    ],
    traening:[
      choice("Vælg korrekt:",["Anders' computer","Anders's computer","Ander’s computer","Anders computer'"],"Anders' computer","Anders ender på s og får apostrof i genitiv.",7),
      rewrite("Ret: 'Maria's taske ligger her.'","Marias taske ligger her.","Navnet Maria får almindeligt genitiv-s uden apostrof.",7),
      choice("Hvilken form er korrekt for et navn på z?",["Liz' idé","Liz's idé","Li'z idé","Lizs' idé"],"Liz' idé","Efter z bruges apostrof i genitiv.",7),
      text("Skriv korrekt genitiv: 'Lucas cykel'.","Lucas' cykel","Lucas ender på s og får apostrof.",7,["Lucas' cykel","Lucas’ cykel"]),
      choice("Hvor kommer den fejlagtige form 'Maria's' ofte fra?",["Påvirkning fra engelsk genitivbrug","Dansk flertalsregel","Komma-reglen","Nutids-r"],"Påvirkning fra engelsk genitivbrug","Engelsk bruger ofte apostrof + s, mens dansk normalt blot tilføjer s.",7)
    ],
    udfordring:[
      choice("Hvilken version følger dansk standard?",["virksomhedens strategi","virksomheden's strategi","virksomheds' strategi","virksomhed’ens strategi"],"virksomhedens strategi","Almindelige danske navneord danner genitiv med -s uden apostrof.",7),
      rewrite("Ret alle genitiver: 'Emma's og Anders's projekt blev valgt.'","Emmas og Anders' projekt blev valgt.","Emma får -s; Anders ender på s og får apostrof.",7,["Emmas og Anders' projekt blev valgt.","Emmas og Anders’ projekt blev valgt."]),
      choice("Hvornår er omskrivning med 'til' eller 'hos' ofte bedre?",["Når en meget lang genitivkonstruktion bliver tung eller uklar","Ved alle korte navne","Kun i poesi","Aldrig"],"Når en meget lang genitivkonstruktion bliver tung eller uklar","Klarhed kan være vigtigere end at presse mange ejeforhold ind i én konstruktion.",7),
      text("Skriv korrekt: 'Felix idé'.","Felix' idé","Felix ender på x og får apostrof i genitiv.",7,["Felix' idé","Felix’ idé"]),
      choice("Hvad bruges apostrof IKKE til i almindelig dansk retskrivning?",["At danne almindeligt flertal","Genitiv efter s/x/z","Visse udeladelser i særlige former","Markering af enkelte specialtilfælde"],"At danne almindeligt flertal","Flertal dannes ikke med apostrof på dansk.",7)
    ]
  },
  "Og eller at":{
    basis:[
      choice("Vælg korrekt: 'Jeg prøver ___ lære det.'",["at","og","ad","af"],"at","At står foran navnemåden lære.",5),
      choice("Vælg korrekt: 'Hun sidder ___ læser.'",["og","at","af","ad"],"og","To sideordnede handlinger forbindes med og.",5),
      choice("Hvilken sætning er korrekt?",["Jeg vil gerne lære at svømme.","Jeg vil gerne lære og svømme.","Jeg vil gerne lære ad svømme.","Jeg vil gerne lære af svømme."],"Jeg vil gerne lære at svømme.","At markerer navnemåde.",5),
      text("Skriv ordet: 'Vi går hjem ___ spiser.'","og","Handlingerne sideordnes: går hjem og spiser.",5),
      choice("Hvilket ord står ofte foran et udsagnsord i navnemåde?",["at","og","men","på"],"at","Fx at læse, at skrive, at lære.",5)
    ],
    traening:[
      choice("Vælg korrekt: 'Han begyndte ___ grine.'",["at","og","af","ad"],"at","Begyndte efterfølges her af navnemåde med at.",5),
      choice("Vælg korrekt: 'Hun gik ind ___ satte sig.'",["og","at","ad","af"],"og","To finitte handlinger sideordnes.",5),
      rewrite("Ret: 'Jeg forsøger og forstå opgaven.'","Jeg forsøger at forstå opgaven.","Forstå står som infinitiv efter forsøger og indledes med at.",5),
      text("Skriv korrekt forbindelsesord: 'De stod ___ talte sammen.'","og","Stod og talte er to sideordnede verbale handlinger.",5),
      choice("Hvilken prøve hjælper?",["Se om ordet forbinder to lige led (og) eller indleder navnemåde (at)","Sæt altid og foran verber","Sæt altid at mellem to ord","Tæl bogstaver"],"Se om ordet forbinder to lige led (og) eller indleder navnemåde (at)","Funktionen i sætningen afgør valget.",5)
    ],
    udfordring:[
      choice("Vælg korrekt: 'Det er svært ___ vide, om man skal blive ___ kæmpe.'",["at / og","og / at","at / at","og / og"],"at / og","At vide er infinitiv; blive og kæmpe er sideordnede handlinger efter skal.",5),
      rewrite("Ret kun og/at: 'Hun prøvede og forklare problemet og få dem til og lytte.'","Hun prøvede at forklare problemet og få dem til at lytte.","Infinitiverne forklare og lytte kræver at; forklare og få er sideordnede.",5),
      choice("Hvorfor kan 'og/at' være svært i tale?",["De kan udtales meget ens i hurtigt talesprog","De har samme grammatiske funktion","At er et navneord","Og udtales altid tydeligt med g"],"De kan udtales meget ens i hurtigt talesprog","Skrift kræver grammatisk analyse frem for kun at lytte til udtalen.",5),
      text("Skriv korrekt: 'Hun kom for ___ hjælpe.'","at","For at + infinitiv udtrykker ofte formål.",5),
      choice("Hvilken sætning er korrekt?",["Han nåede at spise og drikke før toget kom.","Han nåede og spise at drikke før toget kom.","Han nåede at spise at drikke før toget kom.","Han nåede og spise og drikke før toget kom."],"Han nåede at spise og drikke før toget kom.","At indleder den første infinitiv, og sideordner spise og drikke.",5)
    ]
  },
  "Ad eller af":{
    basis:[
      choice("Vælg korrekt: 'Hun gik ___ stien.'",["ad","af","at","og"],"ad","Ad kan angive bevægelse langs en vej eller retning.",5),
      choice("Vælg korrekt: 'Han tog skoene ___." ,["af","ad","at","og"],"af","At tage noget af betyder at fjerne det.",5),
      choice("Hvilken sætning er korrekt?",["Vi kørte ad motorvejen.","Vi kørte af motorvejen hele vejen.","Vi kørte at motorvejen.","Vi kørte og motorvejen."],"Vi kørte ad motorvejen.","Ad bruges om bevægelse langs/hen ad en rute.",5),
      text("Skriv korrekt: 'Hun grinede ___ glæde.'","af","Af kan angive årsag: af glæde.",5),
      choice("Hvilket ord passer i 'en del ___ gruppen'?",["af","ad","at","og"],"af","Af markerer her del-helhed-forhold.",5)
    ],
    traening:[
      choice("Vælg korrekt: 'Vandet løb ___ muren.'",["ned ad","ned af","ned at","ned og"],"ned ad","Ned ad beskriver bevægelse langs muren.",5),
      choice("Vælg korrekt: 'Hun faldt ___ cyklen.'",["af","ad","at","og"],"af","Af viser bevægelse væk fra cyklen.",5),
      rewrite("Ret: 'Vi gik ned af gangen.' Hvis betydningen er langs gangen.","Vi gik ned ad gangen.","Ved bevægelse langs noget bruges ad.",5),
      text("Skriv korrekt: 'Døren gik op ___ sig selv.'","af","Udtrykket er af sig selv.",5),
      choice("Hvilken huskeregel er nyttig?",["Ad handler ofte om retning/vej langs noget; af ofte om væk fra, årsag eller del af noget","Ad bruges altid før navneord","Af bruges kun i datid","De betyder altid det samme"],"Ad handler ofte om retning/vej langs noget; af ofte om væk fra, årsag eller del af noget","Betydningen i relationen hjælper med valget.",5)
    ],
    udfordring:[
      choice("Vælg korrekt: 'Hun smilede ___ lettelse, mens hun gik hen ___ korridoren.'",["af / ad","ad / af","af / af","ad / ad"],"af / ad","Af lettelse angiver årsag; hen ad korridoren angiver retning langs noget.",5),
      rewrite("Ret: 'Han løb op af trappen og hoppede af glæde.' Første led betyder langs trappen.","Han løb op ad trappen og hoppede af glæde.","Op ad = langs/op langs; af glæde = på grund af glæde.",5),
      choice("Hvilken sætning bruger 'af' om materiale/oprindelse?",["Bordet er lavet af træ.","Hun går ad vejen.","Han løb hen ad gangen.","Vi sejlede ad åen."],"Bordet er lavet af træ.","Af kan markere materiale eller oprindelse.",5),
      text("Skriv korrekt: 'Vi gik langsomt ned ___ bjerget' når betydningen er væk fra/toppen ned fra bjerget.","af","Ned af kan bruges om bevægelse væk/fra en overflade; konteksten afgør relationen.",5),
      choice("Hvorfor kan ad/af ikke altid afgøres ved lyd?",["De udtales ofte ens eller meget lig hinanden i talesprog","Ad er altid stumt","Af har ingen vokal","De er samme ord"],"De udtales ofte ens eller meget lig hinanden i talesprog","Skriftformen kræver betydningsanalyse.",5)
    ]
  },
  "Hvis eller vis":{
    basis:[
      choice("Vælg korrekt: '___ det regner, bliver vi hjemme.'",["Hvis","Vis","Vist","Hviste"],"Hvis","Hvis indleder en betingelse.",4),
      choice("Vælg korrekt: '___ mig din tegning.'",["Vis","Hvis","Vist","Vise"],"Vis","Vis er bydemåde af vise.",4),
      choice("Hvilken sætning er korrekt?",["Hvis du vil, kan du komme.","Vis du vil, kan du komme.","Hvis mig billedet.","Vis det regner, går vi."],"Hvis du vil, kan du komme.","Hvis bruges om betingelser.",4),
      text("Skriv ordet: '___ vej til biblioteket.'","Vis","Vis er en opfordring til at vise noget.",4),
      choice("Hvad betyder 'hvis' typisk?",["på betingelse af at","at fremvise","at se","at vide sikkert"],"på betingelse af at","Hvis markerer en betingelse.",4)
    ],
    traening:[
      choice("Vælg korrekt: 'Jeg ved ikke, ___ hun kommer.'",["om","hvis","vis","vist"],"om","I standarddansk bruges om ved indirekte ja/nej-spørgsmål; dette er en vigtig skelnen fra engelsk påvirkning.",4),
      choice("Vælg korrekt: '___ du bliver færdig tidligt, så ring.'",["Hvis","Vis","Vist","Vise"],"Hvis","Sætningen opstiller en betingelse.",4),
      rewrite("Ret: 'Vis du ser Maja, så sig hej.'","Hvis du ser Maja, så sig hej.","Hvis indleder betingelsen.",4),
      text("Skriv bydeformen af 'at vise'.","vis","Vis er imperativ.",4),
      choice("Hvilken sætning bruger 'vis' korrekt?",["Vis mig, hvordan du gjorde.","Vis det bliver sent, går jeg.","Jeg ved vis han kommer.","Vis du vil, så kom."],"Vis mig, hvordan du gjorde.","Vis er et udsagnsord i bydemåde.",4)
    ],
    udfordring:[
      choice("Hvad er forskellen grammatisk på 'hvis' og 'vis'?",["Hvis er et bindeord; vis kan være bydemåde af udsagnsordet vise","Begge er bindeord","Begge er navneord","Hvis er altid et tillægsord"],"Hvis er et bindeord; vis kan være bydemåde af udsagnsordet vise","Ordklassen og funktionen afgør stavningen.",4),
      rewrite("Ret både hvis/vis og indirekte spørgsmål: 'Vis du er i tvivl om hvis han kommer, så spørg.'","Hvis du er i tvivl om, om han kommer, så spørg.","Hvis markerer betingelse; det indirekte spørgsmål indledes med om.",4,["Hvis du er i tvivl om om han kommer, så spørg.","Hvis du er i tvivl om, om han kommer, så spørg."]),
      choice("Hvilket ord er 'vis' i 'en vis usikkerhed'?",["tillægsord med betydningen en bestemt/nogen grad af","bindeord","imperativ","stedord"],"tillægsord med betydningen en bestemt/nogen grad af","Vis kan også have en anden funktion end bydeformen.",4),
      text("Skriv korrekt: '___ mig den ___ respekt, at du lytter.'","Vis mig den respekt, at du lytter.","Første vis er bydemåde; konstruktionen kræver ikke hvis.",4),
      choice("Hvilken sætning indeholder både korrekt 'hvis' og 'vis'?",["Hvis du er færdig, så vis mig resultatet.","Vis du er færdig, så hvis mig resultatet.","Hvis du er færdig, så hvis mig resultatet.","Vis du er færdig, så vis det hvis."],"Hvis du er færdig, så vis mig resultatet.","Hvis indleder betingelsen, vis er bydemåde.",4)
    ]
  },
  "Synes eller syntes":{
    basis:[
      choice("Vælg korrekt i nutid: 'Jeg ___ filmen er god.'",["synes","syntes","syns","syntesr"],"synes","Synes er nutid.",5),
      choice("Vælg korrekt i datid: 'I går ___ jeg filmen var god.'",["syntes","synes","syns","synede"],"syntes","Syntes er datid.",5),
      choice("Hvilken sætning står i nutid?",["Hun synes om bogen.","Hun syntes om bogen.","Hun har syntes om bogen.","Hun ville synes om bogen."],"Hun synes om bogen.","Synes er nutidsformen.",5),
      text("Skriv datid af 'synes'.","syntes","Datid er syntes.",5),
      choice("Hvad er forskellen?",["synes = nutid; syntes = datid","synes = flertal; syntes = ental","de betyder forskelligt","syntes er et navneord"],"synes = nutid; syntes = datid","Tidsformen afgør stavningen.",5)
    ],
    traening:[
      choice("Vælg korrekt: 'Da jeg var yngre, ___ jeg matematik var svært.'",["syntes","synes","syns","synede"],"syntes","Fortidsrammen kræver datid.",5),
      choice("Vælg korrekt: 'Nu ___ jeg faktisk, det er sjovt.'",["synes","syntes","synesd","syntesr"],"synes","Nu markerer nutid.",5),
      rewrite("Ret: 'Jeg syntes det er en god idé.' Hvis vurderingen gælder nu.","Jeg synes, det er en god idé.","Nutidsformen er synes.",5,["Jeg synes det er en god idé.","Jeg synes, det er en god idé."]),
      text("Skriv korrekt: 'I går ___ vi, at opgaven var svær.'","syntes","I går kræver datid.",5),
      choice("Hvilken strategi hjælper?",["Se på tekstens tid: nu → synes, dengang → syntes","Sæt altid t i ordet","Brug synes efter jeg og syntes efter vi","Tæl stavelser"],"Se på tekstens tid: nu → synes, dengang → syntes","Tempus er det afgørende.",5)
    ],
    udfordring:[
      choice("Vælg korrekt: 'Jeg har altid ___, at spørgsmålet var interessant.'",["syntes","synes","syntest","synet"],"syntes","Kort tillægsform i konstruktionen 'har syntes' skrives syntes.",5),
      rewrite("Ret tidsskiftet: 'Dengang syntes jeg det var mærkeligt, men nu syntes jeg det giver mening.'","Dengang syntes jeg, det var mærkeligt, men nu synes jeg, det giver mening.","Datid bruges om dengang, nutid om nu.",5,["Dengang syntes jeg det var mærkeligt, men nu synes jeg det giver mening.","Dengang syntes jeg, det var mærkeligt, men nu synes jeg, det giver mening."]),
      choice("Hvorfor er synes/syntes en typisk skriftlig fælde?",["Forskellen kan være svag i udtalen, men tydelig i tempus","Ordene har samme stavning","De er begge navneord","Syntes bruges kun i flertal"],"Forskellen kan være svag i udtalen, men tydelig i tempus","Man må bruge grammatisk tid som strategi.",5),
      text("Skriv korrekt form: 'Hvis du spørger mig nu, ___ jeg den første version var bedre.'","synes","Vurderingen fremsættes nu.",5),
      choice("Hvilken analyse er korrekt?",["'syntes' i 'hun syntes, det var svært' er et finit udsagnsord i datid","syntes er et navneord","syntes er nutids-r","syntes er et forholdsord"],"'syntes' i 'hun syntes, det var svært' er et finit udsagnsord i datid","Det er den bøjede verbale kerne i hovedsætningen.",5)
    ]
  },
  "Hver eller vær":{
    basis:[
      choice("Vælg korrekt: '___ elev får en bog.'",["Hver","Vær","Vehr","Hverr"],"Hver","Hver betyder én ad gangen af alle i en gruppe.",4),
      choice("Vælg korrekt: '___ stille!'",["Vær","Hver","Være","Værd"],"Vær","Vær er bydemåde af være.",4),
      choice("Hvilken sætning er korrekt?",["Hver dag læser jeg.","Vær dag læser jeg.","Hver stille!","Vær elev får en bog."],"Hver dag læser jeg.","Hver bruges om gentagelse/fordeling.",4),
      text("Skriv ordet: '___ sød at lukke døren.'","Vær","Vær er imperativ af være.",4),
      choice("Hvad betyder 'hver'?",["hver enkelt i en gruppe eller ved gentagelse","at eksistere","at vise","at eje"],"hver enkelt i en gruppe eller ved gentagelse","Fx hver elev eller hver dag.",4)
    ],
    traening:[
      choice("Vælg korrekt: 'Vi mødes ___ anden uge.'",["hver","vær","være","hvert"],"hver","Udtrykket er hver anden uge.",4),
      choice("Vælg korrekt: '___ opmærksom på nutids-r.'",["Vær","Hver","Værd","Hvert"],"Vær","Det er en opfordring med bydeformen vær.",4),
      rewrite("Ret: 'Vær elev skal have hver sin computer.'","Hver elev skal have hver sin computer.","Første ord fordeler over eleverne og skal være hver.",4),
      text("Skriv korrekt: '___ gang jeg læser teksten, opdager jeg noget nyt.'","Hver","Hver gang markerer gentagelse.",4),
      choice("Hvilket ord er et udsagnsord?",["vær","hver","hvert","hverken"],"vær","Vær er imperativ af være.",4)
    ],
    udfordring:[
      choice("Vælg korrekt: '___ af eleverne skal ___ klar til tiden.'",["Hver / være","Vær / hver","Hver / vær","Være / hver"],"Hver / være","Hver er fordelingsord; efter skal står navnemåden være.",4),
      rewrite("Ret: 'Hver venlig og giv vær elev et ark.'","Vær venlig og giv hver elev et ark.","Vær er bydemåde; hver fordeler over eleverne.",4),
      choice("Hvad er forskellen grammatisk?",["hver fungerer som bestemmende/pronominalt ord; vær er et udsagnsord i bydemåde","begge er udsagnsord","begge er navneord","hver er datid af være"],"hver fungerer som bestemmende/pronominalt ord; vær er et udsagnsord i bydemåde","Forskellig funktion forklarer stavningen.",4),
      text("Skriv korrekt: '___ især opmærksom på ___ eneste detalje.'","Vær især opmærksom på hver eneste detalje.","Vær er opfordring; hver eneste fordeler over detaljerne.",4),
      choice("Hvilken sætning er korrekt?",["Hver deltager bør være klar.","Vær deltager bør hver klar.","Hver deltager bør vær klar.","Vær deltager bør være klar."],"Hver deltager bør være klar.","Hver bestemmer deltager; efter bør står være i navnemåde.",4)
    ]
  }
};
