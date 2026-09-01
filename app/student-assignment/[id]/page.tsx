"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {supabase} from "../../../lib/supabase";
import {getStudentSessionToken} from "../../../lib/studentSession";

const templates={
 "Debatindlæg":["Overskrift","Indledning: Hvad debatterer du?","Din tydelige holdning","Argument 1 + eksempel","Argument 2 + eksempel","Modargument og svar","Afrunding: Hvad bør der ske?"],
 "Artikel":["Rubrik","Manchet","Indledning: Hvem, hvad, hvor?","Brødtekst med mellemoverskrifter","Citater eller kilder","Afrunding"],
 "Essay":["En åbning, der vækker nysgerrighed","En konkret oplevelse eller situation","Undren og refleksion","Flere perspektiver","En åben eller eftertænksom afslutning"],
 "Fortælling":["Anslag","Personer og miljø","Konflikt","Vendepunkt","Afslutning"]
} as const;

type AssignmentType=keyof typeof templates;
type Assignment={id:number;title:string;type:string;instructions?:string};
type StudentData={ok?:boolean;student?:{id:number;name:string};assignments?:Assignment[];drafts?:{assignment_id:number;content:string[]}[]};

const card:React.CSSProperties={background:"white",border:"1px solid #d8d5cd",borderRadius:14,padding:20};

export default function StudentAssignmentPage(){
 const params=useParams<{id:string}>();
 const assignmentId=Number(params.id);
 const[ready,setReady]=useState(false);
 const[studentName,setStudentName]=useState("");
 const[assignment,setAssignment]=useState<Assignment|null>(null);
 const[content,setContent]=useState<string[]>([]);
 const[message,setMessage]=useState("");
 const[saving,setSaving]=useState(false);
 const token=typeof window!=="undefined"?getStudentSessionToken():"";

 useEffect(()=>{
  let active=true;
  (async()=>{
   const sessionToken=getStudentSessionToken();
   if(!sessionToken){window.location.replace("/?student=1");return}
   if(!Number.isFinite(assignmentId)||assignmentId<=0){setMessage("Opgaven kunne ikke åbnes.");setReady(true);return}
   const{data,error}=await supabase.rpc("student_session_data",{p_session_token:sessionToken});
   if(!active)return;
   const payload=data as StudentData|null;
   if(error||!payload?.ok){window.location.replace("/?student=1");return}
   const found=(payload.assignments||[]).find(a=>a.id===assignmentId)||null;
   if(!found){setMessage("Du har ikke adgang til denne opgave.");setReady(true);return}
   if(!Object.prototype.hasOwnProperty.call(templates,found.type)){setMessage("Denne opgavetype kan ikke åbnes i skriveværkstedet endnu.");setReady(true);return}
   const draft=(payload.drafts||[]).find(d=>d.assignment_id===assignmentId)?.content||[];
   const steps=templates[found.type as AssignmentType];
   setStudentName(payload.student?.name||"");setAssignment(found);setContent(steps.map((_,i)=>draft[i]||""));setReady(true);
  })();
  return()=>{active=false};
 },[assignmentId]);

 async function update(index:number,value:string){
  if(!assignment||!token)return;
  const next=[...content];next[index]=value;setContent(next);setSaving(true);setMessage("");
  const{data,error}=await supabase.rpc("save_student_draft_session",{p_session_token:token,p_assignment_id:assignment.id,p_content:next});
  setSaving(false);
  if(error||!data?.ok)setMessage("Kunne ikke gemme lige nu.");
 }

 if(!ready)return <main className="studentShell"><section className="studentContent"><div style={card}>Åbner opgaven…</div></section></main>;
 if(!assignment)return <main className="studentShell"><section className="studentContent"><div style={card}><h1>Opgaven kunne ikke åbnes</h1><p>{message}</p><Link href="/?student=1">← Mit Klasseværelse</Link></div></section></main>;

 const type=assignment.type as AssignmentType;
 const steps=templates[type];
 return <main className="studentShell">
  <header className="studentTop"><div className="brand"><span>✦</span><div><strong>Klasseværelset</strong><small>{studentName}</small></div></div><Link href="/?student=1" style={{color:"inherit",fontWeight:800,textDecoration:"none"}}>Mit Klasseværelse</Link></header>
  <section className="studentContent">
   <Link href="/?student=1" className="back">← Mit Klasseværelse</Link>
   <p className="eyebrow">{type.toUpperCase()}</p>
   <h1>{assignment.title}</h1>
   {assignment.instructions&&<div style={{...card,margin:"14px 0 20px",lineHeight:1.6}}>{assignment.instructions}</div>}
   <div style={{display:"grid",gap:14}}>
    {steps.map((label,i)=><label key={label} style={{...card,display:"block",fontWeight:900}}><span style={{display:"block",marginBottom:8}}>{i+1}. {label}</span><textarea value={content[i]||""} onChange={e=>update(i,e.target.value)} rows={i===0?2:5} style={{width:"100%",boxSizing:"border-box",padding:12,border:"1px solid #d8d5cd",borderRadius:9,font:"inherit",lineHeight:1.5,resize:"vertical"}}/></label>)}
   </div>
   <p style={{marginTop:16,color:message?"#8b342e":"#687168",fontWeight:700}}>{message||saving?"Gemmer…":"Din kladde gemmes automatisk."}</p>
  </section>
 </main>;
}
