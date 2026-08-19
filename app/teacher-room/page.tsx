"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const areas=[
 {icon:"▦",title:"Kalender",text:"Fælles kalender til møder, aftaler og skolens aktiviteter."},
 {icon:"▤",title:"Skema",text:"Saml undervisning og medarbejdernes skemaer ét sted."},
 {icon:"◎",title:"Booking",text:"Find en ledig kollega og book tid uden frem-og-tilbage-beskeder."},
 {icon:"◷",title:"Arbejdstid",text:"Registrér møder, forberedelse og øvrig arbejdstid."}
];

export default function TeacherRoom(){
 const[ready,setReady]=useState(false),[email,setEmail]=useState("");
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session){window.location.href="/?teacher=1";return}setEmail(data.session.user.email||"");setReady(true)})()},[]);
 if(!ready)return <main style={{padding:50}}>Åbner Lærerværelset…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee"}}><header style={{background:"#243d33",color:"white",padding:"22px 32px"}}><div style={{maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20}}><div style={{display:"flex",alignItems:"center",gap:14}}><span style={{display:"grid",placeItems:"center",width:46,height:46,borderRadius:12,background:"#dfa94f",color:"#243d33",fontSize:22}}>✦</span><div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:25}}>Lærerværelset</strong><small style={{opacity:.75}}>Samarbejde, kalender og arbejdstid</small></div></div><a href="/?teacher=1" style={{color:"white",textDecoration:"none",fontWeight:800,padding:"10px 14px",border:"1px solid rgba(255,255,255,.22)",borderRadius:9}}>Klasseværelset →</a></div></header><section style={{maxWidth:1120,margin:"0 auto",padding:"56px 28px 90px"}}><p className="eyebrow">LÆRERNES ARBEJDSRUM</p><h1 style={{maxWidth:720,marginBottom:10}}>Velkommen på Lærerværelset</h1><p style={{fontSize:18,color:"#6f746f",maxWidth:720,lineHeight:1.6,marginTop:0}}>Her samler vi det, der foregår mellem lærerne – adskilt fra elever, opgaver og undervisningsmaterialer i Klasseværelset.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16,marginTop:38}}>{areas.map(a=><div key={a.title} style={{background:"white",border:"1px solid #dfdcd4",borderRadius:15,padding:25,minHeight:185}}><span style={{display:"grid",placeItems:"center",width:42,height:42,borderRadius:10,background:"#edf1ec",fontSize:20,color:"#365044"}}>{a.icon}</span><h2 style={{fontFamily:"Georgia,serif",fontSize:24,margin:"20px 0 8px"}}>{a.title}</h2><p style={{color:"#727772",lineHeight:1.5,margin:0}}>{a.text}</p><small style={{display:"inline-block",marginTop:18,fontWeight:800,color:"#9a8156"}}>Kommer som næste modul</small></div>)}</div><div style={{marginTop:32,padding:"20px 22px",borderRadius:12,background:"#ebe7dc",color:"#4d574f"}}><strong>Logget ind som lærer</strong><span style={{marginLeft:10}}>{email}</span></div></section></main>
}