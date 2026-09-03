"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {scheduleOccursOn,type RecurrencePattern} from "../../lib/scheduleRecurrence";

type EntryKind="lesson"|"assembly"|"break"|"duty"|"other";
type ScheduleEntry={id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;entry_kind:EntryKind;recurrence_pattern:RecurrencePattern};
type ScheduleTeacher={schedule_entry_id:number;teacher_id:string};
type Klass={id:number;name:string};
type Busy={user_id:string;starts_at:string;ends_at:string;busy_type:"meeting"|"absence"|string};
type Meeting={id:number;title:string;meeting_type:string;starts_at:string;ends_at:string|null;location:string|null};
type WorkEntry={id:number;work_date:string;starts_at:string;ends_at:string;category:string;note:string|null};

type Props={
 selectedDate:string;
 onSelectDate:(date:string)=>void;
 viewedUserId:string;
 currentUserId:string;
 viewedName:string;
 meetings:Meeting[];
 refreshKey?:number;
};

const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const mondayOf=(value:string)=>{const d=new Date(`${value}T12:00:00`);const day=d.getDay()||7;d.setDate(d.getDate()-(day-1));return d};
const shortTime=(value:string)=>value.slice(0,5);
const kindLabel=(kind:EntryKind)=>({lesson:"Undervisning",assembly:"Samling",break:"Pause",duty:"Gårdvagt",other:"Aktivitet"}[kind]);
const workLabel=(value:string)=>({teaching:"Undervisning",preparation:"Forberedelse",meeting:"Møde",supervision:"Tilsyn",administration:"Administration",other:"Arbejdstid"}[value]||"Arbejdstid");

