"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";

type ExamRow={assignment_id:number;title:string;target_grade:number;score:number;max_score:number;accuracy:number;completed_at:string};
type ReadingFocus={strategy:string;correct:number;total:number;accuracy:number}|null;
type SpellingFocus={section:string;correct:number;total:number;accuracy:number}|null;
type ReadingTraining={strategy:string;grade:string;attempts:number;best_score:number;last_score:number;max_score:number;last_attempt_at:string|null;mastered:boolean};
type GrammarMastery={topic:string;area:string;target_grade:number|null;source_kind:string|null;attempts:number;best_score:number;best_max_score:number;latest_score:number|null;latest_max_score:number|null;mastered:boolean;updated_at:string};
type Profile={ok:boolean;reading_history:ExamRow[];spelling_history:ExamRow[];reading_delta:number|null;spelling_delta:number|null;reading_focus:ReadingFocus;spelling_focus:SpellingFocus;reading_training:ReadingTraining[];grammar_mastery:GrammarMastery[]};

function percent(value:number|null|undefined){return value===null||value===undefined?"—":`${Math.round(value)} %`}
function date(value:string){return new Date(value).toLocaleDateString("da-DK",{day:"numeric",month:"short",year:"numeric"})}
function trend(value:number|null){if(value===null)return {label:"Mangler tidligere prøve",tone:"#718077",background:"#f4f2ed"};if(value>0)return {label:`↑ ${Math.round(value)} procentpoint`,tone:"#42614f",background:"#edf5ef"};if(value<0)return {label:`↓ ${Math.abs(Math.round(value))} procentpoint`,tone:"#8c443b",background:"#fff0ed"};return {label:"→ Uændret",tone:"#7a6031",background:"#fff7e8"}}
function focusState(accuracy:number){if(accuracy<60)return {label:"Fokus",tone:"#8c443b",background:"#fff0ed"};if(accuracy<80)return {label:"Hold øje",tone:"#7a6031",background:"#fff7e8"};return {label:"Sikker",tone:"#42614f",background:"#edf5ef"}}

