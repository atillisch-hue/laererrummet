"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../lib/supabase";
import {scheduleOccursOn,type RecurrencePattern} from "../lib/scheduleRecurrence";
import ResumeWorkCard from "./ResumeWorkCard";
import {rememberWork} from "./WorkResumeTracker";

type EntryKind="lesson"|"assembly"|"break"|"duty"|"other";
type Entry={id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;entry_kind:EntryKind;recurrence_pattern:RecurrencePattern};
type Substitute={id:number;schedule_entry_id:number;absent_teacher_id:string;substitute_teacher_id:string;substitute_plan:string|null};
type Klass={id:number;name:string;school_id:number|null};
type Meeting={id:number;title:string;starts_at:string;ends_at:string|null};
type Lesson={id:number;schedule_entry_id:number;subject_unit_id:number|null;status:"planned"|"active"|"completed"|"cancelled";attendance_checked_at:string|null};
type Unit={id:number;title:string};
type Resource={lesson_instance_id:number};
type Profile={user_id:string;initials:string|null;display_name?:string|null};
type DayItem={entry:Entry;mode:"regular"|"substitute"|"absent";assignment?:Substitute};

type Props={selectedDate:string;onMoveDay:(amount:number)=>void;onToday:()=>void};
const isoToday=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const chip:React.CSSProperties={fontSize:9,fontWeight:900,padding:"3px 5px",borderRadius:999,background:"#edf3ee",color:"#536b5b"};
const timeMinutes=(value:string)=>{const[h,m]=value.slice(0,5).split(":").map(Number);return h*60+m};

