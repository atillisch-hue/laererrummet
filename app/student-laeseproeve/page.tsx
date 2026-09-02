"use client";

import {useEffect,useMemo,useRef,useState} from "react";
import {studentSupabase} from "../../lib/studentSupabase";
import {clearStudentSession,getStudentSessionToken} from "../../lib/studentSession";
import {buildReadingExamSet,readingQuestionCount,READING_LEVELS,READING_STRATEGIES,type ReadingExamPart,type ReadingQuestion} from "../student-reading-exam/reading-exam-bank";

type SavedAnswer={question?:string;questionId?:string;textId?:string;studentAnswer?:string};
type Assignment={id:number;title:string;time_limit_minutes:number|null;question_count:number;target_grade:number;submitted?:boolean;score?:number|null;max_score?:number|null;answers?:Record<string,SavedAnswer>|null;elapsed_seconds?:number|null};

function formatTime(seconds:number|null){if(seconds===null)return "Uden tid";const m=Math.floor(seconds/60),s=seconds%60;return `${m}:${String(s).padStart(2,"0")}`}
function key(part:ReadingExamPart,question:ReadingQuestion){return `${part.id}:${question.id}`}
function tipFor(section:string,grade:number){
 const tips:Record<string,[string,string]>={
  "Søgelæsning":["Læs ikke alt fra start. Find først det ord, tidspunkt eller krav, spørgsmålet leder efter.","Brug overskrifter, tal og nøgleord til at hoppe direkte til det relevante sted."],
  "Informerende tekst":["Skim titel og afsnit først. Spørg: Hvad forklarer teksten overordnet?","Når du svarer, så find det afsnit, der kan bevise dit svar."],
  "Fortællende tekst":["Hold øje med hvad personen gør, tænker og ændrer undervejs.","Ved inferens: find mindst ét tekstspor, der gør din slutning sandsynlig."],
  "Argumenterende tekst":["Find skribentens hovedsynspunkt før du går ned i detaljerne.","Skeln mellem påstand, argument, eksempel og modargument."],
  "Fagtekst":["Stop ved fagord. Brug sætningerne omkring ordet til at forstå betydningen.","Skeln mellem det teksten ved, det den forklarer, og de eksempler den bruger."],
  "Cloze":["Læs hele sætningen — og gerne sætningen før og efter — før du vælger ord.","Tjek både betydning og grammatik: passer ordet ind i sammenhængen?"],
 };
 const selected=tips[section]||["Skab overblik før du læser tæt.","Find tekstspor til dit svar."];
 if(grade<=6)return `${selected[0]} ${selected[1]}`;
 if(grade===7)return selected[0];
 return "";
}

