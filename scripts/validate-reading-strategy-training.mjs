import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import ts from "typescript";

const root=process.cwd(),nativeRequire=createRequire(import.meta.url),cache=new Map();
function resolveLocal(from,spec){const base=path.resolve(path.dirname(from),spec),c=[base,`${base}.ts`,`${base}.tsx`,path.join(base,"index.ts"),path.join(base,"index.tsx")];const found=c.find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());if(!found)throw new Error(`Could not resolve ${spec}`);return found}
function load(file){const absolute=path.resolve(root,file);if(cache.has(absolute))return cache.get(absolute).exports;const source=fs.readFileSync(absolute,"utf8"),output=ts.transpileModule(source,{fileName:absolute,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,moduleResolution:ts.ModuleResolutionKind.NodeJs}}).outputText,module={exports:{}};cache.set(absolute,module);const req=spec=>spec.startsWith(".")?load(resolveLocal(absolute,spec)):nativeRequire(spec);new Function("require","module","exports","__filename","__dirname",output)(req,module,module.exports,absolute,path.dirname(absolute));return module.exports}

const{READING_STRATEGIES}=load("app/student-reading-exam/reading-exam-bank.ts");
const{strategyTrainingPassages,strategyTrainingAvailableCount,buildStrategyTrainingRound}=load("app/student-reading-training/strategy-training-bank.ts");
const passages=strategyTrainingPassages(),errors=[];
const expectedMinimum={6:6,7:7,8:8,9:9};
const allIds=new Set();

for(const strategy of READING_STRATEGIES){
 const passage=passages[strategy];
 if(!passage){errors.push(`${strategy}: mangler træningspassage`);continue}
 if(!passage.title?.trim()||!passage.genre?.trim())errors.push(`${strategy}: mangler titel/genre`);
 for(const grade of [6,7,8,9]){
  if(!passage.blocks[grade]?.trim())errors.push(`${strategy}: mangler tekstblok til ${grade}. klasse`);
  const available=strategyTrainingAvailableCount(strategy,grade);
  if(available<expectedMinimum[grade])errors.push(`${strategy} · ${grade}. klasse: kun ${available}, forventer mindst ${expectedMinimum[grade]}`);
  const round=buildStrategyTrainingRound(strategy,grade,[],3,grade*101);
  if(round.questions.length!==3)errors.push(`${strategy} · ${grade}. klasse: runden har ${round.questions.length}, forventer 3`);
  if(new Set(round.questions.map(q=>q.id)).size!==round.questions.length)errors.push(`${strategy} · ${grade}. klasse: dubletter i runden`);
  const seen=round.questions.map(q=>q.id),second=buildStrategyTrainingRound(strategy,grade,seen,3,grade*211);
  if(available>=6&&second.questions.some(q=>seen.includes(q.id)))errors.push(`${strategy} · ${grade}. klasse: retry genbruger spørgsmål selv om mindst 3 usete findes`);
 }
 for(const[index,question]of passage.questions.entries()){
  if(!question.id?.trim()||!question.q?.trim()||!question.answer?.trim()||!question.why?.trim())errors.push(`${strategy}[${index}]: mangler id/spørgsmål/svar/forklaring`);
  if(question.strategy!==strategy)errors.push(`${strategy}[${index}]: forkert strategitag ${question.strategy}`);
  if(![6,7,8,9].includes(question.minGrade))errors.push(`${strategy}[${index}]: ugyldigt minGrade ${question.minGrade}`);
  if(!Array.isArray(question.options)||question.options.length<3)errors.push(`${strategy}[${index}]: for få svarmuligheder`);
  if(!question.options.includes(question.answer))errors.push(`${strategy}[${index}]: korrekt svar mangler i svarmuligheder`);
  if(new Set(question.options).size!==question.options.length)errors.push(`${strategy}[${index}]: dublerede svarmuligheder`);
  if(allIds.has(question.id))errors.push(`${strategy}[${index}]: dubleret id ${question.id}`);allIds.add(question.id);
 }
}

if(Object.keys(passages).length!==READING_STRATEGIES.length)errors.push(`Forventede ${READING_STRATEGIES.length} strategipassager, fandt ${Object.keys(passages).length}`);
if(errors.length){console.error(`Reading strategy training validation failed with ${errors.length} issue(s):`);for(const error of errors)console.error(`- ${error}`);process.exit(1)}
console.log(`Reading strategy training validation passed: ${READING_STRATEGIES.length} strategies · ${allIds.size} questions · grade 6–9 progression · fresh retry coverage.`);
