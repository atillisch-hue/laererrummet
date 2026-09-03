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

type ProgressEntry={attempts:number;best:number;total:number;lastScore:number;updatedAt:string};
type Progress=Record<string,ProgressEntry>;
type LevelBank=Record<string,TrainingQuestion[]>;
const grammarLevelMinimumGrade:Record<string,number>={start:1,basis:3,traening:5,udfordring:7,anvendt:7};

function levelAllowed(subjectId:string,skill:string|null,levelId:string,gradeLevel:number|null){
 if(gradeLevel===null)return true;
 if(subjectId==="dansk-grammatik"){
  const effective=Math.min(10,gradeLevel+(levelId==="udfordring"?1:0));
  return (grammarLevelMinimumGrade[levelId]??1)<=effective&&(skill?minimumGradeForTopic(skill):1)<=effective;
 }
 if(subjectId==="matematik")return mathTrainingAllowed(skill,levelId,gradeLevel);
 return true;
}
function skillBank(subjectId:string,areaId:string|null,skill:string|null):LevelBank{
 if(!areaId||!skill)return{};
 const core=(freeTrainingQuestions[subjectId]?.[areaId]?.[skill]??{}) as LevelBank;
 if(subjectId!=="matematik")return core;
 const extra=mathExtraQuestions[areaId]?.[skill]??{},gaps=mathGapQuestions[areaId]?.[skill]??{};
 const levels=new Set([...Object.keys(core),...Object.keys(extra),...Object.keys(gaps)]);
 return Object.fromEntries([...levels].map(level=>[level,studentFriendlyMathQuestions([...(core[level]??[]),...(extra[level]??[]),...(gaps[level]??[])])]));
}

