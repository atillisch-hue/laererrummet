"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useParams,useSearchParams} from "next/navigation";
import {supabase} from "../../../../lib/supabase";
import {hasRole} from "../../../../lib/roles";
import LessonAttendance from "../LessonAttendance";
import LessonResources from "../LessonResources";

type Entry={id:number;class_id:number;class_subject_id:number|null;weekday:number;start_time:string;end_time:string;subject:string;room:string|null};
type Klass={id:number;name:string;school_id:number|null};
type Lesson={id:number;schedule_entry_id:number;lesson_date:string;learning_goals:string|null;plan:string|null;materials:unknown;status:"planned"|"active"|"completed"|"cancelled";started_at:string|null;ended_at:string|null;carry_forward_to:string|null;carry_forward_note:string|null};
type CarryFrom={lesson_date:string;carry_forward_note:string|null};
type ClosedDay={date:string;label?:string};
type LessonOverride=Partial<Pick<Lesson,"status"|"started_at"|"ended_at"|"carry_forward_to"|"carry_forward_note">>;

const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"12px 13px",border:"1px solid #d8d5cd",borderRadius:9,font:"inherit",background:"white",color:"#26342e"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:22};
const action:React.CSSProperties={border:0,borderRadius:9,padding:"11px 15px",fontWeight:900,cursor:"pointer",background:"#486b59",color:"white"};
const dateOnly=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const shortDate=(value:string)=>new Date(value+"T12:00:00").toLocaleDateString("da-DK",{weekday:"short",day:"numeric",month:"short"});

