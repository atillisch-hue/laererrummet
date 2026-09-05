"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
import ResumeWorkCard from "../ResumeWorkCard";
import PublishToSubjectRoom from "./PublishToSubjectRoom";
import LinkToLesson from "./LinkToLesson";
import ActiveSubjectUnits from "./ActiveSubjectUnits";

const areas=[
 {icon:"▤",title:"Forløb & årsplan",text:"Start eller fortsæt et digitalt undervisningsforløb og placer det i fagets årsplan.",href:"#forloeb"},
 {icon:"✎",title:"Opret opgave",text:"Byg en opgave til en klasse eller udvalgte elever og kobl den til det rigtige fag.",href:"/create-assignment"},
 {icon:"✓",title:"Grammatiktræning",text:"Tildel målrettet grammatik og sprogtræning med niveau og klassetrinsprogression.",href:"/grammar?mode=assign"},
 {icon:"◇",title:"Del i fagrum",text:"Lav opslag, links og materialer i et konkret fagrum, når eleverne skal kunne finde dem igen.",href:"#fagrum"},
 {icon:"↗",title:"Kobl til lektion",text:"Kobl din forberedelse til en konkret lektion, så den ligger klar dér, hvor undervisningen sker.",href:"#lektion"}
];
const quick={padding:"10px 13px",borderRadius:8,fontWeight:800 as const,textDecoration:"none",display:"inline-block"};

export default function Preparation(){
 const[ready,setReady]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{if(!data.session){window.location.href="/?teacher=1";return}setReady(true)})},[]);
 if(!ready)return <main style={{padding:50}}>Åbner Forberedelse…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",gap:14}}><span style={{display:"grid",placeItems:"center",width:46,height:46,borderRadius:12,background:"#dfa94f",color:"#243d33",fontSize:22}}>✦</span><div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:25}}>Forberedelse</strong><small style={{opacity:.75}}>Planlæg, byg og placer det undervisningsarbejde, du vil have samlet digitalt</small></div></div></header>
  <section style={{maxWidth:1120,margin:"0 auto",padding:"30px 28px 90px"}}>
   <div style={{background:"#eef2ed",border:"1px solid #d6ddd7",borderRadius:14,padding:"14px 16px",marginBottom:16,color:"#526159",lineHeight:1.5}}><strong>Du behøver ikke forberede alle timer her.</strong> Brug Forberedelse, når du vil gemme et forløb, lave en opgave, dele materiale eller koble noget til en konkret lektion.</div>
   <ResumeWorkCard/>
   <div style={{background:"white",border:"1px solid #dfdcd4",borderRadius:14,padding:"18px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:14,flexWrap:"wrap",marginTop:16}}><div><strong style={{fontFamily:"Georgia,serif",fontSize:21}}>Hurtige handlinger</strong><div style={{fontSize:13,color:"#727772",marginTop:3}}>De mest almindelige ting, du starter herfra.</div></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/create-assignment" style={{...quick,border:"1px solid #365044",background:"#365044",color:"white"}}>+ Ny opgave</Link><Link href="/grammar?mode=assign" style={{...quick,border:"1px solid #d8d5cd",background:"white",color:"#365044"}}>+ Grammatiktræning</Link><a href="#forloeb" style={{...quick,border:"1px solid #d8d5cd",background:"white",color:"#365044"}}>+ Nyt forløb</a></div></div>
   <ActiveSubjectUnits/>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:14,marginTop:18}}>{areas.map(a=><Link href={a.href} key={a.title} style={{background:"white",border:"1px solid #dfdcd4",borderRadius:14,padding:21,minHeight:150,textDecoration:"none",color:"inherit"}}><span style={{display:"grid",placeItems:"center",width:38,height:38,borderRadius:9,background:"#edf1ec",fontSize:18,color:"#365044"}}>{a.icon}</span><h2 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"14px 0 6px"}}>{a.title}</h2><p style={{color:"#727772",lineHeight:1.45,margin:0,fontSize:15}}>{a.text}</p><small style={{display:"inline-block",marginTop:13,fontWeight:800,color:"#365044"}}>Åbn →</small></Link>)}</div>
   <section id="fagrum" style={{scrollMarginTop:110}}><PublishToSubjectRoom/></section>
   <section id="lektion" style={{scrollMarginTop:110}}><LinkToLesson/></section>
   <section style={{marginTop:18,background:"#e8eee9",border:"1px solid #d4ddd6",borderRadius:14,padding:"20px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:15,flexWrap:"wrap"}}><div><p style={{fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#65766d",margin:"0 0 5px"}}>HURTIG SPROGTRÆNING</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:0}}>Tildel grammatik uden et forløb</h2><p style={{color:"#687068",margin:"6px 0 0",lineHeight:1.45}}>Skal en elev eller klasse lige træne fx komma, ordklasser eller sprogfælder, kan du tildele det direkte uden først at oprette et undervisningsforløb.</p></div><Link href="/grammar?mode=assign" style={{padding:"11px 16px",borderRadius:8,background:"#365044",color:"white",fontWeight:900,textDecoration:"none",whiteSpace:"nowrap"}}>Vælg grammatiktræning →</Link></div></section>
  </section>
 </main>;
}
