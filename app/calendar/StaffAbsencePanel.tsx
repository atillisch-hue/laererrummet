"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";

type DirectoryUser={user_id:string;display_name:string;role:string};
type StaffAbsence={id:number;user_id:string;absence_date:string;status:string;note:string|null};
type Entry={id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;entry_kind:string};
type ScheduleOccurrenceRow={schedule_entry_id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;entry_kind:string};
type Klass={id:number;name:string;school_id:number|null};
type Assignment={id:number;schedule_entry_id:number;assignment_date:string;absent_teacher_id:string;substitute_teacher_id:string;school_id:number};
type Busy={user_id:string;starts_at:string;ends_at:string;busy_type:string};

type Props={
 selectedDate:string;
 viewedUserId:string;
 viewedName:string;
 directory:DirectoryUser[];
 onChanged?:()=>void;
};

const TYPES=[
 {value:"sick",label:"Syg"},
 {value:"child_sick",label:"Barn syg"},
 {value:"care_day",label:"Omsorgsdag"},
 {value:"leave",label:"Fri / tjenestefri"},
 {value:"course",label:"Kursus / arbejdsrelateret"},
 {value:"other",label:"Andet"}
];
const isoTime=(date:string,time:string)=>new Date(`${date}T${time.slice(0,5)}:00`).getTime();
const roleLabel=(role:string)=>role==="teacher"?"Lærer":role==="admin"||role==="leader"?"Ledelse":role;

