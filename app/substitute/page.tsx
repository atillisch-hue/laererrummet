"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

type Row={assignment_id:number;school_id:number;schedule_entry_id:number;assignment_date:string;start_time:string;end_time:string;subject:string;room:string|null;class_id:number;class_name:string;substitute_plan:string|null;lesson_instance_id:number|null;subject_unit_title:string|null;attendance_checked_at:string|null;resource_count:number};
const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const dateLabel=(date:string)=>new Date(`${date}T12:00:00`).toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long",year:"numeric"});

export default function SubstitutePage(){
 const[date,setDate]=useState(()=>iso(new Date())),[rows,setRows]=useState<Row[]>([]),[ready,setReady]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState("");
 async function load(target=date){setLoading(true);setError("");const{data,error:e}=await supabase.rpc("substitute_day_workspace",{p_date:target});if(e){setError(e.message);setRows([])}else setRows((data||[]) as Row[]);setLoading(false)}
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session){location.replace("/");return}await load(date);setReady(true)})()},[]);
 async function move(amount:number){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+amount);const next=iso(d);setDate(next);await load(next)}
 async function today(){const next=iso(new Date());setDate(next);await load(next)}
 if(!ready)return <main style={{padding:50}}>Åbner vikar-mode…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 28px"}}><div style={{maxWidth:900,margin:"auto"}}><small style={{fontWeight:900,letterSpacing:1.4,opacity:.7}}>VIKAR-MODE</small><h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"5px 0"}}>Min vikardag</h1><p style={{margin:0,opacity:.8}}>Kun det, du skal bruge til de timer, du er tildelt.</p></div></header>
  <section style={{maxWidth:900,margin:"auto",padding:"28px 24px 70px"}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:18}}><div><p style={eyebrow}>VALGT DAG</p><h2 style={{fontFamily:"Georgia,serif",margin:"4px 0 0",textTransform:"capitalize"}}>{dateLabel(date)}</h2></div><div style={{display:"flex",gap:7}}><button onClick={()=>move(-1)} style={nav}>←</button><button onClick={today} style={nav}>I dag</button><button onClick={()=>move(1)} style={nav}>→</button></div></div>
   {error&&<div style={{...card,background:"#fff3cd",color:"#765b29"}}>Vikardagen kunne ikke hentes: {error}</div>}
   {loading?<div style={card}>Henter dine vikartimer…</div>:rows.length===0&&!error?<section style={card}><strong>Ingen vikartimer denne dag.</strong><p style={{color:"#707670",marginBottom:0}}>Når ledelsen tildeler dig en vikartime, dukker den automatisk op her.</p></section>:<div style={{display:"grid",gap:12}}>{rows.map(row=>{const href=`/calendar/lesson/${row.schedule_entry_id}?date=${row.assignment_date}`;return <article key={row.assignment_id} style={card}>
    <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><small style={eyebrow}>{row.start_time.slice(0,5)}–{row.end_time.slice(0,5)} · {row.subject.toUpperCase()}</small><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"5px 0"}}>{row.class_name}</h2><div style={{color:"#707670",fontSize:13}}>{row.room?`Lokale ${row.room}`:"Intet lokale angivet"}{row.subject_unit_title?` · ${row.subject_unit_title}`:""}</div></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{row.resource_count>0&&<span style={chip}>{row.resource_count} materiale{row.resource_count===1?"":"r"}</span>}{row.attendance_checked_at?<span style={doneChip}>Fremmøde ført ✓</span>:<span style={attentionChip}>Fremmøde mangler</span>}</div></div>
    <section style={{marginTop:15,padding:"13px 14px",borderRadius:10,background:"#eef2ed",border:"1px solid #d8e0d9"}}><small style={eyebrow}>VIKARPLAN</small>{row.substitute_plan?<p style={{whiteSpace:"pre-wrap",lineHeight:1.55,margin:"7px 0 0"}}>{row.substitute_plan}</p>:<p style={{color:"#747b75",margin:"7px 0 0"}}>Der er ikke skrevet en særskilt vikarplan. Åbn lektionen for lærerens plan og materialer.</p>}</section>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><Link href={href} style={primary}>Åbn lektion →</Link><Link href={`/calendar?date=${row.assignment_date}`} style={secondary}>Åbn kalender</Link></div>
   </article>})}</div>}
   <section style={{...card,marginTop:18,background:"#f0ede6"}}><small style={eyebrow}>ADGANG</small><p style={{margin:"7px 0 0",lineHeight:1.5,color:"#626a63"}}>Vikar-mode viser kun dine egne tildelte vikartimer. Inde i lektionen kan du se lærerens plan og materialer og føre fremmøde, men du kan ikke omskrive lærerens forberedelse.</p></section>
  </section>
 </main>;
}
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:18};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:0};
const nav:React.CSSProperties={border:"1px solid #cbc7be",background:"white",borderRadius:8,padding:"8px 11px",fontWeight:850,color:"#365044",cursor:"pointer"};
const chip:React.CSSProperties={padding:"5px 7px",borderRadius:999,background:"#eef1ed",fontSize:10,fontWeight:900,color:"#59675f"};
const doneChip:React.CSSProperties={...chip,background:"#e3eee5",color:"#46614d"};
const attentionChip:React.CSSProperties={...chip,background:"#f4eee0",color:"#75623f"};
const primary:React.CSSProperties={display:"inline-block",padding:"10px 13px",borderRadius:8,background:"#365044",color:"white",fontWeight:900,textDecoration:"none",fontSize:12};
const secondary:React.CSSProperties={...primary,background:"white",color:"#365044",border:"1px solid #c9d2cc"};