export default function LearningProfile({studentId}:{studentId:number}){
 const[profile,setProfile]=useState<Profile|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{let active=true;(async()=>{const{data,error}=await supabase.rpc("teacher_student_danish_learning_profile",{p_student_id:studentId});if(!active)return;if(error||!data?.ok){setError(error?.message||"Den faglige profil kunne ikke hentes.");setLoading(false);return}setProfile(data as Profile);setLoading(false)})();return()=>{active=false}},[studentId]);
 const latestReading=profile?.reading_history?.[0]||null,latestSpelling=profile?.spelling_history?.[0]||null;
 const grammarLatest=useMemo(()=>{const seen=new Set<string>();return(profile?.grammar_mastery||[]).filter(row=>{if(seen.has(row.topic))return false;seen.add(row.topic);return true}).slice(0,10)},[profile]);
 const hasData=Boolean((profile?.reading_history?.length||0)+(profile?.spelling_history?.length||0)+(profile?.reading_training?.length||0)+(profile?.grammar_mastery?.length||0));
 if(loading)return <section style={card}><p style={eyebrow}>FAGLIG PROGRESSION · DANSK</p><p style={muted}>Henter elevens læse- og retskrivningsprofil…</p></section>;
 if(error)return <section style={{...card,background:"#fff7e8"}}><p style={eyebrow}>FAGLIG PROGRESSION · DANSK</p><strong>Profilen kunne ikke hentes</strong><p style={muted}>{error}</p></section>;
 if(!profile||!hasData)return <section style={card}><p style={eyebrow}>FAGLIG PROGRESSION · DANSK</p><h2 style={h2}>Læse- og retskrivningsprofil</h2><p style={muted}>Der er endnu ingen gennemførte læseprøver, retskrivningsprøver eller målrettede danskøvelser. Profilen bliver bygget automatisk, når eleven begynder at arbejde.</p></section>;
 const readingTrend=trend(profile.reading_delta),spellingTrend=trend(profile.spelling_delta);
 return <section style={{...card,marginBottom:18}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><p style={eyebrow}>FAGLIG PROGRESSION · DANSK</p><h2 style={h2}>Læse- og retskrivningsprofil</h2><p style={{...muted,maxWidth:720,marginBottom:0}}>Et samlet arbejdsbillede baseret på elevens egne prøver og træningsforløb. Det er støtte til lærerens vurdering — ikke en automatisk karakter eller diagnose.</p></div><span style={chip}>PERSONALEVISNING</span></div>

  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:10,marginTop:17}}>
   <article style={metricCard}><span style={eyebrow}>LÆSNING · SENESTE PRØVE</span>{latestReading?<><strong style={metric}>{percent(latestReading.accuracy)}</strong><span style={muted}>{latestReading.score}/{latestReading.max_score} · {latestReading.target_grade}. kl. niveau · {date(latestReading.completed_at)}</span><span style={{...trendChip,color:readingTrend.tone,background:readingTrend.background}}>{readingTrend.label}</span></>:<><strong style={metric}>—</strong><span style={muted}>Ingen læseprøve endnu</span></>}</article>
   <article style={metricCard}><span style={eyebrow}>RETSKRIVNING · SENESTE PRØVE</span>{latestSpelling?<><strong style={metric}>{percent(latestSpelling.accuracy)}</strong><span style={muted}>{latestSpelling.score}/{latestSpelling.max_score} · {latestSpelling.target_grade}. kl. niveau · {date(latestSpelling.completed_at)}</span><span style={{...trendChip,color:spellingTrend.tone,background:spellingTrend.background}}>{spellingTrend.label}</span></>:<><strong style={metric}>—</strong><span style={muted}>Ingen retskrivningsprøve endnu</span></>}</article>
  </div>

  {(profile.reading_focus||profile.spelling_focus)&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:10,marginTop:13}}>
   {profile.reading_focus&&(()=>{const state=focusState(profile.reading_focus!.accuracy);return <article style={{...focusCard,background:state.background,borderColor:state.tone}}><span style={{...eyebrow,color:state.tone}}>AKTUELT LÆSEFOKUS · SENESTE PRØVE</span><strong style={{fontFamily:"Georgia,serif",fontSize:23}}>{profile.reading_focus!.strategy}</strong><span style={muted}>{profile.reading_focus!.correct}/{profile.reading_focus!.total} rigtige · {percent(profile.reading_focus!.accuracy)}</span><b style={{color:state.tone,fontSize:12}}>{state.label}</b></article>})()}
   {profile.spelling_focus&&(()=>{const state=focusState(profile.spelling_focus!.accuracy);return <article style={{...focusCard,background:state.background,borderColor:state.tone}}><span style={{...eyebrow,color:state.tone}}>AKTUELT RETSKRIVNINGSFOKUS · SENESTE PRØVE</span><strong style={{fontFamily:"Georgia,serif",fontSize:23}}>{profile.spelling_focus!.section}</strong><span style={muted}>{profile.spelling_focus!.correct}/{profile.spelling_focus!.total} rigtige · {percent(profile.spelling_focus!.accuracy)}</span><b style={{color:state.tone,fontSize:12}}>{state.label}</b></article>})()}
  </div>}

  {(profile.reading_history.length>1||profile.spelling_history.length>1)&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12,marginTop:18}}>
   <History title="Læseprøver" rows={profile.reading_history}/><History title="Retskrivningsprøver" rows={profile.spelling_history}/>
  </div>}

  {(profile.reading_training.length>0||grammarLatest.length>0)&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12,marginTop:18}}>
   <section style={subCard}><p style={eyebrow}>LÆSESTRATEGIER · MÅLRETTET TRÆNING</p><h3 style={h3}>Strategier eleven har trænet</h3>{profile.reading_training.length===0?<p style={muted}>Ingen målrettet strategitræning endnu.</p>:<div style={{display:"grid",gap:7}}>{profile.reading_training.slice(0,10).map(row=><div key={`${row.strategy}-${row.grade}`} style={listRow}><div><strong>{row.strategy}</strong><small style={meta}>{row.grade}. kl. niveau · {row.attempts} forsøg · senest {row.last_score}/{row.max_score}</small></div><span style={{...statusChip,background:row.mastered?"#edf5ef":"#fff7e8",color:row.mastered?"#42614f":"#7a6031"}}>{row.mastered?"Sikker ✓":"Træner"}</span></div>)}</div>}</section>
   <section style={subCard}><p style={eyebrow}>GRAMMATIK & RETSKRIVNING</p><h3 style={h3}>Seneste træningsområder</h3>{grammarLatest.length===0?<p style={muted}>Ingen grammatiktildelinger med resultat endnu.</p>:<div style={{display:"grid",gap:7}}>{grammarLatest.map(row=><div key={`${row.topic}-${row.updated_at}`} style={listRow}><div><strong>{row.topic}</strong><small style={meta}>{row.target_grade?`${row.target_grade}. kl. niveau · `:""}{row.attempts} forsøg · bedste {row.best_score}/{row.best_max_score||"—"}</small></div><span style={{...statusChip,background:row.mastered?"#edf5ef":"#fff7e8",color:row.mastered?"#42614f":"#7a6031"}}>{row.mastered?"Mestret ✓":"I gang"}</span></div>)}</div>}</section>
  </div>}
 </section>
}