export default function NoticeboardDayOverview({selectedDate,onMoveDay,onToday}:Props){
 const[loading,setLoading]=useState(true),[error,setError]=useState("");
 const[userId,setUserId]=useState(""),[entries,setEntries]=useState<Entry[]>([]),[substitutes,setSubstitutes]=useState<Substitute[]>([]),[classes,setClasses]=useState<Klass[]>([]),[meetings,setMeetings]=useState<Meeting[]>([]),[lessons,setLessons]=useState<Lesson[]>([]),[units,setUnits]=useState<Unit[]>([]),[resources,setResources]=useState<Resource[]>([]),[profiles,setProfiles]=useState<Profile[]>([]);
 const selected=useMemo(()=>new Date(`${selectedDate}T12:00:00`),[selectedDate]);
 const today=isoToday(),isToday=selectedDate===today;

 useEffect(()=>{
  let active=true;
  (async()=>{
   setLoading(true);setError("");
   const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;
   if(!user){if(active){setLoading(false);setError("Dagen kunne ikke åbnes.")}return}
   if(active)setUserId(user.id);
   const teacherRes=await supabase.from("schedule_teachers").select("schedule_entry_id").eq("teacher_id",user.id);
   if(!active)return;
   const regularIds=(teacherRes.data||[]).map(x=>Number(x.schedule_entry_id)).filter(Boolean);
   const[subRes,meetingRes]=await Promise.all([
    supabase.from("substitute_assignments").select("id,schedule_entry_id,absent_teacher_id,substitute_teacher_id,substitute_plan").eq("assignment_date",selectedDate).or(`absent_teacher_id.eq.${user.id},substitute_teacher_id.eq.${user.id}`),
    supabase.from("calendar_meetings").select("id,title,starts_at,ends_at").gte("starts_at",`${selectedDate}T00:00:00`).lt("starts_at",nextDate(selectedDate)).order("starts_at")
   ]);
   if(!active)return;
   const subRows=(subRes.data||[]) as Substitute[];
   const allEntryIds=Array.from(new Set([...regularIds,...subRows.map(x=>x.schedule_entry_id)]));
   const entryRes=allEntryIds.length?await supabase.from("schedule_entries").select("id,class_id,weekday,start_time,end_time,subject,room,entry_kind,recurrence_pattern").in("id",allEntryIds):{data:[],error:null};
   if(!active)return;
   const rawEntries=(entryRes.data||[]) as Entry[],weekday=selected.getDay();
   const dayEntries=rawEntries.filter(e=>e.weekday===weekday&&scheduleOccursOn(e.recurrence_pattern,selectedDate));
   const classIds=Array.from(new Set(dayEntries.map(x=>x.class_id))),lessonEntryIds=dayEntries.filter(x=>x.entry_kind==="lesson").map(x=>x.id);
   const[classRes,lessonRes]=await Promise.all([
    classIds.length?supabase.from("classes").select("id,name,school_id").in("id",classIds):Promise.resolve({data:[],error:null}),
    lessonEntryIds.length?supabase.from("lesson_instances").select("id,schedule_entry_id,subject_unit_id,status,attendance_checked_at").in("schedule_entry_id",lessonEntryIds).eq("lesson_date",selectedDate):Promise.resolve({data:[],error:null})
   ]);
   if(!active)return;
   const lessonRows=(lessonRes.data||[]) as Lesson[],unitIds=Array.from(new Set(lessonRows.map(x=>x.subject_unit_id).filter((x):x is number=>typeof x==="number"))),lessonIds=lessonRows.map(x=>x.id);
   const otherUserIds=Array.from(new Set(subRows.flatMap(x=>[x.absent_teacher_id,x.substitute_teacher_id]).filter(x=>x!==user.id)));
   const[unitRes,resourceRes,profileRes]=await Promise.all([
    unitIds.length?supabase.from("subject_units").select("id,title").in("id",unitIds):Promise.resolve({data:[],error:null}),
    lessonIds.length?supabase.from("lesson_resource_links").select("lesson_instance_id").in("lesson_instance_id",lessonIds):Promise.resolve({data:[],error:null}),
    otherUserIds.length?supabase.from("user_profiles").select("user_id,initials,display_name").in("user_id",otherUserIds):Promise.resolve({data:[],error:null})
   ]);
   if(!active)return;
   setEntries(dayEntries);setSubstitutes(subRows);setClasses((classRes.data||[]) as Klass[]);setMeetings((meetingRes.data||[]) as Meeting[]);setLessons(lessonRows);setUnits((unitRes.data||[]) as Unit[]);setResources((resourceRes.data||[]) as Resource[]);setProfiles((profileRes.data||[]) as Profile[]);
   const problem=teacherRes.error||subRes.error||meetingRes.error||entryRes.error||classRes.error||lessonRes.error||unitRes.error||resourceRes.error||profileRes.error;
   if(problem)setError("Noget af dagens overblik kunne ikke hentes.");
   setLoading(false);
  })();
  return()=>{active=false};
 },[selectedDate,selected]);

 const regularIds=useMemo(()=>new Set(entries.map(x=>x.id).filter(id=>!substitutes.some(s=>s.schedule_entry_id===id&&s.substitute_teacher_id===userId))),[entries,substitutes,userId]);
 const dayItems=useMemo(()=>{
  const rows:DayItem[]=[];
  for(const entry of entries){
   const absent=substitutes.find(s=>s.schedule_entry_id===entry.id&&s.absent_teacher_id===userId);
   const substitute=substitutes.find(s=>s.schedule_entry_id===entry.id&&s.substitute_teacher_id===userId);
   if(substitute)rows.push({entry,mode:"substitute",assignment:substitute});
   else if(absent)rows.push({entry,mode:"absent",assignment:absent});
   else if(regularIds.has(entry.id))rows.push({entry,mode:"regular"});
  }
  return rows.sort((a,b)=>a.entry.start_time.localeCompare(b.entry.start_time));
 },[entries,substitutes,userId,regularIds]);
 const combined=useMemo(()=>[
  ...dayItems.map(item=>({kind:"schedule" as const,time:item.entry.start_time,item})),
  ...meetings.map(meeting=>({kind:"meeting" as const,time:new Date(meeting.starts_at).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit",hour12:false}),meeting}))
 ].sort((a,b)=>a.time.localeCompare(b.time)),[dayItems,meetings]);
 const label=selected.toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long"});
 const classRow=(id:number)=>classes.find(x=>x.id===id)||null;
 const className=(id:number)=>classRow(id)?.name||"Klasse";
 const personName=(id:string)=>{const p=profiles.find(x=>x.user_id===id);return p?.initials?.trim()?.toUpperCase()||p?.display_name||"kollega"};
 const lessonFor=(entryId:number)=>lessons.find(x=>x.schedule_entry_id===entryId)||null;
 const unitFor=(id:number|null)=>units.find(x=>x.id===id)?.title||null;
 const resourceCount=(id:number)=>resources.filter(x=>x.lesson_instance_id===id).length;
 const now=new Date(),nowMinutes=now.getHours()*60+now.getMinutes();
 const startMinutes=(row:(typeof combined)[number])=>row.kind==="schedule"?timeMinutes(row.item.entry.start_time):new Date(row.meeting.starts_at).getHours()*60+new Date(row.meeting.starts_at).getMinutes();
 const endMinutes=(row:(typeof combined)[number])=>row.kind==="schedule"?timeMinutes(row.item.entry.end_time):row.meeting.ends_at?new Date(row.meeting.ends_at).getHours()*60+new Date(row.meeting.ends_at).getMinutes():startMinutes(row)+30;
 const remainingToday=isToday?combined.filter(row=>endMinutes(row)>=nowMinutes):combined;
 const displayed=(!isToday?combined:remainingToday.length?remainingToday:combined.slice(-4)).slice(0,4);
 const currentIndex=isToday?displayed.findIndex(row=>startMinutes(row)<=nowMinutes&&endMinutes(row)>=nowMinutes):-1;
 const focusIndex=isToday?(currentIndex>=0?currentIndex:displayed.findIndex(row=>startMinutes(row)>nowMinutes)):-1;
 const focusLabel=currentIndex>=0?"NU":"NÆSTE";
 const attendanceDue=(entry:Entry)=>selectedDate<today||(isToday&&timeMinutes(entry.start_time)<=nowMinutes);

 return <article style={overviewCard}>
  <div style={{display:"flex",justifyContent:"space-between",gap:9,alignItems:"start"}}><div><p style={eyebrow}>{isToday?"I DAG · ":""}{label.toUpperCase()}</p><h2 style={overviewTitle}>Min dag</h2></div><div style={{display:"flex",gap:5}}><button onClick={()=>onMoveDay(-1)} style={arrowButton}>←</button>{!isToday&&<button onClick={onToday} style={arrowButton}>•</button>}<button onClick={()=>onMoveDay(1)} style={arrowButton}>→</button></div></div>
  {loading?<div style={quietBox}>Henter din dag…</div>:error&&combined.length===0?<div style={warningBox}>{error}</div>:combined.length===0?<div style={quietBox}>Ingen skema- eller mødepunkter denne dag.</div>:<div style={{display:"grid",gap:6,marginTop:9}}>{displayed.map((row,index)=>row.kind==="meeting"?<div key={`m-${row.meeting.id}`} style={{...meetingRow,border:index===focusIndex?"2px solid #b5c7b9":"1px solid #dce2e5"}}><div style={{display:"flex",justifyContent:"space-between",gap:7}}><strong style={{fontSize:11}}>{row.time}{row.meeting.ends_at?`–${new Date(row.meeting.ends_at).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}`:""} · MØDE</strong>{index===focusIndex&&<span style={focusTag}>{focusLabel}</span>}</div><div style={{fontWeight:850,fontSize:13,marginTop:2}}>{row.meeting.title}</div></div>:(()=>{const{entry,mode,assignment}=row.item,lesson=lessonFor(entry.id),unit=lesson?unitFor(lesson.subject_unit_id):null,count=lesson?resourceCount(lesson.id):0,klass=classRow(entry.class_id),href=`/calendar/lesson/${entry.id}?date=${selectedDate}`;return <div key={`s-${entry.id}-${mode}`} style={{...lessonRow,background:mode==="substitute"?"#edf3ee":mode==="absent"?"#f5ece3":"#f8f8f5",border:index===focusIndex?"2px solid #b5c7b9":"1px solid #e0ddd5"}}><div style={{display:"flex",justifyContent:"space-between",gap:7}}><strong style={{fontSize:11}}>{entry.start_time.slice(0,5)}–{entry.end_time.slice(0,5)} · {entry.subject}</strong><span style={{display:"flex",gap:4,alignItems:"center"}}>{index===focusIndex&&<span style={focusTag}>{focusLabel}</span>}{mode!=="regular"&&<span style={mode==="substitute"?subTag:absentTag}>{mode==="substitute"?"VIKAR":"FRAVÆR"}</span>}</span></div><div style={{fontWeight:850,fontSize:13,marginTop:2}}>{className(entry.class_id)}{unit?` · ${unit}`:""}</div>{mode==="substitute"&&assignment&&<small style={{display:"block",color:"#667168",marginTop:2}}>for {personName(assignment.absent_teacher_id)}{assignment.substitute_plan?` · ${assignment.substitute_plan}`:""}</small>}{lesson&&mode!=="absent"&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginTop:5}}>{count>0&&<span style={chip}>{count} koblet</span>}{lesson.attendance_checked_at?<span style={chip}>Fravær ført ✓</span>:attendanceDue(entry)?<span style={{...chip,background:"#f4eee0",color:"#75623f"}}>Fravær ikke ført</span>:null}{lesson.status==="completed"&&<span style={chip}>Afsluttet ✓</span>}</div>}{entry.entry_kind==="lesson"&&mode!=="absent"&&<Link href={href} onClick={()=>{void rememberWork({schoolId:klass?.school_id,objectType:"lesson",objectKey:`${entry.id}:${selectedDate}`,title:`${entry.subject} · ${className(entry.class_id)}`,subtitle:unit?`${unit} · ${entry.start_time.slice(0,5)}–${entry.end_time.slice(0,5)}`:`${entry.start_time.slice(0,5)}–${entry.end_time.slice(0,5)}`,href})}} style={lessonLink}>Åbn time →</Link>}</div>})())}</div>}
  {combined.length>displayed.length&&<small style={{display:"block",marginTop:7,color:"#747c76"}}>+ {combined.length-displayed.length} andre punkter i kalenderen</small>}
  {error&&combined.length>0&&<small style={{display:"block",marginTop:7,color:"#8a6337"}}>Noget af dagens status kunne ikke hentes.</small>}
  <div style={{marginTop:9}}><ResumeWorkCard compact/></div>
  <Link href={`/calendar?date=${selectedDate}`} style={cardLink}>Åbn dagen i Kalender →</Link>
 </article>;
}

function nextDate(value:string){const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T00:00:00`}
const overviewCard:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:"16px 17px",minHeight:170,display:"flex",flexDirection:"column"};
const overviewTitle:React.CSSProperties={fontFamily:"Georgia,serif",margin:"4px 0 0",fontSize:23};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:0,textTransform:"uppercase"};
const arrowButton:React.CSSProperties={border:"1px solid #cbc7be",background:"white",borderRadius:7,padding:"4px 7px",cursor:"pointer",fontWeight:900,color:"#365044"};
const quietBox:React.CSSProperties={marginTop:10,padding:"10px 11px",background:"#eef2ed",borderRadius:9,color:"#52675b",fontSize:12,fontWeight:800};
const warningBox:React.CSSProperties={...quietBox,background:"#fff3cd",color:"#765b29"};
const lessonRow:React.CSSProperties={padding:"8px 9px",borderRadius:8,border:"1px solid #e0ddd5"};
const meetingRow:React.CSSProperties={padding:"8px 9px",borderRadius:8,background:"#eef1f3",border:"1px solid #dce2e5"};
const subTag:React.CSSProperties={fontSize:9,fontWeight:900,padding:"3px 5px",borderRadius:999,background:"#dce9df",color:"#4b6655"};
const absentTag:React.CSSProperties={...subTag,background:"#efe0d3",color:"#795641"};
const focusTag:React.CSSProperties={fontSize:9,fontWeight:950,padding:"3px 6px",borderRadius:999,background:"#365044",color:"white",letterSpacing:.5};
const lessonLink:React.CSSProperties={display:"inline-block",marginTop:5,color:"#486b59",fontWeight:900,fontSize:11,textDecoration:"none"};
const cardLink:React.CSSProperties={display:"inline-block",marginTop:"auto",paddingTop:10,color:"#365044",fontWeight:850,textDecoration:"none",fontSize:12};
