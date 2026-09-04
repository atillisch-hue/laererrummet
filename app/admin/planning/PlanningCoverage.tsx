"use client";

import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";

type Coverage={class_subject_id:number;class_id:number;class_name:string;subject_title:string;required_weekly_minutes:number;scheduled_average_weekly_minutes:number|string;difference_minutes:number|string;coverage_status:"missing"|"covered"|"over"};
type Health={schedule_version_id:number;lesson_entries:number;explicit_subject_links:number;fallback_title_matches:number;unresolved_lessons:number};
type Props={schoolYearId:number;scheduleVersionId:number|null};

const fmtMinutes=(value:number|string)=>{const n=Math.round(Number(value)||0);if(n===0)return"0 min";const h=Math.floor(Math.abs(n)/60),m=Math.abs(n)%60;return `${n<0?"−":""}${h?`${h} t`:""}${h&&m?" ":""}${m?`${m} min`:""}`};
const tone=(status:Coverage["coverage_status"])=>status==="covered"?{background:"#e5efe8",color:"#365844"}:status==="missing"?{background:"#fff0e9",color:"#8a4a39"}:{background:"#fff6df",color:"#765e24"};
const label=(status:Coverage["coverage_status"])=>status==="covered"?"Dækket":status==="missing"?"Mangler":"For meget";

export default function PlanningCoverage({schoolYearId,scheduleVersionId}:Props){
 const[rows,setRows]=useState<Coverage[]>([]),[health,setHealth]=useState<Health|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;(async()=>{
  setLoading(true);setError("");
  if(!scheduleVersionId){if(live){setRows([]);setHealth(null);setLoading(false)}return}
  const[c,h]=await Promise.all([
   supabase.rpc("school_year_teaching_coverage",{p_school_year_id:schoolYearId,p_schedule_version_id:scheduleVersionId}),
   supabase.rpc("school_year_schedule_match_health",{p_school_year_id:schoolYearId,p_schedule_version_id:scheduleVersionId})
  ]);
  if(!live)return;
  if(c.error||h.error){setError(c.error?.message||h.error?.message||"Dækningen kunne ikke beregnes.");setLoading(false);return}
  setRows((c.data||[]) as Coverage[]);setHealth(((h.data||[])[0]||null) as Health|null);setLoading(false);
 })();return()=>{live=false}},[schoolYearId,scheduleVersionId]);

 const covered=rows.filter(r=>r.coverage_status==="covered").length,missing=rows.filter(r=>r.coverage_status==="missing").length,over=rows.filter(r=>r.coverage_status==="over").length;
 return <section style={{background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20,marginTop:18}}>
  <small style={{fontSize:10,fontWeight:900,letterSpacing:1.35,color:"#718077"}}>AUTOMATISK KONSEKVENS</small>
  <h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0"}}>Dækker kladden undervisningsbehovet?</h2>
  <p style={{color:"#697169",lineHeight:1.5,margin:"5px 0 0",maxWidth:900}}>Hver-uge brikker tæller fuldt. Ulige/lige uger tæller som halvdelen i den gennemsnitlige uge. Beregningen bruger det konkrete klassefag, når det findes, og kun en præcis klasse + fagtitel som overgang for ældre skemabrikker.</p>
  {loading?<p style={{color:"#777"}}>Beregner dækning…</p>:error?<div style={{marginTop:12,padding:12,background:"#fff0ed",borderRadius:8,color:"#7b2f25"}}>{error}</div>:<>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><span style={{padding:"6px 9px",borderRadius:999,background:"#e5efe8",color:"#365844",fontWeight:850,fontSize:12}}>{covered} dækket</span><span style={{padding:"6px 9px",borderRadius:999,background:"#fff0e9",color:"#8a4a39",fontWeight:850,fontSize:12}}>{missing} mangler</span><span style={{padding:"6px 9px",borderRadius:999,background:"#fff6df",color:"#765e24",fontWeight:850,fontSize:12}}>{over} over</span>{health&&<span style={{padding:"6px 9px",borderRadius:999,background:"#eef0ed",color:"#56645d",fontWeight:800,fontSize:12}}>{health.lesson_entries} undervisningsbrikker</span>}</div>
   {health&&health.unresolved_lessons>0&&<div style={{marginTop:12,padding:12,background:"#fff0e9",border:"1px solid #e3b7a8",borderRadius:9,color:"#7c4333"}}><strong>{health.unresolved_lessons} undervisningsbrik{health.unresolved_lessons===1?" kan":"ker kan"} ikke kobles sikkert til et klassefag.</strong> De tæller ikke med i dækningen, før fagkoblingen er rettet.</div>}
   {health&&health.fallback_title_matches>0&&<div style={{marginTop:10,padding:10,background:"#fff8e8",borderRadius:8,color:"#725d2c",fontSize:13}}>{health.fallback_title_matches} ældre brik{health.fallback_title_matches===1?" er":"ker er"} midlertidigt matchet via klasse + præcis fagtitel. De skal senere have en eksplicit fagkobling.</div>}
   <div style={{display:"grid",gap:8,marginTop:14}}>{rows.map(row=>{const d=Number(row.difference_minutes)||0;return <div key={row.class_subject_id} style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) repeat(3,minmax(90px,.45fr))",gap:10,alignItems:"center",padding:"11px 12px",background:"#f8f6f1",borderRadius:9}}><div><strong>{row.class_name} · {row.subject_title}</strong><span style={{...tone(row.coverage_status),display:"inline-block",marginLeft:8,padding:"3px 7px",borderRadius:999,fontSize:10,fontWeight:900}}>{label(row.coverage_status)}</span></div><div><small style={{display:"block",color:"#788078"}}>BEHOV</small><strong>{fmtMinutes(row.required_weekly_minutes)}</strong></div><div><small style={{display:"block",color:"#788078"}}>PLANLAGT</small><strong>{fmtMinutes(row.scheduled_average_weekly_minutes)}</strong></div><div><small style={{display:"block",color:"#788078"}}>FORSKEL</small><strong style={{color:d<0?"#8a4a39":d>0?"#765e24":"#365844"}}>{d>0?"+":""}{fmtMinutes(row.difference_minutes)}</strong></div></div>})}{!rows.length&&<div style={{padding:12,background:"#f7f5ef",borderRadius:8,color:"#707770"}}>Tilføj undervisningsbehov ovenfor. Så beregner Klasseværelset automatisk, om skemakladden dækker dem.</div>}</div>
  </>}
 </section>;
}