export default function LessonWorkRoom(){
 const params=useParams<{scheduleId:string}>();
 const search=useSearchParams();
 const scheduleId=Number(params.scheduleId);
 const lessonDate=search.get("date")||"";
 const[ready,setReady]=useState(false);
 const[entry,setEntry]=useState<Entry|null>(null);
 const[klass,setKlass]=useState<Klass|null>(null);
 const[lessonId,setLessonId]=useState<number|null>(null);
 const[goals,setGoals]=useState("");
 const[plan,setPlan]=useState("");
 const[materialsText,setMaterialsText]=useState("");
 const[status,setStatus]=useState<Lesson["status"]>("planned");
 const[startedAt,setStartedAt]=useState<string|null>(null);
 const[endedAt,setEndedAt]=useState<string|null>(null);
 const[carryNote,setCarryNote]=useState("");
 const[carriedTo,setCarriedTo]=useState<string|null>(null);
 const[carryFrom,setCarryFrom]=useState<CarryFrom|null>(null);
 const[closedDates,setClosedDates]=useState<string[]>([]);
 const[canEdit,setCanEdit]=useState(false);
 const[message,setMessage]=useState("");
 const[saving,setSaving]=useState(false);

 const validDate=/^\d{4}-\d{2}-\d{2}$/.test(lessonDate);
 const dateLabel=useMemo(()=>validDate?new Date(lessonDate+"T12:00:00").toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"Ugyldig dato",[lessonDate,validDate]);
 const closedSet=useMemo(()=>new Set(closedDates),[closedDates]);
 const nextLessonDate=useMemo(()=>{
  if(!validDate)return "";
  const d=new Date(lessonDate+"T12:00:00");
  let candidate="";
  for(let i=0;i<52;i++){
   d.setDate(d.getDate()+7);
   candidate=dateOnly(d);
   if(!closedSet.has(candidate))return candidate;
  }
  return candidate;
 },[lessonDate,validDate,closedSet]);
 const skippedClosures=useMemo(()=>{
  if(!validDate||!nextLessonDate)return 0;
  const first=new Date(lessonDate+"T12:00:00");first.setDate(first.getDate()+7);
  const last=new Date(nextLessonDate+"T12:00:00");
  let count=0;
  while(first<last){if(closedSet.has(dateOnly(first)))count++;first.setDate(first.getDate()+7)}
  return count;
 },[lessonDate,nextLessonDate,validDate,closedSet]);

 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!Number.isFinite(scheduleId)||scheduleId<=0||!validDate){setMessage("Lektionen kunne ikke åbnes, fordi dato eller skemabrikken er ugyldig.");setReady(true);return}
   const{data:auth}=await supabase.auth.getSession();
   const user=auth.session?.user;
   if(!user){window.location.replace("/");return}

   const[eRes,tRes,lRes,fRes]=await Promise.all([
    supabase.from("schedule_entries").select("id,class_id,class_subject_id,weekday,start_time,end_time,subject,room").eq("id",scheduleId).maybeSingle(),
    supabase.from("schedule_teachers").select("schedule_entry_id").eq("schedule_entry_id",scheduleId).eq("teacher_id",user.id).maybeSingle(),
    supabase.from("lesson_instances").select("id,schedule_entry_id,lesson_date,learning_goals,plan,materials,status,started_at,ended_at,carry_forward_to,carry_forward_note").eq("schedule_entry_id",scheduleId).eq("lesson_date",lessonDate).maybeSingle(),
    supabase.from("lesson_instances").select("lesson_date,carry_forward_note").eq("schedule_entry_id",scheduleId).eq("carry_forward_to",lessonDate).order("lesson_date",{ascending:false}).limit(1).maybeSingle()
   ]);
   if(!active)return;
   if(eRes.error||!eRes.data){setMessage("Du har ikke adgang til denne lektion, eller skemabrikken findes ikke.");setReady(true);return}

   const e=eRes.data as Entry;
   if(new Date(lessonDate+"T12:00:00").getDay()!==e.weekday){setMessage("Den valgte dato passer ikke til denne skemabrik.");setReady(true);return}

   const{data:c}=await supabase.from("classes").select("id,name,school_id").eq("id",e.class_id).maybeSingle();
   if(!active)return;
   const classData=(c||null) as Klass|null;
   setEntry(e);
   setKlass(classData);
   setCanEdit(!!tRes.data||hasRole(user,"admin"));
   setCarryFrom((fRes.data||null) as CarryFrom|null);

   if(classData?.school_id){
    const{data:settings}=await supabase.from("school_settings").select("closed_days").eq("school_id",classData.school_id).maybeSingle();
    if(!active)return;
    const days=Array.isArray(settings?.closed_days)?(settings.closed_days as ClosedDay[]):[];
    setClosedDates(days.map(x=>x?.date).filter((x):x is string=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)));
   }

   const l=lRes.data as Lesson|null;
   if(l){
    setLessonId(l.id);
    setGoals(l.learning_goals||"");
    setPlan(l.plan||"");
    setStatus(l.status);
    setStartedAt(l.started_at);
    setEndedAt(l.ended_at);
    setCarryNote(l.carry_forward_note||"");
    setCarriedTo(l.carry_forward_to);
    setMaterialsText(Array.isArray(l.materials)?l.materials.filter(x=>typeof x==="string").join("\n"):"");
   }
   setReady(true);
  })();
  return()=>{active=false};
 },[scheduleId,lessonDate,validDate]);

 const persist=async(overrides?:LessonOverride)=>{
  if(!entry||!canEdit)return false;
  setSaving(true);setMessage("");
  const nextStatus=overrides?.status??status;
  const nextStarted=overrides?.started_at===undefined?startedAt:overrides.started_at;
  const nextEnded=overrides?.ended_at===undefined?endedAt:overrides.ended_at;
  const nextCarryTo=overrides?.carry_forward_to===undefined?carriedTo:overrides.carry_forward_to;
  const nextCarryNote=overrides?.carry_forward_note===undefined?carryNote:overrides.carry_forward_note;
  const materials=materialsText.split("\n").map(x=>x.trim()).filter(Boolean);
  const payload={schedule_entry_id:entry.id,lesson_date:lessonDate,learning_goals:goals.trim()||null,plan:plan.trim()||null,materials,status:nextStatus,started_at:nextStarted,ended_at:nextEnded,carry_forward_to:nextCarryTo,carry_forward_note:nextCarryNote?.trim()||null};
  const result=lessonId
   ?await supabase.from("lesson_instances").update(payload).eq("id",lessonId).select("id,status,started_at,ended_at,carry_forward_to,carry_forward_note").single()
   :await supabase.from("lesson_instances").insert(payload).select("id,status,started_at,ended_at,carry_forward_to,carry_forward_note").single();
  if(result.error){setMessage(`Kunne ikke gemme lektionen: ${result.error.message}`);setSaving(false);return false}
  setLessonId(result.data.id);
  setStatus(result.data.status as Lesson["status"]);
  setStartedAt(result.data.started_at);
  setEndedAt(result.data.ended_at);
  setCarriedTo(result.data.carry_forward_to);
  setCarryNote(result.data.carry_forward_note||"");
  setMessage("Gemt ✓");setSaving(false);return true;
 };

 const startLesson=async()=>{const now=startedAt||new Date().toISOString();await persist({status:"active",started_at:now,ended_at:null})};
 const finishLesson=async()=>{const now=new Date().toISOString();await persist({status:"completed",started_at:startedAt||now,ended_at:now})};
 const moveForward=async()=>{
  const note=carryNote.trim();
  if(!note){setMessage("Skriv først kort, hvad I ikke nåede.");return}
  const ok=await persist({carry_forward_to:nextLessonDate,carry_forward_note:note});
  if(ok)setMessage(`Flyttet videre til ${shortDate(nextLessonDate)} ✓`);
 };
 const clearCarry=async()=>{const ok=await persist({carry_forward_to:null,carry_forward_note:null});if(ok)setMessage("Videreførsel fjernet ✓")};

 if(!ready)return <main style={{padding:50}}>Åbner lektionen…</main>;
 if(!entry)return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"60px 24px",color:"#26342e"}}><section style={{...card,maxWidth:720,margin:"0 auto"}}><h1>Lektionen kunne ikke åbnes</h1><p>{message}</p><Link href="/calendar">← Til kalenderen</Link></section></main>;

 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1080,margin:"0 auto"}}><Link href="/calendar" style={{color:"#e7ddd0",textDecoration:"none",fontWeight:800}}>← Kalender</Link><p style={{fontSize:11,fontWeight:900,letterSpacing:1.5,opacity:.65,margin:"22px 0 5px"}}>LEKTION · {dateLabel.toUpperCase()}</p><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"0 0 5px"}}>{entry.subject}</h1><p style={{margin:0,opacity:.8}}>{klass?.name||"Klasse"} · {entry.start_time.slice(0,5)}–{entry.end_time.slice(0,5)}{entry.room?` · ${entry.room}`:""}</p></div></header>
  <section style={{maxWidth:1080,margin:"0 auto",padding:"30px 24px 80px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18,alignItems:"start"}}>
   <div style={{display:"grid",gap:16,minWidth:0}}>
    {!canEdit&&<div style={{padding:"13px 15px",borderRadius:10,background:"#fff4dc",border:"1px solid #e6cf9a",color:"#685a3c"}}><strong>Vikarvisning</strong><div style={{marginTop:4,fontSize:14}}>Du kan se planen og materialerne, men kun den tilknyttede lærer eller en administrator kan ændre dem.</div></div>}
    {carryFrom?.carry_forward_note&&<section style={{padding:"16px 18px",borderRadius:12,background:"#fff4dc",border:"1px solid #e5cf9c"}}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#856f44",margin:0}}>FORTSAT FRA {shortDate(carryFrom.lesson_date).toUpperCase()}</p><p style={{margin:"8px 0 0",lineHeight:1.55,color:"#584d38",whiteSpace:"pre-wrap"}}>{carryFrom.carry_forward_note}</p></section>}
    <LessonAttendance classId={entry.class_id} date={lessonDate} canEdit={canEdit}/>
    <section style={card}><label style={{fontWeight:900,display:"block"}}>Læringsmål</label><p style={{fontSize:13,color:"#747b75",margin:"5px 0 10px"}}>Hvad skal eleverne have med sig fra lektionen?</p><textarea disabled={!canEdit} value={goals} onChange={e=>setGoals(e.target.value)} rows={4} style={input} placeholder="Fx: Eleverne kan forklare forskellen på argument og belæg…"/></section>
    <section style={card}><label style={{fontWeight:900,display:"block"}}>Plan for lektionen</label><p style={{fontSize:13,color:"#747b75",margin:"5px 0 10px"}}>Skriv den plan, du selv eller en vikar skal kunne arbejde videre fra.</p><textarea disabled={!canEdit} value={plan} onChange={e=>setPlan(e.target.value)} rows={10} style={input} placeholder={'Fx:\n08.00 – intro\n08.10 – fælles læsning\n08.30 – makkeropgave…'}/></section>
    <section style={card}><label style={{fontWeight:900,display:"block"}}>Hurtige materialer og links</label><p style={{fontSize:13,color:"#747b75",margin:"5px 0 10px"}}>Til frie noter: ét link eller materialenavn pr. linje. Genbrugeligt fagindhold kobles nedenfor uden at blive kopieret.</p><textarea disabled={!canEdit} value={materialsText} onChange={e=>setMaterialsText(e.target.value)} rows={5} style={input} placeholder={'Jeg er Henry – kap. 4\nhttps://…\nArbejdsark: Argumenter'}/></section>
    <LessonResources lessonId={lessonId} classId={entry.class_id} canEdit={canEdit}/>
    {canEdit&&<section style={{...card,background:"#f8f3e7"}}><label style={{fontWeight:900,display:"block"}}>Nåede I ikke det hele?</label><p style={{fontSize:13,color:"#746c5a",margin:"5px 0 10px"}}>Skriv det, der skal fortsætte. Det vises automatisk, når du åbner næste skoledag med samme skemabrik — uden at kopiere planen.</p><textarea value={carryNote} onChange={e=>setCarryNote(e.target.value)} rows={4} style={input} placeholder="Fx: Vi nåede ikke den fælles opsamling. Start næste gang med gruppernes sidste argument."/><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:11}}><button disabled={saving||!carryNote.trim()} onClick={moveForward} style={{...action,background:"#8b7652",opacity:saving||!carryNote.trim()?0.5:1}}>Flyt til {shortDate(nextLessonDate)} →</button>{carriedTo&&<button disabled={saving} onClick={clearCarry} style={{border:"1px solid #cfc5b2",borderRadius:9,padding:"10px 12px",fontWeight:800,background:"white",color:"#6d604b",cursor:"pointer"}}>Fjern videreførsel</button>}</div>{skippedClosures>0&&<small style={{display:"block",marginTop:9,color:"#786a51"}}>Springer {skippedClosures} lukket skoleuge{skippedClosures===1?"":"r"} over.</small>}{carriedTo&&<small style={{display:"block",marginTop:7,color:"#786a51",fontWeight:800}}>Markeret til {shortDate(carriedTo)}</small>}</section>}
    {canEdit&&<div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><button disabled={saving} onClick={()=>persist()} style={{...action,opacity:saving?0.6:1}}>{saving?"Gemmer…":"Gem lektion"}</button>{message&&<strong style={{color:message.startsWith("Kunne")?"#8b342e":"#4f6d59"}}>{message}</strong>}</div>}
   </div>
   <aside style={{display:"grid",gap:14,minWidth:0}}>
    <section style={card}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0}}>STATUS</p><h2 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"7px 0 12px"}}>{status==="active"?"I gang":status==="completed"?"Afsluttet":status==="cancelled"?"Aflyst":"Planlagt"}</h2>{startedAt&&<small style={{display:"block",color:"#707670"}}>Startet {new Date(startedAt).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}</small>}{endedAt&&<small style={{display:"block",color:"#707670",marginTop:4}}>Afsluttet {new Date(endedAt).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}</small>}{canEdit&&<div style={{display:"grid",gap:8,marginTop:16}}>{status!=="active"&&status!=="completed"&&<button onClick={startLesson} disabled={saving} style={action}>▶ Start lektion</button>}{status!=="completed"&&<button onClick={finishLesson} disabled={saving} style={{...action,background:"#6c755f"}}>✓ Afslut lektion</button>}</div>}</section>
    <section style={card}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0}}>KLASSEN</p><h3 style={{fontFamily:"Georgia,serif",fontSize:20,margin:"7px 0 12px"}}>{klass?.name||"Klasse"}</h3>{canEdit&&entry.class_subject_id&&<Link href={`/students/subjects/${entry.class_subject_id}`} style={{display:"block",color:"#486b59",fontWeight:900,textDecoration:"none",marginBottom:10}}>Åbn {entry.subject}-faglokalet →</Link>}<Link href={`/students?class=${entry.class_id}`} style={{display:"block",color:"#486b59",fontWeight:900,textDecoration:"none"}}>Elever & fravær →</Link><Link href={`/teacher-overview?class=${entry.class_id}`} style={{display:"block",color:"#486b59",fontWeight:900,textDecoration:"none",marginTop:10}}>Opgaver & besvarelser →</Link></section>
    <section style={{...card,background:"#eef2ed"}}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0}}>NÆSTE SAMME TIME</p><h3 style={{fontFamily:"Georgia,serif",fontSize:19,margin:"7px 0 10px"}}>{shortDate(nextLessonDate)}</h3>{skippedClosures>0&&<small style={{display:"block",color:"#6d756f",marginBottom:9}}>Skolekalenderen springer lukkede uger over.</small>}<Link href={`/calendar/lesson/${entry.id}?date=${nextLessonDate}`} style={{color:"#486b59",fontWeight:900,textDecoration:"none"}}>Åbn næste lektion →</Link></section>
   </aside>
  </section>
 </main>;
}