"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {rememberWork} from "../WorkResumeTracker";

type EntryKind="lesson"|"assembly"|"break"|"duty"|"other";
type ScheduleEntry={id:number;occurrence_date:string;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;entry_kind:EntryKind};
type ScheduleOccurrenceRow={user_id:string;occurrence_date:string;schedule_entry_id:number;schedule_version_id:number;school_id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;class_subject_id:number|null;entry_kind:EntryKind;recurrence_pattern:string};
type Klass={id:number;name:string;school_id:number|null};
type Busy={user_id:string;starts_at:string;ends_at:string;busy_type:"meeting"|"absence"|string};
type Meeting={id:number;title:string;meeting_type:string;starts_at:string;ends_at:string|null;location:string|null};
type WorkEntry={id:number;work_date:string;starts_at:string;ends_at:string;category:string;note:string|null};
type LessonInstance={id:number;schedule_entry_id:number;lesson_date:string;subject_unit_id:number|null;status:"planned"|"active"|"completed"|"cancelled";attendance_checked_at:string|null};
type SubjectUnit={id:number;title:string};
type ResourceLink={lesson_instance_id:number};
type EventKind="pedagogical"|"special_week"|"project"|"trip"|"event"|"other";
type ClosedDay={date:string;label:string};
type CalendarEvent={date:string;label:string;kind:EventKind};
type SchoolSetting={school_id:number;closed_days:ClosedDay[]|null;calendar_events:CalendarEvent[]|null};
type CalendarMark={date:string;label:string;kind:"closed"|EventKind};

type Props={selectedDate:string;onSelectDate:(date:string)=>void;viewedUserId:string;currentUserId:string;viewedName:string;meetings:Meeting[];refreshKey?:number};

const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const mondayOf=(value:string)=>{const d=new Date(`${value}T12:00:00`);const day=d.getDay()||7;d.setDate(d.getDate()-(day-1));return d};
const shortTime=(value:string)=>value.slice(0,5);
const kindLabel=(kind:EntryKind)=>({lesson:"Undervisning",assembly:"Samling",break:"Pause",duty:"Gårdvagt",other:"Aktivitet"}[kind]);
const workLabel=(value:string)=>({teaching:"Undervisning",preparation:"Forberedelse",meeting:"Møde",supervision:"Tilsyn",administration:"Administration",other:"Arbejdstid"}[value]||"Arbejdstid");
const markLabel=(kind:CalendarMark["kind"])=>({closed:"Lukket",pedagogical:"Pædagogisk dag",special_week:"Specialuge",project:"Projekt-/faguge",trip:"Tur / lejrskole",event:"Arrangement",other:"Skolemarkering"}[kind]);
const markStyle=(kind:CalendarMark["kind"]):React.CSSProperties=>kind==="closed"?{background:"#efe0b7",color:"#725823",border:"1px solid #dcc58e"}:kind==="pedagogical"?{background:"#eee7f1",color:"#65516d",border:"1px solid #d9cbe0"}:kind==="special_week"||kind==="project"?{background:"#e5edf2",color:"#47616d",border:"1px solid #cbdbe3"}:{background:"#e8efe9",color:"#526b5b",border:"1px solid #d1ddd3"};

