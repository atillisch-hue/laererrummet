"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";

type Student={id:number;name:string;class_id:number};
type ClassRow={id:number;name:string};
type Absence={id:number;student_id:number;absence_date:string;status:string;note:string|null;source?:string;reported_by?:string|null};
type EntryKind="lesson"|"assembly"|"break"|"duty"|"other";
type ScheduleEntry={id:number;class_id:number;subject:string;weekday:number;start_time:string;end_time:string;room:string|null;entry_kind:EntryKind};
type Handover={id:number;class_id:number;student_id:number|null;handover_date:string;category:string;message:string;author_id:string;author_email:string;created_at:string};

const TYPES=[{value:"sick",label:"Syg"},{value:"unexcused",label:"Ulovligt fravær"},{value:"excused",label:"Lovligt fravær"},{value:"left_early",label:"Gået tidligt"},{value:"late",label:"Forsinket"}];
const HT=[{value:"practical",label:"Praktisk"},{value:"teaching",label:"Undervisning"},{value:"student",label:"Elev"},{value:"substitute",label:"Til næste lærer/vikar"}];
const card:React.CSSProperties={background:"#fff",border:"1px solid #ddd9d0",borderRadius:15,padding:22};
const quick:React.CSSProperties={display:"block",background:"#fff",border:"1px solid #ddd9d0",borderRadius:13,padding:"17px 18px",textDecoration:"none",color:"#26342e"};
const smallButton:React.CSSProperties={border:"1px solid #d4d0c7",background:"white",borderRadius:7,padding:"5px 8px",fontSize:11,fontWeight:800,cursor:"pointer",color:"#526b60"};

const scheduleKindLabel=(kind:EntryKind)=>({lesson:"LEKTION",assembly:"SAMLING",break:"PAUSE",duty:"GÅRDVAGT",other:"ARBEJDSBLOK"}[kind]);

