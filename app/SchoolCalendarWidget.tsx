"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {usePathname} from "next/navigation";
import {supabase} from "../lib/supabase";

type ClosedDay={date:string;label:string};
type ScheduleEntry={id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null};
type ScheduleTeacher={schedule_entry_id:number;teacher_id:string};
type SubstituteAssignment={id:number;schedule_entry_id:number;assignment_date:string;absent_teacher_id:string;substitute_teacher_id:string;substitute_plan:string|null};
type Task={id:number;title:string;due_date:string|null;completed:boolean;responsible_user_id:string|null};
type Klass={id:number;name:string};
type Staff={user_id:string;display_name:string;role:string};

const iso=(d:Date)=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`};
function week(s:string){const d=new Date(s+"T12:00:00"),x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())),day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);const ys=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil((((x.getTime()-ys.getTime())/86400000)+1)/7)}

export default function SchoolCalendarWidget({selectedDate,onSelectDate,markedDates=[]}:{selectedDate?:string;onSelectDate?:(date:string)=>void;markedDates?:string[]}){
 const pathname=usePathname();
 const[closed,setClosed]=useState<ClosedDay[]>([]);
 const[view,setView]=useState(()=>{const n=selectedDate?new Date(selectedDate+"T12:00:00"):new Date();return new Date(n.getFullYear(),n.getMonth(),1)});
 const[userId,setUserId]=useState("");
 const[schedule,setSchedule]=useState<ScheduleEntry[]>([]);
 const[scheduleTeachers,setScheduleTeachers]=useState<ScheduleTeacher[]>([]);
 const[substitutions,setSubstitutions]=useState<SubstituteAssignment[]>([]);
 const[tasks,setTasks]=useState<Task[]>([]);
 const[classes,setClasses]=useState<Klass[]>([]);
 const[staff,setStaff]=useState<Staff[]>([]);

 useEffect(()=>{supabase.from("school_settings").select("closed_days").eq("id",1).maybeSingle().then(({data})=>{if(Array.isArray(data?.closed_days))setClosed(data.closed_days)})},[]);
 useEffect(()=>{if(selectedDate){const d=new Date(selectedDate+"T12:00:00");setView(new Date(d.getFullYear(),d.getMonth(),1))}},[selectedDate]);
 useEffect(()=>{
  if(pathname!=="/calendar")return;
  let active=true;
  (async()=>{
   const{data:auth}=await supabase.auth.getSession();
   const uid=auth.session?.user.id||"";
   if(!uid||!active)return;
   setUserId(uid);
   const[eRes,stRes,subRes,tRes,cRes,pRes]=await Promise.all([
    supabase.from("schedule_entries").select("id,class_id,weekday,start_time,end_time,subject,room"),
    supabase.from("schedule_teachers").select("schedule_entry_id,teacher_id").eq("teacher_id",uid),
    supabase.from("substitute_assignments").select("id,schedule_entry_id,assignment_date,absent_teacher_id,substitute_teacher_id,substitute_plan"),
    supabase.from("meeting_actions").select("id,title,due_date,completed,responsible_user_id").eq("responsible_user_id",uid).eq("completed",false),
    supabase.from("classes").select("id,name"),
    supabase.rpc("get_internal_staff_directory")
   ]);
   if(!active)return;
   setSchedule((eRes.data||[]) as ScheduleEntry[]);
   setScheduleTeachers((stRes.data||[]) as ScheduleTeacher[]);
   setSubstitutions((subRes.data||[]) as SubstituteAssignment[]);
   setTasks((tRes.data||[]) as Task[]);
   setClasses((cRes.data||[]) as Klass[]);
   setStaff((pRes.data||[]) as Staff[]);
  })();
  return()=>{active=false};
 },[pathname]);

 const marked=useMemo(()=>new Map(closed.map(x=>[x.date,x.label])),[closed]);
 const special=useMemo(()=>new Set(markedDates),[markedDates]);
 const weeks=useMemo(()=>{const first=new Date(view.getFullYear(),view.getMonth(),1);let d=new Date(first);d.setDate(d.getDate()-((d.getDay()+6)%7));const last=new Date(view.getFullYear(),view.getMonth()+1,0),out:{num:number;days:Date[]}[]=[];while(d<=last){const days=Array.from({length:7},(_,i)=>{const x=new Date(d);x.setDate(x.getDate()+i);return x});out.push({num:week(iso(d)),days});d.setDate(d.getDate()+7)}return out},[view]);
 const events=closed.filter(x=>{const d=new Date(x.date+"T12:00:00");return d.getFullYear()===view.getFullYear()&&d.getMonth()===view.getMonth()}).reduce<{label:string;dates:string[]}[]>((a,x)=>{let g=a.find(y=>y.label===x.label);if(!g){g={label:x.label,dates:[]};a.push(g)}g.dates.push(x.date);return a},[]);
 const choose=(s:string)=>{if(onSelectDate){onSelectDate(s);return}if(typeof window!=="undefined"&&window.location.pathname==="/noticeboard"){window.dispatchEvent(new CustomEvent("noticeboard-date",{detail:s}))}};

 const activeDate=selectedDate||iso(new Date());
 const weekday=new Date(activeDate+"T12:00:00").getDay();
 const regularIds=new Set(scheduleTeachers.map(x=>x.schedule_entry_id));
 const daySubs=substitutions.filter(x=>x.assignment_date===activeDate&&(x.absent_teacher_id===userId||x.substitute_teacher_id===userId));
 const relevantIds=new Set<number>([...Array.from(regularIds),...daySubs.filter(x=>x.substitute_teacher_id===userId).map(x=>x.schedule_entry_id)]);
 const dayLessons=schedule.filter(x=>x.weekday===weekday&&relevantIds.has(x.id)).sort((a,b)=>a.start_time.localeCompare(b.start_time));
 const dayTasks=tasks.filter(x=>x.due_date===activeDate);
 const staffName=(id:string)=>staff.find(x=>x.user_id===id)?.display_name||"kollega";
 const className=(id:number)=>classes.find(x=>x.id===id)?.name||"Klasse";

 return <div style={{display:"grid",gap:14}}>
  <section style={{background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:20}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}}><div><p style={{fontSize:10,fontWeight:800,letterSpacing:1.5,color:"#718077",margin:0}}>SKOLEKALENDER</p><h2 style={{fontFamily:"Georgia,serif",textTransform:"capitalize",margin:"6px 0 0"}}>{view.toLocaleDateString("da-DK",{month:"long",year:"numeric"})}</h2></div><div style={{display:"flex",gap:6}}><button style={nav} onClick={()=>setView(v=>new Date(v.getFullYear(),v.getMonth()-1,1))}>←</button><button style={nav} onClick={()=>setView(v=>new Date(v.getFullYear(),v.getMonth()+1,1))}>→</button></div></div>
   <div style={{display:"grid",gridTemplateColumns:"34px repeat(5,1fr)",gap:3,marginTop:14}}><b style={head}>U</b>{["M","T","O","T","F"].map((x,i)=><b key={i} style={head}>{x}</b>)}{weeks.map((w,i)=><div key={`${w.num}-${i}`} style={{display:"contents"}}><span style={wk}>{w.num}</span>{w.days.slice(0,5).map(d=>{const s=iso(d),off=marked.get(s),other=d.getMonth()!==view.getMonth(),today=s===iso(new Date()),selected=s===selectedDate,hasSpecial=special.has(s);return <button key={s} onClick={()=>choose(s)} title={off||"Vis dagen"} style={{...day,opacity:other?.3:1,background:selected?"#365044":off?"#efe0b7":today?"#e7eee9":"#faf9f6",color:selected?"white":"inherit",borderColor:selected?"#365044":today?"#86a294":"#eee9df",cursor:"pointer"}}><strong>{d.getDate()}</strong>{(off||hasSpecial)&&<span style={{display:"block",width:5,height:5,borderRadius:9,background:selected?"#dfa94f":hasSpecial?"#486b59":"#a57c2b",margin:"3px auto 0"}}/>}</button>})}</div>)}</div>
   {events.length>0&&<div style={{borderTop:"1px solid #eee9df",marginTop:14,paddingTop:10}}>{events.slice(0,3).map(e=><div key={e.label} style={{fontSize:12,color:"#59645e",marginTop:5}}><strong>{e.label}</strong> · {new Date(e.dates.sort()[0]+"T12:00:00").toLocaleDateString("da-DK",{day:"numeric",month:"short"})}</div>)}</div>}
  </section>
  {pathname==="/calendar"&&<section style={{background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:18}}>
   <p style={{fontSize:10,fontWeight:900,letterSpacing:1.5,color:"#718077",margin:0}}>MIN DAG</p>
   <h3 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"6px 0 12px"}}>{new Date(activeDate+"T12:00:00").toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long"})}</h3>
   <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}><span style={chip}>Undervisning {dayLessons.length}</span><span style={chip}>Vikarændringer {daySubs.length}</span><span style={chip}>Deadlines {dayTasks.length}</span></div>
   {dayLessons.length===0&&dayTasks.length===0?<p style={{color:"#737b75",fontSize:13,margin:"10px 0 0"}}>Ingen undervisning eller deadlines i dit arbejdsflow denne dag.</p>:<div style={{display:"grid",gap:8}}>
    {dayLessons.map(entry=>{const change=daySubs.find(x=>x.schedule_entry_id===entry.id);const absent=change?.absent_teacher_id===userId;const substitute=change?.substitute_teacher_id===userId;return <Link key={`lesson-${entry.id}`} href={`/teacher-room/schedule?date=${activeDate}`} style={{textDecoration:"none",color:"inherit",border:"1px solid #e2ded5",borderRadius:10,padding:"11px 12px",background:absent?"#f5eadc":substitute?"#e7eee9":"#faf9f6",display:"block"}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><strong style={{fontSize:13}}>{entry.start_time.slice(0,5)}–{entry.end_time.slice(0,5)} · {entry.subject}</strong>{(absent||substitute)&&<small style={{fontWeight:900,color:"#6c5d43"}}>{absent?"FRAVÆR":"VIKAR"}</small>}</div><small style={{display:"block",color:"#717771",marginTop:3}}>{className(entry.class_id)}{entry.room?` · ${entry.room}`:""}</small>{substitute&&change?.substitute_plan&&<small style={{display:"block",marginTop:6,color:"#52675a"}}>Vikarplan: {change.substitute_plan}</small>}{absent&&change&&<small style={{display:"block",marginTop:6,color:"#765f42"}}>Vikar: {staffName(change.substitute_teacher_id)}</small>}</Link>})}
    {dayTasks.map(task=><Link key={`task-${task.id}`} href="/my-tasks" style={{textDecoration:"none",color:"inherit",border:"1px solid #e2ded5",borderRadius:10,padding:"11px 12px",background:"#fff7e8",display:"block"}}><strong style={{fontSize:13}}>Deadline · {task.title}</strong><small style={{display:"block",color:"#7a6a4b",marginTop:3}}>Åbn Mine opgaver →</small></Link>)}
   </div>}
  </section>}
 </div>;
}

const nav:React.CSSProperties={width:32,height:30,border:"1px solid #d8d4ca",borderRadius:7,background:"#faf8f3",cursor:"pointer"};
const head:React.CSSProperties={fontSize:10,textAlign:"center",color:"#7a817b",padding:3};
const wk:React.CSSProperties={display:"grid",placeItems:"center",fontSize:10,fontWeight:800,color:"#486b59",background:"#f0eadc",borderRadius:5,minHeight:32};
const day:React.CSSProperties={display:"grid",placeItems:"center",minHeight:32,border:"1px solid",borderRadius:5,fontSize:11,fontFamily:"inherit"};
const chip:React.CSSProperties={fontSize:11,fontWeight:800,color:"#53635a",background:"#eef1ed",border:"1px solid #dde3dd",borderRadius:999,padding:"5px 8px"};
