import type {GradedGrammarQuestion} from "./grade-progression";

export type AuthenticSpellingTask=GradedGrammarQuestion&{
 sourceTopic:string;
 dictationText?:string;
 taskVariant?:"rigtig-form"|"ordklasse";
 instruction?:string;
};

type GradeBank={
 diktat:AuthenticSpellingTask[];
 etEllerFlereOrd:AuthenticSpellingTask[];
 rigtigForm:AuthenticSpellingTask[];
 ordklasse:AuthenticSpellingTask[];
 datid:AuthenticSpellingTask[];
 komma:AuthenticSpellingTask[];
 retEnTekst:AuthenticSpellingTask[];
};

const t=(grade:number,q:string,answer:string,why:string,sourceTopic:string,acceptedAnswers:string[]=[answer],placeholder="Skriv dit svar…"):AuthenticSpellingTask=>({q,options:[],answer,why,kind:"text",acceptedAnswers,placeholder,sourceTopic,minGrade:grade,maxGrade:grade});
const r=(grade:number,q:string,answer:string,why:string,sourceTopic:string,acceptedAnswers:string[]=[answer]):AuthenticSpellingTask=>({q,options:[],answer,why,kind:"rewrite",acceptedAnswers,placeholder:"Skriv den rettede tekst…",sourceTopic,minGrade:grade,maxGrade:grade});
const c=(grade:number,q:string,options:string[],answer:string,why:string,sourceTopic:string):AuthenticSpellingTask=>({q,options,answer,why,kind:"choice",sourceTopic,minGrade:grade,maxGrade:grade});
const d=(grade:number,display:string,spoken:string,answer:string,why:string,sourceTopic:string,acceptedAnswers:string[]=[answer]):AuthenticSpellingTask=>({...t(grade,display,answer,why,sourceTopic,acceptedAnswers),dictationText:spoken,instruction:"Lyt til sætningen. Skriv det ord, der mangler."});
const form=(grade:number,q:string,answer:string,why:string,sourceTopic:string,acceptedAnswers:string[]=[answer])=>({...t(grade,q,answer,why,sourceTopic,acceptedAnswers),taskVariant:"rigtig-form" as const});
const wordClass=(grade:number,q:string,options:string[],answer:string,why:string,sourceTopic:string)=>({...c(grade,q,options,answer,why,sourceTopic),taskVariant:"ordklasse" as const});

const commonClasses=["Navneord (substantiv)","Udsagnsord (verbum)","Tillægsord (adjektiv)","Stedord (pronomen)","Biord (adverbium)","Forholdsord (præposition)","Bindeord (konjunktion)"];