export default function WeekScheduleView({selectedDate,onSelectDate,viewedUserId,currentUserId,viewedName,meetings,refreshKey=0}:Props){
 const[entries,setEntries]=useState<ScheduleEntry[]>([]),[classes,setClasses]=useState<Klass[]>([]),[busy,setBusy]=useState<Busy[]>([]),[workEntries,setWorkEntries]=useState<WorkEntry[]>([]),[lessons,setLessons]=useState<LessonInstance[]>([]),[units,setUnits]=useState<SubjectUnit[]>([]),[resourceLinks,setResourceLinks]=useState<ResourceLink[]>([]),[calendarMarks,setCalendarMarks]=useState<CalendarMark[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 const monday=useMemo(()=>mondayOf(selectedDate),[selectedDate]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d}),[monday]);
 const weekStart=iso(days[0]),weekLast=iso(days[6]),weekEnd=(()=>{const d=new Date(days[6]);d.setDate(d.getDate()+1);return iso(d)})();

 useEffect(()=>{
  let active=true;(async()=>{
   if(!viewedUserId)return;setLoading(true);setError("");
   const start=new Date(`${weekStart}T00:00:00`),end=new Date(`${weekEnd}T00:00:00`);
   const[oRes,cRes,bRes,wRes,sRes]=await Promise.all([
    supabase.rpc("staff_schedule_occurrences",{p_user_ids:[viewedUserId],p_start_date:weekStart,p_end_date:weekLast}),
    supabase.from("classes").select("id,name,school_id"),
    supabase.rpc("staff_busy_intervals",{p_user_ids:[viewedUserId],p_start:start.toISOString(),p_end:end.toISOString()}),
    supabase.from("work_time_entries").select("id,work_date,starts_at,ends_at,category,note").eq("user_id",viewedUserId).gte("work_date",weekStart).lt("work_date",weekEnd).order("work_date").order("starts_at"),
    supabase.from("school_settings").select("school_id,closed_days,calendar_events")
   ]);
   if(!active)return;
   const occurrenceRows=((oRes.data||[]) as ScheduleOccurrenceRow[]).map(row=>({id:Number(row.schedule_entry_id),occurrence_date:row.occurrence_date,class_id:Number(row.class_id),weekday:Number(row.weekday),start_time:row.start_time,end_time:row.end_time,subject:row.subject,room:row.room,entry_kind:row.entry_kind}));
   const assignedEntryIds=Array.from(new Set(occurrenceRows.map(x=>x.id)));
   let lessonRows:LessonInstance[]=[],unitRows:SubjectUnit[]=[],resourceRows:ResourceLink[]=[];
   if(assignedEntryIds.length){
    const lessonRes=await supabase.from("lesson_instances").select("id,schedule_entry_id,lesson_date,subject_unit_id,status,attendance_checked_at").in("schedule_entry_id",assignedEntryIds).gte("lesson_date",weekStart).lt("lesson_date",weekEnd).order("lesson_date");
    if(!active)return;lessonRows=(lessonRes.data||[]) as LessonInstance[];
    const unitIds=Array.from(new Set(lessonRows.map(x=>x.subject_unit_id).filter((x):x is number=>typeof x==="number"))),lessonIds=lessonRows.map(x=>x.id);
    const[uRes,rRes]=await Promise.all([unitIds.length?supabase.from("subject_units").select("id,title").in("id",unitIds):Promise.resolve({data:[],error:null}),lessonIds.length?supabase.from("lesson_resource_links").select("lesson_instance_id").in("lesson_instance_id",lessonIds):Promise.resolve({data:[],error:null})]);
    if(!active)return;unitRows=(uRes.data||[]) as SubjectUnit[];resourceRows=(rRes.data||[]) as ResourceLink[];if(lessonRes.error||uRes.error||rRes.error)setError((lessonRes.error||uRes.error||rRes.error)?.message||"Noget af lektionsstatus kunne ikke hentes.");
   }
   const settings=(sRes.data||[]) as SchoolSetting[];
   setCalendarMarks(settings.flatMap(row=>[
    ...(Array.isArray(row.closed_days)?row.closed_days:[]).map(x=>({date:x.date,label:x.label,kind:"closed" as const})),
    ...(Array.isArray(row.calendar_events)?row.calendar_events:[]).map(x=>({date:x.date,label:x.label,kind:x.kind}))
   ]));
   setEntries(occurrenceRows);setClasses((cRes.data||[]) as Klass[]);setBusy((bRes.data||[]) as Busy[]);setWorkEntries((wRes.data||[]) as WorkEntry[]);setLessons(lessonRows);setUnits(unitRows);setResourceLinks(resourceRows);
   const problem=oRes.error||cRes.error||bRes.error||wRes.error||sRes.error;if(problem)setError(problem.message||"Ugen kunne ikke hentes helt.");setLoading(false);
  })();return()=>{active=false};
 },[viewedUserId,weekStart,weekLast,weekEnd,refreshKey]);

 const classRow=(id:number)=>classes.find(c=>c.id===id)||null,className=(id:number)=>classRow(id)?.name||"Klasse";
 const moveWeek=(amount:number)=>{const d=new Date(`${selectedDate}T12:00:00`);d.setDate(d.getDate()+amount*7);onSelectDate(iso(d))},isSelf=viewedUserId===currentUserId;
 const meetingsForDate=(date:string)=>meetings.filter(m=>m.starts_at.slice(0,10)===date).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const busyForDate=(date:string)=>{const start=new Date(`${date}T00:00:00`).getTime(),end=new Date(`${date}T23:59:59`).getTime();return busy.filter(x=>new Date(x.starts_at).getTime()<=end&&new Date(x.ends_at).getTime()>=start)};
 const entriesForDate=(date:string)=>entries.filter(e=>e.occurrence_date===date).sort((a,b)=>a.start_time.localeCompare(b.start_time));
 const workForDate=(date:string)=>workEntries.filter(x=>x.work_date===date).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
 const marksForDate=(date:string)=>calendarMarks.filter(x=>x.date===date);
 const timeLabel=(value:string)=>new Date(value).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"});
 const lessonFor=(entryId:number,date:string)=>lessons.find(x=>x.schedule_entry_id===entryId&&x.lesson_date===date)||null,unitTitle=(unitId:number|null)=>units.find(x=>x.id===unitId)?.title||null,resourceCount=(lessonId:number)=>resourceLinks.filter(x=>x.lesson_instance_id===lessonId).length;

 return <section style={{background:"white",border:"1px solid #ddd9d0",borderRadius:16,padding:18}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}><div><p style={eyebrow}>UGEPLAN</p><h2 style={{fontFamily:"Georgia,serif",fontSize:26,margin:"4px 0 0"}}>{viewedName}</h2><small style={{color:"#727772"}}>Uge {weekNumber(weekStart)} · {days[0].toLocaleDateString("da-DK",{day:"numeric",month:"short"})} – {days[6].toLocaleDateString("da-DK",{day:"numeric",month:"short"})}</small></div><div style={{display:"flex",gap:7}}><button type="button" onClick={()=>moveWeek(-1)} style={nav}>← Forrige uge</button><button type="button" onClick={()=>onSelectDate(iso(new Date()))} style={nav}>Denne uge</button><button type="button" onClick={()=>moveWeek(1)} style={nav}>Næste uge →</button></div></div>
  {error&&<div style={{marginTop:12,padding:"10px 12px",background:"#fff3cd",borderRadius:8,color:"#765b29"}}>{error}</div>}
  {loading?<div style={{padding:"28px 4px",color:"#727772"}}>Henter ugeplan…</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(145px,1fr))",gap:8,marginTop:16,overflowX:"auto",paddingBottom:4}}>
   {days.map(day=>{const date=iso(day),selected=date===selectedDate,today=date===iso(new Date()),weekend=day.getDay()===0||day.getDay()===6,dayEntries=entriesForDate(date),dayBusy=busyForDate(date),dayWork=workForDate(date),dayMarks=marksForDate(date),absence=dayBusy.some(x=>x.busy_type==="absence"),ownMeetings=isSelf?meetingsForDate(date):[];return <article key={date} onClick={()=>onSelectDate(date)} style={{border:selected?"2px solid #486b59":"1px solid #e1ddd4",borderRadius:12,padding:10,background:selected?"#f3f7f3":today?"#faf7ed":weekend?"#f6f4ef":"#faf9f6",minHeight:290,cursor:"pointer"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:7,alignItems:"start"}}><div><strong style={{display:"block",textTransform:"capitalize",fontSize:13}}>{day.toLocaleDateString("da-DK",{weekday:"short"})}</strong><span style={{fontFamily:"Georgia,serif",fontSize:22}}>{day.getDate()}</span></div>{today&&<small style={todayTag}>I DAG</small>}</div>
    {dayMarks.length>0&&<div style={{display:"grid",gap:4,marginTop:7}}>{dayMarks.map((mark,i)=><div key={`${mark.kind}-${mark.label}-${i}`} style={{...markStyle(mark.kind),padding:"5px 6px",borderRadius:7,fontSize:9,fontWeight:900,lineHeight:1.25}}>{markLabel(mark.kind).toUpperCase()} · {mark.label}</div>)}</div>}
    {absence&&<div style={{marginTop:8,padding:"7px 8px",borderRadius:8,background:"#f3e6df",color:"#7b4b3f",fontSize:11,fontWeight:900}}>FRAVÆRENDE</div>}
    {dayWork.length>0&&<div style={{marginTop:8,display:"grid",gap:4}}>{dayWork.map(w=><div key={`w-${w.id}`} style={{padding:"6px 7px",borderRadius:8,background:"#e8f0f5",border:"1px solid #cfdfe7"}}><strong style={{fontSize:10}}>{shortTime(w.starts_at)}–{shortTime(w.ends_at)} · {workLabel(w.category)}</strong>{w.note&&<small style={{display:"block",color:"#64747d",marginTop:1}}>{w.note}</small>}</div>)}</div>}
    <div style={{display:"grid",gap:6,marginTop:9}}>
     {dayEntries.map(e=>{const lesson=e.entry_kind==="lesson"?lessonFor(e.id,date):null,unit=lesson?unitTitle(lesson.subject_unit_id):null,count=lesson?resourceCount(lesson.id):0,isPastOrToday=date<=iso(new Date()),klass=classRow(e.class_id),href=`/calendar/lesson/${e.id}?date=${date}`;return <div key={`s-${e.id}`} style={{padding:"7px 8px",borderRadius:8,background:e.entry_kind==="lesson"?"#e8efe9":"#f0ede6",border:"1px solid #dde3dd"}}><strong style={{fontSize:11}}>{shortTime(e.start_time)}–{shortTime(e.end_time)}</strong><div style={{fontSize:12,fontWeight:800,marginTop:2}}>{e.subject}</div>{unit&&<div style={{fontSize:11,fontWeight:900,color:"#4f6758",marginTop:3}}>↳ {unit}</div>}<small style={{display:"block",color:"#6f776f",marginTop:2}}>{kindLabel(e.entry_kind)} · {className(e.class_id)}{e.room?` · ${e.room}`:""}</small>{lesson&&<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>{count>0&&<span style={lessonChip}>{count} koblet</span>}{lesson.attendance_checked_at&&<span style={lessonChip}>Fravær ført ✓</span>}{isPastOrToday&&!lesson.attendance_checked_at&&<span style={{...lessonChip,background:"#f4eee0",color:"#75623f"}}>Fravær ikke ført</span>}{lesson.status==="completed"&&<span style={lessonChip}>Afsluttet ✓</span>}</div>}{isSelf&&e.entry_kind==="lesson"&&<Link onClick={event=>{event.stopPropagation();void rememberWork({schoolId:klass?.school_id,objectType:"lesson",objectKey:`${e.id}:${date}`,title:`${e.subject} · ${className(e.class_id)}`,subtitle:unit?`${unit} · ${shortTime(e.start_time)}–${shortTime(e.end_time)}`:`${shortTime(e.start_time)}–${shortTime(e.end_time)}`,href})}} href={href} style={{display:"inline-block",marginTop:6,color:"#486b59",fontSize:11,fontWeight:900,textDecoration:"none"}}>Åbn time →</Link>}</div>})}
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
const lessonChip:React.CSSProperties={fontSize:9,fontWeight:900,padding:"3px 5px",borderRadius:999,background:"#edf3ee",color:"#536b5b"};