export default function StaffAbsencePanel({selectedDate,viewedUserId,viewedName,directory,onChanged}:Props){
 const[absence,setAbsence]=useState<StaffAbsence|null>(null);
 const[status,setStatus]=useState("sick"),[note,setNote]=useState("");
 const[entries,setEntries]=useState<Entry[]>([]),[classes,setClasses]=useState<Klass[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[busy,setBusy]=useState<Busy[]>([]);
 const[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState("");

 async function load(){
  if(!viewedUserId)return;
  setLoading(true);setMessage("");
  const staffIds=directory.filter(x=>["teacher","admin","leader"].includes(x.role)).map(x=>x.user_id);
  const[aRes,oRes,cRes,sRes,bRes]=await Promise.all([
   supabase.from("staff_absence").select("id,user_id,absence_date,status,note").eq("user_id",viewedUserId).eq("absence_date",selectedDate).limit(1).maybeSingle(),
   supabase.rpc("staff_schedule_occurrences",{p_user_ids:[viewedUserId],p_start_date:selectedDate,p_end_date:selectedDate}),
   supabase.from("classes").select("id,name,school_id"),
   supabase.from("substitute_assignments").select("id,schedule_entry_id,assignment_date,absent_teacher_id,substitute_teacher_id,school_id").eq("assignment_date",selectedDate),
   staffIds.length?supabase.rpc("staff_booking_busy_intervals",{p_user_ids:staffIds,p_date:selectedDate}):Promise.resolve({data:[],error:null})
  ]);
  const row=(aRes.data||null) as StaffAbsence|null;
  const occurrences=((oRes.data||[]) as ScheduleOccurrenceRow[]).map(x=>({id:Number(x.schedule_entry_id),class_id:Number(x.class_id),weekday:Number(x.weekday),start_time:x.start_time,end_time:x.end_time,subject:x.subject,room:x.room,entry_kind:x.entry_kind}));
  setAbsence(row);setStatus(row?.status||"sick");setNote(row?.note||"");
  setEntries(occurrences);setClasses((cRes.data||[]) as Klass[]);setAssignments((sRes.data||[]) as Assignment[]);setBusy((bRes.data||[]) as Busy[]);
  const problem=aRes.error||oRes.error||cRes.error||sRes.error||bRes.error;
  if(problem)setMessage(problem.message||"Personalefravær kunne ikke hentes helt.");
  setLoading(false);
 }
 useEffect(()=>{void load()},[selectedDate,viewedUserId]);

 const affected=useMemo(()=>entries.filter(e=>e.entry_kind==="lesson").sort((a,b)=>a.start_time.localeCompare(b.start_time)),[entries]);

 const className=(id:number)=>classes.find(c=>c.id===id)?.name||"Klasse";
 const personName=(id:string)=>directory.find(x=>x.user_id===id)?.display_name||"Medarbejder";
 const currentAssignment=(lessonId:number)=>assignments.find(a=>a.schedule_entry_id===lessonId&&a.absent_teacher_id===viewedUserId)||null;
 const candidateStaff=directory.filter(x=>x.user_id!==viewedUserId&&["teacher","admin","leader"].includes(x.role));
 function availableFor(personId:string,lesson:Entry){
  const start=isoTime(selectedDate,lesson.start_time),end=isoTime(selectedDate,lesson.end_time);
  return !busy.some(b=>b.user_id===personId&&start<new Date(b.ends_at).getTime()&&end>new Date(b.starts_at).getTime());
 }

 async function saveAbsence(){
  if(saving)return;setSaving(true);setMessage("");
  const clean=note.trim()||null;
  const result=absence
   ?await supabase.rpc("admin_update_staff_absence",{p_absence_id:absence.id,p_absence_date:selectedDate,p_status:status,p_note:clean})
   :await supabase.from("staff_absence").insert({user_id:viewedUserId,absence_date:selectedDate,status,note:clean});
  if(result.error)setMessage(`Fraværet kunne ikke gemmes: ${result.error.message}`);
  else{setMessage(absence?"Personalefraværet er opdateret ✓":"Personalefraværet er registreret ✓");await load();onChanged?.()}
  setSaving(false);
 }
 async function removeAbsence(){
  if(!absence||saving||!confirm("Slet personalefraværet? Eventuel vikardækning på datoen bliver også fjernet."))return;
  setSaving(true);setMessage("");const{error}=await supabase.rpc("admin_delete_staff_absence",{p_absence_id:absence.id});
  if(error)setMessage(`Fraværet kunne ikke slettes: ${error.message}`);else{setMessage("Personalefraværet og tilhørende vikardækning er slettet.");await load();onChanged?.()}
  setSaving(false);
 }
 async function chooseSubstitute(lesson:Entry,substituteId:string){
  const klass=classes.find(c=>c.id===lesson.class_id);if(!klass?.school_id){setMessage("Skolen kunne ikke bestemmes for lektionen.");return}
  setSaving(true);setMessage("");const{error}=await supabase.from("substitute_assignments").upsert({school_id:klass.school_id,schedule_entry_id:lesson.id,assignment_date:selectedDate,absent_teacher_id:viewedUserId,substitute_teacher_id:substituteId},{onConflict:"schedule_entry_id,assignment_date,absent_teacher_id"});
  if(error)setMessage(`Vikaren kunne ikke gemmes: ${error.message}`);else{setMessage(`${personName(substituteId)} er valgt som vikar ${lesson.start_time.slice(0,5)}–${lesson.end_time.slice(0,5)} ✓`);await load();onChanged?.()}
  setSaving(false);
 }
 async function removeSubstitute(id:number){
  if(saving||!confirm("Fjern vikaren fra denne lektion?"))return;setSaving(true);setMessage("");const{error}=await supabase.from("substitute_assignments").delete().eq("id",id);
  if(error)setMessage(`Vikaren kunne ikke fjernes: ${error.message}`);else{setMessage("Vikaren er fjernet.");await load();onChanged?.()}
  setSaving(false);
 }

 if(loading)return <section style={card}>Henter personalefravær for {viewedName}…</section>;
 return <section style={card}>
  <div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start",flexWrap:"wrap"}}><div><p style={eyebrow}>FRAVÆR & VIKARDÆKNING</p><h2 style={{fontFamily:"Georgia,serif",fontSize:29,margin:"5px 0"}}>{viewedName}</h2><p style={{margin:0,color:"#707670"}}>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long"})}</p></div>{absence?<span style={absenceTag}>{TYPES.find(x=>x.value===absence.status)?.label||absence.status}</span>:<span style={okTag}>Ingen fravær registreret</span>}</div>
  {message&&<div style={{marginTop:13,padding:"10px 12px",borderRadius:8,background:message.includes("kunne ikke")?"#f7e5e2":"#e7eee9",color:message.includes("kunne ikke")?"#7c342e":"#4d6657",fontWeight:750}}>{message}</div>}
  <div style={{display:"grid",gridTemplateColumns:"minmax(180px,.65fr) minmax(240px,1.4fr)",gap:10,marginTop:16}}><label style={label}>Fraværstype<select value={status} onChange={e=>setStatus(e.target.value)} style={field}>{TYPES.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label><label style={label}>Intern note <span style={{fontWeight:500}}>(valgfri)</span><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Kun til administration/personale med adgang" style={field}/></label></div>
  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:11}}><button type="button" disabled={saving} onClick={saveAbsence} style={primary}>{saving?"Gemmer…":absence?"Gem ændringer":"Registrér fravær"}</button>{absence&&<button type="button" disabled={saving} onClick={removeAbsence} style={danger}>Slet fravær</button>}</div>

  {absence&&<section style={{marginTop:22,paddingTop:18,borderTop:"1px solid #e5e1d8"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"end",flexWrap:"wrap"}}><div><p style={eyebrow}>DAGENS UNDERVISNING</p><h3 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"5px 0 0"}}>Vikardækning</h3></div><small style={{color:"#707670"}}>{affected.length} undervisningstime{affected.length===1?"":"r"}</small></div>
   {affected.length===0?<p style={{color:"#707670"}}>Der ligger ingen undervisning for {viewedName} på denne dato.</p>:<div style={{display:"grid",gap:10,marginTop:12}}>{affected.map(lesson=>{const chosen=currentAssignment(lesson.id);const candidates=candidateStaff.filter(p=>availableFor(p.user_id,lesson)||chosen?.substitute_teacher_id===p.user_id);return <article key={lesson.id} style={{padding:"13px 14px",border:"1px solid #e0ddd5",borderRadius:10,background:"#faf9f6"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><div><strong>{lesson.start_time.slice(0,5)}–{lesson.end_time.slice(0,5)} · {lesson.subject}</strong><small style={{display:"block",color:"#6d756f",marginTop:3}}>{className(lesson.class_id)}{lesson.room?` · ${lesson.room}`:""}</small></div>{chosen?<span style={coveredTag}>✓ {personName(chosen.substitute_teacher_id)}</span>:<span style={needsTag}>Mangler vikar</span>}</div><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{candidates.map(p=>{const selected=chosen?.substitute_teacher_id===p.user_id;return <button type="button" disabled={saving} key={p.user_id} onClick={()=>chooseSubstitute(lesson,p.user_id)} style={{...candidate,border:selected?"2px solid #486b59":"1px solid #cfd8d2",background:selected?"#dce9e1":"#edf3ef"}}>{selected?"✓ ":""}{p.display_name} · {roleLabel(p.role)}</button>})}{chosen&&<button type="button" disabled={saving} onClick={()=>removeSubstitute(chosen.id)} style={removeButton}>Fjern vikar</button>}{!candidates.length&&!chosen&&<span style={{color:"#9a5c4d",fontWeight:800,fontSize:13}}>Ingen ledige medarbejdere fundet i tidsrummet.</span>}</div></article>})}</div>}
  </section>}
 </section>;
}
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:16,padding:20};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.25,color:"#718077",margin:0,textTransform:"uppercase"};
const label:React.CSSProperties={fontSize:12,fontWeight:900,color:"#526159"};
const field:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",marginTop:5,padding:"10px 11px",border:"1px solid #d4d0c7",borderRadius:8,background:"white",font:"inherit"};
const primary:React.CSSProperties={border:0,borderRadius:8,padding:"10px 13px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer"};
const danger:React.CSSProperties={...primary,background:"white",color:"#8a453b",border:"1px solid #d8bdb8"};
const absenceTag:React.CSSProperties={padding:"6px 9px",borderRadius:999,background:"#f3e6df",color:"#7b4b3f",fontSize:11,fontWeight:900};
const okTag:React.CSSProperties={...absenceTag,background:"#e7eee9",color:"#4d6657"};
const coveredTag:React.CSSProperties={padding:"5px 8px",borderRadius:999,background:"#e3eee5",color:"#46614d",fontSize:10,fontWeight:900};
const needsTag:React.CSSProperties={...coveredTag,background:"#f4eee0",color:"#75623f"};
const candidate:React.CSSProperties={padding:"7px 9px",borderRadius:8,fontWeight:800,cursor:"pointer",color:"#26342e",fontSize:12};
const removeButton:React.CSSProperties={...candidate,background:"white",color:"#8a453b",border:"1px solid #d8bdb8"};
