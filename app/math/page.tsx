"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {trainingCatalog} from "../../lib/trainingCatalog";
import {freeTrainingQuestions,type TrainingQuestion} from "../../lib/freeTrainingQuestions";
import {mathExtraQuestions} from "../../lib/mathExtraQuestions";
import {mathGapQuestions} from "../../lib/mathGapQuestions";
import {mathSkillMinimum,mathTrainingAllowed} from "../../lib/mathProgression";

type ClassRow={id:number;name:string};
type Student={id:number;name:string;class_id:number;grade_level:number|null};
type TrainingRow={id:number;title:string;area_id:string;skill_id:string;level_id:string;target_grade:number|null;created_at:string;recipient_count:number;started_count:number;mastered_count:number};
type LevelBank=Record<string,TrainingQuestion[]>;

const math=trainingCatalog.find(s=>s.id==="matematik")!;
function bank(areaId:string,skill:string):LevelBank{
 const core=(freeTrainingQuestions.matematik?.[areaId]?.[skill]??{}) as LevelBank,extra=mathExtraQuestions[areaId]?.[skill]??{},gaps=mathGapQuestions[areaId]?.[skill]??{};
 const levels=new Set([...Object.keys(core),...Object.keys(extra),...Object.keys(gaps)]);
 return Object.fromEntries([...levels].map(level=>[level,[...(core[level]??[]),...(extra[level]??[]),...(gaps[level]??[])]]));
}

