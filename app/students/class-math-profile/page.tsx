"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {trainingCatalog} from "../../../lib/trainingCatalog";
import {mathSkillMinimum} from "../../../lib/mathProgression";

type ClassRow={id:number;name:string};
type Student={id:number;name:string;grade_level:number|null};
type ProgressRow={student_id:number;area_id:string;skill_id:string;level_id:string;attempts:number;best_score:number;last_score:number;max_score:number;first_attempt_at:string|null;last_attempt_at:string|null};
type SkillState={student:Student;attempts:number;bestPct:number;latestPct:number;levelId:string;lastAttemptAt:string|null;mastered:boolean};
type SkillSummary={areaId:string;skill:string;measured:number;coverage:number;averageLatest:number|null;mastered:number;status:"unknown"|"sparse"|"strong"|"developing"|"focus"};

const math=trainingCatalog.find(s=>s.id==="matematik")!;
const levelNames=Object.fromEntries(math.levels.map(l=>[l.id,l.title]));

function pct(value:number){return `${Math.round(value*100)} %`}
function heatStatus(measured:number,total:number,average:number|null):SkillSummary["status"]{
 if(!measured||average===null)return"unknown";
 if(total>0&&measured/total<.4)return"sparse";
 if(average>=.85)return"strong";
 if(average>=.6)return"developing";
 return"focus";
}
function palette(status:SkillSummary["status"]){
 if(status==="strong")return{bg:"#e1efe4",border:"#b8d7c0",color:"#345b42",label:"Sikkert"};
 if(status==="developing")return{bg:"#fff4d9",border:"#ead6a2",color:"#725d2d",label:"På vej"};
 if(status==="focus")return{bg:"#fde9e5",border:"#e9beb6",color:"#8a433a",label:"Fokus"};
 if(status==="sparse")return{bg:"#eaf0f4",border:"#c8d7df",color:"#506874",label:"Få data"};
 return{bg:"#f2f0eb",border:"#ddd9d0",color:"#6d746e",label:"Ikke målt"};
}

