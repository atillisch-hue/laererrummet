"use client";

import {useEffect,useMemo,useState} from "react";
import {studentSupabase} from "../../lib/studentSupabase";
import {trainingCatalog} from "../../lib/trainingCatalog";
import {freeTrainingQuestions,type TrainingQuestion} from "../../lib/freeTrainingQuestions";
import {mathExtraQuestions} from "../../lib/mathExtraQuestions";
import {mathGapQuestions} from "../../lib/mathGapQuestions";
import {mathGradeBandLabel,mathTrainingAllowed} from "../../lib/mathProgression";
import {studentFriendlyMathQuestions} from "../../lib/mathStudentLanguage";
import {freshTrainingRound,trainingQuestionKey} from "../../lib/trainingRound";
import {clearStudentSession,getStudentSessionToken} from "../../lib/studentSession";
import {gradeBandLabel,minimumGradeForTopic} from "../student-grammar/grade-progression";

type LevelBank=Record<string,TrainingQuestion[]>;
type Assigned={id:number;title:string;subject_id:string;area_id:string;skill_id:string;level_id:string;target_grade:number|null;started:boolean;attempts:number;best_score:number|null;last_score:number|null;max_score:number|null;mastered:boolean};
const grammarLevelMinimumGrade:Record<string,number>={start:1,basis:3,traening:5,udfordring:7,anvendt:7};

function skillBank(subjectId:string,areaId:string,skill:string):LevelBank{
 const core=(freeTrainingQuestions[subjectId]?.[areaId]?.[skill]??{}) as LevelBank;
 if(subjectId!=="matematik")return core;
 const extra=mathExtraQuestions[areaId]?.[skill]??{},gaps=mathGapQuestions[areaId]?.[skill]??{};
 const levels=new Set([...Object.keys(core),...Object.keys(extra),...Object.keys(gaps)]);
 return Object.fromEntries([...levels].map(level=>[level,studentFriendlyMathQuestions([...(core[level]??[]),...(extra[level]??[]),...(gaps[level]??[])])]));
}
function allowed(subjectId:string,skill:string,levelId:string,grade:number|null){
 if(grade===null)return true;
 if(subjectId==="matematik")return mathTrainingAllowed(skill,levelId,grade);
 if(subjectId==="dansk-grammatik"){
  const effective=Math.min(10,grade+(levelId==="udfordring"?1:0));
  return (grammarLevelMinimumGrade[levelId]??1)<=effective&&minimumGradeForTopic(skill)<=effective;
 }
 return true;
}

