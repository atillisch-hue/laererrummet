"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useParams,useSearchParams} from "next/navigation";
import {supabase} from "../../../../lib/supabase";
import {hasRole} from "../../../../lib/roles";
import {recurrenceLabel,scheduleOccursOn,type RecurrencePattern} from "../../../../lib/scheduleRecurrence";
import LessonAttendance from "../LessonAttendance";
import LessonResources from "../LessonResources";

type Entry={id:number;class_id:number;class_subject_id:number|null;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;recurrence_pattern:RecurrencePattern};
type Klass={id:number;name:string;school_id:number|null};
type Lesson={id:number;schedule_entry_id:number;lesson_date:string;subject_unit_id:number|null;learning_goals:string|null;plan:string|null;materials:unknown;status:"planned"|"active"|"completed"|"cancelled";started_at:string|null;ended_at:string|null;carry_forward_to:string|null;carry_forward_note:string|null};
type SubjectUnit={id:number;title:string;driving_question:string|null;learning_goals:string[];start_date:string|null;end_date:string|null;status:"planned"|"active"|"completed"};
type CarryFrom={lesson_date:string;carry_forward_note:string|null};
type ClosedDay={date:string;label?:string};
type LessonOverride=Partial<Pick<Lesson,"status"|"started_at"|"ended_at"|"carry_forward_to"|"carry_forward_note">>;
type LessonResourceLink={subject_room_item_id:number|null;assignment_id:number|null;position:number};

const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"12px 13px",border:"1px solid #d8d5cd",borderRadius:9,font:"inherit",background:"white",color:"#26342e"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:22};
const action:React.CSSProperties={border:0,borderRadius:9,padding:"11px 15px",fontWeight:900,cursor:"pointer",background:"#486b59",color:"white"};
const dateOnly=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const shortDate=(value:string)=>new Date(value+"T12:00:00").toLocaleDateString("da-DK",{weekday:"short",day:"numeric",month:"short"});
const unitPeriod=(unit:SubjectUnit)=>unit.start_date||unit.end_date?`${unit.start_date?shortDate(unit.start_date):"?"} → ${unit.end_date?shortDate(unit.end_date):"?"}`:"Ingen fast periode";