export default function ClassMathProfile(){
 const[ready,setReady]=useState(false),[classes,setClasses]=useState<ClassRow[]>([]),[classId,setClassId]=useState<number|"">(""),[className,setClassName]=useState(""),[students,setStudents]=useState<Student[]>([]),[progress,setProgress]=useState<ProgressRow[]>([]),[areaId,setAreaId]=useState(math.areas[0]?.id||""),[selectedSkill,setSelectedSkill]=useState(math.areas[0]?.skills[0]||""),[error,setError]=useState("");

 async function load(id:number){
  setError("");
  const{data,error:e}=await supabase.rpc("teacher_class_math_learning_profile",{p_class_id:id});
  if(e||!data?.ok){setStudents([]);setProgress([]);setError(e?.message||data?.error||"Matematikoverblikket kunne ikke hentes.");return}
  setClassName(data.class?.name||"");setStudents((data.students||[]) as Student[]);setProgress((data.progress||[]) as ProgressRow[]);
 }
 useEffect(()=>{(async()=>{
  const{data:s}=await supabase.auth.getSession();if(!s.session){window.location.replace("/?teacher=1");return}
  const{data:c,error:e}=await supabase.from("classes").select("id,name").order("name");if(e){setError(e.message);setReady(true);return}
  const list=(c||[]) as ClassRow[];setClasses(list);const requested=Number(new URLSearchParams(window.location.search).get("class")),initial=list.find(x=>x.id===requested)?.id||list[0]?.id||"";setClassId(initial);if(initial)await load(Number(initial));setReady(true)
 })()},[]);
 async function changeClass(next:number){setClassId(next);await load(next)}
 function chooseArea(next:string){setAreaId(next);setSelectedSkill(math.areas.find(a=>a.id===next)?.skills[0]||"")}

 const latestByStudentSkill=useMemo(()=>{
  const grouped=new Map<string,ProgressRow[]>();
  for(const row of progress){const key=`${row.student_id}|${row.skill_id}`;grouped.set(key,[...(grouped.get(key)||[]),row])}
  const map=new Map<string,SkillState>();
  for(const student of students){
   for(const area of math.areas){for(const skill of area.skills){const rows=grouped.get(`${student.id}|${skill}`)||[];if(!rows.length)continue;const latest=[...rows].sort((a,b)=>new Date(b.last_attempt_at||0).getTime()-new Date(a.last_attempt_at||0).getTime())[0];const valid=rows.filter(r=>r.max_score>0);const bestPct=valid.length?Math.max(...valid.map(r=>r.best_score/r.max_score)):0;map.set(`${student.id}|${skill}`,{student,attempts:rows.reduce((n,r)=>n+r.attempts,0),bestPct,latestPct:latest.max_score>0?latest.last_score/latest.max_score:0,levelId:latest.level_id,lastAttemptAt:latest.last_attempt_at,mastered:valid.some(r=>r.best_score>=r.max_score)})}}
  }
  return map;
 },[students,progress]);

 const summaries=useMemo(()=>{
  const rows:SkillSummary[]=[];
  for(const area of math.areas){for(const skill of area.skills){const states=students.map(s=>latestByStudentSkill.get(`${s.id}|${skill}`)).filter((x):x is SkillState=>Boolean(x));const measured=states.length,average=measured?states.reduce((n,s)=>n+s.latestPct,0)/measured:null;rows.push({areaId:area.id,skill,measured,coverage:students.length?measured/students.length:0,averageLatest:average,mastered:states.filter(s=>s.mastered).length,status:heatStatus(measured,students.length,average)})}}
  return rows;
 },[students,latestByStudentSkill]);
 const area=math.areas.find(a=>a.id===areaId)||math.areas[0];
 const areaSummaries=summaries.filter(s=>s.areaId===area.id);
 const selectedSummary=summaries.find(s=>s.skill===selectedSkill)||null;
 const selectedStates=students.map(student=>({student,state:latestByStudentSkill.get(`${student.id}|${selectedSkill}`)||null})).sort((a,b)=>{
  const av=a.state?.latestPct??-1,bv=b.state?.latestPct??-1;return av-bv||a.student.name.localeCompare(b.student.name,"da")
 });
 const measuredStudents=new Set(progress.map(p=>p.student_id)).size;
 const strong=summaries.filter(s=>s.status==="strong").length,focus=summaries.filter(s=>s.status==="focus").length,unknown=summaries.filter(s=>s.status==="unknown").length;
 const priority=[...summaries].filter(s=>s.status==="focus"||s.status==="developing").sort((a,b)=>(a.averageLatest??1)-(b.averageLatest??1)||b.coverage-a.coverage)[0]||null;
 const targetStudents=selectedStates.filter(x=>x.state&&x.state.latestPct<.85).map(x=>x.student.id);

 function assignSelected(){
  if(!selectedSkill)return;
  sessionStorage.setItem("klassevaerelset-math-target",JSON.stringify({classId:Number(classId),areaId,skill:selectedSkill,studentIds:targetStudents}));
  window.location.href=`/math?class=${classId}&area=${encodeURIComponent(areaId)}&skill=${encodeURIComponent(selectedSkill)}`;
 }

 if(!ready)return <main style={{padding:50}}>Samler matematikoverblikket…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1160,margin:"auto"}}><div style={{display:"flex",gap:14,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}><div><Link href={`/students?class=${classId}`} style={{color:"#e8ded2",fontWeight:850,textDecoration:"none"}}>← Klassen</Link><p style={{fontSize:11,fontWeight:900,letterSpacing:1.5,opacity:.68,margin:"20px 0 4px"}}>MATEMATIK · FAGLIG PROGRESSION</p><h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:0}}>Klassens matematikoverblik</h1><p style={{margin:"7px 0 0",opacity:.78}}>Se fælles mønstre, find elever der har brug for næste skridt, og send målrettet træning.</p></div>{classes.length>1&&<select value={classId} onChange={e=>changeClass(Number(e.target.value))} style={{padding:"10px 13px",borderRadius:8,border:0,minWidth:180}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}</div></div></header>

  <section style={{maxWidth:1160,margin:"auto",padding:"26px 24px 80px"}}>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}><Link href={`/students/class-learning-profile?class=${classId}`} style={subjectLink}>Dansk-overblik</Link><span style={{...subjectLink,background:"#365044",color:"white",borderColor:"#365044"}}>Matematik-overblik</span><Link href={`/math?class=${classId}`} style={subjectLink}>Tildel matematiktræning</Link></div>
   {error&&<div style={{...card,background:"#fff0ed",color:"#8b433a",marginBottom:14,fontWeight:800}}>{error}</div>}
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:10}}>
    <div style={card}><p style={eyebrow}>ELEVER MED DATA</p><strong style={metric}>{measuredStudents}/{students.length}</strong><span style={muted}>har prøvet mindst ét matematikspor</span></div>
    <div style={card}><p style={eyebrow}>SIKRE FÆRDIGHEDER</p><strong style={metric}>{strong}</strong><span style={muted}>færdigheder med bred og stærk seneste præstation</span></div>
    <div style={card}><p style={eyebrow}>FÆLLES FOKUS</p><strong style={metric}>{focus}</strong><span style={muted}>færdigheder med tilstrækkelige data og lav seneste score</span></div>
    <div style={card}><p style={eyebrow}>IKKE MÅLT</p><strong style={metric}>{unknown}</strong><span style={muted}>færdigheder uden elevdata endnu</span></div>
   </div>

   {priority&&<section style={{...card,marginTop:14,background:"#fff4df"}}><p style={eyebrow}>FORSLAG TIL FÆLLES NÆSTE SKRIDT</p><div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap"}}><div><h2 style={{fontFamily:"Georgia,serif",fontSize:26,margin:"6px 0"}}>{priority.skill}</h2><p style={{...muted,margin:0}}>{priority.measured}/{students.length} elever målt · seneste gennemsnit {priority.averageLatest===null?"—":pct(priority.averageLatest)}</p></div><button onClick={()=>{setAreaId(priority.areaId);setSelectedSkill(priority.skill)}} style={primary}>Se eleverne →</button></div></section>}

   <section style={{...card,marginTop:14}}><p style={eyebrow}>OMRÅDER</p><div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:10}}>{math.areas.map(a=><button key={a.id} onClick={()=>chooseArea(a.id)} style={pill(areaId===a.id)}>{a.title}</button>)}</div></section>

   <section style={{...card,marginTop:14}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"end",flexWrap:"wrap"}}><div><p style={eyebrow}>{area.title.toUpperCase()}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"5px 0"}}>Færdigheds-heatmap</h2><p style={{...muted,margin:0}}>Farven bruger seneste resultat. Under 40 % datadækning vises som “få data” i stedet for at konkludere fagligt.</p></div><span style={{...muted,fontWeight:800}}>{className||"Klassen"}</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:9,marginTop:16}}>{areaSummaries.map(item=>{const p=palette(item.status);return <button key={item.skill} onClick={()=>setSelectedSkill(item.skill)} style={{textAlign:"left",padding:14,borderRadius:12,border:`2px solid ${selectedSkill===item.skill?"#526b60":p.border}`,background:p.bg,color:p.color,cursor:"pointer"}}><small style={{fontWeight:950,letterSpacing:.6}}>{p.label.toUpperCase()}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,margin:"6px 0"}}>{item.skill}</strong><span style={{display:"block",fontSize:12,lineHeight:1.45}}>{item.measured}/{students.length} målt{item.averageLatest!==null?` · senest ${pct(item.averageLatest)}`:""}<br/>{item.mastered} har ramt 100 % på mindst ét niveau</span></button>})}</div></section>

   {selectedSummary&&<section style={{...card,marginTop:14}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><p style={eyebrow}>VALGT FÆRDIGHED</p><h2 style={{fontFamily:"Georgia,serif",fontSize:29,margin:"5px 0"}}>{selectedSkill}</h2><p style={{...muted,margin:0}}>Normalt fra ca. {mathSkillMinimum(selectedSkill)}. klasse · {selectedSummary.measured}/{students.length} elever har data.</p></div><button onClick={assignSelected} style={primary}>{targetStudents.length?`Tildel træning til ${targetStudents.length} →`:"Tildel træning →"}</button></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8,marginTop:15}}>{selectedStates.map(({student,state})=>{const status=!state?"unknown":state.latestPct>=.85?"strong":state.latestPct>=.6?"developing":"focus",p=palette(status);return <article key={student.id} style={{padding:12,borderRadius:10,border:`1px solid ${p.border}`,background:p.bg,color:p.color}}><Link href={`/students/${student.id}`} style={{color:"inherit",fontFamily:"Georgia,serif",fontWeight:900,textDecoration:"none",fontSize:18}}>{student.name}</Link><small style={{display:"block",marginTop:4,fontWeight:800}}>{student.grade_level===null?"klassetrin mangler":`${student.grade_level}. klasse`} · {p.label}</small>{state?<><strong style={{display:"block",fontSize:20,marginTop:7}}>Senest {pct(state.latestPct)}</strong><span style={{display:"block",fontSize:12,marginTop:3}}>Bedst {pct(state.bestPct)} · {state.attempts} forsøg · {levelNames[state.levelId]||state.levelId}</span></>:<span style={{display:"block",fontSize:12,marginTop:8}}>Ingen træningsdata på denne færdighed endnu.</span>}</article>})}</div>
   </section>}

   <div style={{...card,marginTop:14,background:"#eef2ed"}}><strong>Farverne er arbejdsmarkører — ikke vurderinger af eleven.</strong><p style={{...muted,margin:"6px 0 0"}}>Grøn: seneste præstation ≥ 85 %. Gul: 60–84 %. Rød: under 60 %. Blå: under 40 % af klassen er målt. Grå: ingen data. Klik altid ind på eleverne og se konteksten, før du ændrer undervisningen.</p></div>
  </section>
 </main>;
}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:19};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const muted:React.CSSProperties={fontSize:13,color:"#68716b",lineHeight:1.5};
const metric:React.CSSProperties={display:"block",fontFamily:"Georgia,serif",fontSize:32,margin:"6px 0 3px"};
const subjectLink:React.CSSProperties={padding:"8px 11px",borderRadius:999,border:"1px solid #d7d3ca",background:"white",color:"#526159",fontSize:12,fontWeight:850,textDecoration:"none"};
const pill=(active:boolean):React.CSSProperties=>({padding:"8px 10px",borderRadius:999,border:active?"2px solid #526b60":"1px solid #d8d5cd",background:active?"#edf1ec":"white",fontWeight:850,cursor:"pointer",color:"#26342e"});
const primary:React.CSSProperties={padding:"10px 13px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
