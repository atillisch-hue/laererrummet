import type {TrainingQuestion} from "./freeTrainingQuestions";

type LevelBank=Record<string,TrainingQuestion[]>;
const set=(rows:Array<[string,string[],string,string]>):TrainingQuestion[]=>rows.map(([q,options,answer,why])=>({q,options,answer,why}));

export const mathExtraQuestions:Record<string,Record<string,LevelBank>>={
 "tal-regning":{
  "Negative tal":{
   mellem:set([
    ["Hvilket tal er mindst?",["-2","0","3","-1"],"-2","På tallinjen ligger -2 længst til venstre."],
    ["Hvad er 3 + (-5)?",["-2","2","8","-8"],"-2","Fra 3 går du fem trin mod venstre."],
    ["Temperaturen går fra 2 °C til -3 °C. Hvor meget falder den?",["5 °C","1 °C","-1 °C","6 °C"],"5 °C","Forskellen fra 2 til -3 er 5 grader."],
    ["Hvad er -4 + 7?",["3","-3","11","-11"],"3","Syv trin til højre fra -4 ender på 3."],
    ["Hvilket udsagn er rigtigt?",["-1 > -5","-5 > -1","-3 > 2","0 < -2"],"-1 > -5","-1 ligger til højre for -5 på tallinjen."]
   ]),
   udskoling:set([
    ["Hvad er -6 - 4?",["-10","-2","10","2"],"-10","Når du trækker 4 fra -6, går du fire trin længere mod venstre."],
    ["Hvad er (-3) · 5?",["-15","15","-8","8"],"-15","Et negativt tal gange et positivt tal giver et negativt resultat."],
    ["Hvad er (-4) · (-2)?",["8","-8","6","-6"],"8","Negativ gange negativ giver positiv."],
    ["Hvad er 18 ÷ (-3)?",["-6","6","-15","15"],"-6","Positiv divideret med negativ giver negativ."],
    ["En konto står i -250 kr. Der sættes 400 kr. ind. Hvad er saldoen?",["150 kr.","-150 kr.","650 kr.","-650 kr."],"150 kr.","-250 + 400 = 150."]
   ])
  },
  "Regnearternes rækkefølge":{
   mellem:set([
    ["Hvad er 4 + 3 · 2?",["10","14","12","7"],"10","Multiplikation regnes før addition: 3·2=6, så 4+6=10."],
    ["Hvad er (4 + 3) · 2?",["14","10","9","12"],"14","Parentesen regnes først: 7·2=14."],
    ["Hvad er 20 - 12 ÷ 3?",["16","4","8","6"],"16","Division først: 12÷3=4, derefter 20-4=16."],
    ["Hvad er 6 · 2 + 5?",["17","42","22","13"],"17","6·2=12 og derefter +5 = 17."],
    ["Hvad er 18 ÷ (3 + 3)?",["3","9","12","6"],"3","Parentesen er 6, og 18÷6=3."]
   ]),
   udskoling:set([
    ["Hvad er 2 + 3² · 2?",["20","25","38","14"],"20","Potens først: 3²=9, så 9·2=18 og 2+18=20."],
    ["Hvad er (2 + 3)²?",["25","11","13","10"],"25","Parentesen giver 5, og 5²=25."],
    ["Hvad er 24 ÷ 3 · 2?",["16","4","8","18"],"16","Division og multiplikation har samme prioritet og regnes fra venstre: 24÷3=8, 8·2=16."],
    ["Hvad er 30 - 2 · (4 + 3)?",["16","196","28","12"],"16","Parentes 7, multiplikation 14, derefter 30-14=16."],
    ["Hvad er 5 + 18 ÷ 3²?",["7","11","23","9"],"7","3²=9, 18÷9=2, og 5+2=7."]
   ])
  },
  "Potenser og rødder":{
   udskoling:set([
    ["Hvad er 2⁴?",["16","8","6","24"],"16","2⁴ betyder 2·2·2·2 = 16."],
    ["Hvad er √81?",["9","8","40,5","18"],"9","9·9 = 81."],
    ["Hvilket udtryk er lig med 1000?",["10³","100³","10²","100·100"],"10³","10·10·10 = 1000."],
    ["Hvad er 5² - 3²?",["16","4","22","34"],"16","25-9=16."],
    ["Hvad er √144?",["12","14","72","24"],"12","12²=144."],
    ["Hvad er 3³?",["27","9","6","81"],"27","3·3·3=27."],
    ["Hvad betyder 7²?",["7·7","7·2","2·2·2·2·2·2·2","7+7"],"7·7","Eksponenten 2 betyder, at 7 ganges med sig selv to gange."],
    ["Hvilket tal har kvadratroden 6?",["36","12","18","3"],"36","√36=6."],
    ["Hvad er 10⁰?",["1","0","10","100"],"1","Ethvert ikke-nul tal opløftet i 0. potens er 1."],
    ["Hvad er 4² + √16?",["20","8","18","32"],"20","4²=16 og √16=4, altså 20."]
   ])
  }
 },
 "broeker-procent":{
  "Proportionalitet":{
   mellem:set([
    ["3 æbler koster 12 kr. Hvad koster 1 æble?",["4 kr.","3 kr.","9 kr.","36 kr."],"4 kr.","12÷3=4 kr. pr. æble."],
    ["2 liter saft kræver 6 skeer pulver. Hvor mange skeer til 4 liter?",["12","8","10","3"],"12","Mængden fordobles, så pulveret fordobles også."],
    ["5 billetter koster 150 kr. Hvad koster 10 ved samme pris pr. billet?",["300 kr.","155 kr.","250 kr.","75 kr."],"300 kr.","Antallet fordobles, så prisen fordobles."],
    ["Hvilket par viser samme forhold?",["2:3 og 4:6","2:3 og 3:4","1:2 og 2:3","3:5 og 6:5"],"2:3 og 4:6","Begge led er ganget med 2."],
    ["En opskrift til 4 personer bruger 300 g ris. Hvor meget til 6 personer?",["450 g","500 g","600 g","350 g"],"450 g","300÷4=75 g pr. person; 75·6=450 g."]
   ]),
   udskoling:set([
    ["y er proportional med x, og y=12 når x=3. Hvad er proportionalitetsfaktoren?",["4","9","15","36"],"4","k=y/x=12/3=4."],
    ["Hvis y=2,5x, hvad er y når x=8?",["20","10,5","5,5","32"],"20","2,5·8=20."],
    ["Hvilket udtryk beskriver en proportional sammenhæng?",["y=4x","y=4x+2","y=x²","y=4/x"],"y=4x","En proportional sammenhæng har formen y=kx."],
    ["En bil kører 180 km på 3 timer med konstant fart. Hvor langt på 5 timer?",["300 km","240 km","360 km","108 km"],"300 km","Farten er 60 km/t, så 5·60=300 km."],
    ["x fordobles i y=7x. Hvad sker der med y?",["y fordobles","y stiger med 7","y halveres","y ændres ikke"],"y fordobles","I en proportional sammenhæng ændres y med samme faktor som x."]
   ]),
   anvendt:set([
    ["8 m stof koster 520 kr. Hvad koster 3,5 m ved samme meterpris?",["227,50 kr.","182 kr.","455 kr.","1485 kr."],"227,50 kr.","520÷8=65 kr/m; 65·3,5=227,50 kr."],
    ["En opskrift bruger 2,4 kg mel til 16 brød. Hvor meget til 30 brød?",["4,5 kg","3,6 kg","5 kg","45 kg"],"4,5 kg","2,4/16=0,15 kg pr. brød; ·30=4,5 kg."],
    ["En printer laver 45 sider på 3 minutter. Hvor mange på 8 minutter ved samme fart?",["120","90","135","360"],"120","15 sider/min · 8 = 120."],
    ["12 fliser dækker 3 m². Hvor mange fliser til 7,5 m²?",["30","24","36","90"],"30","4 fliser pr. m² · 7,5=30."],
    ["En valuta omregnes med 1 enhed = 7,5 kr. Hvad koster 24 enheder?",["180 kr.","31,5 kr.","160 kr.","7,5 kr."],"180 kr.","24·7,5=180."]
   ])
  }
 },
 "geometri":{
  "Omkreds":{
   grund:set([
    ["Et rektangel er 5 cm langt og 3 cm bredt. Omkredsen er…",["16 cm","15 cm","8 cm","30 cm"],"16 cm","5+3+5+3=16 cm."],
    ["Et kvadrat har sidelængde 6 cm. Omkredsen er…",["24 cm","36 cm","12 cm","18 cm"],"24 cm","4·6=24 cm."],
    ["En trekant har siderne 4, 5 og 6 cm. Omkredsen er…",["15 cm","20 cm","10 cm","120 cm"],"15 cm","4+5+6=15 cm."],
    ["Hvad måler omkreds?",["Længden hele vejen rundt","Pladsen inde i figuren","Højden","Antal hjørner"],"Længden hele vejen rundt","Omkredsen er figurens kantlængde."],
    ["En femkant har fem sider på 2 cm hver. Omkreds?",["10 cm","7 cm","4 cm","20 cm"],"10 cm","5·2=10 cm."]
   ]),
   mellem:set([
    ["Et rektangel har omkreds 30 cm og længde 9 cm. Hvad er bredden?",["6 cm","12 cm","21 cm","3 cm"],"6 cm","2·9 + 2·b =30, så 2b=12 og b=6."],
    ["En regulær sekskant har sidelængde 4,5 cm. Omkreds?",["27 cm","22,5 cm","9 cm","20 cm"],"27 cm","6·4,5=27 cm."],
    ["En cirkel har diameter 10 cm. Cirklens omkreds er cirka…",["31,4 cm","10 cm","78,5 cm","20 cm"],"31,4 cm","O≈π·d=3,14·10."],
    ["En cirkel har radius 4 cm. Omkreds cirka?",["25,1 cm","12,6 cm","50,2 cm","16 cm"],"25,1 cm","O=2πr≈2·3,14·4=25,12."],
    ["Et hegn skal rundt om en have på 12 m × 7 m, men en port på 2 m skal stå åben. Hvor meget hegn?",["36 m","38 m","82 m","17 m"],"36 m","Omkredsen er 38 m, og 2 m port trækkes fra."]
   ])
  },
  "Vinkler":{
   mellem:set([
    ["Hvor mange grader er en ret vinkel?",["90°","45°","180°","360°"],"90°","En ret vinkel er 90°."],
    ["En vinkel på 35° er…",["spids","ret","stump","refleks"],"spids","Spidse vinkler er mindre end 90°."],
    ["En vinkel på 120° er…",["stump","spids","ret","fuld"],"stump","Stumpe vinkler ligger mellem 90° og 180°."],
    ["Vinkelsummen i en trekant er…",["180°","360°","90°","270°"],"180°","Alle trekanter har vinkelsum 180°."],
    ["To vinkler i en trekant er 50° og 60°. Den sidste er…",["70°","110°","80°","30°"],"70°","180-50-60=70°."]
   ]),
   udskoling:set([
    ["To nabovinkler på en ret linje er 132° og…",["48°","58°","228°","42°"],"48°","De summerer til 180°."],
    ["Vinkelsummen i en firkant er…",["360°","180°","540°","720°"],"360°","En firkant kan opdeles i to trekanter."],
    ["En ligebenet trekant har topvinkel 40°. Hver grundvinkel er…",["70°","40°","140°","20°"],"70°","De resterende 140° deles ligeligt."],
    ["En regulær sekskants indvendige vinkelsum er…",["720°","540°","360°","1080°"],"720°","(6-2)·180=720°."],
    ["To parallelle linjer skæres af en transversal. En samsvarende vinkel er 65°. Den anden samsvarende vinkel er…",["65°","115°","25°","180°"],"65°","Samsvarende vinkler ved parallelle linjer er lige store."]
   ])
  },
  "Koordinatsystem":{
   mellem:set([
    ["Punktet (3, -2) ligger…",["3 til højre og 2 ned","3 op og 2 venstre","2 til højre og 3 ned","3 venstre og 2 op"],"3 til højre og 2 ned","Første koordinat er x, andet er y."],
    ["Hvilket punkt ligger på y-aksen?",["(0,4)","(4,0)","(2,2)","(-3,5)"],"(0,4)","På y-aksen er x=0."],
    ["Hvilket punkt ligger på x-aksen?",["(-5,0)","(0,-5)","(5,2)","(1,1)"],"(-5,0)","På x-aksen er y=0."],
    ["Flyt punktet (2,3) fire enheder mod højre. Nyt punkt?",["(6,3)","(2,7)","(-2,3)","(6,7)"],"(6,3)","x øges med 4, y er uændret."],
    ["Hvad er afstanden vandret mellem (1,4) og (7,4)?",["6","8","3","12"],"6","x-værdierne adskiller sig med 6."]
   ]),
   udskoling:set([
    ["Midtpunktet mellem (2,2) og (6,8) er…",["(4,5)","(8,10)","(3,4)","(4,3)"],"(4,5)","Tag gennemsnittet af x-koordinater og y-koordinater."],
    ["En linje går gennem (0,2) og (1,5). Hældningen er…",["3","2","5","-3"],"3","y stiger 3, når x stiger 1."],
    ["Hvilket punkt opfylder y=2x+1?",["(3,7)","(3,6)","(2,2)","(0,0)"],"(3,7)","2·3+1=7."],
    ["Punktet (-4,3) spejles i y-aksen. Nyt punkt?",["(4,3)","(-4,-3)","(3,-4)","(4,-3)"],"(4,3)","Ved spejling i y-aksen skifter x fortegn."],
    ["Punktet (5,-2) spejles i x-aksen. Nyt punkt?",["(5,2)","(-5,-2)","(-5,2)","(2,5)"],"(5,2)","Ved spejling i x-aksen skifter y fortegn."]
   ])
  },
  "Målestoksforhold":{
   mellem:set([
    ["På et kort i 1:1000 er 1 cm i virkeligheden…",["10 m","1000 m","1 m","100 m"],"10 m","1000 cm = 10 m."],
    ["En tegning er i 1:100. En væg på 4 m tegnes som…",["4 cm","40 cm","0,4 cm","400 cm"],"4 cm","4 m=400 cm; 400/100=4 cm."],
    ["På et kort er 3 cm lig 15 km. Hvor mange km er 1 cm?",["5 km","12 km","45 km","3 km"],"5 km","15÷3=5 km."],
    ["En model er i 1:20. En del måler 6 cm på modellen. Virkelig længde?",["120 cm","26 cm","0,3 cm","12 cm"],"120 cm","6·20=120 cm."],
    ["Et kort er i 1:50 000. 2 cm svarer til…",["1 km","100 km","10 km","500 m"],"1 km","2·50 000 cm=100 000 cm=1 km."]
   ]),
   udskoling:set([
    ["Et kort i 1:25 000 viser 7,2 cm. Virkelig afstand?",["1,8 km","18 km","0,18 km","7,2 km"],"1,8 km","7,2·25 000=180 000 cm=1,8 km."],
    ["En plantegning i 1:50 viser et rum på 8,4 cm × 6 cm. Virkelige mål?",["4,2 m × 3 m","42 m × 30 m","1,68 m × 1,2 m","8,4 m × 6 m"],"4,2 m × 3 m","Gang cm-målene med 50 og omregn til meter."],
    ["En modelbil er 18 cm lang i skala 1:24. Den rigtige bil er…",["4,32 m","43,2 m","0,75 m","2,4 m"],"4,32 m","18·24=432 cm=4,32 m."],
    ["En virkelig afstand er 6 km. På et kort i 1:100 000 er den…",["6 cm","60 cm","0,6 cm","600 cm"],"6 cm","1 cm svarer til 1 km."],
    ["Hvilken skala gør en 12 m væg til 6 cm på tegningen?",["1:200","1:20","1:2","1:120"],"1:200","12 m=1200 cm; 1200/6=200."]
   ]),
   anvendt:set([
    ["En haveplan er 1:200. Et bed er 3,5 cm langt på planen. Virkelig længde?",["7 m","70 m","1,75 m","700 m"],"7 m","3,5·200=700 cm=7 m."],
    ["En rute er 4,8 cm på et 1:75 000-kort. Afstand?",["3,6 km","36 km","0,36 km","7,5 km"],"3,6 km","4,8·75 000=360 000 cm=3,6 km."],
    ["En arkitekt vil tegne 15 m på 30 cm. Skala?",["1:50","1:5","1:500","1:30"],"1:50","15 m=1500 cm; 1500/30=50."],
    ["En modelbro i 1:125 er 64 cm. Rigtig længde?",["80 m","8 m","800 m","5,12 m"],"80 m","64·125=8000 cm=80 m."],
    ["Et klasselokale på 9 m × 7 m skal på A4. Hvilken skala gør længden 18 cm?",["1:50","1:20","1:5","1:500"],"1:50","9 m=900 cm; 900/18=50."]
   ])
  }
 },
 "algebra":{
  "Formler":{
   mellem:set([
    ["I formlen A=l·b, hvad findes A?",["Areal","Omkreds","Længde","Rumfang"],"Areal","Rektanglets areal er længde gange bredde."],
    ["A=l·b. Hvis A=24 og l=6, er b…",["4","18","30","144"],"4","b=A/l=24/6=4."],
    ["O=2l+2b. Hvis l=5 og b=3, er O…",["16","15","8","30"],"16","2·5+2·3=10+6=16."],
    ["d=v·t. Hvis v=60 km/t og t=2 t, er d…",["120 km","62 km","30 km","3600 km"],"120 km","60·2=120 km."],
    ["Hvilken formel passer til gennemsnitsfart?",["v=d/t","v=d·t","v=t/d","v=d+t"],"v=d/t","Fart er distance divideret med tid."]
   ]),
   udskoling:set([
    ["I y=ax+b er a…",["hældningskoefficient","skæring med y-aksen","x-værdi","areal"],"hældningskoefficient","a fortæller hvor meget y ændres, når x øges med 1."],
    ["C=2πr. Isolér r.",["r=C/(2π)","r=2π/C","r=C·2π","r=C-2π"],"r=C/(2π)","Divider begge sider med 2π."],
    ["A=πr². Hvad er r, hvis A=49π?",["7","49","14","3,5"],"7","r²=49, så r=7."],
    ["s=v₀t+½at². Hvis v₀=0, a=2 og t=3, er s…",["9","18","6","12"],"9","½·2·3²=9."],
    ["p=m/V. Hvad er m?",["m=p·V","m=p/V","m=V/p","m=p+V"],"m=p·V","Gang begge sider med V."]
   ])
  }
 },
 "data":{
  "Gennemsnit, median og typetal":{
   mellem:set([
    ["Gennemsnittet af 4, 6 og 8 er…",["6","18","5","7"],"6","(4+6+8)/3=6."],
    ["Medianen i 2, 4, 7, 9, 12 er…",["7","4","9","6,8"],"7","Medianen er det midterste tal."],
    ["Typetallet i 1, 2, 2, 3, 4 er…",["2","1","3","2,4"],"2","2 forekommer flest gange."],
    ["Medianen i 3, 5, 8, 10 er…",["6,5","5","8","7"],"6,5","Ved et lige antal tager man gennemsnittet af de to midterste: (5+8)/2."],
    ["Gennemsnittet af 10, 10, 20, 20 er…",["15","10","20","60"],"15","60/4=15."]
   ]),
   udskoling:set([
    ["Tallene 2, 3, 4, 5 har gennemsnit 3,5. Tilføjes 16. Nyt gennemsnit?",["6","5","7","19,5"],"6","Summen var 14; +16=30; 30/5=6."],
    ["En dataserie har median 12. Hvad fortæller det?",["Mindst halvdelen ligger på eller under 12 og mindst halvdelen på eller over","Gennemsnittet er altid 12","12 forekommer flest gange","Alle tal er 12"],"Mindst halvdelen ligger på eller under 12 og mindst halvdelen på eller over","Medianen deler de sorterede data i to halvdele."],
    ["Hvilket mål påvirkes mest af en ekstrem outlier?",["Gennemsnittet","Medianen","Typetallet","Alle lige meget"],"Gennemsnittet","Et meget stort eller lille tal trækker gennemsnittet kraftigt."],
    ["Data: 4, 4, 5, 6, 100. Hvilket mål beskriver typisk niveau bedst?",["Medianen 5","Gennemsnittet 23,8","Maksimum 100","Variationsbredden 96"],"Medianen 5","Outlieren 100 gør gennemsnittet misvisende."],
    ["Fem tal har gennemsnit 18. Hvad er summen?",["90","23","13","3,6"],"90","Sum = gennemsnit · antal = 18·5."]
   ])
  }
 },
 "anvendt":{
  "Overslag og rimelighed":{
   grund:set([
    ["Hvilket er det bedste overslag for 198 + 304?",["500","400","600","200"],"500","198≈200 og 304≈300."],
    ["49 · 21 er cirka…",["1000","100","10 000","500"],"1000","50·20=1000."],
    ["En vare koster 97 kr. Du køber 3. Et godt overslag er…",["300 kr.","100 kr.","200 kr.","1000 kr."],"300 kr.","97≈100, og 3·100=300."],
    ["1002 ÷ 9 er cirka…",["110","10","900","1000"],"110","990÷9=110 er et nært og let overslag."],
    ["Hvilket svar på 51+48 kan straks afvises?",["9","99","100","101"],"9","To tal omkring 50 skal give omkring 100, ikke 9."]
   ]),
   mellem:set([
    ["19,8 · 4,1 er cirka…",["80","8","800","24"],"80","20·4=80."],
    ["598 ÷ 29 er cirka…",["20","200","2","60"],"20","600÷30=20."],
    ["En elev får 7,2 km som længden af en blyant. Hvad er vigtigst at opdage?",["Enheden/resultatet er urimeligt","Man skal altid runde op","7,2 er for få decimaler","Kilometer er en arealenhed"],"Enheden/resultatet er urimeligt","Rimelighedstjek handler om, om svaret passer til virkeligheden."],
    ["Hvilket overslag passer bedst til 32 % af 490?",["ca. 150","ca. 15","ca. 300","ca. 480"],"ca. 150","30 % af 500 er 150."],
    ["Et areal beregnes til 48 000 cm². Hvor mange m² er det?",["4,8 m²","48 m²","480 m²","0,48 m²"],"4,8 m²","1 m²=10 000 cm², så 48 000/10 000=4,8."]
   ]),
   anvendt:set([
    ["Et budget siger 38 personer · 147 kr. Hvilket overslag er bedst før præcis beregning?",["ca. 40·150 = 6000 kr.","ca. 40·15 = 600 kr.","ca. 4·150 = 600 kr.","ca. 400·150 = 60 000 kr."],"ca. 40·150 = 6000 kr.","Afrund begge tal til lette, nærliggende værdier."],
    ["En bil bruger 16 kWh/100 km. En tur er 350 km. Et rimeligt energiforbrug er cirka…",["56 kWh","5,6 kWh","560 kWh","21 kWh"],"56 kWh","3,5·16=56."],
    ["En rapport siger, at 12 ud af 25 svarer ja, dvs. 84 %. Hvad bør du gøre?",["Rimelighedstjek procenten","Godtage procenten","Runde 84 til 100","Ændre 25 til 12"],"Rimelighedstjek procenten","12/25 er 48 %, så 84 % passer ikke."],
    ["Et lokale er 8 m × 6 m. Der bestilles 480 m² gulv. Hvad viser et overslag?",["Bestillingen er cirka ti gange for stor","Det passer præcist","Der mangler gulv","Man kan ikke vurdere det"],"Bestillingen er cirka ti gange for stor","Arealet er 48 m²."],
    ["En regning på 2.398 kr. deles mellem 8. Et hurtigt overslag pr. person er…",["ca. 300 kr.","ca. 30 kr.","ca. 2400 kr.","ca. 800 kr."],"ca. 300 kr.","2400÷8=300."]
   ])
  }
 },
 "taenkning":{
  "Forklar din metode":{
   grund:set([
    ["En elev regner 48+27 som 48+20+7. Hvilken strategi bruges?",["Opdeling","Gæt","Division","Afrunding til nul"],"Opdeling","27 deles i 20 og 7."],
    ["Hvorfor kan 9·6 regnes som 10·6-6?",["Fordi 9 er én mindre end 10","Fordi 9=10+6","Fordi minus altid er lettere","Fordi 6 skal fordobles"],"Fordi 9 er én mindre end 10","Man bruger et kendt ti-tal og korrigerer."],
    ["Hvad er en god forklaring til 63-29 = 34?",["Jeg trak 30 fra og lagde 1 til igen","Jeg skrev bare 34","29 er et ulige tal","63 er større end 29"],"Jeg trak 30 fra og lagde 1 til igen","Forklaringen viser en gyldig regnestrategi."],
    ["En elev siger 7·8=56. Hvad gør forklaringen stærkere?",["At vise fx 5·8+2·8=40+16","At skrive 56 igen","At skrive hurtigt","At bruge flere farver"],"At vise fx 5·8+2·8=40+16","Metoden gør sammenhængen synlig."],
    ["Hvilket svar forklarer bedst 120÷4=30?",["120 kan deles i fire lige grupper på 30","Fordi 30 er mindre end 120","Fordi divisionstegnet betyder 30","Det ved jeg bare"],"120 kan deles i fire lige grupper på 30","Forklaringen knytter division til lige store grupper."]
   ]),
   mellem:set([
    ["Hvorfor er 25 % det samme som 1/4?",["25/100 kan forkortes til 1/4","Fordi 25+4=29","Fordi procent altid er brøker med 4","Fordi 100/25=5"],"25/100 kan forkortes til 1/4","Procent betyder pr. hundrede."],
    ["En elev regner 15 % af 240 som 10 % + 5 %. Hvad er fordelen?",["Kendte procentdele kan kombineres","Man undgår helt at regne","Det virker kun for 240","Svaret bliver altid 15"],"Kendte procentdele kan kombineres","24 + 12 = 36."],
    ["Hvorfor er 3/5 = 0,6?",["3÷5=0,6","3+5=8","5-3=2","0,6·3=5"],"3÷5=0,6","En brøk kan læses som division."],
    ["Hvad gør en matematisk metodeforklaring god?",["Den viser både trin og hvorfor de giver mening","Den er længst muligt","Den bruger kun symboler","Den skjuler mellemregninger"],"Den viser både trin og hvorfor de giver mening","Metoden skal kunne følges og begrundes."],
    ["En elev løser x+7=19 ved at trække 7 fra begge sider. Hvorfor?",["Lighed bevares, når samme handling udføres på begge sider","7 skal altid fjernes","x må ikke stå med tal","19 er ulige"],"Lighed bevares, når samme handling udføres på begge sider","Ligningen skal forblive i balance."]
   ]),
   udskoling:set([
    ["Hvorfor kan man gange en ligning med samme ikke-nul tal på begge sider?",["Det bevarer ligheden","Det ændrer altid løsningen","Det gør x positiv","Det fjerner alle brøker automatisk"],"Det bevarer ligheden","Begge sider ændres med samme faktor."],
    ["Hvad er bedst, når du forklarer en graf?",["Knyt hældning og skæring til den konkrete sammenhæng","Læs kun grafens titel","Skriv alle koordinater","Beskriv farven"],"Knyt hældning og skæring til den konkrete sammenhæng","En matematisk forklaring fortolker parametrene."],
    ["En metode giver x=4. Hvilket tjek er stærkest?",["Indsæt x=4 i den oprindelige ligning","Regn samme metode igen uden ændringer","Rund x op","Se om 4 ser pænt ud"],"Indsæt x=4 i den oprindelige ligning","Indsættelse kontrollerer løsningen direkte."],
    ["Hvorfor bør en statistisk konklusion nævne datagrundlaget?",["Fordi konklusionens styrke afhænger af data og udvalg","Fordi alle tabeller kræver tekst","For at gøre svaret længere","Fordi gennemsnit ellers ikke findes"],"Fordi konklusionens styrke afhænger af data og udvalg","Dataenes kvalitet begrænser, hvad man kan konkludere."],
    ["Hvilken forklaring viser bedst proportionalitet?",["Forholdet y/x er konstant","y bliver altid større","Grafen har tal","x og y er forskellige bogstaver"],"Forholdet y/x er konstant","Konstant y/x er kendetegnet ved proportionalitet."]
   ])
  },
  "Strategivalg":{
   grund:set([
    ["Du skal regne 199+36 hurtigt. Hvilken strategi er smart?",["200+36-1","199+30+60","199·36","199÷36"],"200+36-1","199 ligger tæt på 200."],
    ["Du skal finde halvdelen af 86. Hvilken idé er enklest?",["Del 80 og 6 i halve","Gang med 2","Læg 86 til 86","Træk 2 fra"],"Del 80 og 6 i halve","40+3=43."],
    ["Du skal regne 25·16. Hvilken strategi er nyttig?",["100·4","25+16","16-25","25÷16"],"100·4","Fire 25'ere er 100, og 16 består af fire grupper á 4."],
    ["Du skal sammenligne 398 og 403. Hvad er hurtigst?",["Se deres placering omkring 400","Gange dem sammen","Lave en tegning af en trekant","Dividere med 10"],"Se deres placering omkring 400","398 er under 400, 403 er over."],
    ["Hvilken strategi passer bedst til 600-298?",["600-300+2","600-200-98-100","298-600","600·298"],"600-300+2","298 er tæt på 300."]
   ]),
   mellem:set([
    ["Du skal finde 15 % af 320. Hvilken strategi er effektiv?",["10 % + 5 %","320+15","15÷320","320-15"],"10 % + 5 %","32+16=48."],
    ["Du skal sammenligne 5/8 og 3/4. Hvilken strategi er tydelig?",["Fælles nævner 8","Læg tællerne sammen","Sammenlign kun 5 og 3","Vend begge brøker"],"Fælles nævner 8","3/4=6/8, så 5/8<6/8."],
    ["Et rektangel har areal 84 og længde 12. Hvad er bedste operation for bredden?",["Division","Addition","Multiplikation","Kvadratrod"],"Division","b=A/l=84/12."],
    ["Du har en tabel med 40 værdier og vil finde typisk niveau med en outlier. Hvilket mål kan være robust?",["Median","Maksimum","Variationsbredde","Sum"],"Median","Medianen påvirkes mindre af ekstreme værdier."],
    ["En opskrift skal skaleres fra 4 til 10 personer. Hvilken strategi?",["Find mængde pr. person eller gang med 2,5","Læg 6 til alle mængder","Træk 4 fra","Gang med 10"],"Find mængde pr. person eller gang med 2,5","Skaleringsfaktoren er 10/4=2,5."]
   ]),
   udskoling:set([
    ["Du skal løse 3(x-2)=18. Hvilket første trin er mest effektivt?",["Divider med 3 eller udvid parentesen","Tag kvadratroden","Læg 18 til x","Gang med 18"],"Divider med 3 eller udvid parentesen","Begge er gyldige; division giver hurtigt x-2=6."],
    ["Du skal undersøge en lineær sammenhæng fra data. Hvad er nyttigt først?",["Plot punkterne og se ændringen pr. x-enhed","Find altid medianen","Tegn en cirkel","Kvadrér alle tal"],"Plot punkterne og se ændringen pr. x-enhed","Graf og differenser kan afsløre linearitet."],
    ["Et komplekst procentproblem har flere ændringer efter hinanden. Hvilken strategi er sikrest?",["Brug vækstfaktorer trin for trin","Læg alle procenter sammen uanset sammenhæng","Rund alt til nul","Brug kun den største procent"],"Brug vækstfaktorer trin for trin","Flere procentændringer virker multiplikativt."],
    ["Du skal vurdere om to variable hænger sammen. Hvad er et godt første værktøj?",["Punktdiagram","Cirkeldiagram uden parrede data","Kun gennemsnittet","En ligning valgt på forhånd"],"Punktdiagram","Punktdiagrammet viser mønstret mellem parrede observationer."],
    ["Du skal bevise, at en påstand er falsk. Hvad kan være nok?",["Ét gyldigt modeksempel","100 eksempler der passer","Et diagram uden værdier","At påstanden virker mærkelig"],"Ét gyldigt modeksempel","Et enkelt modeksempel modbeviser en universel påstand."]
   ])
  },
  "Matematisk argumentation":{
   udskoling:set([
    ["Påstand: Summen af to lige tal er lige. Hvilket argument er stærkest?",["Skriv tallene 2a og 2b: 2a+2b=2(a+b)","2+4=6","Det plejer at passe","Lige tal ser ens ud"],"Skriv tallene 2a og 2b: 2a+2b=2(a+b)","Argumentet gælder for alle lige tal."],
    ["Påstand: Alle primtal er ulige. Hvad gør påstanden falsk?",["Primtallet 2","Primtallet 3","Tallet 9","Tallet 1"],"Primtallet 2","2 er både primtal og lige."],
    ["Hvorfor er et eksempel alene normalt ikke et bevis for en generel påstand?",["Det viser kun, at påstanden virker i det konkrete tilfælde","Eksempler er altid forkerte","Generelle påstande må ikke have tal","Beviser må kun bruge ord"],"Det viser kun, at påstanden virker i det konkrete tilfælde","Et bevis skal dække alle relevante tilfælde."],
    ["Hvad er et modeksempel?",["Et eksempel der opfylder betingelserne men ikke konklusionen","Et ekstra eksempel der passer","En afrunding","Et gennemsnit"],"Et eksempel der opfylder betingelserne men ikke konklusionen","Det viser, at en universel påstand ikke gælder altid."],
    ["Hvis n er ulige, kan det skrives som…",["2k+1","2k","k/2","k²"],"2k+1","Alle ulige heltal er ét mere end et lige tal."],
    ["Påstand: Produktet af to negative tal er positivt. Hvad er bedst i en skoleforklaring?",["Knyt fortegnsreglen til kendte regneregler og vis et eksempel","Sig at minus forsvinder","Vis kun -2·-3=6","Skriv svaret uden forklaring"],"Knyt fortegnsreglen til kendte regneregler og vis et eksempel","Argumentet bør forbinde regel og eksempel."],
    ["Hvilken sætning er et matematisk argument?",["Hvis begge sider af et kvadrat er s, er arealet s·s=s²","Kvadrater er pæne","Jeg tror arealet er stort","s er et bogstav"],"Hvis begge sider af et kvadrat er s, er arealet s·s=s²","Den kobler definitionen til konklusionen."],
    ["Du vil vise, at 0,333… = 1/3. Hvad er relevant?",["1/3 har decimaludviklingen 0,333…","0,3 er næsten 1/3","Tre er et primtal","1/3 er mindre end 1"],"1/3 har decimaludviklingen 0,333…","Det forbinder brøken og decimalrepræsentationen direkte."],
    ["Hvad gør en konklusion stærkere?",["At den følger af de viste beregninger eller begrundelser","At den står med fed skrift","At den er meget lang","At den kommer først"],"At den følger af de viste beregninger eller begrundelser","Konklusionen skal være understøttet af argumentet."],
    ["En graf ser stigende ud. Hvad bør du undersøge før du konkluderer lineær vækst?",["Om stigningen pr. x-enhed er omtrent konstant","Om grafen er blå","Om første punkt er størst","Om der er en titel"],"Om stigningen pr. x-enhed er omtrent konstant","Lineær vækst kendetegnes af konstant ændring."]
   ]),
   anvendt:set([
    ["En reklame siger '9 ud af 10 foretrækker os' ud fra 10 ansatte. Hvad er den vigtigste kritik?",["Udvalget er lille og ikke repræsentativt","90 % kan ikke beregnes","Ansatte må ikke svare","9 er et ulige tal"],"Udvalget er lille og ikke repræsentativt","Datagrundlaget gør generaliseringen svag."],
    ["En kommune ser flere cyklister samtidig med flere caféer. Kan man konkludere, at caféer skaber cykling?",["Nej, korrelation er ikke automatisk årsag","Ja, altid","Kun hvis tallene er store","Kun hvis grafen stiger"],"Nej, korrelation er ikke automatisk årsag","Andre faktorer kan forklare begge udviklinger."],
    ["En model forudsiger 2,3 personer i en bil. Hvordan bør resultatet fortolkes?",["Som et gennemsnit, ikke et konkret antal i én bil","Som præcis 2,3 personer","Som 23 personer","Som en fejl der gør modellen ubrugelig"],"Som et gennemsnit, ikke et konkret antal i én bil","Matematiske modeller kan give gennemsnitsværdier, der ikke er hele i enkelttilfælde."],
    ["To mobilabonnementer krydser ved 12 GB. Hvad betyder skæringspunktet?",["De koster det samme ved 12 GB","Begge er gratis efter 12 GB","12 GB er maksimum","Priserne er proportionale"],"De koster det samme ved 12 GB","Skæringspunktet viser samme funktionsværdi."],
    ["En beregning bygger på, at alle løber præcis samme fart. Hvad bør konklusionen nævne?",["At resultatet afhænger af denne antagelse","At antagelser aldrig betyder noget","At alle løbere er ens","At fart ikke kan måles"],"At resultatet afhænger af denne antagelse","Modellens antagelser sætter grænser for konklusionen."]
   ])
  },
  "Modellering":{
   mellem:set([
    ["En klasse vil beregne pris på en tur. Hvad er første gode skridt?",["Find relevante oplysninger og hvad der skal beregnes","Gæt totalprisen","Tegn et tilfældigt diagram","Rund alle tal til 0"],"Find relevante oplysninger og hvad der skal beregnes","En model starter med at afgrænse situationen og variablerne."],
    ["Hvorfor bruger man en matematisk model?",["For at beskrive eller undersøge en virkelighed med matematik","For at erstatte alle observationer","For at gøre alle svar præcise","For at undgå antagelser"],"For at beskrive eller undersøge en virkelighed med matematik","Modeller forenkler virkeligheden, så den kan analyseres."],
    ["En opskrift tilpasses antal personer. Hvilken enkel model passer ofte?",["Proportionalitet","Tilfældighed","Kvadratisk vækst","Ingen sammenhæng"],"Proportionalitet","Mængderne skalerer ofte med antal personer."],
    ["Hvad er en antagelse i en model?",["Noget vi vælger at behandle som gældende for at kunne regne","Et sikkert måleresultat","Det endelige svar","En regnefejl"],"Noget vi vælger at behandle som gældende for at kunne regne","Antagelser er forenklinger, der skal være tydelige."],
    ["Efter en modelberegning bør man…",["sammenholde resultatet med virkeligheden","altid acceptere tallet","slette antagelserne","ændre spørgsmålet"],"sammenholde resultatet med virkeligheden","Validering undersøger om modellen giver rimelige resultater."]
   ]),
   udskoling:set([
    ["En taxapris har startgebyr 45 kr. og 12 kr/km. Hvilken model?",["P(x)=45+12x","P(x)=45x","P(x)=12+45x","P(x)=57/x"],"P(x)=45+12x","Fast startværdi plus pris pr. km."],
    ["Hvorfor kan samme virkelige problem have flere matematiske modeller?",["Fordi man kan vælge forskellige antagelser og detaljeringsgrader","Fordi matematik ikke har regler","Fordi alle modeller er lige gode","Fordi data ikke bruges"],"Fordi man kan vælge forskellige antagelser og detaljeringsgrader","Modelvalget afhænger af formål og forenklinger."],
    ["En lineær model passer godt i et begrænset interval. Hvad er risikoen ved at forlænge den langt udenfor?",["Ekstrapolation kan blive urealistisk","Linjer stopper automatisk","x kan ikke blive større","Hældningen bliver altid 0"],"Ekstrapolation kan blive urealistisk","Sammenhængen kan ændre sig uden for de observerede data."],
    ["Hvad betyder det at validere en model?",["At sammenligne modelresultater med data/virkelighed","At gøre modellen mere kompliceret","At fjerne enheder","At vælge pæne tal"],"At sammenligne modelresultater med data/virkelighed","Validering tester modellens brugbarhed."],
    ["En model har stor systematisk fejl. Hvad bør man overveje?",["Om antagelser eller parametre skal ændres","At ignorere data","At runde mere","At gøre grafen større"],"Om antagelser eller parametre skal ændres","Systematiske afvigelser tyder på, at modellen mangler noget væsentligt."]
   ]),
   anvendt:set([
    ["Skolen vil estimere madspild pr. år ud fra én uge. Hvad bør modellen tage højde for?",["Om ugen er repræsentativ og om ferier/sæsoner ændrer mønstret","Kun tallets decimaler","Kun skolens navn","At et år altid har 50 skoleuger"],"Om ugen er repræsentativ og om ferier/sæsoner ændrer mønstret","Opskalering kræver rimelige antagelser om variation over året."],
    ["En energimodel antager konstant elpris. Hvad sker der, hvis prisen varierer meget?",["Modellens økonomiske resultat kan blive misvisende","Energiforbruget bliver nul","Alle enheder ændres","Matematikken holder op med at virke"],"Modellens økonomiske resultat kan blive misvisende","Antagelsen påvirker, hvor realistisk resultatet er."],
    ["Du sammenligner to transportformer. Hvilke variable kan være relevante ud over pris?",["Tid, afstand, antal personer og evt. CO₂","Kun logo","Kun billetfarve","Kun dagens dato"],"Tid, afstand, antal personer og evt. CO₂","En god model vælger variable, der er relevante for spørgsmålet."],
    ["Et budget har en sikkerhedsmargin på 10 %. Hvorfor?",["For at håndtere usikkerhed og uforudsete udgifter","For at gøre alle priser 10 % billigere","For at fjerne moms","For at undgå at lægge sammen"],"For at håndtere usikkerhed og uforudsete udgifter","Marginen er en enkel måde at modellere usikkerhed på."],
    ["En model giver to næsten ens løsninger. Hvad kan afgøre valget i praksis?",["Kriterier som pris, tid, risiko eller bæredygtighed","Hvilken løsning står først","Hvilket tal har flest cifre","At vælge tilfældigt"],"Kriterier som pris, tid, risiko eller bæredygtighed","Modellering kobler matematiske resultater til beslutningens formål."]
   ])
  }
 }
};
