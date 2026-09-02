"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../../../lib/supabase";
import {hasRole} from "../../../../lib/roles";
import {scheduleOccursOn,type RecurrencePattern} from "../../../../lib/scheduleRecurrence";

type EntryKind="lesson"|"assembly"|"break"|"duty"|"other";
type Staff={user_id:string;display_name:string|null;initials:string|null;email:string|null};
type StaffAbs={id:number;user_id:string;absence_date:string;status:string;note:string|null};
type Entry={id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;entry_kind:EntryKind;recurrence_pattern:RecurrencePattern};
type LinkRow={schedule_entry_id:number;teacher_id:string};
type Klass={id:number;name:string;school_id?:number};
type Assignment={id:number;schedule_entry_id:number;assignment_date:string;absent_teacher_id:string;substitute_teacher_id:string;school_id:number};

const TYPES=[
 {value:"sick",label:"Syg"},
 {value:"child_sick",label:"Barn syg"},
 {value:"care_day",label:"Omsorgsdag"},
 {value:"leave",label:"Fri/tjenestefri"},
 {value:"course",label:"Kursus/arbejdsrelateret"},
 {value:"other",label:"Andet"}
];
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:22};
const field:React.CSSProperties={padding:9,border:"1px solid #d4d0c7",borderRadius:8,background:"white",boxSizing:"border-box",width:"100%"};
const smallButton:React.CSSProperties={padding:"7px 10px",border:"1px solid #d1cdc4",borderRadius:8,background:"white",color:"#526159",fontWeight:800,cursor:"pointer",fontSize:12};