export default function MathTeacherPage(){
 const[ready,setReady]=useState(false),[classes,setClasses]=useState<ClassRow[]>([]),[students,setStudents]=useState<Student[]>([]),[classId,setClassId]=useState<number|"">("");
 const[areaId,setAreaId]=useState(math.areas[0]?.id||""),[skill,setSkill]=useState(""),[levelId,setLevelId]=useState(""),[targetGrade,setTargetGrade]=useState<number|null>(null),[recipientMode,setRecipientMode]=useState<"class"|"students">("class"),[selected,setSelected]=useState<number[]>([]),[title,setTitle]=useState("");
 const[rows,setRows]=useState<TrainingRow[]>([]),[saving,setSaving]=useState(false),[message,setMessage]=useState("");

 async function loadAssignments(id:number){const{data,error}=await supabase.rpc("teacher_training_assignments",{p_class_id:id,p_subject_id:"matematik"});if(error||!data?.ok){setRows([]);setMessage(error?.message||data?.error||"Tildelingerne kunne ikke hentes.");return}setRows((data.assignments||[]) as TrainingRow[])}
 useEffect(()=>{(async()=>{const{data:s}=await supabase.auth.getSession();if(!s.session){window.location.replace("/?teacher=1");return}const[c,st]=await Promise.all([supabase.from("classes").select("id,name").order("name"),supabase.from("students").select("id,name,class_id,grade_level").order("name")]);const cs=(c.data||[]) as ClassRow[];setClasses(cs);setStudents((st.data||[]) as Student[]);const requested=Number(new URLSearchParams(window.location.search).get("class")),initial=cs.find(x=>x.id===requested)?.id||cs[0]?.id||"";setClassId(initial);if(initial)await loadAssignments(Number(initial));setReady(true)})()},[]);

 const area=math.areas.find(a=>a.id===areaId)||math.areas[0];
 const classStudents=students.filter(s=>s.class_id===Number(classId));
 const recipients=recipientMode==="class"?classStudents:classStudents.filter(s=>selected.includes(s.id));
 const skillBank=useMemo(()=>skill?bank(areaId,skill):{},[areaId,skill]);
 const selectedLevel=math.levels.find(l=>l.id===levelId)||null;
 const missingGrades=recipients.filter(s=>s.grade_level===null);
 const belowSkill=targetGrade===null?recipients.filter(s=>s.grade_level!==null&&s.grade_level<mathSkillMinimum(skill)):[];
 const explicitAllowed=targetGrade===null||!skill||!levelId||mathTrainingAllowed(skill,levelId,targetGrade);
 const createDisabled=saving||!explicitAllowed||(recipientMode==="students"&&!selected.length);

 function selectArea(next:string){setAreaId(next);setSkill("");setLevelId("");setTitle("")}
 function selectSkill(next:string){setSkill(next);setLevelId("");setTitle(`Træn ${next}`)}
 function toggleStudent(id:number){setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id])}
 async function changeClass(next:number){setClassId(next);setSelected([]);setRecipientMode("class");setMessage("");await loadAssignments(next)}
 async function create(){
  if(!classId||!areaId||!skill||!levelId||(recipientMode==="students"&&!selected.length)||!explicitAllowed)return;
  setSaving(true);setMessage("");
  const{data,error}=await supabase.rpc("create_training_assignment",{p_class_id:Number(classId),p_subject_id:"matematik",p_area_id:areaId,p_skill_id:skill,p_level_id:levelId,p_target_grade:targetGrade,p_student_ids:recipientMode==="students"?selected:null,p_title:title.trim()||null});
  if(error||!data?.ok){setMessage(error?.message||data?.error||"Træningen kunne ikke tildeles.");setSaving(false);return}
  setMessage(`Tildelt til ${data.recipient_count} elev${Number(data.recipient_count)===1?"":"er"} ✓`);setSelected([]);setRecipientMode("class");await loadAssignments(Number(classId));setSaving(false);
 }
 async function remove(id:number){if(!window.confirm("Slet denne træningstildeling? Det kan kun lade sig gøre, før en elev er begyndt."))return;const{data,error}=await supabase.rpc("delete_training_assignment",{p_assignment_id:id});if(error||!data?.ok){setMessage(data?.error==="assignment_started"?"Tildelingen kan ikke slettes, fordi mindst én elev er begyndt.":error?.message||data?.error||"Kunne ikke slette.");return}await loadAssignments(Number(classId));setMessage("Tildelingen er slettet.")}

 if(!ready)return <main style={{padding:50}}>Åbner matematik…</main>;
 return <main style={shell}><section style={{maxWidth:1100,margin:"auto"}}>
  <Link href="/teacher-dashboard" style={link}>← Mine klasser</Link>
  <div style={{margin:"26px 0 18px",display:"flex",justifyContent:"space-between",alignItems:"end",gap:14,flexWrap:"wrap"}}><div><p style={eyebrow}>MATEMATIK · TRÆNING & PROGRESSION</p><h1 style={h1}>Tildel målrettet matematiktræning</h1><p style={{...muted,maxWidth:760,fontSize:16}}>Vælg et matematisk område og den færdighed, eleverne skal arbejde med. Danskgenrer kan ikke vælges her — matematik har sit eget faglige katalog.</p></div>{classes.length>1&&<select value={classId} onChange={e=>changeClass(Number(e.target.value))} style={select}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}</div>
  {message&&<div style={{...card,marginBottom:14,background:message.includes("✓")?"#edf5ef":"#fff7e8"}}>{message}</div>}

  <section style={{...card,marginBottom:14}}><p style={eyebrow}>1 · OMRÅDE</p><div style={grid}>{math.areas.map(a=><button key={a.id} onClick={()=>selectArea(a.id)} style={choice(areaId===a.id)}><strong>{a.title}</strong><small>{a.description}</small></button>)}</div></section>

  <section style={{...card,marginBottom:14}}><p style={eyebrow}>2 · FÆRDIGHED</p><h2 style={h2}>{area.title}</h2><div style={grid}>{area.skills.map(s=>{const b=bank(area.id,s),count=Object.values(b).reduce((n,q)=>n+q.length,0);return <button key={s} onClick={()=>selectSkill(s)} disabled={!count} style={{...choice(skill===s),opacity:count?1:.45}}><strong>{s}</strong><small>Fra ca. {mathSkillMinimum(s)}. klasse · {count} opgaver</small></button>})}</div></section>

  {skill&&<section style={{...card,marginBottom:14}}><p style={eyebrow}>3 · NIVEAU & MÅLGRUPPE</p><h2 style={h2}>{skill}</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>{math.levels.map(level=>{const count=skillBank[level.id]?.length||0,available=count>=5;return <button key={level.id} disabled={!available} onClick={()=>setLevelId(level.id)} style={{...choice(levelId===level.id),opacity:available?1:.4}}><strong>{level.title}</strong><small>{available?`${count} opgaver · ${level.stage}`:"Ingen bank endnu"}</small></button>})}</div>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:12,marginTop:16}}><label style={label}>Træningsklassetrin<select value={targetGrade===null?"":targetGrade} onChange={e=>setTargetGrade(e.target.value===""?null:Number(e.target.value))} style={select}><option value="">Brug elevens eget klassetrin</option>{Array.from({length:11},(_,i)=>i).map(g=><option key={g} value={g}>{g}. klasse</option>)}</select><small style={muted}>Vælg et andet trin, hvis du bevidst vil differentiere op eller ned.</small></label><label style={label}>Titel<input value={title} onChange={e=>setTitle(e.target.value)} style={input} placeholder={`Træn ${skill}`}/></label></div>
   {!explicitAllowed&&<div style={warning}><strong>Det valgte niveau ligger over det valgte træningsklassetrin.</strong> Vælg et højere træningsklassetrin eller et tidligere niveau.</div>}
  </section>}

  {skill&&levelId&&<section style={{...card,marginBottom:14}}><p style={eyebrow}>4 · MODTAGERE</p><div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"9px 0 12px"}}><button onClick={()=>{setRecipientMode("class");setSelected([])}} style={pill(recipientMode==="class")}>Hele klassen</button><button onClick={()=>setRecipientMode("students")} style={pill(recipientMode==="students")}>Udvalgte elever</button></div>{recipientMode==="students"&&<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{classStudents.map(s=><button key={s.id} onClick={()=>toggleStudent(s.id)} style={pill(selected.includes(s.id))}>{selected.includes(s.id)?"✓ ":""}{s.name} · {s.grade_level===null?"trin mangler":`${s.grade_level}. kl.`}</button>)}</div>}
   {missingGrades.length>0&&targetGrade===null&&<div style={warning}><strong>{missingGrades.length} elev{missingGrades.length===1?"":"er"} mangler klassetrin.</strong> De kan stadig åbne tildelingen, men klassetrinstilpasningen bliver åben. Du kan også vælge et fast træningsklassetrin ovenfor.</div>}
   {belowSkill.length>0&&<div style={warning}><strong>{belowSkill.length} modtager{belowSkill.length===1?"":"e"} ligger under emnets normale starttrin.</strong> Det er kun en pædagogisk advarsel; vælg et fast træningsklassetrin, hvis det er en bevidst differentiering.</div>}
   <button onClick={create} disabled={createDisabled} style={{...primary,marginTop:15,opacity:createDisabled?.5:1}}>{saving?"Tildeler…":`Tildel ${selectedLevel?.title||"træning"} →`}</button>
  </section>}

  <section style={card}><p style={eyebrow}>TILDELTE MATEMATIKSPOR</p><h2 style={h2}>Følg arbejdet</h2>{rows.length===0?<p style={muted}>Der er endnu ingen målrettede matematiktræninger i denne klasse.</p>:<div style={{display:"grid",gap:9}}>{rows.map(row=><article key={row.id} style={{border:"1px solid #e2ded5",borderRadius:10,padding:"13px 14px",background:"#faf9f6"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><strong style={{fontFamily:"Georgia,serif",fontSize:20}}>{row.title}</strong><small style={{display:"block",marginTop:4,color:"#707670"}}>{row.skill_id} · {math.levels.find(l=>l.id===row.level_id)?.title||row.level_id}{row.target_grade!==null?` · ${row.target_grade}. kl. niveau`:""}</small></div><button onClick={()=>remove(row.id)} disabled={row.started_count>0} style={{...secondary,opacity:row.started_count>0?.45:1}}>{row.started_count>0?"Låst":"Slet"}</button></div><div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:10}}><span style={statusChip}>Modtagere {row.recipient_count}</span><span style={statusChip}>I gang {Math.max(0,row.started_count-row.mastered_count)}</span><span style={{...statusChip,background:"#dfeee3"}}>Mestret {row.mastered_count}/{row.recipient_count}</span><span style={statusChip}>Ikke startet {Math.max(0,row.recipient_count-row.started_count)}</span></div></article>)}</div>}</section>
 </section></main>;
}

