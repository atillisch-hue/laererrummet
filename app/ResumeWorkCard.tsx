"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";
import type {ResumeObjectType} from "./WorkResumeTracker";

type Row={user_id:string;school_id:number;object_type:ResumeObjectType;object_key:string;title:string;subtitle:string|null;href:string;next_step:string|null;updated_at:string};
const labels:Record<ResumeObjectType,string>={subject_unit:"Forløb",lesson:"Lektion",meeting:"Møde",assignment:"Opgave",student:"Elev"};

export default function ResumeWorkCard({compact=false}:{compact?:boolean}){
 const[loading,setLoading]=useState(true),[row,setRow]=useState<Row|null>(null),[editingNext,setEditingNext]=useState(false),[draft,setDraft]=useState(""),[saving,setSaving]=useState(false);
 useEffect(()=>{let active=true;(async()=>{const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user){if(active)setLoading(false);return}const{data}=await supabase.from("user_resume_work_state").select("user_id,school_id,object_type,object_key,title,subtitle,href,next_step,updated_at").eq("user_id",user.id).maybeSingle();if(!active)return;const next=(data||null) as Row|null;setRow(next);setDraft(next?.next_step||"");setLoading(false)})();return()=>{active=false}},[]);
 const clear=async()=>{if(!row)return;await supabase.from("user_resume_work_state").delete().eq("user_id",row.user_id);setRow(null)};
 const startNext=()=>{setDraft(row?.next_step||"");setEditingNext(true)};
 const saveNext=async()=>{if(!row||saving)return;setSaving(true);const next=draft.trim().slice(0,280)||null;const{error}=await supabase.from("user_resume_work_state").update({next_step:next}).eq("user_id",row.user_id);setSaving(false);if(error)return;setRow(x=>x?{...x,next_step:next}:x);setEditingNext(false)};
 if(loading)return compact?null:<section style={card}><small style={eyebrow}>FORTSÆT ARBEJDET</small><div style={{color:"#788078",marginTop:7,fontSize:13}}>Finder din seneste arbejdsposition…</div></section>;
 if(!row)return null;
 const when=new Date(row.updated_at).toLocaleString("da-DK",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
 return <section style={{...card,padding:compact?"12px 13px":18}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><div style={{minWidth:0}}><small style={eyebrow}>FORTSÆT ARBEJDET · {labels[row.object_type].toUpperCase()}</small><h2 style={{fontFamily:"Georgia,serif",fontSize:compact?18:23,margin:"5px 0 3px"}}>{row.title}</h2>{row.subtitle&&<div style={{fontSize:12,color:"#687068",lineHeight:1.4}}>{row.subtitle}</div>}<small style={{display:"block",marginTop:6,color:"#8a8d87"}}>Sidst åbnet {when}</small></div><button type="button" onClick={clear} title="Fjern genvejen" style={clearButton}>×</button></div>
  {editingNext?<div style={{marginTop:9}}><label style={{fontSize:10,fontWeight:900,color:"#66786d"}}>HVAD ER DIT NÆSTE SKRIDT?<input autoFocus maxLength={280} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void saveNext();if(e.key==="Escape")setEditingNext(false)}} placeholder="Fx læg arbejdsarket ind i næste lektion" style={nextInput}/></label><div style={{display:"flex",gap:6,marginTop:6}}><button type="button" onClick={saveNext} disabled={saving} style={saveButton}>{saving?"Gemmer…":"Gem"}</button><button type="button" onClick={()=>setEditingNext(false)} style={cancelButton}>Annullér</button></div></div>:row.next_step?<button type="button" onClick={startNext} style={nextStepButton}><small style={{fontWeight:900,letterSpacing:.5}}>NÆSTE</small><span>{row.next_step}</span><small style={{opacity:.7}}>Redigér</small></button>:<button type="button" onClick={startNext} style={addNextButton}>+ Husk mit næste skridt</button>}
  <Link href={row.href} style={continueLink}>Fortsæt hvor du slap →</Link>
 </section>;
}

const card:React.CSSProperties={background:"#eef2ed",border:"1px solid #d5dfd7",borderRadius:14,padding:18,color:"#26342e"};
const eyebrow:React.CSSProperties={fontSize:9,fontWeight:900,letterSpacing:1.1,color:"#66786d"};
const continueLink:React.CSSProperties={display:"inline-block",marginTop:9,color:"#365044",fontWeight:900,fontSize:12,textDecoration:"none"};
const clearButton:React.CSSProperties={border:"1px solid #d4d8d3",background:"white",color:"#6c766f",width:27,height:27,borderRadius:999,cursor:"pointer",fontWeight:900,fontSize:16,lineHeight:"20px",flex:"0 0 auto"};
const addNextButton:React.CSSProperties={display:"block",border:0,background:"transparent",padding:0,marginTop:8,color:"#6b766f",fontSize:11,fontWeight:850,cursor:"pointer",textAlign:"left"};
const nextStepButton:React.CSSProperties={width:"100%",display:"grid",gridTemplateColumns:"auto 1fr auto",gap:7,alignItems:"center",border:"1px solid #d6dfd7",background:"rgba(255,255,255,.68)",borderRadius:8,padding:"7px 8px",marginTop:8,color:"#53645a",fontSize:11,cursor:"pointer",textAlign:"left"};
const nextInput:React.CSSProperties={boxSizing:"border-box",width:"100%",display:"block",marginTop:4,padding:"8px 9px",border:"1px solid #cfd7d0",borderRadius:8,background:"white",font:"inherit",fontSize:12,color:"#26342e"};
const saveButton:React.CSSProperties={border:0,borderRadius:7,padding:"6px 9px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer",fontSize:11};
const cancelButton:React.CSSProperties={border:"1px solid #d5d9d5",borderRadius:7,padding:"6px 9px",background:"white",color:"#667168",fontWeight:850,cursor:"pointer",fontSize:11};
