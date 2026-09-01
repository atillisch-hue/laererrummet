"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";

type Student={id:number;name:string};
type Absence={id:number;student_id:number;absence_date:string;status:string;note:string|null;source:string;reported_by:string|null};
type Edit={status:string;note:string};

const TYPES=[
 {value:"present",label:"Til stede"},
 {value:"sick",label:"Syg"},
 {value:"excused",label:"Lovligt fravær"},
 {value:"unexcused",label:"Ulovligt fravær"},
 {value:"late",label:"Forsinket"},
 {value:"left_early",label:"Gået tidligt"}
];
const label=(value:string)=>TYPES.find(x=>x.value===value)?.label||value;
const selectStyle:React.CSSProperties={width:"100%",padding:"9px 10px",border:"1px solid #d8d5cd",borderRadius:8,background:"white",font:"inherit",color:"#26342e"};
const inputStyle:React.CSSProperties={...selectStyle,minWidth:0};

export default function LessonAttendance({classId,date,canEdit}:{classId:number;date:string;canEdit:boolean}){
 const[ready,setReady]=useState(false);
 const[students,setStudents]=useState<Student[]>([]);
 const[rows,setRows]=useState<Absence[]>([]);
 const[edits,setEdits]=useState<Record<number,Edit>>({});
 const[saving,setSaving]=useState(false);
 const[message,setMessage]=useState("");

 async function load(){
  const[sRes,aRes]=await Promise.all([
   supabase.from("students").select("id,name").eq("class_id",classId).order("name"),
   supabase.from("student_absence").select("id,student_id,absence_date,status,note,source,reported_by").eq("absence_date",date)
  ]);
  if(sRes.error||aRes.error){setMessage(sRes.error?.message||aRes.error?.message||"Fravær kunne ikke hentes.");setReady(true);return}
  const list=(sRes.data||[]) as Student[];
  const ids=new Set(list.map(x=>x.id));
  setStudents(list);
  setRows(((aRes.data||[]) as Absence[]).filter(x=>ids.has(x.student_id)));
  setEdits({});
  setReady(true);
 }

 useEffect(()=>{let active=true;(async()=>{if(active)await load()})();return()=>{active=false}},[classId,date]);

 const current=(studentId:number):Edit=>{
  if(edits[studentId])return edits[studentId];
  const row=rows.find(x=>x.student_id===studentId);
  return row?{status:row.status,note:row.note||""}:{status:"present",note:""};
 };
 const parentLocked=(studentId:number)=>rows.find(x=>x.student_id===studentId)?.source==="parent";
 const setStatus=(studentId:number,status:string)=>{
  const before=current(studentId);
  const note=status==="late"&&!before.note?`Ankom kl. ${new Date().toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}`:status==="present"?"":before.note;
  setEdits(v=>({...v,[studentId]:{status,note}}));
  setMessage("");
 };
 const setNote=(studentId:number,note:string)=>{const before=current(studentId);setEdits(v=>({...v,[studentId]:{...before,note}}));setMessage("")};

 const summary=useMemo(()=>{
  let present=0,late=0,away=0;
  for(const s of students){const status=edits[s.id]?.status??rows.find(x=>x.student_id===s.id)?.status??"present";if(status==="present")present++;else if(status==="late")late++;else away++}
  return{present,late,away};
 },[students,rows,edits]);
 const dirtyCount=Object.keys(edits).length;

 async function save(){
  if(!canEdit||!dirtyCount)return;
  setSaving(true);setMessage("");
  const{data:auth}=await supabase.auth.getSession();
  const user=auth.session?.user;
  if(!user){setMessage("Din session er udløbet.");setSaving(false);return}

  const dirty=Object.entries(edits).map(([studentId,edit])=>({studentId:Number(studentId),...edit})).filter(x=>!parentLocked(x.studentId));
  const deleteIds=dirty.filter(x=>x.status==="present").map(x=>rows.find(r=>r.student_id===x.studentId)?.id).filter((x):x is number=>typeof x==="number");
  const upserts=dirty.filter(x=>x.status!=="present").map(x=>({student_id:x.studentId,absence_date:date,status:x.status,note:x.note.trim()||null,source:"teacher",reported_by:user.id}));

  const results=await Promise.all([
   deleteIds.length?supabase.from("student_absence").delete().in("id",deleteIds):Promise.resolve({error:null}),
   upserts.length?supabase.from("student_absence").upsert(upserts,{onConflict:"student_id,absence_date"}):Promise.resolve({error:null})
  ]);
  const error=results.find(x=>x.error)?.error;
  if(error){setMessage(`Kunne ikke gemme fravær: ${error.message}`);setSaving(false);return}
  await load();
  setMessage("Fravær gemt ✓");setSaving(false);
 }

 if(!ready)return <section style={card}><strong>Henter fravær…</strong></section>;
 return <section style={{...card,borderColor:"#cfd9d1"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start",flexWrap:"wrap"}}>
   <div><p style={eyebrow}>FREMMØDE</p><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"5px 0"}}>Hvem er her?</h2><p style={{color:"#707670",margin:"0 0 5px",lineHeight:1.5}}>Alle regnes som til stede. Registrér kun fravær, forsinkelse eller hvis en elev går tidligt.</p></div>
   <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span style={chip}>Til stede {summary.present}</span><span style={chip}>Forsinket {summary.late}</span><span style={chip}>Fravær {summary.away}</span></div>
  </div>
  {message&&<div style={{marginTop:12,padding:"10px 12px",borderRadius:8,background:message.startsWith("Kunne")?"#f7e5e2":"#e7eee9",color:message.startsWith("Kunne")?"#7c342e":"#4d6657",fontWeight:700}}>{message}</div>}
  <div style={{marginTop:15,borderTop:"1px solid #ece8df"}}>
   {students.length===0?<p style={{color:"#707670"}}>Der er ingen elever i klassen.</p>:students.map(student=>{
    const value=current(student.id),existing=rows.find(x=>x.student_id===student.id),locked=existing?.source==="parent";
    return <div key={student.id} style={{display:"grid",gridTemplateColumns:"minmax(150px,1fr) minmax(150px,.8fr) minmax(190px,1.2fr)",gap:10,alignItems:"center",padding:"11px 0",borderBottom:"1px solid #f0ede7"}}>
     <div><strong>{student.name}</strong>{locked&&<small style={{display:"block",marginTop:3,color:"#806936"}}>Meldt af forælder · {label(existing.status)}</small>}{!locked&&existing&&<small style={{display:"block",marginTop:3,color:"#6d756f"}}>Registreret · {label(existing.status)}</small>}</div>
     <select disabled={!canEdit||locked} value={value.status} onChange={e=>setStatus(student.id,e.target.value)} style={{...selectStyle,opacity:!canEdit||locked?.65:1}}>{TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>
     {locked?<div style={{fontSize:13,color:"#71664f"}}>{existing.note||"Registreringen bevares som forældremelding."}<div><Link href={`/students?class=${classId}&date=${date}`} style={{color:"#486b59",fontWeight:800,textDecoration:"none"}}>Åbn fuld fraværsoversigt →</Link></div></div>:<input disabled={!canEdit||value.status==="present"} value={value.note} onChange={e=>setNote(student.id,e.target.value)} placeholder={value.status==="late"?"Fx Ankom kl. 08.17":"Note (valgfri)"} style={{...inputStyle,opacity:!canEdit||value.status==="present"?.55:1}}/>}
    </div>
   })}
  </div>
  {canEdit&&<div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginTop:15}}><button type="button" disabled={!dirtyCount||saving} onClick={save} style={{border:0,borderRadius:9,padding:"11px 15px",background:"#365044",color:"white",fontWeight:900,cursor:dirtyCount&&!saving?"pointer":"default",opacity:dirtyCount&&!saving?1:.45}}>{saving?"Gemmer…":dirtyCount?`Gem fravær (${dirtyCount})`:"Fravær er ajour"}</button><small style={{color:"#707670"}}>Registreringen bruges også i klassens almindelige fraværsoversigt.</small></div>}
 </section>;
}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:22};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.5,color:"#718077",margin:0};
const chip:React.CSSProperties={fontSize:11,fontWeight:800,color:"#53635a",background:"#eef1ed",border:"1px solid #dde3dd",borderRadius:999,padding:"5px 8px"};