const shell:React.CSSProperties={minHeight:"100vh",background:"#f5f3ee",padding:"30px 24px 80px",color:"#26342e"};
const card:React.CSSProperties={background:"#fff",border:"1px solid #ddd9d0",borderRadius:14,padding:20};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.35,color:"#718077",margin:0};
const h1:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:38,margin:"6px 0"};
const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0 14px"};
const muted:React.CSSProperties={fontSize:13,color:"#6e756f",lineHeight:1.5};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8,marginTop:12};
const choice=(active:boolean):React.CSSProperties=>({display:"grid",gap:5,textAlign:"left",padding:13,borderRadius:10,border:active?"2px solid #526b60":"1px solid #dedbd3",background:active?"#edf1ec":"#faf9f6",cursor:"pointer",color:"#26342e"});
const pill=(active:boolean):React.CSSProperties=>({padding:"8px 10px",borderRadius:999,border:active?"2px solid #526b60":"1px solid #d8d5cd",background:active?"#edf1ec":"white",fontWeight:800,cursor:"pointer",color:"#26342e"});
const label:React.CSSProperties={display:"grid",gap:6,fontSize:13,fontWeight:850};
const select:React.CSSProperties={padding:"10px 12px",borderRadius:8,border:"1px solid #cbc7bd",background:"white",font:"inherit"};
const input:React.CSSProperties={padding:"10px 12px",borderRadius:8,border:"1px solid #cbc7bd",background:"white",font:"inherit"};
const warning:React.CSSProperties={marginTop:12,padding:"10px 12px",borderRadius:9,background:"#fff7e8",border:"1px solid #ead8ad",color:"#685530",fontSize:13,lineHeight:1.45};
const primary:React.CSSProperties={padding:"12px 16px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={padding:"8px 10px",border:"1px solid #d5d0c7",borderRadius:8,background:"white",color:"#526159",fontWeight:800,cursor:"pointer"};
const statusChip:React.CSSProperties={padding:"5px 8px",borderRadius:999,background:"#edf1ec",fontSize:11,fontWeight:850,color:"#526b60"};
const link:React.CSSProperties={color:"#526b60",fontWeight:850,textDecoration:"none"};
