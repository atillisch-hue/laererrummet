"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { hasRole } from "../../lib/roles";

type Student = { id:number; name:string; class_id:number };
type ClassRow = { id:number; name:string };
type TeacherClass = { teacher_id:string; class_id:number };
type Absence = { id:number; student_id:number; absence_date:string; status:string; note:string|null };

const TYPES = [
  { value:"sick", label:"Syg" },
  { value:"unexcused", label:"Ulovligt fravær" },
  { value:"excused", label:"Lovligt fravær" },
  { value:"left_early", label:"Gået tidligt" },
  { value:"late", label:"Forsent fremmøde" },
];

export default function StudentsPage(){
 const [ready,setReady]=useState(false),[classes,setClasses]=useState<ClassRow[]>([]),[classId,setClassId]=useState<number|"">("");
 const [students,setStudents]=useState<Student[]>([]),[rows,setRows]=useState<Absence[]>([]),[date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [selected,setSelected]=useState<Record<number,boolean>>({}),[types,setTypes]=useState<Record<number,string>>({}),[notes,setNotes]=useState<Record<number,string>>({}),[msg,setMsg]=useState("");

 async function load(){
  const {data:s}=await supabase.auth.getSession(); const user=s.session?.user;
  if(!user){window.location.href="/?teacher=1";return}
  const [{data:c},{data:st},{data:tc},{data:a}]=await Promise.all([
   supabase.from("classes").select("id,name").order("id"),
   supabase.from("students").select("id,name,class_id").order("name"),
   supabase.from("teacher_classes").select("teacher_id,class_id").eq("teacher_id",user.id),
   supabase.from("student_absence").select("id,student_id,absence_date,status,note").order("absence_date",{ascending:false}).limit(200)
  ]);
  const allClasses=(c||[]) as ClassRow[]; const assigned=new Set(((tc||[]) as TeacherClass[]).map(x=>x.class_id)); const admin=hasRole(user,"admin");
  const cs=admin?allClasses:allClasses.filter(x=>assigned.has(x.id));
  setClasses(cs); setStudents(((st||[]) as Student[]).filter(x=>admin||assigned.has(x.class_id))); setRows((a||[]) as Absence[]);
  const requested=Number(new URLSearchParams(window.location.search).get("class")); setClassId(cs.some(x=>x.id===requested)?requested:(cs[0]?.id||"")); setReady(true);
 }
 useEffect(()=>{load()},[]);
 const shown=useMemo(()=>students.filter(s=>s.class_id===classId),[students,classId]);
 const todayRows=useMemo(()=>rows.filter(r=>r.absence_date===date),[rows,date]);
 const rowFor=(id:number)=>todayRows.find(r=>r.student_id===id);
 const label=(status:string)=>TYPES.find(x=>x.value===status)?.label||status;

 async function save(){
  const chosen=shown.filter(s=>selected[s.id]); if(!chosen.length){setMsg("Markér mindst én elev med fravær.");return}
  const payload=chosen.map(s=>({student_id:s.id,absence_date:date,status:types[s.id]||"sick",note:(notes[s.id]||"").trim()||null}));
  const {error}=await supabase.from("student_absence").insert(payload);
  setMsg(error?error.message:`${payload.length} fraværsregistrering${payload.length===1?"":"er"} gemt.`);
  if(!error){setSelected({});setNotes({});await load()}
 }

 if(!ready)return <main style={{padding:50}}>Henter elever…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"42px 24px 80px"}}><section style={{maxWidth:1000,margin:"0 auto"}}>
  <Link href="/teacher-dashboard" style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← Til lærerforsiden</Link>
  <p className="eyebrow" style={{marginTop:38}}>KLASSEOVERBLIK</p><h1 style={{marginBottom:8}}>{classes.find(c=>c.id===classId)?.name||"Mine klasser"}</h1>
  <p style={{color:"#777",marginTop:0}}>Se klassens elever og registrér fravær. Oprettelse og administration af elever håndteres af skolens administrator.</p>
  {classes.length===0?<div className="card" style={{padding:26,marginTop:28}}><strong>Du er endnu ikke tilknyttet en klasse.</strong><p style={{color:"#777"}}>En administrator kan tilknytte dig under Lærere & klasser.</p></div>:<>
   <div className="card" style={{padding:26,marginTop:28}}>
    <label style={{fontWeight:800}}>Klasse<select value={classId} onChange={e=>{setClassId(Number(e.target.value));setSelected({});setNotes({})}} style={{display:"block",marginTop:8,padding:11,border:"1px solid #d8d5cd",borderRadius:8,minWidth:240}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <h2 style={{marginTop:28}}>Elever · {shown.length}</h2>
    {shown.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderTop:"1px solid #ebe7de"}}><Link href={`/student-profile?id=${s.id}`} style={{display:"flex",alignItems:"center",gap:12,textDecoration:"none",color:"inherit",flex:1}}><div style={{width:38,height:38,borderRadius:99,background:"#eee8da",display:"grid",placeItems:"center",fontFamily:"Georgia,serif"}}>{s.name[0]}</div><strong>{s.name}</strong><span style={{color:"#526b60",fontWeight:800}}>Åbn →</span></Link>{rowFor(s.id)&&<span style={{background:"#f2e7d7",padding:"7px 10px",borderRadius:999,fontWeight:700}}>{label(rowFor(s.id)!.status)}</span>}</div>)}
    {!shown.length&&<p style={{color:"#777"}}>Der er ingen elever i klassen endnu. En administrator kan tilføje elever.</p>}
   </div>
   <div className="card" style={{padding:26,marginTop:22}}><h2 style={{marginTop:0}}>Før fravær</h2><p style={{color:"#777"}}>Markér kun elever, der ikke er almindeligt til stede. Registreringerne deles med skolens administration og bruges i fraværsstatistikken.</p>
    {msg&&<div style={{padding:12,background:"#e7eee9",borderRadius:9,margin:"14px 0"}}>{msg}</div>}
    <input type="date" value={date} onChange={e=>{setDate(e.target.value);setSelected({});setNotes({})}} style={{padding:10,marginBottom:12}}/>
    {shown.map(s=>{const existing=rowFor(s.id);return <div key={s.id} style={{display:"grid",gridTemplateColumns:"minmax(180px,1.3fr) minmax(170px,1fr) minmax(210px,1.4fr)",gap:12,alignItems:"center",borderTop:"1px solid #eee",padding:"12px 0"}}><label style={{display:"flex",gap:10,alignItems:"center",fontWeight:600}}><input type="checkbox" disabled={!!existing} checked={!!selected[s.id]} onChange={e=>setSelected(v=>({...v,[s.id]:e.target.checked}))}/>{s.name}{existing&&<small style={{color:"#687068"}}> · {label(existing.status)}</small>}</label><select disabled={!!existing||!selected[s.id]} value={types[s.id]||"sick"} onChange={e=>setTypes(v=>({...v,[s.id]:e.target.value}))} style={{padding:8}}>{TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select><input disabled={!!existing||!selected[s.id]} value={notes[s.id]||""} onChange={e=>setNotes(v=>({...v,[s.id]:e.target.value}))} placeholder={existing?(existing.note||"Allerede registreret"):"Note (valgfri)"} style={{padding:8}}/></div>})}
    {!!shown.length&&<button className="primary" onClick={save} style={{width:"auto",marginTop:18}}>✓ Gem fravær</button>}
   </div>
  </>}
 </section></main>
}
