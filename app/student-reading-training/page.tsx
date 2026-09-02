"use client";

import {useEffect,useMemo,useState} from "react";
import {studentSupabase} from "../../lib/studentSupabase";
import {clearStudentSession,getStudentSessionToken} from "../../lib/studentSession";
import {READING_STRATEGIES,type ReadingStrategy} from "../student-reading-exam/reading-exam-bank";
import {READING_STRATEGY_COACHING} from "../student-reading-exam/strategy-feedback";
import {buildStrategyTrainingRound,isReadingStrategy,strategyTrainingAvailableCount,type StrategyTrainingRound} from "./strategy-training-bank";

type ProgressRow={attempts:number;best_score:number;last_score:number;max_score:number;subject_id:string;area_id:string;skill_id:string;level_id:string};

const ROUND_SIZE=3;
function clampGrade(value:number){return Math.max(6,Math.min(9,Math.round(value))) as 6|7|8|9}
function seenStorageKey(studentId:number,strategy:ReadingStrategy,grade:number){return `klassevaerelset-reading-strategy-seen-${studentId}-${grade}-${strategy}`}
function readSeen(studentId:number,strategy:ReadingStrategy,grade:number){try{const parsed=JSON.parse(localStorage.getItem(seenStorageKey(studentId,strategy,grade))||"[]");return Array.isArray(parsed)?parsed.map(String):[]}catch{return []}}
function writeSeen(studentId:number,strategy:ReadingStrategy,grade:number,ids:string[]){localStorage.setItem(seenStorageKey(studentId,strategy,grade),JSON.stringify(Array.from(new Set(ids)))) }

