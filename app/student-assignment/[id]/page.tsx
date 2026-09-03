"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {studentSupabase} from "../../../lib/studentSupabase";
import {getStudentSessionToken} from "../../../lib/studentSession";
import {danishGenreByName,type DanishGenre} from "../../../lib/danishGenreCatalog";
import {danishWritingSupport,type DanishWritingSupport} from "../../../lib/danishGenreProgression";
import {danishAnalysisByName,danishAnalysisSupport,type DanishAnalysisTemplate,type DanishAnalysisSupport} from "../../../lib/danishAnalysisCatalog";
import {danishCommunicationByName,danishCommunicationSupport,type DanishCommunicationTemplate,type DanishCommunicationSupport} from "../../../lib/danishCommunicationCatalog";
import {genericAssignmentTemplates,mathAssignmentTemplates,templateForAssignment,type AssignmentKind,type AssignmentTemplate} from "../../../lib/subjectAssignmentCatalog";

type Assignment={id:number;title:string;type:string;instructions?:string;assignment_kind?:AssignmentKind;subject_name?:string|null;subject_slug?:string|null;subject_id?:number|null;class_subject_id?:number|null};
type StudentData={ok?:boolean;student?:{id:number;name:string;grade_level?:number|null};assignments?:Assignment[];drafts?:{assignment_id:number;content:string[]}[]};
type Workspace={structure:string[];checklist:string[];coach:string;genre?:DanishGenre;writingSupport?:DanishWritingSupport;analysisTemplate?:DanishAnalysisTemplate;analysisSupport?:DanishAnalysisSupport;communicationTemplate?:DanishCommunicationTemplate;communicationSupport?:DanishCommunicationSupport;template?:AssignmentTemplate};

const card:React.CSSProperties={background:"white",border:"1px solid #d8d5cd",borderRadius:14,padding:20};
const resolveGenre=(name:string)=>name==="Artikel"?danishGenreByName("Artikel")||danishGenreByName("Nyhedsartikel"):name==="Fortælling"?danishGenreByName("Novelle"):danishGenreByName(name);

