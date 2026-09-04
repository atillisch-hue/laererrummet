"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";

type SchoolYear={period_start:string;period_end:string;teaching_start:string|null;teaching_end:string|null};
type ScheduleVersion={id:number;name:string;status:"draft"|"published"|"archived";effective_from:string|null;effective_to:string|null};
type PublishWarnings={teaching_missing?:number;teaching_over?:number;staff_overbooked?:number};
type PublishResult={published_version_id:number;published_name:string;effective_from:string;new_draft_version_id:number;preparations_migrated?:number;warnings?:PublishWarnings};
type Props={year:SchoolYear;draft:ScheduleVersion|null;published:ScheduleVersion|null;onPublished:()=>Promise<void>|void};

const isoToday=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const addDays=(value:string,days:number)=>{const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+days);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const dateLabel=(value:string|null)=>value?new Date(`${value}T12:00:00`).toLocaleDateString("da-DK",{day:"numeric",month:"long",year:"numeric"}):"—";
const maxDate=(...values:(string|null|undefined)[])=>values.filter((v):v is string=>!!v).sort().at(-1)||isoToday();
const publicationError=(value:string)=>{
 const prepared=value.match(/detach (\d+) prepared future lesson/);if(prepared)return`Publicering stoppet: ${prepared[1]} forberedt fremtidig lektion${prepared[1]==="1"?"":"er"} ville miste sin sikre kobling til skemaet. Ret skemaændringen eller afklar den berørte forberedelse først.`;
 const conflicts=value.match(/\((\d+) conflicts\)/);if(value.includes("Resolve all schedule conflicts"))return`Publicering stoppet: løs de ${conflicts?.[1]||"registrerede"} skemakonflikter først.`;
 const unresolved=value.match(/\((\d+) unresolved\)/);if(value.includes("safe class-subject link"))return`Publicering stoppet: ${unresolved?.[1]||"en eller flere"} undervisningsbrikker mangler en sikker kobling til klassefag.`;
 const unassigned=value.match(/\((\d+) unassigned\)/);if(value.includes("must be assigned"))return`Publicering stoppet: ${unassigned?.[1]||"en eller flere"} skemabrikker mangler bemanding.`;
 if(value.includes("inactive staff"))return"Publicering stoppet: skemaet indeholder en medarbejder, som ikke længere har aktiv adgang på skolen.";
 if(value.includes("empty schedule"))return"Et tomt skema kan ikke publiceres.";
 return value||"Skemaet kunne ikke publiceres.";
};