export default function StudentAssignedTraining(){
 const[ready,setReady]=useState(false),[token,setToken]=useState(""),[studentGrade,setStudentGrade]=useState<number|null>(null),[assignment,setAssignment]=useState<Assigned|null>(null),[error,setError]=useState("");
 const[answers,setAnswers]=useState<Record<number,string>>({}),[submitted,setSubmitted]=useState(false),[saveState,setSaveState]=useState("");
 const[roundIndex,setRoundIndex]=useState(0),[seenKeys,setSeenKeys]=useState<string[]>([]),[avoidKeys,setAvoidKeys]=useState<string[]>([]);

 useEffect(()=>{(async()=>{
  const session=getStudentSessionToken();if(!session){window.location.replace("/?student=1");return}
  const assignmentId=Number(new URLSearchParams(window.location.search).get("assignment"));
  if(!Number.isFinite(assignmentId)||assignmentId<=0){setError("Træningen kunne ikke åbnes.");setReady(true);return}
  const[studentResponse,assignmentResponse]=await Promise.all([
   studentSupabase.rpc("student_session_data",{p_session_token:session}),
   studentSupabase.rpc("student_session_training_assignments",{p_session_token:session})
  ]);
  if(studentResponse.error||!studentResponse.data?.ok){clearStudentSession();window.location.replace("/?student=1");return}
  const found=((assignmentResponse.data?.ok?assignmentResponse.data.assignments:[])||[]).find((row:Assigned)=>Number(row.id)===assignmentId)||null;
  if(!found){setError("Du har ikke adgang til denne træning.");setReady(true);return}
  const raw=studentResponse.data.student?.grade_level;
  setToken(session);setStudentGrade(raw===null||raw===undefined?null:Number(raw));setAssignment(found);setRoundIndex(Number(found.attempts||0));setReady(true);
 })()},[]);

 const subject=useMemo(()=>assignment?trainingCatalog.find(s=>s.id===assignment.subject_id)||null:null,[assignment]);
 const area=subject?.areas.find(a=>a.id===assignment?.area_id)||null;
 const level=subject?.levels.find(l=>l.id===assignment?.level_id)||null;
 const effectiveGrade=assignment?.target_grade??studentGrade;
 const pool=useMemo(()=>assignment?skillBank(assignment.subject_id,assignment.area_id,assignment.skill_id)[assignment.level_id]??[]:[],[assignment]);
 const questions=useMemo(()=>assignment?freshTrainingRound(pool,new Set(seenKeys),`${assignment.id}|${roundIndex}`,5,new Set(avoidKeys)):[],[pool,assignment,roundIndex,seenKeys,avoidKeys]);
 const score=questions.filter((q,i)=>answers[i]===q.answer).length;
 const allAnswered=questions.length>0&&questions.every((_,i)=>Boolean(answers[i]));
 const isAllowed=assignment?allowed(assignment.subject_id,assignment.skill_id,assignment.level_id,effectiveGrade):false;

 async function submit(){
  if(!assignment||!token||!allAnswered||submitted)return;
  setSubmitted(true);setSaveState("Gemmer…");
  const snapshot=Object.fromEntries(questions.map((q,index)=>[index,{question:q.q,studentAnswer:answers[index],correctAnswer:q.answer,correct:answers[index]===q.answer,explanation:q.why,targetGrade:effectiveGrade,source:"teacher_training_assignment"}]));
  const{data,error:e}=await studentSupabase.rpc("save_student_training_assignment_attempt_session",{p_session_token:token,p_training_assignment_id:assignment.id,p_answers:snapshot,p_score:score,p_max_score:questions.length});
  if(e||!data?.ok){setSaveState("Resultatet kunne ikke gemmes i skyen lige nu.");return}
  setAssignment({...assignment,started:true,attempts:Number(data.attempts||assignment.attempts+1),best_score:Number(data.best_score??score),last_score:Number(data.last_score??score),max_score:Number(data.max_score??questions.length),mastered:Boolean(data.mastered)});
  setSaveState("Resultatet er gemt ✓");
 }
 function retry(){
  const current=questions.map(trainingQuestionKey);
  setSeenKeys(previous=>[...new Set([...previous,...current])]);
  setAvoidKeys(current);setRoundIndex(value=>value+1);setAnswers({});setSubmitted(false);setSaveState("");window.scrollTo({top:0,behavior:"smooth"});
 }

 if(!ready)return <main style={{padding:50}}>Åbner træningen…</main>;
 if(error||!assignment||!subject||!area||!level)return <main style={shell}><section style={card}><h1>Træningen kunne ikke åbnes</h1><p>{error||"Opgaven peger på et træningsområde, der ikke længere findes."}</p><a href="/?student=1" style={link}>← Mit Klasseværelse</a></section></main>;
 if(!isAllowed||questions.length===0)return <main style={shell}><section style={card}><a href="/?student=1" style={link}>← Mit Klasseværelse</a><p style={eyebrow}>FRA DIN LÆRER · {subject.title.toUpperCase()}</p><h1 style={h1}>{assignment.title}</h1><div style={{...card,background:"#fff7e8",marginTop:16}}><strong>Dette træningsniveau kan ikke åbnes endnu.</strong><p style={muted}>Tildelingen er bevaret. Din lærer kan vælge et andet niveau, eller dit klassetrin kan justeres, hvis det er det, der mangler.</p></div></section></main>;

 const band=effectiveGrade===null?null:assignment.subject_id==="matematik"?mathGradeBandLabel(effectiveGrade):gradeBandLabel(effectiveGrade);
 return <main style={shell}><section style={{maxWidth:900,margin:"auto"}}>
  <a href="/?student=1" style={link}>← Mit Klasseværelse</a>
  <p style={{...eyebrow,marginTop:30}}>FRA DIN LÆRER · {subject.title.toUpperCase()}</p>
  <h1 style={h1}>{assignment.title}</h1>
  <p style={{fontSize:17,color:"#69716c",lineHeight:1.55}}>{area.title} · {assignment.skill_id} · {level.title}</p>
  <div style={{display:"flex",gap:7,flexWrap:"wrap",margin:"12px 0 22px"}}><span style={chip}>{assignment.target_grade!==null?`${assignment.target_grade}. kl. træningsniveau`:studentGrade!==null?`${studentGrade}. klasse`:"Åbent niveau"}</span>{band&&<span style={chip}>{band}</span>}{assignment.started&&<span style={chip}>{assignment.attempts} forsøg · bedste {assignment.best_score}/{assignment.max_score}</span>}{assignment.mastered&&<span style={{...chip,background:"#dfeee3"}}>Mestret ✓</span>}</div>

  <div style={{display:"grid",gap:14}}>{questions.map((item,index)=><article key={`${item.q}-${index}`} style={card}><small style={eyebrow}>OPGAVE {index+1} AF {questions.length}</small><h2 style={{fontFamily:"Georgia,serif",fontSize:21,margin:"9px 0 14px",lineHeight:1.35}}>{item.q}</h2><div style={{display:"grid",gap:7}}>{item.options.map(option=>{const chosen=answers[index]===option,correct=submitted&&option===item.answer,wrong=submitted&&chosen&&option!==item.answer;return <button key={option} disabled={submitted} onClick={()=>setAnswers(a=>({...a,[index]:option}))} style={{padding:"11px 13px",textAlign:"left",borderRadius:9,border:`2px solid ${correct?"#5f8068":wrong?"#b86b62":chosen?"#526b60":"#e1ddd5"}`,background:correct?"#edf5ef":wrong?"#fff0ed":chosen?"#edf1ec":"#fff",fontWeight:chosen||correct?800:600,cursor:submitted?"default":"pointer"}}>{option}</button>})}</div>{submitted&&<div style={{marginTop:12,padding:"11px 13px",borderRadius:9,background:answers[index]===item.answer?"#edf5ef":"#fff7e8",lineHeight:1.55}}><strong>{answers[index]===item.answer?"Rigtigt ✓":"Ikke helt endnu"}</strong><br/>{item.why}</div>}</article>)}</div>

  {!submitted?<button disabled={!allAnswered} onClick={submit} style={{...primary,width:"100%",marginTop:18,opacity:allAnswered?1:.5}}>Ret mine svar →</button>:<section style={{...card,marginTop:18}}><p style={eyebrow}>RESULTAT</p><h2 style={{fontFamily:"Georgia,serif",fontSize:32,margin:"5px 0"}}>{score}/{questions.length}</h2><p style={muted}>{score===questions.length?"Flot. Du har styr på denne runde.":"Se forklaringerne, og prøv igen med nye opgaver. Målet er at forstå metoden — ikke at huske svarene."}</p>{saveState&&<p style={{fontWeight:850,color:"#526b60"}}>{saveState}</p>}<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}><button onClick={retry} style={primary}>Prøv igen {pool.length>5?"med nye opgaver":""} →</button><button onClick={()=>window.location.href="/?student=1"} style={secondary}>Til mit Klasseværelse</button></div></section>}
 </section></main>;
}

const shell:React.CSSProperties={minHeight:"100vh",background:"#f5f3ee",padding:"36px 24px 80px",color:"#26342e",fontFamily:"Arial,sans-serif"};
const card:React.CSSProperties={background:"#fff",border:"1px solid #d8d5cd",borderRadius:14,padding:22};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#718077"};
const muted:React.CSSProperties={fontSize:13,color:"#6d746e",lineHeight:1.5};
const h1:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:40,margin:"7px 0"};
const chip:React.CSSProperties={display:"inline-block",padding:"6px 9px",borderRadius:999,background:"#e7eee9",color:"#486b59",fontSize:11,fontWeight:900};
const primary:React.CSSProperties={padding:"12px 15px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={padding:"11px 14px",border:"1px solid #ccc8bf",borderRadius:9,background:"white",color:"#365044",fontWeight:850,cursor:"pointer"};
const link:React.CSSProperties={color:"#526b60",fontWeight:850,textDecoration:"none"};