export const authenticSpellingBanks:Record<6|7|8|9,GradeBank>={
 6:{
  diktat:[
   d(6,"Vi ________ cyklerne efter skole.","Vi reparerer cyklerne efter skole.","reparerer","Reparerer staves med ét p og to r'er i denne form.","Udsagnsords tider"),
   d(6,"Hun tog sin ________ med på tur.","Hun tog sin madpakke med på tur.","madpakke","Madpakke er ét sammensat ord: mad + pakke.","Sammensatte ord"),
   d(6,"Klassen arbejdede ________ hele timen.","Klassen arbejdede koncentreret hele timen.","koncentreret","Koncentreret ender på -eret.","Endelser"),
   d(6,"Vi mødtes ved skolens ________.","Vi mødtes ved skolens hovedindgang.","hovedindgang","Hovedindgang er et sammensat ord.","Sammensatte ord"),
   d(6,"Det var en ________ eftermiddag.","Det var en hyggelig eftermiddag.","hyggelig","Hyggelig staves med dobbelt g.","Enkelt og dobbelt konsonant")
  ],
  etEllerFlereOrd:[
   r(6,"Ret kun den markerede fejl: Vi mødes i **skole gården** klokken to.","Vi mødes i skolegården klokken to.","Skolegården skrives i ét ord.","Sammensatte ord"),
   r(6,"Ret teksten: I morgen skal vi på **klasse tur** til museet.","I morgen skal vi på klassetur til museet.","Klassetur er et sammensat navneord og skrives i ét ord.","Sammensatte ord"),
   r(6,"Ret teksten: Min søster går til **hånd bold** om tirsdagen.","Min søster går til håndbold om tirsdagen.","Håndbold består af hånd + bold og skrives i ét ord.","Sammensatte ord"),
   r(6,"Ret teksten: Vi havde **fri kvarter**, da det begyndte at regne.","Vi havde frikvarter, da det begyndte at regne.","Frikvarter skrives i ét ord.","Sammensatte ord"),
   r(6,"Ret teksten: **Sommer Ferien** begynder på fredag.","Sommerferien begynder på fredag.","Sommerferien er ét ord og skrives med lille begyndelsesbogstav midt i en sætning.","Store og små bogstaver")
  ],
  rigtigForm:[
   form(6,"Skriv ordet i den rigtige form: I går (cykle) ___ vi hjem i regnen.","cyklede","I går viser, at verbet skal stå i datid.","Udsagnsords tider"),
   form(6,"Skriv ordet i den rigtige form: De to (hund) ___ legede i haven.","hunde","Der er flere hunde, så navneordet skal stå i flertal.","Navneords bøjning"),
   form(6,"Skriv ordet i den rigtige form: Det var en (spændende) ___ kamp.","spændende","Tillægsordet spændende ændrer ikke form her.","Tillægsords bøjning"),
   form(6,"Skriv ordet i den rigtige form: Hun (læse) ___ hver aften.","læser","Handlingen sker i nutid, derfor skal der -r på læser.","Nutids-r"),
   form(6,"Skriv ordet i den rigtige form: Vi har (pakke) ___ taskerne.","pakket","Efter har bruges kort tillægsform: pakket.","Udsagnsords tider")
  ],
  ordklasse:[
   wordClass(6,"Hvilken ordklasse er ordet “cykel” i sætningen “Min cykel står udenfor”?",commonClasses,"Navneord (substantiv)","Cykel er navnet på en ting.","Navneord"),
   wordClass(6,"Hvilken ordklasse er ordet “løber” i sætningen “Sara løber hurtigt”?",commonClasses,"Udsagnsord (verbum)","Løber fortæller, hvad Sara gør.","Udsagnsord"),
   wordClass(6,"Hvilken ordklasse er ordet “grønne” i sætningen “De grønne blade faldt”?",commonClasses,"Tillægsord (adjektiv)","Grønne beskriver bladene.","Tillægsord"),
   wordClass(6,"Hvilken ordklasse er ordet “hun” i sætningen “Hun finder bogen”?",commonClasses,"Stedord (pronomen)","Hun står i stedet for et navn.","Stedord"),
   wordClass(6,"Hvilken ordklasse er ordet “hurtigt” i sætningen “Toget kører hurtigt”?",commonClasses,"Biord (adverbium)","Hurtigt fortæller, hvordan toget kører.","Biord")
  ],
  datid:[
   t(6,"Teksten står i nutid. Skriv udsagnsordet i datid: Vi (spiller) ___ fodbold efter skole.","spillede","Datid af spiller er spillede.","Udsagnsords tider"),
   t(6,"Teksten står i nutid. Skriv udsagnsordet i datid: Hun (finder) ___ sin jakke.","fandt","Finder bøjes uregelmæssigt: finder → fandt.","Udsagnsords tider"),
   t(6,"Teksten står i nutid. Skriv udsagnsordet i datid: De (går) ___ ned til søen.","gik","Går bøjes uregelmæssigt: går → gik.","Udsagnsords tider"),
   t(6,"Teksten står i nutid. Skriv udsagnsordet i datid: Jeg (skriver) ___ en besked.","skrev","Skriver bøjes uregelmæssigt: skriver → skrev.","Udsagnsords tider"),
   t(6,"Teksten står i nutid. Skriv udsagnsordet i datid: Vi (venter) ___ på bussen.","ventede","Datid af venter er ventede.","Udsagnsords tider")
  ],
  komma:[
   r(6,"Sæt de manglende kommaer: Vi købte æbler pærer bananer og juice.","Vi købte æbler, pærer, bananer og juice.","Der sættes komma mellem led i en opremsning.","Kommaøvelser"),
   r(6,"Sæt det manglende komma: Ida ville cykle men det begyndte at regne.","Ida ville cykle, men det begyndte at regne.","Der står to helsætninger bundet sammen med men.","Komma mellem helsætninger"),
   r(6,"Sæt det manglende komma: Vi gik hjem og Noah blev i klubben.","Vi gik hjem, og Noah blev i klubben.","Begge dele kan stå som selvstændige sætninger.","Komma mellem helsætninger"),
   r(6,"Sæt de manglende kommaer: På bordet lå blyanter viskelædere linealer og papir.","På bordet lå blyanter, viskelædere, linealer og papir.","Opremsningens led adskilles med komma.","Kommaøvelser"),
   r(6,"Sæt det manglende komma: Jeg ringede til Elias for jeg havde glemt tiden.","Jeg ringede til Elias, for jeg havde glemt tiden.","For binder her to helsætninger sammen.","Komma mellem helsætninger")
  ],
  retEnTekst:[
   r(6,"Ret fejlene. Kommateringen skal ikke ændres: Vi cykler hjem, fordi det regner igår.","Vi cykler hjem, fordi det regner i går.","I går skrives i to ord.","Korrektur i egne tekster"),
   r(6,"Ret fejlene. Kommateringen skal ikke ændres: Min veninde høre meget musik.","Min veninde hører meget musik.","I nutid hedder det hører med -r.","Nutids-r"),
   r(6,"Ret fejlene. Kommateringen skal ikke ændres: De lagde bøgerne på vær sin stol.","De lagde bøgerne på hver sin stol.","Hver betyder én for én; vær er en form af at være.","Hver eller vær"),
   r(6,"Ret fejlene. Kommateringen skal ikke ændres: Vi gik ud af døren og satte os på bænken uden for.","Vi gik ud ad døren og satte os på bænken udenfor.","Man går ud ad en dør; udenfor kan skrives i ét ord som biord.","Ad eller af"),
   r(6,"Ret fejlene. Kommateringen skal ikke ændres: Hun ligger tasken på bordet.","Hun lægger tasken på bordet.","Man lægger noget et sted; noget ligger et sted.","Ligge eller lægge")
  ]
 },
 7:{
  diktat:[
   d(7,"Eleverne blev ________ om ændringen.","Eleverne blev orienteret om ændringen.","orienteret","Orienteret staves med -eret.","Endelser"),
   d(7,"Vi arbejdede med et ________ projekt.","Vi arbejdede med et tværfagligt projekt.","tværfagligt","Tværfagligt er ét ord og ender på -ligt.","Sammensatte ord"),
   d(7,"Hun gav en ________ forklaring.","Hun gav en præcis forklaring.","præcis","Præcis staves med æ og c.","Fremmedord"),
   d(7,"De diskuterede deres ________ til forslaget.","De diskuterede deres holdning til forslaget.","holdning","Holdning har dobbelt l og endelsen -ning.","Enkelt og dobbelt konsonant"),
   d(7,"Vi skal ________ resultaterne bagefter.","Vi skal sammenligne resultaterne bagefter.","sammenligne","Sammenligne staves med -ligne.","Stumme bogstaver")
  ],
  etEllerFlereOrd:[
   r(7,"Ret teksten: Det var et **to timers** møde.","Det var et totimersmøde.","Totimersmøde skrives som ét sammensat ord.","Sammensatte ord"),
   r(7,"Ret teksten: Vi havde **projekt uge** om klima.","Vi havde projektuge om klima.","Projektuge er ét sammensat ord.","Sammensatte ord"),
   r(7,"Ret teksten: Hun arbejder som **SoMe ansvarlig** i elevrådet.","Hun arbejder som SoMe-ansvarlig i elevrådet.","Forkortelser og ord kan forbindes med bindestreg.","Forkortelser"),
   r(7,"Ret teksten: Vi mødes **i mellem** de to lektioner.","Vi mødes imellem de to lektioner.","Imellem skrives i ét ord i denne betydning.","Korrektur i egne tekster"),
   r(7,"Ret teksten: Klassen lavede en **podcast serie** om ungdomsliv.","Klassen lavede en podcastserie om ungdomsliv.","Podcastserie er et sammensat ord.","Sammensatte ord")
  ],
  rigtigForm:[
   form(7,"Skriv ordet i den rigtige form: Flere elever (vælge) ___ cyklen i går.","valgte","I går kræver datidsformen valgte.","Udsagnsords tider"),
   form(7,"Skriv ordet i den rigtige form: De (interessant) ___ pointer blev diskuteret.","interessante","Tillægsordet bøjes efter navneordet i flertal.","Tillægsords bøjning"),
   form(7,"Skriv ordet i den rigtige form: Hun har (skrive) ___ tre sider.","skrevet","Efter har bruges kort tillægsform: skrevet.","Udsagnsords tider"),
   form(7,"Skriv ordet i den rigtige form: Jeg (vurdere) ___ forslaget som realistisk.","vurderer","Nutid af vurdere er vurderer.","Nutids-r"),
   form(7,"Skriv ordet i den rigtige form: Der var flere gode (løsning) ___ på problemet.","løsninger","Navneordet skal stå i flertal.","Navneords bøjning")
  ],
  ordklasse:[
   wordClass(7,"Hvilken ordklasse er “gennem” i sætningen “Vi gik gennem tunnelen”?",commonClasses,"Forholdsord (præposition)","Gennem viser forholdet mellem gik og tunnelen.","Forholdsord"),
   wordClass(7,"Hvilken ordklasse er “fordi” i sætningen “Vi gik ind, fordi det regnede”?",commonClasses,"Bindeord (konjunktion)","Fordi forbinder ledsætningen med resten af sætningen.","Bindeord"),
   wordClass(7,"Hvilken ordklasse er “deres” i sætningen “De fandt deres pladser”?",commonClasses,"Stedord (pronomen)","Deres er et stedord, der viser ejeforhold.","Stedord"),
   wordClass(7,"Hvilken ordklasse er “tydelig” i sætningen “Hun gav en tydelig forklaring”?",commonClasses,"Tillægsord (adjektiv)","Tydelig beskriver forklaringen.","Tillægsord"),
   wordClass(7,"Hvilken ordklasse er “senere” i sætningen “Vi taler om det senere”?",commonClasses,"Biord (adverbium)","Senere fortæller, hvornår vi taler om det.","Biord")
  ],
  datid:[
   t(7,"Skriv verbet i datid: Gruppen (diskuterer) ___ løsningen længe.","diskuterede","Datid af diskuterer er diskuterede.","Udsagnsords tider"),
   t(7,"Skriv verbet i datid: Hun (foreslår) ___ en anden vej.","foreslog","Foreslår bøjes uregelmæssigt til foreslog.","Udsagnsords tider"),
   t(7,"Skriv verbet i datid: De (beskriver) ___ forsøget i rapporten.","beskrev","Beskriver bøjes uregelmæssigt til beskrev.","Udsagnsords tider"),
   t(7,"Skriv verbet i datid: Vi (undersøger) ___ området før turen.","undersøgte","Datid af undersøger er undersøgte.","Udsagnsords tider"),
   t(7,"Skriv verbet i datid: Jeg (ved) ___ ikke, hvad svaret var.","vidste","Ved bøjes uregelmæssigt til vidste.","Udsagnsords tider")
  ],
  komma:[
   r(7,"Sæt de manglende kommaer: Vi planlagde turen købte billetter og pakkede taskerne.","Vi planlagde turen, købte billetter og pakkede taskerne.","Kommaet adskiller de sideordnede led i opremsningen.","Kommaøvelser"),
   r(7,"Sæt det manglende komma: Freja ville blive men hendes bus kom.","Freja ville blive, men hendes bus kom.","Men forbinder to helsætninger.","Komma mellem helsætninger"),
   r(7,"Sæt det manglende komma: Vi fandt lokalet og læreren åbnede døren.","Vi fandt lokalet, og læreren åbnede døren.","Der er grundled og udsagnsled på begge sider af og.","Komma mellem helsætninger"),
   r(7,"Sæt de manglende kommaer: De medbragte vand frugt brød og chokolade.","De medbragte vand, frugt, brød og chokolade.","Der sættes komma i en opremsning.","Kommaøvelser"),
   r(7,"Sæt det manglende komma: Jeg tog paraplyen for vejrudsigten lovede regn.","Jeg tog paraplyen, for vejrudsigten lovede regn.","For forbinder her to helsætninger.","Komma mellem helsætninger")
  ],
  retEnTekst:[
   r(7,"Ret fejlene. Kommateringen skal ikke ændres: Hun syntes, at filmen er god i går.","Hun syntes, at filmen var god i går.","Når resten står i datid, skal er ændres til var.","Synes eller syntes"),
   r(7,"Ret fejlene. Kommateringen skal ikke ændres: De har lagt på stranden hele dagen.","De har ligget på stranden hele dagen.","Man ligger selv; man lægger noget.","Ligge eller lægge"),
   r(7,"Ret fejlene. Kommateringen skal ikke ændres: Hver af eleverne tog vær sin mappe.","Hver af eleverne tog hver sin mappe.","Udtrykket hedder hver sin.","Hver eller vær"),
   r(7,"Ret fejlene. Kommateringen skal ikke ændres: Jeg ved ikke, vis cykel det er.","Jeg ved ikke, hvis cykel det er.","Hvis kan være ejestedord og betyder her 'hvem sin'.","Hvis eller vis"),
   r(7,"Ret fejlene. Kommateringen skal ikke ændres: Læreren bad os om at ligge telefonerne væk.","Læreren bad os om at lægge telefonerne væk.","Man lægger noget et sted.","Ligge eller lægge")
  ]
 },
 8:{
  diktat:[
   d(8,"Projektet krævede stor ________ mellem grupperne.","Projektet krævede stor koordinering mellem grupperne.","koordinering","Koordinering staves med dobbelt o efter k.","Fremmedord"),
   d(8,"Hun argumenterede ________ for sit synspunkt.","Hun argumenterede overbevisende for sit synspunkt.","overbevisende","Overbevisende ender på -ende.","Endelser"),
   d(8,"Resultatet var ________ anderledes end forventet.","Resultatet var væsentligt anderledes end forventet.","væsentligt","Væsentligt har stumt t i grundordet væsentlig + t.","Stumme bogstaver"),
   d(8,"Skolen offentliggjorde en ny ________.","Skolen offentliggjorde en ny trivselsundersøgelse.","trivselsundersøgelse","Trivselsundersøgelse er ét sammensat ord.","Sammensatte ord"),
   d(8,"De gennemførte forsøget ________.","De gennemførte forsøget systematisk.","systematisk","Systematisk er et fremmedord med y og endelsen -isk.","Fremmedord")
  ],
  etEllerFlereOrd:[
   r(8,"Ret teksten: Debatten handlede om **sociale medier brug** blandt unge.","Debatten handlede om brug af sociale medier blandt unge.","Her er 'brug af sociale medier' den naturlige og korrekte formulering.","Korrektur i egne tekster"),
   r(8,"Ret teksten: Klassen deltog i et **tre dages kursus**.","Klassen deltog i et tredageskursus.","Tredageskursus skrives som ét sammensat ord.","Sammensatte ord"),
   r(8,"Ret teksten: Vi lavede en **før og efter måling**.","Vi lavede en før-og-efter-måling.","Flerleddede sammensætninger kan forbindes med bindestreger.","Sammensatte ord"),
   r(8,"Ret teksten: Hun blev valgt som **elev råds formand**.","Hun blev valgt som elevrådsformand.","Elevrådsformand er ét sammensat ord.","Sammensatte ord"),
   r(8,"Ret teksten: Rapporten blev afleveret **d. 3. Marts**.","Rapporten blev afleveret d. 3. marts.","Månedsnavne skrives med lille begyndelsesbogstav.","Store og små bogstaver")
  ],
  rigtigForm:[
   form(8,"Skriv ordet i den rigtige form: Resultaterne blev (analysere) ___ bagefter.","analyseret","Efter blev skal kort tillægsform bruges i passivkonstruktionen.","Aktiv og passiv"),
   form(8,"Skriv ordet i den rigtige form: De to forslag er (realistisk) ___ end det første.","mere realistiske","Tillægsordet skal passe til flertal og sammenligning.","Tillægsords bøjning",["mere realistiske","realistiskere"]),
   form(8,"Skriv ordet i den rigtige form: Hun (argumentere) ___ præcist i sin tekst.","argumenterer","Nutid af argumentere ender på -rer.","Nutids-r"),
   form(8,"Skriv ordet i den rigtige form: Der blev fremlagt flere (hypotese) ___.","hypoteser","Hypotese bøjes til hypoteser i flertal.","Navneords bøjning"),
   form(8,"Skriv ordet i den rigtige form: Eleverne havde (forberede) ___ spørgsmål hjemmefra.","forberedt","Efter havde bruges kort tillægsform: forberedt.","Udsagnsords tider")
  ],
  ordklasse:[
   wordClass(8,"Hvilken ordklasse er “trods” i sætningen “Trods regnen fortsatte kampen”?",commonClasses,"Forholdsord (præposition)","Trods står foran navneordet regnen og viser et forhold.","Forholdsord"),
   wordClass(8,"Hvilken ordklasse er “derfor” i sætningen “Det regnede, og derfor blev vi inde”?",commonClasses,"Biord (adverbium)","Derfor fungerer som biord og viser en følge.","Biord"),
   wordClass(8,"Hvilken ordklasse er “mens” i sætningen “Jeg skrev, mens hun læste”?",commonClasses,"Bindeord (konjunktion)","Mens indleder en ledsætning og forbinder den med helsætningen.","Bindeord"),
   wordClass(8,"Hvilken ordklasse er “deres” i sætningen “Eleverne fremlagde deres resultater”?",commonClasses,"Stedord (pronomen)","Deres viser ejeforhold.","Stedord"),
   wordClass(8,"Hvilken ordklasse er “kritiske” i sætningen “De stillede kritiske spørgsmål”?",commonClasses,"Tillægsord (adjektiv)","Kritiske beskriver spørgsmålene.","Tillægsord")
  ],
  datid:[
   t(8,"Skriv verbet i datid: Forskerne (gennemfører) ___ forsøget tre gange.","gennemførte","Datid af gennemfører er gennemførte.","Udsagnsords tider"),
   t(8,"Skriv verbet i datid: Gruppen (fremlægger) ___ sine resultater.","fremlagde","Fremlægger bøjes uregelmæssigt til fremlagde.","Udsagnsords tider"),
   t(8,"Skriv verbet i datid: Hun (modtager) ___ en besked om ændringen.","modtog","Modtager bøjes uregelmæssigt til modtog.","Udsagnsords tider"),
   t(8,"Skriv verbet i datid: De (overvejer) ___ flere muligheder.","overvejede","Datid af overvejer er overvejede.","Udsagnsords tider"),
   t(8,"Skriv verbet i datid: Jeg (forstår) ___ først problemet senere.","forstod","Forstår bøjes uregelmæssigt til forstod.","Udsagnsords tider")
  ],
  komma:[
   r(8,"Sæt de manglende kommaer. Begge kommasystemer accepteres: Da mødet sluttede gik vi hjem og læreren blev tilbage.","Da mødet sluttede, gik vi hjem, og læreren blev tilbage.","Der kan sættes startkomma efter ledsætningen; kommaet før og er nødvendigt mellem to helsætninger.","Komma ved ledsætninger",["Da mødet sluttede, gik vi hjem, og læreren blev tilbage.","Da mødet sluttede gik vi hjem, og læreren blev tilbage."]),
   r(8,"Sæt de manglende kommaer: Vi målte temperaturen noterede resultaterne og sammenlignede dem bagefter.","Vi målte temperaturen, noterede resultaterne og sammenlignede dem bagefter.","Der sættes komma mellem sideordnede led i opremsningen.","Kommaøvelser"),
   r(8,"Sæt det manglende komma: Resultatet overraskede os men forklaringen var enkel.","Resultatet overraskede os, men forklaringen var enkel.","Men forbinder to helsætninger.","Komma mellem helsætninger"),
   r(8,"Sæt de manglende kommaer. Begge kommasystemer accepteres: Hvis du er færdig kan du aflevere og jeg retter senere.","Hvis du er færdig, kan du aflevere, og jeg retter senere.","Startkommaet er valgfrit; kommaet før og adskiller to helsætninger.","Komma ved ledsætninger",["Hvis du er færdig, kan du aflevere, og jeg retter senere.","Hvis du er færdig kan du aflevere, og jeg retter senere."]),
   r(8,"Sæt det manglende komma: Vi ændrede planen for tidsrammen var blevet kortere.","Vi ændrede planen, for tidsrammen var blevet kortere.","For forbinder to helsætninger.","Komma mellem helsætninger")
  ],
  retEnTekst:[
   r(8,"Ret fejlene. Kommateringen skal ikke ændres: Rapporten indeholder nogen tydelige fejl, men ikke ret mange.","Rapporten indeholder nogle tydelige fejl, men ikke ret mange.","Nogle bruges om et ubestemt antal, man ved findes.","Nogen eller nogle"),
   r(8,"Ret fejlene. Kommateringen skal ikke ændres: Hun lagde på sofaen, mens de andre arbejdede.","Hun lå på sofaen, mens de andre arbejdede.","Man ligger selv; datid er lå.","Ligge eller lægge"),
   r(8,"Ret fejlene. Kommateringen skal ikke ændres: Eleverne afleverede vær deres rapport.","Eleverne afleverede hver deres rapport.","Udtrykket hedder hver deres.","Hver eller vær"),
   r(8,"Ret fejlene. Kommateringen skal ikke ændres: Han forklarede, at forsøget havde en uforudset effekt på dens resultat.","Han forklarede, at forsøget havde en uforudset effekt på dets resultat.","Dets henviser til et intetkønsord: forsøget.","Reference og henvisninger"),
   r(8,"Ret fejlene. Kommateringen skal ikke ændres: Det er svært at vurderer, om tallene er korrekte.","Det er svært at vurdere, om tallene er korrekte.","Efter at står verbet i navnemåde uden nutids-r.","Nutids-r")
  ]
 },
 9:{
  diktat:[
   d(9,"Undersøgelsen gav et ________ billede af udviklingen.","Undersøgelsen gav et nuanceret billede af udviklingen.","nuanceret","Nuanceret staves med c og endelsen -eret.","Fremmedord"),
   d(9,"Resultaterne blev ________ i rapporten.","Resultaterne blev perspektiveret i rapporten.","perspektiveret","Perspektiveret ender på -eret.","Endelser"),
   d(9,"Debatten handlede om borgernes ________.","Debatten handlede om borgernes retssikkerhed.","retssikkerhed","Retssikkerhed er et sammensat ord med dobbelt s i sammensætningen.","Sammensatte ord"),
   d(9,"Argumentet virkede umiddelbart ________.","Argumentet virkede umiddelbart plausibelt.","plausibelt","Plausibelt er et fremmedord og ender her på -t.","Fremmedord"),
   d(9,"Gruppen arbejdede ________ med kilderne.","Gruppen arbejdede kildekritisk med kilderne.","kildekritisk","Kildekritisk er ét sammensat ord.","Sammensatte ord")
  ],
  etEllerFlereOrd:[
   r(9,"Ret teksten: Debatten blev sendt som **live stream** fra rådhuset.","Debatten blev sendt som livestream fra rådhuset.","Livestream kan skrives som ét ord på dansk.","Sammensatte ord"),
   r(9,"Ret teksten: Rapporten bygger på en **spørge skema undersøgelse**.","Rapporten bygger på en spørgeskemaundersøgelse.","Spørgeskemaundersøgelse er ét sammensat ord.","Sammensatte ord"),
   r(9,"Ret teksten: Gruppen foretog en **før og efter analyse**.","Gruppen foretog en før-og-efter-analyse.","En flerleddet sammensætning kan markeres med bindestreger.","Sammensatte ord"),
   r(9,"Ret teksten: Hun er **EU parlamentariker**.","Hun er EU-parlamentariker.","Forkortelsen EU forbindes med det følgende ord med bindestreg.","Forkortelser"),
   r(9,"Ret teksten: Undersøgelsen blev offentliggjort **Mandag d. 4. Maj**.","Undersøgelsen blev offentliggjort mandag d. 4. maj.","Ugedage og måneder skrives med lille begyndelsesbogstav.","Store og små bogstaver")
  ],
  rigtigForm:[
   form(9,"Skriv ordet i den rigtige form: Resultaterne kan (fortolke) ___ på flere måder.","fortolkes","Efter kan bruges passiv med -s: kan fortolkes.","Aktiv og passiv"),
   form(9,"Skriv ordet i den rigtige form: De fremlagde tre (alternativ) ___ løsninger.","alternative","Tillægsordet skal bøjes i flertal: alternative.","Tillægsords bøjning"),
   form(9,"Skriv ordet i den rigtige form: Hun (karakterisere) ___ udviklingen som markant.","karakteriserer","Nutidsformen ender på -rer.","Nutids-r"),
   form(9,"Skriv ordet i den rigtige form: Flere (analyse) ___ peger i samme retning.","analyser","Analyse får -r i flertal: analyser.","Navneords bøjning"),
   form(9,"Skriv ordet i den rigtige form: Forskerne havde (forudsige) ___ udviklingen.","forudsagt","Kort tillægsform af forudsige er forudsagt.","Udsagnsords tider")
  ],
  ordklasse:[
   wordClass(9,"Hvilken ordklasse er “imidlertid” i sætningen “Resultatet var imidlertid usikkert”?",commonClasses,"Biord (adverbium)","Imidlertid fungerer som sætningsadverbium.","Biord"),
   wordClass(9,"Hvilken ordklasse er “hvorimod” i sætningen “Den ene gruppe steg, hvorimod den anden faldt”?",commonClasses,"Bindeord (konjunktion)","Hvorimod forbinder to dele og markerer en modsætning.","Bindeord"),
   wordClass(9,"Hvilken ordklasse er “vedrørende” i sætningen “De fik information vedrørende prøven”?",commonClasses,"Forholdsord (præposition)","Vedrørende står foran navneordet prøven og fungerer som forholdsord.","Forholdsord"),
   wordClass(9,"Hvilken ordklasse er “dens” i sætningen “Rapporten og dens bilag blev offentliggjort”?",commonClasses,"Stedord (pronomen)","Dens er et ejestedord, som henviser til rapporten.","Stedord"),
   wordClass(9,"Hvilken ordklasse er “markant” i sætningen “Der var en markant forskel”?",commonClasses,"Tillægsord (adjektiv)","Markant beskriver forskellen.","Tillægsord")
  ],
  datid:[
   t(9,"Skriv verbet i datid: Analysen (påviser) ___ en tydelig forskel.","påviste","Datid af påviser er påviste.","Udsagnsords tider"),
   t(9,"Skriv verbet i datid: Rapporten (foreligger) ___ først i juni.","forelå","Foreligger bøjes uregelmæssigt til forelå.","Udsagnsords tider"),
   t(9,"Skriv verbet i datid: Gruppen (inddrager) ___ flere perspektiver.","inddrog","Inddrager bøjes uregelmæssigt til inddrog.","Udsagnsords tider"),
   t(9,"Skriv verbet i datid: Hun (fastholder) ___ sit synspunkt.","fastholdt","Fastholder bøjes til fastholdt.","Udsagnsords tider"),
   t(9,"Skriv verbet i datid: De (overdriver) ___ problemets omfang.","overdrev","Overdriver bøjes uregelmæssigt til overdrev.","Udsagnsords tider")
  ],
  komma:[
   r(9,"Sæt de manglende kommaer. Begge kommasystemer accepteres: Selvom dataene var usikre valgte gruppen at konkludere og læreren bad dem begrunde valget.","Selvom dataene var usikre, valgte gruppen at konkludere, og læreren bad dem begrunde valget.","Startkommaet er valgfrit; kommaet mellem helsætningerne er nødvendigt.","Komma ved ledsætninger",["Selvom dataene var usikre, valgte gruppen at konkludere, og læreren bad dem begrunde valget.","Selvom dataene var usikre valgte gruppen at konkludere, og læreren bad dem begrunde valget."]),
   r(9,"Sæt de manglende kommaer: Artiklen bygger på interviews observationer statistiske data og tidligere forskning.","Artiklen bygger på interviews, observationer, statistiske data og tidligere forskning.","Der sættes komma mellem led i en opremsning.","Kommaøvelser"),
   r(9,"Sæt det manglende komma: Argumentet lyder overbevisende men dokumentationen er svag.","Argumentet lyder overbevisende, men dokumentationen er svag.","Men forbinder to helsætninger.","Komma mellem helsætninger"),
   r(9,"Sæt de manglende kommaer. Begge kommasystemer accepteres: Når kilden er anonym bør du være ekstra kritisk og du bør undersøge hvem der står bag oplysningerne.","Når kilden er anonym, bør du være ekstra kritisk, og du bør undersøge, hvem der står bag oplysningerne.","Der er flere sætningsgrænser; startkomma før ledsætninger kan vælges til eller fra.","Komma ved ledsætninger",["Når kilden er anonym, bør du være ekstra kritisk, og du bør undersøge, hvem der står bag oplysningerne.","Når kilden er anonym bør du være ekstra kritisk, og du bør undersøge hvem der står bag oplysningerne."]),
   r(9,"Sæt det manglende komma: Vi ændrede konklusionen for de nye data pegede i en anden retning.","Vi ændrede konklusionen, for de nye data pegede i en anden retning.","For forbinder her to helsætninger.","Komma mellem helsætninger")
  ],
  retEnTekst:[
   r(9,"Ret fejlene. Kommateringen skal ikke ændres: Undersøgelsen viser, at nogen unge ændrer adfærd, når de bliver observeret.","Undersøgelsen viser, at nogle unge ændrer adfærd, når de bliver observeret.","Nogle bruges om et ubestemt antal, som faktisk findes.","Nogen eller nogle"),
   r(9,"Ret fejlene. Kommateringen skal ikke ændres: Kritikeren lagde vægt på, at argumenterne lå tæt op af hinanden.","Kritikeren lagde vægt på, at argumenterne lå tæt op ad hinanden.","Udtrykket hedder tæt op ad.","Ad eller af"),
   r(9,"Ret fejlene. Kommateringen skal ikke ændres: Forfatteren mener, at læseren selv må vurderer kildens troværdighed.","Forfatteren mener, at læseren selv må vurdere kildens troværdighed.","Efter må står verbet i navnemåde uden -r.","Nutids-r"),
   r(9,"Ret fejlene. Kommateringen skal ikke ændres: Organisationen ændrede deres strategi, fordi dens medlemmer stemte for.","Organisationen ændrede sin strategi, fordi dens medlemmer stemte for.","Sin henviser tilbage til sætningens grundled: organisationen.","Sin, sit, sine eller hans/hendes"),
   r(9,"Ret fejlene. Kommateringen skal ikke ændres: Tallene ligger til grund for analysen, men forskerne har lagt mærke til flere usikkerheder.","Tallene ligger til grund for analysen, men forskerne har lagt mærke til flere usikkerheder.","Sætningen er allerede korrekt: ligger beskriver en tilstand, og har lagt mærke til er et fast udtryk.","Ligge eller lægge")
  ]
 }
};
