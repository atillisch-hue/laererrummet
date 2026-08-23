"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

const areas=[
 {icon:"▤",title:"Undervisningsforløb",text:"Planlæg forløb med mål, tekster, aktiviteter og produkter."},
 {icon:"✎",title:"Opgaver",text:"Byg opgaver til lektioner, afleveringer eller træning."},
 {icon:"◇",title:"Materialer",text:"Saml og genbrug tekster, arbejdsark og undervisningsmaterialer."},
 {icon:"◎",title:"Differentiering",text:"Lav flere veje ind i det samme faglige stof og tilpas støtten til eleverne."},
 {icon:"◫",title:"Årsplan",text:"Skab overblik over fagets forløb gennem skoleåret."},
 {icon:"✓",title:"Evaluering",text:"Forbered feedback, kriterier og evaluering."}
];
const nav=(active=false)=>({color:active?"#243d33":"white",textDecoration:"none",fontWeight:800 as const,padding:"10px 14px",border:active?"1px solid #dfa94f":"1px solid rgba(255,255,255,.22)",background:active?"#dfa94f":"transparent",borderRadius:9});
export default function Preparation(){
 const[ready,setReady]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{if(!data.session){window.location.href="/?teacher=1";return}setReady(true)})},[]);
 if(!ready)return <main style={{padding:50}}>Åbner Forberedelsen…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"22px 32px"}}><div style={{maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:14}}><span style={{display:"grid",placeItems:"center",width:46,height:46,borderRadius:12,background:"#dfa94f",color:"#243d33",fontSize:22}}>✦</span><div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:25}}>Forberedelsen</strong><small style={{opacity:.75}}>Planlægning, materialer og undervisningsdesign</small></div></div><nav style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/noticeboard" style={nav()}>Opslagstavlen</Link><Link href="/teacher-dashboard" style={nav()}>Klasseværelset</Link><Link href="/teacher-room" style={nav()}>Lærerværelset</Link><span style={nav(true)}>Forberedelsen</span></nav></div></header>
  <section style={{maxWidth:1120,margin:"0 auto",padding:"30px 28px 90px"}}>
   <div style={{background:"white",border:"1px solid #dfdcd4",borderRadius:14,padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}><div><strong style={{fontFamily:"Georgia,serif",fontSize:21}}>Hurtige handlinger</strong><div style={{fontSize:13,color:"#727772",marginTop:3}}>Når du bare skal have noget ud til eleverne med det samme.</div></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button style={{padding:"10px 13px",borderRadius:8,border:"1px solid #365044",background:"#365044",color:"white",fontWeight:800,cursor:"pointer"}}>+ Tildel træningsopgave</button><button style={{padding:"10px 13px",borderRadius:8,border:"1px solid #d8d5cd",background:"white",color:"#365044",fontWeight:800,cursor:"pointer"}}>+ Ny opgave</button><button style={{padding:"10px 13px",borderRadius:8,border:"1px solid #d8d5cd",background:"white",color:"#365044",fontWeight:800,cursor:"pointer"}}>+ Nyt forløb</button></div></div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:14,marginTop:18}}>{areas.map(a=><article key={a.title} style={{background:"white",border:"1px solid #dfdcd4",borderRadius:14,padding:21,minHeight:150}}><span style={{display:"grid",placeItems:"center",width:38,height:38,borderRadius:9,background:"#edf1ec",fontSize:18,color:"#365044"}}>{a.icon}</span><h2 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"14px 0 6px"}}>{a.title}</h2><p style={{color:"#727772",lineHeight:1.45,margin:0,fontSize:15}}>{a.text}</p><small style={{display:"inline-block",marginTop:13,fontWeight:800,color:"#9a8156"}}>Klar til at blive bygget</small></article>)}</div>
   <section style={{marginTop:18,background:"#e8eee9",border:"1px solid #d4ddd6",borderRadius:14,padding:"20px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:15,flexWrap:"wrap"}}><div><p style={{fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#65766d",margin:"0 0 5px"}}>SPONTAN TRÆNING</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:0}}>Tildel noget nu</h2><p style={{color:"#687068",margin:"6px 0 0",lineHeight:1.45}}>Skal en elev eller klasse lige træne komma, ordklasser, læsning eller noget helt andet? Det behøver ikke ligge i et planlagt forløb.</p></div><button style={{padding:"11px 16px",borderRadius:8,border:0,background:"#365044",color:"white",fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>Vælg træningsopgave →</button></div></section>
  </section>
 </main>
}
