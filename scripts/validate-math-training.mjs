import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadTs(file){
 const source=fs.readFileSync(file,"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 const sandbox={module,exports:module.exports,require:(name)=>{if(name.startsWith("./"))return {};throw new Error(`Unexpected runtime import ${name} from ${file}`)},console};
 vm.runInNewContext(js,sandbox,{filename:file});
 return module.exports;
}

const {trainingCatalog}=loadTs("lib/trainingCatalog.ts");
const {freeTrainingQuestions}=loadTs("lib/freeTrainingQuestions.ts");
const {mathExtraQuestions}=loadTs("lib/mathExtraQuestions.ts");
const {mathGapQuestions}=loadTs("lib/mathGapQuestions.ts");
const {mathSkillMinimumGrade,mathLevelMinimumGrade}=loadTs("lib/mathProgression.ts");
const {studentFriendlyMathQuestion}=loadTs("lib/mathStudentLanguage.ts");
const {freshTrainingRound,trainingQuestionKey}=loadTs("lib/trainingRound.ts");
const math=trainingCatalog.find(subject=>subject.id==="matematik");
if(!math)throw new Error("Matematik mangler i trainingCatalog");

const errors=[];
let definitions=0,pools=0,wordingChecks=0;
const catalogSkills=new Set();
const sources=[
 {name:"core",bank:freeTrainingQuestions.matematik||{}},
 {name:"extra",bank:mathExtraQuestions||{}},
 {name:"gap",bank:mathGapQuestions||{}},
];

function poolParts(areaId,skill,level){return sources.map(source=>source.bank?.[areaId]?.[skill]?.[level]||[])}
function poolSize(areaId,skill,level){return poolParts(areaId,skill,level).reduce((sum,rows)=>sum+rows.length,0)}
function knownLevels(areaId,skill){const levels=new Set();for(const source of sources)Object.keys(source.bank?.[areaId]?.[skill]||{}).forEach(level=>levels.add(level));return [...levels]}

for(const area of math.areas){
 for(const skill of area.skills){
  catalogSkills.add(skill);
  if(!(skill in mathSkillMinimumGrade))errors.push(`${area.title} · ${skill}: mangler minimumsklassetrin`);
  const levels=knownLevels(area.id,skill);
  const usable=levels.filter(level=>poolSize(area.id,skill,level)>=5);
  if(!usable.length)errors.push(`${area.title} · ${skill}: ingen træningsbank med mindst 5 opgaver`);
 }
}

for(const source of sources.slice(1)){
 for(const [areaId,skills] of Object.entries(source.bank)){
  const catalogArea=math.areas.find(area=>area.id===areaId);
  if(!catalogArea)errors.push(`${source.name}: ukendt matematikområde ${areaId}`);
  for(const [skill,levels] of Object.entries(skills)){
   if(!catalogSkills.has(skill))errors.push(`${source.name} · ${areaId} · ${skill}: findes i banken men ikke i kataloget`);
   for(const [level,questions] of Object.entries(levels)){
    pools++;
    if(!(level in mathLevelMinimumGrade))errors.push(`${source.name} · ${areaId} · ${skill} · ${level}: ukendt niveau`);
    if(questions.length<5)errors.push(`${source.name} · ${areaId} · ${skill} · ${level}: kun ${questions.length} opgaver`);
    definitions+=questions.length;
    questions.forEach((question,index)=>{
     if(!question?.q?.trim())errors.push(`${source.name} · ${areaId} · ${skill} · ${level}[${index}]: mangler spørgsmål`);
     if(!Array.isArray(question.options)||question.options.length<2)errors.push(`${source.name} · ${areaId} · ${skill} · ${level}[${index}]: mangler svarmuligheder`);
     if(!question.options?.includes(question.answer))errors.push(`${source.name} · ${areaId} · ${skill} · ${level}[${index}]: korrekt svar '${question.answer}' findes ikke i mulighederne`);
     if(!question?.why?.trim())errors.push(`${source.name} · ${areaId} · ${skill} · ${level}[${index}]: mangler forklaring`);
    });
   }
  }
 }
}

const awkwardDisplayPatterns=[
 /^Hvad er smartest til /,
 /^Hvad er en smart vej til /,
 /^Hvad kommer næste\?/,
 / Næste tal\?$/,
 /\. Omkreds\?$/,
 /\. Omkredsen er…$/,
 /\. Rumfang\?$/,
 /P\([^)]+\)\?$/
];
for(const source of sources){
 for(const [areaId,skills] of Object.entries(source.bank))for(const [skill,levels] of Object.entries(skills))for(const [level,questions] of Object.entries(levels)){
  questions.forEach((question,index)=>{
   const displayed=studentFriendlyMathQuestion(question);
   wordingChecks++;
   if(displayed.answer!==question.answer||displayed.options!==question.options)errors.push(`${source.name} · ${areaId} · ${skill} · ${level}[${index}]: elevsprogs-laget må ikke ændre svar eller svarmuligheder`);
   const pattern=awkwardDisplayPatterns.find(candidate=>candidate.test(displayed.q));
   if(pattern)errors.push(`${source.name} · ${areaId} · ${skill} · ${level}[${index}]: rå formulering når eleven: '${displayed.q}'`);
  });
 }
}

const retryPool=Array.from({length:12},(_,index)=>({q:`Testspørgsmål ${index+1}?`,options:["A","B"],answer:"A",why:"Test."}));
const first=freshTrainingRound(retryPool,new Set(),"first",5,new Set());
const firstKeys=new Set(first.map(trainingQuestionKey));
const second=freshTrainingRound(retryPool,firstKeys,"second",5,firstKeys);
const secondKeys=new Set(second.map(trainingQuestionKey));
if(first.length!==5||second.length!==5)errors.push("Fresh retry: en fuld bank skal give fem spørgsmål pr. runde");
if([...firstKeys].some(key=>secondKeys.has(key)))errors.push("Fresh retry: anden runde genbruger spørgsmål, selv om banken har mindst fem usete");
const allSeen=new Set(retryPool.map(trainingQuestionKey));
const third=freshTrainingRound(retryPool,allSeen,"third",5,secondKeys);
const thirdKeys=new Set(third.map(trainingQuestionKey));
if([...secondKeys].some(key=>thirdKeys.has(key)))errors.push("Fresh retry: efter hele banken er set skal den umiddelbart forrige runde undgås, når banken er stor nok");

let gradeSkillChecks=0;
for(let grade=0;grade<=10;grade++){
 for(const area of math.areas){
  for(const skill of area.skills){
   if((mathSkillMinimumGrade[skill]??0)>grade)continue;
   const available=knownLevels(area.id,skill).filter(level=>(mathLevelMinimumGrade[level]??99)<=grade&&poolSize(area.id,skill,level)>=5);
   gradeSkillChecks++;
   if(!available.length)errors.push(`${grade}. klasse · ${area.title} · ${skill}: emnet er åbent efter progressionen, men ingen bank er tilgængelig`);
  }
 }
}

if(errors.length){console.error(`Math validation failed with ${errors.length} issue(s):`);errors.slice(0,100).forEach(error=>console.error(`- ${error}`));process.exit(1)}
console.log(`Math validation passed: ${math.areas.length} areas, ${catalogSkills.size} skills, ${pools} expanded/gap pools, ${definitions} added question definitions, ${gradeSkillChecks} grade-skill checks, ${wordingChecks} pupil-wording checks and fresh retry behaviour.`);
