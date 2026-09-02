"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";

type Task={
 task_key:string;
 source:"meeting"|"board";
 action_id:number;
 context_id:number;
 title:string;
 description:string|null;
 due_date:string|null;
 completed:boolean;
 context_title:string|null;
 context_type:string|null;
 starts_at:string|null;
 can_open_context:boolean;
};

export default function MeetingActionInbox(){
 const[tasks,setTasks]=useState<Task[]>([]),[ready,setReady]=useState(false),[busy,setBusy]=useState<string|null>(null),[error,setError]=useState("");
 async function load(){
  const{data,error:e}=await supabase.rpc("my_action_inbox",{p_include_completed:false});
  if(e){setError(e.message);setTasks([])}else{setError("");setTasks((data||[]) as Task[])}
  setReady(true);
 }
 useEffect(()=>{load()},[]);
 async function complete(task:Task){
  setBusy(task.task_key);setError("");
  const{error:e}=await supabase.rpc("set_my_action_completed",{p_source:task.source,p_action_id:task.action_id,p_completed:true});
  if(e)setError(e.message);else await load();
  setBusy(null);
 }
 function contextLink(t:Task){return t.source==="board"?`/board/meetings#board-meeting-${t.context_id}`:`/calendar/meeting/${t.context_id}`}
 if(!ready||(!tasks.length&&!error))return null;
 return <section style={{background:"#fff",border:"1px solid #d7ddd6",borderRadius:16,padding:"19px 21px",marginBottom:20}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,flexWrap:"wrap"}}><div><p style={{fontSize:11,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0}}>KRÆVER DIN HANDLING</p><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"5px 0 0"}}>Det skal du følge op på</h2></div><Link href="/my-tasks" style={{color:"#365044",fontWeight:900,textDecoration:"none"}}>Se alle →</Link></div>
  {error?<div style={{marginTop:13,padding:"10px 12px",background:"#fff3cd",borderRadius:8,color:"#765b29"}}>Handlingerne kunne ikke hentes lige nu.</div>:<div style={{display:"grid",gap:9,marginTop:15}}>{tasks.slice(0,6).map(t=>{const overdue=!!t.due_date&&t.due_date<today();return <article key={t.task_key} style={{display:"flex",gap:11,alignItems:"start",padding:"12px 13px",background:"#f7f5ef",border:"1px solid #e3dfd6",borderRadius:10}}><button type="button" disabled={busy===t.task_key} onClick={()=>complete(t)} aria-label="Markér handling som udført" title="Markér som udført" style={{width:27,height:27,borderRadius:7,border:"2px solid #486b59",background:"white",cursor:"pointer",flex:"0 0 auto",fontWeight:900,color:"#486b59"}}>{busy===t.task_key?"…":""}</button><div style={{flex:1,minWidth:0}}><strong style={{fontSize:16}}>{t.title}</strong>{t.description&&<p style={{margin:"5px 0",color:"#6e756f",fontSize:14}}>{t.description}</p>}<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:6,fontSize:12}}>{t.due_date&&<span style={{fontWeight:900,color:overdue?"#a44438":"#657169"}}>{overdue?"Overskredet · ":"Deadline · "}{new Date(t.due_date+"T12:00:00").toLocaleDateString("da-DK")}</span>}{t.can_open_context&&t.context_title?<Link href={contextLink(t)} style={{color:"#486b59",fontWeight:800,textDecoration:"none"}}>{t.context_type||"Møde"} · {t.context_title} →</Link>:<span style={{color:"#7b817c"}}>{t.source==="board"?"Tildelt fra bestyrelsen":"Tildelt fra et møde"}</span>}</div></div></article>})}{tasks.length>6&&<small style={{color:"#707670",fontWeight:800}}>+ {tasks.length-6} flere under Mine opgaver</small>}</div>}
 </section>;
}

const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
