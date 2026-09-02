import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import ts from "typescript";

const root=process.cwd(),nativeRequire=createRequire(import.meta.url),cache=new Map();
function resolveLocal(from,spec){const base=path.resolve(path.dirname(from),spec),c=[base,`${base}.ts`,`${base}.tsx`,path.join(base,"index.ts"),path.join(base,"index.tsx")];const found=c.find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());if(!found)throw new Error(`Could not resolve ${spec}`);return found}
function load(file){const absolute=path.resolve(root,file);if(cache.has(absolute))return cache.get(absolute).exports;const source=fs.readFileSync(absolute,"utf8"),output=ts.transpileModule(source,{fileName:absolute,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,moduleResolution:ts.ModuleResolutionKind.NodeJs}}).outputText,module={exports:{}};cache.set(absolute,module);const req=spec=>spec.startsWith(".")?load(resolveLocal(absolute,spec)):nativeRequire(spec);new Function("require","module","exports","__filename","__dirname",output)(req,module,module.exports,absolute,path.dirname(absolute));return module.exports}

const{buildSpellingExamSet,FP9_EXAM_SECTIONS}=load("app/student-grammar/fp9-spelling-exam-bank.ts");
const{spellingTrapsLibrary}=load("app/student-grammar/spelling-traps-extra.ts");
const errors=[];

for(const[topic,levels]of Object.entries(spellingTrapsLibrary))for(const[level,questions]of Object.entries(levels)){
 if(questions.length<5)errors.push(`${topic}.${level}: fewer than 5 questions`);
 for(const[index,q]of questions.entries()){
  if(!q.q?.trim()||!q.answer?.trim()||!q.why?.trim())errors.push(`${topic}.${level}[${index}]: missing question/answer/explanation`);
  if(q.kind!=="text"&&q.kind!=="rewrite"&&(!Array.isArray(q.options)||!q.options.includes(q.answer)))errors.push(`${topic}.${level}[${index}]: correct answer missing from options`);
 }
}

for(let seed=1;seed<=40;seed++){
 let exam;
 try{exam=buildSpellingExamSet(seed,30)}catch(error){errors.push(`seed ${seed}: ${error.message}`);continue}
 if(exam.length!==30)errors.push(`seed ${seed}: expected 30 questions, got ${exam.length}`);
 const keys=new Set(exam.map(q=>`${q.q}::${q.answer}`));if(keys.size!==exam.length)errors.push(`seed ${seed}: duplicate questions`);
 for(const section of FP9_EXAM_SECTIONS){const count=exam.filter(q=>q.examSection===section).length;if(count!==5)errors.push(`seed ${seed}: ${section} has ${count}, expected 5`)}
 for(const[index,q]of exam.entries())if(q.kind!=="text"&&q.kind!=="rewrite"&&!q.options.includes(q.answer))errors.push(`seed ${seed}, question ${index+1}: shuffled options lost correct answer`);
}

if(errors.length){console.error(`FP9 spelling exam validation failed with ${errors.length} issue(s):`);for(const error of errors)console.error(`- ${error}`);process.exit(1)}
console.log(`FP9 spelling exam validation passed: 40 deterministic 30-question sets, 6 sections × 5 questions.`);
