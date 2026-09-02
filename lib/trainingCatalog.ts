export type TrainingLevel={id:string;title:string;stage:string;description:string};
export type TrainingArea={id:string;title:string;description:string;skills:string[]};
export type TrainingSubject={id:string;title:string;description:string;levels:TrainingLevel[];areas:TrainingArea[]};

export const trainingCatalog:TrainingSubject[]=[
 {id:'dansk-grammatik',title:'Grammatik',description:'Træn sprogets byggesten, sætninger og sproglig effekt.',levels:[
  {id:'start',title:'Start',stage:'Tidligt niveau',description:'Genkend ord, sætninger og helt grundlæggende mønstre.'},
  {id:'basis',title:'Basis',stage:'Grundlæggende',description:'Forstå de centrale begreber og brug dem sikkert.'},
  {id:'traening',title:'Træning',stage:'Sikkert niveau',description:'Arbejd selvstændigt med begreberne i flere sammenhænge.'},
  {id:'udfordring',title:'Udfordring',stage:'Avanceret',description:'Analysér, begrund og brug sproget bevidst.'},
  {id:'anvendt',title:'Anvendt',stage:'I egne tekster',description:'Brug grammatikken aktivt til at forbedre autentiske tekster.'}
 ],areas:[
  {id:'ordklasser',title:'Ordklasser',description:'Fra at genkende ord til at bruge ordklasser bevidst.',skills:['Navneord','Udsagnsord','Tillægsord','Stedord','Biord']},
  {id:'saetninger',title:'Sætninger',description:'Hvordan sætninger bygges, varieres og virker.',skills:['Grundled og udsagnsled','Genstandsled','Omsagnsled','Hel- og ledsætninger']},
  {id:'komma',title:'Komma',description:'Tegnsætning fra enkle mønstre til sikre valg.',skills:['Komma mellem helsætninger','Komma ved ledsætninger','Kommaøvelser']},
  {id:'sprog-der-virker',title:'Sprog der virker',description:'Fra grammatisk form til funktion og effekt.',skills:['Form → funktion → effekt','Præcise verber','Variation i sætninger','Sproglig effekt']}
 ]},
 {id:'matematik',title:'Matematik',description:'Talforståelse, regnestrategier, geometri, algebra, data, problemløsning og matematisk ræsonnement.',levels:[
  {id:'talstart',title:'Talstart',stage:'Tidligt',description:'Tal, mængder, mønstre og de første regnehandlinger.'},
  {id:'grund',title:'Grund',stage:'Grundlæggende',description:'Sikkerhed i regning, enheder og centrale matematiske begreber.'},
  {id:'mellem',title:'Mellem',stage:'Mellemtrin',description:'Brøker, procent, geometri, data og begyndende algebra.'},
  {id:'udskoling',title:'Udskoling',stage:'Avanceret',description:'Algebra, funktioner, statistik, sandsynlighed, argumentation og modeller.'},
  {id:'anvendt',title:'Anvendt matematik',stage:'Virkelige problemer',description:'Budgetter, måling, modeller, overslag og problemløsning i autentiske situationer.'}
 ],areas:[
  {id:'tal-regning',title:'Tal & regning',description:'Talforståelse, regnearter og strategier fra konkrete mængder til potenser.',skills:['Tal og mængder','Plus og minus','Gange og division','Regnestrategier','Negative tal','Regnearternes rækkefølge','Potenser og rødder']},
  {id:'broeker-procent',title:'Brøker, decimaltal & procent',description:'Dele, forhold og proportionalitet i forskellige repræsentationer.',skills:['Brøker','Decimaltal','Procent','Forhold','Proportionalitet']},
  {id:'geometri',title:'Geometri & måling',description:'Former, mål, koordinater, vinkler og skalering.',skills:['Længde og enheder','Omkreds','Areal','Rumfang','Geometriske figurer','Vinkler','Koordinatsystem','Målestoksforhold']},
  {id:'algebra',title:'Algebra & funktioner',description:'Mønstre, variable, ligninger, formler og sammenhænge.',skills:['Mønstre','Variable','Ligninger','Funktioner','Formler']},
  {id:'data',title:'Data & sandsynlighed',description:'Læs, behandl, beskriv og vurder data og tilfældighed.',skills:['Tabeller og diagrammer','Gennemsnit, median og typetal','Statistik','Sandsynlighed','Kritisk dataforståelse']},
  {id:'anvendt',title:'Anvendt matematik',description:'Matematik som værktøj i hverdagen og virkelige problemstillinger.',skills:['Penge og budget','Tid og planlægning','Måling i praksis','Problemløsning og modeller','Overslag og rimelighed']},
  {id:'taenkning',title:'Matematisk tænkning',description:'Forklar, vælg strategi, argumentér og byg modeller — ikke kun regn svaret ud.',skills:['Forklar din metode','Strategivalg','Matematisk argumentation','Modellering']}
 ]}
];
