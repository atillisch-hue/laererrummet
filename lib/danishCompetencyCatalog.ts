export type DanishCompetencyAreaId="reading"|"interpretation"|"writing"|"communication"|"language"|"exam";
export type DanishCompetencyStatus="live"|"developing";

export type DanishCompetencySkill={
 id:string;
 title:string;
 description:string;
 minGrade:number;
 status:DanishCompetencyStatus;
 href?:string;
};

export type DanishCompetencyArea={
 id:DanishCompetencyAreaId;
 title:string;
 shortTitle:string;
 description:string;
 icon:string;
 skills:DanishCompetencySkill[];
};

export const danishCompetencyAreas:DanishCompetencyArea[]=[
 {
  id:"reading",title:"Læsning",shortTitle:"Læs",icon:"▤",
  description:"Forstå, finde, vurdere og bruge information i forskellige slags tekster.",
  skills:[
   {id:"overview",title:"Skimme og skabe overblik",description:"Få hurtigt øje på teksttype, emne, struktur og det vigtigste.",minGrade:3,status:"live"},
   {id:"scan",title:"Finde information",description:"Søgelæse og finde præcise oplysninger i tekst, tabel og oversigt.",minGrade:3,status:"live"},
   {id:"main-idea",title:"Hovedindhold",description:"Skelne det vigtigste fra detaljer og formulere tekstens centrale indhold.",minGrade:3,status:"live"},
   {id:"inference",title:"Læse mellem linjerne",description:"Bruge tekstspor til at forstå det, der ikke står direkte.",minGrade:5,status:"live"},
   {id:"context",title:"Ord i kontekst",description:"Udlede betydningen af ord og formuleringer ud fra sammenhængen.",minGrade:4,status:"live"},
   {id:"critical-reading",title:"Kritisk læsning",description:"Undersøge afsender, formål, troværdighed og valg i teksten.",minGrade:7,status:"live"}
  ]
 },
 {
  id:"interpretation",title:"Fortolkning & analyse",shortTitle:"Fortolk",icon:"◇",
  description:"Gå fra tekstnære iagttagelser til analyse, fortolkning og perspektivering.",
  skills:[
   {id:"close-reading",title:"Tekstnære spor",description:"Finde ord, billeder, handlinger og detaljer, som kan bruges som belæg.",minGrade:3,status:"live",href:"/danish"},
   {id:"character",title:"Personer, miljø og relationer",description:"Undersøge hvordan mennesker og miljø fremstilles og udvikler sig.",minGrade:4,status:"live",href:"/danish"},
   {id:"narrative",title:"Fortæller og synsvinkel",description:"Se hvem der fortæller, hvad læseren får adgang til, og hvilken virkning det har.",minGrade:5,status:"live",href:"/danish"},
   {id:"language-effect",title:"Sprog, form og virkning",description:"Forbinde sproglige valg med funktion og effekt i teksten.",minGrade:6,status:"live",href:"/grammar?mode=assign"},
   {id:"interpretation",title:"Fortolkning",description:"Samle tekstens spor til en begrundet forståelse af tema, konflikt og betydning.",minGrade:6,status:"live",href:"/danish"},
   {id:"perspective",title:"Perspektivering",description:"Sætte teksten i forbindelse med andre tekster, temaer, tid og samfund.",minGrade:7,status:"live",href:"/danish"}
  ]
 },
 {
  id:"writing",title:"Fremstilling",shortTitle:"Skriv",icon:"✎",
  description:"Planlægge, skrive, bearbejde og udgive tekster til et tydeligt formål og en modtager.",
  skills:[
   {id:"purpose",title:"Formål og modtager",description:"Vide hvorfor teksten skrives, og hvem den skal virke på.",minGrade:2,status:"live"},
   {id:"structure",title:"Genre og struktur",description:"Bruge en form, der passer til tekstens formål.",minGrade:2,status:"live"},
   {id:"coherence",title:"Sammenhæng og afsnit",description:"Skabe en tydelig bevægelse gennem teksten og binde afsnit sammen.",minGrade:4,status:"live"},
   {id:"argument",title:"Argumentation og belæg",description:"Fremsætte synspunkter og underbygge dem med eksempler og belæg.",minGrade:6,status:"live"},
   {id:"revision",title:"Bearbejdning og korrektur",description:"Forbedre indhold, sprog, stavning og tegnsætning før aflevering.",minGrade:3,status:"live"},
   {id:"voice",title:"Stemme og stil",description:"Vælge sproglig tone og virkemidler bevidst i forhold til genre og modtager.",minGrade:7,status:"live"}
  ]
 },
 {
  id:"communication",title:"Kommunikation",shortTitle:"Formidl",icon:"◎",
  description:"Lytte, tale, præsentere og vælge form og medie efter situation og modtager.",
  skills:[
   {id:"oral",title:"Mundtlig formidling",description:"Planlægge og gennemføre en tydelig mundtlig fremstilling.",minGrade:2,status:"developing"},
   {id:"dialogue",title:"Samtale og respons",description:"Lytte, bygge videre, stille spørgsmål og give brugbar respons.",minGrade:2,status:"developing"},
   {id:"presentation",title:"Præsentation",description:"Strukturere stof, bruge eksempler og støtte publikums forståelse.",minGrade:4,status:"developing"},
   {id:"media",title:"Medier og multimodalitet",description:"Kombinere tekst, lyd, billede og andre udtryksformer bevidst.",minGrade:5,status:"live",href:"/danish"},
   {id:"rhetoric",title:"Retorik og appel",description:"Vurdere og bruge argumentation, appelformer og sproglige virkemidler.",minGrade:7,status:"developing"}
  ]
 },
 {
  id:"language",title:"Sprog & grammatik",shortTitle:"Sprog",icon:"Aa",
  description:"Forstå og bruge sprogets system, retskrivning og sproglige virkemidler.",
  skills:[
   {id:"grammar",title:"Grammatik",description:"Ordklasser, bøjning, syntaks, sætninger og sproglig funktion.",minGrade:1,status:"live",href:"/grammar?mode=assign"},
   {id:"spelling",title:"Stavning og retskrivning",description:"Ord, endelser, sammenskrivning, sprogfælder og korrektur.",minGrade:1,status:"live",href:"/grammar?mode=assign"},
   {id:"punctuation",title:"Tegnsætning",description:"Punktum, komma, direkte tale og øvrige tegn i meningsfulde tekster.",minGrade:3,status:"live",href:"/grammar?mode=assign"},
   {id:"text-grammar",title:"Tekstgrammatik",description:"Reference, forbindelsesord, variation og sammenhæng mellem sætninger.",minGrade:5,status:"live",href:"/grammar?mode=assign"}
  ]
 },
 {
  id:"exam",title:"Prøveforberedelse",shortTitle:"Prøver",icon:"✓",
  description:"Træne prøveformer og strategier på et niveau, der passer til eleven.",
  skills:[
   {id:"reading-exam",title:"Træn læseprøven",description:"Niveaudelte læseprøver 6.–9. klasse med strategi-profil og opfølgning.",minGrade:6,status:"live",href:"/grammar/laeseproeve"},
   {id:"spelling-exam",title:"Træn retskrivningsprøven",description:"Niveaudelt prøveform med diktat og prøve-lignende retskrivningsopgaver.",minGrade:6,status:"live",href:"/grammar/retskrivningsproeve"}
  ]
 }
];

export function danishGradeBand(grade:number|null|undefined){
 if(grade==null)return"Åben progression";
 if(grade<=2)return"1.–2. klasse";
 if(grade<=4)return"3.–4. klasse";
 if(grade<=6)return"5.–6. klasse";
 if(grade<=9)return"7.–9. klasse";
 return"10. klasse";
}

export function danishSkillsForGrade(area:DanishCompetencyArea,grade:number|null|undefined){
 if(grade==null)return area.skills;
 return area.skills.filter(skill=>skill.minGrade<=grade);
}