export default function StudentTraining(){
 const[ready,setReady]=useState(false),[sessionToken,setSessionToken]=useState(""),[studentId,setStudentId]=useState<number|null>(null),[gradeLevel,setGradeLevel]=useState<number|null>(null);
 const[subjectId,setSubjectId]=useState("dansk-grammatik"),[areaId,setAreaId]=useState<string|null>(null),[skill,setSkill]=useState<string|null>(null),[levelId,setLevelId]=useState<string|null>(null);
 const[answers,setAnswers]=useState<Record<number,string>>({}),[submitted,setSubmitted]=useState(false),[progress,setProgress]=useState<Progress>({}),[saveState,setSaveState]=useState("");
 const[roundIndex,setRoundIndex]=useState(0),[seenKeys,setSeenKeys]=useState<string[]>([]),[avoidKeys,setAvoidKeys]=useState<string[]>([]);

 useEffect(()=>{(async()=>{
  const token=getStudentSessionToken();if(!token){window.location.href="/?student=1";return}
  const{data:studentData,error:studentError}=await studentSupabase.rpc("student_session_data",{p_session_token:token});
  if(studentError||!studentData?.ok||!studentData.student?.id){clearStudentSession();window.location.href="/?student=1";return}
  const id=Number(studentData.student.id),rawGrade=studentData.student.grade_level;
  setSessionToken(token);setStudentId(id);setGradeLevel(rawGrade===null||rawGrade===undefined?null:Number(rawGrade));
  let local:Progress={};try{local=JSON.parse(localStorage.getItem(`klassevaerelset-training-${id}`)||"{}")}catch{local={}}
  const{data:cloudRows}=await studentSupabase.rpc("get_student_training_progress_session",{p_session_token:token});const cloud:Progress={};
  ((cloudRows||[]) as any[]).forEach(row=>{cloud[[row.subject_id,row.area_id,row.skill_id,row.level_id].join("|")]={attempts:Number(row.attempts||0),best:Number(row.best_score||0),total:Number(row.max_score||0),lastScore:Number(row.last_score||0),updatedAt:row.last_attempt_at||new Date(0).toISOString()}});
  const merged={...local,...cloud};setProgress(merged);localStorage.setItem(`klassevaerelset-training-${id}`,JSON.stringify(merged));
  const requested=new URLSearchParams(window.location.search).get("subject");if(requested&&trainingCatalog.some(item=>item.id===requested))setSubjectId(requested);setReady(true);
 })()},[]);

 const subject=useMemo(()=>trainingCatalog.find(item=>item.id===subjectId)??trainingCatalog[0],[subjectId]);
 const area=subject?.areas.find(item=>item.id===areaId);
 const bank=useMemo(()=>skillBank(subjectId,areaId,skill),[subjectId,areaId,skill]);
 const fullPool=levelId&&levelAllowed(subjectId,skill,levelId,gradeLevel)?bank[levelId]??[]:[];
 const questions=useMemo(()=>freshTrainingRound(fullPool,new Set(seenKeys),`${subjectId}|${areaId}|${skill}|${levelId}|${roundIndex}`,5,new Set(avoidKeys)),[fullPool,seenKeys,avoidKeys,subjectId,areaId,skill,levelId,roundIndex]);
 const score=questions.filter((question,index)=>answers[index]===question.answer).length;
 const allAnswered=questions.length>0&&questions.every((_,index)=>Boolean(answers[index]));
 const runKey=subjectId&&areaId&&skill&&levelId?[subjectId,areaId,skill,levelId].join("|"):"";

 const subjectStats=useMemo(()=>{let available=0,tried=0,safe=0;subject.areas.forEach(a=>a.skills.forEach(s=>{const levels=skillBank(subjectId,a.id,s);Object.keys(levels).forEach(l=>{if(!levelAllowed(subjectId,s,l,gradeLevel)||!(levels[l]??[]).length)return;available++;const item=progress[[subjectId,a.id,s,l].join("|")];if(item){tried++;if(item.total&&item.best===item.total)safe++}})}));return{available,tried,safe}},[subject,subjectId,progress,gradeLevel]);
 const recommendation=useMemo(()=>{const candidates:{areaId:string;areaTitle:string;skill:string;levelId:string;levelTitle:string;rank:number}[]=[];subject.areas.forEach(a=>a.skills.forEach(s=>{const levels=skillBank(subjectId,a.id,s);subject.levels.forEach((level,index)=>{if(!levelAllowed(subjectId,s,level.id,gradeLevel)||!(levels[level.id]??[]).length)return;const item=progress[[subjectId,a.id,s,level.id].join("|")],pct=item?.total?item.best/item.total:-1,rank=!item?20+index:pct<.6?index:pct<1?10+index:100+index;candidates.push({areaId:a.id,areaTitle:a.title,skill:s,levelId:level.id,levelTitle:level.title,rank})})}));return candidates.sort((a,b)=>a.rank-b.rank)[0]??null},[subject,subjectId,progress,gradeLevel]);

 function persist(next:Progress){setProgress(next);if(studentId)localStorage.setItem(`klassevaerelset-training-${studentId}`,JSON.stringify(next))}
 function clearRound(clearSeen=true){setAnswers({});setSubmitted(false);setSaveState("");setAvoidKeys([]);if(clearSeen)setSeenKeys([]);setRoundIndex(value=>value+1)}
 function retry(){const current=questions.map(trainingQuestionKey);setSeenKeys(previous=>[...new Set([...previous,...current])]);setAvoidKeys(current);setAnswers({});setSubmitted(false);setSaveState("");setRoundIndex(value=>value+1);window.scrollTo({top:0,behavior:"smooth"})}
 function chooseSubject(next:string){setSubjectId(next);setAreaId(null);setSkill(null);setLevelId(null);clearRound();window.history.replaceState(null,"",`/student-training?subject=${next}`)}
 function chooseSkill(next:string){if(!areaId)return;const levels=skillBank(subjectId,areaId,next),hasAllowed=Object.keys(levels).some(l=>levelAllowed(subjectId,next,l,gradeLevel)&&(levels[l]??[]).length>0);if(!hasAllowed)return;setSkill(next);setLevelId(null);clearRound()}
 function startLevel(next:string){setLevelId(next);clearRound()}
 function goBack(){if(levelId){setLevelId(null);clearRound();return}if(skill){setSkill(null);clearRound();return}if(areaId){setAreaId(null);clearRound();return}window.location.href="/?student=1"}
 function startRecommendation(){if(!recommendation)return;setAreaId(recommendation.areaId);setSkill(recommendation.skill);setLevelId(recommendation.levelId);clearRound()}
 function statusFor(key:string){const item=progress[key];if(!item)return null;const pct=item.total?item.best/item.total:0;return pct===1?"Sikker ✓":pct>=.6?"Godt på vej":"Øv igen"}

 async function saveResult(){
  if(!runKey||!studentId||!sessionToken||!questions.length||submitted)return;
  const old=progress[runKey];let next:ProgressEntry={attempts:(old?.attempts??0)+1,best:Math.max(old?.best??0,score),total:questions.length,lastScore:score,updatedAt:new Date().toISOString()};persist({...progress,[runKey]:next});setSubmitted(true);setSaveState("Gemmer i skyen…");
  const snapshot=Object.fromEntries(questions.map((question,index)=>[index,{question:question.q,studentAnswer:answers[index],correctAnswer:question.answer,correct:answers[index]===question.answer,explanation:question.why,gradeLevel}]));
  const{data,error}=await studentSupabase.rpc("save_student_training_attempt_session",{p_session_token:sessionToken,p_subject_id:subjectId,p_area_id:areaId,p_skill_id:skill,p_level_id:levelId,p_answers:snapshot,p_score:score,p_max_score:questions.length});
  if(error||!data?.ok){if(data?.error==="invalid_session")clearStudentSession();setSaveState("Gemt på denne enhed. Skyen kunne ikke opdateres.");return}
  next={attempts:Number(data.attempts||next.attempts),best:Number(data.best_score??next.best),total:Number(data.max_score??next.total),lastScore:Number(data.last_score??score),updatedAt:new Date().toISOString()};persist({...progress,[runKey]:next});setSaveState("Resultatet er gemt i skyen ✓");
 }

 if(!ready||!subject)return <main style={{padding:50}}>Åbner træning…</main>;
 const title=levelId?`${skill} · ${subject.levels.find(item=>item.id===levelId)?.title??levelId}`:skill??area?.title??subject.title;
 const backLabel=levelId?skill:skill?area?.title:areaId?subject.title:"Mit Klasseværelse";
 const gradeAware=subjectId==="dansk-grammatik"||subjectId==="matematik";
 const band=gradeLevel===null?null:subjectId==="matematik"?mathGradeBandLabel(gradeLevel):gradeBandLabel(gradeLevel);

 return <main style={shell}><section style={{maxWidth:1000,margin:"0 auto"}}>
  <button onClick={goBack} style={back}>← {backLabel}</button>
  <p style={{...eyebrow,marginTop:34}}>TRÆN SELV · {subject.title.toUpperCase()}</p><h1 style={h1}>{title}</h1><p style={lead}>{levelId?"Du får fem opgaver ad gangen. Når du retter, kan du se en forklaring på metoden.":skill?"Vælg et niveau, der passer til det, du vil øve.":area?.description??subject.description}</p>
  {gradeAware&&gradeLevel!==null&&<span style={chip}>TILPASSET · {gradeLevel}. klasse · {band}</span>}
  {gradeAware&&gradeLevel===null&&<div style={warning}><strong>Klassetrin er ikke angivet endnu.</strong> Indtil det bliver sat, vises alle niveauer.</div>}

  {!areaId&&!skill&&!levelId&&<>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"14px 0 18px"}}>{trainingCatalog.map(item=><button key={item.id} onClick={()=>chooseSubject(item.id)} style={choice(subjectId===item.id)}>{item.title}</button>)}</div>
   <div style={stats}><div style={miniCard}><small style={eyebrow}>ÅBNE TRÆNINGSSPOR</small><strong style={metric}>{subjectStats.available}</strong></div><div style={miniCard}><small style={eyebrow}>PRØVET</small><strong style={metric}>{subjectStats.tried}</strong></div><div style={miniCard}><small style={eyebrow}>SIKRE</small><strong style={metric}>{subjectStats.safe}</strong></div></div>
   {recommendation&&<div style={{...card,background:"#e9f0eb",marginBottom:16}}><small style={eyebrow}>FORSLAG TIL NÆSTE TRÆNING</small><h2 style={h2}>{recommendation.skill}</h2><p style={muted}>{recommendation.areaTitle} · {recommendation.levelTitle}</p><button onClick={startRecommendation} style={primary}>Start her →</button></div>}
   <div style={grid}>{subject.areas.map(a=>{const available=a.skills.filter(s=>{const levels=skillBank(subjectId,a.id,s);return Object.keys(levels).some(l=>levelAllowed(subjectId,s,l,gradeLevel)&&(levels[l]??[]).length)}).length;return <button key={a.id} disabled={!available} onClick={()=>{setAreaId(a.id);clearRound()}} style={{...areaCard,opacity:available?1:.48}}><small style={eyebrow}>{available} FÆRDIGHEDER ÅBNE</small><strong style={tileTitle}>{a.title}</strong><span style={muted}>{a.description}</span></button>})}</div>
  </>}

  {areaId&&!skill&&<div style={{...grid,marginTop:20}}>{area?.skills.map(s=>{const levels=skillBank(subjectId,areaId,s),allowed=subject.levels.filter(l=>levelAllowed(subjectId,s,l.id,gradeLevel)&&(levels[l.id]??[]).length),tried=allowed.filter(l=>progress[[subjectId,areaId,s,l.id].join("|")]).length;return <button key={s} disabled={!allowed.length} onClick={()=>chooseSkill(s)} style={{...areaCard,opacity:allowed.length?1:.45}}><strong style={tileTitle}>{s}</strong><span style={muted}>{allowed.length?`${allowed.length} niveau${allowed.length===1?"":"er"} · ${tried} prøvet`:"Kommer på et senere klassetrin"}</span></button>})}</div>}

  {skill&&!levelId&&<div style={{...grid,marginTop:20}}>{subject.levels.map(level=>{const pool=bank[level.id]??[],open=levelAllowed(subjectId,skill,level.id,gradeLevel)&&pool.length>0,key=[subjectId,areaId,skill,level.id].join("|"),status=statusFor(key);return <button key={level.id} disabled={!open} onClick={()=>open&&startLevel(level.id)} style={{...areaCard,opacity:open?1:.44}}><small style={eyebrow}>{level.stage.toUpperCase()}</small><strong style={tileTitle}>{level.title}</strong><span style={muted}>{open?`${pool.length} opgaver i banken${status?` · ${status}`:""}`:"Ikke åbent på dit trin endnu"}</span></button>})}</div>}

  {levelId&&<>{questions.length===0?<div style={{...card,marginTop:20}}><strong>Dette niveau er ikke åbent endnu.</strong><p style={muted}>Vælg et niveau, der passer til dit klassetrin.</p></div>:<><div style={{display:"grid",gap:14,marginTop:25}}>{questions.map((item,index)=><article key={`${item.q}-${index}`} style={card}><small style={eyebrow}>OPGAVE {index+1} AF {questions.length}</small><h2 style={{...h2,lineHeight:1.35}}>{item.q}</h2><div style={{display:"grid",gap:7}}>{item.options.map(option=>{const chosen=answers[index]===option,correct=submitted&&option===item.answer,wrong=submitted&&chosen&&option!==item.answer;return <button key={option} disabled={submitted} onClick={()=>setAnswers(current=>({...current,[index]:option}))} style={answerButton(chosen,correct,wrong,submitted)}>{option}</button>})}</div>{submitted&&<div style={{marginTop:12,padding:"11px 13px",borderRadius:9,background:answers[index]===item.answer?"#edf5ef":"#fff7e8",lineHeight:1.55}}><strong>{answers[index]===item.answer?"Rigtigt ✓":"Ikke helt endnu"}</strong><br/>{item.why}</div>}</article>)}</div>
   {!submitted?<button disabled={!allAnswered} onClick={saveResult} style={{...primary,marginTop:18,width:"100%",padding:14,fontSize:16,opacity:allAnswered?1:.5}}>Ret mine svar →</button>:<div style={{...card,marginTop:18}}><small style={eyebrow}>RESULTAT</small><h2 style={{fontFamily:"Georgia,serif",fontSize:31,margin:"5px 0"}}>{score}/{questions.length}</h2><p style={muted}>{score===questions.length?"Flot. Du har styr på denne runde.":"Se forklaringerne, og prøv igen med nye opgaver. Målet er at forstå metoden — ikke at huske svarene."}</p>{saveState&&<p style={{fontSize:13,fontWeight:850,color:"#526b60"}}>{saveState}</p>}<button onClick={retry} style={primary}>Prøv igen {fullPool.length>5?"med nye opgaver":""} →</button></div>}</>}</>}
 </section></main>;
}