export default function StudentReadingTraining(){
 const[ready,setReady]=useState(false),[error,setError]=useState(""),[token,setToken]=useState(""),[studentId,setStudentId]=useState<number|null>(null);
 const[grade,setGrade]=useState<6|7|8|9>(6),[strategy,setStrategy]=useState<ReadingStrategy|null>(null),[fromAssignment,setFromAssignment]=useState<number|null>(null);
 const[round,setRound]=useState<StrategyTrainingRound|null>(null),[answers,setAnswers]=useState<Record<string,string>>({}),[submitted,setSubmitted]=useState(false),[saveState,setSaveState]=useState(""),[progress,setProgress]=useState<ProgressRow|null>(null),[roundNumber,setRoundNumber]=useState(1);

 useEffect(()=>{(async()=>{
  const session=getStudentSessionToken();if(!session){window.location.href="/?student=1";return}
  const{data,error:sessionError}=await studentSupabase.rpc("student_session_data",{p_session_token:session});
  if(sessionError||!data?.ok||!data.student?.id){clearStudentSession();window.location.href="/?student=1";return}
  const params=new URLSearchParams(window.location.search),requestedGrade=Number(params.get("grade")),requestedStrategy=params.get("strategy"),source=Number(params.get("from"));
  const studentGrade=Number(data.student.grade_level),initialGrade=Number.isFinite(requestedGrade)&&requestedGrade>=6?clampGrade(requestedGrade):Number.isFinite(studentGrade)&&studentGrade>=6?clampGrade(studentGrade):6;
  const initialStrategy=isReadingStrategy(requestedStrategy)?requestedStrategy:null;
  setToken(session);setStudentId(Number(data.student.id));setGrade(initialGrade);setStrategy(initialStrategy);setFromAssignment(Number.isFinite(source)&&source>0?source:null);
  const{data:rows}=await studentSupabase.rpc("get_student_training_progress_session",{p_session_token:session});
  if(initialStrategy){const found=((rows||[]) as ProgressRow[]).find(row=>row.subject_id==="dansk-laesning"&&row.area_id==="laesestrategier"&&row.skill_id===initialStrategy&&row.level_id===String(initialGrade));setProgress(found||null);const seen=readSeen(Number(data.student.id),initialStrategy,initialGrade);setRound(buildStrategyTrainingRound(initialStrategy,initialGrade,seen,ROUND_SIZE,Date.now()));setRoundNumber((found?.attempts||0)+1)}
  setReady(true);
 })()},[]);

 const score=useMemo(()=>round?.questions.filter(question=>answers[question.id]===question.answer).length||0,[round,answers]);
 const allAnswered=Boolean(round?.questions.length)&&round!.questions.every(question=>Boolean(answers[question.id]));
 const coach=strategy?READING_STRATEGY_COACHING[strategy]:null;

 function updateUrl(nextStrategy:ReadingStrategy|null,nextGrade=grade){const params=new URLSearchParams();params.set("grade",String(nextGrade));if(nextStrategy)params.set("strategy",nextStrategy);if(fromAssignment)params.set("from",String(fromAssignment));window.history.replaceState(null,"",`/student-reading-training?${params.toString()}`)}
 function chooseGrade(next:6|7|8|9){setGrade(next);setProgress(null);setRound(null);setAnswers({});setSubmitted(false);setSaveState("");if(strategy&&studentId){const seen=readSeen(studentId,strategy,next);setRound(buildStrategyTrainingRound(strategy,next,seen,ROUND_SIZE,Date.now()))}updateUrl(strategy,next)}
 async function chooseStrategy(next:ReadingStrategy){if(!studentId)return;setStrategy(next);setAnswers({});setSubmitted(false);setSaveState("");const seen=readSeen(studentId,next,grade);setRound(buildStrategyTrainingRound(next,grade,seen,ROUND_SIZE,Date.now()));updateUrl(next);const{data:rows}=await studentSupabase.rpc("get_student_training_progress_session",{p_session_token:token});const found=((rows||[]) as ProgressRow[]).find(row=>row.subject_id==="dansk-laesning"&&row.area_id==="laesestrategier"&&row.skill_id===next&&row.level_id===String(grade));setProgress(found||null);setRoundNumber((found?.attempts||0)+1)}
 function backToStrategies(){setStrategy(null);setRound(null);setAnswers({});setSubmitted(false);setSaveState("");setProgress(null);updateUrl(null)}

 async function submit(){if(!round||!strategy||!token||!studentId||!allAnswered||submitted)return;setSubmitted(true);setSaveState("Gemmer i skyen…");const newSeen=[...readSeen(studentId,strategy,grade),...round.questions.map(question=>question.id)];writeSeen(studentId,strategy,grade,newSeen);
  const snapshot=Object.fromEntries(round.questions.map((question,index)=>[index,{question:question.q,questionId:question.id,strategy,grade,studentAnswer:answers[question.id],correctAnswer:question.answer,correct:answers[question.id]===question.answer,explanation:question.why,trainingTitle:round.title}]));
  const{data,error:saveError}=await studentSupabase.rpc("save_student_training_attempt_session",{p_session_token:token,p_subject_id:"dansk-laesning",p_area_id:"laesestrategier",p_skill_id:strategy,p_level_id:String(grade),p_answers:snapshot,p_score:score,p_max_score:round.questions.length});
  if(saveError||!data?.ok){setSaveState("Resultatet er gemt på denne enhed, men skyen kunne ikke opdateres.");return}
  setProgress({attempts:Number(data.attempts||1),best_score:Number(data.best_score||score),last_score:Number(data.last_score||score),max_score:Number(data.max_score||round.questions.length),subject_id:"dansk-laesning",area_id:"laesestrategier",skill_id:strategy,level_id:String(grade)});setRoundNumber(Number(data.attempts||1)+1);setSaveState("Resultatet er gemt i skyen ✓")}
 function retry(){if(!round||!strategy||!studentId)return;const seen=readSeen(studentId,strategy,grade),next=buildStrategyTrainingRound(strategy,grade,seen,ROUND_SIZE,Date.now()+roundNumber);setRound(next);setAnswers({});setSubmitted(false);setSaveState("");window.scrollTo({top:0,behavior:"smooth"})}

 if(!ready)return <main style={{padding:50}}>Åbner læsestræning…</main>;
 const backHref=fromAssignment?`/student-laeseproeve?assignment=${fromAssignment}`:"/?student=1";
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"30px 20px 80px",color:"#26342e"}}><section style={{maxWidth:1040,margin:"auto"}}>
  <a href={backHref} style={{color:"#526b60",fontWeight:850,textDecoration:"none"}}>← {fromAssignment?"Til mit prøveresultat":"Til mit Klasseværelse"}</a>
  <div style={{marginTop:28}}><p style={eyebrow}>LÆSESTRATEGIER · MÅLRETTET TRÆNING</p><h1 style={{fontFamily:"Georgia,serif",fontSize:40,margin:"6px 0 8px"}}>{strategy?strategy:"Vælg dit læsefokus"}</h1><p style={{fontSize:17,color:"#68716c",lineHeight:1.55,maxWidth:760}}>{strategy&&coach?coach.explanation:"Her træner du én strategi ad gangen i små runder. Tre spørgsmål er nok til at øve metoden uden at lave en hel prøve igen."}</p></div>
  {error&&<div style={{...card,background:"#fff3cd",fontWeight:800}}>{error}</div>}
  <div style={{...card,marginTop:18}}><strong>Niveau</strong><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>{([6,7,8,9] as const).map(level=><button key={level} onClick={()=>chooseGrade(level)} style={choice(grade===level)}>{level}. klasse</button>)}</div><p style={{fontSize:12,color:"#777",marginBottom:0}}>Niveauet her er træningsniveauet. Du må godt vælge et andet niveau end dit registrerede klassetrin.</p></div>

  {!strategy?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:12,marginTop:18}}>{READING_STRATEGIES.map(item=>{const info=READING_STRATEGY_COACHING[item];return <button key={item} onClick={()=>chooseStrategy(item)} style={strategyCard}><span style={eyebrow}>{strategyTrainingAvailableCount(item,grade)} OPGAVER PÅ NIVEAUET</span><strong style={{fontFamily:"Georgia,serif",fontSize:21}}>{item}</strong><span style={{fontSize:14,color:"#657069",lineHeight:1.45}}>{info.title}</span><b style={{color:"#526b60",marginTop:5}}>Træn strategien →</b></button>})}</div>:
  <>
   {coach&&<div style={{...card,background:"#e9f0eb",borderColor:"#ccd9d0",marginTop:18}}><p style={eyebrow}>DIN METODE</p><h2 style={{fontFamily:"Georgia,serif",fontSize:24,margin:"6px 0"}}>{coach.title}</h2><p style={{margin:"4px 0 0",lineHeight:1.55}}><strong>Gør sådan:</strong> {coach.move}</p>{progress&&<p style={{margin:"9px 0 0",fontSize:13,color:"#5f6d65"}}>Tidligere: {progress.attempts} forsøg · bedste {progress.best_score}/{progress.max_score}</p>}</div>}
   {round&&<div style={{display:"grid",gridTemplateColumns:"minmax(0,1.15fr) minmax(320px,.85fr)",gap:16,alignItems:"start",marginTop:16}}><article style={{...card,position:"sticky",top:12,maxHeight:"calc(100vh - 30px)",overflow:"auto"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}><span style={eyebrow}>{round.genre.toUpperCase()}</span><span style={chip}>Runde {roundNumber} · {round.freshCount}/{round.questions.length} nye</span></div><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"7px 0 15px"}}>{round.title}</h2><div style={{whiteSpace:"pre-wrap",fontFamily:"Georgia,serif",fontSize:17,lineHeight:1.72}}>{round.text}</div></article><section style={{display:"grid",gap:12}}>{round.questions.map((question,index)=>{const chosen=answers[question.id];return <article key={question.id} style={card}><span style={eyebrow}>OPGAVE {index+1} AF {round.questions.length}</span><h3 style={{fontFamily:"Georgia,serif",fontSize:20,lineHeight:1.4}}>{question.q}</h3><div style={{display:"grid",gap:7}}>{question.options.map(option=>{const isChosen=chosen===option,isCorrect=submitted&&option===question.answer,isWrong=submitted&&isChosen&&option!==question.answer;return <button key={option} disabled={submitted} onClick={()=>setAnswers(current=>({...current,[question.id]:option}))} style={{padding:"11px 13px",textAlign:"left",borderRadius:9,border:`2px solid ${isCorrect?"#5f8068":isWrong?"#b86b62":isChosen?"#526b60":"#e1ddd5"}`,background:isCorrect?"#edf5ef":isWrong?"#fff0ed":isChosen?"#edf1ec":"white",fontWeight:isChosen||isCorrect?850:650,cursor:submitted?"default":"pointer"}}>{option}</button>})}</div>{submitted&&<div style={{marginTop:12,padding:"11px 13px",borderRadius:9,background:chosen===question.answer?"#edf5ef":"#fff7e8",lineHeight:1.45}}><strong>{chosen===question.answer?"Rigtigt ✓":"Ikke helt"}</strong><br/>{question.why}</div>}</article>})}
    {!submitted?<button disabled={!allAnswered} onClick={submit} style={{...primary,width:"100%",opacity:allAnswered?1:.5}}>Ret mine 3 svar →</button>:<div style={card}><p style={eyebrow}>RESULTAT</p><h2 style={{fontFamily:"Georgia,serif",fontSize:31,margin:"5px 0"}}>{score}/{round.questions.length}</h2><p style={{margin:"5px 0",color:"#68716c"}}>{score===round.questions.length?"Sikkert arbejde. Prøv gerne en ny runde, så strategien også holder med nye spørgsmål.":"Brug forklaringerne ovenfor og prøv strategien igen med andre spørgsmål."}</p>{saveState&&<p style={{fontSize:13,fontWeight:800,color:"#526b60"}}>{saveState}</p>}<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:13}}><button onClick={retry} style={primary}>Prøv igen med nye spørgsmål →</button><button onClick={backToStrategies} style={secondary}>Vælg anden strategi</button></div></div>}
   </section></div>}
  </>}
 </section></main>
}

const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.5,color:"#718077",margin:0};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:20};
const chip:React.CSSProperties={fontSize:11,fontWeight:850,padding:"5px 8px",borderRadius:999,background:"#edf1ec",color:"#526b60"};
const primary:React.CSSProperties={padding:"12px 16px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={padding:"11px 14px",border:"1px solid #cfcac0",borderRadius:9,background:"white",color:"#365044",fontWeight:850,cursor:"pointer"};
const choice=(active:boolean):React.CSSProperties=>({padding:"9px 12px",borderRadius:9,border:active?"2px solid #526b60":"1px solid #d8d5cd",background:active?"#edf1ec":"white",fontWeight:850,cursor:"pointer",color:"#26342e"});
const strategyCard:React.CSSProperties={display:"grid",gap:8,textAlign:"left",padding:19,border:"1px solid #ddd9d0",borderRadius:13,background:"white",cursor:"pointer",color:"#26342e"};
