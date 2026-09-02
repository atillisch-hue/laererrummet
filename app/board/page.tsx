"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";
import RoleNoticeboard from "../RoleNoticeboard";

type BoardMeeting={id:number;title:string;meeting_date:string;start_time:string|null;location:string|null};
type BoardDecision={id:number;meeting_id:number;decision:string;responsible:string|null;due_date:string|null;completed:boolean};

export default function BoardPage(){
 const[ready,setReady]=useState(false);
 const[email,setEmail]=useState("");
 const[userId,setUserId]=useState("");
 const[meetings,setMeetings]=useState<BoardMeeting[]>([]);
 const[followUps,setFollowUps]=useState<BoardDecision[]>([]);
 const[closing,setClosing]=useState<number|null>(null);
 const[teacherMessage,setTeacherMessage]=useState("");
 const[posting,setPosting]=useState(false);
 const[posted,setPosted]=useState(false);
 const[error,setError]=useState("");

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();const user=data.session?.user;
  if(!user){location.replace("/");return}
  if(!hasRole(user,"board")){location.replace("/noticeboard");return}
  setEmail(user.email||"");setUserId(user.id);
  const today=new Date().toISOString().slice(0,10);
  const[m,d]=await Promise.all([
   supabase.from("board_meetings").select("id,title,meeting_date,start_time,location").gte("meeting_date",today).order("meeting_date").order("start_time").limit(4),
   supabase.from("board_decisions").select("id,meeting_id,decision,responsible,due_date,completed").eq("completed",false).order("due_date",{ascending:true,nullsFirst:false})
  ]);
  if(m.error||d.error)setError("Bestyrelsens arbejdsdata kunne ikke hentes.");
  setMeetings((m.data||[]) as BoardMeeting[]);setFollowUps((d.data||[]) as BoardDecision[]);setReady(true);
 })()},[]);

 async function closeDecision(d:BoardDecision){
  if(closing!==null)return;setClosing(d.id);
  const{error}=await supabase.from("board_decisions").update({completed:true}).eq("id",d.id);
  if(error)setError("Beslutningen kunne ikke markeres som færdig.");else setFollowUps(p=>p.filter(x=>x.id!==d.id));
  setClosing(null);
 }
 async function postToTeachers(){
  const text=teacherMessage.trim();if(!text||!userId||posting)return;setPosting(true);setPosted(false);
  const{error}=await supabase.from("noticeboard_posts").insert({text:`[Fra bestyrelsen] ${text}`,author_email:email,author_id:userId,audiences:["teacher"]});
  setPosting(false);
  if(error){setError("Beskeden kunne ikke sættes på lærernes opslagstavle.");return}
  setTeacherMessage("");setPosted(true);setTimeout(()=>setPosted(false),3500);
 }

 if(!ready)return <main style={{padding:50}}>Åbner bestyrelsens arbejdsrum…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}><section style={{maxWidth:1160,margin:"auto",padding:"44px 26px 70px"}}>
  <p style={eyebrow}>BESTYRELSENS ARBEJDSRUM</p><h1 style={{fontFamily:"Georgia,serif",fontSize:44,margin:"8px 0"}}>Overblik</h1><p style={{fontSize:18,color:"#707670",marginTop:8,maxWidth:780,lineHeight:1.55}}>Kommende møder, beslutninger og beskeder til skolen samlet ét sted. Elevsager og lærerinterne data er ikke en del af bestyrelsesrummet.</p>
  {error&&<div style={{marginTop:18,padding:13,background:"#fff0ed",border:"1px solid #deb5ad",borderRadius:10,color:"#7b3b32",fontWeight:800}}>{error}</div>}
  <RoleNoticeboard audience="board" title="Beskeder til bestyrelsen"/>

  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:22,marginTop:28}}>
   <section style={box}><div style={boxHead}><div><p style={eyebrow}>KALENDER</p><h2 style={title}>Kommende møder</h2></div><Link href="/board/meetings" style={link}>Se alle →</Link></div>{meetings.length===0?<p style={muted}>Der er ingen kommende bestyrelsesmøder.</p>:meetings.map((m,i)=><Link key={m.id} href="/board/meetings" style={{display:"block",textDecoration:"none",color:"inherit",padding:"15px 0",borderTop:i?"1px solid #eee8dd":"none"}}><strong>{m.title}</strong><div style={small}>{new Date(m.meeting_date+"T12:00:00").toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long"})}{m.start_time?` · kl. ${m.start_time.slice(0,5)}`:""}{m.location?` · ${m.location}`:""}</div></Link>)}</section>
   <section style={box}><div style={boxHead}><div><p style={eyebrow}>OPFØLGNING</p><h2 style={title}>Åbne beslutninger</h2></div><span style={{background:"#e8dfca",borderRadius:20,padding:"5px 10px",fontWeight:800}}>{followUps.length}</span></div>{followUps.length===0?<p style={muted}>Alt er fulgt op ✓</p>:followUps.map((d,i)=><div key={d.id} style={{padding:"15px 0",borderTop:i?"1px solid #eee8dd":"none"}}><strong>{d.decision}</strong><div style={small}>{d.responsible?`Ansvarlig: ${d.responsible}`:"Mangler ansvarlig"}{d.due_date?` · Frist ${new Date(d.due_date+"T12:00:00").toLocaleDateString("da-DK")}`:""}</div><button onClick={()=>closeDecision(d)} disabled={closing===d.id} style={done}>{closing===d.id?"Gemmer…":"✓ Markér færdig"}</button></div>)}</section>
  </div>

  <section style={{...box,minHeight:0,marginTop:22}}><p style={eyebrow}>BESKED TIL LÆRERNE</p><h2 style={title}>Sæt noget på lærernes opslagstavle</h2><p style={{color:"#687068",lineHeight:1.5,maxWidth:760}}>Beskeden vises på lærernes eksisterende opslagstavle og markeres som en besked fra bestyrelsen.</p><textarea value={teacherMessage} onChange={e=>setTeacherMessage(e.target.value)} maxLength={2000} placeholder="Fx: Bestyrelsen vil gerne takke for en rigtig god skolefest…" style={{width:"100%",minHeight:110,padding:13,border:"1px solid #d8d5cd",borderRadius:9,boxSizing:"border-box",font:"inherit",resize:"vertical"}}/><div style={{display:"flex",alignItems:"center",gap:12,marginTop:10,flexWrap:"wrap"}}><button onClick={postToTeachers} disabled={!teacherMessage.trim()||posting} style={{padding:"11px 16px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:800,cursor:posting?"wait":"pointer",opacity:!teacherMessage.trim()?0.55:1}}>{posting?"Sætter op…":"Sæt på lærernes opslagstavle →"}</button>{posted&&<span style={{fontWeight:800,color:"#486b59"}}>✓ Beskeden er sat op</span>}</div></section>
 </section></main>;
}

const eyebrow:React.CSSProperties={fontSize:11,fontWeight:800,letterSpacing:1.7,color:"#718077",margin:0};
const box:React.CSSProperties={background:"white",border:"1px solid #dedbd2",borderRadius:16,padding:24,minHeight:260};
const boxHead:React.CSSProperties={display:"flex",justifyContent:"space-between",alignItems:"start",gap:12};
const title:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:27,margin:"6px 0 14px"};
const link:React.CSSProperties={color:"#486b59",fontWeight:800,textDecoration:"none",fontSize:13};
const muted:React.CSSProperties={color:"#777"};
const small:React.CSSProperties={fontSize:13,color:"#777",marginTop:5};
const done:React.CSSProperties={marginTop:10,border:"1px solid #486b59",background:"#eef3ef",color:"#315341",borderRadius:8,padding:"7px 11px",fontWeight:800,cursor:"pointer"};
