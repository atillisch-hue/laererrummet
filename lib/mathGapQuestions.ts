import type {TrainingQuestion} from "./freeTrainingQuestions";
type LevelBank=Record<string,TrainingQuestion[]>;
const set=(rows:Array<[string,string[],string,string]>):TrainingQuestion[]=>rows.map(([q,options,answer,why])=>({q,options,answer,why}));
export const mathGapQuestions:Record<string,Record<string,LevelBank>>={
 "tal-regning":{
  "Regnestrategier":{
   grund:set([
    ["Hvad er smartest til 99 + 36?",["100 + 36 - 1","90 + 30","99 × 36","100 - 36"],"100 + 36 - 1","99 ligger tæt på 100, så kompensation gør regningen enkel."],
    ["Hvad er 48 + 27, hvis du deler 27 i 20 og 7?",["75","65","85","71"],"75","48+20=68 og 68+7=75."],
    ["Hvad er en smart vej til 9 × 7?",["10 × 7 - 7","9 + 7","7 × 7","10 × 9"],"10 × 7 - 7","9 grupper er én gruppe mindre end 10 grupper."],
    ["Hvordan kan 64 - 29 regnes smart?",["64 - 30 + 1","64 - 20 + 9","29 - 64","64 + 30"],"64 - 30 + 1","29 er én mindre end 30."],
    ["Hvilken strategi hjælper ved 25 × 12?",["25 × 4 × 3","25 + 12","12 - 25","25 ÷ 12"],"25 × 4 × 3","25×4=100, så 100×3=300."]
   ]),
   mellem:set([
    ["Hvad er smartest til 198 + 347?",["200 + 347 - 2","198 + 300 - 47","200 × 347","347 - 198"],"200 + 347 - 2","Afrund 198 til 200 og korrigér med -2."],
    ["Hvordan kan 16 × 25 regnes hurtigt?",["4 × 100","16 + 25","8 × 25","160 × 25"],"4 × 100","16 består af fire 4'ere, og 4×25=100."],
    ["Hvad er en god strategi til 15 % af 240?",["10 % + 5 %","240 + 15","15 ÷ 240","20 % - 15"],"10 % + 5 %","24 + 12 = 36."],
    ["Hvilken omformning gør 7,5 × 8 let?",["(7 + 0,5) × 8","7,5 + 8","75 × 8 uden at flytte komma","8 - 7,5"],"(7 + 0,5) × 8","56+4=60."],
    ["Hvad er smartest til 1000 - 487?",["1000 - 500 + 13","1000 - 400 + 87","487 - 1000","1000 + 487"],"1000 - 500 + 13","487 er 13 mindre end 500."]
   ])
  }
 },
 "broeker-procent":{
  "Decimaltal":{mellem:set([
   ["Hvad er 0,7 + 0,25?",["0,95","0,32","0,725","9,5"],"0,95","Sæt decimalerne under hinanden: 0,70+0,25=0,95."],
   ["Hvilket tal er størst?",["0,81","0,8","0,18","0,801"],"0,81","0,810 er større end 0,801 og 0,800."],
   ["Hvad er 3,6 ÷ 10?",["0,36","36","3,06","0,036"],"0,36","Ved division med 10 flyttes komma én plads mod venstre."],
   ["Hvad er 1,25 × 4?",["5","4,25","0,5","50"],"5","Fire gange 1,25 er 5."],
   ["Hvilken brøk svarer til 0,5?",["1/2","1/5","5/100","2/5"],"1/2","0,5 er fem tiendedele = en halv."]
  ])},
  "Forhold":{mellem:set([
   ["Forholdet mellem 6 røde og 3 blå kugler kan forkortes til…",["2:1","3:2","6:1","1:2"],"2:1","Divider begge led med 3."],
   ["Et hold har 8 piger og 12 drenge. Forhold piger:drenge er…",["2:3","3:2","8:20","1:4"],"2:3","8:12 forkortes med 4."],
   ["Saft blandes 1:4. Hvor mange dele er der i alt?",["5","4","3","1"],"5","1 del saft + 4 dele vand = 5 dele."],
   ["Hvilket forhold er det samme som 3:5?",["6:10","5:3","9:10","3:10"],"6:10","Begge led er ganget med 2."],
   ["En tegning har bredde:højde = 4:3. Hvis bredden er 20 cm, er højden…",["15 cm","16 cm","12 cm","24 cm"],"15 cm","Skaleringsfaktoren er 5, så højden er 3×5."]
  ])}
 },
 "geometri":{
  "Rumfang":{mellem:set([
   ["Rumfanget af en kasse 4 cm × 3 cm × 2 cm er…",["24 cm³","9 cm³","24 cm²","12 cm³"],"24 cm³","V=l·b·h=4·3·2."],
   ["Hvilken enhed passer til rumfang?",["cm³","cm²","cm","kg"],"cm³","Rumfang måles i kubikenheder."],
   ["En terning har sidelængde 5 cm. Rumfang?",["125 cm³","25 cm³","20 cm³","15 cm³"],"125 cm³","5³=125."],
   ["En kasse har rumfang 60 cm³, længde 5 cm og bredde 4 cm. Højden er…",["3 cm","12 cm","51 cm","300 cm"],"3 cm","60/(5·4)=3."],
   ["1 liter svarer til…",["1 dm³","1 cm³","1 m³","100 dm³"],"1 dm³","En liter er én kubikdecimeter."]
  ])},
  "Geometriske figurer":{grund:set([
   ["Hvor mange sider har en femkant?",["5","4","6","3"],"5","Navnet femkant fortæller antallet af sider."],
   ["Hvilken figur har fire lige lange sider og fire rette vinkler?",["Kvadrat","Trekant","Cirkel","Trapez"],"Kvadrat","Det er definitionen på et kvadrat."],
   ["Hvilken figur har ingen hjørner?",["Cirkel","Rektangel","Trekant","Femkant"],"Cirkel","En cirkel har ingen rette sider eller hjørner."],
   ["Hvor mange hjørner har en trekant?",["3","2","4","6"],"3","En trekant har tre sider og tre hjørner."],
   ["Et rektangel har…",["fire rette vinkler","altid fire lige lange sider","tre sider","ingen parallelle sider"],"fire rette vinkler","Rektangler har fire rette vinkler."]
  ])}
 },
 "algebra":{
  "Mønstre":{grund:set([
   ["Hvad kommer næste? 4, 8, 12, 16, …",["20","18","24","17"],"20","Mønstret stiger med 4."],
   ["Hvad mangler? 3, 6, 12, 24, …",["48","30","36","27"],"48","Hvert tal fordobles."],
   ["Mønstret er 10, 8, 6, 4, … Næste tal?",["2","3","0","6"],"2","Der trækkes 2 fra hver gang."],
   ["1, 4, 7, 10… Hvad er reglen?",["+3","+4","×3","-3"],"+3","Forskellen mellem nabotal er 3."],
   ["En figur får 2 nye klodser for hvert trin. Trin 1 har 3. Trin 2 har…",["5","6","4","9"],"5","3+2=5."]
  ])},
  "Variable":{mellem:set([
   ["Hvis x=4, hvad er x+7?",["11","3","28","47"],"11","Indsæt 4 for x."],
   ["Hvis a=3, hvad er 5a?",["15","8","53","2"],"15","5a betyder 5·a."],
   ["Hvilket udtryk betyder 'et tal n plus 6'?",["n+6","6n","n-6","6/n"],"n+6","Variablen n repræsenterer tallet."],
   ["Hvis y=2x og x=5, er y…",["10","7","25","2,5"],"10","2·5=10."],
   ["Hvad betyder en variabel?",["Et symbol der kan repræsentere en værdi","Et lighedstegn","Et fast svar","En enhed"],"Et symbol der kan repræsentere en værdi","Variable bruges til ukendte eller skiftende størrelser."]
  ])},
  "Funktioner":{udskoling:set([
   ["I y=3x+2, hvad er y når x=4?",["14","12","9","6"],"14","3·4+2=14."],
   ["Hvilken funktion er lineær?",["y=2x-5","y=x²","y=1/x","y=√x"],"y=2x-5","En lineær funktion har formen y=ax+b."],
   ["I y=5x+1 fortæller 5…",["hældningen","skæringen med y-aksen","x-værdien","nulpunktet"],"hældningen","y ændres 5, når x ændres 1."],
   ["I y=2x-4, hvor skærer grafen y-aksen?",["-4","2","4","-2"],"-4","Når x=0, er y=-4."],
   ["Hvilket punkt ligger på y=x+3?",["(2,5)","(2,4)","(3,3)","(0,0)"],"(2,5)","2+3=5."]
  ])}
 },
 "data":{
  "Tabeller og diagrammer":{grund:set([
   ["Et søjlediagram viser 8 bøger mandag og 12 tirsdag. Hvor mange flere tirsdag?",["4","20","2","96"],"4","12-8=4."],
   ["Hvad viser en akseetiket?",["Hvad tallene eller kategorierne betyder","Diagrammets farve","Hvem der har tegnet det","Svaret på alle spørgsmål"],"Hvad tallene eller kategorierne betyder","Akser skal fortælle, hvad der måles."],
   ["En tabel har 5, 7 og 9 elever i tre grupper. Hvor mange i alt?",["21","16","14","35"],"21","5+7+9=21."],
   ["Hvilket diagram er ofte godt til at sammenligne kategorier?",["Søjlediagram","Tilfældigt punkt","Kun tekst","En ligning"],"Søjlediagram","Søjler gør kategorier lette at sammenligne."],
   ["Hvorfor skal en graf have en tydelig skala?",["Så afstande mellem værdier kan tolkes korrekt","Så den fylder mere","Så alle søjler bliver lige høje","Så farverne matcher"],"Så afstande mellem værdier kan tolkes korrekt","Skalaen bestemmer, hvordan højder og afstande læses."]
  ])},
  "Sandsynlighed":{mellem:set([
   ["En fair mønt kastes. Sandsynligheden for plat er…",["1/2","1/4","1","0"],"1/2","Der er to lige sandsynlige udfald."],
   ["En fair sekssidet terning: sandsynlighed for at slå 6?",["1/6","1/2","6","1/3"],"1/6","Ét gunstigt udfald ud af seks."],
   ["En pose har 3 røde og 1 blå kugle. P(blå)?",["1/4","3/4","1/3","1"],"1/4","Én af fire kugler er blå."],
   ["Hvilken sandsynlighed betyder umulig?",["0","0,5","1","50 %"],"0","0 betyder, at hændelsen ikke kan ske."],
   ["Hvilken sandsynlighed betyder sikker?",["1","0","0,1","1/2"],"1","1 = 100 %."]
  ])},
  "Kritisk dataforståelse":{udskoling:set([
   ["En graf starter y-aksen ved 98 og viser 99 mod 100. Hvad kan det gøre?",["Forskellen ser større ud end den er","Forskellen forsvinder","Data bliver automatisk falske","Gennemsnittet bliver 98"],"Forskellen ser større ud end den er","En afkortet akse kan visuelt overdrive små forskelle."],
   ["En undersøgelse om skolemad spørger kun elever i kantinekøen. Hvad er problemet?",["Udvalget kan være skævt","Der er for mange data","Svar kan ikke være tal","Kantiner må ikke undersøges"],"Udvalget kan være skævt","De adspurgte er ikke nødvendigvis repræsentative for alle elever."],
   ["Hvad betyder korrelation?",["At to variable varierer sammen — ikke nødvendigvis at den ene årsager den anden","At den ene altid skaber den anden","At data er tilfældige","At gennemsnittet er ens"],"At to variable varierer sammen — ikke nødvendigvis at den ene årsager den anden","Sammenhæng er ikke det samme som årsag."],
   ["En artikel siger 'risikoen fordobles' fra 1 ud af 10.000 til 2 ud af 10.000. Hvad mangler for perspektiv?",["Den absolutte risiko","En større overskrift","Flere decimaler","Et cirkeldiagram"],"Den absolutte risiko","Relativ ændring kan lyde dramatisk uden absolutte tal."],
   ["Hvad bør du tjekke ved en statistik på sociale medier?",["Kilde, udvalg, målemetode og akser","Kun farverne","Kun om tallet er stort","Kun hvem der delte den"],"Kilde, udvalg, målemetode og akser","Kritisk dataforståelse undersøger, hvordan tallet er blevet til."]
  ])}
 },
 "anvendt":{
  "Måling i praksis":{anvendt:set([
   ["Et bord er ca. 1,8 m langt. Hvilket redskab er mest praktisk?",["Målebånd","Køkkenvægt","Termometer","Stopur"],"Målebånd","Målebånd måler længde over større afstande."],
   ["Et rum er 6 m × 4 m. Hvor meget gulvareal?",["24 m²","20 m","10 m²","48 m³"],"24 m²","Areal=længde·bredde."],
   ["Du skal købe lister rundt om et rum 5 m × 3 m. Cirka hvor mange meter før døre trækkes fra?",["16 m","15 m","8 m","30 m"],"16 m","Omkredsen er 2·5+2·3=16 m."],
   ["En flaske rummer 750 ml. Hvor mange liter?",["0,75 L","7,5 L","75 L","0,075 L"],"0,75 L","1000 ml=1 L."],
   ["Hvorfor måler man ofte flere gange i et praktisk projekt?",["For at opdage målefejl og øge sikkerheden","For at gøre tallet større","Fordi én måling aldrig må bruges","For at ændre enheden"],"For at opdage målefejl og øge sikkerheden","Gentagne målinger kan afsløre fejl og variation."]
  ])}
 }
};
