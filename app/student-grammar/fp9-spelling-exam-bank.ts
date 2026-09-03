import {studentFriendlyDanishQuestion} from "../../lib/danishStudentLanguage";
import {authenticSpellingBanks,type AuthenticSpellingTask} from "./fp9-authentic-spelling-bank";

export type SpellingExamQuestion=AuthenticSpellingTask&{
 examSection:(typeof FP9_EXAM_SECTIONS)[number];
};

export const FP9_EXAM_SECTIONS=[
 "Diktat",
 "Ét eller flere ord",
 "Sprogopgave",
 "Fra nutid til datid",
 "Komma",
 "Ret en tekst",
] as const;

export const SPELLING_EXAM_LEVELS={
 6:{title:"6. klasse · Prøveformer i roligt tempo",description:"Træn de samme slags arbejdsformer, som senere møder dig i retskrivningsprøven, med kortere og tydeligere sætninger."},
 7:{title:"7. klasse · Begyndende prøveformat",description:"Arbejd med diktat, ordgrænser, bøjning eller ordklasser, datid, komma og korrektur i et genkendeligt prøveformat."},
 8:{title:"8. klasse · Prøveforberedelse",description:"Et samlet prøvelignende sæt med diktat og de centrale digitale opgavetyper på vej mod FP9."},
 9:{title:"9. klasse · FP9-lignende træning",description:"Et samlet prøvelignende sæt med diktat og varierede retskrivningsopgaver inspireret af formen i de officielle prøver."},
} as const;

function mulberry32(seed:number){
 let value=seed>>>0;
 return()=>{
  value+=0x6d2b79f5;
  let t=value;
  t=Math.imul(t^(t>>>15),t|1);
  t^=t+Math.imul(t^(t>>>7),t|61);
  return((t^(t>>>14))>>>0)/4294967296;
 };
}

function shuffled<T>(items:T[],random:()=>number){
 const result=[...items];
 for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}
 return result;
}

function questionKey(question:AuthenticSpellingTask){return `${question.q}::${question.answer}`}

function prepare(question:AuthenticSpellingTask,section:(typeof FP9_EXAM_SECTIONS)[number],random:()=>number):SpellingExamQuestion{
 const pupil=studentFriendlyDanishQuestion(question);
 const written=pupil.kind==="text"||pupil.kind==="rewrite";
 return{...pupil,options:written?[]:shuffled([...new Set(pupil.options)],random),examSection:section};
}

export function spellingExamVariant(seed:number){return Math.abs(Math.trunc(seed||1))%2===0?"ordklasse":"rigtig-form" as const}

export function buildSpellingExamSet(seed:number,questionCount=30,targetGrade=9):SpellingExamQuestion[]{
 const grade=Math.max(6,Math.min(9,Math.round(targetGrade))) as 6|7|8|9;
 if(questionCount!==30)throw new Error(`Prøveformatet består af 30 delopgaver; modtog ${questionCount}`);
 const random=mulberry32(Number.isFinite(seed)?seed:1),bank=authenticSpellingBanks[grade];
 const variant=spellingExamVariant(seed);
 const pools:Array<[(typeof FP9_EXAM_SECTIONS)[number],AuthenticSpellingTask[]]>=[
  ["Diktat",bank.diktat],
  ["Ét eller flere ord",bank.etEllerFlereOrd],
  ["Sprogopgave",variant==="ordklasse"?bank.ordklasse:bank.rigtigForm],
  ["Fra nutid til datid",bank.datid],
  ["Komma",bank.komma],
  ["Ret en tekst",bank.retEnTekst],
 ];
 const selected:SpellingExamQuestion[]=[];
 const used=new Set<string>();
 for(const[section,pool]of pools){
  const candidates=shuffled(pool,random);
  let added=0;
  for(const question of candidates){
   const key=questionKey(question);if(used.has(key))continue;
   used.add(key);selected.push(prepare(question,section,random));added++;
   if(added===5)break;
  }
  if(added<5)throw new Error(`${section} mangler opgaver på ${grade}.-klasseniveau (${added}/5)`);
 }
 return selected;
}

export function spellingExamSectionCounts(questions:SpellingExamQuestion[]){
 return Object.fromEntries(FP9_EXAM_SECTIONS.map(section=>[section,questions.filter(question=>question.examSection===section).length]));
}
