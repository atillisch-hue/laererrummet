import type {TrainingQuestion} from "./freeTrainingQuestions";

function cleanQuestion(text:string){
 let q=text.trim();
 const replacements:Array<[RegExp,string|((...args:string[])=>string)]>=[
  [/^Hvad er smartest til (.+)\?$/,(...m)=>`Hvilken metode er smartest, hvis du skal regne ${m[1]}?`],
  [/^Hvad er en smart vej til (.+)\?$/,(...m)=>`Hvilken metode kan gøre det lettere at regne ${m[1]}?`],
  [/^Hvordan kan (.+) regnes smart\?$/,(...m)=>`Hvordan kan du regne ${m[1]} på en smart måde?`],
  [/^Hvilken strategi hjælper ved (.+)\?$/,(...m)=>`Hvilken strategi kan hjælpe dig med at regne ${m[1]}?`],
  [/^Hvad kommer næste\? (.+)$/,(...m)=>`Hvilket tal kommer som det næste? ${m[1]}`],
  [/^(.+) Næste tal\?$/,(...m)=>`${m[1]} Hvilket tal kommer som det næste?`],
  [/^(.+) Omkreds\?$/,(...m)=>`${m[1]} Hvad er omkredsen?`],
  [/^(.+) Rumfang\?$/,(...m)=>`${m[1]} Hvad er rumfanget?`],
  [/^En fair sekssidet terning: sandsynlighed for at slå 6\?$/,"Du kaster en almindelig sekssidet terning. Hvad er sandsynligheden for at slå en 6'er?"],
  [/^En pose har 3 røde og 1 blå kugle\. P\(blå\)\?$/,"En pose har 3 røde kugler og 1 blå kugle. Hvad er sandsynligheden for at trække den blå kugle?"],
  [/^En vinkel på (.+) er…$/,(...m)=>`En vinkel er ${m[1]}. Hvilken type vinkel er det?`],
  [/^Vinkelsummen i en (.+) er…$/,(...m)=>`Hvor stor er vinkelsummen i en ${m[1]}?`],
  [/^(.+) er…$/,(...m)=>`Hvad er ${m[1].charAt(0).toLowerCase()+m[1].slice(1)}?`]
 ];
 for(const[pattern,replacement]of replacements){
  if(pattern.test(q)){
   q=q.replace(pattern,replacement as string);
   break;
  }
 }
 return q.replace(/\s+\?/g,"?");
}

function cleanExplanation(text:string){
 let why=text.trim();
 why=why
  .replace(/^Divider begge led med /,"Du kan forkorte forholdet ved at dividere begge tal med ")
  .replace(/^Indsæt /,"Sæt ")
  .replace(/^Parentesen er /,"Regn først parentesen: ")
  .replace(/^Parentes /,"Regn først parentesen: ")
  .replace(/^P\(/,"Sandsynligheden P(")
  .replace(/; ·/g,". Derefter ganger du med ")
  .replace(/; ·/g,". Derefter ganger du med ");
 if(why&&!/[.!?°]$/.test(why))why+=".";
 return why;
}

export function studentFriendlyMathQuestion(question:TrainingQuestion):TrainingQuestion{
 return {...question,q:cleanQuestion(question.q),why:cleanExplanation(question.why)};
}

export function studentFriendlyMathQuestions(questions:TrainingQuestion[]){
 return questions.map(studentFriendlyMathQuestion);
}
