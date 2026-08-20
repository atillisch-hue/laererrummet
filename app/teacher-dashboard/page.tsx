"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

const subjects=["Dansk","Matematik","Engelsk","Tysk","Historie","Samfundsfag","Naturfag"];
const danish=[
 {title:"Opgaver",text:"Opret og administrér skriftlige opgaver og skrivehjælp.",href:"/create-assignment",icon:"✎"},
 {title:"Grammatik",text:"Ordklasser, sætninger, komma og Sprog der virker.",href:"/grammar",icon:"Aa"},
 {title:"Elevbesvarelser",text:"Følg elevernes arbejde og se deres besvarelser.",href:"/teacher-overview",icon:"✓"},
 {title:"Skriftlighed",text:"Genrer, skabeloner og støtte til elevernes skriveproces.",href:"/create-assignment",icon:"▤"},
 {title:"Forløb",text:"Saml undervisningsforløb, tekster og opgaver ét sted.",href:"#",icon:"◇",soon:true},
 {title:"Læsning",text:"Læsestrategier, tekstforståelse og faglig læsning.",href:"#",icon:"◫",soon:true}
];
export default function TeacherDashboard(){
 const[active,setActive]=useState("Dansk"),[email,setEmail]=useState("");
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{if(!data.session){window.location.href="/?teacher=1";return}setEmail(data.session.user.email||"")})},[]);
 const logout=async()=>{await supabase.auth.signOut();window.location.href="/"};
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#fff",borderBottom:"1px solid #dedbd3",padding:"18px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}>
   <Link href="/?teacher=1" style={{textDecoration:"none",color:"inherit",display:"flex",alignItems:"center",gap:12}}><span style={{fontSize:24}}>✦</span><div><strong style={{fontFamily:"Georgia,serif",fontSize:22}}>Klasseværelset</strong><small style={{display:"block",color:"#7b827e"}}>Lærerens forside</small></div></Link>
   <div style={{display:"flex",alignItems:"center",gap:14}}><small style={{color:"#777"}}>{email}</small><button onClick={logout} style={{border:"1px solid #d8d5cd",background:"white",borderRadius:8,padding:"9px 13px",cursor:"pointer"}}>Log ud</button></div>
  </header>
  <section style={{maxWidth:1180,margin:"0 auto",padding:"42px 24px 80px"}}>
   <p style={{fontSize:11,fontWeight:800,letterSpacing:1.7,color:"#718077"}}>LÆRERFORSIDE</p><h1 style={{fontFamily:"Georgia,serif",fontSize:44,margin:"8px 0"}}>Dit Klasseværelse</h1><p style={{fontSize:18,color:"#707670",marginTop:8}}>Vælg elever eller det fag, du vil arbejde med.</p>
   <nav style={{display:"flex",gap:8,flexWrap:"wrap",margin:"30px 0 38px",paddingBottom:16,borderBottom:"1px solid #d9d5cd"}}>
    <Link href="/students" style={{padding:"11px 17px",borderRadius:9,textDecoration:"none",fontWeight:800,color:"#365044",background:"#fff",border:"1px solid #d8d5cd"}}>Elever</Link>
    {subjects.map(s=><button key={s} onClick={()=>setActive(s)} style={{padding:"11px 17px",borderRadius:9,border:active===s?"1px solid #365044":"1px solid #d8d5cd",background:active===s?"#365044":"#fff",color:active===s?"#fff":"#365044",fontWeight:800,cursor:"pointer"}}>{s}</button>)}
    <button style={{padding:"11px 17px",borderRadius:9,border:"1px dashed #aaa69e",background:"transparent",color:"#6d736f",fontWeight:700}}>+ Administrer fag</button>
   </nav>
   {active==="Dansk"?<><div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:20,flexWrap:"wrap",marginBottom:20}}><div><p style={{fontSize:11,fontWeight:800,letterSpacing:1.5,color:"#718077",margin:0}}>FAGRUM</p><h2 style={{fontFamily:"Georgia,serif",fontSize:32,margin:"6px 0"}}>Dansk</h2><p style={{color:"#707670",margin:0}}>Undervisning, opgaver og elevresultater samlet i dansk.</p></div></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:16}}>{danish.map(x=>x.soon?<article key={x.title} style={{background:"#eeece6",border:"1px solid #ddd9d0",borderRadius:14,padding:24,opacity:.72}}><div style={{fontSize:25}}>{x.icon}</div><h3 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"14px 0 8px"}}>{x.title}</h3><p style={{lineHeight:1.55,color:"#707670"}}>{x.text}</p><small style={{fontWeight:800,letterSpacing:1,color:"#718077"}}>KOMMER SENERE</small></article>:<Link key={x.title} href={x.href} style={{background:"#fff",border:"1px solid #ddd9d0",borderRadius:14,padding:24,textDecoration:"none",color:"inherit",display:"block"}}><div style={{fontSize:25}}>{x.icon}</div><h3 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"14px 0 8px"}}>{x.title}</h3><p style={{lineHeight:1.55,color:"#707670"}}>{x.text}</p><strong style={{color:"#526b60"}}>Åbn →</strong></Link>)}</div></>:<div style={{background:"#fff",border:"1px solid #ddd9d0",borderRadius:16,padding:"38px 32px"}}><p style={{fontSize:11,fontWeight:800,letterSpacing:1.5,color:"#718077"}}>FAGRUM</p><h2 style={{fontFamily:"Georgia,serif",fontSize:32,margin:"8px 0"}}>{active}</h2><p style={{fontSize:17,color:"#707670",maxWidth:650,lineHeight:1.6}}>Fagrummet er gjort klar i strukturen. Vi bygger funktionerne her, når {active.toLowerCase()} skal udvides — uden at blande dem sammen med dansk.</p></div>}
  </section>
 </main>
}
