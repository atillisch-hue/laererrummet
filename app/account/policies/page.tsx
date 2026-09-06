"use client";

import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";

type RequiredPolicy={
 school_id:number;
 policy_version_id:number;
 policy_key:string;
 version_label:string;
 title:string;
 summary:string|null;
 acknowledgement_text:string;
 body_markdown:string;
 effective_from:string;
};

const shell:React.CSSProperties={maxWidth:760,margin:"0 auto",padding:"42px 24px 80px"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};
const button:React.CSSProperties={border:0,borderRadius:8,padding:"11px 15px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};

function safeNext(){
 if(typeof window==="undefined")return "/";
 const value=new URLSearchParams(window.location.search).get("next")||"/";
 return value.startsWith("/")&&!value.startsWith("//")?value:"/";
}

export default function PolicyAcknowledgementsPage(){
 const[ready,setReady]=useState(false),[items,setItems]=useState<RequiredPolicy[]>([]),[busyId,setBusyId]=useState<number|null>(null),[error,setError]=useState("");
 const next=safeNext();

 async function load(){
  setError("");
  const{data:session}=await supabase.auth.getSession();
  if(!session.session){location.replace("/");return}
  const{data,error}=await supabase.rpc("my_required_policy_acknowledgements");
  if(error){setError("Informationen kunne ikke hentes. Prøv igen.");setReady(true);return}
  setItems((data||[]) as RequiredPolicy[]);setReady(true);
 }

 useEffect(()=>{load()},[]);

 async function acknowledge(id:number){
  setBusyId(id);setError("");
  const{error}=await supabase.rpc("acknowledge_policy",{p_policy_version_id:id});
  if(error){setError("Bekræftelsen kunne ikke gemmes. Prøv igen.");setBusyId(null);return}
  await load();setBusyId(null);
 }

 if(!ready)return <main style={shell}>Henter information…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}><section style={shell}>
  <p style={{fontSize:10,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0}}>KONTO · INFORMATION</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"7px 0 8px"}}>Information & vilkår</h1>
  <p style={{color:"#657068",lineHeight:1.6,margin:"0 0 20px"}}>Her kan Klasseværelset vise nye versioner af brugsvilkår, privatlivsinformation og information om sikkerhedslogning. Din bekræftelse dokumenterer, at informationen er blevet vist og læst. Den er ikke automatisk et GDPR-samtykke til behandling, som skolen har et andet lovligt grundlag for.</p>

  {error&&<div style={{...card,background:"#fff0ed",color:"#7b3b32",fontWeight:800,marginBottom:14}}>{error}</div>}

  {items.length===0?<section style={{...card,background:"#e9eee9"}}><strong>✓ Du mangler ikke at læse nye versioner</strong><p style={{margin:"7px 0 14px",color:"#59655e",lineHeight:1.5}}>Der er ingen publicerede informationer eller vilkår, som kræver din bekræftelse lige nu.</p>{next!=="/"&&<button onClick={()=>location.href=next} style={button}>Fortsæt →</button>}</section>:
   <div style={{display:"grid",gap:14}}>{items.map(item=><article key={item.policy_version_id} style={card}>
    <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start",flexWrap:"wrap"}}><div><small style={{fontWeight:900,color:"#718077",letterSpacing:.8}}>{item.version_label}</small><h2 style={{fontFamily:"Georgia,serif",fontSize:26,margin:"5px 0 4px"}}>{item.title}</h2></div><span style={{fontSize:11,fontWeight:900,borderRadius:999,padding:"5px 8px",background:"#fff3df",color:"#7a5a24"}}>SKAL LÆSES</span></div>
    {item.summary&&<p style={{color:"#657068",lineHeight:1.55}}>{item.summary}</p>}
    <div style={{whiteSpace:"pre-wrap",lineHeight:1.65,fontSize:14,borderTop:"1px solid #ece8df",borderBottom:"1px solid #ece8df",padding:"16px 0",margin:"14px 0"}}>{item.body_markdown}</div>
    <p style={{fontWeight:800,lineHeight:1.5}}>{item.acknowledgement_text}</p>
    <button onClick={()=>acknowledge(item.policy_version_id)} disabled={busyId!==null} style={{...button,opacity:busyId!==null?.6:1}}>{busyId===item.policy_version_id?"Gemmer…":"Jeg har læst informationen"}</button>
   </article>)}</div>}
 </section></main>;
}