export default function PublishSchedulePanel({year,draft,published,onPublished}:Props){
 const defaultDate=useMemo(()=>published?maxDate(isoToday(),addDays(published.effective_from||year.teaching_start||year.period_start,1),year.teaching_start):maxDate(year.teaching_start,year.period_start),[published?.id,published?.effective_from,year.period_start,year.teaching_start]);
 const[publishDate,setPublishDate]=useState(defaultDate),[publishing,setPublishing]=useState(false),[message,setMessage]=useState(""),[error,setError]=useState("");
 useEffect(()=>{setPublishDate(defaultDate);setMessage("");setError("")},[defaultDate,draft?.id]);

 const minDate=published?maxDate(addDays(published.effective_from||year.teaching_start||year.period_start,1),year.teaching_start,isoToday()):maxDate(year.teaching_start,year.period_start);
 const maxPublishDate=year.teaching_end||year.period_end;

 async function publish(){
  if(!draft||publishing)return;
  setMessage("");setError("");
  if(publishDate<minDate||publishDate>maxPublishDate){setError(`Vælg en dato mellem ${dateLabel(minDate)} og ${dateLabel(maxPublishDate)}.`);return}
  const text=published
   ?`Publicér “${draft.name}” fra ${dateLabel(publishDate)}?\n\nDet nuværende skema afsluttes dagen før. Historikken bevares, og Klasseværelset opretter automatisk en ny kladde til næste ændring.`
   :`Publicér “${draft.name}” fra ${dateLabel(publishDate)}?\n\nSkemaet bliver herefter det gældende skema for lærere og forældre. Klasseværelset opretter automatisk en ny arbejdskladde.`;
  if(!window.confirm(text))return;
  setPublishing(true);
  const{data,error:e}=await supabase.rpc("publish_schedule_version_v2",{p_version_id:draft.id,p_effective_from:publishDate});
  if(e){setError(publicationError(e.message));setPublishing(false);return}
  const result=(data||{}) as PublishResult,w=result.warnings||{};
  const warnings=[
   (w.teaching_missing||0)>0?`${w.teaching_missing} fag mangler stadig planlagte minutter`:null,
   (w.teaching_over||0)>0?`${w.teaching_over} fag har flere minutter end behovet`:null,
   (w.staff_overbooked||0)>0?`${w.staff_overbooked} medarbejdere ser overbookede ud`:null
  ].filter(Boolean);
  const moved=result.preparations_migrated||0;
  setMessage(`Skemaet er publiceret fra ${dateLabel(result.effective_from||publishDate)} ✓ Ny arbejdskladde er oprettet automatisk.${moved?` ${moved} fremtidig${moved===1?"":"e"} forberedt${moved===1?" lektion er":"e lektioner er"} sikkert flyttet med til den nye skemaversion.`:""}${warnings.length?` Ledelsesadvarsler: ${warnings.join(" · ")}.`:""}`);
  await onPublished();
  setPublishing(false);
 }

 return <section style={{marginTop:14,padding:15,borderRadius:11,background:"#edf3ee",border:"1px solid #cfdcd2"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"start",flexWrap:"wrap"}}>
   <div style={{maxWidth:720}}><small style={eyebrow}>PUBLICERING</small><h3 style={{fontFamily:"Georgia,serif",fontSize:21,margin:"5px 0"}}>{draft?`Klar til at publicere: ${draft.name}`:"Ingen arbejdskladde"}</h3><p style={{margin:"0",color:"#607067",lineHeight:1.5,fontSize:13}}>{draft?"Ved publicering validerer databasen konflikter, fagkoblinger, bemanding, aktive medarbejdere og allerede forberedte fremtidige lektioner. Den tidligere version låses som historik, og en ny kladde oprettes automatisk.":"Når en arbejdskladde findes, kan den publiceres herfra."}</p></div>
   {published&&<div style={{padding:"8px 10px",borderRadius:8,background:"white",fontSize:12,color:"#5c685f"}}><strong>Gældende nu</strong><br/>{published.name}<br/>fra {dateLabel(published.effective_from)}</div>}
  </div>
  {draft&&<div style={{display:"grid",gridTemplateColumns:"minmax(210px,280px) minmax(180px,auto)",gap:10,alignItems:"end",marginTop:13}}><label style={{fontSize:12,fontWeight:900}}>Gælder fra<input type="date" value={publishDate} min={minDate} max={maxPublishDate} onChange={e=>setPublishDate(e.target.value)} style={field}/><small style={{display:"block",fontWeight:500,color:"#6c756f",marginTop:4}}>Tilladt: {dateLabel(minDate)} – {dateLabel(maxPublishDate)}</small></label><button type="button" onClick={publish} disabled={publishing||!publishDate} style={{border:0,borderRadius:9,padding:"11px 14px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer",opacity:publishing?.55:1,height:42}}>{publishing?"Validerer og publicerer…":"Publicér skema →"}</button></div>}
  {error&&<div style={{marginTop:11,padding:"10px 11px",borderRadius:8,background:"#fff0ed",color:"#7b332b",fontWeight:800,fontSize:13,lineHeight:1.5}}>{error}</div>}
  {message&&<div style={{marginTop:11,padding:"10px 11px",borderRadius:8,background:"white",color:"#365844",fontWeight:800,fontSize:13,lineHeight:1.5}}>{message}</div>}
  <small style={{display:"block",marginTop:10,color:"#69746d",lineHeight:1.45}}>Publicering stoppes automatisk ved skemakonflikter, uafklarede fagkoblinger, manglende/inaktiv bemanding eller risiko for at løsne en lærers allerede forberedte lektion. Afvigelser i norm og undervisningsminutter vises som ledelsesadvarsler og kan vurderes fagligt.</small>
 </section>;
}

const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.25,color:"#65766d"};
const field:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",marginTop:5,padding:"9px 10px",border:"1px solid #bdcbbf",borderRadius:8,background:"white",font:"inherit"};