const shell:React.CSSProperties={minHeight:"100vh",background:"#f5f3ee",padding:"36px 24px 80px",color:"#26342e",fontFamily:"Arial,sans-serif"};
const card:React.CSSProperties={background:"#fff",border:"1px solid #d8d5cd",borderRadius:14,padding:22};
const miniCard:React.CSSProperties={background:"#fff",border:"1px solid #ddd9d0",borderRadius:11,padding:15};
const areaCard:React.CSSProperties={display:"grid",gap:7,textAlign:"left",padding:18,border:"1px solid #ddd9d0",borderRadius:13,background:"#fff",cursor:"pointer",color:"#26342e"};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#718077"};
const muted:React.CSSProperties={fontSize:13,color:"#6d746e",lineHeight:1.45};
const metric:React.CSSProperties={display:"block",fontFamily:"Georgia,serif",fontSize:30,marginTop:5};
const primary:React.CSSProperties={padding:"11px 14px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const choice=(active:boolean):React.CSSProperties=>({padding:"9px 12px",borderRadius:9,border:active?"2px solid #526b60":"1px solid #d8d5cd",background:active?"#edf1ec":"white",fontWeight:850,cursor:"pointer",color:"#26342e"});
const back:React.CSSProperties={border:0,background:"transparent",color:"#526b60",fontWeight:800,cursor:"pointer",padding:0};
const h1:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:42,margin:"7px 0"};
const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:21,margin:"9px 0 14px"};
const lead:React.CSSProperties={fontSize:17,color:"#707670",lineHeight:1.55,maxWidth:760};
const chip:React.CSSProperties={display:"inline-block",margin:"2px 0 12px",padding:"6px 10px",borderRadius:999,background:"#e7eee9",color:"#486b59",fontSize:12,fontWeight:900};
const warning:React.CSSProperties={margin:"10px 0 16px",padding:"11px 13px",borderRadius:9,background:"#fff7e8",border:"1px solid #ead8ad",color:"#665431",fontSize:14,lineHeight:1.45};
const stats:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginBottom:18};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:12};
const tileTitle:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:20};
function answerButton(chosen:boolean,correct:boolean,wrong:boolean,submitted:boolean):React.CSSProperties{return{padding:"11px 13px",textAlign:"left",borderRadius:9,border:`2px solid ${correct?"#5f8068":wrong?"#b86b62":chosen?"#526b60":"#e1ddd5"}`,background:correct?"#edf5ef":wrong?"#fff0ed":chosen?"#edf1ec":"#fff",fontWeight:chosen||correct?800:600,cursor:submitted?"default":"pointer"}}
