"use client";

import Link from "next/link";
import {useParams} from "next/navigation";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";

type AttendanceRow={student_id:number;student_name:string;status:string;note:string|null;source:string|null};
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
 const params=useParams<{scheduleId:string}>();
 const scheduleId=Number(params.scheduleId);
 const[ready,setReady]=useState(false);
 const[rows,setRows]=useState<AttendanceRow[]>([]);
 const[edits,setEdits]=useState<Record<number,Edit>>({});
 const[checkedAt,setCheckedAt]=useState<string|null>(null);
 const[attendanceAuthorized,setAttendanceAuthorized]=useState(false);
 const[saving,setSaving]=useState(false);
 const[message,setMessage]=useState("");
 const canTakeAttendance=canEdit||attendanceAuthorized;

 async function load(){
  const[aRes,lRes]=await Promise.all([
   supabase.rpc("get_lesson_attendance",{p_schedule_entry_id:scheduleId,p_lesson_date:date}),
   supabase.from("lesson_instances").select("attendance_checked_at").eq("schedule_entry_id",scheduleId).eq("lesson_date",date).maybeSingle()
  ]);
  if(aRes.error){setAttendanceAuthorized(false);setMessage(aRes.error.message||"Fremmøde kunne ikke hentes.");setReady(true);return}
  setAttendanceAuthorized(true);
  setRows((aRes.data||[]) as AttendanceRow[]);
  if(lRes.error)setMessage(lRes.error.message||"Status for fremmøde kunne ikke hentes.");
  setCheckedAt(lRes.data?.attendance_checked_at||null);
  setEdits({});
  setReady(true);
 }

 useEffect(()=>{load()},[classId,date,scheduleId]);

 const rowFor=(studentId:number)=>rows.find(x=>x.student_id===studentId);
 const current=(studentId:number):Edit=>{
  if(edits[studentId])return edits[studentId];
  const row=rowFor(studentId);
  return{status:row?.status||"present",note:row?.note||""};
 };
 const parentLocked=(studentId:number)=>rowFor(studentId)?.source==="parent";
 const setStatus=(studentId:number,status:string)=>{
  const before=current(studentId);
  const note=status==="late"&&!before.note?`Ankom kl. ${new Date().toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}`:status==="present"?"":before.note;
  setEdits(v=>({...v,[studentId]:{status,note}}));
  setMessage("");
 };
 const setNote=(studentId:number,note:string)=>{const before=current(studentId);setEdits(v=>({...v,[studentId]:{...before,note}}));setMessage("")};

 const summary=useMemo(()=>{
  let present=0,late=0,away=0;
  for(const row of rows){const status=edits[row.student_id]?.status??row.status;if(status==="present")present++;else if(status==="late")late++;else away++}
  return{present,late,away};
 },[rows,edits]);
 const dirtyCount=Object.keys(edits).length;

 async function save(){
  if(!canTakeAttendance||saving||!Number.isFinite(scheduleId))return;
  setSaving(true);setMessage("");
  const changes=Object.entries(edits)
   .map(([studentId,edit])=>({student_id:Number(studentId),status:edit.status,note:edit.note.trim()||null}))
   .filter(x=>!parentLocked(x.student_id));
  const{error}=await supabase.rpc("save_lesson_attendance",{p_schedule_entry_id:scheduleId,p_lesson_date:date,p_changes:changes});
  if(error){setMessage(`Kunne ikke gemme fremmøde: ${error.message}`);setSaving(false);return}
  await load();
  setMessage("Fremmøde ført ✓");setSaving(false);
 }

 if(!ready)return <section style={card}><strong>Henter fremmøde…</strong></section>;
 return <section style={{...card,borderColor:"#cfd9d1"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start",flexWrap:"wrap"}}>
   <div><p style={eyebrow}>FREMMØDE</p><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"5px 0"}}>Hvem er her?</h2><p style={{color:"#707670",margin:"0 0 5px",lineHeight:1.5}}>Alle regnes som til stede. Registrér kun fravær, forsinkelse eller hvis en elev går tidligt.</p>{checkedAt&&<small style={{display:"block",marginTop:7,color:"#4f6d59",fontWeight:900}}>✓ Fremmøde ført {new Date(checkedAt).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}</small>}</div>
   <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span style={chip}>Til stede {summary.present}</span><span style={chip}>Forsinket {summary.late}</span><span style={chip}>Fravær {summary.away}</span></div>
  </div>
  {message&&<div style={{marginTop:12,padding:"10px 12px",borderRadius:8,background:message.startsWith("Kunne")?"#f7e5e2":"#e7eee9",color:message.startsWith("Kunne")?"#7c342e":"#4d6657",fontWeight:700}}>{message}</div>}
  <div style={{marginTop:15,borderTop:"1px solid #ece8df"}}>
   {rows.length===0?<p style={{color:"#707670"}}>Der er ingen elever i klassen.</p>:rows.map(row=>{
    const value=current(row.student_id),locked=row.source==="parent";
    const provenance=locked?`Meldt af forælder · ${label(row.status)}`:row.source==="substitute"?`Registreret af vikar · ${label(row.status)}`:row.source?`Registreret · ${label(row.status)}`:"";
    return <div key={row.student_id} style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,alignItems:"center",padding:"11px 0",borderBottom:"1px solid #f0ede7"}}>
     <div><strong>{row.student_name}</strong>{provenance&&<small style={{display:"block",marginTop:3,color:locked?"#806936":"#6d756f"}}>{provenance}</small>}</div>
     <select disabled={!canTakeAttendance||locked} value={value.status} onChange={e=>setStatus(row.student_id,e.target.value)} style={{...selectStyle,opacity:(!canTakeAttendance||locked)?0.65:1}}>{TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select>
     {locked?<div style={{fontSize:13,color:"#71664f"}}>{row.note||"Registreringen bevares som forældremelding."}<div><Link href={`/students?class=${classId}&date=${date}`} style={{color:"#486b59",fontWeight:800,textDecoration:"none"}}>Åbn fuld fraværsoversigt →</Link></div></div>:<input disabled={!canTakeAttendance||value.status==="present"} value={value.note} onChange={e=>setNote(row.student_id,e.target.value)} placeholder={value.status==="late"?"Fx Ankom kl. 08.17":"Note (valgfri)"} style={{...inputStyle,opacity:(!canTakeAttendance||value.status==="present")?0.55:1}}/>}
    </div>
   })}
  </div>
  {canTakeAttendance&&<div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginTop:15}}><button type="button" disabled={saving} onClick={save} style={{border:0,borderRadius:9,padding:"11px 15px",background:"#365044",color:"white",fontWeight:900,cursor:saving?"default":"pointer",opacity:saving?0.55:1}}>{saving?"Gemmer…":dirtyCount?`Gem fravær og markér ført (${dirtyCount})`:checkedAt?"Opdatér fremmøde":"Markér fremmøde ført"}</button><small style={{color:"#707670"}}>Lærer eller tildelt vikar kan føre fremmøde. Registreringen genbruges i klassens fraværsoversigt.</small></div>}
 </section>;
}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:22};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.5,color:"#718077",margin:0};
const chip:React.CSSProperties={fontSize:11,fontWeight:800,color:"#53635a",background:"#eef1ed",border:"1px solid #dde3dd",borderRadius:999,padding:"5px 8px"};
