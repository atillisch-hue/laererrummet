"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

const modules=[
 {step:"1",title:"Min dag",text:"Se dagens lektioner og møder og åbn den konkrete time, du skal arbejde med.",href:"/noticeboard",status:"Klar til pilot"},
 {step:"2",title:"Kalender",text:"Se uge og skema og åbn en lektion direkte fra kalenderen.",href:"/calendar",status:"Klar til pilot"},
 {step:"3",title:"Forberedelse",text:"Planlæg lektioner, kobl materiale og fortsæt undervisningsarbejde.",href:"/preparation",status:"Klar til pilot"}
];

export default function TeacherDayPilot(){
 const[ready,setReady]=useState(false);
 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();
  const user=data.session?.user;
  if(!user){window.location.replace("/?teacher=1");return}
  if(!hasRole(user,"teacher")){window.location.replace(hasRole(user,"admin")||hasRole(user,"leader")?"/admin":"/teacher-room");return}
  setReady(true);
 })()},[]);
 if(!ready)return <main style={{padding:50}}>Åbner lærerpiloten…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"30px 32px"}}>
   <div style={{maxWidth:1040,margin:"0 auto"}}>
    <p style={{fontSize:11,fontWeight:900,letterSpacing:1.5,opacity:.7,margin:"0 0 6px"}}>RELEASE 0.1 · MEDARBEJDERPILOT</p>
    <h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"0 0 8px"}}>Lærerens arbejdsdag</h1>
    <p style={{maxWidth:720,margin:0,opacity:.82,lineHeight:1.5}}>Første afgrænsede del af Klasseværelset. Brug kun de tre spor nedenfor i denne pilot, så vi kan teste den daglige arbejdsgang uden at vente på resten af platformen.</p>
   </div>
  </header>
  <section style={{maxWidth:1040,margin:"0 auto",padding:"30px 24px 80px"}}>
   <div style={{padding:"14px 16px",borderRadius:12,background:"#eef2ed",border:"1px solid #d5ddd6",color:"#526159",marginBottom:18,lineHeight:1.5}}>
    <strong>Pilotgrænse:</strong> Min dag, Kalender og Forberedelse. Elev-/forældreflow, administration og øvrige moduler er ikke en del af Release 0.1.
   </div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}>
    {modules.map(m=><Link key={m.title} href={m.href} style={{display:"block",background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:22,textDecoration:"none",color:"inherit",minHeight:190}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}>
       <span style={{display:"grid",placeItems:"center",width:34,height:34,borderRadius:999,background:"#243d33",color:"white",fontWeight:900}}>{m.step}</span>
       <span style={{fontSize:10,fontWeight:900,padding:"5px 8px",borderRadius:999,background:"#e8efe9",color:"#486b59"}}>{m.status}</span>
      </div>
      <h2 style={{fontFamily:"Georgia,serif",fontSize:26,margin:"18px 0 7px"}}>{m.title}</h2>
      <p style={{color:"#6f746f",lineHeight:1.5,margin:0}}>{m.text}</p>
      <strong style={{display:"block",marginTop:18,color:"#486b59"}}>Åbn →</strong>
    </Link>)}
   </div>
   <section style={{marginTop:20,padding:"18px 20px",background:"#fff",border:"1px solid #ddd9d0",borderRadius:13}}>
    <strong>Sådan tester vi</strong>
    <p style={{color:"#6f746f",lineHeight:1.55,margin:"7px 0 0"}}>Brug piloten i en almindelig arbejdsdag. Notér kun ting, der stopper arbejdet, giver usikkerhed om hvor du skal klikke, eller kræver at du forlader Klasseværelset for at løse den samme opgave et andet sted.</p>
   </section>
  </section>
 </main>;
}