function workspaceFor(assignment:Assignment,gradeLevel:number|null):Workspace{
 if(assignment.assignment_kind==="danish_analysis"){
  const analysisTemplate=danishAnalysisByName(assignment.type);
  if(analysisTemplate){const support=danishAnalysisSupport(analysisTemplate,gradeLevel);return{structure:support.prompts,checklist:support.checklist,coach:support.coach,analysisTemplate,analysisSupport:support}}
 }
 if(assignment.assignment_kind==="danish_communication"){
  const communicationTemplate=danishCommunicationByName(assignment.type);
  if(communicationTemplate){const support=danishCommunicationSupport(communicationTemplate,gradeLevel);return{structure:support.planning,checklist:support.checklist,coach:support.coach,communicationTemplate,communicationSupport:support}}
 }
 if(assignment.assignment_kind==="danish_writing"||assignment.subject_slug==="dansk"){
  const genre=resolveGenre(assignment.type);
  if(genre){const support=danishWritingSupport(genre,gradeLevel);return{structure:support.structure,checklist:support.checklist,coach:support.coach,genre,writingSupport:support}}
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
 const[ready,setReady]=useState(false),[studentName,setStudentName]=useState(""),[gradeLevel,setGradeLevel]=useState<number|null>(null),[assignment,setAssignment]=useState<Assignment|null>(null),[content,setContent]=useState<string[]>([]),[sessionToken,setSessionToken]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false);
 const workspace=useMemo(()=>assignment?workspaceFor(assignment,gradeLevel):null,[assignment,gradeLevel]);

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
   const grade=payload.student?.grade_level??null,work=workspaceFor(found,grade);
   setStudentName(payload.student?.name||"");setGradeLevel(grade);setAssignment(found);setContent(work.structure.map((_,i)=>draft[i]||""));setReady(true);
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
 const isDanishWriting=Boolean(workspace.genre),isDanishAnalysis=Boolean(workspace.analysisTemplate),isDanishCommunication=Boolean(workspace.communicationTemplate),isDanish=isDanishWriting||isDanishAnalysis||isDanishCommunication,isMath=assignment.assignment_kind==="math_task"||assignment.subject_slug==="matematik";
 const subjectLabel=assignment.subject_name||(isDanish?"Dansk":isMath?"Matematik":"Faglig opgave");
 return <main className="studentShell">
  <header className="studentTop"><div className="brand"><span>✦</span><div><strong>Klasseværelset</strong><small>{studentName}</small></div></div><Link href="/?student=1" style={{color:"inherit",fontWeight:800,textDecoration:"none"}}>Mit Klasseværelse</Link></header>
  <section className="studentContent">
   <Link href="/?student=1" className="back">← Mit Klasseværelse</Link>
   <p className="eyebrow">{subjectLabel.toUpperCase()} · {assignment.type.toUpperCase()}</p>
   <h1>{assignment.title}</h1>
   {assignment.instructions&&<div style={{...card,margin:"14px 0",lineHeight:1.6}}>{assignment.instructions}</div>}

   {isDanishWriting&&workspace.genre&&workspace.writingSupport&&<section style={{...card,background:"#eef2ed",marginBottom:18}}><div style={supportHead}><strong style={supportTitle}>Før du skriver</strong><span style={levelTag}>{gradeLevel!=null?`TILPASSET · ${gradeLevel}. KL.`:workspace.writingSupport.band.toUpperCase()}</span></div><p style={coach}>{workspace.coach}</p><p style={{margin:"8px 0 5px"}}><b>Formål:</b> {workspace.genre.purpose}</p><p style={{margin:"5px 0 0"}}><b>Modtager:</b> {workspace.genre.audience}</p><FocusChips values={workspace.writingSupport.focus}/></section>}
   {isDanishAnalysis&&workspace.analysisTemplate&&workspace.analysisSupport&&<section style={{...card,background:"#eef2ed",marginBottom:18}}><div style={supportHead}><strong style={supportTitle}>Sådan arbejder du med teksten</strong><span style={levelTag}>{gradeLevel!=null?`TILPASSET · ${gradeLevel}. KL.`:workspace.analysisSupport.band.toUpperCase()}</span></div><p style={coach}>{workspace.coach}</p><div style={innerTip}><strong style={{fontSize:13}}>Husk rækkefølgen</strong><FocusChips values={["1. Find et tekstspor","2. Beskriv hvad du ser","3. Forklar virkningen","4. Fortolk med belæg"]}/></div></section>}
   {isDanishCommunication&&workspace.communicationTemplate&&workspace.communicationSupport&&<section style={{...card,background:"#eef2ed",marginBottom:18}}><div style={supportHead}><strong style={supportTitle}>Planlæg — men skriv ikke et manuskript</strong><span style={levelTag}>{gradeLevel!=null?`TILPASSET · ${gradeLevel}. KL.`:workspace.communicationSupport.band.toUpperCase()}</span></div><p style={coach}>{workspace.coach}</p><div style={innerTip}><strong style={{fontSize:13}}>Arbejd sådan</strong><FocusChips values={["1. Hvad vil du?","2. Hvem lytter?","3. Lav stikord","4. Øv højt","5. Lyt og tilpas"]}/></div><FocusChips values={workspace.communicationSupport.focus}/></section>}
   {!isDanish&&<section style={{...card,background:isMath?"#edf1f5":"#eef2ed",marginBottom:18}}><strong style={supportTitle}>{isMath?"Før du regner":"Før du går i gang"}</strong><p style={coach}>{workspace.coach}</p></section>}

   <div style={{display:"grid",gap:14}}>{workspace.structure.map((step,i)=><label key={`${assignment.id}-${i}`} style={{...card,display:"block",fontWeight:900}}><span style={{display:"block",marginBottom:8}}>{i+1}. {step}</span><textarea value={content[i]||""} onChange={e=>update(i,e.target.value)} rows={isMath?Math.max(4,i===0?4:6):isDanishCommunication?3:gradeLevel!=null&&gradeLevel<=4?4:i===0?3:6} style={{width:"100%",boxSizing:"border-box",padding:12,border:"1px solid #d8d5cd",borderRadius:9,font:"inherit",lineHeight:1.5,resize:"vertical"}} placeholder={isMath?"Skriv beregninger, forklaring eller svar her…":isDanishAnalysis?"Skriv dit tekstspor og din forklaring her…":isDanishCommunication?"Skriv korte stikord — ikke hele sætninger, du skal læse op…":"Skriv din del her…"}/></label>)}</div>

   {isDanishCommunication&&<section style={{...card,marginTop:16,background:"#f7f4ed"}}><strong style={{fontFamily:"Georgia,serif",fontSize:19}}>Øv uden skærmen</strong><p style={{margin:"8px 0 0",lineHeight:1.55,color:"#606962"}}>Når dine stikord er klar, så rejs dig, kig væk fra skærmen og prøv det højt. Ret kun planen bagefter, hvis du opdager noget, der skal ændres.</p></section>}
   <section style={{...card,marginTop:16}}><strong style={{fontFamily:"Georgia,serif",fontSize:19}}>{isMath?"Tjek din matematik":isDanishCommunication?"Tjek din formidling":isDanishAnalysis?"Tjek din analyse":isDanishWriting?"Læs din tekst igennem":"Tjek din besvarelse"}</strong><div style={{display:"grid",gap:7,marginTop:10}}>{workspace.checklist.map(x=><label key={x} style={{display:"flex",gap:9,alignItems:"start"}}><input type="checkbox"/><span>{x}</span></label>)}</div></section>
   <p style={{marginTop:16,color:message?"#8b342e":"#687168",fontWeight:700}}>{saveStatus}</p>
  </section>
 </main>;
}

function FocusChips({values}:{values:string[]}){return <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{values.map(x=><span key={x} style={focusChip}>{x}</span>)}</div>}
const supportHead:React.CSSProperties={display:"flex",justifyContent:"space-between",gap:10,alignItems:"start",flexWrap:"wrap"};
const supportTitle:React.CSSProperties={display:"block",fontFamily:"Georgia,serif",fontSize:20};
const coach:React.CSSProperties={margin:"9px 0 5px",lineHeight:1.55};
const innerTip:React.CSSProperties={marginTop:10,padding:"10px 11px",borderRadius:9,background:"white",border:"1px solid #d8e0da"};
const levelTag:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:.7,padding:"5px 7px",borderRadius:999,background:"#dce9df",color:"#476452"};
const focusChip:React.CSSProperties={fontSize:11,fontWeight:800,padding:"5px 7px",borderRadius:999,background:"white",border:"1px solid #d7dfd8",color:"#56675d"};
