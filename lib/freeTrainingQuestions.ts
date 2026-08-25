export type TrainingQuestion={q:string;options:string[];answer:string;why:string};
const q=(text:string,options:string[],answer:string,why:string):TrainingQuestion=>({q:text,options,answer,why});
export const freeTrainingQuestions:Record<string,Record<string,Record<string,TrainingQuestion[]>>>={
'dansk-grammatik':{
 'ordklasser':{
  'Navneord':[q('Hvilket ord er et navneord?',['løber','cykel','hurtigt','glad'],'cykel','Cykel er navnet på en ting.'),q('Hvilket ord kan du sætte “en” foran?',['bog','læse','smuk','meget'],'bog','Man kan sige en bog.'),q('Find navneordet: “Katten sover.”',['Katten','sover','begge','ingen'],'Katten','Katten betegner et dyr.'),q('Hvilket er et egennavn?',['by','pige','Odense','skole'],'Odense','Odense er navnet på et bestemt sted.'),q('Hvilket ord er ikke et navneord?',['venskab','bord','danser','sommer'],'danser','Danser er her et udsagnsord.')],
  'Udsagnsord':[q('Hvilket ord er udsagnsord? “Maja løber hjem.”',['Maja','løber','hjem','ingen'],'løber','Løber fortæller, hvad Maja gør.'),q('Hvilket ord kan du sætte “at” foran?',['glad','cykle','cykel','hurtig'],'cykle','Man kan sige at cykle.'),q('Hvilket udsagnsord står i datid?',['spiser','spiste','spise','spis'],'spiste','Spiste fortæller, at handlingen allerede er sket.'),q('Find udsagnsordet: “Børnene griner højt.”',['Børnene','griner','højt','Børnene griner'],'griner','Griner fortæller, hvad børnene gør.'),q('Hvilket ord er ikke et udsagnsord?',['løbe','tænker','stol','sov'],'stol','Stol er et navneord.')],
  'Tillægsord':[q('Hvilket ord beskriver en egenskab?',['smuk','løber','hus','meget'],'smuk','Smuk er et tillægsord.'),q('Find tillægsordet: “Den gamle cykel knirker.”',['Den','gamle','cykel','knirker'],'gamle','Gamle beskriver cyklen.'),q('Hvilket ord kan beskrive et navneord?',['grøn','løbe','bord','der'],'grøn','Grøn kan beskrive fx en grøn stol.'),q('Vælg tillægsordet i “et koldt glas vand”.',['et','koldt','glas','vand'],'koldt','Koldt beskriver en egenskab.'),q('Hvilket er ikke et tillægsord?',['stor','venlig','hurtig','skriver'],'skriver','Skriver er et udsagnsord.')]
 },
 'saetninger':{
  'Grundled og udsagnsled':[q('Find udsagnsleddet: “Maja cykler.”',['Maja','cykler','Maja cykler','ingen'],'cykler','Udsagnsleddet fortæller handlingen.'),q('Find grundleddet: “Hunden gøede.”',['Hunden','gøede','begge','ingen'],'Hunden','Grundleddet er den eller det, der udfører handlingen.'),q('Hvad er udsagnsleddet i “De har spist”?',['De','har spist','spist','har'],'har spist','Et udsagnsled kan bestå af flere udsagnsord.'),q('Grundleddet i “Børnene leger ude” er…',['Børnene','leger','ude','leger ude'],'Børnene','Det er børnene, der udfører handlingen.'),q('Hvilket spørgsmål hjælper med at finde grundleddet?',['Hvem/hvad + udsagnsled?','Hvorfor?','Hvornår?','Hvor mange?'],'Hvem/hvad + udsagnsled?','Spørg fx: Hvem cykler?')]
 }
},
'matematik':{
 'tal-regning':{
  'Tal og mængder':[q('Hvilket tal kommer efter 7?',['6','8','9','17'],'8','Når vi tæller videre fra 7, kommer 8.'),q('Hvor mange prikker er der: ● ● ● ● ?',['3','4','5','6'],'4','Der er fire prikker.'),q('Hvilket tal er størst?',['3','8','5','2'],'8','8 er større end de andre tal.'),q('Hvad mangler? 2, 3, 4, __, 6',['1','5','7','8'],'5','Tallene tæller én op ad gangen.'),q('Hvilket tal er mindst?',['10','4','7','9'],'4','4 er det mindste tal.')],
  'Plus og minus':[q('Hvad er 4 + 3?',['6','7','8','9'],'7','Fire plus tre er syv.'),q('Hvad er 9 - 2?',['5','6','7','8'],'7','Når to tages fra ni, er der syv tilbage.'),q('Du har 5 æbler og får 2 mere. Hvor mange har du?',['3','6','7','8'],'7','5 + 2 = 7.'),q('Hvad er 10 - 4?',['4','5','6','7'],'6','10 - 4 = 6.'),q('Hvilket regnestykke giver 8?',['4 + 4','3 + 4','10 - 3','2 + 5'],'4 + 4','4 + 4 = 8.')]
 },
 'broeker-procent':{
  'Procent':[q('Hvad er 50 % af 100?',['25','50','75','100'],'50','50 % betyder halvdelen.'),q('En vare til 200 kr. sættes 25 % ned. Hvor stor er rabatten?',['25 kr.','50 kr.','75 kr.','100 kr.'],'50 kr.','25 % af 200 kr. er 50 kr.'),q('Hvad svarer 0,5 til i procent?',['5 %','25 %','50 %','500 %'],'50 %','0,5 er halvdelen, altså 50 %.'),q('20 ud af 100 er…',['2 %','20 %','50 %','80 %'],'20 %','Procent betyder pr. hundrede.'),q('En pris stiger fra 100 til 110 kr. Stigningen er…',['5 %','10 %','11 %','110 %'],'10 %','Stigningen er 10 kr. ud af de oprindelige 100 kr.')]
 },
 'anvendt':{
  'Penge og budget':[q('Du har 500 kr. Et køb koster 325 kr. Hvor meget har du tilbage?',['125 kr.','175 kr.','225 kr.','825 kr.'],'175 kr.','500 - 325 = 175.'),q('Tre billetter koster 75 kr. stykket. Hvad koster de tilsammen?',['150 kr.','200 kr.','225 kr.','250 kr.'],'225 kr.','3 × 75 = 225.'),q('Et abonnement koster 129 kr. om måneden. Hvad koster 2 måneder?',['129 kr.','158 kr.','258 kr.','300 kr.'],'258 kr.','2 × 129 = 258.'),q('Du har et budget på 1.000 kr. og bruger 650 kr. Hvor stor en del er tilbage?',['250 kr.','350 kr.','450 kr.','650 kr.'],'350 kr.','1.000 - 650 = 350.'),q('To butikker sælger samme vare: 240 kr. og 199 kr. Hvor meget sparer du ved den billigste?',['31 kr.','41 kr.','51 kr.','61 kr.'],'41 kr.','240 - 199 = 41.')]
 }
}
};
