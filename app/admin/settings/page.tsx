"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { hasRole } from "../../../lib/roles";

type ClosedDay={date:string;label:string};

function isoWeek(dateString:string){
 const d=new Date(dateString+"T12:00:00");
 const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
 const day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);
 const yearStart=new Date(Date.UTC(x.getUTCFullYear(),0,1));
 return Math.ceil((((x.getTime()-yearStart.getTime())/86400000)+1)/7);
}
function daDate(s:string){return new Date(s+"T12:00:00").toLocaleDateString("da-DK")}

export default function SchoolSettingsPage(){
 const[ready,setReady]=useState(false);
 const[start,setStart]=useState("2026-08-10");
 const[end,setEnd]=useState("2027-06-25");
 const[closed,setClosed]=useState<ClosedDay[]>([]);
 const[fromDate,setFromDate]=useState("");
 const[toDate,setToDate]=useState("");
 const[newLabel,setNewLabel]=useState("");
 const[message,setMessage]=useState("");

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();const user=data.session?.user;
  if(!user){window.location.replace("/");return}
  if(!hasRole(user,"admin")){window.location.replace("/noticeboard");return}
  const{data:row}=await supabase.from("school_settings").select("school_year_start,school_year_end,closed_days").eq("id",1).maybeSingle();
  if(row){if(row.school_year_start)setStart(row.school_year_start);if(row.school_year_end)setEnd(row.school_year_end);if(Array.isArray(row.closed_days))setClosed(row.closed_days)}
  setReady(true);
 })()},[]);

 const schoolDays=useMemo(()=>{
  if(!start||!end)return 0;let d=new Date(start+"T12:00:00"),last=new Date(end+"T12:00:00"),n=0;const excluded=new Set(closed.map(x=>x.date));
  while(d<=last){const day=d.getDay();const iso=d.toISOString().slice(0,10);if(day!==0&&day!==6&&!excluded.has(iso))n++;d.setDate(d.getDate()+1)}return n;
 },[start,end,closed]);

 const periods=useMemo(()=>{
  const map=new Map<string,{label:string;dates:string[]}>();
  closed.forEach(x=>{const key=x.label||"Lukkedag";const found=map.get(key)||{label:key,dates:[]};found.dates.push(x.date);map.set(key,found)});
  return [...map.values()].map(p=>({...p,dates:p.dates.sort()})).sort((a,b)=>a.dates[0].localeCompare(b.dates[0]));
 },[closed]);

 async function save(){setMessage("Gemmer…");const{error}=await supabase.from("school_settings").upsert({id:1,school_year_start:start,school_year_end:end,closed_days:closed,updated_at:new Date().toISOString()});setMessage(error?"Kunne ikke gemme endnu – databasen mangler muligvis tabellen.":"Skoleopsætningen er gemt.")}
 function addPeriod(){
  if(!fromDate)return;const last=toDate||fromDate;if(last<fromDate){setMessage("Slutdato skal ligge efter startdato.");return}
  const label=newLabel.trim()||"Lukkedag";const additions:ClosedDay[]=[];let d=new Date(fromDate+"T12:00:00"),stop=new Date(last+"T12:00:00");
  while(d<=stop){const day=d.getDay();if(day!==0&&day!==6)additions.push({date:d.toISOString().slice(0,10),label});d.setDate(d.getDate()+1)}
  const dates=new Set(additions.map(x=>x.date));setClosed(v=>[...v.filter(x=>!dates.has(x.date)),...additions].sort((a,b)=>a.date.localeCompare(b.date)));setFromDate("");setToDate("");setNewLabel("");setMessage("");
 }
 function removePeriod(dates:string[]){const set=new Set(dates);setClosed(v=>v.filter(x=>!set.has(x.date)))}

 if(!ready)return <main style={{padding:40}}>Henter skoleopsætning…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea"}}><header style={{background:"#486b59",color:"white",padding:"18px 6vw",display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong style={{fontSize:22}}>Administration · Skoleopsætning</strong><Link href="/admin" style={{color:"white"}}>← Administration</Link></header><section style={{maxWidth:1050,margin:"0 auto",padding:"48px 24px"}}><p className="eyebrow">SKOLEÅR</p><h1 style={{fontSize:42,marginBottom:8}}>Skolens kalender</h1><p style={{fontSize:18,color:"#5f665f",maxWidth:720}}>Angiv skoleårets start og slutning samt ferie- og lukkedage. Ugenumre beregnes automatisk og kan senere bruges på tværs af skema, ugeplaner og fravær.</p>
 <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18,marginTop:30}}><section style={card}><h2>Skoleår</h2><label style={label}>Første skoledag<input style={input} type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><div style={{color:"#687068",marginTop:5}}>Uge {isoWeek(start)}</div><label style={label}>Sidste skoledag<input style={input} type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label><div style={{color:"#687068",marginTop:5}}>Uge {isoWeek(end)}</div></section><section style={card}><p className="eyebrow">BEREGNET</p><div style={{fontSize:54,fontWeight:800,color:"#294a3c"}}>{schoolDays}</div><h2 style={{marginTop:0}}>skoledage</h2><p style={{color:"#687068"}}>Hverdage i perioden minus de ferie- og lukkedage, du registrerer nedenfor.</p></section></div>
 <section style={{...card,marginTop:18}}><h2>Ferie- og lukkedage</h2><p style={{color:"#687068"}}>Tilføj en enkelt dag eller en hel periode. Weekender springes automatisk over, og ugenumre vises automatisk.</p><div style={{display:"grid",gridTemplateColumns:"160px 160px 1fr auto",gap:10,alignItems:"end"}}><label style={label}>Fra dato<input style={input} type="date" value={fromDate} onChange={e=>{setFromDate(e.target.value);if(!toDate)setToDate(e.target.value)}}/></label><label style={label}>Til dato<input style={input} type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></label><label style={label}>Navn<input style={input} placeholder="Fx Efterårsferie" value={newLabel} onChange={e=>setNewLabel(e.target.value)}/></label><button style={button} onClick={addPeriod}>+ Tilføj</button></div><div style={{marginTop:20}}>{periods.length===0?<p style={{color:"#8a8f89"}}>Ingen ferie- eller lukkedage registreret endnu.</p>:periods.map((p,i)=>{const first=p.dates[0],last=p.dates[p.dates.length-1];return <div key={p.label+first+i} style={{display:"flex",justifyContent:"space-between",gap:16,padding:"14px 0",borderBottom:"1px solid #e7e2d8"}}><span><strong>{p.label}</strong><br/><span style={{color:"#687068"}}>Uge {isoWeek(first)}{isoWeek(last)!==isoWeek(first)?`–${isoWeek(last)}`:""} · {daDate(first)}{last!==first?` – ${daDate(last)}`:""}</span></span><button onClick={()=>removePeriod(p.dates)} style={{border:0,background:"transparent",color:"#9b4b3f",cursor:"pointer"}}>Fjern</button></div>})}</div></section>
 <div style={{display:"flex",alignItems:"center",gap:16,marginTop:20}}><button style={button} onClick={save}>Gem skoleopsætning</button>{message&&<span>{message}</span>}</div></section></main>
}

const card:React.CSSProperties={background:"white",border:"1px solid #dedbd2",borderRadius:14,padding:24};
const label:React.CSSProperties={display:"grid",gap:7,fontWeight:700,marginTop:14};
const input:React.CSSProperties={padding:"12px 13px",border:"1px solid #cfcac0",borderRadius:8,fontSize:16,fontWeight:400,minWidth:0};
const button:React.CSSProperties={padding:"12px 18px",border:"1px solid #486b59",borderRadius:8,background:"#486b59",color:"white",fontWeight:700,cursor:"pointer",height:44};
