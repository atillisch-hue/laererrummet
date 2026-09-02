"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";

type Child={id:number;name:string;class_id:number|null;class_name:string|null;school_id:number};
type Absence={id:number;student_id:number;absence_date:string;status:string;note:string|null;source:string;created_at:string;can_manage:boolean};
const today=()=>new Date().toLocaleDateString("sv-SE",{timeZone:"Europe/Copenhagen"});

export default function ParentAbsencePage(){
 const[ready,setReady]=useState(false),[children,setChildren]=useState<Child[]>([]),[absence,setAbsence]=useState<Absence[]>([]),[activeId,setActiveId]=useState<number|null>(null),[date,setDate]=useState(today()),[note,setNote]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false),[editing,setEditing]=useState<number|null>(null),[editDate,setEditDate]=useState(""),[editNote,setEditNote]=useState("");

 async function token(){const{data}=await supabase.auth.getSession();return data.session?.access_token||""}
 async function load(){
  const t=await token();if(!t){location.replace("/");return}
  const res=await fetch("/api/parent/absence",{headers:{Authorization:`Bearer ${t}`}}),body=await res.json();
  if(!res.ok){setMessage(body.error||"Fravær kunne ikke hentes.");setReady(true);return}
  const cs=(body.children||[]) as Child[];setChildren(cs);setAbsence((body.absence||[]) as Absence[]);setActiveId(v=>v&&cs.some(c=>c.id===v)?v:(cs[0]?.id||null));setReady(true);
 }
 useEffect(()=>{load()},[]);
 const active=children.find(c=>c.id===activeId)||null;
 const rows=useMemo(()=>absence.filter(a=>a.student_id===activeId).sort((a,b)=>b.absence_date.localeCompare(a.absence_date)),[absence,activeId]);

 async function report(){
  if(!activeId||!date)return;setSaving(true);setMessage("");const t=await token();
  const res=await fetch("/api/parent/absence",{method:"POST",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({student_id:activeId,absence_date:date,note})}),body=await res.json();
  setMessage(res.ok?"Sygemeldingen er gemt ✓":body.error||"Sygemeldingen kunne ikke gemmes.");if(res.ok){setNote("");await load()}setSaving(false);
 }
 function startEdit(a:Absence){setEditing(a.id);setEditDate(a.absence_date);setEditNote(a.note||"");setMessage("")}
 async function saveEdit(id:number){
  setSaving(true);const t=await token();const res=await fetch("/api/parent/absence",{method:"PATCH",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({id,absence_date:editDate,note:editNote})}),body=await res.json();
  setMessage(res.ok?"Fraværet er opdateret ✓":body.error||"Fraværet kunne ikke opdateres.");if(res.ok){setEditing(null);await load()}setSaving(false);
 }
 async function remove(id:number){
  if(!confirm("Vil du annullere denne sygemelding?"))return;setSaving(true);const t=await token();const res=await fetch("/api/parent/absence",{method:"DELETE",headers:{Authorization:`Bearer ${t}`,"Content-Type":"application/json"},body:JSON.stringify({id})}),body=await res.json();
  setMessage(res.ok?"Sygemeldingen er annulleret.":body.error||"Sygemeldingen kunne ikke annulleres.");if(res.ok)await load();setSaving(false);
 }

 if(!ready)return <main style={shell}>Henter fravær…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}><section style={shell}>
  <Link href="/parent" style={back}>← Forældreportalen</Link><p style={{...eyebrow,marginTop:26}}>FRAVÆR</p><h1 style={h1}>Meld syg og se historik</h1><p style={intro}>Du kan rette eller annullere dine egne sygemeldinger for i dag og kommende dage. Tidligere fravær er historik og kan ikke ændres her.</p>
  {message&&<div style={notice}>{message}</div>}
  {!children.length?<section style={card}>Der er endnu ikke knyttet et barn til din aktive forældreadgang.</section>:<>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"22px 0"}}>{children.map(c=><button key={c.id} onClick={()=>{setActiveId(c.id);setEditing(null)}} style={{...childButton,background:activeId===c.id?"#365044":"white",color:activeId===c.id?"white":"#26342e"}}>{c.name}{c.class_name?` · ${c.class_name}`:""}</button>)}</div>
   <section style={card}><p style={eyebrow}>NY SYGEMELDING</p><h2 style={h2}>{active?.name}</h2><div style={{display:"grid",gridTemplateColumns:"minmax(180px,.6fr) minmax(240px,1.5fr)",gap:10}}><label style={label}>Dato<input type="date" min={today()} value={date} onChange={e=>setDate(e.target.value)} style={input}/></label><label style={label}>Besked til skolen <span style={{fontWeight:400}}>(valgfri)</span><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Fx feber – forventes tilbage i morgen" style={input}/></label></div><button onClick={report} disabled={saving||!date} style={primary}>{saving?"Gemmer…":"Meld syg"}</button></section>
   <section style={{...card,marginTop:18}}><p style={eyebrow}>REGISTRERET FRAVÆR</p><h2 style={h2}>{rows.length} registrering{rows.length===1?"":"er"}</h2>{!rows.length?<p style={muted}>Ingen fraværsregistreringer endnu.</p>:<div style={{display:"grid",gap:9}}>{rows.map(a=>{const mine=a.source==="parent",past=a.absence_date<today(),isEditing=editing===a.id;return <article key={a.id} style={row}>
    {isEditing?<div style={{display:"grid",gap:9}}><div style={{display:"grid",gridTemplateColumns:"minmax(170px,.6fr) minmax(220px,1.5fr)",gap:8}}><label style={label}>Dato<input type="date" min={today()} value={editDate} onChange={e=>setEditDate(e.target.value)} style={input}/></label><label style={label}>Besked<input value={editNote} onChange={e=>setEditNote(e.target.value)} style={input}/></label></div><div style={{display:"flex",gap:7}}><button onClick={()=>saveEdit(a.id)} disabled={saving} style={smallPrimary}>Gem</button><button onClick={()=>setEditing(null)} style={smallButton}>Annullér</button></div></div>:<div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start",flexWrap:"wrap"}}><div><strong>{new Date(a.absence_date+"T12:00").toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</strong><small style={{display:"block",color:"#707670",marginTop:3}}>{mine?"Meldt af dig":"Registreret af skolen"}{past?" · historik":""}</small>{a.note&&<p style={{margin:"7px 0 0"}}>{a.note}</p>}</div>{a.can_manage&&<div style={{display:"flex",gap:6}}><button onClick={()=>startEdit(a)} style={smallButton}>Redigér</button><button onClick={()=>remove(a.id)} style={{...smallButton,color:"#8a3c34"}}>Annullér</button></div>}</div>}
   </article>})}</div>}</section>
  </>}
 </section></main>
}

