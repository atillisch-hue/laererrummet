"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
import PublishToSubjectRoom from "./PublishToSubjectRoom";
import LinkToLesson from "./LinkToLesson";

const areas=[
 {icon:"▤",title:"Undervisningsforløb",text:"Planlæg forløb med mål, tekster, aktiviteter og produkter.",href:"#forloeb"},
 {icon:"✎",title:"Opgaver",text:"Byg opgaver til lektioner, afleveringer eller træning.",href:"/create-assignment"},
 {icon:"◇",title:"Materialer",text:"Saml og genbrug tekster, arbejdsark og undervisningsmaterialer.",href:"#materialer"},
 {icon:"◎",title:"Differentiering",text:"Lav flere veje ind i det samme faglige stof og tilpas støtten til eleverne.",href:"#differentiering"},
 {icon:"◫",title:"Årsplan",text:"Skab overblik over fagets forløb gennem skoleåret.",href:"#aarsplan"},
 {icon:"✓",title:"Evaluering",text:"Forbered feedback, kriterier og evaluering.",href:"#evaluering"}
];
const quick={padding:"10px 13px",borderRadius:8,fontWeight:800 as const,textDecoration:"none",display:"inline-block"};

export default function Preparation(){
 const[ready,setReady]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{if(!data.session){window.location.href="/?teacher=1";return}setReady(true)})},[]);
 if(!ready)return <main style={{padding:50}}>Åbner Forberedelsen…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}>
   <div style={{maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",gap:14}}>
    <span style={{display:"grid",placeItems:"center",width:46,height:46,borderRadius:12,background:"#dfa94f",color:"#243d33",fontSize:22}}>✦</span>
    <div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:25}}>Forberedelsen</strong><small style={{opacity:.75}}>Planlægning, materialer og undervisningsdesign</small></div>
   </div>
  </header>
  <section style={{maxWidth:1120,margin:"0 auto",padding:"30px 28px 90px"}}>
   <div style={{background:"white",border:"1px solid #dfdcd4",borderRadius:14,padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap"}}>
    <div><strong style={{fontFamily:"Georgia,serif",fontSize:21}}>Hurtige handlinger</strong><div style={{fontSize:13,color:"#727772",marginTop:3}}>Når du bare skal have noget ud til eleverne med det samme.</div></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
     <Link href="/grammar?mode=assign" style={{...quick,border:"1px solid #365044",background:"#365044",color:"white"}}>+ Tildel træningsopgave</Link>
     <Link href="/create-assignment" style={{...quick,border:"1px solid #d8d5cd",background:"white",color:"#365044"}}>+ Ny opgave</Link>
     <a href="#forloeb" style={{...quick,border:"1px solid #d8d5cd",background:"white",color:"#365044"}}>+ Nyt forløb</a>
    </div>
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:14,marginTop:18}}>
    {areas.map(a=><Link id={a.title==="Undervisningsforløb"?"forloeb":undefined} href={a.href} key={a.title} style={{background:"white",border:"1px solid #dfdcd4",borderRadius:14,padding:21,minHeight:150,textDecoration:"none",color:"inherit"}}>
     <span style={{display:"grid",placeItems:"center",width:38,height:38,borderRadius:9,background:"#edf1ec",fontSize:18,color:"#365044"}}>{a.icon}</span>
     <h2 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"14px 0 6px"}}>{a.title}</h2>
     <p style={{color:"#727772",lineHeight:1.45,margin:0,fontSize:15}}>{a.text}</p>
     <small style={{display:"inline-block",marginTop:13,fontWeight:800,color:a.title==="Opgaver"?"#365044":"#9a8156"}}>{a.title==="Opgaver"?"Åbn →":"Klar til at blive bygget"}</small>
    </Link>)}
   </div>

   <PublishToSubjectRoom/>
   <LinkToLesson/>

   <section style={{marginTop:18,background:"#e8eee9",border:"1px solid #d4ddd6",borderRadius:14,padding:"20px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:15,flexWrap:"wrap"}}>
     <div><p style={{fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#65766d",margin:"0 0 5px"}}>SPONTAN TRÆNING</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:0}}>Tildel noget nu</h2><p style={{color:"#687068",margin:"6px 0 0",lineHeight:1.45}}>Skal en elev eller klasse lige træne komma, ordklasser, læsning eller noget helt andet? Det behøver ikke ligge i et planlagt forløb.</p></div>
     <Link href="/grammar?mode=assign" style={{padding:"11px 16px",borderRadius:8,background:"#365044",color:"white",fontWeight:900,textDecoration:"none",whiteSpace:"nowrap"}}>Vælg træningsopgave →</Link>
    </div>
   </section>
  </section>
 </main>
}
