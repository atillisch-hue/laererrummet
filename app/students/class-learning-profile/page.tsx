"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import {supabase} from "../../../lib/supabase";

type ClassRow={id:number;name:string};
type StudentRow={
 student_id:number;student_name:string;grade_level:number|null;
 reading_latest:number|null;reading_previous:number|null;reading_delta:number|null;reading_focus:string|null;reading_completed_at:string|null;
 spelling_latest:number|null;spelling_previous:number|null;spelling_delta:number|null;spelling_focus:string|null;spelling_completed_at:string|null;
 grammar_mastered_count:number;grammar_in_progress_count:number;
};

type FocusRow={name:string;count:number};

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.35,color:"#718077",margin:0};
const hint:React.CSSProperties={fontSize:13,color:"#6e756f",lineHeight:1.45};
const chip:React.CSSProperties={display:"inline-flex",alignItems:"center",gap:5,padding:"5px 8px",borderRadius:999,background:"#edf1ec",fontSize:11,fontWeight:850,color:"#526b60"};

function average(values:Array<number|null>){const rows=values.filter((x):x is number=>typeof x==="number"&&Number.isFinite(x));return rows.length?Math.round(rows.reduce((a,b)=>a+b,0)/rows.length):null}
function focusCounts(rows:StudentRow[],key:"reading_focus"|"spelling_focus"):FocusRow[]{const counts=new Map<string,number>();for(const row of rows){const value=row[key];if(value)counts.set(value,(counts.get(value)||0)+1)}return [...counts].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,"da"))}
function trend(delta:number|null){if(delta===null)return{label:"Én måling",symbol:"•",background:"#f1efe9",color:"#6e716e"};if(delta>=5)return{label:`Fremgang +${Math.round(delta)} pp`,symbol:"↑",background:"#edf5ef",color:"#42614f"};if(delta<=-5)return{label:`Bør følges ${Math.round(delta)} pp`,symbol:"↓",background:"#fff0ed",color:"#8c443b"};return{label:`Stabil ${delta>0?"+":""}${Math.round(delta)} pp`,symbol:"→",background:"#fff7e8",color:"#7a6031"}}
function score(value:number|null){return value===null?"—":`${Math.round(value)} %`}