export default function StudentsPage(){
 const[ready,setReady]=useState(false);
 const[classes,setClasses]=useState<ClassRow[]>([]);
 const[classId,setClassId]=useState<number|"">("");
 const[students,setStudents]=useState<Student[]>([]);
 const[rows,setRows]=useState<Absence[]>([]);
 const[schedule,setSchedule]=useState<ScheduleEntry[]>([]);
 const[handovers,setHandovers]=useState<Handover[]>([]);
 const[date,setDate]=useState(new Date().toISOString().slice(0,10));
 const[tab,setTab]=useState("today");
 const[selected,setSelected]=useState<Record<number,boolean>>({});
 const[types,setTypes]=useState<Record<number,string>>({});
 const[notes,setNotes]=useState<Record<number,string>>({});
 const[msg,setMsg]=useState("");
 const[userId,setUserId]=useState("");
 const[email,setEmail]=useState("");
 const[admin,setAdmin]=useState(false);
 const[hm,setHm]=useState("");
 const[ht,setHt]=useState("practical");
 const[hs,setHs]=useState<number|"">("");
 const[editingHandoverId,setEditingHandoverId]=useState<number|null>(null);
 const[editHandoverMessage,setEditHandoverMessage]=useState("");
 const[editHandoverCategory,setEditHandoverCategory]=useState("practical");
 const[editHandoverStudent,setEditHandoverStudent]=useState<number|"">("");
 const[editHandoverDate,setEditHandoverDate]=useState("");
 const[editingAbsenceId,setEditingAbsenceId]=useState<number|null>(null);
 const[editAbsenceStatus,setEditAbsenceStatus]=useState("sick");
 const[editAbsenceNote,setEditAbsenceNote]=useState("");
 const[editAbsenceDate,setEditAbsenceDate]=useState("");

 async function load(){
  const{data:ss}=await supabase.auth.getSession(),u=ss.session?.user;
  if(!u){location.href="/?teacher=1";return}
  const isAdmin=hasRole(u,"admin");
  setUserId(u.id);setEmail(u.email||"");setAdmin(isAdmin);
  const p=new URLSearchParams(location.search),d=p.get("date")||new Date().toISOString().slice(0,10);setDate(d);
  const[{data:c},{data:s},{data:tc},{data:a},{data:se},{data:h},{data:sa}]=await Promise.all([
   supabase.from("classes").select("id,name").order("id"),
   supabase.from("students").select("id,name,class_id").order("name"),
   supabase.from("teacher_classes").select("class_id").eq("teacher_id",u.id),
   supabase.from("student_absence").select("id,student_id,absence_date,status,note,source,reported_by").order("absence_date",{ascending:false}).limit(300),
   supabase.from("schedule_entries").select("id,class_id,subject,weekday,start_time,end_time,room,entry_kind"),
   supabase.from("class_handover").select("id,class_id,student_id,handover_date,category,message,author_id,author_email,created_at").order("created_at",{ascending:false}).limit(300),
   supabase.from("substitute_assignments").select("assignment_date,schedule_entry_id").eq("substitute_teacher_id",u.id)
  ]);
  const entries=(se||[]) as ScheduleEntry[];
  const assigned=new Set((tc||[]).map((x:any)=>Number(x.class_id)));
  const subIds=new Set((sa||[]).filter((x:any)=>x.assignment_date===d).map((x:any)=>Number(x.schedule_entry_id)));
  entries.filter(x=>subIds.has(x.id)).forEach(x=>assigned.add(x.class_id));
  const all=(c||[]) as ClassRow[],cs=isAdmin?all:all.filter(x=>assigned.has(x.id));
  setClasses(cs);
  setStudents(((s||[]) as Student[]).filter(x=>isAdmin||assigned.has(x.class_id)));
  setRows((a||[]) as Absence[]);setSchedule(entries);setHandovers((h||[]) as Handover[]);
  const requested=Number(p.get("class"));setClassId(cs.some(x=>x.id===requested)?requested:(cs[0]?.id||""));setReady(true);
 }
 useEffect(()=>{load()},[]);

 const shown=useMemo(()=>students.filter(s=>s.class_id===classId),[students,classId]);
 const todayRows=useMemo(()=>rows.filter(r=>r.absence_date===date),[rows,date]);
 const selectedDate=new Date(date+"T12:00:00"),weekday=selectedDate.getDay()||7;
 const daySchedule=schedule.filter(e=>e.class_id===classId&&e.weekday===weekday).sort((a,b)=>a.start_time.localeCompare(b.start_time));
 const classHandovers=handovers.filter(h=>h.class_id===classId),todayHandovers=classHandovers.filter(h=>h.handover_date===date),currentClass=classes.find(c=>c.id===classId);
 const rowFor=(id:number)=>todayRows.find(r=>r.student_id===id);
 const studentName=(id:number|null)=>id?students.find(s=>s.id===id)?.name||"Elev":"Hele klassen";
 const label=(s:string)=>TYPES.find(x=>x.value===s)?.label||s;
 const hlabel=(s:string)=>HT.find(x=>x.value===s)?.label||s;

 async function save(){
  const chosen=shown.filter(s=>selected[s.id]);if(!chosen.length){setMsg("Markér mindst én elev med fravær.");return}
  const{error}=await supabase.from("student_absence").insert(chosen.map(s=>({student_id:s.id,absence_date:date,status:types[s.id]||"sick",note:(notes[s.id]||"").trim()||null,source:"teacher",reported_by:userId})));
  setMsg(error?error.message:`${chosen.length} registrering${chosen.length===1?"":"er"} gemt.`);if(!error){setSelected({});setNotes({});await load()}
 }
 function startEditAbsence(a:Absence){setEditingAbsenceId(a.id);setEditAbsenceStatus(a.status);setEditAbsenceNote(a.note||"");setEditAbsenceDate(a.absence_date);setMsg("")}
 async function saveAbsenceEdit(id:number){
  if(!editAbsenceDate)return;
  const{error}=await supabase.from("student_absence").update({status:editAbsenceStatus,note:editAbsenceNote.trim()||null,absence_date:editAbsenceDate}).eq("id",id);
  if(error){setMsg(error.message);return}
  setEditingAbsenceId(null);await load();
 }
 async function removeAbsence(id:number){
  if(!confirm("Vil du slette denne fraværsregistrering?"))return;
  const{error}=await supabase.from("student_absence").delete().eq("id",id);
  if(error)setMsg(error.message);else{setEditingAbsenceId(null);await load()}
 }
 async function addHandover(){
  if(!hm.trim()||!classId)return;
  const{error}=await supabase.from("class_handover").insert({class_id:classId,student_id:hs||null,handover_date:date,category:ht,message:hm.trim(),author_id:userId,author_email:email});
  if(error){setMsg(error.message);return}
  setHm("");setHs("");await load();
 }
 function startEditHandover(h:Handover){
  setEditingHandoverId(h.id);setEditHandoverMessage(h.message);setEditHandoverCategory(h.category);setEditHandoverStudent(h.student_id||"");setEditHandoverDate(h.handover_date);
 }
 async function saveHandoverEdit(id:number){
  if(!editHandoverMessage.trim()||!editHandoverDate)return;
  const{error}=await supabase.from("class_handover").update({message:editHandoverMessage.trim(),category:editHandoverCategory,student_id:editHandoverStudent||null,handover_date:editHandoverDate}).eq("id",id);
  if(error){setMsg(error.message);return}
  setEditingHandoverId(null);await load();
 }
 async function removeHandover(id:number){
  if(!confirm("Vil du slette denne overlevering?"))return;
  const{error}=await supabase.from("class_handover").delete().eq("id",id);
  if(error)setMsg(error.message);else await load();
 }

 const HandoverList=({items}:{items:Handover[]})=><div style={{display:"grid",gap:10}}>{items.length?items.map(h=>{
  const canManage=h.author_id===userId||admin;
  const editing=editingHandoverId===h.id;
  return <article key={h.id} style={{background:"#faf9f6",border:"1px solid #e0ddd5",borderRadius:11,padding:"14px 16px"}}>
   {editing?<div style={{display:"grid",gap:8}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8}}>
     <select value={editHandoverCategory} onChange={e=>setEditHandoverCategory(e.target.value)} style={{padding:8}}>{HT.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>
     <select value={editHandoverStudent} onChange={e=>setEditHandoverStudent(e.target.value?Number(e.target.value):"")} style={{padding:8}}><option value="">Hele klassen</option>{shown.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
     <input type="date" value={editHandoverDate} onChange={e=>setEditHandoverDate(e.target.value)} style={{padding:8}}/>
    </div>
    <textarea value={editHandoverMessage} onChange={e=>setEditHandoverMessage(e.target.value)} style={{width:"100%",minHeight:90,padding:9,boxSizing:"border-box"}}/>
    <div style={{display:"flex",gap:7}}><button onClick={()=>saveHandoverEdit(h.id)} style={{...smallButton,background:"#365044",color:"white",borderColor:"#365044"}}>Gem</button><button onClick={()=>setEditingHandoverId(null)} style={smallButton}>Annullér</button></div>
   </div>:<>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start",flexWrap:"wrap"}}><div><span style={{fontSize:11,fontWeight:900,background:"#e7eee9",padding:"4px 7px",borderRadius:999}}>{hlabel(h.category)}</span> <strong style={{fontSize:13}}>{studentName(h.student_id)}</strong></div>{canManage&&<div style={{display:"flex",gap:5}}><button onClick={()=>startEditHandover(h)} style={smallButton}>Redigér</button><button onClick={()=>removeHandover(h.id)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div>}</div>
    <p style={{margin:"9px 0 7px"}}>{h.message}</p><small style={{color:"#777"}}>{h.handover_date!==date?`${new Date(h.handover_date+"T12:00").toLocaleDateString("da-DK")} · `:""}{h.author_email.split("@")[0]} · {new Date(h.created_at).toLocaleString("da-DK")}</small>
   </>}
  </article>;
 }):<p style={{color:"#707670"}}>Ingen overleveringer endnu.</p>}</div>;

 if(!ready)return <main style={{padding:50}}>Henter klasse…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1100,margin:"auto"}}><small style={{opacity:.7,fontWeight:800}}>KLASSEVÆRELSET</small><h1 style={{fontFamily:"Georgia,serif",fontSize:34,margin:"4px 0"}}>{currentClass?.name||"Klasse"}</h1><p style={{margin:"6px 0 0",opacity:.78}}>Elever, overlevering, fravær og klassens arbejde samlet ét sted.</p></div></header>
  <section style={{maxWidth:1100,margin:"auto",padding:"28px 24px 70px"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:18,flexWrap:"wrap"}}><div><Link href="/teacher-dashboard" style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← Mine klasser</Link><p style={{color:"#707670",margin:"12px 0 0"}}>{selectedDate.toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long"})}</p></div>{classes.length>1&&<select value={classId} onChange={e=>{setClassId(Number(e.target.value));setTab("today")}} style={{padding:"11px 14px",borderRadius:8,border:"1px solid #ccc"}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}</div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,margin:"24px 0 18px"}}><button onClick={()=>setTab("today")} style={{...quick,textAlign:"left",cursor:"pointer",background:tab==="today"?"#e9eee9":"#fff"}}><strong style={{display:"block",fontSize:17}}>I dag</strong><small>Skema og fravær</small></button><button onClick={()=>setTab("handover")} style={{...quick,textAlign:"left",cursor:"pointer",background:tab==="handover"?"#e9eee9":"#fff"}}><strong style={{display:"block",fontSize:17}}>Overlevering</strong><small>{todayHandovers.length?`${todayHandovers.length} besked${todayHandovers.length===1?"":"er"} i dag`:"Til næste lærer/vikar"}</small></button><button onClick={()=>setTab("students")} style={{...quick,textAlign:"left",cursor:"pointer",background:tab==="students"?"#e9eee9":"#fff"}}><strong style={{display:"block",fontSize:17}}>Elever</strong><small>{shown.length} i klassen</small></button><Link href={`/teacher-overview?class=${classId}`} style={quick}><strong style={{display:"block",fontSize:17}}>Opgaver & besvarelser</strong><small>Se status og elevtekster</small></Link><Link href="/grammar?mode=assign" style={quick}><strong style={{display:"block",fontSize:17}}>Grammatik</strong><small>Tildel træning med det samme</small></Link></div>

   {tab==="today"&&<div style={{display:"grid",gap:18}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16}}><section style={card}><small style={{fontWeight:900,color:"#718077"}}>OVERLEVERING</small><h2 style={{fontFamily:"Georgia,serif",margin:"4px 0 12px"}}>Det skal du vide</h2><HandoverList items={todayHandovers.slice(0,3)}/>{todayHandovers.length>3&&<button onClick={()=>setTab("handover")} style={{marginTop:10,border:0,background:"transparent",fontWeight:800,color:"#526b60"}}>Se alle →</button>}</section><section style={card}><small style={{fontWeight:900,color:"#718077"}}>DAGENS SKEMA</small><h2 style={{fontFamily:"Georgia,serif",margin:"4px 0 12px"}}>I dag</h2>{daySchedule.length?<div style={{display:"grid",gap:7}}>{daySchedule.map(l=>l.entry_kind==="lesson"?<Link key={l.id} href={`/calendar/lesson/${l.id}?date=${date}`} style={{display:"grid",gridTemplateColumns:"78px 1fr",gap:10,padding:"10px",border:"1px solid #e4e1da",borderRadius:9,background:"#faf9f6",textDecoration:"none",color:"inherit"}}><strong>{l.start_time.slice(0,5)}</strong><span><strong>{l.subject}</strong>{l.room&&<small style={{display:"block"}}>Lokale {l.room}</small>}<small style={{display:"block",marginTop:3,color:"#718077",fontWeight:800}}>LEKTION · Åbn →</small></span></Link>:<div key={l.id} style={{display:"grid",gridTemplateColumns:"78px 1fr",gap:10,padding:"10px",border:"1px solid #e4e1da",borderRadius:9,background:l.entry_kind==="break"?"#f1f0ec":"#f7edd7"}}><strong>{l.start_time.slice(0,5)}</strong><span><strong>{l.subject}</strong><small style={{display:"block",marginTop:3,color:"#718077",fontWeight:800}}>{scheduleKindLabel(l.entry_kind)}</small></span></div>)}</div>:<p>Ingen skemablokke denne dag.</p>}</section></div>
    <section style={card}><div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:12}}><div><small style={{fontWeight:900,color:"#718077"}}>FRAVÆR</small><h2 style={{fontFamily:"Georgia,serif",fontSize:29,margin:"5px 0"}}>Hvem er her?</h2><p style={{color:"#707670"}}>Alle regnes som til stede. Registrér kun fravær eller forsinkelse.</p></div><input type="date" value={date} onChange={e=>{setDate(e.target.value);setEditingAbsenceId(null)}} style={{height:40,padding:"0 10px"}}/></div>{msg&&<div style={{padding:11,background:"#e7eee9",borderRadius:8}}>{msg}</div>}{shown.map(s=>{const ex=rowFor(s.id),parent=ex?.source==="parent",canManageAbsence=!!ex&&(admin||!parent),editing=!!ex&&editingAbsenceId===ex.id;return <div key={s.id} style={{borderTop:"1px solid #eee",padding:"11px 0"}}>{editing&&ex?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:9,alignItems:"end"}}><label style={{fontWeight:800}}>Elev<span style={{display:"block",marginTop:7}}>{s.name}</span></label><label style={{fontWeight:800}}>Status<select value={editAbsenceStatus} onChange={e=>setEditAbsenceStatus(e.target.value)} style={{display:"block",width:"100%",marginTop:6,padding:8}}>{TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label><label style={{fontWeight:800}}>Dato<input type="date" value={editAbsenceDate} onChange={e=>setEditAbsenceDate(e.target.value)} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:8}}/></label><label style={{fontWeight:800}}>Note<input value={editAbsenceNote} onChange={e=>setEditAbsenceNote(e.target.value)} style={{display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:8}}/></label><div style={{display:"flex",gap:6}}><button onClick={()=>saveAbsenceEdit(ex.id)} style={{...smallButton,background:"#365044",color:"white",borderColor:"#365044"}}>Gem</button><button onClick={()=>setEditingAbsenceId(null)} style={smallButton}>Annullér</button></div></div>:<div style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) minmax(180px,1fr) auto",gap:10,alignItems:"center"}}><label style={{display:"flex",gap:8,alignItems:"center",fontWeight:700}}><input type="checkbox" disabled={!!ex} checked={!!selected[s.id]} onChange={e=>setSelected(v=>({...v,[s.id]:e.target.checked}))}/><span>{s.name}{ex&&<small style={{display:"block",color:parent?"#775f2e":"#687068"}}>{label(ex.status)}{parent?" · meldt af forælder":ex.source==="substitute"?" · registreret af vikar":" · registreret af personale"}</small>}</span></label>{ex?<div style={{fontSize:13,color:"#687068"}}>{ex.note||"Ingen note"}</div>:<div style={{display:"grid",gridTemplateColumns:"minmax(130px,.7fr) 1fr",gap:8}}><select disabled={!selected[s.id]} value={types[s.id]||"sick"} onChange={e=>setTypes(v=>({...v,[s.id]:e.target.value}))} style={{padding:8}}>{TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select><input disabled={!selected[s.id]} value={notes[s.id]||""} onChange={e=>setNotes(v=>({...v,[s.id]:e.target.value}))} placeholder="Note (valgfri)" style={{padding:8}}/></div>}{canManageAbsence&&ex?<div style={{display:"flex",gap:5,justifyContent:"flex-end"}}><button onClick={()=>startEditAbsence(ex)} style={smallButton}>Redigér</button><button onClick={()=>removeAbsence(ex.id)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div>:parent&&ex?<small style={{color:"#8a6e42",fontWeight:800,textAlign:"right"}}>Låst for lærer</small>:<span/>}</div>}</div>})}<button onClick={save} style={{marginTop:16,padding:"10px 15px",border:0,borderRadius:8,background:"#365044",color:"white",fontWeight:900}}>Gem ændringer</button></section></div>}

   {tab==="handover"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:20}}><section style={card}><h2 style={{fontFamily:"Georgia,serif",marginTop:0}}>Skriv til næste kollega</h2><select value={ht} onChange={e=>setHt(e.target.value)} style={{width:"100%",padding:10,marginBottom:10}}>{HT.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select><select value={hs} onChange={e=>setHs(e.target.value?Number(e.target.value):"")} style={{width:"100%",padding:10,marginBottom:10}}><option value="">Hele klassen</option>{shown.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select><textarea value={hm} onChange={e=>setHm(e.target.value)} placeholder="Skriv en kort overlevering…" style={{width:"100%",minHeight:120,padding:10,boxSizing:"border-box"}}/><button onClick={addHandover} style={{width:"100%",marginTop:10,padding:11,background:"#365044",color:"white",border:0,borderRadius:8,fontWeight:900}}>Gem overlevering</button></section><section style={card}><h2 style={{fontFamily:"Georgia,serif",marginTop:0}}>Seneste beskeder</h2><HandoverList items={classHandovers}/></section></div>}

   {tab==="students"&&<section style={card}><h2 style={{fontFamily:"Georgia,serif",marginTop:0}}>Elever · {shown.length}</h2><p style={{color:"#707670",marginTop:-4}}>Åbn elevens samlede lærer-overblik med møder, handleplan, fravær, opgaver og progression.</p>{shown.map(s=><Link key={s.id} href={`/students/${s.id}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderTop:"1px solid #eee",textDecoration:"none",color:"inherit"}}><strong>{s.name}</strong><span style={{fontWeight:800,color:"#526b60"}}>Åbn elev →</span></Link>)}</section>}
  </section>
 </main>;
}
