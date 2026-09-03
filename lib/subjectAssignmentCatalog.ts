export type AssignmentKind="danish_writing"|"danish_analysis"|"math_task"|"generic";

export type AssignmentTemplate={
  id:string;
  name:string;
  kind:AssignmentKind;
  description:string;
  structure:string[];
  checklist:string[];
  coach:string;
};

export const mathAssignmentTemplates:AssignmentTemplate[]=[
  {id:"regneopgaver",name:"Regneopgaver",kind:"math_task",description:"Løs opgaverne og vis nok af din metode til, at man kan følge din tænkning.",structure:["Svar og beregninger","Vis din metode / mellemregninger"],checklist:["Jeg har svaret på alle delopgaver","Mine mellemregninger kan følges","Jeg har tjekket fortegn, decimaler og enheder"],coach:"Skriv ikke kun resultatet. Vis de vigtigste trin i din beregning."},
  {id:"problemlosning",name:"Problemløsning",kind:"math_task",description:"Undersøg problemet, vælg en strategi og begrund din løsning.",structure:["Hvad ved du, og hvad skal du finde?","Din plan","Beregninger og løsning","Svar med enhed og forklaring","Tjek: giver svaret mening?"],checklist:["Jeg har fundet de relevante oplysninger","Jeg har valgt en metode og forklaret den","Mit svar passer til spørgsmålet","Jeg har vurderet, om resultatet er rimeligt"],coach:"Start med at oversætte teksten til matematik. Hvad er kendt, hvad er ukendt, og hvilke relationer er der?"},
  {id:"undersogelse",name:"Matematisk undersøgelse",kind:"math_task",description:"Undersøg et mønster eller en sammenhæng og beskriv, hvad du opdager.",structure:["Hvad undersøger du?","Data, tegning eller beregninger","Hvilket mønster ser du?","Forklaring og konklusion"],checklist:["Jeg har undersøgt mere end ét eksempel","Jeg viser data eller beregninger","Jeg skelner mellem det jeg observerer og det jeg konkluderer","Jeg forklarer mit mønster med matematiske ord"],coach:"Prøv flere eksempler før du konkluderer. Et mønster skal kunne forklares, ikke kun ses."},
  {id:"anvendt-matematik",name:"Anvendt matematik",kind:"math_task",description:"Brug matematik til en situation fra virkeligheden.",structure:["Oplysninger og antagelser","Model og beregninger","Resultat","Hvad betyder resultatet i situationen?"],checklist:["Jeg har valgt relevante oplysninger","Mine antagelser er tydelige","Jeg bruger korrekte enheder","Jeg fortolker resultatet i virkeligheden"],coach:"Et tal er først et svar, når du forklarer, hvad tallet betyder i den konkrete situation."},
  {id:"forklar-metode",name:"Forklar din metode",kind:"math_task",description:"Løs opgaven og gør din matematiske tankegang synlig.",structure:["Din løsning","Forklar trin for trin","En anden mulig metode eller et tjek"],checklist:["Jeg forklarer hvorfor mine trin virker","Jeg bruger matematiske begreber præcist","Jeg har kontrolleret resultatet"],coach:"Forestil dig, at en anden elev skal kunne lære metoden af din forklaring."},
  {id:"argumentation",name:"Matematisk argumentation",kind:"math_task",description:"Tag stilling til en matematisk påstand og begrund den.",structure:["Påstand / hvad skal afgøres?","Begrundelse","Eksempel, mod-eksempel eller beregning","Konklusion"],checklist:["Min begrundelse støtter faktisk konklusionen","Jeg bruger eksempler som dokumentation — ikke som eneste bevis, hvis der kræves en generel forklaring","Jeg bruger matematiske begreber korrekt"],coach:"Spørg: Hvorfor må det være sådan? Et godt matematisk argument forbinder påstand og begrundelse tydeligt."},
];

export const genericAssignmentTemplates:AssignmentTemplate[]=[
  {id:"opgave",name:"Opgave",kind:"generic",description:"En almindelig faglig opgave med plads til elevens besvarelse.",structure:["Besvarelse"],checklist:["Jeg har svaret på hele opgaven","Jeg har brugt fagets begreber","Jeg har læst min besvarelse igennem"],coach:"Svar præcist på det, opgaven spørger om, og brug faglige begreber hvor de hjælper."},
  {id:"undersogelse",name:"Undersøgelse",kind:"generic",description:"Undersøg et spørgsmål og saml dokumentation før konklusionen.",structure:["Spørgsmål og første tanker","Undersøgelse / dokumentation","Hvad fandt du?","Konklusion"],checklist:["Jeg har brugt relevant dokumentation","Jeg skelner mellem observation og konklusion","Jeg kan forklare, hvordan jeg kom frem til mit svar"],coach:"Saml belæg først. Konklusionen skal vokse ud af det, du faktisk har undersøgt."},
  {id:"produkt",name:"Produkt / fremlæggelse",kind:"generic",description:"Planlæg og dokumentér et fagligt produkt eller en fremlæggelse.",structure:["Idé og formål","Fagligt indhold","Plan / produkt","Eftertanke: hvad viser produktet?"],checklist:["Produktet svarer på opgaven","Det faglige indhold er tydeligt","Jeg kan forklare mine valg"],coach:"Lad formen hjælpe indholdet. Det vigtigste er, at produktet viser det faglige arbejde tydeligt."},
];

export function templatesForSubject(slug:string|null|undefined){
  if(slug==="matematik")return mathAssignmentTemplates;
  if(slug==="dansk")return [];
  return genericAssignmentTemplates;
}

export function templateForAssignment(kind:string|undefined,type:string|undefined):AssignmentTemplate|null{
  const pools=kind==="math_task"?mathAssignmentTemplates:kind==="generic"?genericAssignmentTemplates:[];
  return pools.find(t=>t.name===type||t.id===type)||null;
}