export default function WeekScheduleView({selectedDate,onSelectDate,viewedUserId,currentUserId,viewedName,meetings,refreshKey=0}:Props){
 const[entries,setEntries]=useState<ScheduleEntry[]>([]);
 const[teachers,setTeachers]=useState<ScheduleTeacher[]>([]);
 const[classes,setClasses]=useState<Klass[]>([]);
 const[busy,setBusy]=useState<Busy[]>([]);
 const[workEntries,setWorkEntries]=useState<WorkEntry[]>([]);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");

 const monday=useMemo(()=>mondayOf(selectedDate),[selectedDate]);
 const days=useMemo(()=>Array.from({length:5},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d}),[monday]);
 const weekStart=iso(days[0]),weekEnd=(()=>{const d=new Date(days[4]);d.setDate(d.getDate()+1);return iso(d)})();

 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!viewedUserId)return;
   setLoading(true);setError("");
   const start=new Date(`${weekStart}T00:00:00`),end=new Date(`${weekEnd}T00:00:00`);
   const[eRes,tRes,cRes,bRes,wRes]=await Promise.all([
    supabase.from("schedule_entries").select("id,class_id,weekday,start_time,end_time,subject,room,entry_kind,recurrence_pattern"),
    supabase.from("schedule_teachers").select("schedule_entry_id,teacher_id").eq("teacher_id",viewedUserId),
    supabase.from("classes").select("id,name"),
    supabase.rpc("staff_busy_intervals",{p_user_ids:[viewedUserId],p_start:start.toISOString(),p_end:end.toISOString()}),
    supabase.from("work_time_entries").select("id,work_date,starts_at,ends_at,category,note").eq("user_id",viewedUserId).gte("work_date",weekStart).lt("work_date",weekEnd).order("work_date").order("starts_at")
   ]);
   if(!active)return;
   setEntries((eRes.data||[]) as ScheduleEntry[]);
   setTeachers((tRes.data||[]) as ScheduleTeacher[]);
   setClasses((cRes.data||[]) as Klass[]);
   setBusy((bRes.data||[]) as Busy[]);
   setWorkEntries((wRes.data||[]) as WorkEntry[]);
   const problem=eRes.error||tRes.error||cRes.error||bRes.error||wRes.error;
   if(problem)setError(problem.message||"Ugen kunne ikke hentes helt.");
   setLoading(false);
  })();
  return()=>{active=false};
 },[viewedUserId,weekStart,weekEnd,refreshKey]);

 const assignedIds=useMemo(()=>new Set(teachers.map(x=>x.schedule_entry_id)),[teachers]);
 const className=(id:number)=>classes.find(c=>c.id===id)?.name||"Klasse";
 const moveWeek=(amount:number)=>{const d=new Date(`${selectedDate}T12:00:00`);d.setDate(d.getDate()+amount*7);onSelectDate(iso(d))};
 const isSelf=viewedUserId===currentUserId;

 function meetingsForDate(date:string){return meetings.filter(m=>m.starts_at.slice(0,10)===date).sort((a,b)=>a.starts_at.localeCompare(b.starts_at))}
 function busyForDate(date:string){const start=new Date(`${date}T00:00:00`).getTime(),end=new Date(`${date}T23:59:59`).getTime();return busy.filter(x=>new Date(x.starts_at).getTime()<=end&&new Date(x.ends_at).getTime()>=start)}
 function entriesForDate(date:string){const weekday=new Date(`${date}T12:00:00`).getDay();return entries.filter(e=>assignedIds.has(e.id)&&e.weekday===weekday&&scheduleOccursOn(e.recurrence_pattern,date)).sort((a,b)=>a.start_time.localeCompare(b.start_time))}
 function workForDate(date:string){return workEntries.filter(x=>x.work_date===date).sort((a,b)=>a.starts_at.localeCompare(b.starts_at))}
 function timeLabel(value:string){return new Date(value).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}

 return <section style={{background:"white",border:"1px solid #ddd9d0",borderRadius:16,padding:18}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
   <div><p style={eyebrow}>UGEPLAN</p><h2 style={{fontFamily:"Georgia,serif",fontSize:26,margin:"4px 0 0"}}>{viewedName}</h2><small style={{color:"#727772"}}>Uge {weekNumber(weekStart)} · {days[0].toLocaleDateString("da-DK",{day:"numeric",month:"short"})} – {days[4].toLocaleDateString("da-DK",{day:"numeric",month:"short"})}</small></div>
   <div style={{display:"flex",gap:7}}><button type="button" onClick={()=>moveWeek(-1)} style={nav}>← Forrige uge</button><button type="button" onClick={()=>onSelectDate(iso(new Date()))} style={nav}>Denne uge</button><button type="button" onClick={()=>moveWeek(1)} style={nav}>Næste uge →</button></div>
  </div>
  {error&&<div style={{marginTop:12,padding:"10px 12px",background:"#fff3cd",borderRadius:8,color:"#765b29"}}>{error}</div>}
  {loading?<div style={{padding:"28px 4px",color:"#727772"}}>Henter ugeplan…</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(155px,1fr))",gap:8,marginTop:16,overflowX:"auto",paddingBottom:4}}>
   {days.map(day=>{const date=iso(day),selected=date===selectedDate,today=date===iso(new Date()),dayEntries=entriesForDate(date),dayBusy=busyForDate(date),dayWork=workForDate(date),absence=dayBusy.some(x=>x.busy_type==="absence"),ownMeetings=isSelf?meetingsForDate(date):[];return <article key={date} onClick={()=>onSelectDate(date)} style={{border:selected?"2px solid #486b59":"1px solid #e1ddd4",borderRadius:12,padding:10,background:selected?"#f3f7f3":today?"#faf7ed":"#faf9f6",minHeight:270,cursor:"pointer"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:7,alignItems:"start"}}><div><strong style={{display:"block",textTransform:"capitalize",fontSize:13}}>{day.toLocaleDateString("da-DK",{weekday:"short"})}</strong><span style={{fontFamily:"Georgia,serif",fontSize:22}}>{day.getDate()}</span></div>{today&&<small style={todayTag}>I DAG</small>}</div>
    {absence&&<div style={{marginTop:8,padding:"7px 8px",borderRadius:8,background:"#f3e6df",color:"#7b4b3f",fontSize:11,fontWeight:900}}>FRAVÆRENDE</div>}
    {dayWork.length>0&&<div style={{marginTop:8,display:"grid",gap:4}}>{dayWork.map(w=><div key={`w-${w.id}`} style={{padding:"6px 7px",borderRadius:8,background:"#e8f0f5",border:"1px solid #cfdfe7"}}><strong style={{fontSize:10}}>{shortTime(w.starts_at)}–{shortTime(w.ends_at)} · {workLabel(w.category)}</strong>{w.note&&<small style={{display:"block",color:"#64747d",marginTop:1}}>{w.note}</small>}</div>)}</div>}
    <div style={{display:"grid",gap:6,marginTop:9}}>
     {dayEntries.map(e=><div key={`s-${e.id}`} style={{padding:"7px 8px",borderRadius:8,background:e.entry_kind==="lesson"?"#e8efe9":"#f0ede6",border:"1px solid #dde3dd"}}><strong style={{fontSize:11}}>{shortTime(e.start_time)}–{shortTime(e.end_time)}</strong><div style={{fontSize:12,fontWeight:800,marginTop:2}}>{e.subject}</div><small style={{display:"block",color:"#6f776f",marginTop:1}}>{kindLabel(e.entry_kind)} · {className(e.class_id)}{e.room?` · ${e.room}`:""}</small></div>)}
     {isSelf?ownMeetings.map(m=><div key={`m-${m.id}`} style={{padding:"7px 8px",borderRadius:8,background:"#eef1f3",border:"1px solid #dce2e5"}}><strong style={{fontSize:11}}>{timeLabel(m.starts_at)}{m.ends_at?`–${timeLabel(m.ends_at)}`:""}</strong><div style={{fontSize:12,fontWeight:800,marginTop:2}}>{m.title}</div><small style={{color:"#6b7479"}}>Møde{m.location?` · ${m.location}`:""}</small></div>):dayBusy.filter(x=>x.busy_type==="meeting").map((x,i)=><div key={`b-${i}-${x.starts_at}`} style={{padding:"7px 8px",borderRadius:8,background:"#eef1f3",border:"1px solid #dce2e5"}}><strong style={{fontSize:11}}>{timeLabel(x.starts_at)}–{timeLabel(x.ends_at)}</strong><div style={{fontSize:12,fontWeight:800,marginTop:2}}>Optaget</div><small style={{color:"#6b7479"}}>Møde</small></div>)}
     {!absence&&dayEntries.length===0&&dayWork.length===0&&(!isSelf?dayBusy.filter(x=>x.busy_type==="meeting").length===0:ownMeetings.length===0)&&<small style={{color:"#929790",padding:"8px 2px"}}>Ingen skemaposter</small>}
    </div>
   </article>})}
  </div>}
 </section>;
}

function weekNumber(value:string){const d=new Date(`${value}T12:00:00`),x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())),day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);const yearStart=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil((((x.getTime()-yearStart.getTime())/86400000)+1)/7)}
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const nav:React.CSSProperties={border:"1px solid #d8d5cd",borderRadius:8,padding:"8px 10px",background:"white",color:"#365044",fontWeight:800,cursor:"pointer"};
const todayTag:React.CSSProperties={fontSize:9,fontWeight:900,letterSpacing:.7,background:"#e6eddc",color:"#496148",padding:"4px 6px",borderRadius:999};
