import type { GradedGrammarLibrary, GradedGrammarQuestion } from "./grade-progression";

const choice=(q:string,options:string[],answer:string,why:string,minGrade:number):GradedGrammarQuestion=>({q,options,answer,why,kind:"choice",minGrade});
const text=(q:string,answer:string,why:string,minGrade:number,acceptedAnswers:string[]=[answer]):GradedGrammarQuestion=>({q,options:[],answer,why,kind:"text",acceptedAnswers,minGrade,placeholder:"Skriv dit svar…"});
const rewrite=(q:string,answer:string,why:string,minGrade:number,acceptedAnswers:string[]=[answer]):GradedGrammarQuestion=>({q,options:[],answer,why,kind:"rewrite",acceptedAnswers,minGrade,placeholder:"Skriv den rettede sætning…"});

export const completeWordClassesLibrary:GradedGrammarLibrary={
  "Forholdsord":{
    basis:[
      choice("Hvilket ord er et forholdsord?",["på","løber","grøn","hund"],"på","På viser et forhold mellem ting eller steder.",4),
      choice("Find forholdsordet: 'Bogen ligger under bordet.'",["Bogen","ligger","under","bordet"],"under","Under viser bogens placering i forhold til bordet.",4),
      choice("Hvilket ord passer: 'Katten sidder ___ stolen.'",["på","sover","blød","katten"],"på","På viser placering.",4),
      text("Skriv forholdsordet i 'Vi går gennem skoven.'","gennem","Gennem viser bevægelsens forhold til skoven.",4),
      choice("Hvilket er IKKE et forholdsord?",["med","fra","til","meget"],"meget","Meget er typisk et biord, ikke et forholdsord.",4)
    ],
    traening:[
      choice("Hvilket forholdsord passer bedst: 'Hun er god ___ matematik.'",["til","på","under","fra"],"til","Man siger normalt 'god til' noget.",4),
      choice("Hvad gør forholdsord i en sætning?",["Viser relationer som sted, retning, tid eller forbindelse","Viser altid handling","Navngiver personer","Bøjer udsagnsord"],"Viser relationer som sted, retning, tid eller forbindelse","Forholdsord forbinder led og viser deres indbyrdes relation.",4),
      choice("Find forholdsordsforbindelsen: 'Eleven stod ved døren.'",["ved døren","Eleven stod","stod ved","døren"],"ved døren","Forholdsordet ved danner forbindelse med navneordet døren.",4),
      rewrite("Ret ordvalget: 'Hun er interesseret på historie.'","Hun er interesseret i historie.","På dansk hedder forbindelsen 'interesseret i'.",4),
      text("Skriv forholdsordet: 'Mødet begynder efter pausen.'","efter","Efter viser en tidsmæssig relation.",4)
    ],
    udfordring:[
      choice("Hvilken betydningsforskel er der mellem 'på bordet' og 'under bordet'?",["Forholdsordet ændrer den rumlige relation","Navneordet skifter ordklasse","Udsagnsordet skifter tid","Der er ingen forskel"],"Forholdsordet ændrer den rumlige relation","Forholdsord kan ændre den præcise relation mellem led.",4),
      choice("Hvilken sætning bruger et forholdsord billedligt?",["Hun er under pres.","Bogen er under bordet.","Koppen står på bordet.","Han går gennem døren."],"Hun er under pres.","Under beskriver her ikke fysisk placering, men en abstrakt tilstand.",4),
      rewrite("Gør relationen mere præcis: 'Han gik ved huset.' Han bevægede sig hele vejen rundt om huset.","Han gik rundt om huset.","Rundt om udtrykker den tilsigtede bevægelse mere præcist.",4),
      choice("Hvorfor er forholdsord vigtige i fagtekster?",["De kan præcisere relationer mellem begreber, tid og sted","De gør teksten automatisk kort","De erstatter kilder","De markerer kun spørgsmål"],"De kan præcisere relationer mellem begreber, tid og sted","Relationer som mellem, gennem, på grund af og i forhold til bærer vigtig betydning.",4),
      text("Skriv forholdsordet i den billedlige forbindelse: 'Argumentet bygger på flere kilder.'","på","Bygger på er her en fast, abstrakt forbindelse.",4)
    ]
  },
  "Bindeord":{
    basis:[
      choice("Hvilket ord er et bindeord?",["og","hus","løber","meget"],"og","Og forbinder ord eller sætninger.",4),
      choice("Find bindeordet: 'Maja læser, men Ali tegner.'",["Maja","læser","men","tegner"],"men","Men forbinder to dele og markerer en modsætning.",4),
      choice("Hvilket ord kan forbinde to ting: 'te og kaffe'?",["og","på","stor","drikker"],"og","Og sideordner to led.",4),
      text("Skriv bindeordet: 'Jeg bliver hjemme, fordi jeg er syg.'","fordi","Fordi indleder en begrundelse.",4),
      choice("Hvilket er IKKE et bindeord?",["eller","men","fordi","hurtigt"],"hurtigt","Hurtigt er et biord.",4)
    ],
    traening:[
      choice("Hvilket bindeord viser årsag?",["fordi","men","eller","og"],"fordi","Fordi kobler en årsag til det, der bliver forklaret.",4),
      choice("Hvilket bindeord viser modsætning?",["men","og","fordi","så"],"men","Men signalerer kontrast.",4),
      choice("Hvilket bindeord passer: 'Vi kan gå nu, ___ vi kan vente.'",["eller","fordi","mens","at"],"eller","Eller opstiller alternativer.",4),
      rewrite("Forbind sætningerne med 'fordi': 'Jeg tog paraplyen. Det regnede.'","Jeg tog paraplyen, fordi det regnede.","Fordi gør årsagsforholdet tydeligt.",4),
      text("Skriv bindeordet, der viser tid: 'Jeg læste, ___ hun lavede mad.'","mens","Mens viser, at handlingerne foregår samtidigt.",4)
    ],
    udfordring:[
      choice("Hvad ændrer sig, hvis 'og' erstattes af 'men'?",["Relationen går fra sideordning til modsætning","Sætningen bliver automatisk datid","Begge led bliver navneord","Intet ændrer sig"],"Relationen går fra sideordning til modsætning","Bindeord styrer læserens forståelse af relationen mellem udsagn.",4),
      choice("Hvilket bindeord gør argumentationen mest årsagsklar?",["derfor","og","eller","mens"],"derfor","Derfor markerer en følge eller konklusion på noget foregående.",4),
      rewrite("Gør kontrasten tydelig: 'Hun havde øvet sig. Hun var stadig nervøs.'","Hun havde øvet sig, men hun var stadig nervøs.","Men tydeliggør kontrasten mellem forberedelse og nervøsitet.",4),
      choice("Hvilken funktion har 'selvom' i 'Selvom det regnede, gik vi ud'?",["Indleder et forhold, der kunne have forhindret hovedhandlingen, men ikke gjorde det","Viser ejerskab","Angiver kun sted","Gør sætningen til et spørgsmål"],"Indleder et forhold, der kunne have forhindret hovedhandlingen, men ikke gjorde det","Selvom markerer indrømmelse eller kontrast.",4),
      text("Skriv et bindeord, der passer: 'Han var træt, ___ han fortsatte.'","men","Men markerer den forventningsbrudte modsætning.",4)
    ]
  },
  "Kendeord":{
    basis:[
      choice("Hvilket ord er et kendeord?",["en","løber","rød","hurtigt"],"en","En står foran et navneord og markerer ubestemt form.",3),
      choice("Find kendeordet: 'Et hus står på bakken.'",["Et","hus","står","bakken"],"Et","Et hører sammen med navneordet hus.",3),
      choice("Hvilket kendeord passer til 'bog'?",["en","et","de","denne"],"en","Man siger en bog.",3),
      text("Skriv kendeordet: '___ æble ligger på bordet.'","et","Æble er intetkøn: et æble.",3),
      choice("Hvilket er IKKE et kendeord?",["en","et","den","meget"],"meget","Meget er ikke et kendeord.",3)
    ],
    traening:[
      choice("Hvilken række passer sammen?",["en bil – bilen","et hus – huset","en hus – huset","et bil – bilen"],"et hus – huset","Hus er intetkøn og tager et i ubestemt form.",3),
      choice("Hvad viser 'en/et' typisk?",["At navneordet står i ubestemt ental","At udsagnsordet står i datid","At sætningen er et spørgsmål","At der er flertal"],"At navneordet står i ubestemt ental","En og et er ubestemte kendeord.",3),
      choice("Vælg korrekt: '___ gamle cykel stod udenfor.'",["Den","Et","En","De"],"Den","Når et bestemt navneord har et tillægsord foran, bruges ofte den/det/de: den gamle cykel.",3),
      rewrite("Ret: 'Et kat sad i vinduet.'","En kat sad i vinduet.","Kat er fælleskøn og tager kendeordet en.",3),
      text("Skriv kendeordet: '___ røde huse ligger ved stranden.'","De","I bestemt flertal med tillægsord bruges de: de røde huse.",3)
    ],
    udfordring:[
      choice("Hvad er forskellen på 'en lærer' og 'læreren'?",["Første er ubestemt, andet er bestemt","Første er datid, andet nutid","Første er flertal","Der er ingen forskel"],"Første er ubestemt, andet er bestemt","Kendeord og endelser markerer bestemthed.",3),
      choice("Hvorfor hedder det 'den interessante bog' og ikke bare 'interessante bogen' i standarddansk?",["Bestemthed markeres med foranstillet kendeord, når et tillægsord står foran","Fordi bog er et udsagnsord","Fordi alle tillægsord kræver den","Fordi sætningen er i datid"],"Bestemthed markeres med foranstillet kendeord, når et tillægsord står foran","Den/det/de bruges i denne bestemte nominalgruppe.",3),
      rewrite("Ret bestemthed: 'Jeg læste interessante bogen.'","Jeg læste den interessante bog.","Bestemt form med foranstillet tillægsord kræver her den.",3),
      choice("Hvilken formulering er grammatisk korrekt?",["det store hus","den store hus","et store huset","de stort hus"],"det store hus","Hus er intetkøn, og den bestemte gruppe tager det.",3),
      text("Skriv korrekt kendeord: '___ vigtigste argument var tydeligt.'","Det","Argument er intetkøn: det vigtigste argument.",3)
    ]
  },
  "Talord":{
    basis:[
      choice("Hvilket ord er et talord?",["tre","træ","stor","løber"],"tre","Tre angiver et antal.",3),
      choice("Find talordet: 'Hun købte fire æbler.'",["Hun","købte","fire","æbler"],"fire","Fire angiver, hvor mange æbler.",3),
      choice("Hvilket talord viser rækkefølge?",["første","en","mange","flere"],"første","Første er et ordenstal.",3),
      text("Skriv talordet: 'Der står syv stole.'","syv","Syv angiver antal.",3),
      choice("Hvilket er IKKE et talord?",["to","tiende","hundrede","hurtig"],"hurtig","Hurtig er et tillægsord.",3)
    ],
    traening:[
      choice("Hvilket er et mængdetal?",["fem","femte","sidste","næste"],"fem","Fem angiver antal.",3),
      choice("Hvilket er et ordenstal?",["sjette","seks","mange","flere"],"sjette","Sjette viser placering i en rækkefølge.",3),
      choice("Hvilken sætning indeholder et ordenstal?",["Hun blev nummer tre.","Hun blev tredje i løbet.","Hun løb tre kilometer.","Tre elever løb."],"Hun blev tredje i løbet.","Tredje angiver rækkefølge.",3),
      rewrite("Skriv talordet med bogstaver: 'Jeg har 4 søskende.'","Jeg har fire søskende.","Fire er mængdetallet skrevet med bogstaver.",3),
      text("Skriv ordenstallet til tallet 8.","ottende","Ottende viser placering nummer otte.",3)
    ],
    udfordring:[
      choice("Hvad er forskellen på 'to' og 'anden'?",["To angiver antal; anden angiver rækkefølge","Begge betyder præcis det samme","To er udsagnsord","Anden er altid et navneord"],"To angiver antal; anden angiver rækkefølge","Mængdetal og ordenstal har forskellige funktioner.",3),
      choice("Hvilken formulering bruger talord mest præcist i en fagtekst?",["Undersøgelsen omfattede 48 elever.","Undersøgelsen omfattede nogle elever.","Undersøgelsen omfattede ret mange elever.","Undersøgelsen omfattede en bunke elever."],"Undersøgelsen omfattede 48 elever.","Det præcise tal giver konkret information.",3),
      rewrite("Gør informationen mere præcis med talord: 'Mange elever svarede ja.' Oplysningen er 17 ud af 20.","17 ud af 20 elever svarede ja.","Talord kan gøre en oplysning mere præcis og efterprøvbar.",3, ["Sytten ud af tyve elever svarede ja.","17 ud af 20 elever svarede ja."]),
      choice("Hvilken sætning bruger 'første' som ordenstal?",["Hun var den første, der kom.","Hun havde første mange bøger.","Første var et hus.","Hun førstede hjem."],"Hun var den første, der kom.","Første markerer placering i rækkefølgen.",3),
      text("Skriv mængdetallet, der svarer til ordenstallet 'tiende'.","ti","Ti angiver antal; tiende angiver rækkefølge.",3)
    ]
  },
  "Udråbsord":{
    basis:[
      choice("Hvilket ord er et udråbsord?",["av","hund","løber","grøn"],"av","Av kan stå som et selvstændigt udbrud.",3),
      choice("Find udråbsordet: 'Åh, hvor er her smukt!'",["Åh","hvor","er","smukt"],"Åh","Åh udtrykker en spontan reaktion.",3),
      choice("Hvilket udråbsord kan vise smerte?",["av","og","på","meget"],"av","Av er et typisk smerteudbrud.",3),
      text("Skriv udråbsordet i 'Puha, det var hårdt.'","Puha","Puha udtrykker en reaktion på oplevelsen.",3),
      choice("Hvilket er IKKE et udråbsord?",["hov","uha","nå","cykel"],"cykel","Cykel er et navneord.",3)
    ],
    traening:[
      choice("Hvad kan udråbsord især udtrykke?",["Følelser, reaktioner eller kontakt","Kun tid","Kun ejerskab","Grammatisk køn"],"Følelser, reaktioner eller kontakt","Udråbsord står ofte forholdsvis selvstændigt og signalerer reaktion.",3),
      choice("Hvilket udråbsord passer bedst til overraskelse?",["wow","av","øv","pst"],"wow","Wow bruges ofte om begejstring eller overraskelse.",3),
      choice("Hvad gør 'øv' i 'Øv, vi tabte'?",["Udtrykker skuffelse","Viser sted","Er udsagnsled","Angiver antal"],"Udtrykker skuffelse","Øv viser afsenderens følelsesmæssige reaktion.",3),
      rewrite("Tilføj et passende udråbsord til en skuffet reaktion: '___, bussen kørte lige.'","Øv, bussen kørte lige.","Øv markerer skuffelse.",3, ["Øv, bussen kørte lige.","Øv! Bussen kørte lige."]),
      text("Skriv udråbsordet: 'Hey, vent på mig!'","Hey","Hey bruges her til at skabe kontakt.",3)
    ],
    udfordring:[
      choice("Hvorfor bruges udråbsord ofte i dialog?",["De kan gøre stemme, følelse og reaktion mere umiddelbar","De gør alt formelt","De fjerner karaktererne","De viser altid datid"],"De kan gøre stemme, følelse og reaktion mere umiddelbar","Udråbsord kan efterligne spontan mundtlig kommunikation.",3),
      choice("Hvilken teksttype vil typisk bruge færrest udråbsord?",["En neutral faglig rapport","En chat mellem venner","En dramatisk dialog","En personlig fortælling"],"En neutral faglig rapport","Udråbsord kan virke personlige og følelsesladede og bruges derfor sjældnere i neutral faglig stil.",3),
      rewrite("Gør sætningen mere neutral ved at fjerne udråbsordet: 'Wow, resultatet steg med 12 procent.'","Resultatet steg med 12 procent.","En neutral fagtekst kan ofte undvære den følelsesmæssige markør.",3),
      choice("Hvilken effekt har 'nå' i en dialog?",["Betydningen afhænger stærkt af tone og kontekst og kan fx vise erkendelse, skepsis eller overgang","Det betyder altid glæde","Det er altid et forholdsord","Det viser et præcist antal"],"Betydningen afhænger stærkt af tone og kontekst og kan fx vise erkendelse, skepsis eller overgang","Udråbsord er ofte pragmatiske og kontekstafhængige.",3),
      text("Skriv udråbsordet i: 'Nå, så det var derfor.'","Nå","Nå signalerer her en erkendelse eller forståelse.",3)
    ]
  }
};
