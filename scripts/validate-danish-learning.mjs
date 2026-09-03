import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
import ts from "typescript";

const root=process.cwd(),nativeRequire=createRequire(import.meta.url),cache=new Map();
function resolveLocal(from,spec){const base=path.resolve(path.dirname(from),spec),c=[base,`${base}.ts`,`${base}.tsx`,path.join(base,"index.ts"),path.join(base,"index.tsx")];const found=c.find(x=>fs.existsSync(x)&&fs.statSync(x).isFile());if(!found)throw new Error(`Could not resolve ${spec}`);return found}
function load(file){const absolute=path.resolve(root,file);if(cache.has(absolute))return cache.get(absolute).exports;const source=fs.readFileSync(absolute,"utf8"),output=ts.transpileModule(source,{fileName:absolute,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,moduleResolution:ts.ModuleResolutionKind.NodeJs}}).outputText,module={exports:{}};cache.set(absolute,module);const req=spec=>spec.startsWith(".")?load(resolveLocal(absolute,spec)):nativeRequire(spec);new Function("require","module","exports","__filename","__dirname",output)(req,module,module.exports,absolute,path.dirname(absolute));return module.exports}

const{danishGenres}=load("lib/danishGenreCatalog.ts");
const{danishWritingSupport}=load("lib/danishGenreProgression.ts");
const{danishCompetencyAreas,danishSkillsForGrade}=load("lib/danishCompetencyCatalog.ts");
const errors=[];

if(danishCompetencyAreas.length!==6)errors.push(`competencies: expected 6 areas, got ${danishCompetencyAreas.length}`);
const areaIds=new Set(),skillIds=new Set();
for(const area of danishCompetencyAreas){
 if(areaIds.has(area.id))errors.push(`competencies: duplicate area id ${area.id}`);areaIds.add(area.id);
 if(!area.title?.trim()||!area.description?.trim()||!area.skills?.length)errors.push(`competencies: incomplete area ${area.id}`);
 for(const skill of area.skills){
  const key=`${area.id}:${skill.id}`;if(skillIds.has(key))errors.push(`competencies: duplicate skill ${key}`);skillIds.add(key);
  if(!skill.title?.trim()||!skill.description?.trim())errors.push(`competencies: incomplete skill ${key}`);
  if(!Number.isInteger(skill.minGrade)||skill.minGrade<1||skill.minGrade>10)errors.push(`competencies: invalid minGrade for ${key}`);
  if(!["live","developing"].includes(skill.status))errors.push(`competencies: invalid status for ${key}`);
 }
 for(let grade=1;grade<=10;grade++){
  const visible=danishSkillsForGrade(area,grade);
  if(visible.some(s=>s.minGrade>grade))errors.push(`competencies: ${area.id} leaked above grade ${grade}`);
 }
}

let checks=0;
for(const genre of danishGenres){
 if(!genre.id?.trim()||!genre.name?.trim()||!genre.purpose?.trim()||!genre.audience?.trim())errors.push(`genre ${genre.id||"unknown"}: missing core metadata`);
 if(!Array.isArray(genre.structure)||genre.structure.length===0)errors.push(`genre ${genre.id}: no structure`);
 if(!Array.isArray(genre.checklist)||genre.checklist.length===0)errors.push(`genre ${genre.id}: no checklist`);
 for(let grade=1;grade<=10;grade++){
  const support=danishWritingSupport(genre,grade);checks++;
  if(!support.band?.trim()||!support.coach?.trim())errors.push(`${genre.id} grade ${grade}: missing band/coach`);
  if(!Array.isArray(support.structure)||support.structure.length===0||support.structure.some(x=>!x?.trim()))errors.push(`${genre.id} grade ${grade}: invalid structure`);
  if(!Array.isArray(support.checklist)||support.checklist.length<3||support.checklist.some(x=>!x?.trim()))errors.push(`${genre.id} grade ${grade}: invalid checklist`);
  if(!Array.isArray(support.focus)||support.focus.length<3)errors.push(`${genre.id} grade ${grade}: insufficient focus`);
 }
}

if(errors.length){console.error(`Danish learning validation failed with ${errors.length} issue(s):`);for(const error of errors.slice(0,80))console.error(`- ${error}`);process.exit(1)}
console.log(`Danish learning validation passed: ${danishCompetencyAreas.length} competency areas · ${skillIds.size} skills · ${danishGenres.length} genres · ${checks} grade-aware writing scaffolds checked.`);
