import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import ts from "typescript";

const root=process.cwd(),nativeRequire=createRequire(import.meta.url),cache=new Map();
function resolveLocal(from,spec){const base=path.resolve(path.dirname(from),spec),c=[base,`${base}.ts`,`${base}.tsx`,path.join(base,"index.ts"),path.join(base,"index.tsx")];const found=c.find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());if(!found)throw new Error(`Could not resolve ${spec}`);return found}
function load(file){const absolute=path.resolve(root,file);if(cache.has(absolute))return cache.get(absolute).exports;const source=fs.readFileSync(absolute,"utf8"),output=ts.transpileModule(source,{fileName:absolute,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,moduleResolution:ts.ModuleResolutionKind.NodeJs}}).outputText,module={exports:{}};cache.set(absolute,module);const req=spec=>spec.startsWith(".")?load(resolveLocal(absolute,spec)):nativeRequire(spec);new Function("require","module","exports","__filename","__dirname",output)(req,module,module.exports,absolute,path.dirname(absolute));return module.exports}

const{buildSpellingExamSet,FP9_EXAM_SECTIONS}=load("app/student-grammar/fp9-spelling-exam-bank.ts");
const{spellingTrapsLibrary}=load("app/student-grammar/spelling-traps-extra.ts");
const{classSpellingSectionAnalysis,classSpellingTopicAnalysis,spellingFollowupTopics}=load("app/grammar/retskrivningsproeve/spelling-diagnostics.ts");
const errors=[];

for(const[topic,levels]of Object.entries(spellingTrapsLibrary))for(const[level,questions]of Object.entries(levels)){
 if(questions.length<5)errors.push(`${topic}.${level}: fewer than 5 questions`);
 for(const[index,q]of questions.entries()){
  if(!q.q?.trim()||!q.answer?.trim()||!q.why?.trim())errors.push(`${topic}.${level}[${index}]: missing question/answer/explanation`);
  if(q.kind!=="text"&&q.kind!=="rewrite"&&(!Array.isArray(q.options)||!q.options.includes(q.answer)))errors.push(`${topic}.${level}[${index}]: correct answer missing from options`);
 }
}

for(const grade of [6,7,8,9])for(let seed=1;seed<=40;seed++){
 let exam;
 try{exam=buildSpellingExamSet(seed,30,grade)}catch(error){errors.push(`${grade}. klasse seed ${seed}: ${error.message}`);continue}
 if(exam.length!==30)errors.push(`${grade}. klasse seed ${seed}: expected 30 questions, got ${exam.length}`);
 const keys=new Set(exam.map(q=>`${q.q}::${q.answer}`));if(keys.size!==exam.length)errors.push(`${grade}. klasse seed ${seed}: duplicate questions`);
 for(const section of FP9_EXAM_SECTIONS){const count=exam.filter(q=>q.examSection===section).length;if(count!==5)errors.push(`${grade}. klasse seed ${seed}: ${section} has ${count}, expected 5`)}
 for(const[index,q]of exam.entries()){
  const minimum=q.minGrade??1,maximum=q.maxGrade??10;
  if(minimum>grade||maximum<grade)errors.push(`${grade}. klasse seed ${seed}, question ${index+1}: question grade ${minimum}-${maximum} leaked into set`);
  if(q.kind!=="text"&&q.kind!=="rewrite"&&!q.options.includes(q.answer))errors.push(`${grade}. klasse seed ${seed}, question ${index+1}: shuffled options lost correct answer`);
 }
}

const diagnosticResults=[
 {student_id:1,student_name:"Elev A",submitted:true,answers:{
  0:{section:"Sprogopgave",sourceTopic:"Nutids-r",correct:false},1:{section:"Sprogopgave",sourceTopic:"Nutids-r",correct:false},2:{section:"Sprogopgave",sourceTopic:"Navneords bøjning",correct:true},3:{section:"Sprogopgave",sourceTopic:"Tillægsords bøjning",correct:true},4:{section:"Sprogopgave",sourceTopic:"Udsagnsords tider",correct:false},
  5:{section:"Ét eller flere ord",sourceTopic:"Stumme bogstaver",correct:false},6:{section:"Ét eller flere ord",sourceTopic:"Stumme bogstaver",correct:false}
 }},
 {student_id:2,student_name:"Elev B",submitted:true,answers:{
  0:{section:"Sprogopgave",sourceTopic:"Nutids-r",correct:false},1:{section:"Sprogopgave",sourceTopic:"Navneords bøjning",correct:true},2:{section:"Sprogopgave",sourceTopic:"Tillægsords bøjning",correct:false},3:{section:"Sprogopgave",sourceTopic:"Udsagnsords tider",correct:true},4:{section:"Sprogopgave",sourceTopic:"Nutids-r",correct:true},
  5:{section:"Ét eller flere ord",sourceTopic:"Stumme bogstaver",correct:false}
 }}
];
const sectionRows=classSpellingSectionAnalysis(diagnosticResults),languageSection=sectionRows.find(row=>row.section==="Sprogopgave");
if(!languageSection||languageSection.status!=="focus")errors.push("diagnostics: expected Sprogopgave to be common focus");
if(!languageSection||languageSection.supportStudents.length!==2)errors.push("diagnostics: expected both synthetic students below 70% in Sprogopgave");
const topicRows=classSpellingTopicAnalysis(diagnosticResults),followups=spellingFollowupTopics(topicRows,10);
if(!followups.some(row=>row.topic==="Nutids-r"))errors.push("diagnostics: live Nutids-r error pattern should be actionable");
if(followups.some(row=>row.topic==="Stumme bogstaver"))errors.push("diagnostics: non-live grammar topic must not be one-click actionable");

if(errors.length){console.error(`Spelling exam validation failed with ${errors.length} issue(s):`);for(const error of errors)console.error(`- ${error}`);process.exit(1)}
console.log(`Spelling exam validation passed: grades 6–9 × 40 deterministic 30-question sets, authentic 6-part structure × 5 questions · diagnostic heatmap and targeted follow-up rules.`);