export default function LessonWorkRoom(){
 const params=useParams<{scheduleId:string}>();
 const search=useSearchParams();
 const scheduleId=Number(params.scheduleId);
 const lessonDate=search.get("date")||"";
 const[ready,setReady]=useState(false);
 const[entry,setEntry]=useState<Entry|null>(null);
 const[klass,setKlass]=useState<Klass|null>(null);
 const[lessonId,setLessonId]=useState<number|null>(null);
 const[subjectUnits,setSubjectUnits]=useState<SubjectUnit[]>([]);
 const[subjectUnitId,setSubjectUnitId]=useState<number|null>(null);
 const[goals,setGoals]=useState("");
 const[plan,setPlan]=useState("");
 const[materialsText,setMaterialsText]=useState("");
 const[status,setStatus]=useState<Lesson["status"]>("planned");
 const[startedAt,setStartedAt]=useState<string|null>(null);
 const[endedAt,setEndedAt]=useState<string|null>(null);
 const[carryNote,setCarryNote]=useState("");
 const[carriedTo,setCarriedTo]=useState<string|null>(null);
 const[carryFrom,setCarryFrom]=useState<CarryFrom|null>(null);
 const[carryResources,setCarryResources]=useState(true);
 const[closedDates,setClosedDates]=useState<string[]>([]);
 const[canEdit,setCanEdit]=useState(false);
 const[message,setMessage]=useState("");
 const[saving,setSaving]=useState(false);

 const validDate=/^\d{4}-\d{2}-\d{2}$/.test(lessonDate);
 const dateLabel=useMemo(()=>validDate?new Date(lessonDate+"T12:00:00").toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"Ugyldig dato",[lessonDate,validDate]);
 const activeUnit=useMemo(()=>subjectUnits.find(unit=>unit.id===subjectUnitId)||null,[subjectUnits,subjectUnitId]);
 const closedSet=useMemo(()=>new Set(closedDates),[closedDates]);
 const nextLessonDate=useMemo(()=>{
  if(!validDate||!entry)return "";
  const d=new Date(lessonDate+"T12:00:00");
  let candidate="";
  for(let i=0;i<52;i++){
   d.setDate(d.getDate()+7);
   candidate=dateOnly(d);
   if(!scheduleOccursOn(entry.recurrence_pattern,candidate))continue;
   if(!closedSet.has(candidate))return candidate;
  }
  return candidate;
 },[lessonDate,validDate,closedSet,entry]);
 const skippedClosures=useMemo(()=>{
  if(!validDate||!nextLessonDate||!entry)return 0;
  const first=new Date(lessonDate+"T12:00:00");first.setDate(first.getDate()+7);
  const last=new Date(nextLessonDate+"T12:00:00");
  let count=0;
  while(first<last){const candidate=dateOnly(first);if(scheduleOccursOn(entry.recurrence_pattern,candidate)&&closedSet.has(candidate))count++;first.setDate(first.getDate()+7)}
  return count;
 },[lessonDate,nextLessonDate,validDate,closedSet,entry]);

 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!Number.isFinite(scheduleId)||scheduleId<=0||!validDate){setMessage("Lektionen kunne ikke åbnes, fordi dato eller skemabrikken er ugyldig.");setReady(true);return}
   const{data:auth}=await supabase.auth.getSession();
   const user=auth.session?.user;
   if(!user){window.location.replace("/");return}

   const[eRes,tRes,lRes,fRes]=await Promise.all([
    supabase.from("schedule_entries").select("id,class_id,class_subject_id,weekday,start_time,end_time,subject,room,recurrence_pattern").eq("id",scheduleId).maybeSingle(),
    supabase.from("schedule_teachers").select("schedule_entry_id").eq("schedule_entry_id",scheduleId).eq("teacher_id",user.id).maybeSingle(),
    supabase.from("lesson_instances").select("id,schedule_entry_id,lesson_date,subject_unit_id,learning_goals,plan,materials,status,started_at,ended_at,carry_forward_to,carry_forward_note").eq("schedule_entry_id",scheduleId).eq("lesson_date",lessonDate).maybeSingle(),
    supabase.from("lesson_instances").select("lesson_date,carry_forward_note").eq("schedule_entry_id",scheduleId).eq("carry_forward_to",lessonDate).order("lesson_date",{ascending:false}).limit(1).maybeSingle()
   ]);
   if(!active)return;
   if(eRes.error||!eRes.data){setMessage("Du har ikke adgang til denne lektion, eller skemabrikken findes ikke.");setReady(true);return}

   const e=eRes.data as Entry;
   if(new Date(lessonDate+"T12:00:00").getDay()!==e.weekday||!scheduleOccursOn(e.recurrence_pattern,lessonDate)){setMessage("Den valgte dato passer ikke til denne skemabriks ugedag eller uge-rytme.");setReady(true);return}

   const unitPromise=e.class_subject_id
    ?supabase.from("subject_units").select("id,title,driving_question,learning_goals,start_date,end_date,status").eq("class_subject_id",e.class_subject_id).neq("status","archived").order("start_date",{ascending:true,nullsFirst:false}).order("position")
    :Promise.resolve({data:[],error:null});
   const[cRes,uRes]=await Promise.all([
    supabase.from("classes").select("id,name,school_id").eq("id",e.class_id).maybeSingle(),
    unitPromise
   ]);
   if(!active)return;
   const classData=(cRes.data||null) as Klass|null;
   setEntry(e);
   setKlass(classData);
   setSubjectUnits((uRes.data||[]) as SubjectUnit[]);
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
    setSubjectUnitId(l.subject_unit_id);
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

 const persist=async(overrides?:LessonOverride):Promise<number|null>=>{
  if(!entry||!canEdit)return null;
  setSaving(true);setMessage("");
  const nextStatus=overrides?.status??status;
  const nextStarted=overrides?.started_at===undefined?startedAt:overrides.started_at;
  const nextEnded=overrides?.ended_at===undefined?endedAt:overrides.ended_at;
  const nextCarryTo=overrides?.carry_forward_to===undefined?carriedTo:overrides.carry_forward_to;
  const nextCarryNote=overrides?.carry_forward_note===undefined?carryNote:overrides.carry_forward_note;
  const materials=materialsText.split("\n").map(x=>x.trim()).filter(Boolean);
  const payload={schedule_entry_id:entry.id,lesson_date:lessonDate,subject_unit_id:subjectUnitId,learning_goals:goals.trim()||null,plan:plan.trim()||null,materials,status:nextStatus,started_at:nextStarted,ended_at:nextEnded,carry_forward_to:nextCarryTo,carry_forward_note:nextCarryNote?.trim()||null};
  const result=lessonId
   ?await supabase.from("lesson_instances").update(payload).eq("id",lessonId).select("id,subject_unit_id,status,started_at,ended_at,carry_forward_to,carry_forward_note").single()
   :await supabase.from("lesson_instances").insert(payload).select("id,subject_unit_id,status,started_at,ended_at,carry_forward_to,carry_forward_note").single();
  if(result.error){setMessage(`Kunne ikke gemme lektionen: ${result.error.message}`);setSaving(false);return null}
  setLessonId(result.data.id);
  setSubjectUnitId(result.data.subject_unit_id);
  setStatus(result.data.status as Lesson["status"]);
  setStartedAt(result.data.started_at);
  setEndedAt(result.data.ended_at);
  setCarriedTo(result.data.carry_forward_to);
  setCarryNote(result.data.carry_forward_note||"");
  setMessage("Gemt ✓");setSaving(false);return Number(result.data.id);
 };

 const useUnitGoals=()=>{
  if(!activeUnit?.learning_goals?.length)return;
  const existing=goals.split("\n").map(x=>x.trim()).filter(Boolean);
  const merged=[...existing,...activeUnit.learning_goals.filter(goal=>!existing.includes(goal))];
  setGoals(merged.join("\n"));
  setMessage("Forløbets mål er lagt ind i lektionen. Husk at gemme.");
 };
 const startLesson=async()=>{const now=startedAt||new Date().toISOString();await persist({status:"active",started_at:now,ended_at:null})};
 const finishLesson=async()=>{const now=new Date().toISOString();await persist({status:"completed",started_at:startedAt||now,ended_at:now})};
 const moveForward=async()=>{
  const note=carryNote.trim();
  if(!entry||!nextLessonDate)return;
  if(!note){setMessage("Skriv først kort, hvad I ikke nåede.");return}
  const sourceLessonId=await persist({carry_forward_to:nextLessonDate,carry_forward_note:note});
  if(!sourceLessonId)return;

  let copied=0;
  let sourceCount=0;
  if(carryResources){
   setSaving(true);
   const sourceResult=await supabase.from("lesson_resource_links").select("subject_room_item_id,assignment_id,position").eq("lesson_instance_id",sourceLessonId);
   if(sourceResult.error){setSaving(false);setMessage(`Noten er flyttet til ${shortDate(nextLessonDate)}, men materialerne kunne ikke hentes.`);return}
   const sourceLinks=(sourceResult.data||[]) as LessonResourceLink[];
   sourceCount=sourceLinks.length;

   if(sourceLinks.length>0){
    const nextResult=await supabase.from("lesson_instances").select("id").eq("schedule_entry_id",entry.id).eq("lesson_date",nextLessonDate).maybeSingle();
    if(nextResult.error){setSaving(false);setMessage(`Noten er flyttet til ${shortDate(nextLessonDate)}, men næste lektion kunne ikke åbnes.`);return}
    let nextLessonId=Number(nextResult.data?.id||0);
    if(!nextLessonId){
     const created=await supabase.from("lesson_instances").insert({schedule_entry_id:entry.id,lesson_date:nextLessonDate,subject_unit_id:subjectUnitId}).select("id").single();
     if(created.error){setSaving(false);setMessage(`Noten er flyttet til ${shortDate(nextLessonDate)}, men næste lektion kunne ikke oprettes.`);return}
     nextLessonId=Number(created.data.id);
    }

    const existingResult=await supabase.from("lesson_resource_links").select("subject_room_item_id,assignment_id").eq("lesson_instance_id",nextLessonId);
    if(existingResult.error){setSaving(false);setMessage(`Noten er flyttet til ${shortDate(nextLessonDate)}, men eksisterende materialer kunne ikke kontrolleres.`);return}
    const existingItems=new Set((existingResult.data||[]).map(x=>x.subject_room_item_id).filter((x):x is number=>typeof x==="number"));
    const existingAssignments=new Set((existingResult.data||[]).map(x=>x.assignment_id).filter((x):x is number=>typeof x==="number"));
    const rows=sourceLinks.filter(link=>(typeof link.subject_room_item_id==="number"&&!existingItems.has(link.subject_room_item_id))||(typeof link.assignment_id==="number"&&!existingAssignments.has(link.assignment_id))).map(link=>({lesson_instance_id:nextLessonId,subject_room_item_id:link.subject_room_item_id,assignment_id:link.assignment_id,position:link.position}));
    if(rows.length>0){
     const copiedResult=await supabase.from("lesson_resource_links").insert(rows);
     if(copiedResult.error){setSaving(false);setMessage(`Noten er flyttet til ${shortDate(nextLessonDate)}, men materialerne kunne ikke kobles videre.`);return}
     copied=rows.length;
    }
   }
   setSaving(false);
  }

  if(carryResources&&sourceCount>0)setMessage(copied>0?`Flyttet til ${shortDate(nextLessonDate)} · ${copied} materiale${copied===1?"":"r"}/opgave${copied===1?"":"r"} fulgte med ✓`:`Flyttet til ${shortDate(nextLessonDate)} · materialerne var allerede koblet på ✓`);
  else setMessage(`Flyttet videre til ${shortDate(nextLessonDate)} ✓`);
 };
 const clearCarry=async()=>{const saved=await persist({carry_forward_to:null,carry_forward_note:null});if(saved)setMessage("Videreførsel fjernet ✓")};

 if(!ready)return <main style={{padding:50}}>Åbner lektionen…</main>;
 if(!entry)return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"60px 24px",color:"#26342e"}}><section style={{...card,maxWidth:720,margin:"0 auto"}}><h1>Lektionen kunne ikke åbnes</h1><p>{message}</p><Link href="/calendar">← Til kalenderen</Link></section></main>;

 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1080,margin:"0 auto"}}><Link href="/calendar" style={{color:"#e7ddd0",textDecoration:"none",fontWeight:800}}>← Kalender</Link><p style={{fontSize:11,fontWeight:900,letterSpacing:1.5,opacity:.65,margin:"22px 0 5px"}}>LEKTION · {dateLabel.toUpperCase()}</p><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"0 0 5px"}}>{entry.subject}</h1><p style={{margin:0,opacity:.8}}>{klass?.name||"Klasse"} · {entry.start_time.slice(0,5)}–{entry.end_time.slice(0,5)}{entry.room?` · ${entry.room}`:""}{entry.recurrence_pattern!=="weekly"?` · ${recurrenceLabel(entry.recurrence_pattern)}`:""}</p></div></header>
  <section style={{maxWidth:1080,margin:"0 auto",padding:"30px 24px 80px",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18,alignItems:"start"}}>
   <div style={{display:"grid",gap:16,minWidth:0}}>
    {!canEdit&&<div style={{padding:"13px 15px",borderRadius:10,background:"#fff4dc",border:"1px solid #e6cf9a",color:"#685a3c"}}><strong>Vikarvisning</strong><div style={{marginTop:4,fontSize:14}}>Du kan se planen og materialerne, men kun den tilknyttede lærer eller en administrator kan ændre dem.</div></div>}
    {carryFrom?.carry_forward_note&&<section style={{padding:"16px 18px",borderRadius:12,background:"#fff4dc",border:"1px solid #e5cf9c"}}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#856f44",margin:0}}>FORTSAT FRA {shortDate(carryFrom.lesson_date).toUpperCase()}</p><p style={{margin:"8px 0 0",lineHeight:1.55,color:"#584d38",whiteSpace:"pre-wrap"}}>{carryFrom.carry_forward_note}</p></section>}
    {entry.class_subject_id&&<section style={{...card,background:"#eef2ed"}}><label style={{fontWeight:900,display:"block"}}>Forløb</label><p style={{fontSize:13,color:"#68746d",margin:"5px 0 10px"}}>Kobl timen til årsplanens levende forløb. Koblingen ændrer ikke selve skemaet.</p><select disabled={!canEdit} value={subjectUnitId??""} onChange={e=>setSubjectUnitId(e.target.value?Number(e.target.value):null)} style={input}><option value="">Ikke koblet til et forløb</option>{subjectUnits.map(unit=><option key={unit.id} value={unit.id}>{unit.status==="active"?"I gang · ":unit.status==="planned"?"Kommende · ":"Afsluttet · "}{unit.title}</option>)}</select>{activeUnit&&<div style={{marginTop:12,padding:"12px 13px",borderRadius:10,background:"white",border:"1px solid #d7dfd8"}}><strong style={{fontFamily:"Georgia,serif",fontSize:19}}>{activeUnit.title}</strong>{activeUnit.driving_question&&<p style={{margin:"7px 0",lineHeight:1.5,color:"#526159"}}>“{activeUnit.driving_question}”</p>}<small style={{display:"block",color:"#737b75"}}>{unitPeriod(activeUnit)}</small>{activeUnit.learning_goals.length>0&&<><p style={{fontSize:10,fontWeight:900,letterSpacing:1.1,color:"#718077",margin:"11px 0 5px"}}>FORLØBETS MÅL</p><ul style={{paddingLeft:19,margin:"0 0 10px",fontSize:13,lineHeight:1.5,color:"#4c5a52"}}>{activeUnit.learning_goals.map(goal=><li key={goal}>{goal}</li>)}</ul>{canEdit&&<button type="button" onClick={useUnitGoals} style={{border:"1px solid #bfcac1",borderRadius:8,padding:"8px 10px",background:"#f8faf8",color:"#486b59",fontWeight:850,cursor:"pointer"}}>Brug målene i denne lektion</button>}</>}</div>}<Link href={`/students/subjects/${entry.class_subject_id}/units`} style={{display:"inline-block",marginTop:11,color:"#486b59",fontWeight:900,textDecoration:"none"}}>Åbn Forløb & årsplan →</Link></section>}
    <LessonAttendance classId={entry.class_id} date={lessonDate} canEdit={canEdit}/>
    <section style={card}><label style={{fontWeight:900,display:"block"}}>Læringsmål</label><p style={{fontSize:13,color:"#747b75",margin:"5px 0 10px"}}>Hvad skal eleverne have med sig fra lektionen?</p><textarea disabled={!canEdit} value={goals} onChange={e=>setGoals(e.target.value)} rows={4} style={input} placeholder="Fx: Eleverne kan forklare forskellen på argument og belæg…"/></section>
    <section style={card}><label style={{fontWeight:900,display:"block"}}>Plan for lektionen</label><p style={{fontSize:13,color:"#747b75",margin:"5px 0 10px"}}>Skriv den plan, du selv eller en vikar skal kunne arbejde videre fra.</p><textarea disabled={!canEdit} value={plan} onChange={e=>setPlan(e.target.value)} rows={10} style={input} placeholder={'Fx:\n08.00 – intro\n08.10 – fælles læsning\n08.30 – makkeropgave…'}/></section>
    <section style={card}><label style={{fontWeight:900,display:"block"}}>Hurtige materialer og links</label><p style={{fontSize:13,color:"#747b75",margin:"5px 0 10px"}}>Til frie noter: ét link eller materialenavn pr. linje. Genbrugeligt fagindhold kobles nedenfor uden at blive kopieret.</p><textarea disabled={!canEdit} value={materialsText} onChange={e=>setMaterialsText(e.target.value)} rows={5} style={input} placeholder={'Jeg er Henry – kap. 4\nhttps://…\nArbejdsark: Argumenter'}/></section>
    <LessonResources lessonId={lessonId} classId={entry.class_id} classSubjectId={entry.class_subject_id} canEdit={canEdit}/>
    {canEdit&&<section style={{...card,background:"#f8f3e7"}}><label style={{fontWeight:900,display:"block"}}>Nåede I ikke det hele?</label><p style={{fontSize:13,color:"#746c5a",margin:"5px 0 10px"}}>Skriv det, der skal fortsætte. Det vises automatisk, når du åbner næste faktiske forekomst af samme skemabrik — uden at kopiere planen.</p><textarea value={carryNote} onChange={e=>setCarryNote(e.target.value)} rows={4} style={input} placeholder="Fx: Vi nåede ikke den fælles opsamling. Start næste gang med gruppernes sidste argument."/><label style={{display:"flex",gap:9,alignItems:"flex-start",marginTop:11,fontSize:13,color:"#665d4d",fontWeight:800}}><input type="checkbox" checked={carryResources} onChange={e=>setCarryResources(e.target.checked)} style={{marginTop:2}}/><span>Tag koblede materialer og opgaver med til næste time<small style={{display:"block",fontWeight:500,marginTop:2}}>Kun koblingen flyttes videre. Originalindholdet bliver liggende i faglokalet.</small></span></label><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:11}}><button disabled={saving||!carryNote.trim()||!nextLessonDate} onClick={moveForward} style={{...action,background:"#8b7652",opacity:saving||!carryNote.trim()||!nextLessonDate?0.5:1}}>Flyt til {nextLessonDate?shortDate(nextLessonDate):"næste time"} →</button>{carriedTo&&<button disabled={saving} onClick={clearCarry} style={{border:"1px solid #cfc5b2",borderRadius:9,padding:"10px 12px",fontWeight:800,background:"white",color:"#6d604b",cursor:"pointer"}}>Fjern videreførsel</button>}</div>{skippedClosures>0&&<small style={{display:"block",marginTop:9,color:"#786a51"}}>Springer {skippedClosures} lukket planlagt uge{skippedClosures===1?"":"r"} over.</small>}{carriedTo&&<small style={{display:"block",marginTop:7,color:"#786a51",fontWeight:800}}>Markeret til {shortDate(carriedTo)}</small>}</section>}
    {canEdit&&<div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><button disabled={saving} onClick={()=>persist()} style={{...action,opacity:saving?0.6:1}}>{saving?"Gemmer…":"Gem lektion"}</button>{message&&<strong style={{color:message.startsWith("Kunne")||message.includes("men")?"#8b342e":"#4f6d59"}}>{message}</strong>}</div>}
   </div>
   <aside style={{display:"grid",gap:14,minWidth:0}}>
    <section style={card}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0}}>STATUS</p><h2 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"7px 0 12px"}}>{status==="active"?"I gang":status==="completed"?"Afsluttet":status==="cancelled"?"Aflyst":"Planlagt"}</h2>{startedAt&&<small style={{display:"block",color:"#707670"}}>Startet {new Date(startedAt).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}</small>}{endedAt&&<small style={{display:"block",color:"#707670",marginTop:4}}>Afsluttet {new Date(endedAt).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}</small>}{activeUnit&&<small style={{display:"block",color:"#526b60",fontWeight:850,marginTop:8}}>Forløb · {activeUnit.title}</small>}{canEdit&&<div style={{display:"grid",gap:8,marginTop:16}}>{status!=="active"&&status!=="completed"&&<button onClick={startLesson} disabled={saving} style={action}>▶ Start lektion</button>}{status!=="completed"&&<button onClick={finishLesson} disabled={saving} style={{...action,background:"#6c755f"}}>✓ Afslut lektion</button>}</div>}</section>
    <section style={card}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0}}>KLASSEN & FAGET</p><h3 style={{fontFamily:"Georgia,serif",fontSize:20,margin:"7px 0 12px"}}>{klass?.name||"Klasse"} · {entry.subject}</h3>{canEdit&&<Link href={`/preparation?lesson=${entry.id}:${lessonDate}`} style={{display:"block",color:"#486b59",fontWeight:900,textDecoration:"none",marginBottom:10}}>Åbn i Forberedelsen →</Link>}{canEdit&&entry.class_subject_id&&<Link href={`/students/subjects/${entry.class_subject_id}`} style={{display:"block",color:"#486b59",fontWeight:900,textDecoration:"none",marginBottom:10}}>Åbn {entry.subject}-faglokalet →</Link>}<Link href={`/students?class=${entry.class_id}`} style={{display:"block",color:"#486b59",fontWeight:900,textDecoration:"none"}}>Elever & fravær →</Link><Link href={`/teacher-overview?class=${entry.class_id}${entry.class_subject_id?`&subject=${entry.class_subject_id}`:""}`} style={{display:"block",color:"#486b59",fontWeight:900,textDecoration:"none",marginTop:10}}>Opgaver & besvarelser →</Link></section>
    <section style={{...card,background:"#eef2ed"}}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0}}>NÆSTE SAMME TIME</p><h3 style={{fontFamily:"Georgia,serif",fontSize:19,margin:"7px 0 10px"}}>{nextLessonDate?shortDate(nextLessonDate):"Finder næste…"}</h3><small style={{display:"block",color:"#6d756f",marginBottom:9}}>{recurrenceLabel(entry.recurrence_pattern)}</small>{skippedClosures>0&&<small style={{display:"block",color:"#6d756f",marginBottom:9}}>Skolekalenderen springer lukkede planlagte uger over.</small>}{nextLessonDate&&<Link href={`/calendar/lesson/${entry.id}?date=${nextLessonDate}`} style={{color:"#486b59",fontWeight:900,textDecoration:"none"}}>Åbn næste lektion →</Link>}</section>
   </aside>
  </section>
 </main>;
}
