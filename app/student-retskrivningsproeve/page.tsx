"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {studentSupabase} from "../../lib/studentSupabase";
import {clearStudentSession,getStudentSessionToken} from "../../lib/studentSession";
import {buildSpellingExamSet,FP9_EXAM_SECTIONS,spellingExamSectionCounts,SPELLING_EXAM_LEVELS,type SpellingExamQuestion} from "../student-grammar/fp9-spelling-exam-bank";

function normalize(value:string){return value.normalize("NFC").trim().toLocaleLowerCase("da-DK").replace(/\s+/g," ").replace(/\s+([,.!?;:])/g,"$1")}
function correct(q:SpellingExamQuestion,value=""){const accepted=q.acceptedAnswers?.length?q.acceptedAnswers:[q.answer];return accepted.some(a=>normalize(a)===normalize(value))}
function formatTime(seconds:number|null){if(seconds===null)return "Uden tid";const m=Math.floor(seconds/60),s=seconds%60;return `${m}:${String(s).padStart(2,"0")}`}
function isWritten(q:SpellingExamQuestion){return q.kind==="text"||q.kind==="rewrite"}

type Assignment={id:number;title:string;time_limit_minutes:number|null;question_count:number;target_grade:number;submitted?:boolean;score?:number|null;max_score?:number|null};
const sectionInfo:Record<string,{part:string;title:string;description:string}>={
 "Diktat":{part:"DEL 1",title:"Diktat",description:"Lyt til hver sætning og skriv det ord, der mangler. Du kan høre sætningen igen under denne træning."},
 "Ét eller flere ord":{part:"DEL 2",title:"Ét eller flere ord",description:"Se efter ordgrænser, sammensatte ord og store eller små bogstaver. Skriv teksten korrekt."},
 "Sprogopgave":{part:"DEL 2",title:"Sprogopgave",description:"Denne del varierer mellem prøvesæt. Du kan fx møde Rigtig form eller Hvilken ordklasse?"},
 "Fra nutid til datid":{part:"DEL 2",title:"Fra nutid til datid",description:"Skriv udsagnsordet i datid. Brug resten af sætningen til at holde styr på tid og betydning."},
 "Komma":{part:"DEL 2",title:"Komma",description:"Sæt de kommaer, der mangler. Hvor startkomma er valgfrit, accepterer træningen begge kommasystemer."},
 "Ret en tekst":{part:"DEL 2",title:"Ret en tekst",description:"Find og ret retskrivningsfejlene. Kommateringen skal ikke ændres."},
};