export default function StudentReadingExam(){
 const[loading,setLoading]=useState(true),[error,setError]=useState(""),[token,setToken]=useState(""),[assignment,setAssignment]=useState<Assignment|null>(null),[parts,setParts]=useState<ReadingExamPart[]>([]),[partIndex,setPartIndex]=useState(0);
 const[answers,setAnswers]=useState<Record<string,string>>({}),[remaining,setRemaining]=useState<number|null>(null),[submitted,setSubmitted]=useState(false),[saving,setSaving]=useState(false),[score,setScore]=useState<number|null>(null),[elapsed,setElapsed]=useState<number|null>(null),[timedOut,setTimedOut]=useState(false);
 const autoSubmitted=useRef(false);

 useEffect(()=>{(async()=>{
  const session=getStudentSessionToken(),id=Number(new URLSearchParams(window.location.search).get("assignment"));
  if(!session||!id){setError("Åbn læseprøven fra dit Klasseværelse.");setLoading(false);return}
  const{data:list,error:listError}=await studentSupabase.rpc("student_session_reading_exam_assignments",{p_session_token:session});
  if(listError||!list?.ok){clearStudentSession();setError("Din elevsession er udløbet. Log ind igen.");setLoading(false);return}
  const found=(list.assignments||[]).find((x:any)=>Number(x.id)===id) as Assignment|undefined;
  if(!found){setError("Denne læseprøve er ikke tildelt dig.");setLoading(false);return}
  setToken(session);setAssignment(found);
  const{data:start,error:startError}=await studentSupabase.rpc("start_student_reading_exam_session",{p_session_token:session,p_assignment_id:id});
  if(startError||!start?.ok){setError("Læseprøven kunne ikke startes.");setLoading(false);return}
  let built:ReadingExamPart[]=[];
  try{built=buildReadingExamSet(Number(start.question_seed),Number(start.target_grade||found.target_grade||9));setParts(built)}catch{setError("Læseprøvesættet kunne ikke bygges. Kontakt din lærer.");setLoading(false);return}
  if(found.answers){
   const restored:Record<string,string>={};
   for(const saved of Object.values(found.answers)){
    if(!saved?.studentAnswer)continue;
    if(saved.textId&&saved.questionId){restored[`${saved.textId}:${saved.questionId}`]=String(saved.studentAnswer);continue}
    const part=built.find(p=>p.id===saved.textId),question=part?.questions.find(question=>question.q===saved.question);
    if(part&&question)restored[key(part,question)]=String(saved.studentAnswer);
   }
   setAnswers(restored);
  }
  setRemaining(start.remaining_seconds===null?null:Number(start.remaining_seconds));
  if(found.elapsed_seconds!==null&&found.elapsed_seconds!==undefined){const seconds=Number(found.elapsed_seconds);setElapsed(seconds);if(found.time_limit_minutes)setTimedOut(seconds>found.time_limit_minutes*60)}
  if(found.submitted||start.already_submitted){setSubmitted(true);setScore(Number(found.score||0))}
  setLoading(false);
 })()},[]);

 const total=useMemo(()=>readingQuestionCount(parts),[parts]);
 const flatQuestions=useMemo(()=>parts.flatMap(part=>part.questions.map(question=>({part,question}))),[parts]);
 const answered=flatQuestions.filter(({part,question})=>Boolean(answers[key(part,question)])).length;
 const current=parts[partIndex]||null;
 const currentAnswered=current?current.questions.filter(question=>Boolean(answers[key(current,question)])).length:0;
 const strategyResults=useMemo(()=>Object.fromEntries(READING_STRATEGIES.map(strategy=>{const qs=flatQuestions.filter(x=>x.question.strategy===strategy);return[strategy,{correct:qs.filter(({part,question})=>answers[key(part,question)]===question.answer).length,total:qs.length}]})),[flatQuestions,answers]);
 const sectionResults=useMemo(()=>Object.fromEntries(parts.map(part=>[part.section,{correct:part.questions.filter(question=>answers[key(part,question)]===question.answer).length,total:part.questions.length}])),[parts,answers]);

 async function submitExam(fromTimer=false){
  if(!assignment||!token||saving||submitted||!total)return;
  setSaving(true);
  const points=flatQuestions.reduce((sum,{part,question})=>sum+(answers[key(part,question)]===question.answer?1:0),0);
  const snapshot=Object.fromEntries(flatQuestions.map(({part,question},i)=>[i,{question:question.q,questionId:question.id,section:part.section,strategy:question.strategy,studentAnswer:answers[key(part,question)]||"",correctAnswer:question.answer,correct:answers[key(part,question)]===question.answer,explanation:question.explanation,textId:part.id}]));
  const{data,error:saveError}=await studentSupabase.rpc("save_student_reading_exam_attempt",{p_session_token:token,p_assignment_id:assignment.id,p_answers:snapshot,p_score:points,p_max_score:total});
  if(saveError||!data?.ok){setError("Læseprøven kunne ikke afleveres. Prøv igen.");setSaving(false);return}
  setScore(Number(data.score??points));setElapsed(data.elapsed_seconds===undefined?null:Number(data.elapsed_seconds));setTimedOut(Boolean(data.timed_out||fromTimer));setSubmitted(true);setSaving(false);window.scrollTo({top:0,behavior:"smooth"});
 }

 useEffect(()=>{
  if(remaining===null||submitted||loading)return;
  if(remaining<=0){if(!autoSubmitted.current){autoSubmitted.current=true;void submitExam(true)}return}
  const timer=window.setTimeout(()=>setRemaining(v=>v===null?null:Math.max(0,v-1)),1000);return()=>window.clearTimeout(timer);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[remaining,submitted,loading]);

 if(loading)return <main style={{padding:50}}>Åbner læseprøven…</main>;
 const grade=Math.max(6,Math.min(9,Number(assignment?.target_grade||9))) as 6|7|8|9;
 const level=READING_LEVELS[grade];
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"28px 20px 70px",color:"#26342e"}}><section style={{maxWidth:1050,margin:"auto"}}>
  <a href="/?student=1" style={{color:"#526b60",fontWeight:850,textDecoration:"none"}}>← Til mit Klasseværelse</a>
  {error&&!assignment?<div style={card}><h1>Hov</h1><p>{error}</p></div>:<>
   <div style={{marginTop:28,display:"flex",justifyContent:"space-between",alignItems:"start",gap:16,flexWrap:"wrap"}}><div><p style={eyebrow}>LÆSESTRATEGIER · {grade}. KLASSES NIVEAU</p><h1 style={{fontFamily:"Georgia,serif",fontSize:40,margin:"6px 0 8px"}}>{assignment?.title||"Træn læseprøven"}</h1><p style={{color:"#6b736e",fontSize:17,lineHeight:1.5,maxWidth:720}}>{level.description} Opgaverne er Klasseværelsets egne og er lavet til at træne prøveformen og læsestrategier.</p></div>
    {!submitted&&<div style={{...card,padding:"14px 18px",minWidth:145,textAlign:"center",position:"sticky",top:12,zIndex:4}}><div style={{fontSize:11,fontWeight:900,letterSpacing:1}}>TID</div><div style={{fontFamily:"Georgia,serif",fontWeight:900,fontSize:28,color:remaining!==null&&remaining<300?"#9a4e43":"#365044"}}>{formatTime(remaining)}</div></div>}
   </div>
   {submitted?<div style={{...card,marginTop:24}}><p style={eyebrow}>{timedOut?"TIDEN UDLØB · AUTOMATISK AFLEVERET":"AFLEVERET"}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:34,margin:"6px 0"}}>{score??assignment?.score??0} / {total||assignment?.max_score||assignment?.question_count||level.questionCount}</h2>{elapsed!==null&&<p>Tidsforbrug: <strong>{formatTime(elapsed)}</strong></p>}{total>0&&<><h3 style={{fontFamily:"Georgia,serif",marginTop:24}}>Dine læsestrategier</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8}}>{Object.entries(strategyResults).filter(([,row])=>row.total>0).map(([strategy,row])=><div key={strategy} style={resultBox}><strong>{strategy}</strong><span>{row.correct} / {row.total}</span></div>)}</div><h3 style={{fontFamily:"Georgia,serif",marginTop:24}}>Teksttyper</h3><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{Object.entries(sectionResults).map(([section,row])=><span key={section} style={chip}>{section}: {row.correct}/{row.total}</span>)}</div><div style={{display:"grid",gap:12,marginTop:24}}>{parts.map(part=><details key={part.id} style={{background:"#faf9f6",border:"1px solid #e2ded6",borderRadius:10,padding:12}}><summary style={{fontWeight:900,cursor:"pointer"}}>{part.title} · {sectionResults[part.section]?.correct||0}/{part.questions.length}</summary><div style={{display:"grid",gap:8,marginTop:12}}>{part.questions.map(question=>{const value=answers[key(part,question)]||"",ok=value===question.answer;return <div key={question.id} style={{padding:10,borderRadius:8,background:ok?"#edf5ef":"#fff3ef"}}><strong>{ok?"✓":"✕"} {question.q}</strong>{!ok&&<div style={{fontSize:13,marginTop:4}}>Dit svar: <strong>{value||"—"}</strong> · Korrekt: <strong>{question.answer}</strong></div>}<div style={{fontSize:12,color:"#66706a",marginTop:4}}>{question.strategy} · {question.explanation}</div></div>})}</div></details>)}</div></>}<button onClick={()=>window.location.href="/?student=1"} style={primary}>Til mine opgaver →</button></div>:
   <>{error&&<div style={{...card,background:"#fff3cd",marginTop:14,fontWeight:800}}>{error}</div>}<div style={{...card,marginTop:18,padding:12,display:"flex",gap:7,flexWrap:"wrap",position:"sticky",top:8,zIndex:3,boxShadow:"0 5px 18px rgba(30,45,38,.08)"}}>{parts.map((part,i)=>{const done=part.questions.filter(question=>answers[key(part,question)]).length;return <button key={part.id} onClick={()=>{setPartIndex(i);window.scrollTo({top:160,behavior:"smooth"})}} style={{...navButton,background:i===partIndex?"#365044":done===part.questions.length?"#e7eee9":"white",color:i===partIndex?"white":"#365044"}}>{i+1}. {part.section} · {done}/{part.questions.length}</button>})}</div>
    {current&&<div style={{display:"grid",gridTemplateColumns:"minmax(0,1.2fr) minmax(300px,.8fr)",gap:16,alignItems:"start",marginTop:16}}><article style={{...card,position:"sticky",top:78,maxHeight:"calc(100vh - 100px)",overflow:"auto"}}><p style={eyebrow}>{current.genre.toUpperCase()}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:29,margin:"6px 0 14px"}}>{current.title}</h2>{tipFor(current.section,grade)&&<div style={strategyHelp}><strong>Strategitip</strong><br/>{tipFor(current.section,grade)}</div>}<div style={{whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",fontSize:17,lineHeight:1.72,color:"#303a35"}}>{current.text}</div></article><section style={{display:"grid",gap:11}}>{current.questions.map((question,i)=><article key={question.id} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><span style={eyebrow}>SPØRGSMÅL {i+1} AF {current.questions.length}</span>{grade<=7&&<span style={chip}>{question.strategy}</span>}</div><h3 style={{fontFamily:"Georgia,serif",fontSize:19,lineHeight:1.4}}>{question.q}</h3><div style={{display:"grid",gap:7}}>{question.options.map(option=><button key={option} onClick={()=>setAnswers(v=>({...v,[key(current,question)]:option}))} style={{padding:"10px 12px",borderRadius:8,textAlign:"left",border:answers[key(current,question)]===option?"2px solid #526b60":"1px solid #ddd9d0",background:answers[key(current,question)]===option?"#edf1ec":"white",fontWeight:answers[key(current,question)]===option?850:650,cursor:"pointer"}}>{option}</button>)}</div></article>)}<div style={card}><strong>{currentAnswered} af {current.questions.length} i denne tekst · {answered} af {total} i alt</strong><div style={{display:"flex",justifyContent:"space-between",gap:8,marginTop:12}}><button disabled={partIndex===0} onClick={()=>{setPartIndex(x=>Math.max(0,x-1));window.scrollTo({top:160,behavior:"smooth"})}} style={{...secondary,opacity:partIndex===0?0.4:1}}>← Forrige tekst</button>{partIndex<parts.length-1?<button onClick={()=>{setPartIndex(x=>Math.min(parts.length-1,x+1));window.scrollTo({top:160,behavior:"smooth"})}} style={primary}>Næste tekst →</button>:<button disabled={saving} onClick={()=>submitExam(false)} style={{...primary,opacity:saving?0.6:1}}>{saving?"Afleverer…":`Aflever${answered<total?` · ${total-answered} ubesvarede`:""}`}</button>}</div></div></section></div>}
   </>}
  </>}
 </section></main>;
}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:20};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.35,color:"#718077",margin:0};
const chip:React.CSSProperties={fontSize:11,fontWeight:850,padding:"5px 8px",borderRadius:999,background:"#edf1ec",color:"#526b60"};
const primary:React.CSSProperties={padding:"11px 15px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={padding:"11px 15px",border:"1px solid #ccd4ce",borderRadius:9,background:"white",color:"#365044",fontWeight:900,cursor:"pointer"};
const navButton:React.CSSProperties={padding:"7px 9px",border:"1px solid #ccd4ce",borderRadius:8,fontWeight:850,cursor:"pointer",fontSize:11};
const strategyHelp:React.CSSProperties={margin:"0 0 16px",padding:"11px 13px",borderRadius:9,background:"#edf1ec",border:"1px solid #d6e0d8",lineHeight:1.45,color:"#456052"};
const resultBox:React.CSSProperties={display:"flex",justifyContent:"space-between",gap:10,padding:11,border:"1px solid #e1ddd5",borderRadius:9};