const shell:React.CSSProperties={maxWidth:900,margin:"auto",padding:"34px 24px 70px"};const back:React.CSSProperties={color:"#526b60",fontWeight:800,textDecoration:"none"};const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};const h1:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:38,margin:"6px 0 8px"};const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:26,margin:"5px 0 14px"};const intro:React.CSSProperties={color:"#687068",fontSize:17,lineHeight:1.55,maxWidth:720};const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:21};const notice:React.CSSProperties={padding:12,background:"#e7eee9",borderRadius:9,margin:"16px 0",fontWeight:700};const childButton:React.CSSProperties={padding:"10px 14px",border:"1px solid #cfcac0",borderRadius:9,fontWeight:800,cursor:"pointer"};const label:React.CSSProperties={fontSize:13,fontWeight:800};const input:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",padding:10,border:"1px solid #d5d0c7",borderRadius:8,marginTop:6,background:"white"};const primary:React.CSSProperties={marginTop:14,border:0,borderRadius:8,padding:"11px 15px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};const row:React.CSSProperties={background:"#faf9f6",border:"1px solid #e3dfd7",borderRadius:10,padding:"13px 14px"};const smallButton:React.CSSProperties={border:"1px solid #d2cec5",background:"white",borderRadius:7,padding:"6px 9px",fontWeight:800,cursor:"pointer"};const smallPrimary:React.CSSProperties={...smallButton,background:"#365044",borderColor:"#365044",color:"white"};const muted:React.CSSProperties={color:"#707670"};