function History({title,rows}:{title:string;rows:ExamRow[]}){return <section style={subCard}><p style={eyebrow}>UDVIKLING OVER TID</p><h3 style={h3}>{title}</h3><div style={{display:"grid",gap:8}}>{rows.map((row,index)=><div key={`${row.assignment_id}-${row.completed_at}`}><div style={{display:"flex",justifyContent:"space-between",gap:8,fontSize:12}}><span><strong>{index===0?"Senest · ":""}{date(row.completed_at)}</strong> · {row.target_grade}. kl.</span><b>{percent(row.accuracy)}</b></div><div style={{height:7,borderRadius:999,background:"#ece9e2",overflow:"hidden",marginTop:5}}><div style={{height:"100%",width:`${Math.max(0,Math.min(100,row.accuracy||0))}%`,background:"#607b6d"}}/></div></div>)}</div></section>}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:22};
const subCard:React.CSSProperties={background:"#faf9f6",border:"1px solid #e4e0d8",borderRadius:11,padding:15};
const metricCard:React.CSSProperties={display:"grid",gap:6,background:"#faf9f6",border:"1px solid #e4e0d8",borderRadius:11,padding:15};
const focusCard:React.CSSProperties={display:"grid",gap:5,border:"1px solid",borderRadius:11,padding:15};
const listRow:React.CSSProperties={display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,padding:"9px 0",borderTop:"1px solid #e8e4dc"};
const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:27,margin:"6px 0 8px"};
const h3:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:20,margin:"5px 0 11px"};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const muted:React.CSSProperties={color:"#707670",fontSize:13,lineHeight:1.45};
const meta:React.CSSProperties={display:"block",color:"#718077",fontSize:12,marginTop:3};
const metric:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:31,color:"#365044"};
const chip:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:.6,padding:"6px 8px",borderRadius:999,background:"#edf1ec",color:"#526b60"};
const trendChip:React.CSSProperties={justifySelf:"start",fontSize:11,fontWeight:900,padding:"5px 8px",borderRadius:999,marginTop:3};
const statusChip:React.CSSProperties={whiteSpace:"nowrap",fontSize:11,fontWeight:900,padding:"5px 8px",borderRadius:999};
