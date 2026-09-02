"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {studentSupabase} from "../../lib/studentSupabase";
import {clearStudentSession,getStudentSessionToken} from "../../lib/studentSession";
import {buildSpellingExamSet,spellingExamSectionCounts,SPELLING_EXAM_LEVELS,type SpellingExamQuestion} from "../student-grammar/fp9-spelling-exam-bank";

function normalize(value:string){return value.normalize("NFC").trim().toLocaleLowerCase("da-DK").replace(/\s+/g," ").replace(/\s+([,.!?;:])/g,"$1")}
function correct(q:SpellingExamQuestion,value=""){const accepted=q.acceptedAnswers?.length?q.acceptedAnswers:[q.answer];return accepted.some(a=>normalize(a)===normalize(value))}
function formatTime(seconds:number|null){if(seconds===null)return "Uden tid";const m=Math.floor(seconds/60),s=seconds%60;return `${m}:${String(s).padStart(2,"0")}`}
function isWritten(q:SpellingExamQuestion){return q.kind==="text"||q.kind==="rewrite"}

type Assignment={id:number;title:string;time_limit_minutes:number|null;question_count:number;target_grade:number;submitted?:boolean;score?:number|null;max_score?:number|null};

export default function StudentSpellingExam(){
 const[loading,setLoading]=useState(true),[error,setError]=useState(""),[token,setToken]=useState(""),[assignment,setAssignment]=useState<Assignment|null>(null);
 const[questions,setQuestions]=useState<SpellingExamQuestion[]>([]),[answers,setAnswers]=useState<Record<number,string>>({}),[remaining,setRemaining]=useState<number|null>(null);
 const[submitted,setSubmitted]=useState(false),[saving,setSaving]=useState(false),[score,setScore]=useState<number|null>(null),[elapsed,setElapsed]=useState<number|null>(null),[timedOut,setTimedOut]=useState(false);
 const autoSubmitted=useRef(false);

 useEffect(()=>{(async()=>{
  const session=getStudentSessionToken(),id=Number(new URLSearchParams(window.location.search).get("assignment"));
  if(!session||!id){setError("Åbn prøvetræningen fra dit Klasseværelse.");setLoading(false);return}
  const{data:list,error:listError}=await studentSupabase.rpc("student_session_spelling_exam_assignments",{p_session_token:session});
  if(listError||!list?.ok){clearStudentSession();setError("Din elevsession er udløbet. Log ind igen.");setLoading(false);return}
  const found=(list.assignments||[]).find((x:any)=>Number(x.id)===id) as Assignment|undefined;
  if(!found){setError("Denne prøvetræning er ikke tildelt dig.");setLoading(false);return}
  setToken(session);setAssignment(found);
  if(found.submitted){setSubmitted(true);setScore(Number(found.score||0));setLoading(false);return}
  const{data:start,error:startError}=await studentSupabase.rpc("start_student_spelling_exam_session",{p_session_token:session,p_assignment_id:id});
  if(startError||!start?.ok){setError("Prøven kunne ikke startes.");setLoading(false);return}
  if(start.already_submitted){setSubmitted(true);setScore(Number(found.score||0));setLoading(false);return}
  try{setQuestions(buildSpellingExamSet(Number(start.question_seed),Number(start.question_count||30),Number(start.target_grade||found.target_grade||9)))}catch{setError("Prøvesættet kunne ikke bygges. Kontakt din lærer.");setLoading(false);return}
  setRemaining(start.remaining_seconds===null?null:Number(start.remaining_seconds));setLoading(false);
 })()},[]);

 const answered=questions.filter((_,i)=>Boolean(answers[i]?.trim())).length;
 const sectionCounts=useMemo(()=>spellingExamSectionCounts(questions),[questions]);
 const sectionResults=useMemo(()=>Object.fromEntries(Object.keys(sectionCounts).map(section=>[section,questions.reduce((sum,q,i)=>sum+(q.examSection===section&&correct(q,answers[i])?1:0),0)])),[questions,answers,sectionCounts]);

 async function submitExam(fromTimer=false){
  if(!assignment||!token||saving||submitted||questions.length===0)return;
  setSaving(true);
  const points=questions.reduce((sum,q,i)=>sum+(correct(q,answers[i])?1:0),0);
  const snapshot=Object.fromEntries(questions.map((q,i)=>[i,{question:q.q,section:q.examSection,sourceTopic:q.sourceTopic,studentAnswer:answers[i]||"",correctAnswer:q.answer,correct:correct(q,answers[i]),explanation:q.why,kind:q.kind||"choice"}]));
  const{data,error:saveError}=await studentSupabase.rpc("save_student_spelling_exam_attempt",{p_session_token:token,p_assignment_id:assignment.id,p_answers:snapshot,p_score:points,p_max_score:questions.length});
  if(saveError||!data?.ok){setError("Prøven kunne ikke afleveres. Prøv igen.");setSaving(false);return}
  setScore(Number(data.score??points));setElapsed(data.elapsed_seconds===undefined?null:Number(data.elapsed_seconds));setTimedOut(Boolean(data.timed_out||fromTimer));setSubmitted(true);setSaving(false);window.scrollTo({top:0,behavior:"smooth"});
 }

 useEffect(()=>{
  if(remaining===null||submitted||loading)return;
  if(remaining<=0){if(!autoSubmitted.current){autoSubmitted.current=true;void submitExam(true)}return}
  const timer=window.setTimeout(()=>setRemaining(v=>v===null?null:Math.max(0,v-1)),1000);return()=>window.clearTimeout(timer);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[remaining,submitted,loading]);

 if(loading)return <main style={{padding:50}}>Åbner prøvetræningen…</main>;
 const grade=Math.max(6,Math.min(9,Number(assignment?.target_grade||9))) as 6|7|8|9;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"28px 20px 70px",color:"#26342e"}}><section style={{maxWidth:900,margin:"auto"}}>
  <a href="/?student=1" style={{color:"#526b60",fontWeight:850,textDecoration:"none"}}>← Til mit Klasseværelse</a>
  {error&&!assignment?<div style={card}><h1>Hov</h1><p>{error}</p></div>:<>
   <div style={{marginTop:28,display:"flex",justifyContent:"space-between",alignItems:"start",gap:16,flexWrap:"wrap"}}><div><p style={eyebrow}>RETSKRIVNING · {grade}. KLASSES NIVEAU</p><h1 style={{fontFamily:"Georgia,serif",fontSize:40,margin:"6px 0 8px"}}>{assignment?.title||"Træn retskrivningsprøven"}</h1><p style={{color:"#6b736e",fontSize:17,lineHeight:1.5,maxWidth:650}}>{SPELLING_EXAM_LEVELS[grade].description} Opgaverne er Klasseværelsets egne og er ikke en officiel prøve.</p></div>
    {!submitted&&<div style={{...card,padding:"14px 18px",minWidth:145,textAlign:"center",position:"sticky",top:12,zIndex:3}}><div style={{fontSize:11,fontWeight:900,letterSpacing:1}}>TID</div><div style={{fontFamily:"Georgia,serif",fontWeight:900,fontSize:28,color:remaining!==null&&remaining<300?"#9a4e43":"#365044"}}>{formatTime(remaining)}</div></div>}
   </div>
   {submitted?<div style={{...card,marginTop:24}}><p style={eyebrow}>{timedOut?"TIDEN UDLØB · AUTOMATISK AFLEVERET":"AFLEVERET"}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:34,margin:"6px 0"}}>{score??assignment?.score??0} / {questions.length||assignment?.max_score||assignment?.question_count||30}</h2>{elapsed!==null&&<p>Tidsforbrug: <strong>{formatTime(elapsed)}</strong></p>}{questions.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8,marginTop:18}}>{Object.entries(sectionCounts).map(([section,total])=><div key={section} style={{padding:11,border:"1px solid #e1ddd5",borderRadius:9}}><strong style={{display:"block",fontSize:13}}>{section}</strong><span>{sectionResults[section]||0} / {total}</span></div>)}</div>}{questions.length>0&&<div style={{display:"grid",gap:9,marginTop:20}}>{questions.map((q,i)=><div key={i} style={{padding:12,borderRadius:9,background:correct(q,answers[i])?"#edf5ef":"#fff3ef",border:"1px solid #e1ddd5"}}><strong>{correct(q,answers[i])?"✓":"✕"} {q.q}</strong>{!correct(q,answers[i])&&<div style={{marginTop:5,fontSize:13}}>Dit svar: <strong>{answers[i]||"—"}</strong> · Korrekt: <strong>{q.answer}</strong></div>}<div style={{fontSize:13,color:"#626a65",marginTop:4}}>{q.why}</div></div>)}</div>}<button onClick={()=>window.location.href="/?student=1"} style={primary}>Til mine opgaver →</button></div>:
   <>{error&&<div style={{...card,background:"#fff3cd",marginTop:14,fontWeight:800}}>{error}</div>}<div style={{display:"flex",gap:7,flexWrap:"wrap",margin:"18px 0"}}>{Object.entries(sectionCounts).map(([section,total])=><span key={section} style={chip}>{section} · {total}</span>)}</div><div style={{display:"grid",gap:14}}>{questions.map((q,i)=><article key={`${q.examSection}-${i}`} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><span style={eyebrow}>OPGAVE {i+1} AF {questions.length}</span><span style={chip}>{q.examSection}</span></div><h2 style={{fontFamily:"Georgia,serif",fontSize:21,lineHeight:1.4}}>{q.q}</h2>{isWritten(q)?q.kind==="rewrite"?<textarea value={answers[i]||""} onChange={e=>setAnswers(v=>({...v,[i]:e.target.value}))} rows={3} placeholder={q.placeholder||"Skriv dit svar…"} style={input}/>:<input value={answers[i]||""} onChange={e=>setAnswers(v=>({...v,[i]:e.target.value}))} placeholder={q.placeholder||"Skriv dit svar…"} style={input}/>:<div style={{display:"grid",gap:7}}>{q.options.map(option=><button key={option} onClick={()=>setAnswers(v=>({...v,[i]:option}))} style={{padding:"11px 13px",borderRadius:8,textAlign:"left",border:answers[i]===option?"2px solid #526b60":"1px solid #ddd9d0",background:answers[i]===option?"#edf1ec":"white",fontWeight:answers[i]===option?850:650,cursor:"pointer"}}>{option}</button>)}</div>}</article>)}</div><div style={{...card,marginTop:18,position:"sticky",bottom:12,boxShadow:"0 8px 30px rgba(30,45,38,.12)"}}><strong>{answered} af {questions.length} besvaret</strong>{answered<questions.length&&<p style={{fontSize:13,color:"#7b6a48",margin:"5px 0"}}>Du må gerne aflevere med ubesvarede opgaver. De tæller som forkerte.</p>}<button disabled={saving} onClick={()=>submitExam(false)} style={{...primary,width:"100%",marginTop:8,opacity:saving?0.6:1}}>{saving?"Afleverer…":`Aflever prøve${answered<questions.length?` · ${questions.length-answered} ubesvarede`:""}`}</button></div></>}
  </>}
 </section></main>;
}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:20};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.5,color:"#718077",margin:0};
const chip:React.CSSProperties={fontSize:11,fontWeight:850,padding:"5px 8px",borderRadius:999,background:"#edf1ec",color:"#526b60"};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"12px 13px",border:"2px solid #d8d5cd",borderRadius:8,font:"inherit",fontSize:16};
const primary:React.CSSProperties={marginTop:18,padding:"12px 16px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
