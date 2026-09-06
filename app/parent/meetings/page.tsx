"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type Meeting={id:number;title:string;meeting_type:string;starts_at:string;ends_at:string|null;location:string|null;agenda:string|null;minutes:string|null;status:string;student_id:number|null};
type Child={id:number;name:string};
type ParentPayload={children?:Child[]};
const childFromUrl=()=>{const raw=new URLSearchParams(window.location.search).get("child");const id=raw?Number(raw):NaN;return Number.isInteger(id)&&id>0?id:null};
const setChildInUrl=(id:number|null)=>{const url=new URL(window.location.href);if(id)url.searchParams.set("child",String(id));else url.searchParams.delete("child");window.history.replaceState({},"",url.toString())};

export default function ParentMeetings(){
 const[ready,setReady]=useState(false);
 const[meetings,setMeetings]=useState<Meeting[]>([]);
 const[children,setChildren]=useState<Child[]>([]);
 const[activeChildId,setActiveChildId]=useState<number|null>(null);
 const[openId,setOpenId]=useState<number|null>(null);
 const[error,setError]=useState("");

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();
  const user=data.session?.user;
  if(!user){location.replace("/");return}
  if(!hasRole(user,"parent")){location.replace("/noticeboard");return}

  const[portalResult,meetingResult]=await Promise.all([
   supabase.rpc("parent_portal_data"),
   supabase.rpc("guardian_meetings")
  ]);

  if(portalResult.error||meetingResult.error){
   setError("Møderne kunne ikke hentes lige nu.");
   setReady(true);
   return;
  }

  const payload=(portalResult.data||{}) as ParentPayload;
  const list=Array.isArray(payload.children)?payload.children:[];
  const requested=childFromUrl();
  const initial=requested&&list.some(child=>child.id===requested)?requested:null;
  setChildren(list);setMeetings((meetingResult.data||[]) as Meeting[]);setActiveChildId(initial);setReady(true);
 })()},[]);

 const childName=(id:number|null)=>children.find(c=>c.id===id)?.name;
 const visibleMeetings=useMemo(()=>activeChildId===null?meetings:meetings.filter(m=>m.student_id===null||m.student_id===activeChildId),[meetings,activeChildId]);
 const selectChild=(id:number|null)=>{setActiveChildId(id);setOpenId(null);setChildInUrl(id)};
 const backHref=activeChildId?`/parent?child=${activeChildId}`:"/parent";

 if(!ready)return <main style={shell}>Henter møder og referater…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <section style={shell}>
   <Link href={backHref} style={back}>← Forældreportalen</Link>
   <p style={{...eyebrow,marginTop:28}}>MØDER & REFERATER</p>
   <h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"7px 0 8px"}}>Dit mødearkiv</h1>
   <p style={{maxWidth:700,color:"#687068",fontSize:17,lineHeight:1.55,marginBottom:24}}>Her finder du de møder, hvor skolen har inviteret dig som forælder eller værge. Du ser kun dagsorden og officielt referat — ikke skolens interne arbejdsnoter.</p>

   {children.length>1&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:22}}><button type="button" onClick={()=>selectChild(null)} style={{...filterButton,background:activeChildId===null?"#365044":"white",color:activeChildId===null?"white":"#26342e"}}>Alle børn</button>{children.map(child=><button type="button" key={child.id} onClick={()=>selectChild(child.id)} style={{...filterButton,background:activeChildId===child.id?"#365044":"white",color:activeChildId===child.id?"white":"#26342e"}}>{child.name}</button>)}</div>}

   {error&&<div style={warning}>{error}</div>}
   {!error&&!visibleMeetings.length&&<div style={card}><strong>Ingen møder i arkivet{activeChildId?` for ${childName(activeChildId)}`:""} endnu.</strong><p style={{marginBottom:0,color:"#687068"}}>Når du inviteres til et møde, bliver det synligt her.</p></div>}

   <div style={{display:"grid",gap:12}}>{visibleMeetings.map(m=>{
    const open=openId===m.id;
    const dt=new Date(m.starts_at);
    const end=m.ends_at?new Date(m.ends_at):null;
    const child=childName(m.student_id);
    return <article key={m.id} style={card}>
     <button onClick={()=>setOpenId(open?null:m.id)} style={{width:"100%",border:0,background:"transparent",padding:0,textAlign:"left",color:"inherit",cursor:"pointer"}}>
      <small style={eyebrow}>{m.meeting_type.toUpperCase()}{child?` · ${child.toUpperCase()}`:""}</small>
      <h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"5px 0"}}>{m.title}</h2>
      <div style={{color:"#687068"}}>{dt.toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · {dt.toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}{end?`–${end.toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}`:""}{m.location?` · ${m.location}`:""}</div>
      <strong style={{display:"block",marginTop:10,color:"#526b60"}}>{open?"Luk mødet ↑":"Åbn mødet ↓"}</strong>
     </button>
     {open&&<div style={{marginTop:18,paddingTop:18,borderTop:"1px solid #e3dfd7"}}>
      <h3 style={h3}>Dagsorden</h3><div style={textBox}>{m.agenda||"Ingen dagsorden er delt endnu."}</div>
      <h3 style={{...h3,marginTop:20}}>Officielt referat</h3><div style={textBox}>{m.minutes||"Referatet er ikke skrevet eller delt endnu."}</div>
      <div style={{marginTop:16,padding:11,background:"#e7eee9",borderRadius:8,fontSize:13,color:"#52635a"}}>Interne arbejdsnoter, beslutningskladder og andre elevers oplysninger er ikke en del af denne visning.</div>
     </div>}
    </article>;
   })}</div>
  </section>
 </main>
}

const shell:React.CSSProperties={maxWidth:900,margin:"auto",padding:"34px 24px 70px"};
const back:React.CSSProperties={color:"#526b60",fontWeight:800,textDecoration:"none"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:20};
const warning:React.CSSProperties={marginBottom:20,padding:16,background:"#fff3cd",borderRadius:10};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#718077"};
const h3:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:21,margin:"0 0 8px"};
const textBox:React.CSSProperties={whiteSpace:"pre-wrap",lineHeight:1.6,color:"#46534c",background:"#faf9f6",padding:14,borderRadius:9};
const filterButton:React.CSSProperties={padding:"9px 12px",border:"1px solid #cfcac0",borderRadius:9,fontWeight:800,cursor:"pointer"};