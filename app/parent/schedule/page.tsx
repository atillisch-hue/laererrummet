"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";
import {isoWeek,recurrenceLabel,type RecurrencePattern} from "../../../lib/scheduleRecurrence";

type ScheduleOccurrence={student_id:number;occurrence_date:string;schedule_entry_id:number;schedule_version_id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;entry_kind:"lesson"|"assembly"|"break";recurrence_pattern:RecurrencePattern};
type ClosedDay={date:string;label?:string};
type Child={id:number;name:string;class_name:string|null;closed_days:ClosedDay[]};
type ParentPayload={children?:Child[]};

const dateOnly=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const mondayOf=(value:Date)=>{const d=new Date(value);d.setHours(12,0,0,0);const day=d.getDay()||7;d.setDate(d.getDate()-(day-1));return d};
const kindLabel=(kind:ScheduleOccurrence["entry_kind"])=>kind==="assembly"?"Samling":kind==="break"?"Pause":"Undervisning";

export default function ParentSchedulePage(){
 const[ready,setReady]=useState(false);
 const[children,setChildren]=useState<Child[]>([]);
 const[activeId,setActiveId]=useState<number|null>(null);
 const[weekStart,setWeekStart]=useState(()=>mondayOf(new Date()));
 const[schedule,setSchedule]=useState<ScheduleOccurrence[]>([]);
 const[scheduleLoading,setScheduleLoading]=useState(false);
 const[error,setError]=useState("");

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();
  const user=data.session?.user;
  if(!user){location.replace("/");return}
  if(!hasRole(user,"parent")){location.replace("/noticeboard");return}
  const{data:portal,error:portalError}=await supabase.rpc("parent_portal_data");
  if(portalError){setError("Skemaet kunne ikke hentes.");setReady(true);return}
  const raw=Array.isArray((portal as ParentPayload|null)?.children)?((portal as ParentPayload).children||[]):[];
  const list=raw.map(child=>({id:child.id,name:child.name,class_name:child.class_name,closed_days:Array.isArray(child.closed_days)?child.closed_days:[]}));
  setChildren(list);setActiveId(list[0]?.id||null);setReady(true);
 })()},[]);

 useEffect(()=>{let live=true;(async()=>{
  if(!activeId){if(live)setSchedule([]);return}
  setScheduleLoading(true);setError("");
  const start=dateOnly(weekStart),endDate=new Date(weekStart);endDate.setDate(endDate.getDate()+4);const end=dateOnly(endDate);
  const{data,error:scheduleError}=await supabase.rpc("parent_schedule_occurrences",{p_student_id:activeId,p_start_date:start,p_end_date:end});
  if(!live)return;
  if(scheduleError){setSchedule([]);setError("Ugens skema kunne ikke hentes.")}else setSchedule((data||[]) as ScheduleOccurrence[]);
  setScheduleLoading(false);
 })();return()=>{live=false}},[activeId,weekStart]);

 const active=children.find(c=>c.id===activeId)||children[0]||null;
 const days=useMemo(()=>Array.from({length:5},(_,i)=>{const d=new Date(weekStart);d.setDate(weekStart.getDate()+i);return d}),[weekStart]);
 const moveWeek=(delta:number)=>setWeekStart(v=>{const d=new Date(v);d.setDate(v.getDate()+delta*7);return d});
 const weekEnd=days[4];

 if(!ready)return <main style={shell}>Henter skema…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}><section style={shell}>
  <Link href="/parent" style={back}>← Forældreportalen</Link>
  <p style={{...eyebrow,marginTop:28}}>SKEMA</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"7px 0 8px"}}>Ugens skema</h1>
  <p style={{maxWidth:720,color:"#687068",fontSize:17,lineHeight:1.55}}>Her ser du den skemaversion, der gælder for netop denne uge. 14-dages-rytme, undervisningsperiode og skolens lukkedage er regnet med.</p>
  {error&&<div style={warning}>{error}</div>}

  {children.length>1&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:20}}>{children.map(child=><button key={child.id} onClick={()=>setActiveId(child.id)} style={{...childButton,background:active?.id===child.id?"#365044":"white",color:active?.id===child.id?"white":"#26342e"}}>{child.name}{child.class_name?` · ${child.class_name}`:""}</button>)}</div>}

  {active&&<>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",margin:"26px 0 14px"}}><div><p style={eyebrow}>UGE {isoWeek(weekStart)}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"5px 0 0"}}>{active.name}{active.class_name?` · ${active.class_name}`:""}</h2><small style={{display:"block",color:"#707670",marginTop:4}}>{weekStart.toLocaleDateString("da-DK",{day:"numeric",month:"long"})} – {weekEnd.toLocaleDateString("da-DK",{day:"numeric",month:"long",year:"numeric"})}</small></div><div style={{display:"flex",gap:7}}><button onClick={()=>moveWeek(-1)} style={navButton}>← Forrige uge</button><button onClick={()=>setWeekStart(mondayOf(new Date()))} style={navButton}>Denne uge</button><button onClick={()=>moveWeek(1)} style={navButton}>Næste uge →</button></div></div>

   {scheduleLoading?<section style={card}>Henter ugens gældende skema…</section>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>{days.map(day=>{
    const date=dateOnly(day);const closure=active.closed_days?.find(x=>x.date===date)||null;
    const entries=closure?[]:schedule.filter(e=>e.occurrence_date===date).sort((a,b)=>a.start_time.localeCompare(b.start_time));
    const isToday=date===dateOnly(new Date());
    return <section key={date} style={{...card,borderColor:isToday?"#9eb4a5":"#ddd9d0",background:isToday?"#f4f8f4":"white"}}><p style={eyebrow}>{day.toLocaleDateString("da-DK",{weekday:"long"}).toUpperCase()}</p><h3 style={{fontFamily:"Georgia,serif",fontSize:20,margin:"5px 0 12px"}}>{day.toLocaleDateString("da-DK",{day:"numeric",month:"short"})}{isToday?" · i dag":""}</h3>{closure?<div style={{padding:"10px 11px",background:"#f6edd7",border:"1px solid #dfca96",borderRadius:9,color:"#655538"}}><strong>{closure.label||"Skolen er lukket"}</strong></div>:entries.length===0?<p style={{fontSize:13,color:"#777168",margin:0}}>Ingen almindelige skemabrikker.</p>:<div style={{display:"grid",gap:7}}>{entries.map(entry=><article key={`${entry.occurrence_date}-${entry.schedule_entry_id}`} style={{padding:"9px 10px",border:"1px solid #e3dfd7",borderRadius:8,background:"#faf9f6"}}><strong style={{display:"block",fontSize:13}}>{entry.start_time.slice(0,5)}–{entry.end_time.slice(0,5)}</strong><span style={{display:"block",marginTop:2,fontWeight:800}}>{entry.subject}</span><small style={{display:"block",marginTop:3,color:"#727772"}}>{kindLabel(entry.entry_kind)}{entry.room?` · ${entry.room}`:""}{entry.recurrence_pattern!=="weekly"?` · ${recurrenceLabel(entry.recurrence_pattern)}`:""}</small></article>)}</div>}</section>;
   })}</div>}
  </>}
  {!children.length&&!error&&<section style={card}>Skolen mangler at knytte et barn til din forældrekonto.</section>}
 </section></main>;
}

const shell:React.CSSProperties={maxWidth:1100,margin:"auto",padding:"34px 24px 70px"};
const back:React.CSSProperties={color:"#526b60",fontWeight:800,textDecoration:"none"};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:16};
const warning:React.CSSProperties={marginTop:18,padding:14,background:"#fff3cd",borderRadius:10};
const childButton:React.CSSProperties={padding:"10px 14px",border:"1px solid #cfcac0",borderRadius:9,fontWeight:800,cursor:"pointer"};
const navButton:React.CSSProperties={padding:"8px 10px",border:"1px solid #cfcac0",borderRadius:8,background:"white",color:"#486b59",fontWeight:800,cursor:"pointer"};
