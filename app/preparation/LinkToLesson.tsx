"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import {supabase} from "../../lib/supabase";

type ScheduleOccurrenceRow={occurrence_date:string;schedule_entry_id:number;school_id:number;class_id:number;start_time:string;end_time:string;subject:string;class_subject_id:number|null;entry_kind:string};
type Klass={id:number;name:string;school_id:number|null};
type Room={id:number;class_id:number;subject_id:number;title:string|null};
type Item={id:number;class_subject_id:number;item_type:string;title:string|null};
type Assignment={id:number;class_id:number;class_subject_id:number|null;title:string;type:string};
type Upcoming={scheduleId:number;classId:number;classSubjectId:number;schoolId:number|null;date:string;start:string;end:string;subject:string;className:string};
type ResourceOption={value:string;label:string};
type LessonDraft={id:number;learning_goals:string|null;plan:string|null};

const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"11px 12px",border:"1px solid #cbc7bd",borderRadius:8,font:"inherit",background:"white"};
const dateOnly=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

export default function LinkToLesson(){
 const search=useSearchParams();
 const requestedLesson=search.get("lesson")||"";
 const[lessons,setLessons]=useState<Upcoming[]>([]),[selectedKey,setSelectedKey]=useState(""),[options,setOptions]=useState<ResourceOption[]>([]),[resource,setResource]=useState(""),[lessonInstanceId,setLessonInstanceId]=useState<number|null>(null),[goals,setGoals]=useState(""),[plan,setPlan]=useState(""),[loadingResources,setLoadingResources]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
 const selected=useMemo(()=>lessons.find(l=>`${l.scheduleId}:${l.date}`===selectedKey)||null,[lessons,selectedKey]);

 useEffect(()=>{(async()=>{
  const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user)return;
  const today=new Date();today.setHours(12,0,0,0);
  const end1=new Date(today);end1.setDate(today.getDate()+30);
  const start2=new Date(today);start2.setDate(today.getDate()+31);
  const end2=new Date(today);end2.setDate(today.getDate()+34);
  const[c,o1,o2]=await Promise.all([
   supabase.from("classes").select("id,name,school_id"),
   supabase.rpc("staff_schedule_occurrences",{p_user_ids:[user.id],p_start_date:dateOnly(today),p_end_date:dateOnly(end1)}),
   supabase.rpc("staff_schedule_occurrences",{p_user_ids:[user.id],p_start_date:dateOnly(start2),p_end_date:dateOnly(end2)})
  ]);
  const classes=(c.data||[]) as Klass[];
  const rows=[...((o1.data||[]) as ScheduleOccurrenceRow[]),...((o2.data||[]) as ScheduleOccurrenceRow[])];
  const next:Upcoming[]=rows
   .filter((row):row is ScheduleOccurrenceRow&{class_subject_id:number}=>row.entry_kind==="lesson"&&typeof row.class_subject_id==="number")
   .map(row=>{
    const klass=classes.find(x=>x.id===Number(row.class_id));
    return klass?{scheduleId:Number(row.schedule_entry_id),classId:Number(row.class_id),classSubjectId:Number(row.class_subject_id),schoolId:klass.school_id,date:row.occurrence_date,start:row.start_time,end:row.end_time,subject:row.subject,className:klass.name}:null;
   })
   .filter((row):row is Upcoming=>Boolean(row));
  next.sort((a,b)=>a.date.localeCompare(b.date)||a.start.localeCompare(b.start)||a.className.localeCompare(b.className,"da"));
  setLessons(next);
  if(c.error||o1.error||o2.error)setMessage("Nogle kommende lektioner kunne ikke hentes.");
 })()},[]);

 useEffect(()=>{
  if(!requestedLesson||lessons.length===0)return;
  if(lessons.some(l=>`${l.scheduleId}:${l.date}`===requestedLesson)){
   setSelectedKey(requestedLesson);
   requestAnimationFrame(()=>document.getElementById("concrete-lesson-preparation")?.scrollIntoView({behavior:"smooth",block:"start"}));
  }
 },[requestedLesson,lessons]);

 useEffect(()=>{
  if(!selected){setOptions([]);setResource("");setLessonInstanceId(null);setGoals("");setPlan("");return}
  (async()=>{
   setLoadingResources(true);setResource("");setMessage("");
   const[r,a,l,i]=await Promise.all([
    supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("id",selected.classSubjectId).maybeSingle(),
    supabase.from("assignments").select("id,class_id,class_subject_id,title,type").eq("class_id",selected.classId).order("id",{ascending:false}),
    supabase.from("lesson_instances").select("id,learning_goals,plan").eq("schedule_entry_id",selected.scheduleId).eq("lesson_date",selected.date).maybeSingle(),
    supabase.from("subject_room_items").select("id,class_subject_id,item_type,title").eq("class_subject_id",selected.classSubjectId).order("position").order("created_at",{ascending:false})
   ]);
   const room=(r.data||null) as Room|null;const assignments=(a.data||[]) as Assignment[];
   const lesson=(l.data||null) as LessonDraft|null;setLessonInstanceId(lesson?.id??null);setGoals(lesson?.learning_goals||"");setPlan(lesson?.plan||"");
   const items=(i.data||[]) as Item[];const roomName=room?.title||selected.subject;
   const itemOptions=items.map(item=>({value:`item:${item.id}`,label:`${roomName} · ${item.title||item.item_type}`}));
   const assignmentOptions=assignments.filter(x=>!x.class_subject_id||x.class_subject_id===selected.classSubjectId).map(x=>({value:`assignment:${x.id}`,label:`Opgave · ${x.title}`}));
   setOptions([...itemOptions,...assignmentOptions].sort((x,y)=>x.label.localeCompare(y.label,"da")));setLoadingResources(false);
  })()
 },[selectedKey]);

 async function ensureLesson(){
  if(!selected)return null;
  if(lessonInstanceId)return lessonInstanceId;
  const existing=await supabase.from("lesson_instances").select("id").eq("schedule_entry_id",selected.scheduleId).eq("lesson_date",selected.date).maybeSingle();
  if(existing.error){setMessage(existing.error.message);return null}
  if(existing.data?.id){setLessonInstanceId(existing.data.id);return existing.data.id}
  const created=await supabase.from("lesson_instances").insert({schedule_entry_id:selected.scheduleId,lesson_date:selected.date}).select("id").single();
  if(created.error){setMessage(`Lektionen kunne ikke oprettes: ${created.error.message}`);return null}
  setLessonInstanceId(created.data.id);return created.data.id;
 }

 async function savePlan(){
  if(!selected)return;setSaving(true);setMessage("");
  const id=await ensureLesson();if(!id){setSaving(false);return}
  const{error}=await supabase.from("lesson_instances").update({learning_goals:goals.trim()||null,plan:plan.trim()||null}).eq("id",id);
  if(error)setMessage(error.message);else setMessage("Plan og læringsmål er gemt på lektionen ✓");
  setSaving(false);
 }

 async function link(){
  if(!selected||!resource)return;setSaving(true);setMessage("");
  const lessonId=await ensureLesson();if(!lessonId){setSaving(false);return}
  const[kind,idText]=resource.split(":");const id=Number(idText);
  const result=kind==="item"
   ?await supabase.from("lesson_resource_links").insert({lesson_instance_id:lessonId,subject_room_item_id:id,assignment_id:null,position:0})
   :await supabase.from("lesson_resource_links").insert({lesson_instance_id:lessonId,subject_room_item_id:null,assignment_id:id,position:0});
  const error=result.error;
  if(error?.code==="23505")setMessage("Det er allerede koblet til lektionen ✓");
  else if(error)setMessage(error.message);
  else setMessage("Koblet til den konkrete lektion ✓");
  setSaving(false);
 }

 const lessonLabel=(l:Upcoming)=>`${new Date(l.date+"T12:00:00").toLocaleDateString("da-DK",{weekday:"short",day:"numeric",month:"short"})} · ${l.start.slice(0,5)} · ${l.className} · ${l.subject}`;

 return <section id="concrete-lesson-preparation" style={{scrollMarginTop:24,marginTop:18,background:"#eef2ed",border:"1px solid #d4ddd6",borderRadius:14,padding:20}}>
  <p style={{fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#65766d",margin:"0 0 5px"}}>FORBEREDELSE → KONKRET LEKTION</p>
  <h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"0 0 6px"}}>Forbered en kommende time</h2>
  <p style={{color:"#687068",margin:"0 0 16px",lineHeight:1.5}}>Vælg en kommende lektion. Plan og læringsmål gemmes direkte på timen, mens materialer og opgaver kobles uden at blive kopieret.</p>
  {lessons.length===0?<div style={{padding:"12px 14px",background:"white",borderRadius:9,color:"#687068"}}>Jeg kan ikke finde kommende faglektioner på din bruger endnu.</div>:<div style={{display:"grid",gap:13}}>
   <label style={{fontWeight:800}}>Kommende lektion<select value={selectedKey} onChange={e=>setSelectedKey(e.target.value)} style={{...input,marginTop:6}}><option value="">Vælg lektion</option>{lessons.map(l=><option key={`${l.scheduleId}:${l.date}`} value={`${l.scheduleId}:${l.date}`}>{lessonLabel(l)}</option>)}</select></label>
   {selected&&<>
    <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}><Link href={`/students/subjects/${selected.classSubjectId}`} style={{color:"#486b59",fontWeight:900,textDecoration:"none"}}>Åbn {selected.subject}-faglokalet →</Link></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:11}}>
     <label style={{fontWeight:800}}>Læringsmål<textarea value={goals} onChange={e=>setGoals(e.target.value)} rows={4} style={{...input,marginTop:6,resize:"vertical"}} placeholder="Hvad skal eleverne have med sig?"/></label>
     <label style={{fontWeight:800}}>Plan for lektionen<textarea value={plan} onChange={e=>setPlan(e.target.value)} rows={4} style={{...input,marginTop:6,resize:"vertical"}} placeholder={'Fx:\n08.00 intro\n08.10 fælles læsning\n08.30 makkeropgave'}/></label>
    </div>
    <div><button disabled={saving} onClick={savePlan} style={{border:"1px solid #486b59",borderRadius:9,padding:"10px 14px",background:"white",color:"#486b59",fontWeight:900,cursor:"pointer",opacity:saving?0.55:1}}>{saving?"Gemmer…":"Gem plan på lektionen"}</button></div>
    <label style={{fontWeight:800}}>Materiale eller opgave<select value={resource} onChange={e=>setResource(e.target.value)} disabled={loadingResources} style={{...input,marginTop:6}}><option value="">{loadingResources?"Henter…":"Vælg fra faglokalet"}</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
    {options.length===0&&!loadingResources&&<small style={{color:"#687068"}}>Der er endnu ingen materialer eller opgaver i dette faglokale, som kan kobles.</small>}
    <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}><button disabled={!resource||saving} onClick={link} style={{border:0,borderRadius:9,padding:"11px 15px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer",opacity:!resource||saving?0.55:1}}>{saving?"Kobler…":"Kobl materiale/opgave →"}</button><Link href={`/calendar/lesson/${selected.scheduleId}?date=${selected.date}`} style={{color:"#486b59",fontWeight:900,textDecoration:"none"}}>Åbn lektionen →</Link></div>
   </>}
  </div>}
  {message&&<div style={{marginTop:12,padding:"10px 12px",borderRadius:8,background:message.includes("✓")?"#e2ece5":"#fff3cd",fontWeight:700}}>{message}</div>}
 </section>;
}
