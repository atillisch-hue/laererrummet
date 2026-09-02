"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";
import {recurrenceLabel,scheduleOccursOn,type RecurrencePattern} from "../../lib/scheduleRecurrence";
import RoleNoticeboard from "../RoleNoticeboard";

type Assignment={id:number;title:string;type:string;instructions:string|null;class_subject_id:number|null;subject_title:string|null;created_at:string};
type ScheduleEntry={id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;entry_kind:"lesson"|"assembly"|"break";recurrence_pattern:RecurrencePattern};
type Absence={id:number;absence_date:string;status:string;source:string;created_at:string};
type ClosedDay={date:string;label?:string};
type Child={id:number;name:string;class_id:number|null;class_name:string|null;closed_days:ClosedDay[];assignments:Assignment[];schedule:ScheduleEntry[];absence:Absence[]};
type ParentPayload={children?:Child[]};

const shell:React.CSSProperties={maxWidth:1100,margin:"auto",padding:"42px 24px 80px"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0};
const dateOnly=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const kindLabel=(kind:ScheduleEntry["entry_kind"])=>kind==="assembly"?"Samling":kind==="break"?"Pause":"Undervisning";
const absenceLabel=(status:string)=>({sick:"Syg",excused:"Godkendt fravær",unexcused:"Ikke godkendt",late:"Kom for sent",left_early:"Gået tidligt"}[status]||status);

