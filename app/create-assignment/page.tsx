"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const templates={
  "Debatindlæg":["Overskrift","Indledning: Hvad debatterer du?","Din tydelige holdning","Argument 1 + eksempel","Argument 2 + eksempel","Modargument og svar","Afrunding: Hvad bør der ske?"],
  "Artikel":["Rubrik","Manchet","Indledning: Hvem, hvad, hvor?","Brødtekst med mellemoverskrifter","Citater eller kilder","Afrunding"],
  "Essay":["En åbning, der vækker nysgerrighed","En konkret oplevelse eller situation","Undren og refleksion","Flere perspektiver","En åben eller eftertænksom afslutning"],
  "Fortælling":["Anslag","Personer og miljø","Konflikt","Vendepunkt","Afslutning"]
};
type Type=keyof typeof templates;
type ClassRow={id:number;name:string};

export default function CreateAssignment(){
 const[ready,setReady]=useState(false),[classes,setClasses]=useState<ClassRow[]>([]),[classId,setClassId]=useState<number|"">(""),[title,setTitle]=useState(""),[type,setType]=useState<Type>("Debatindlæg"),[saving,setSaving]=useState(false);
 useEffect(()=>{(async()=>{const{data:s}=await supabase.auth.getSession();if(!s.session){window.location.href="/?teacher=1";return}const{data}=await supabase.from("classes").select("id,name").order("id");const rows=data||[];setClasses(rows);if(rows[0])setClassId(rows[0].id);setReady(true)})()},[]);
 async function create(){if(!title.trim()||!classId)return;setSaving(true);const{error}=await supabase.from("assignments").insert({title:title.trim(),type,class_id:classId});setSaving(false);if(error)return alert(error.message);window.location.href="/?teacher=1"}
 if(!ready)return <main style={{padding:50,fontFamily:"Arial"}}>Henter Klasseværelset…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"42px 24px 80px"}}><section style={{maxWidth:920,margin:"0 auto"}}>
  <a href="/?teacher=1" style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← Til lærerforsiden</a>
  <p className="eyebrow" style={{marginTop:38}}>OPRET OPGAVE</p><h1 style={{marginBottom:8}}>Hvad skal eleverne skrive?</h1><p style={{color:"#777",marginTop:0}}>Vælg en opgavetype. Klasseværelset giver automatisk eleven den relevante skriveplan.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,margin:"28px 0"}}>{(Object.keys(templates) as Type[]).map(t=><button key={t} onClick={()=>setType(t)} style={{textAlign:"left",padding:20,borderRadius:13,border:type===t?"2px solid #526b60":"1px solid #dedbd3",background:type===t?"#edf1ec":"white",cursor:"pointer"}}><strong style={{fontFamily:"Georgia,serif",fontSize:19}}>{t}</strong><span style={{display:"block",fontSize:12,color:"#777",marginTop:7}}>{templates[t].length} trin i skriveplanen</span></button>)}</div>
  <div className="card" style={{maxWidth:680,margin:"0 auto",padding:28}}><label style={{display:"block",fontWeight:800,fontSize:13}}>Klasse<select value={classId} onChange={e=>setClassId(Number(e.target.value))} style={{display:"block",width:"100%",marginTop:8,padding:12,border:"1px solid #d8d5cd",borderRadius:8}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label style={{display:"block",fontWeight:800,fontSize:13,marginTop:18}}>Titel på opgaven<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Fx Debatindlæg om kunstig intelligens" style={{display:"block",width:"100%",marginTop:8,padding:12,border:"1px solid #d8d5cd",borderRadius:8}}/></label>
  <div className="template" style={{marginTop:22}}><h3>Automatisk skrivehjælp · {type}</h3><p>Eleven får disse trin:</p>{templates[type].map((x,i)=><div key={x}><span>{i+1}</span>{x}</div>)}</div>
  <button className="primary" disabled={saving||!title.trim()||!classId} onClick={create}>{saving?"Opretter…":"Opret opgave →"}</button></div>
 </section></main>
}
