import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import ts from "typescript";

const root=process.cwd(),nativeRequire=createRequire(import.meta.url),cache=new Map();
function resolveLocal(from,spec){const base=path.resolve(path.dirname(from),spec),c=[base,`${base}.ts`,`${base}.tsx`,path.join(base,"index.ts"),path.join(base,"index.tsx")];const found=c.find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());if(!found)throw new Error(`Could not resolve ${spec}`);return found}
function load(file){const absolute=path.resolve(root,file);if(cache.has(absolute))return cache.get(absolute).exports;const source=fs.readFileSync(absolute,"utf8"),output=ts.transpileModule(source,{fileName:absolute,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,moduleResolution:ts.ModuleResolutionKind.NodeJs}}).outputText,module={exports:{}};cache.set(absolute,module);const req=spec=>spec.startsWith(".")?load(resolveLocal(absolute,spec)):nativeRequire(spec);new Function("require","module","exports","__filename","__dirname",output)(req,module,module.exports,absolute,path.dirname(absolute));return module.exports}

const{buildReadingExamSet,readingQuestionCount,readingWordCount,READING_LEVELS,READING_STRATEGIES}=load("app/student-reading-exam/reading-exam-bank.ts");
const errors=[];
let previousWords=0;
const expectedSections=["Søgelæsning","Informerende tekst","Fortællende tekst","Argumenterende tekst","Fagtekst","Cloze"];

for(const grade of [6,7,8,9]){
 const expected=READING_LEVELS[grade].questionCount;
 let referenceWords=0;
 for(let seed=1;seed<=20;seed++){
  let parts;
  try{parts=buildReadingExamSet(seed,grade)}catch(error){errors.push(`${grade}. klasse seed ${seed}: ${error.message}`);continue}
  const count=readingQuestionCount(parts);if(count!==expected)errors.push(`${grade}. klasse seed ${seed}: expected ${expected} questions, got ${count}`);
  if(parts.length!==6)errors.push(`${grade}. klasse seed ${seed}: expected 6 text sections, got ${parts.length}`);
  for(const section of expectedSections)if(!parts.some(p=>p.section===section))errors.push(`${grade}. klasse seed ${seed}: missing section ${section}`);
  const ids=[];
  for(const part of parts){
   if(!part.text?.trim())errors.push(`${grade}. klasse seed ${seed}: ${part.section} has empty text`);
   if(part.questions.length<5)errors.push(`${grade}. klasse seed ${seed}: ${part.section} has fewer than 5 questions`);
   for(const question of part.questions){
    ids.push(question.id);
    if(!question.q?.trim()||!question.answer?.trim()||!question.explanation?.trim())errors.push(`${grade}. klasse ${question.id}: missing prompt/answer/explanation`);
    if(!Array.isArray(question.options)||question.options.length<3)errors.push(`${grade}. klasse ${question.id}: fewer than 3 answer options`);
    if(!question.options.includes(question.answer))errors.push(`${grade}. klasse ${question.id}: correct answer missing after shuffle`);
    if(!READING_STRATEGIES.includes(question.strategy))errors.push(`${grade}. klasse ${question.id}: unknown strategy ${question.strategy}`);
    if(question.minGrade>grade)errors.push(`${grade}. klasse ${question.id}: question above target grade leaked into set`);
   }
  }
  if(new Set(ids).size!==ids.length)errors.push(`${grade}. klasse seed ${seed}: duplicate question ids`);
  const words=readingWordCount(parts);if(seed===1)referenceWords=words;else if(words!==referenceWords)errors.push(`${grade}. klasse: word count changes with seed (${referenceWords}/${words})`);
 }
 if(referenceWords<=previousWords)errors.push(`${grade}. klasse: text amount ${referenceWords} words does not exceed previous level ${previousWords}`);
 previousWords=referenceWords;
 const sample=buildReadingExamSet(1,grade),strategies=new Set(sample.flatMap(p=>p.questions.map(q=>q.strategy)));
 if(grade>=8&&strategies.size<7)errors.push(`${grade}. klasse: only ${strategies.size} reading strategies represented`);
 console.log(`${grade}. klasse: ${expected} questions · ${referenceWords} words · ${strategies.size} strategies`);
}

if(errors.length){console.error(`Reading exam validation failed with ${errors.length} issue(s):`);for(const error of errors)console.error(`- ${error}`);process.exit(1)}
console.log("Reading exam validation passed: graded 6.–9. class sets with increasing text load and strategy coverage.");
