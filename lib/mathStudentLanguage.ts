import type {TrainingQuestion} from "./freeTrainingQuestions";

function lowerFirst(text:string){return text?text.charAt(0).toLowerCase()+text.slice(1):text}

function cleanQuestion(text:string){
 const q=text.trim();
 let match:RegExpMatchArray|null;

 if((match=q.match(/^Hvad er smartest til (.+)\?$/)))return `Hvilken metode er smartest, hvis du skal regne ${match[1]}?`;
 if((match=q.match(/^Hvad er en smart vej til (.+)\?$/)))return `Hvilken metode kan gøre det lettere at regne ${match[1]}?`;
 if((match=q.match(/^Hvordan kan (.+) regnes smart\?$/)))return `Hvordan kan du regne ${match[1]} på en smart måde?`;
 if((match=q.match(/^Hvilken strategi hjælper ved (.+)\?$/)))return `Hvilken strategi kan hjælpe dig med at regne ${match[1]}?`;
 if((match=q.match(/^Hvad kommer næste\? (.+)$/)))return `Hvilket tal kommer som det næste? ${match[1]}`;
 if((match=q.match(/^(.+) Næste tal\?$/)))return `${match[1]} Hvilket tal kommer som det næste?`;

 if((match=q.match(/^(.+)\. Omkredsen er…$/)))return `${match[1]}. Hvad er omkredsen?`;
 if((match=q.match(/^(.+)\. Omkreds\?$/)))return `${match[1]}. Hvad er omkredsen?`;
 if((match=q.match(/^(.+)\. Rumfang\?$/)))return `${match[1]}. Hvad er rumfanget?`;
 if((match=q.match(/^(.+)\. Højden er…$/)))return `${match[1]}. Hvad er højden?`;
 if((match=q.match(/^(.+)\. Den sidste er…$/)))return `${match[1]}. Hvor stor er den sidste vinkel?`;

 if(q==="En fair sekssidet terning: sandsynlighed for at slå 6?")return "Du kaster en almindelig sekssidet terning. Hvad er sandsynligheden for at slå en 6'er?";
 if(q==="En pose har 3 røde og 1 blå kugle. P(blå)?")return "En pose har 3 røde kugler og 1 blå kugle. Hvad er sandsynligheden for at trække den blå kugle?";
 if((match=q.match(/^En vinkel på (.+) er…$/)))return `En vinkel er ${match[1]}. Hvilken type vinkel er det?`;
 if((match=q.match(/^Vinkelsummen i en (.+) er…$/)))return `Hvor stor er vinkelsummen i en ${match[1]}?`;
 if((match=q.match(/^To nabovinkler på en ret linje er (.+) og…$/)))return `Den ene af to nabovinkler på en ret linje er ${match[1]}. Hvor stor er den anden vinkel?`;
 if((match=q.match(/^(.+ vinkelsum) er…$/)))return `Hvad er ${lowerFirst(match[1])}?`;

 return q.replace(/\s+\?/g,"?");
}

function cleanExplanation(text:string){
 let why=text.trim();
 why=why
  .replace(/^Divider begge led med /,"Du kan forkorte forholdet ved at dividere begge tal med ")
  .replace(/^Indsæt ([^ ]+) for ([^.]+)\.?$/,"Sæt $1 ind i stedet for $2.")
  .replace(/^Parentesen er /,"Regn først parentesen: ")
  .replace(/^Parentes /,"Regn først parentesen: ");
 if(why&&!/[.!?°]$/.test(why))why+=".";
 return why;
}

export function studentFriendlyMathQuestion(question:TrainingQuestion):TrainingQuestion{
 return {...question,q:cleanQuestion(question.q),why:cleanExplanation(question.why)};
}

export function studentFriendlyMathQuestions(questions:TrainingQuestion[]){
 return questions.map(studentFriendlyMathQuestion);
}
