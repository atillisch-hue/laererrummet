import type { GradedGrammarLibrary, GradedGrammarQuestion } from "./grade-progression";

const choice=(q:string,options:string[],answer:string,why:string,minGrade:number):GradedGrammarQuestion=>({q,options,answer,why,kind:"choice",minGrade});
const text=(q:string,answer:string,why:string,minGrade:number,acceptedAnswers:string[]=[answer]):GradedGrammarQuestion=>({q,options:[],answer,why,kind:"text",acceptedAnswers,minGrade,placeholder:"Skriv dit svar…"});
const rewrite=(q:string,answer:string,why:string,minGrade:number,acceptedAnswers:string[]=[answer]):GradedGrammarQuestion=>({q,options:[],answer,why,kind:"rewrite",acceptedAnswers,minGrade,placeholder:"Skriv den rettede sætning…"});

export const inflectionSyntaxLibrary:GradedGrammarLibrary={
  "Navneords bøjning":{
    basis:[
      choice("Hvilket ord står i flertal?",["bøger","bog","bogen","bogens"],"bøger","Bøger betyder mere end én bog.",3),
      choice("Hvilket ord står i bestemt ental?",["hunden","hund","hunde","hundes"],"hunden","Endelsen -en markerer her bestemt ental.",3),
      choice("Vælg ubestemt ental af 'huset'.",["et hus","huset","huse","husene"],"et hus","Et hus er ubestemt ental.",3),
      text("Skriv flertal af 'kat'.","katte","Kat bøjes til katte i flertal.",3),
      choice("Hvilket kendeord passer til 'æble'?",["et","en","de","den"],"et","Man siger et æble.",3)
    ],
    traening:[
      choice("Hvilken bøjningsrække er korrekt?",["en stol – stolen – stole – stolene","en stol – stolet – stoler – stolene","et stol – stolen – stole – stolene","en stol – stolen – stoler – stolene"],"en stol – stolen – stole – stolene","Rækken viser ubestemt ental, bestemt ental, ubestemt flertal og bestemt flertal.",3),
      choice("Hvad viser endelsen i 'bilerne'?",["bestemt flertal","ubestemt ental","datid","højeste grad"],"bestemt flertal","Bilerne betyder de bestemte biler.",3),
      rewrite("Ret bøjningen: 'De to hund løber.'","De to hunde løber.","Efter talordet to skal navneordet stå i flertal.",3),
      text("Skriv bestemt flertal af 'barn'.","børnene","Barn bøjes uregelmæssigt: barn – barnet – børn – børnene.",3),
      choice("Hvilket navneord har uregelmæssigt flertal?",["barn → børn","bil → biler","kat → katte","bog → bøger"],"barn → børn","Barn skifter vokal i flertal.",3)
    ],
    udfordring:[
      choice("Hvad markerer -s i 'elevens bog'?",["ejefald/genitiv","flertal","datid","bestemthed i bogen"],"ejefald/genitiv","Elevens viser, at noget tilhører eleven.",3),
      rewrite("Ret: 'Pigens cykels hjul var fladt.' Gør ejeforholdet naturligt.","Hjulet på pigens cykel var fladt.","Flere genitiver efter hinanden kan blive tunge; omskrivning gør relationen tydelig.",3),
      choice("Hvilken form er 'mennesker'?",["ubestemt flertal","bestemt flertal","bestemt ental","genitiv"],"ubestemt flertal","Mennesker er flertal uden bestemt endelse.",3),
      text("Skriv alle fire former af 'et træ' adskilt med komma.","et træ, træet, træer, træerne","De fire former er ubestemt ental, bestemt ental, ubestemt flertal og bestemt flertal.",3, ["et træ,træet,træer,træerne","et træ, træet, træer, træerne"]),
      choice("Hvorfor er navneordsbøjning vigtig for sammenhæng?",["Den viser blandt andet antal og bestemthed, så læseren ved, hvad der henvises til","Den styrer kun komma","Den gør alle ord til udsagnsord","Den bruges kun i digte"],"Den viser blandt andet antal og bestemthed, så læseren ved, hvad der henvises til","Bøjningsformer bærer grammatisk information.",3)
    ]
  },
  "Tillægsords bøjning":{
    basis:[
      choice("Vælg korrekt: 'et ___ hus'.",["stort","stor","store","større"],"stort","Tillægsord får ofte -t ved intetkøn ental.",4),
      choice("Vælg korrekt: 'en ___ bil'.",["rød","rødt","røde","rødere"],"rød","Ved fælleskøn ubestemt ental står grundformen ofte uden endelse.",4),
      choice("Vælg korrekt: 'de ___ biler'.",["røde","rød","rødt","rødest"],"røde","I flertal bruges ofte -e.",4),
      text("Skriv formen der passer: 'det ___ æble' (grøn).","grønne","I bestemt form med kendeord bruges -e: det grønne æble.",4),
      choice("Hvilket står i højere grad?",["større","stor","størst","store"],"større","Større er komparativ/højere grad.",4)
    ],
    traening:[
      choice("Hvilken række er korrekt?",["god – bedre – bedst","god – godere – godest","god – mere god – mest god","god – bedre – bedste"],"god – bedre – bedst","God gradbøjes uregelmæssigt.",4),
      choice("Vælg korrekt: 'to ___ huse'.",["store","stort","stor","størst"],"store","I flertal bruges store.",4),
      rewrite("Ret: 'Det er en meget smukt udsigt.'","Det er en meget smuk udsigt.","Udsigt er fælleskøn, så tillægsordet står smuk.",4),
      text("Skriv højeste grad af 'lille'.","mindst","Lille – mindre – mindst.",4),
      choice("Hvilken form passer efter 'den'?",["interessante","interessant","interessants","interessantere"],"interessante","I bestemt form bruges ofte -e: den interessante bog.",4)
    ],
    udfordring:[
      choice("Hvorfor hedder det 'et gammelt hus' men 'de gamle huse'?",["Tillægsordet bøjes efter køn, tal og bestemthed","Fordi hus er et udsagnsord","Fordi alle flertalsord får -t","Der er ingen grammatisk grund"],"Tillægsordet bøjes efter køn, tal og bestemthed","Kongruens betyder, at tillægsordets form passer til navneordsgruppen.",4),
      rewrite("Ret kongruensen: 'De interessant debatindlæg var korte.'","De interessante debatindlæg var korte.","I bestemt/flertal bruges interessante.",4),
      choice("Hvilket tillægsord gradbøjes bedst med 'mere/mest'?",["kompliceret","stor","lille","god"],"kompliceret","Længere tillægsord gradbøjes ofte med mere og mest.",4),
      text("Skriv korrekt form: 'Det var den ___ løsning.' (præcis)","præcise","Efter den i bestemt form bruges præcise.",4),
      choice("Hvad kan forkert tillægsordsbøjning især forstyrre?",["Sammenhængen mellem tillægsord og det navneord, det beskriver","Kun tegnsætningen","Kun tekstens længde","Kun navneordets betydning"],"Sammenhængen mellem tillægsord og det navneord, det beskriver","Kongruens hjælper læseren med at se, hvilke ord der hører sammen.",4)
    ]
  },
  "Udsagnsords tider":{
    basis:[
      choice("Hvilket udsagnsord står i nutid?",["skriver","skrev","har skrevet","havde skrevet"],"skriver","Skriver er nutid.",5),
      choice("Hvilket står i datid?",["løb","løber","har løbet","vil løbe"],"løb","Løb fortæller om noget, der skete før nu.",5),
      choice("Hvilken sætning står i førnutid?",["Jeg har læst bogen.","Jeg læser bogen.","Jeg læste bogen.","Jeg havde læst bogen."],"Jeg har læst bogen.","Har + kort tillægsform danner førnutid.",5),
      text("Skriv datid af 'spise'.","spiste","Datidsformen er spiste.",5),
      choice("Hvad består førdatid typisk af?",["havde + kort tillægsform","har + navnemåde","vil + nutid","er + tillægsord"],"havde + kort tillægsform","Fx 'havde spist'.",5)
    ],
    traening:[
      choice("Vælg korrekt: 'Da hun kom, ___ jeg allerede ___." ,["havde / spist","har / spist","ville / spiste","er / spise"],"havde / spist","Førdatid markerer en handling, der skete før en anden fortidig handling.",5),
      choice("Hvilken sætning udtrykker fremtid tydeligst?",["Jeg vil ringe i morgen.","Jeg ringede i går.","Jeg har ringet.","Jeg ringer hver dag."],"Jeg vil ringe i morgen.","Vil + navnemåde kan markere fremtid.",5),
      rewrite("Skift til datid: 'Hun går hjem og laver mad.'","Hun gik hjem og lavede mad.","Begge finitte udsagnsord skal tilpasses datid.",5),
      text("Skriv førnutid af 'at se'.","har set","Førnutid dannes med har + kort tillægsform.",5),
      choice("Hvorfor kan tidsskift være et problem i en tekst?",["Læseren kan blive i tvivl om, hvornår handlingerne foregår","Det ændrer alle navneord","Det fjerner tegnsætning","Det gør teksten automatisk længere"],"Læseren kan blive i tvivl om, hvornår handlingerne foregår","Konsekvent tempus hjælper tidsforløbet med at være tydeligt.",5)
    ],
    udfordring:[
      choice("Hvilken tid bruges i 'Hun havde allerede forladt huset, da telefonen ringede'?",["førdatid i 'havde forladt'","førnutid i 'havde forladt'","fremtid","kun nutid"],"førdatid i 'havde forladt'","Handlingen var afsluttet før den anden datidshandling.",5),
      rewrite("Ret det uhensigtsmæssige tidsskift: 'Jeg gik ind i rummet og ser, at vinduet var åbent.'","Jeg gik ind i rummet og så, at vinduet var åbent.","Fortællingen står i datid, så 'ser' bør være 'så'.",5),
      choice("Hvilken effekt kan historisk nutid have?",["Fortidige hændelser kan opleves mere nærværende og levende","Teksten bliver grammatisk uden udsagnsord","Alle hændelser bliver fremtidige","Det bruges kun i lovtekster"],"Fortidige hændelser kan opleves mere nærværende og levende","Nutid kan bruges bevidst om fortid for at skabe nærvær.",5),
      text("Skriv førdatid af 'at gå'.","havde gået","Førdatid dannes med havde + kort tillægsform.",5),
      choice("Hvilken tidsrelation viser 'Da jeg kom, havde hun spist'?",["Hun spiste før jeg kom","Hun spiste efter jeg kom","Handlingerne sker samtidig i fremtiden","Der er ingen tidsrelation"],"Hun spiste før jeg kom","Førdatid placerer spisningen før datidshandlingen 'kom'.",5)
    ]
  },
  "Aktiv og passiv":{
    basis:[
      choice("Hvilken sætning står i aktiv?",["Eleven skrev teksten.","Teksten blev skrevet af eleven.","Teksten skrives.","Der blev skrevet."],"Eleven skrev teksten.","I aktiv står den handlende typisk som grundled.",7),
      choice("Hvilken sætning står i passiv?",["Bogen blev læst af klassen.","Klassen læste bogen.","Klassen læser bogen.","Klassen har læst bogen."],"Bogen blev læst af klassen.","Blive + kort tillægsform danner en passiv konstruktion.",7),
      choice("Hvilket ord er s-passiv?",["skrives","skriver","skrev","skrive"],"skrives","Endelsen -s kan danne passiv: skrives.",7),
      text("Omskriv til passiv: 'Læreren retter opgaven.'","Opgaven rettes af læreren.","Objektet bliver grundled i passiv, og handlingen fremhæves.",7, ["Opgaven bliver rettet af læreren.","Opgaven rettes af læreren."]),
      choice("Hvad kan passiv gøre ved den handlende?",["Gøre aktøren mindre tydelig eller helt udelade den","Gøre aktøren til et tillægsord","Altid gøre aktøren vigtigere","Fjerne udsagnsordet"],"Gøre aktøren mindre tydelig eller helt udelade den","Passiv kan flytte fokus fra den, der handler, til handlingen eller resultatet.",7)
    ],
    traening:[
      choice("Hvilken version skjuler tydeligst, hvem der besluttede noget?",["Det blev besluttet at lukke tilbuddet.","Ledelsen besluttede at lukke tilbuddet.","Kommunen besluttede lukningen.","Bestyrelsen traf beslutningen."],"Det blev besluttet at lukke tilbuddet.","Passiv uden agent udelader den handlende.",7),
      rewrite("Gør aktiv: 'Reglerne blev ændret af skolen.'","Skolen ændrede reglerne.","Aktiv gør aktøren til tydeligt grundled.",7),
      choice("Hvilken passivform er korrekt?",["Døren åbnes kl. 8.","Døren åbneres kl. 8.","Døren åbnede-s kl. 8.","Døren åbne kl. 8."],"Døren åbnes kl. 8.","Åbnes er korrekt s-passiv.",7),
      choice("Hvornår kan passiv være hensigtsmæssig?",["Når handlingen eller resultatet er vigtigere end aktøren","Kun når man ikke kender grammatik","Aldrig i fagtekster","Kun i dialog"],"Når handlingen eller resultatet er vigtigere end aktøren","Passiv bruges ofte i instruktioner og fagtekster, når processen er i fokus.",7),
      text("Omskriv til aktiv: 'Forsøget blev gennemført af eleverne.'","Eleverne gennemførte forsøget.","Aktiv fremhæver eleverne som handlende.",7)
    ],
    udfordring:[
      choice("Hvilken retorisk effekt kan agentløs passiv have i en politisk tekst?",["Ansvar kan blive uklart eller nedtonet","Ansvar bliver altid tydeligere","Sætningen bliver automatisk neutral","Alle påstande bliver sande"],"Ansvar kan blive uklart eller nedtonet","Formuleringer som 'der blev begået fejl' kan skjule, hvem der begik dem.",7),
      rewrite("Gør ansvaret tydeligt: 'Der blev truffet en forkert beslutning.' Ledelsen var ansvarlig.","Ledelsen traf en forkert beslutning.","Aktiv konstruktion placerer ansvaret hos den konkrete aktør.",7),
      choice("Hvilken version er bedst, hvis processen er vigtigst?",["Prøven opvarmes til 80 grader.","Vi opvarmer prøven til 80 grader.","Nogen opvarmer prøven.","Prøven er varm."],"Prøven opvarmes til 80 grader.","Passiv kan være hensigtsmæssig i procesbeskrivelser.",7),
      text("Omskriv til s-passiv: 'Man lukker døren automatisk.'","Døren lukkes automatisk.","S-passiv fjerner det generelle 'man' og fremhæver processen.",7),
      choice("Form → funktion → effekt ved passiv?",["Passiv form → flytter fokus fra aktør til handling/resultat → kan neutralisere eller skjule ansvar","Navneord → viser tid → skaber tempo","Biord → viser ejerskab → skaber nærhed","Tillægsord → markerer spørgsmål"],"Passiv form → flytter fokus fra aktør til handling/resultat → kan neutralisere eller skjule ansvar","Grammatisk form kan påvirke, hvordan ansvar og fokus opleves.",7)
    ]
  },
  "Modalverber":{
    basis:[
      choice("Hvilket ord er et modalverbum?",["kan","løber","hus","hurtigt"],"kan","Kan udtrykker mulighed eller evne og står ofte sammen med et andet udsagnsord.",7),
      choice("Find modalverbet: 'Hun skal læse bogen.'",["Hun","skal","læse","bogen"],"skal","Skal udtrykker nødvendighed eller plan.",7),
      choice("Hvilken sætning udtrykker mulighed?",["Det kan regne senere.","Det regner nu.","Det regnede i går.","Regnen faldt."],"Det kan regne senere.","Kan markerer mulighed.",7),
      text("Skriv modalverbet i 'Du bør tage en jakke med.'","bør","Bør udtrykker anbefaling.",7),
      choice("Hvilket modalverbum udtrykker ofte pligt eller nødvendighed?",["skal","kan","vil","måske"],"skal","Skal kan markere krav, pligt eller fast plan.",7)
    ],
    traening:[
      choice("Hvilket udsagn er mest forsigtigt?",["Det kan være en forklaring.","Det er forklaringen.","Det er helt sikkert forklaringen.","Det må være forklaringen."],"Det kan være en forklaring.","Kan åbner for mulighed uden at gøre påstanden sikker.",7),
      choice("Hvad gør 'må' i 'Du må gå nu'?",["Udtrykker tilladelse","Viser datid","Er et navneord","Viser sted"],"Udtrykker tilladelse","Må kan blandt andet udtrykke tilladelse.",7),
      rewrite("Gør udsagnet mindre kategorisk med et modalverbum: 'Det er forkert.'","Det kan være forkert.","Kan nedtoner sikkerheden.",7),
      choice("Hvilket modalverbum passer til en anbefaling?",["bør","kan","vil","har"],"bør","Bør markerer, at noget anbefales uden nødvendigvis at være et krav.",7),
      text("Skriv modalverbet: 'Vi kunne vælge en anden løsning.'","kunne","Kunne udtrykker en mulighed.",7)
    ],
    udfordring:[
      choice("Hvorfor er modalverber vigtige i argumenterende tekster?",["De viser graden af nødvendighed, mulighed, vilje eller sikkerhed","De gør argumenter sande","De erstatter dokumentation","De bruges kun i spørgsmål"],"De viser graden af nødvendighed, mulighed, vilje eller sikkerhed","Skal, bør, kan, må og vil positionerer afsenderen forskelligt.",7),
      choice("Hvilken formulering er mest forpligtende?",["Skolen skal ændre praksis.","Skolen kan ændre praksis.","Skolen kunne ændre praksis.","Skolen bør måske ændre praksis."],"Skolen skal ændre praksis.","Skal udtrykker stærk nødvendighed eller krav.",7),
      rewrite("Gør kravet til en anbefaling: 'Eleverne skal aflevere tidligere.'","Eleverne bør aflevere tidligere.","Bør ændrer modaliteten fra krav til anbefaling.",7),
      choice("Hvilken betydning har 'må' i 'Han må være hjemme nu'?",["En slutning eller formodning","Tilladelse til at gå","Datid","Et direkte spørgsmål"],"En slutning eller formodning","Modalverber kan have flere betydninger afhængigt af kontekst.",7),
      text("Skriv det modalverbum, der gør udsagnet til en mulighed: 'Det ___ skyldes vejret.'","kan","Kan gør årsagsforklaringen mulig frem for sikker.",7)
    ]
  },
  "Hensynsled":{
    basis:[
      choice("Find hensynsleddet: 'Maja gav Ali bogen.'",["Maja","Ali","bogen","gav"],"Ali","Ali er den, der modtager bogen.",6),
      choice("Hvad er hensynsleddet i 'Læreren sendte eleverne en besked'?",["eleverne","Læreren","en besked","sendte"],"eleverne","Eleverne er modtagere af beskeden.",6),
      choice("Hvilket spørgsmål kan hjælpe med at finde hensynsleddet?",["Til hvem/for hvem?","Hvad gør?","Hvornår?","Hvordan ser det ud?"],"Til hvem/for hvem?","Hensynsleddet angiver ofte modtager eller den, handlingen sker til fordel for.",6),
      text("Skriv hensynsleddet: 'Far købte mig en cykel.'","mig","Mig er den, cyklen bliver købt til.",6),
      choice("Hvilket led er typisk den ting, der gives i 'Hun gav ham brevet'?",["genstandsleddet","hensynsleddet","grundleddet","udsagnsleddet"],"genstandsleddet","Brevet er det, der gives; ham er modtageren.",6)
    ],
    traening:[
      choice("Find både hensynsled og genstandsled: 'Sara viste klassen billedet.'",["klassen / billedet","Sara / klassen","billedet / klassen","viste / billedet"],"klassen / billedet","Klassen er modtager; billedet er det, der vises.",6),
      choice("Hvilken omskrivning viser hensynsleddet som forholdsordsled?",["Hun gav bogen til Ali.","Hun gav Ali bogen.","Ali gav bogen.","Bogen gav Ali."],"Hun gav bogen til Ali.","Hensynsled kan ofte omskrives med til/for.",6),
      rewrite("Omskriv med 'til': 'Læreren forklarede eleverne reglen.'","Læreren forklarede reglen til eleverne.","Omskrivningen gør modtagerrelationen eksplicit med forholdsord.",6),
      text("Skriv hensynsleddet: 'Hun læste barnet en historie.'","barnet","Barnet er modtager af historien.",6),
      choice("Hvilken sætning har et hensynsled?",["Jeg sendte hende et brev.","Jeg sov længe.","Bogen lå på bordet.","Det regnede."],"Jeg sendte hende et brev.","Hende er modtageren.",6)
    ],
    udfordring:[
      choice("Hvorfor kan hensynsled forveksles med genstandsled?",["Begge kan stå uden forholdsord og være navneordsled efter udsagnsordet","De er altid samme led","Hensynsled er et udsagnsord","Genstandsled står altid først"],"Begge kan stå uden forholdsord og være navneordsled efter udsagnsordet","Betydning og omskrivning med til/for hjælper med at skelne dem.",6),
      rewrite("Gør modtageren tydelig: 'Hun skænkede gæsten kaffe.'","Hun skænkede kaffe til gæsten.","Omskrivningen viser relationen mellem kaffe og modtager.",6),
      choice("I 'Kommunen tilbød borgerne hjælp' er 'borgerne'…",["hensynsled","grundled","omsagnsled","adverbialled"],"hensynsled","Borgerne er modtagere af hjælpen.",6),
      text("Skriv genstandsleddet i 'Virksomheden lovede medarbejderne en bonus.'","en bonus","Bonus er det, der loves; medarbejderne er modtagere.",6),
      choice("Hvilken analyse er korrekt: 'Hun fortalte mig sandheden'?",["hun=grundled, fortalte=udsagnsled, mig=hensynsled, sandheden=genstandsled","hun=genstandsled, mig=grundled","sandheden=hensynsled, mig=udsagnsled","fortalte=grundled"],"hun=grundled, fortalte=udsagnsled, mig=hensynsled, sandheden=genstandsled","Analysen skelner den handlende, handlingen, modtageren og det overførte indhold.",6)
    ]
  },
  "Adverbialled":{
    basis:[
      choice("Find adverbialleddet: 'Hun løb hurtigt.'",["hurtigt","Hun","løb","Hun løb"],"hurtigt","Hurtigt fortæller, hvordan handlingen foregår.",6),
      choice("Hvilket led fortæller tid i 'Vi mødes i morgen'?",["i morgen","Vi","mødes","ingen"],"i morgen","I morgen er et tidsadverbial.",6),
      choice("Hvilket led fortæller sted: 'Bogen ligger på bordet'?",["på bordet","Bogen","ligger","bordet ligger"],"på bordet","På bordet angiver sted.",6),
      text("Skriv adverbialleddet: 'Hun talte meget stille.'","meget stille","Ledet fortæller måden, hun talte på.",6),
      choice("Hvilke spørgsmål kan adverbialled ofte besvare?",["hvornår, hvor, hvordan, hvorfor","hvem ejer det","hvilket køn","hvor mange bogstaver"],"hvornår, hvor, hvordan, hvorfor","Adverbialer giver omstændigheder omkring handlingen.",6)
    ],
    traening:[
      choice("Find tidsadverbialet: 'Efter skole cyklede vi hjem.'",["Efter skole","vi","cyklede","hjem"],"Efter skole","Ledet angiver tidspunkt.",6),
      choice("Find stedsadverbialet: 'Hun stillede tasken ved døren.'",["ved døren","Hun","tasken","stillede"],"ved døren","Ved døren angiver placering.",6),
      choice("Hvad gør 'på grund af regnen' i 'Kampen blev aflyst på grund af regnen'?",["angiver årsag","er grundled","er genstandsled","angiver ejerskab"],"angiver årsag","Det er et årsagsadverbial.",6),
      rewrite("Flyt adverbialleddet til starten: 'Vi går hjem efter mødet.'","Efter mødet går vi hjem.","Adverbialer kan ofte flyttes, og dansk hovedsætning får inversion efter et foranstillet led.",6),
      text("Skriv mådesadverbialet i 'Han svarede uden tøven.'","uden tøven","Ledet fortæller, hvordan han svarede.",6)
    ],
    udfordring:[
      choice("Hvorfor er adverbialled vigtige i fortællinger?",["De kan præcisere tid, sted, måde, årsag og dermed skabe scene og rytme","De er altid unødvendige","De viser kun ejerskab","De erstatter alle udsagnsord"],"De kan præcisere tid, sted, måde, årsag og dermed skabe scene og rytme","Adverbialer rammesætter handlinger.",6),
      choice("Hvilken sætning bruger et sætningsadverbial?",["Hun kommer måske i morgen.","Hun løber hurtigt.","Hun står ved døren.","Hun købte en bog."],"Hun kommer måske i morgen.","Måske kommenterer hele udsagnets sikkerhed.",6),
      rewrite("Gør årsagen tydelig med et adverbialled: 'Mødet blev aflyst. Læreren var syg.'","Mødet blev aflyst på grund af lærerens sygdom.","Årsagsadverbialet samler relationen i én sætning.",6),
      text("Skriv adverbialleddet i 'Helt ærligt synes jeg, argumentet er svagt.'","Helt ærligt","Ledet kommenterer afsenderens måde at forholde sig til hele udsagnet på.",6),
      choice("Hvad sker der med ordstillingen i 'I går så jeg filmen'?",["Adverbialet står i forfeltet, og udsagnsleddet kommer før grundleddet","Grundleddet forsvinder","Sætningen bliver en ledsætning","Der må ikke være udsagnsord"],"Adverbialet står i forfeltet, og udsagnsleddet kommer før grundleddet","Foranstillet led udløser inversion i dansk helsætning.",6)
    ]
  },
  "Ordstilling og inversion":{
    basis:[
      choice("Hvilken sætning har korrekt ordstilling?",["I dag går jeg hjem tidligt.","I dag jeg går hjem tidligt.","I dag hjem jeg går tidligt.","Går i dag hjem jeg tidligt."],"I dag går jeg hjem tidligt.","Når et andet led står først, kommer det finitte udsagnsord normalt før grundleddet.",6),
      choice("Hvad kaldes det, når udsagnsleddet kommer før grundleddet?",["inversion","genitiv","passiv","gradbøjning"],"inversion","Inversion betyder omvendt rækkefølge mellem grundled og finit udsagnsled.",6),
      choice("Vælg korrekt: 'På mandag ___ vi testen.'",["skriver","vi skriver","skrive","skrev vi"],"skriver","Efter forfeltet 'På mandag' kommer det finitte udsagnsord før grundleddet: skriver vi.",6),
      text("Ret ordstillingen: 'I går jeg så filmen.'","I går så jeg filmen.","Foranstillet tidsled giver inversion.",6),
      choice("Hvilken sætning begynder med grundleddet?",["Jeg læser bogen i dag.","I dag læser jeg bogen.","Efter skole læser jeg bogen.","Måske læser jeg bogen."],"Jeg læser bogen i dag.","Jeg er grundled og står først.",6)
    ],
    traening:[
      choice("Hvilken version er korrekt?",["Efter pausen fortsætter læreren.","Efter pausen læreren fortsætter.","Efter pausen fortsætte læreren.","Efter pausen læreren fortsætte."],"Efter pausen fortsætter læreren.","Et foranstillet adverbial efterfølges af finit udsagnsled og så grundled.",6),
      rewrite("Flyt 'om aftenen' frem og bevar korrekt ordstilling: 'Hun læser om aftenen.'","Om aftenen læser hun.","Når adverbialet flyttes til forfeltet, opstår inversion.",6),
      choice("Hvilken ordstilling er typisk for en ledsætning med 'ikke'?",["fordi hun ikke kommer","fordi hun kommer ikke","fordi kommer hun ikke","fordi ikke hun kommer"],"fordi hun ikke kommer","I ledsætninger står sætningsadverbialet ofte før det finitte udsagnsord.",6),
      choice("Hvilken test kan hjælpe med hel- og ledsætning?",["Placeringen af 'ikke'","Antallet af navneord","Ordets længde","Om der er et egennavn"],"Placeringen af 'ikke'","Helsætning: hun kommer ikke; ledsætning: fordi hun ikke kommer.",6),
      text("Ret: 'Fordi hun kommer ikke, går vi nu.'","Fordi hun ikke kommer, går vi nu.","I ledsætningen står ikke før det finitte udsagnsord.",6)
    ],
    udfordring:[
      choice("Hvad er forfeltet i 'Den bog har jeg aldrig læst'?",["Den bog","har","jeg","aldrig"],"Den bog","Et ikke-grundled er rykket frem for at få fokus.",6),
      choice("Hvilken effekt kan foranstilling have?",["Et bestemt led kan fremhæves eller bindes til det foregående","Sætningen mister altid mening","Alle ord bliver navneord","Teksten bliver automatisk formel"],"Et bestemt led kan fremhæves eller bindes til det foregående","Ordstilling bruges også til informationsstruktur og fokus.",6),
      rewrite("Fremhæv 'den løsning' ved at sætte den først: 'Jeg havde aldrig overvejet den løsning.'","Den løsning havde jeg aldrig overvejet.","Objektet står i forfeltet og efterfølges af inversion.",6),
      choice("Hvilken sætning viser korrekt V2-ordstilling i en dansk helsætning?",["I morgen vil eleverne fremlægge.","I morgen eleverne vil fremlægge.","I morgen eleverne fremlægge vil.","I morgen vil fremlægge eleverne."],"I morgen vil eleverne fremlægge.","Det finitte udsagnsord står på anden plads i helsætningen.",6),
      text("Ret både ledsætnings- og helsætningsordstilling: 'Hvis han kommer ikke, så vi går.'","Hvis han ikke kommer, så går vi.","Ledsætningen har ikke før verbet; helsætningen efter 'så' har inversion.",6)
    ]
  },
  "Sætningsskema":{
    basis:[
      choice("Hvilket felt står først i en dansk helsætning?",["forfeltet","slutfeltet","objektfeltet","kommafeltet"],"forfeltet","Forfeltet kan rumme ét led før det finitte udsagnsord.",7),
      choice("I 'I dag læser Maja bogen' er forfeltet…",["I dag","læser","Maja","bogen"],"I dag","I dag står før det finitte udsagnsord.",7),
      choice("I 'Maja læser bogen' står 'læser' som…",["finit verbal","grundled","objekt","adverbial"],"finit verbal","Læser er det bøjede udsagnsord.",7),
      text("Skriv grundleddet i 'I morgen afleverer eleverne opgaven.'","eleverne","Efter det finitte udsagnsord kommer grundleddet her.",7),
      choice("Hvad viser sætningsskemaet?",["Pladser og rækkefølge for led i sætningen","Kun stavning","Kun ordklassernes alfabet","Kun tegnsætning"],"Pladser og rækkefølge for led i sætningen","Skemaet gør dansk ordstilling synlig.",7)
    ],
    traening:[
      choice("Analyser begyndelsen: 'Efter pausen skal vi arbejde.'",["forfelt: Efter pausen; finit verbal: skal; grundled: vi","forfelt: skal; grundled: pausen","finit verbal: Efter","grundled: arbejde"],"forfelt: Efter pausen; finit verbal: skal; grundled: vi","Sætningen følger V2-mønstret.",7),
      choice("Hvor står sætningsadverbialet 'ikke' typisk i en helsætning?",["efter grundleddet og før det øvrige verballed","altid først","efter objektet","uden for sætningen"],"efter grundleddet og før det øvrige verballed","Fx 'Hun har ikke læst bogen'.",7),
      rewrite("Flyt 'i morgen' til forfeltet: 'Vi skal mødes i morgen.'","I morgen skal vi mødes.","Forfeltet ændres, mens det finitte verbal stadig står på anden plads.",7),
      text("Hvad er det finitte verbal i 'Eleverne har ikke afleveret endnu'?","har","Har er bøjet i tid og står som finit verbal.",7),
      choice("Hvilket led står i forfeltet i 'Bogen har jeg læst'?",["Bogen","har","jeg","læst"],"Bogen","Objektet er foranstillet og fremhævet.",7)
    ],
    udfordring:[
      choice("Hvorfor er sætningsskema nyttigt ved korrektur?",["Det gør det lettere at opdage ordstillingsfejl og se leddenes funktion","Det retter automatisk stavning","Det fjerner behovet for læsning","Det bruges kun til poesi"],"Det gør det lettere at opdage ordstillingsfejl og se leddenes funktion","Et strukturelt blik kan forklare, hvorfor en sætning lyder forkert.",7),
      choice("Hvilken sætning har objekt i forfeltet?",["Den film har jeg set.","Jeg har set den film.","I går så jeg filmen.","Hun så filmen i går."],"Den film har jeg set.","Objektet 'Den film' er flyttet til første felt.",7),
      rewrite("Fremhæv tidsleddet og bevar V2: 'Eleverne afleverer opgaven på fredag.'","På fredag afleverer eleverne opgaven.","Tidsleddet står i forfeltet, verbet på anden plads.",7),
      text("Hvad er sætningsadverbialet i 'Maja har sandsynligvis ikke set filmen'?","sandsynligvis ikke","Begge ord kommenterer udsagnet og står i centralfeltet omkring verballeddet.",7, ["sandsynligvis", "ikke", "sandsynligvis ikke"]),
      choice("Hvilken analyse af 'I går havde hun ikke set beskeden' er bedst?",["forfelt: I går; finit verbal: havde; grundled: hun; sætningsadverbial: ikke; infinit verbal: set; objekt: beskeden","grundled: I går; verbal: hun","objekt: havde; forfelt: beskeden","hele sætningen er en ledsætning"],"forfelt: I går; finit verbal: havde; grundled: hun; sætningsadverbial: ikke; infinit verbal: set; objekt: beskeden","Analysen følger sætningsskemaets felter.",7)
    ]
  }
};