export default function StudentSpellingExam(){
 const[loading,setLoading]=useState(true),[error,setError]=useState(""),[token,setToken]=useState(""),[assignment,setAssignment]=useState<Assignment|null>(null);
 const[questions,setQuestions]=useState<SpellingExamQuestion[]>([]),[answers,setAnswers]=useState<Record<number,string>>({}),[remaining,setRemaining]=useState<number|null>(null);
 const[submitted,setSubmitted]=useState(false),[saving,setSaving]=useState(false),[score,setScore]=useState<number|null>(null),[elapsed,setElapsed]=useState<number|null>(null),[timedOut,setTimedOut]=useState(false),[speechMessage,setSpeechMessage]=useState("");
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
 const groups=useMemo(()=>FP9_EXAM_SECTIONS.map(section=>({section,rows:questions.map((question,index)=>({question,index})).filter(row=>row.question.examSection===section)})),[questions]);
 const sprogVariant=questions.find(q=>q.examSection==="Sprogopgave")?.taskVariant;

 function speak(text:string|undefined){
  if(!text)return;
  if(typeof window==="undefined"||!("speechSynthesis" in window)){setSpeechMessage("Oplæsning virker ikke i denne browser. Bed din lærer læse sætningen højt.");return}
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang="da-DK";utterance.rate=.86;utterance.pitch=1;
  window.speechSynthesis.speak(utterance);setSpeechMessage("");
 }

 async function submitExam(fromTimer=false){
  if(!assignment||!token||saving||submitted||questions.length===0)return;
  setSaving(true);
  const points=questions.reduce((sum,q,i)=>sum+(correct(q,answers[i])?1:0),0);
  const snapshot=Object.fromEntries(questions.map((q,i)=>[i,{question:q.q,section:q.examSection,sourceTopic:q.sourceTopic,studentAnswer:answers[i]||"",correctAnswer:q.answer,correct:correct(q,answers[i]),explanation:q.why,kind:q.kind||"choice",taskVariant:q.taskVariant||null}]));
  const{data,error:saveError}=await studentSupabase.rpc("save_student_spelling_exam_attempt",{p_session_token:token,p_assignment_id:assignment.id,p_answers:snapshot,p_score:points,p_max_score:questions.length});
  if(saveError||!data?.ok){setError("Prøven kunne ikke afleveres. Prøv igen.");setSaving(false);return}
  setScore(Number(data.score??points));setElapsed(data.elapsed_seconds===undefined?null:Number(data.elapsed_seconds));setTimedOut(Boolean(data.timed_out||fromTimer));setSubmitted(true);setSaving(false);window.speechSynthesis?.cancel();window.scrollTo({top:0,behavior:"smooth"});
 }

 useEffect(()=>{
  if(remaining===null||submitted||loading)return;
  if(remaining<=0){if(!autoSubmitted.current){autoSubmitted.current=true;void submitExam(true)}return}
  const timer=window.setTimeout(()=>setRemaining(v=>v===null?null:Math.max(0,v-1)),1000);return()=>window.clearTimeout(timer);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[remaining,submitted,loading]);

 if(loading)return <main style={{padding:50}}>Åbner prøvetræningen…</main>;
 const grade=Math.max(6,Math.min(9,Number(assignment?.target_grade||9))) as 6|7|8|9;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"28px 20px 80px",color:"#26342e"}}><section style={{maxWidth:940,margin:"auto"}}>
  <a href="/?student=1" style={{color:"#526b60",fontWeight:850,textDecoration:"none"}}>← Til mit Klasseværelse</a>
  {error&&!assignment?<div style={card}><h1>Hov</h1><p>{error}</p></div>:<>
   <div style={{marginTop:28,display:"flex",justifyContent:"space-between",alignItems:"start",gap:16,flexWrap:"wrap"}}><div><p style={eyebrow}>RETSKRIVNING · {grade}. KLASSES NIVEAU</p><h1 style={{fontFamily:"Georgia,serif",fontSize:40,margin:"6px 0 8px"}}>{assignment?.title||"Træn retskrivningsprøven"}</h1><p style={{color:"#6b736e",fontSize:17,lineHeight:1.55,maxWidth:690}}>{SPELLING_EXAM_LEVELS[grade].description} Klasseværelsets opgaver er egne træningsopgaver og ikke en officiel prøve.</p></div>
    {!submitted&&<div style={{...card,padding:"14px 18px",minWidth:145,textAlign:"center",position:"sticky",top:12,zIndex:3}}><div style={{fontSize:11,fontWeight:900,letterSpacing:1}}>TID</div><div style={{fontFamily:"Georgia,serif",fontWeight:900,fontSize:28,color:remaining!==null&&remaining<300?"#9a4e43":"#365044"}}>{formatTime(remaining)}</div></div>}
   </div>

   {submitted?<div style={{...card,marginTop:24}}><p style={eyebrow}>{timedOut?"TIDEN UDLØB · AUTOMATISK AFLEVERET":"AFLEVERET"}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:34,margin:"6px 0"}}>{score??assignment?.score??0} / {questions.length||assignment?.max_score||assignment?.question_count||30}</h2>{elapsed!==null&&<p>Tidsforbrug: <strong>{formatTime(elapsed)}</strong></p>}{questions.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8,marginTop:18}}>{Object.entries(sectionCounts).map(([section,total])=><div key={section} style={{padding:11,border:"1px solid #e1ddd5",borderRadius:9}}><strong style={{display:"block",fontSize:13}}>{section}</strong><span>{sectionResults[section]||0} / {total}</span></div>)}</div>}{questions.length>0&&<div style={{display:"grid",gap:9,marginTop:20}}>{questions.map((q,i)=><div key={i} style={{padding:12,borderRadius:9,background:correct(q,answers[i])?"#edf5ef":"#fff3ef",border:"1px solid #e1ddd5"}}><strong>{correct(q,answers[i])?"✓":"✕"} {q.examSection}</strong><div style={{marginTop:4}}>{q.q}</div>{q.dictationText&&<div style={{fontSize:13,color:"#65716a",marginTop:4}}>Diktatsætning: {q.dictationText}</div>}{!correct(q,answers[i])&&<div style={{marginTop:5,fontSize:13}}>Dit svar: <strong>{answers[i]||"—"}</strong> · Korrekt: <strong>{q.answer}</strong></div>}<div style={{fontSize:13,color:"#626a65",marginTop:4}}>{q.why}</div></div>)}</div>}<button onClick={()=>window.location.href="/?student=1"} style={primary}>Til mine opgaver →</button></div>:
   <>{error&&<div style={{...card,background:"#fff3cd",marginTop:14,fontWeight:800}}>{error}</div>}
    <div style={overview}><div><span style={partChip}>DEL 1</span><strong>Diktat · 5 opgaver</strong></div><span style={arrow}>→</span><div><span style={partChip}>DEL 2</span><strong>5 sproglige opgavetyper · 25 opgaver</strong></div></div>
    {sprogVariant&&<div style={notice}>I dette prøvesæt er <strong>Sprogopgaven</strong>: {sprogVariant==="ordklasse"?"Hvilken ordklasse?":"Rigtig form"}. I et andet prøvesæt kan du møde den anden variant.</div>}
    {speechMessage&&<div style={{...notice,background:"#fff3cd"}}>{speechMessage}</div>}
    <div style={{display:"grid",gap:26,marginTop:24}}>{groups.map(({section,rows})=>{const info=sectionInfo[section];return <section key={section} style={sectionCard}><div style={sectionHeader}><div><span style={partChip}>{info.part}</span><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"7px 0 4px"}}>{info.title}{section==="Sprogopgave"&&sprogVariant?` · ${sprogVariant==="ordklasse"?"Hvilken ordklasse?":"Rigtig form"}`:""}</h2><p style={{color:"#69716c",lineHeight:1.5,margin:"0 0 4px"}}>{info.description}</p></div><span style={sectionCount}>{rows.length} opgaver</span></div>
      <div style={{display:"grid",gap:12,marginTop:17}}>{rows.map(({question:q,index:i},localIndex)=><article key={`${section}-${i}`} style={questionCard}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}><span style={eyebrow}>OPGAVE {localIndex+1} AF {rows.length}</span>{answers[i]?.trim()&&<span style={answeredChip}>Besvaret ✓</span>}</div>{q.instruction&&<p style={{fontWeight:800,color:"#526b60",margin:"10px 0 4px"}}>{q.instruction}</p>}<h3 style={{fontFamily:"Georgia,serif",fontSize:20,lineHeight:1.45,margin:"9px 0 13px"}}>{q.q}</h3>{q.dictationText&&<button type="button" onClick={()=>speak(q.dictationText)} style={listenButton}>🔊 Hør sætningen</button>}{q.dictationText&&<p style={{fontSize:12,color:"#7a817c",margin:"7px 0 11px"}}>Lyt til hele sætningen. Skriv kun ordet, der mangler i feltet.</p>}{isWritten(q)?q.kind==="rewrite"?<textarea value={answers[i]||""} onChange={e=>setAnswers(v=>({...v,[i]:e.target.value}))} rows={q.examSection==="Ret en tekst"?4:3} placeholder={q.placeholder||"Skriv dit svar…"} style={input}/>:<input value={answers[i]||""} onChange={e=>setAnswers(v=>({...v,[i]:e.target.value}))} placeholder={q.placeholder||"Skriv dit svar…"} style={input}/>:<div style={{display:"grid",gap:7}}>{q.options.map(option=><button key={option} onClick={()=>setAnswers(v=>({...v,[i]:option}))} style={{padding:"11px 13px",borderRadius:8,textAlign:"left",border:answers[i]===option?"2px solid #526b60":"1px solid #ddd9d0",background:answers[i]===option?"#edf1ec":"white",fontWeight:answers[i]===option?850:650,cursor:"pointer"}}>{option}</button>)}</div>}</article>)}</div>
     </section>})}</div>
    <div style={{...card,marginTop:22,position:"sticky",bottom:12,boxShadow:"0 8px 30px rgba(30,45,38,.14)"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><div><strong>{answered} af {questions.length} besvaret</strong>{answered<questions.length&&<div style={{fontSize:13,color:"#7b6a48",marginTop:4}}>{questions.length-answered} mangler endnu</div>}</div><span style={chip}>{Math.round(answered/questions.length*100)||0}% færdig</span></div><button disabled={saving} onClick={()=>submitExam(false)} style={{...primary,width:"100%",marginTop:10,opacity:saving?0.6:1}}>{saving?"Afleverer…":`Aflever prøvetræning${answered<questions.length?` · ${questions.length-answered} ubesvarede`:""}`}</button></div>
   </>}
  </>}
 </section></main>;
}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:20};
const sectionCard:React.CSSProperties={background:"#f9f8f4",border:"1px solid #ddd9d0",borderRadius:16,padding:22};
const questionCard:React.CSSProperties={background:"white",border:"1px solid #e1ddd5",borderRadius:12,padding:18};
const sectionHeader:React.CSSProperties={display:"flex",justifyContent:"space-between",alignItems:"start",gap:14,flexWrap:"wrap"};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const chip:React.CSSProperties={fontSize:11,fontWeight:850,padding:"5px 8px",borderRadius:999,background:"#edf1ec",color:"#526b60"};
const partChip:React.CSSProperties={display:"inline-block",fontSize:10,fontWeight:900,letterSpacing:1,padding:"4px 7px",borderRadius:999,background:"#243d33",color:"white",marginRight:7};
const answeredChip:React.CSSProperties={fontSize:10,fontWeight:900,padding:"4px 7px",borderRadius:999,background:"#e4efe7",color:"#42614f"};
const sectionCount:React.CSSProperties={fontSize:11,fontWeight:900,padding:"6px 9px",borderRadius:999,background:"#edf1ec",color:"#526b60",whiteSpace:"nowrap"};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"12px 13px",border:"2px solid #d8d5cd",borderRadius:8,font:"inherit",fontSize:16,background:"white"};
const primary:React.CSSProperties={marginTop:18,padding:"12px 16px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const listenButton:React.CSSProperties={border:"1px solid #c9d4cc",background:"#edf1ec",color:"#365044",borderRadius:9,padding:"9px 12px",fontWeight:900,cursor:"pointer"};
const overview:React.CSSProperties={display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",marginTop:20,padding:"14px 16px",borderRadius:12,background:"#e9f0eb",border:"1px solid #d6e0d8"};
const arrow:React.CSSProperties={fontSize:20,color:"#708078",fontWeight:900};
const notice:React.CSSProperties={marginTop:12,padding:"11px 13px",borderRadius:9,background:"#fff7e8",border:"1px solid #ead8ad",fontSize:13,lineHeight:1.5,color:"#665431"};
