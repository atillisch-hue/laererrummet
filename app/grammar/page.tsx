"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const areas=[
 {icon:"Aa",title:"Ordklasser",text:"Navneord, udsagnsord, tillægsord, stedord, biord og de øvrige ordklasser.",topics:["Navneord","Udsagnsord","Tillægsord","Stedord","Biord"]},
 {icon:"S",title:"Sætninger",text:"Arbejd med hvordan sætninger er bygget op, og hvilken funktion ordene har.",topics:["Grundled og udsagnsled","Genstandsled","Omsagnsled","Hel- og ledsætninger"]},
 {icon:",",title:"Komma",text:"Træn komma med forklaringer, eksempler og opgaver i stigende sværhedsgrad.",topics:["Komma mellem helsætninger","Komma ved ledsætninger","Kommaøvelser"]},
 {icon:"✎",title:"Sprog der virker",text:"Fra grammatisk form til funktion og effekt i elevernes egne tekster.",topics:["Form → funktion → effekt","Præcise verber","Variation i sætninger","Sproglig effekt"]}
];
const levels=[
 {id:"basis",title:"Basis",text:"Genkend og forstå begreberne med tydelig støtte og korte opgaver."},
 {id:"traening",title:"Træning",text:"Brug grammatikken selvstændigt i sætninger og korte tekster."},
 {id:"udfordring",title:"Udfordring",text:"Forklar sproglige valg, find mønstre og arbejd med funktion og effekt."}
];
type ClassRow={id:number;name:string};

export default function GrammarPage(){
 const[ready,setReady]=useState(false),[selected,setSelected]=useState<number|null>(null),[topic,setTopic]=useState(""),[level,setLevel]=useState("traening"),[classes,setClasses]=useState<ClassRow[]>([]),[classId,setClassId]=useState<number|"">("");
 useEffect(()=>{(async()=>{const{data:s}=await supabase.auth.getSession();if(!s.session){window.location.href="/?teacher=1";return}const{data:c}=await supabase.from("classes").select("id,name").order("id");const rows=c||[];setClasses(rows);if(rows[0])setClassId(rows[0].id);setReady(true)})()},[]);
 const chooseArea=(i:number)=>{setSelected(selected===i?null:i);setTopic("")};
 if(!ready)return <main style={{padding:50}}>Åbner grammatik…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"42px 24px 80px"}}><section style={{maxWidth:1080,margin:"0 auto"}}>
  <a href="/?teacher=1" style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← Til lærerforsiden</a>
  <p className="eyebrow" style={{marginTop:38}}>GRAMMATIK</p><h1 style={{marginBottom:8}}>Sprog der virker</h1><p style={{fontSize:18,color:"#707670",maxWidth:760,lineHeight:1.55,marginTop:0}}>Vælg område, emne og niveau. Målet er, at eleverne både lærer formen, forstår funktionen og kan se effekten i rigtige tekster.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16,marginTop:34}}>{areas.map((a,i)=><button key={a.title} onClick={()=>chooseArea(i)} style={{background:selected===i?"#edf1ec":"white",border:selected===i?"2px solid #526b60":"1px solid #dfdcd4",borderRadius:15,padding:24,textAlign:"left",cursor:"pointer",minHeight:210}}><span style={{display:"grid",placeItems:"center",width:44,height:44,borderRadius:10,background:"#edf1ec",fontFamily:"Georgia,serif",fontWeight:800,fontSize:18,color:"#365044"}}>{a.icon}</span><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:24,marginTop:18,color:"#27352d"}}>{a.title}</strong><span style={{display:"block",color:"#727772",lineHeight:1.5,marginTop:8}}>{a.text}</span></button>)}</div>
  {selected!==null&&<div style={{marginTop:22,background:"white",border:"1px solid #dfdcd4",borderRadius:15,padding:26}}><p className="eyebrow">TRIN 1 · {areas[selected].title.toUpperCase()}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"6px 0 16px"}}>Vælg et emne</h2><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{areas[selected].topics.map(t=><button key={t} onClick={()=>setTopic(t)} style={{padding:"11px 14px",border:topic===t?"2px solid #526b60":"1px solid #d8d5cd",borderRadius:9,background:topic===t?"#edf1ec":"#fff",fontWeight:800,cursor:"pointer"}}>{t}</button>)}</div></div>}
  {topic&&<div style={{marginTop:18,background:"white",border:"1px solid #dfdcd4",borderRadius:15,padding:26}}><p className="eyebrow">TRIN 2 · NIVEAU</p><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"6px 0 6px"}}>{topic}</h2><p style={{color:"#777",marginTop:0}}>Vælg hvor meget støtte og sproglig udfordring opgaven skal have.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginTop:20}}>{levels.map(l=><button key={l.id} onClick={()=>setLevel(l.id)} style={{padding:18,textAlign:"left",borderRadius:12,border:level===l.id?"2px solid #526b60":"1px solid #ddd9d0",background:level===l.id?"#edf1ec":"#fff",cursor:"pointer"}}><strong style={{fontFamily:"Georgia,serif",fontSize:20}}>{l.title}</strong><span style={{display:"block",color:"#777",fontSize:13,lineHeight:1.45,marginTop:7}}>{l.text}</span></button>)}</div><div style={{marginTop:24,paddingTop:22,borderTop:"1px solid #ebe7de",display:"flex",gap:14,alignItems:"end",flexWrap:"wrap"}}><label style={{fontWeight:800,fontSize:13}}>Tildel til klasse<select value={classId} onChange={e=>setClassId(Number(e.target.value))} style={{display:"block",minWidth:230,marginTop:7,padding:"11px 12px",border:"1px solid #d8d5cd",borderRadius:8,background:"white"}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button onClick={()=>alert(`Næste byggeblok: ${topic} · ${levels.find(l=>l.id===level)?.title} til ${classes.find(c=>c.id===classId)?.name}. Her kobler jeg den rigtige opgavebank og elevresultater på.`)} style={{padding:"12px 18px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:800,cursor:"pointer"}}>Fortsæt til opgaver →</button></div></div>}
 </section></main>
}
