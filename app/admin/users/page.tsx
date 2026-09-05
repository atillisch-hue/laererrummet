"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20,textDecoration:"none",color:"#26342e",display:"block"};

export default function AdminUsersLegacyPage(){
 const[ready,setReady]=useState(false);
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();const user=data.session?.user;if(!user||!hasRole(user,"admin")){location.replace("/");return}setReady(true)})()},[]);
 if(!ready)return <main style={{padding:50}}>Åbner administration…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#486b59",color:"white",padding:"20px 6vw"}}><div style={{maxWidth:1050,margin:"auto"}}><small style={{fontWeight:900,letterSpacing:1.3}}>ADMINISTRATION</small><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"5px 0"}}>Personer, klasser & adgang</h1><p style={{margin:0,opacity:.82}}>Funktionerne er nu delt efter den opgave, du vil løse.</p></div></header>
  <section style={{maxWidth:1050,margin:"auto",padding:"34px 24px 80px"}}>
   <div style={{padding:"13px 14px",background:"#eef2ed",border:"1px solid #d7dfd8",borderRadius:10,color:"#526159",lineHeight:1.5}}><strong>Denne gamle samlede administrationsside er ryddet op.</strong> Vælg området nedenfor. Personen eller eleven findes stadig kun ét sted i systemet; det er kun arbejdsfladerne, der er adskilt.</div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:13,marginTop:18}}>
    <Link href="/admin/people" style={card}><small style={eyebrow}>LOGIN & ROLLER</small><h2 style={title}>Personer & adgang</h2><p style={text}>Konti, roller, aktiv/inaktiv adgang og forælder↔barn-relationer.</p><strong style={action}>Åbn →</strong></Link>
    <Link href="/admin/staff" style={card}><small style={eyebrow}>MEDARBEJDERE</small><h2 style={title}>Personaleprofiler</h2><p style={text}>Navn, forkortelse, personalegruppe og medarbejderens aktive status.</p><strong style={action}>Åbn →</strong></Link>
    <Link href="/admin/classes-students" style={card}><small style={eyebrow}>GRUNDSTRUKTUR</small><h2 style={title}>Klasser & elever</h2><p style={text}>Opret klasser og elever, flyt elever og administrér sikre elevkoder.</p><strong style={action}>Åbn →</strong></Link>
    <Link href="/admin/teacher-classes" style={card}><small style={eyebrow}>UNDERVISNING</small><h2 style={title}>Lærere & klasser</h2><p style={text}>Tilknyt lærere til de klasser, de faktisk underviser i.</p><strong style={action}>Åbn →</strong></Link>
   </div>
   <Link href="/admin" style={{display:"inline-block",marginTop:22,color:"#486b59",fontWeight:850,textDecoration:"none"}}>← Til administrationens oversigt</Link>
  </section>
 </main>;
}

const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.2,color:"#718077"};
const title:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:23,margin:"7px 0 6px"};
const text:React.CSSProperties={color:"#687068",lineHeight:1.5,minHeight:64,margin:"0 0 12px"};
const action:React.CSSProperties={color:"#486b59",fontSize:13};