export default function ParentPage(){
 const[ready,setReady]=useState(false);
 const[children,setChildren]=useState<Child[]>([]);
 const[activeId,setActiveId]=useState<number|null>(null);
 const[openAssignmentId,setOpenAssignmentId]=useState<number|null>(null);
 const[error,setError]=useState("");

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();
  const user=data.session?.user;
  if(!user){location.replace("/");return}
  if(!hasRole(user,"parent")){location.replace("/noticeboard");return}
  const{data:portal,error:portalError}=await supabase.rpc("parent_portal_data");
  if(portalError){setError("Forældreoverblikket kunne ikke hentes.");setReady(true);return}
  const list=Array.isArray((portal as ParentPayload|null)?.children)?((portal as ParentPayload).children||[]):[];
  setChildren(list);
  setActiveId(list[0]?.id||null);
  setReady(true);
 })()},[]);

 const active=children.find(c=>c.id===activeId)||children[0]||null;
 const today=dateOnly(new Date());
 const weekday=new Date(today+"T12:00:00").getDay();
 const activeClosure=active?.closed_days?.find(x=>x.date===today)||null;
 const todaySchedule=useMemo(()=>activeClosure?[]:(active?.schedule.filter(entry=>entry.weekday===weekday&&scheduleOccursOn(entry.recurrence_pattern,today)).sort((a,b)=>a.start_time.localeCompare(b.start_time))||[]),[active,weekday,today,activeClosure]);
 const recentAssignments=active?.assignments.slice(0,6)||[];
 const recentAbsence=active?.absence.slice(0,5)||[];

 if(!ready)return <main style={shell}>Henter forældreoverblikket…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <section style={shell}>
   <p style={eyebrow}>FORÆLDREPORTAL</p>
   <h1 style={{fontFamily:"Georgia,serif",fontSize:42,margin:"7px 0 8px"}}>Dit barns skolehverdag</h1>
   <p style={{maxWidth:740,fontSize:17,color:"#687068",lineHeight:1.55,margin:"0 0 24px"}}>Et roligt overblik over det, der er relevant for dig som forælder. Interne lærernoter, elevens kladder og andre elevers oplysninger er ikke en del af denne visning.</p>
   {error&&<div style={{padding:13,background:"#fff0ed",border:"1px solid #deb5ad",borderRadius:10,color:"#7b3b32",fontWeight:800,marginBottom:18}}>{error}</div>}
   <RoleNoticeboard audience="parent"/>

   {!children.length?<section style={{...card,marginTop:22}}>Skolen mangler at knytte et barn til din aktive forældrekonto.</section>:<>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:24}}>{children.map(child=><button key={child.id} onClick={()=>{setActiveId(child.id);setOpenAssignmentId(null)}} style={{padding:"10px 14px",borderRadius:9,border:active?.id===child.id?"1px solid #365044":"1px solid #d8d5cd",background:active?.id===child.id?"#365044":"white",color:active?.id===child.id?"white":"#27352d",fontWeight:850,cursor:"pointer"}}>{child.name}{child.class_name?` · ${child.class_name}`:""}</button>)}</div>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:14,flexWrap:"wrap",marginTop:28}}><div><p style={eyebrow}>DU SER NU</p><h2 style={{fontFamily:"Georgia,serif",fontSize:31,margin:"5px 0 0"}}>{active?.name}{active?.class_name?` · ${active.class_name}`:""}</h2></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/parent/schedule" style={secondary}>Hele skemaet →</Link><Link href="/parent/absence" style={secondary}>Meld syg / fravær →</Link><Link href="/parent/meetings" style={secondary}>Møder →</Link></div></div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(285px,1fr))",gap:16,marginTop:18,alignItems:"start"}}>
     <section id="today" style={{...card,background:"#eef2ed"}}>
      <p style={eyebrow}>I DAG · {new Date(today+"T12:00:00").toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long"}).toUpperCase()}</p>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><h3 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"7px 0 13px"}}>Skema</h3><Link href="/parent/schedule" style={{...secondary,padding:"6px 8px"}}>Se uge →</Link></div>
      {activeClosure?<div style={{padding:"11px 12px",background:"#f6edd7",border:"1px solid #dfca96",borderRadius:9,color:"#655538"}}><strong>{activeClosure.label||"Skolen er lukket"}</strong><small style={{display:"block",marginTop:3}}>Det almindelige skema vises derfor ikke i dag.</small></div>:todaySchedule.length===0?<p style={{color:"#687068",margin:0}}>Der er ingen almindelige skemabrikker for klassen i dag.</p>:<div style={{display:"grid",gap:8}}>{todaySchedule.map(entry=><article key={entry.id} style={{padding:"10px 11px",background:"white",border:"1px solid #d9e0da",borderRadius:9}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><strong>{entry.start_time.slice(0,5)}–{entry.end_time.slice(0,5)} · {entry.subject}</strong><small style={{fontSize:9,fontWeight:900,color:"#627168"}}>{kindLabel(entry.entry_kind).toUpperCase()}</small></div><small style={{display:"block",marginTop:3,color:"#6d756f"}}>{entry.room||"Intet lokale angivet"}{entry.recurrence_pattern!=="weekly"?` · ${recurrenceLabel(entry.recurrence_pattern)}`:""}</small></article>)}</div>}
     </section>

     <section id="assignments" style={card}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><div><p style={eyebrow}>OPGAVER</p><h3 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"7px 0 0"}}>Opgaver</h3></div><span style={countChip}>{active?.assignments.length||0}</span></div>
      {recentAssignments.length===0?<p style={{color:"#687068",marginBottom:0}}>Der er ingen opgaver, som er synlige for {active?.name}.</p>:<div style={{display:"grid",gap:8,marginTop:13}}>{recentAssignments.map(a=>{const open=openAssignmentId===a.id;return <article key={a.id} style={{border:"1px solid #e3dfd7",borderRadius:9,background:"#faf9f6",overflow:"hidden"}}><button type="button" onClick={()=>setOpenAssignmentId(open?null:a.id)} style={{width:"100%",border:0,background:"transparent",padding:"10px 11px",textAlign:"left",color:"inherit",cursor:"pointer"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><div><strong>{a.title}</strong><small style={{display:"block",marginTop:3,color:"#727772"}}>{a.subject_title?`${a.subject_title} · `:""}{a.type||"Opgave"}</small></div><strong style={{color:"#526b60",fontSize:12}}>{open?"Luk ↑":"Åbn ↓"}</strong></div></button>{open&&<div style={{padding:"0 11px 11px",borderTop:"1px solid #e5e1d9"}}><p style={{fontSize:10,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:"10px 0 5px"}}>INSTRUKTION</p><div style={{whiteSpace:"pre-wrap",lineHeight:1.55,color:"#46534c"}}>{a.instructions?.trim()||"Læreren har ikke skrevet en særskilt instruktion til opgaven."}</div><small style={{display:"block",marginTop:10,color:"#777168"}}>Elevens kladde og besvarelse vises ikke i forældreportalen.</small></div>}</article>})}</div>}
     </section>

     <section id="absence" style={card}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><div><p style={eyebrow}>FRAVÆR</p><h3 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"7px 0 0"}}>Seneste registreringer</h3></div><span style={countChip}>{active?.absence.length||0}</span></div>
      {recentAbsence.length===0?<p style={{color:"#687068",marginBottom:13}}>Der er ingen registreret fraværshistorik.</p>:<div style={{display:"grid",gap:8,marginTop:13}}>{recentAbsence.map(a=><article key={a.id} style={{padding:"9px 10px",border:"1px solid #e3dfd7",borderRadius:9,background:"#faf9f6"}}><strong>{new Date(a.absence_date+"T12:00:00").toLocaleDateString("da-DK",{day:"numeric",month:"short",year:"numeric"})}</strong><small style={{display:"block",marginTop:2,color:"#727772"}}>{absenceLabel(a.status)} · {a.source==="parent"?"meldt hjemmefra":"registreret af skolen"}</small></article>)}</div>}
      <Link href="/parent/absence" style={{...secondary,display:"inline-block",marginTop:13}}>Se fravær og meld syg →</Link>
     </section>

     <section style={{...card,background:"#f8f3e7"}}>
      <p style={eyebrow}>MØDER</p><h3 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"7px 0 7px"}}>Møder og officielle referater</h3><p style={{color:"#706956",lineHeight:1.5,margin:"0 0 13px"}}>Se de møder, du er inviteret til, og det indhold der er gjort tilgængeligt for dig som forælder.</p><Link href="/parent/meetings" style={secondary}>Åbn møder →</Link>
     </section>
    </div>

    <section style={{...card,marginTop:16,borderStyle:"dashed"}}><p style={eyebrow}>KOMMUNIKATION</p><h3 style={{fontFamily:"Georgia,serif",fontSize:21,margin:"7px 0 5px"}}>Beskeder kommer i kommunikationsmodulet</h3><p style={{color:"#687068",lineHeight:1.5,margin:0}}>Vi viser ikke en tom beskedindbakke endnu. Når kommunikationsdelen bygges, kobles den på samme barn- og skolerettigheder som resten af portalen.</p></section>
   </>}
  </section>
 </main>;
}

const secondary:React.CSSProperties={padding:"8px 11px",border:"1px solid #cfcac0",borderRadius:8,background:"white",color:"#486b59",fontWeight:850,fontSize:12,textDecoration:"none"};
const countChip:React.CSSProperties={minWidth:28,height:28,borderRadius:999,display:"grid",placeItems:"center",background:"#edf1ec",color:"#486b59",fontWeight:900,fontSize:12};
