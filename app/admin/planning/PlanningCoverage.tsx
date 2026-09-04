"use client";

import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";

type Coverage={class_subject_id:number;class_id:number;class_name:string;subject_title:string;required_weekly_minutes:number;scheduled_average_weekly_minutes:number|string;difference_minutes:number|string;coverage_status:"missing"|"covered"|"over"};
type Health={schedule_version_id:number;lesson_entries:number;explicit_subject_links:number;fallback_title_matches:number;unresolved_lessons:number};
type ResourceRow={user_id:string;annual_target_minutes:number;employment_percent:number|string|null;teaching_minutes:number|string;scheduled_other_minutes:number|string;allocation_minutes:number|string;planned_minutes:number|string;remaining_minutes:number|string;utilization_percent:number|string|null;resource_status:"overbooked"|"fully_allocated"|"unallocated"};
type StaffHealth={schedule_version_id:number;staff_relevant_entries:number;assigned_entries:number;unassigned_entries:number};
type Props={schoolYearId:number;scheduleVersionId:number|null};

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20,marginTop:18};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.35,color:"#718077"};
const heading:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0"};
const muted:React.CSSProperties={color:"#697169",lineHeight:1.5,margin:"5px 0 0",maxWidth:900};
const fmtMinutes=(value:number|string)=>{const n=Math.round(Number(value)||0);if(n===0)return"0 min";const h=Math.floor(Math.abs(n)/60),m=Math.abs(n)%60;return `${n<0?"−":""}${h?`${h} t`:""}${h&&m?" ":""}${m?`${m} min`:""}`};
const tone=(status:Coverage["coverage_status"])=>status==="covered"?{background:"#e5efe8",color:"#365844"}:status==="missing"?{background:"#fff0e9",color:"#8a4a39"}:{background:"#fff6df",color:"#765e24"};
const coverageLabel=(status:Coverage["coverage_status"])=>status==="covered"?"Dækket":status==="missing"?"Mangler":"For meget";
const resourceTone=(status:ResourceRow["resource_status"])=>status==="fully_allocated"?{background:"#e5efe8",color:"#365844"}:status==="overbooked"?{background:"#fff0e9",color:"#8a4a39"}:{background:"#eef0ed",color:"#56645d"};
const resourceLabel=(status:ResourceRow["resource_status"])=>status==="fully_allocated"?"Fuldt fordelt":status==="overbooked"?"Overbooket":"Ikke fuldt fordelt";