export default function StaffAbsence(){
 const[ready,setReady]=useState(false);
 const[staff,setStaff]=useState<Staff[]>([]);
 const[rows,setRows]=useState<StaffAbs[]>([]);
 const[entries,setEntries]=useState<Entry[]>([]);
 const[links,setLinks]=useState<LinkRow[]>([]);
 const[classes,setClasses]=useState<Klass[]>([]);
 const[assignments,setAssignments]=useState<Assignment[]>([]);
 const[date,setDate]=useState(new Date().toISOString().slice(0,10));
 const[selected,setSelected]=useState<Record<string,boolean>>({});
 const[types,setTypes]=useState<Record<string,string>>({});
 const[notes,setNotes]=useState<Record<string,string>>({});
 const[editing,setEditing]=useState<number|null>(null);
 const[editType,setEditType]=useState("sick");
 const[editNote,setEditNote]=useState("");
 const[editDate,setEditDate]=useState("");
 const[coverageAbsenceId,setCoverageAbsenceId]=useState<number|null>(null);
 const[msg,setMsg]=useState("");

 async function load(){
  const[u,p,a,e,l,c,sa]=await Promise.all([
   supabase.rpc("admin_user_directory"),
   supabase.from("user_profiles").select("user_id,display_name,initials"),
   supabase.from("staff_absence").select("id,user_id,absence_date,status,note").order("absence_date",{ascending:false}).limit(100),
   supabase.from("schedule_entries").select("id,class_id,weekday,start_time,end_time,subject,room,entry_kind,recurrence_pattern"),
   supabase.from("schedule_teachers").select("schedule_entry_id,teacher_id"),
   supabase.from("classes").select("id,name,school_id"),
   supabase.from("substitute_assignments").select("id,schedule_entry_id,assignment_date,absent_teacher_id,substitute_teacher_id,school_id")
  ]);
  const profiles=new Map((p.data||[]).map((x:any)=>[x.user_id,x]));
  const seen=new Set<string>();
  const people=((u.data||[])as any[])
   .filter(x=>{const roles=Array.isArray(x.roles)?x.roles:[];return roles.some((r:string)=>["teacher","admin","leader"].includes(r))})
   .filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true})
   .map(x=>{const pr:any=profiles.get(x.id);return{user_id:x.id,email:x.email||null,display_name:pr?.display_name||null,initials:pr?.initials||null} as Staff})
   .sort((x,y)=>staffName(x).localeCompare(staffName(y),"da"));
  setStaff(people);setRows((a.data||[])as StaffAbs[]);setEntries((e.data||[])as Entry[]);setLinks((l.data||[])as LinkRow[]);setClasses((c.data||[])as Klass[]);setAssignments((sa.data||[])as Assignment[]);
  const err=u.error||p.error||a.error||e.error||l.error||c.error||sa.error;if(err)setMsg(err.message);
 }

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();
  if(!data.session?.user||!hasRole(data.session.user,"admin")){location.replace("/");return}
  await load();setReady(true);
 })()},[]);

 const weekdayFor=(targetDate:string)=>{const d=new Date(targetDate+"T12:00:00").getDay();return d===0?7:d};
 const selectedPeople=staff.filter(s=>selected[s.user_id]);
 const affected=(teacherId:string,targetDate:string)=>entries
  .filter(e=>e.entry_kind==="lesson"&&e.weekday===weekdayFor(targetDate)&&scheduleOccursOn(e.recurrence_pattern,targetDate)&&links.some(l=>l.schedule_entry_id===e.id&&l.teacher_id===teacherId))
  .sort((a,b)=>a.start_time.localeCompare(b.start_time));
 const overlaps=(a:Entry,b:Entry)=>a.start_time<b.end_time&&a.end_time>b.start_time;
 const absentOnDate=(teacherId:string,targetDate:string)=>rows.some(r=>r.user_id===teacherId&&r.absence_date===targetDate)||(targetDate===date&&!!selected[teacherId]);
 const unavailable=(teacherId:string,lesson:Entry,targetDate:string)=>absentOnDate(teacherId,targetDate)||entries.some(e=>e.entry_kind==="lesson"&&e.weekday===weekdayFor(targetDate)&&scheduleOccursOn(e.recurrence_pattern,targetDate)&&overlaps(e,lesson)&&links.some(l=>l.schedule_entry_id===e.id&&l.teacher_id===teacherId));
 const substitutes=(lesson:Entry,absentId:string,targetDate:string)=>staff.filter(s=>s.user_id!==absentId&&!unavailable(s.user_id,lesson,targetDate));
 const className=(id:number)=>classes.find(c=>c.id===id)?.name||`Klasse ${id}`;
 const name=(id:string)=>{const p=staff.find(x=>x.user_id===id);return p?staffName(p):"Medarbejder"};
 const currentAssignment=(lessonId:number,absentId:string,targetDate:string)=>assignments.find(a=>a.schedule_entry_id===lessonId&&a.assignment_date===targetDate&&a.absent_teacher_id===absentId);
 const absenceAssignments=(r:StaffAbs)=>assignments.filter(a=>a.assignment_date===r.absence_date&&a.absent_teacher_id===r.user_id).map(a=>({a,lesson:entries.find(e=>e.id===a.schedule_entry_id)})).filter(x=>x.lesson?.entry_kind==="lesson").sort((a,b)=>a.lesson!.start_time.localeCompare(b.lesson!.start_time));
 const label=(s:string)=>TYPES.find(x=>x.value===s)?.label||s;

 async function chooseSubstitute(lesson:Entry,absentId:string,targetDate:string,substituteId:string){
  const klass=classes.find(c=>c.id===lesson.class_id);
  if(!klass?.school_id){setMsg("Kunne ikke finde skolens id for lektionen.");return}
  const payload={school_id:klass.school_id,schedule_entry_id:lesson.id,assignment_date:targetDate,absent_teacher_id:absentId,substitute_teacher_id:substituteId};
  const{error}=await supabase.from("substitute_assignments").upsert(payload,{onConflict:"schedule_entry_id,assignment_date,absent_teacher_id"});
  setMsg(error?error.message:`${name(substituteId)} er valgt som vikar ${lesson.start_time.slice(0,5)}–${lesson.end_time.slice(0,5)}.`);
  if(!error)await load();
 }
 async function removeSubstitute(id:number){
  if(!confirm("Vil du fjerne vikaren fra denne lektion?"))return;
  const{error}=await supabase.from("substitute_assignments").delete().eq("id",id);
  setMsg(error?error.message:"Vikaren er fjernet fra lektionen.");
  if(!error)await load();
 }
 async function save(){
  const chosen=staff.filter(s=>selected[s.user_id]);
  if(!chosen.length){setMsg("Markér mindst én medarbejder med fravær.");return}
  const payload=chosen.map(s=>({user_id:s.user_id,absence_date:date,status:types[s.user_id]||"sick",note:(notes[s.user_id]||"").trim()||null}));
  const{error}=await supabase.from("staff_absence").insert(payload);
  setMsg(error?error.message:`${payload.length} personalefraværsregistrering${payload.length===1?"":"er"} gemt.`);
  if(!error){setSelected({});setNotes({});await load();const created=rows.find(r=>r.user_id===chosen[0].user_id&&r.absence_date===date);if(created)setCoverageAbsenceId(created.id)}
 }
 function startEdit(r:StaffAbs){setEditing(r.id);setEditType(r.status);setEditNote(r.note||"");setEditDate(r.absence_date);setMsg("")}
 async function updateAbsence(id:number){
  const{error}=await supabase.rpc("admin_update_staff_absence",{p_absence_id:id,p_absence_date:editDate,p_status:editType,p_note:editNote});
  setMsg(error?error.message:"Personalefraværet er opdateret ✓");
  if(!error){setEditing(null);setCoverageAbsenceId(null);await load()}
 }
 async function removeAbsence(id:number){
  if(!confirm("Vil du slette personalefraværet? Eventuel vikardækning på denne dato bliver også fjernet."))return;
  const{error}=await supabase.rpc("admin_delete_staff_absence",{p_absence_id:id});
  setMsg(error?error.message:"Personalefraværet og tilhørende vikardækning er slettet.");
  if(!error){if(coverageAbsenceId===id)setCoverageAbsenceId(null);setEditing(null);await load()}
 }

 const CoverageEditor=({absence}:{absence:StaffAbs})=>{
  const lessons=affected(absence.user_id,absence.absence_date);
  return <div style={{marginTop:12,padding:14,background:"#f5f8f5",border:"1px solid #dbe4dc",borderRadius:10}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><div><strong>Vikardækning</strong><small style={{display:"block",color:"#687068",marginTop:3}}>{name(absence.user_id)} · {absence.absence_date}</small></div><button onClick={()=>setCoverageAbsenceId(null)} style={smallButton}>Luk</button></div>
   {lessons.length===0?<p style={{color:"#687068",marginBottom:0}}>Ingen undervisningslektioner kræver vikardækning denne dag.</p>:lessons.map(lesson=>{
    const chosen=currentAssignment(lesson.id,absence.user_id,absence.absence_date);
    const free=substitutes(lesson,absence.user_id,absence.absence_date);
    return <div key={lesson.id} style={{borderTop:"1px solid #e1e5df",padding:"13px 0"}}><strong>{lesson.start_time.slice(0,5)}–{lesson.end_time.slice(0,5)} · {lesson.subject} · {className(lesson.class_id)}</strong>{lesson.room&&<span style={{color:"#687068"}}> · {lesson.room}</span>}<div style={{marginTop:7,color:"#687068",fontSize:13}}>{chosen?`Valgt vikar: ${name(chosen.substitute_teacher_id)}. Vælg en anden for at skifte.`:"Ingen vikar valgt endnu."}</div><div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:8}}>{free.map(t=>{const isChosen=chosen?.substitute_teacher_id===t.user_id;return <button type="button" key={t.user_id} onClick={()=>chooseSubstitute(lesson,absence.user_id,absence.absence_date,t.user_id)} style={{padding:"7px 10px",border:isChosen?"2px solid #486b59":"1px solid #cfd8d2",borderRadius:8,background:isChosen?"#dce9e1":"#edf3ef",fontWeight:700,cursor:"pointer",color:"#26342e"}}>{isChosen?"✓ ":""}{staffName(t)}</button>})}{chosen&&<button type="button" onClick={()=>removeSubstitute(chosen.id)} style={{...smallButton,color:"#8a3c34"}}>Fjern vikar</button>}{!free.length&&!chosen&&<span style={{color:"#9a5c4d"}}>Ingen ledige medarbejdere fundet i dette tidsrum.</span>}</div></div>;
   })}
  </div>;
 };

 if(!ready)return <main style={{padding:50}}>Henter personalefravær…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#486b59",color:"white",padding:"18px 6vw"}}><div style={{maxWidth:1100,margin:"auto",display:"flex",justifyContent:"space-between"}}><strong style={{fontSize:22}}>Administration · Fravær</strong><Link href="/admin" style={{color:"white"}}>← Administration</Link></div></header>
  <section style={{maxWidth:1100,margin:"auto",padding:"42px 24px"}}>
   <nav style={{display:"flex",gap:8,marginBottom:28,flexWrap:"wrap"}}><Link href="/admin/absence" style={tab}>Elevfravær</Link><Link href="/admin/absence/staff" style={activeTab}>Personalefravær</Link><Link href="/admin/absence/statistics" style={tab}>Statistik</Link></nav>
   <p className="eyebrow">FRAVÆR · PERSONALE</p><h1 style={{fontFamily:"Georgia,serif",fontSize:40}}>Før personalefravær</h1><p style={{color:"#687068"}}>Registrér fravær, og redigér bagefter både selve fraværet og vikardækningen. Kun undervisningslektioner, der faktisk ligger på den valgte dato og uge-rytme, foreslås til vikar.</p>
   {msg&&<div style={{padding:12,background:"#e7eee9",borderRadius:9,margin:"18px 0"}}>{msg}</div>}
   <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{padding:10,marginBottom:18}}/>

   <section style={card}><h2 style={{fontFamily:"Georgia,serif",marginTop:0}}>Personale · {staff.length}</h2>{staff.map(s=><div key={s.user_id} style={{display:"grid",gridTemplateColumns:"minmax(180px,1.4fr) minmax(190px,1fr) minmax(220px,1.5fr)",gap:12,alignItems:"center",borderTop:"1px solid #eee",padding:"12px 0"}}><label style={{display:"flex",gap:10,alignItems:"center",fontWeight:600}}><input type="checkbox" checked={!!selected[s.user_id]} onChange={e=>setSelected(v=>({...v,[s.user_id]:e.target.checked}))}/>{staffName(s)}</label><select disabled={!selected[s.user_id]} value={types[s.user_id]||"sick"} onChange={e=>setTypes(v=>({...v,[s.user_id]:e.target.value}))} style={field}>{TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select><input disabled={!selected[s.user_id]} value={notes[s.user_id]||""} onChange={e=>setNotes(v=>({...v,[s.user_id]:e.target.value}))} placeholder="Note (valgfri)" style={field}/></div>)}<button onClick={save} style={{marginTop:18,padding:"10px 18px",fontWeight:800}}>✓ Gem personalefravær</button></section>

   {selectedPeople.map(s=>{const lessons=affected(s.user_id,date);return <section key={s.user_id} style={{...card,marginTop:20}}><p className="eyebrow">VIKARDÆKNING · KLADDE</p><h2 style={{fontFamily:"Georgia,serif",marginTop:3}}>{staffName(s)} · {date}</h2><p style={{color:"#687068"}}>Du kan se behovet nu. Gem fraværet først, før vikaren tildeles permanent.</p>{lessons.length===0?<p style={{color:"#687068"}}>Ingen undervisningslektioner kræver vikar.</p>:lessons.map(l=><div key={l.id} style={{padding:"8px 0",borderTop:"1px solid #eee"}}><strong>{l.start_time.slice(0,5)}–{l.end_time.slice(0,5)} · {l.subject}</strong> · {className(l.class_id)}</div>)}</section>})}

   <section style={{...card,marginTop:24}}><h2 style={{fontFamily:"Georgia,serif"}}>Seneste registreringer</h2>{rows.map(r=>{const cover=absenceAssignments(r),isEditing=editing===r.id,isCoverage=coverageAbsenceId===r.id;return <div key={r.id} style={{borderTop:"1px solid #eee",padding:"15px 0"}}>
    <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div style={{flex:"1 1 320px"}}><strong>{name(r.user_id)} · {label(r.status)}</strong><small style={{display:"block",color:"#777"}}>{r.absence_date}</small>{r.note&&<div style={{marginTop:5,color:"#59645e"}}>Note: {r.note}</div>}{cover.length>0&&<div style={{marginTop:10,padding:"10px 12px",background:"#f2f6f3",borderRadius:8}}><strong style={{fontSize:13}}>Vikardækning · {cover.length}</strong>{cover.map(({a,lesson})=><div key={a.id} style={{marginTop:5,fontSize:14,display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><span>{lesson!.start_time.slice(0,5)}–{lesson!.end_time.slice(0,5)} · {lesson!.subject} · {className(lesson!.class_id)} → <strong>{name(a.substitute_teacher_id)}</strong></span><button onClick={()=>removeSubstitute(a.id)} style={{...smallButton,color:"#8a3c34",padding:"4px 7px"}}>Fjern vikar</button></div>)}</div>}</div><div style={{display:"flex",gap:7,flexWrap:"wrap",justifyContent:"end"}}><button onClick={()=>startEdit(r)} style={smallButton}>Redigér fravær</button><button onClick={()=>setCoverageAbsenceId(isCoverage?null:r.id)} style={smallButton}>{isCoverage?"Luk dækning":"Redigér vikardækning"}</button><button onClick={()=>removeAbsence(r.id)} style={{...smallButton,color:"#8a3c34"}}>Slet fravær</button></div></div>
    {isEditing&&<div style={{display:"grid",gridTemplateColumns:"minmax(160px,1fr) minmax(160px,1fr) minmax(220px,2fr) auto auto",gap:8,marginTop:12,padding:12,background:"#faf8f3",borderRadius:9,alignItems:"end"}}><label style={{fontWeight:800,fontSize:12}}>Dato<input type="date" value={editDate} onChange={e=>setEditDate(e.target.value)} style={{...field,marginTop:5}}/></label><label style={{fontWeight:800,fontSize:12}}>Type<select value={editType} onChange={e=>setEditType(e.target.value)} style={{...field,marginTop:5}}>{TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label><label style={{fontWeight:800,fontSize:12}}>Note<input value={editNote} onChange={e=>setEditNote(e.target.value)} placeholder="Note (valgfri)" style={{...field,marginTop:5}}/></label><button onClick={()=>updateAbsence(r.id)} style={{...smallButton,background:"#365044",color:"white",borderColor:"#365044"}}>Gem</button><button onClick={()=>setEditing(null)} style={smallButton}>Annullér</button></div>}
    {isCoverage&&<CoverageEditor absence={r}/>} 
   </div>})}{!rows.length&&<p style={{color:"#777"}}>Ingen personalefravær registreret endnu.</p>}</section>
  </section>
 </main>;
}

function staffName(s:Staff){return s.display_name?.trim()||s.initials?.trim()||s.email?.trim()||"Medarbejder"}
const tab:React.CSSProperties={padding:"10px 16px",borderRadius:9,border:"1px solid #cfcac0",background:"white",color:"#486b59",fontWeight:700,textDecoration:"none"};
const activeTab:React.CSSProperties={...tab,background:"#486b59",color:"white",borderColor:"#486b59"};
