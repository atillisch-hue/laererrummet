"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

const areas=[
 {icon:"✎",title:"Opgavegenerator",text:"Byg opgaver til fag, klassetrin og forskellige niveauer."},
 {icon:"▤",title:"Undervisningsforløb",text:"Planlæg forløb med mål, tekster, aktiviteter og produkter."},
 {icon:"◇",title:"Materialer",text:"Saml og genbrug tekster, arbejdsark og undervisningsmaterialer."},
 {icon:"◎",title:"Differentiering",text:"Lav flere veje ind i det samme faglige stof og tilpas støtten til eleverne."},
 {icon:"◫",title:"Årsplan",text:"Skab overblik over fagets forløb og placér dem gennem skoleåret."},
 {icon:"✓",title:"Evaluering",text:"Forbered feedback, kriterier, rubrics og evaluering af undervisningen."}
];
export default function Preparation(){
 const[ready,setReady]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{if(!data.session){window.location.href="/?teacher=1";return}setReady(true)})},[]);
 if(!ready)return <main style={{padding:50}}>Åbner Forberedelsen…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"22px 32px"}}><div style={{maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:14}}><span style={{display:"grid",placeItems:"center",width:46,height:46,borderRadius:12,background:"#dfa94f",color:"#243d33",fontSize:22}}>✦</span><div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:25}}>Forberedelsen</strong><small style={{opacity:.75}}>Planlægning, materialer og undervisningsdesign</small></div></div><nav style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/teacher-dashboard" style={{color:"white",textDecoration:"none",fontWeight:800,padding:"10px 14px",border:"1px solid rgba(255,255,255,.22)",borderRadius:9}}>Klasseværelset</Link><Link href="/teacher-room" style={{color:"white",textDecoration:"none",fontWeight:800,padding:"10px 14px",border:"1px solid rgba(255,255,255,.22)",borderRadius:9}}>Lærerværelset</Link><span style={{fontWeight:800,padding:"10px 14px",background:"#dfa94f",color:"#243d33",borderRadius:9}}>Forberedelsen</span></nav></div></header>
  <section style={{maxWidth:1120,margin:"0 auto",padding:"56px 28px 90px"}}><p style={{fontSize:11,fontWeight:800,letterSpacing:1.6,color:"#718077"}}>LÆRERENS FORBEREDELSESRUM</p><h1 style={{fontFamily:"Georgia,serif",fontSize:44,maxWidth:760,margin:"8px 0 10px"}}>Fra idé til undervisning</h1><p style={{fontSize:18,color:"#6f746f",maxWidth:760,lineHeight:1.6,marginTop:0}}>Her samler vi det arbejde, der ligger før undervisningen: idéudvikling, planlægning, materialer, differentiering og evaluering.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:16,marginTop:38}}>{areas.map(a=><article key={a.title} style={{background:"white",border:"1px solid #dfdcd4",borderRadius:15,padding:25,minHeight:190}}><span style={{display:"grid",placeItems:"center",width:42,height:42,borderRadius:10,background:"#edf1ec",fontSize:20,color:"#365044"}}>{a.icon}</span><h2 style={{fontFamily:"Georgia,serif",fontSize:24,margin:"20px 0 8px"}}>{a.title}</h2><p style={{color:"#727772",lineHeight:1.5,margin:0}}>{a.text}</p><small style={{display:"inline-block",marginTop:18,fontWeight:800,color:"#9a8156"}}>Klar til at blive bygget</small></article>)}</div></section>
 </main>
}