export default function PlanningCoverage({schoolYearId,scheduleVersionId}:Props){
 const[rows,setRows]=useState<Coverage[]>([]),[health,setHealth]=useState<Health|null>(null),[resources,setResources]=useState<ResourceRow[]>([]),[staffHealth,setStaffHealth]=useState<StaffHealth|null>(null),[names,setNames]=useState<Record<string,string>>({}),[abbreviations,setAbbreviations]=useState<Record<string,string>>({}),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;(async()=>{
  setLoading(true);setError("");
  if(!scheduleVersionId){if(live){setRows([]);setHealth(null);setResources([]);setStaffHealth(null);setLoading(false)}return}
  const[c,h,r,sh]=await Promise.all([
   supabase.rpc("school_year_teaching_coverage",{p_school_year_id:schoolYearId,p_schedule_version_id:scheduleVersionId}),
   supabase.rpc("school_year_schedule_match_health",{p_school_year_id:schoolYearId,p_schedule_version_id:scheduleVersionId}),
   supabase.rpc("school_year_staff_resource_impact",{p_school_year_id:schoolYearId,p_schedule_version_id:scheduleVersionId}),
   supabase.rpc("school_year_staff_schedule_health",{p_school_year_id:schoolYearId,p_schedule_version_id:scheduleVersionId})
  ]);
  if(!live)return;
  if(c.error||h.error||r.error||sh.error){setError(c.error?.message||h.error?.message||r.error?.message||sh.error?.message||"Konsekvensberegningen kunne ikke gennemføres.");setLoading(false);return}
  const resourceRows=(r.data||[]) as ResourceRow[];
  setRows((c.data||[]) as Coverage[]);setHealth(((h.data||[])[0]||null) as Health|null);setResources(resourceRows);setStaffHealth(((sh.data||[])[0]||null) as StaffHealth|null);
  const ids=resourceRows.map(x=>x.user_id);
  if(ids.length){
   const[pRes,dRes]=await Promise.all([
    supabase.from("user_profiles").select("user_id,display_name").in("user_id",ids),
    supabase.from("staff_directory_profiles").select("user_id,abbreviation").in("user_id",ids)
   ]);
   if(live){
    setNames(Object.fromEntries((pRes.data||[]).map((x:any)=>[x.user_id,x.display_name||"Medarbejder"])));
    setAbbreviations(Object.fromEntries((dRes.data||[]).filter((x:any)=>x.abbreviation).map((x:any)=>[x.user_id,x.abbreviation])));
   }
  } else if(live){setNames({});setAbbreviations({})}
  if(live)setLoading(false);
 })();return()=>{live=false}},[schoolYearId,scheduleVersionId]);

 const covered=rows.filter(r=>r.coverage_status==="covered").length,missing=rows.filter(r=>r.coverage_status==="missing").length,over=rows.filter(r=>r.coverage_status==="over").length;
 const overbooked=resources.filter(r=>r.resource_status==="overbooked").length,fully=resources.filter(r=>r.resource_status==="fully_allocated").length,unallocated=resources.filter(r=>r.resource_status==="unallocated").length;

 return <>
  <section style={card}>
   <small style={eyebrow}>AUTOMATISK KONSEKVENS</small>
   <h2 style={heading}>Dækker kladden undervisningsbehovet?</h2>
   <p style={muted}>Hver-uge brikker tæller fuldt. Ulige/lige uger tæller som halvdelen i den gennemsnitlige uge. Beregningen bruger det konkrete klassefag, når det findes, og kun en præcis klasse + fagtitel som overgang for ældre skemabrikker.</p>
   {loading?<p style={{color:"#777"}}>Beregner dækning…</p>:error?<div style={{marginTop:12,padding:12,background:"#fff0ed",borderRadius:8,color:"#7b2f25"}}>{error}</div>:<>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><span style={{padding:"6px 9px",borderRadius:999,background:"#e5efe8",color:"#365844",fontWeight:850,fontSize:12}}>{covered} dækket</span><span style={{padding:"6px 9px",borderRadius:999,background:"#fff0e9",color:"#8a4a39",fontWeight:850,fontSize:12}}>{missing} mangler</span><span style={{padding:"6px 9px",borderRadius:999,background:"#fff6df",color:"#765e24",fontWeight:850,fontSize:12}}>{over} over</span>{health&&<span style={{padding:"6px 9px",borderRadius:999,background:"#eef0ed",color:"#56645d",fontWeight:800,fontSize:12}}>{health.lesson_entries} undervisningsbrikker</span>}</div>
    {health&&health.unresolved_lessons>0&&<div style={{marginTop:12,padding:12,background:"#fff0e9",border:"1px solid #e3b7a8",borderRadius:9,color:"#7c4333"}}><strong>{health.unresolved_lessons} undervisningsbrik{health.unresolved_lessons===1?" kan":"ker kan"} ikke kobles sikkert til et klassefag.</strong> De tæller ikke med i dækningen, før fagkoblingen er rettet.</div>}
    {health&&health.fallback_title_matches>0&&<div style={{marginTop:10,padding:10,background:"#fff8e8",borderRadius:8,color:"#725d2c",fontSize:13}}>{health.fallback_title_matches} ældre brik{health.fallback_title_matches===1?" er":"ker er"} midlertidigt matchet via klasse + præcis fagtitel. De skal senere have en eksplicit fagkobling.</div>}
    <div style={{display:"grid",gap:8,marginTop:14}}>{rows.map(row=>{const d=Number(row.difference_minutes)||0;return <div key={row.class_subject_id} style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) repeat(3,minmax(90px,.45fr))",gap:10,alignItems:"center",padding:"11px 12px",background:"#f8f6f1",borderRadius:9,overflowX:"auto"}}><div><strong>{row.class_name} · {row.subject_title}</strong><span style={{...tone(row.coverage_status),display:"inline-block",marginLeft:8,padding:"3px 7px",borderRadius:999,fontSize:10,fontWeight:900}}>{coverageLabel(row.coverage_status)}</span></div><div><small style={{display:"block",color:"#788078"}}>BEHOV</small><strong>{fmtMinutes(row.required_weekly_minutes)}</strong></div><div><small style={{display:"block",color:"#788078"}}>PLANLAGT</small><strong>{fmtMinutes(row.scheduled_average_weekly_minutes)}</strong></div><div><small style={{display:"block",color:"#788078"}}>FORSKEL</small><strong style={{color:d<0?"#8a4a39":d>0?"#765e24":"#365844"}}>{d>0?"+":""}{fmtMinutes(row.difference_minutes)}</strong></div></div>})}{!rows.length&&<div style={{padding:12,background:"#f7f5ef",borderRadius:8,color:"#707770"}}>Tilføj undervisningsbehov ovenfor. Så beregner Klasseværelset automatisk, om skemakladden dækker dem.</div>}</div>
   </>}
  </section>

  <section style={card}>
   <small style={eyebrow}>PERSONALERESSOURCE</small>
   <h2 style={heading}>Hvad gør planen ved medarbejdernes årsnorm?</h2>
   <p style={muted}>Beregningen tæller de faktiske skoledage mellem første og sidste undervisningsdag, springer lukkedage over og respekterer ulige/lige uger. Undervisning, samling/vagter/andre bemandede skemabrikker og årsopgaver lægges sammen.</p>
   {!loading&&!error&&<>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><span style={{padding:"6px 9px",borderRadius:999,background:"#e5efe8",color:"#365844",fontWeight:850,fontSize:12}}>{fully} fuldt fordelt</span><span style={{padding:"6px 9px",borderRadius:999,background:"#eef0ed",color:"#56645d",fontWeight:850,fontSize:12}}>{unallocated} ikke fuldt fordelt</span><span style={{padding:"6px 9px",borderRadius:999,background:"#fff0e9",color:"#8a4a39",fontWeight:850,fontSize:12}}>{overbooked} overbooket</span></div>
    {staffHealth&&staffHealth.unassigned_entries>0&&<div style={{marginTop:12,padding:12,background:"#fff0e9",border:"1px solid #e3b7a8",borderRadius:9,color:"#7c4333"}}><strong>{staffHealth.unassigned_entries} bemandingsrelevant skemabrik{staffHealth.unassigned_entries===1?" mangler":"ker mangler"} en medarbejder.</strong> De timer kan derfor endnu ikke indgå i personernes ressourceberegning.</div>}
    <div style={{display:"grid",gap:9,marginTop:14}}>{resources.map(row=>{const remaining=Number(row.remaining_minutes)||0,pct=Number(row.utilization_percent)||0;const display=names[row.user_id]||"Medarbejder";const abbr=abbreviations[row.user_id];return <div key={row.user_id} style={{padding:"13px 14px",background:"#f8f6f1",borderRadius:10}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><strong>{abbr?`${abbr} · `:""}{display}</strong><span style={{...resourceTone(row.resource_status),display:"inline-block",marginLeft:8,padding:"3px 7px",borderRadius:999,fontSize:10,fontWeight:900}}>{resourceLabel(row.resource_status)}</span><small style={{display:"block",color:"#747c75",marginTop:3}}>{row.employment_percent?`${Number(row.employment_percent).toLocaleString("da-DK",{maximumFractionDigits:1})}% ansættelse · `:""}{pct.toLocaleString("da-DK",{maximumFractionDigits:1})}% af årsnormen fordelt</small></div><div style={{fontWeight:900,color:remaining<0?"#8a4a39":"#365844"}}>{remaining<0?`${fmtMinutes(Math.abs(remaining))} over`:`${fmtMinutes(remaining)} endnu ikke fordelt`}</div></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginTop:10}}><Metric label="Årsnorm" value={fmtMinutes(row.annual_target_minutes)}/><Metric label="Undervisning" value={fmtMinutes(row.teaching_minutes)}/><Metric label="Skema øvrigt" value={fmtMinutes(row.scheduled_other_minutes)}/><Metric label="Årsopgaver" value={fmtMinutes(row.allocation_minutes)}/><Metric label="Planlagt i alt" value={fmtMinutes(row.planned_minutes)}/></div></div>})}{!resources.length&&<div style={{padding:12,background:"#f7f5ef",borderRadius:8,color:"#707770"}}>Der er endnu ingen årsnormer knyttet til skoleåret. Når de oprettes, vises ressourcekonsekvensen her.</div>}</div>
    <div style={{marginTop:12,padding:11,background:"#eef2ec",borderRadius:8,color:"#526158",fontSize:13}}><strong>Vigtigt:</strong> “Ikke fuldt fordelt” betyder kun, at timerne endnu ikke findes i planmodellen. Det er ikke det samme som, at medarbejderen mangler reelt arbejde.</div>
   </>}
  </section>
 </>;
}

function Metric({label,value}:{label:string;value:string}){return <div style={{background:"white",border:"1px solid #e4e0d7",borderRadius:8,padding:"8px 9px"}}><small style={{display:"block",fontSize:9,fontWeight:900,letterSpacing:.7,color:"#7a827b"}}>{label.toUpperCase()}</small><strong style={{display:"block",marginTop:3}}>{value}</strong></div>}