export default function ClassLearningProfile(){
 const search=useSearchParams();
 const[ready,setReady]=useState(false),[classes,setClasses]=useState<ClassRow[]>([]),[classId,setClassId]=useState<number|"">(""),[rows,setRows]=useState<StudentRow[]>([]),[error,setError]=useState("");

 async function loadProfile(id:number){setError("");const{data,error:e}=await supabase.rpc("teacher_class_danish_learning_profile",{p_class_id:id});if(e||!data?.ok){setRows([]);setError(e?.message||data?.error||"Det faglige overblik kunne ikke hentes.");return}setRows((data.students||[]) as StudentRow[])}
 useEffect(()=>{(async()=>{const{data:s}=await supabase.auth.getSession();if(!s.session){window.location.href="/?teacher=1";return}const{data:c,error:e}=await supabase.from("classes").select("id,name").order("id");if(e){setError(e.message);setReady(true);return}const list=(c||[]) as ClassRow[];setClasses(list);const requested=Number(search.get("class")),initial=list.find(x=>x.id===requested)?.id||list[0]?.id||"";setClassId(initial);if(initial)await loadProfile(Number(initial));setReady(true)})()},[search]);
 async function changeClass(id:number){setClassId(id);await loadProfile(id)}

 const readingAverage=useMemo(()=>average(rows.map(r=>r.reading_latest)),[rows]);
 const spellingAverage=useMemo(()=>average(rows.map(r=>r.spelling_latest)),[rows]);
 const readingMeasured=rows.filter(r=>r.reading_latest!==null).length,spellingMeasured=rows.filter(r=>r.spelling_latest!==null).length;
 const readingFocus=useMemo(()=>focusCounts(rows,"reading_focus"),[rows]),spellingFocus=useMemo(()=>focusCounts(rows,"spelling_focus"),[rows]);
 const improving=rows.filter(r=>(r.reading_delta!==null&&r.reading_delta>=5)||(r.spelling_delta!==null&&r.spelling_delta>=5)).length;
 const follow=rows.filter(r=>(r.reading_delta!==null&&r.reading_delta<=-5)||(r.spelling_delta!==null&&r.spelling_delta<=-5)).length;
 const currentClass=classes.find(c=>c.id===classId);

 if(!ready)return <main style={{padding:50}}>Samler klassens faglige overblik…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1120,margin:"auto"}}><Link href={`/students${classId?`?class=${classId}`:""}`} style={{color:"#e8ded2",fontWeight:850,textDecoration:"none"}}>← Klassen</Link><p style={{fontSize:11,fontWeight:900,letterSpacing:1.5,opacity:.68,margin:"20px 0 4px"}}>DANSK · FAGLIG PROGRESSION</p><div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:14,flexWrap:"wrap"}}><div><h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:0}}>Klassens faglige overblik</h1><p style={{margin:"7px 0 0",opacity:.78}}>Læsning, retskrivning og grammatisk mestring samlet som arbejdsbillede.</p></div>{classes.length>1&&<select value={classId} onChange={e=>changeClass(Number(e.target.value))} style={{padding:"10px 13px",borderRadius:8,border:0,minWidth:180}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>}</div></div></header>

  <section style={{maxWidth:1120,margin:"auto",padding:"28px 24px 80px"}}>
   {error&&<div style={{...card,background:"#fff3ef",color:"#8a4038",marginBottom:14,fontWeight:800}}>{error}</div>}
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10}}>
    <div style={card}><p style={eyebrow}>LÆSNING</p><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:34,margin:"7px 0 2px"}}>{readingAverage===null?"—":`${readingAverage}%`}</strong><span style={hint}>{readingMeasured}/{rows.length} elever har en måling</span></div>
    <div style={card}><p style={eyebrow}>RETSKRIVNING</p><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:34,margin:"7px 0 2px"}}>{spellingAverage===null?"—":`${spellingAverage}%`}</strong><span style={hint}>{spellingMeasured}/{rows.length} elever har en måling</span></div>
    <div style={card}><p style={eyebrow}>TYDELIG FREMGANG</p><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:34,margin:"7px 0 2px"}}>{improving}</strong><span style={hint}>elever med ≥ 5 procentpoint fremgang i mindst ét spor</span></div>
    <div style={card}><p style={eyebrow}>BØR FØLGES</p><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:34,margin:"7px 0 2px"}}>{follow}</strong><span style={hint}>fald ≥ 5 procentpoint i mindst ét spor — et signal, ikke en diagnose</span></div>
   </div>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:12,marginTop:14}}>
    <section style={card}><p style={eyebrow}>FÆLLES LÆSEFOKUS</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0 9px"}}>{readingFocus[0]?.name||"Ingen tydelig fælles udfordring endnu"}</h2>{readingFocus.length?<><p style={hint}>{readingFocus[0].count} elev{readingFocus[0].count===1?"":"er"} har dette som svageste målte strategi i seneste prøve.</p><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{readingFocus.slice(0,6).map(x=><span key={x.name} style={chip}>{x.name} · {x.count}</span>)}</div></>:<p style={hint}>Når eleverne har prøvedata, grupperer Klasseværelset deres aktuelle strategifokus her.</p>}</section>
    <section style={card}><p style={eyebrow}>FÆLLES RETSKRIVNINGSFOKUS</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0 9px"}}>{spellingFocus[0]?.name||"Ingen tydelig fælles udfordring endnu"}</h2>{spellingFocus.length?<><p style={hint}>{spellingFocus[0].count} elev{spellingFocus[0].count===1?"":"er"} har dette som svageste målte prøveområde.</p><div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:10}}>{spellingFocus.slice(0,6).map(x=><span key={x.name} style={chip}>{x.name} · {x.count}</span>)}</div></>:<p style={hint}>Når eleverne har retskrivningsprøver, samles deres aktuelle fokusområder her.</p>}</section>
   </div>

   <section style={{...card,marginTop:14,padding:0,overflow:"hidden"}}><div style={{padding:"18px 20px",borderBottom:"1px solid #e7e3da"}}><p style={eyebrow}>ELEVER · {currentClass?.name?.toUpperCase()||"KLASSEN"}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"5px 0"}}>Udvikling elev for elev</h2><p style={{...hint,marginBottom:0}}>Pile viser ændring fra elevens forrige prøve. Brug dem som anledning til at undersøge — ikke som automatisk vurdering af eleven.</p></div>
    {rows.length===0?<div style={{padding:20,color:"#707670"}}>Der er ingen elever eller faglige data at vise endnu.</div>:<div style={{display:"grid"}}>{rows.map(row=>{const rt=trend(row.reading_delta),st=trend(row.spelling_delta);return <article key={row.student_id} style={{display:"grid",gridTemplateColumns:"minmax(180px,1.15fr) repeat(3,minmax(145px,1fr))",gap:10,alignItems:"center",padding:"14px 20px",borderTop:"1px solid #eeeae2"}}><div><Link href={`/students/${row.student_id}`} style={{fontFamily:"Georgia,serif",fontSize:19,fontWeight:900,color:"#26342e",textDecoration:"none"}}>{row.student_name}</Link><div style={{...hint,marginTop:3}}>{row.grade_level!==null?`${row.grade_level}. klasse`:"klassetrin mangler"}</div></div><div><span style={eyebrow}>LÆSNING</span><div style={{fontSize:20,fontWeight:900,marginTop:4}}>{score(row.reading_latest)}</div><span style={{display:"inline-block",marginTop:5,padding:"4px 7px",borderRadius:999,fontSize:10,fontWeight:900,background:rt.background,color:rt.color}}>{rt.symbol} {rt.label}</span>{row.reading_focus&&<div style={{...hint,marginTop:5}}>Fokus: {row.reading_focus}</div>}</div><div><span style={eyebrow}>RETSKRIVNING</span><div style={{fontSize:20,fontWeight:900,marginTop:4}}>{score(row.spelling_latest)}</div><span style={{display:"inline-block",marginTop:5,padding:"4px 7px",borderRadius:999,fontSize:10,fontWeight:900,background:st.background,color:st.color}}>{st.symbol} {st.label}</span>{row.spelling_focus&&<div style={{...hint,marginTop:5}}>Fokus: {row.spelling_focus}</div>}</div><div><span style={eyebrow}>GRAMMATIK</span><div style={{marginTop:5,fontWeight:850}}>✓ {row.grammar_mastered_count} mestret</div><div style={{...hint,marginTop:4}}>{row.grammar_in_progress_count} i gang</div></div></article>})}</div>}
   </section>

   <div style={{...card,marginTop:14,background:"#eef2ed"}}><strong>Sådan skal overblikket bruges</strong><p style={{...hint,margin:"6px 0 0"}}>Det er et lærerarbejdsbillede baseret på de prøver og træningsforløb, der findes i Klasseværelset. Det er ikke en karakter, diagnose eller automatisk afgørelse. Manglende data betyder blot, at eleven endnu ikke er målt i det pågældende spor.</p></div>
  </section>
 </main>;
}
