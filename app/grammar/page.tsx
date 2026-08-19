"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const areas=[
 {icon:"Aa",title:"Ordklasser",text:"Navneord, udsagnsord, tillægsord, stedord, biord og de øvrige ordklasser.",topics:["Navneord","Udsagnsord","Tillægsord","Stedord","Biord"]},
 {icon:"S",title:"Sætninger",text:"Arbejd med hvordan sætninger er bygget op, og hvilken funktion ordene har.",topics:["Grundled og udsagnsled","Genstandsled","Omsagnsled","Hel- og ledsætninger"]},
 {icon:",",title:"Komma",text:"Træn komma med forklaringer, eksempler og opgaver i stigende sværhedsgrad.",topics:["Komma mellem helsætninger","Komma ved ledsætninger","Kommaøvelser"]},
 {icon:"✎",title:"Sprog der virker",text:"Fra grammatisk form til funktion og effekt i elevernes egne tekster.",topics:["Form → funktion → effekt","Præcise verber","Variation i sætninger","Sproglig effekt"]}
];

export default function GrammarPage(){
 const[ready,setReady]=useState(false);const[selected,setSelected]=useState<number|null>(null);
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session){window.location.href="/?teacher=1";return}setReady(true)})()},[]);
 if(!ready)return <main style={{padding:50}}>Åbner grammatik…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"42px 24px 80px"}}><section style={{maxWidth:1080,margin:"0 auto"}}>
  <a href="/?teacher=1" style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← Til lærerforsiden</a>
  <p className="eyebrow" style={{marginTop:38}}>GRAMMATIK</p><h1 style={{marginBottom:8}}>Sprog der virker</h1><p style={{fontSize:18,color:"#707670",maxWidth:720,lineHeight:1.55,marginTop:0}}>Vælg et grammatisk område. Herfra skal du kunne vælge niveau, opgaver og sende træningen direkte til en klasse eller enkelte elever.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16,marginTop:34}}>{areas.map((a,i)=><button key={a.title} onClick={()=>setSelected(selected===i?null:i)} style={{background:selected===i?"#edf1ec":"white",border:selected===i?"2px solid #526b60":"1px solid #dfdcd4",borderRadius:15,padding:24,textAlign:"left",cursor:"pointer",minHeight:210}}><span style={{display:"grid",placeItems:"center",width:44,height:44,borderRadius:10,background:"#edf1ec",fontFamily:"Georgia,serif",fontWeight:800,fontSize:18,color:"#365044"}}>{a.icon}</span><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:24,marginTop:18,color:"#27352d"}}>{a.title}</strong><span style={{display:"block",color:"#727772",lineHeight:1.5,marginTop:8}}>{a.text}</span></button>)}</div>
  {selected!==null&&<div style={{marginTop:22,background:"white",border:"1px solid #dfdcd4",borderRadius:15,padding:26}}><p className="eyebrow">{areas[selected].title.toUpperCase()}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"6px 0 16px"}}>Vælg et emne</h2><div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{areas[selected].topics.map(t=><button key={t} onClick={()=>alert(`${t} bliver næste trin i grammatikmodulet.`)} style={{padding:"11px 14px",border:"1px solid #d8d5cd",borderRadius:9,background:"#fff",fontWeight:800,cursor:"pointer"}}>{t} →</button>)}</div><p style={{color:"#888",fontSize:13,marginTop:20,marginBottom:0}}>Næste trin: niveauvalg, opgavebank, tildeling til elever og automatisk resultatoversigt.</p></div>}
 </section></main>
}
