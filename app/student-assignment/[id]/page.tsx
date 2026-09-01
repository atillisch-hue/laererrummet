"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {supabase} from "../../../lib/supabase";
import {getStudentSessionToken} from "../../../lib/studentSession";
import {danishGenreByName,type DanishGenre} from "../../../lib/danishGenres";

type Assignment={id:number;title:string;type:string;instructions?:string};
type StudentData={ok?:boolean;student?:{id:number;name:string};assignments?:Assignment[];drafts?:{assignment_id:number;content:string[]}[]};

const card:React.CSSProperties={background:"white",border:"1px solid #d8d5cd",borderRadius:14,padding:20};

export default function StudentAssignmentPage(){
 const params=useParams<{id:string}>();
 const assignmentId=Number(params.id);
 const[ready,setReady]=useState(false);
 const[studentName,setStudentName]=useState("");
 const[assignment,setAssignment]=useState<Assignment|null>(null);
 const[genre,setGenre]=useState<DanishGenre|null>(null);
 const[content,setContent]=useState<string[]>([]);
 const[sessionToken,setSessionToken]=useState("");
 const[message,setMessage]=useState("");
 const[saving,setSaving]=useState(false);

 useEffect(()=>{
  let active=true;
  (async()=>{
   const token=getStudentSessionToken();
   if(!token){window.location.replace("/?student=1");return}
   setSessionToken(token);
   if(!Number.isFinite(assignmentId)||assignmentId<=0){setMessage("Opgaven kunne ikke åbnes.");setReady(true);return}
   const{data,error}=await supabase.rpc("student_session_data",{p_session_token:token});
   if(!active)return;
   const payload=data as StudentData|null;
   if(error||!payload?.ok){window.location.replace("/?student=1");return}
   const found=(payload.assignments||[]).find(a=>a.id===assignmentId)||null;
   if(!found){setMessage("Du har ikke adgang til denne opgave.");setReady(true);return}
   const foundGenre=danishGenreByName(found.type);
   if(!foundGenre){setMessage("Denne opgavetype kan ikke åbnes i skriveværkstedet endnu.");setReady(true);return}
   const draft=(payload.drafts||[]).find(d=>d.assignment_id===assignmentId)?.content||[];
   setStudentName(payload.student?.name||"");setAssignment(found);setGenre(foundGenre);setContent(foundGenre.structure.map((_,i)=>draft[i]||""));setReady(true);
  })();
  return()=>{active=false};
 },[assignmentId]);

 async function update(index:number,value:string){
  if(!assignment||!sessionToken)return;
  const next=[...content];next[index]=value;setContent(next);setSaving(true);setMessage("");
  const{data,error}=await supabase.rpc("save_student_draft_session",{p_session_token:sessionToken,p_assignment_id:assignment.id,p_content:next});
  setSaving(false);
  if(error||!data?.ok)setMessage("Kunne ikke gemme lige nu.");
 }

 if(!ready)return <main className="studentShell"><section className="studentContent"><div style={card}>Åbner opgaven…</div></section></main>;
 if(!assignment||!genre)return <main className="studentShell"><section className="studentContent"><div style={card}><h1>Opgaven kunne ikke åbnes</h1><p>{message}</p><Link href="/?student=1">← Mit Klasseværelse</Link></div></section></main>;

 const saveStatus=message||(saving?"Gemmer…":"Din kladde gemmes automatisk.");
 return <main className="studentShell">
  <header className="studentTop"><div className="brand"><span>✦</span><div><strong>Klasseværelset</strong><small>{studentName}</small></div></div><Link href="/?student=1" style={{color:"inherit",fontWeight:800,textDecoration:"none"}}>Mit Klasseværelse</Link></header>
  <section className="studentContent">
   <Link href="/?student=1" className="back">← Mit Klasseværelse</Link>
   <p className="eyebrow">{genre.category.toUpperCase()} · {genre.name.toUpperCase()}</p>
   <h1>{assignment.title}</h1>
   {assignment.instructions&&<div style={{...card,margin:"14px 0 14px",lineHeight:1.6}}>{assignment.instructions}</div>}
   <section style={{...card,background:"#eef2ed",marginBottom:18}}><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:20}}>Før du skriver</strong><p style={{margin:"7px 0 5px"}}><b>Formål:</b> {genre.purpose}</p><p style={{margin:"5px 0 0"}}><b>Modtager:</b> {genre.audience}</p></section>
   <div style={{display:"grid",gap:14}}>
    {genre.structure.map((label,i)=><label key={`${genre.id}-${i}`} style={{...card,display:"block",fontWeight:900}}><span style={{display:"block",marginBottom:8}}>{i+1}. {label}</span><textarea value={content[i]||""} onChange={e=>update(i,e.target.value)} rows={i===0?2:5} style={{width:"100%",boxSizing:"border-box",padding:12,border:"1px solid #d8d5cd",borderRadius:9,font:"inherit",lineHeight:1.5,resize:"vertical"}}/></label>)}
   </div>
   <section style={{...card,marginTop:16}}><strong style={{fontFamily:"Georgia,serif",fontSize:19}}>Tjek din tekst</strong><div style={{display:"grid",gap:7,marginTop:10}}>{genre.checklist.map(x=><label key={x} style={{display:"flex",gap:9,alignItems:"start"}}><input type="checkbox"/><span>{x}</span></label>)}</div></section>
   <p style={{marginTop:16,color:message?"#8b342e":"#687168",fontWeight:700}}>{saveStatus}</p>
  </section>
 </main>;
}