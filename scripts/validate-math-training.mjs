import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadTs(file){
 const source=fs.readFileSync(file,"utf8");
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const module={exports:{}};
 const sandbox={module,exports:module.exports,require:(name)=>{throw new Error(`Unexpected runtime import ${name} from ${file}`)},console};
 vm.runInNewContext(js,sandbox,{filename:file});
 return module.exports;
}

const {trainingCatalog}=loadTs("lib/trainingCatalog.ts");
const {freeTrainingQuestions}=loadTs("lib/freeTrainingQuestions.ts");
const {mathExtraQuestions}=loadTs("lib/mathExtraQuestions.ts");
const {mathSkillMinimumGrade,mathLevelMinimumGrade}=loadTs("lib/mathProgression.ts");
const math=trainingCatalog.find(subject=>subject.id==="matematik");
if(!math)throw new Error("Matematik mangler i trainingCatalog");

const errors=[];
let definitions=0,pools=0;
const catalogSkills=new Set();
for(const area of math.areas){
 for(const skill of area.skills){
  catalogSkills.add(skill);
  if(!(skill in mathSkillMinimumGrade))errors.push(`${area.title} · ${skill}: mangler minimumsklassetrin`);
  const core=freeTrainingQuestions.matematik?.[area.id]?.[skill]||{};
  const extra=mathExtraQuestions[area.id]?.[skill]||{};
  const levels=new Set([...Object.keys(core),...Object.keys(extra)]);
  const usable=[...levels].filter(level=>(core[level]?.length||0)+(extra[level]?.length||0)>=5);
  if(!usable.length)errors.push(`${area.title} · ${skill}: ingen træningsbank med mindst 5 opgaver`);
 }
}

for(const [areaId,skills] of Object.entries(mathExtraQuestions)){
 const catalogArea=math.areas.find(area=>area.id===areaId);
 if(!catalogArea)errors.push(`Ekstra matematikbank bruger ukendt område: ${areaId}`);
 for(const [skill,levels] of Object.entries(skills)){
  if(!catalogSkills.has(skill))errors.push(`${areaId} · ${skill}: findes i banken men ikke i kataloget`);
  for(const [level,questions] of Object.entries(levels)){
   pools++;
   if(!(level in mathLevelMinimumGrade))errors.push(`${areaId} · ${skill} · ${level}: ukendt niveau`);
   if(questions.length<5)errors.push(`${areaId} · ${skill} · ${level}: kun ${questions.length} opgaver`);
   definitions+=questions.length;
   questions.forEach((q,index)=>{
    if(!q?.q?.trim())errors.push(`${areaId} · ${skill} · ${level}[${index}]: mangler spørgsmål`);
    if(!Array.isArray(q.options)||q.options.length<2)errors.push(`${areaId} · ${skill} · ${level}[${index}]: mangler svarmuligheder`);
    if(!q.options?.includes(q.answer))errors.push(`${areaId} · ${skill} · ${level}[${index}]: korrekt svar '${q.answer}' findes ikke i mulighederne`);
    if(!q?.why?.trim())errors.push(`${areaId} · ${skill} · ${level}[${index}]: mangler forklaring`);
   });
  }
 }
}

for(let grade=0;grade<=10;grade++){
 for(const area of math.areas){
  for(const skill of area.skills){
   if((mathSkillMinimumGrade[skill]??0)>grade)continue;
   const core=freeTrainingQuestions.matematik?.[area.id]?.[skill]||{};
   const extra=mathExtraQuestions[area.id]?.[skill]||{};
   const levels=new Set([...Object.keys(core),...Object.keys(extra)]);
   const available=[...levels].filter(level=>(mathLevelMinimumGrade[level]??99)<=grade&&((core[level]?.length||0)+(extra[level]?.length||0)>=5));
   if(!available.length)errors.push(`${grade}. klasse · ${area.title} · ${skill}: emnet er åbent efter progressionen, men ingen bank er tilgængelig`);
  }
 }
}

if(errors.length){console.error(`Math validation failed with ${errors.length} issue(s):`);errors.slice(0,80).forEach(error=>console.error(`- ${error}`));process.exit(1)}
console.log(`Math validation passed: ${math.areas.length} areas, ${catalogSkills.size} skills, ${pools} expanded pools and ${definitions} new question definitions checked.`);
