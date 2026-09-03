"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {trainingCatalog} from "../../../lib/trainingCatalog";

type ProgressRow={student_id:number;area_id:string;skill_id:string;level_id:string;attempts:number;best_score:number;last_score:number;max_score:number;last_attempt_at:string|null};
type SkillState={areaId:string;skill:string;attempts:number;bestPct:number;latestPct:number;levelId:string;lastAttemptAt:string|null;mastered:boolean};
const math=trainingCatalog.find(s=>s.id==="matematik")!;
const levelNames=Object.fromEntries(math.levels.map(l=>[l.id,l.title]));
const pct=(n:number)=>`${Math.round(n*100)} %`;
function colors(value:number){if(value>=.85)return{bg:"#e5f0e7",border:"#bfd8c5",color:"#365b43",label:"Sikker"};if(value>=.6)return{bg:"#fff4d9",border:"#ead6a2",color:"#725d2d",label:"På vej"};return{bg:"#fde9e5",border:"#e9beb6",color:"#8a433a",label:"Fokus"}}

export default function MathLearningProfile({studentId,classId}:{studentId:number;classId:number}){
 const[progress,setProgress]=useState<ProgressRow[]>([]),[ready,setReady]=useState(false),[error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{const{data,error:e}=await supabase.rpc("teacher_class_math_learning_profile",{p_class_id:classId});if(!active)return;if(e||!data?.ok){setError(e?.message||data?.error||"Matematikprogressionen kunne ikke hentes.");setReady(true);return}setProgress(((data.progress||[]) as ProgressRow[]).filter(row=>row.student_id===studentId));setReady(true)})();return()=>{active=false}},[studentId,classId]);
 const states=useMemo(()=>{
  const rows:SkillState[]=[];
  for(const area of math.areas){for(const skill of area.skills){const skillRows=progress.filter(p=>p.skill_id===skill);if(!skillRows.length)continue;const latest=[...skillRows].sort((a,b)=>new Date(b.last_attempt_at||0).getTime()-new Date(a.last_attempt_at||0).getTime())[0],valid=skillRows.filter(r=>r.max_score>0);rows.push({areaId:area.id,skill,attempts:skillRows.reduce((n,r)=>n+r.attempts,0),bestPct:valid.length?Math.max(...valid.map(r=>r.best_score/r.max_score)):0,latestPct:latest.max_score>0?latest.last_score/latest.max_score:0,levelId:latest.level_id,lastAttemptAt:latest.last_attempt_at,mastered:valid.some(r=>r.best_score>=r.max_score)})}}
  return rows;
 },[progress]);
 const mastered=states.filter(s=>s.mastered).length,focus=states.filter(s=>s.latestPct<.6).length,developing=states.filter(s=>s.latestPct>=.6&&s.latestPct<.85).length;
 const next=[...states].filter(s=>s.latestPct<.85).sort((a,b)=>a.latestPct-b.latestPct)[0]||null;
 function assign(state:SkillState){sessionStorage.setItem("klassevaerelset-math-target",JSON.stringify({classId,areaId:state.areaId,skill:state.skill,studentIds:[studentId]}));window.location.href=`/math?class=${classId}&area=${encodeURIComponent(state.areaId)}&skill=${encodeURIComponent(state.skill)}`}
 if(!ready)return <section style={{...card,marginBottom:16}}>Henter matematikprogression…</section>;
 return <section style={{...card,marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><p style={eyebrow}>MATEMATIK · PROGRESSION</p><h2 style={h2}>Elevens matematikspor</h2><p style={muted}>Viser træningsdata fra Klasseværelset. Seneste resultat bruges som aktuelt signal; bedste resultat bevares som mestringshistorik.</p></div><Link href={`/students/class-math-profile?class=${classId}`} style={link}>Klassens heatmap →</Link></div>
  {error?<div style={warning}>{error}</div>:states.length===0?<div style={{...empty,marginTop:14}}><strong>Ingen matematikdata endnu.</strong><p style={{...muted,margin:"5px 0 0"}}>Når eleven arbejder i Træn selv eller en lærertildelt matematiktræning, kommer progressionen automatisk frem her.</p></div>:<>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginTop:14}}><div style={mini}><small style={eyebrow}>PRØVET</small><strong style={metric}>{states.length}</strong><span style={muted}>færdigheder</span></div><div style={mini}><small style={eyebrow}>MESTRET</small><strong style={metric}>{mastered}</strong><span style={muted}>har ramt 100 %</span></div><div style={mini}><small style={eyebrow}>PÅ VEJ</small><strong style={metric}>{developing}</strong><span style={muted}>senest 60–84 %</span></div><div style={mini}><small style={eyebrow}>FOKUS</small><strong style={metric}>{focus}</strong><span style={muted}>senest under 60 %</span></div></div>
   {next&&<div style={{...empty,background:"#fff4df",marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><div><small style={eyebrow}>FORSLAG TIL NÆSTE SKRIDT</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:20,marginTop:4}}>{next.skill}</strong><span style={muted}>Senest {pct(next.latestPct)} · bedst {pct(next.bestPct)}</span></div><button onClick={()=>assign(next)} style={primary}>Tildel træning →</button></div>}
   <div style={{display:"grid",gap:12,marginTop:14}}>{math.areas.map(area=>{const areaStates=states.filter(s=>s.areaId===area.id);if(!areaStates.length)return null;return <div key={area.id}><strong style={{fontFamily:"Georgia,serif",fontSize:18}}>{area.title}</strong><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:7,marginTop:7}}>{areaStates.map(state=>{const c=colors(state.latestPct);return <button key={state.skill} onClick={()=>assign(state)} style={{textAlign:"left",padding:11,borderRadius:9,border:`1px solid ${c.border}`,background:c.bg,color:c.color,cursor:"pointer"}}><strong style={{display:"block"}}>{state.skill}</strong><small style={{display:"block",marginTop:4}}>Senest {pct(state.latestPct)} · bedst {pct(state.bestPct)}</small><small style={{display:"block",marginTop:2}}>{c.label} · {state.attempts} forsøg · {levelNames[state.levelId]||state.levelId}</small></button>})}</div></div>})}</div>
  </>}
 </section>
}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:22};
const mini:React.CSSProperties={background:"#faf9f6",border:"1px solid #e5e0d7",borderRadius:10,padding:12};
const empty:React.CSSProperties={padding:13,borderRadius:10,border:"1px solid #e1ddd4",background:"#f6f4ef"};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:26,margin:"6px 0 7px"};
const muted:React.CSSProperties={fontSize:13,color:"#6d756f",lineHeight:1.5};
const metric:React.CSSProperties={display:"block",fontFamily:"Georgia,serif",fontSize:27,margin:"4px 0"};
const link:React.CSSProperties={color:"#526b60",fontWeight:850,textDecoration:"none"};
const primary:React.CSSProperties={padding:"9px 12px",border:0,borderRadius:8,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const warning:React.CSSProperties={marginTop:12,padding:11,borderRadius:9,background:"#fff0ed",color:"#8a433a",fontWeight:800};
