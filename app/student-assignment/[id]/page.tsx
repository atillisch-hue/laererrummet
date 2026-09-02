"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {studentSupabase} from "../../../lib/studentSupabase";
import {getStudentSessionToken} from "../../../lib/studentSession";
import {danishGenreByName,type DanishGenre} from "../../../lib/danishGenreCatalog";
import {genericAssignmentTemplates,mathAssignmentTemplates,templateForAssignment,type AssignmentKind,type AssignmentTemplate} from "../../../lib/subjectAssignmentCatalog";

type Assignment={id:number;title:string;type:string;instructions?:string;assignment_kind?:AssignmentKind;subject_name?:string|null;subject_slug?:string|null;subject_id?:number|null;class_subject_id?:number|null};
type StudentData={ok?:boolean;student?:{id:number;name:string};assignments?:Assignment[];drafts?:{assignment_id:number;content:string[]}[]};
type Workspace={structure:string[];checklist:string[];coach:string;genre?:DanishGenre;template?:AssignmentTemplate};

const card:React.CSSProperties={background:"white",border:"1px solid #d8d5cd",borderRadius:14,padding:20};
const resolveGenre=(name:string)=>name==="Artikel"?danishGenreByName("Artikel")||danishGenreByName("Nyhedsartikel"):name==="Fortælling"?danishGenreByName("Novelle"):danishGenreByName(name);

function workspaceFor(assignment:Assignment):Workspace{
 if(assignment.assignment_kind==="danish_writing"||assignment.subject_slug==="dansk"){
  const genre=resolveGenre(assignment.type);
  if(genre)return{structure:genre.structure,checklist:genre.checklist,coach:"Brug genrens formål, modtager og struktur aktivt, mens du skriver.",genre};
 }
 if(assignment.assignment_kind==="math_task"||assignment.subject_slug==="matematik"){
  const template=templateForAssignment("math_task",assignment.type)||mathAssignmentTemplates[0];
  return{structure:template.structure,checklist:template.checklist,coach:template.coach,template};
 }
 const template=templateForAssignment("generic",assignment.type)||genericAssignmentTemplates[0];
 return{structure:template.structure,checklist:template.checklist,coach:template.coach,template};
}

export default function StudentAssignmentPage(){
 const params=useParams<{id:string}>();
 const assignmentId=Number(params.id);
 const[ready,setReady]=useState(false),[studentName,setStudentName]=useState(""),[assignment,setAssignment]=useState<Assignment|null>(null),[content,setContent]=useState<string[]>([]),[sessionToken,setSessionToken]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false);
 const workspace=useMemo(()=>assignment?workspaceFor(assignment):null,[assignment]);

 useEffect(()=>{
  let active=true;
  (async()=>{
   const token=getStudentSessionToken();if(!token){window.location.replace("/?student=1");return}
   setSessionToken(token);
   if(!Number.isFinite(assignmentId)||assignmentId<=0){setMessage("Opgaven kunne ikke åbnes.");setReady(true);return}
   const{data,error}=await studentSupabase.rpc("student_session_data",{p_session_token:token});
   if(!active)return;
   const payload=data as StudentData|null;if(error||!payload?.ok){window.location.replace("/?student=1");return}
   const found=(payload.assignments||[]).find(a=>a.id===assignmentId)||null;
   if(!found){setMessage("Du har ikke adgang til denne opgave.");setReady(true);return}
   const draft=(payload.drafts||[]).find(d=>d.assignment_id===assignmentId)?.content||[];
   const work=workspaceFor(found);
   setStudentName(payload.student?.name||"");setAssignment(found);setContent(work.structure.map((_,i)=>draft[i]||""));setReady(true);
  })();
  return()=>{active=false};
 },[assignmentId]);

 async function update(index:number,value:string){
  if(!assignment||!sessionToken)return;
  const next=[...content];next[index]=value;setContent(next);setSaving(true);setMessage("");
  const{data,error}=await studentSupabase.rpc("save_student_draft_session",{p_session_token:sessionToken,p_assignment_id:assignment.id,p_content:next});
  setSaving(false);if(error||!data?.ok)setMessage("Kunne ikke gemme lige nu.");
 }

 if(!ready)return <main className="studentShell"><section className="studentContent"><div style={card}>Åbner opgaven…</div></section></main>;
 if(!assignment||!workspace)return <main className="studentShell"><section className="studentContent"><div style={card}><h1>Opgaven kunne ikke åbnes</h1><p>{message}</p><Link href="/?student=1">← Mit Klasseværelse</Link></div></section></main>;

 const saveStatus=message||(saving?"Gemmer…":"Din kladde gemmes automatisk.");
 const isDanish=Boolean(workspace.genre),isMath=assignment.assignment_kind==="math_task"||assignment.subject_slug==="matematik";
 const subjectLabel=assignment.subject_name|| (isDanish?"Dansk":isMath?"Matematik":"Faglig opgave");
 return <main className="studentShell">
  <header className="studentTop"><div className="brand"><span>✦</span><div><strong>Klasseværelset</strong><small>{studentName}</small></div></div><Link href="/?student=1" style={{color:"inherit",fontWeight:800,textDecoration:"none"}}>Mit Klasseværelse</Link></header>
  <section className="studentContent">
   <Link href="/?student=1" className="back">← Mit Klasseværelse</Link>
   <p className="eyebrow">{subjectLabel.toUpperCase()} · {assignment.type.toUpperCase()}</p>
   <h1>{assignment.title}</h1>
   {assignment.instructions&&<div style={{...card,margin:"14px 0",lineHeight:1.6}}>{assignment.instructions}</div>}

   {isDanish&&workspace.genre&&<section style={{...card,background:"#eef2ed",marginBottom:18}}><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:20}}>Før du skriver</strong><p style={{margin:"7px 0 5px"}}><b>Formål:</b> {workspace.genre.purpose}</p><p style={{margin:"5px 0 0"}}><b>Modtager:</b> {workspace.genre.audience}</p></section>}
   {!isDanish&&<section style={{...card,background:isMath?"#edf1f5":"#eef2ed",marginBottom:18}}><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:20}}>{isMath?"Før du regner":"Før du går i gang"}</strong><p style={{margin:"7px 0 0",lineHeight:1.55}}>{workspace.coach}</p></section>}

   <div style={{display:"grid",gap:14}}>{workspace.structure.map((label,i)=><label key={`${assignment.id}-${i}`} style={{...card,display:"block",fontWeight:900}}><span style={{display:"block",marginBottom:8}}>{i+1}. {label}</span><textarea value={content[i]||""} onChange={e=>update(i,e.target.value)} rows={isMath?Math.max(4,i===0?4:6):i===0?3:6} style={{width:"100%",boxSizing:"border-box",padding:12,border:"1px solid #d8d5cd",borderRadius:9,font:"inherit",lineHeight:1.5,resize:"vertical"}} placeholder={isMath?"Skriv beregninger, forklaring eller svar her…":"Skriv her…"}/></label>)}</div>

   <section style={{...card,marginTop:16}}><strong style={{fontFamily:"Georgia,serif",fontSize:19}}>{isMath?"Tjek din matematik":"Tjek din besvarelse"}</strong><div style={{display:"grid",gap:7,marginTop:10}}>{workspace.checklist.map(x=><label key={x} style={{display:"flex",gap:9,alignItems:"start"}}><input type="checkbox"/><span>{x}</span></label>)}</div></section>
   <p style={{marginTop:16,color:message?"#8b342e":"#687168",fontWeight:700}}>{saveStatus}</p>
  </section>
 </main>;
}
