"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";

type Profile={id:number;school_id:number;user_id:string;school_year:string;period_start:string;period_end:string;annual_target_minutes:number;weekly_target_minutes:number|null;employment_percent:number|null};
type Entry={id:number;work_date:string;starts_at:string;ends_at:string;category:string;note:string|null};
type Props={selectedDate:string;viewedUserId:string;currentUserId:string;viewedName:string;isAdmin:boolean;onChanged?:()=>void};

const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const mondayOf=(value:string)=>{const d=new Date(`${value}T12:00:00`);const day=d.getDay()||7;d.setDate(d.getDate()-(day-1));return d};
const mins=(start:string,end:string)=>{const[a,b]=[start,end].map(v=>{const[h,m]=v.slice(0,5).split(":").map(Number);return h*60+m});return Math.max(0,b-a)};
const fmt=(value:number)=>{const sign=value<0?"−":value>0?"+":"",x=Math.abs(Math.round(value)),h=Math.floor(x/60),m=x%60;return `${sign}${h} t${m?` ${m} min`:""}`};
const categoryLabel=(value:string)=>({teaching:"Undervisning",preparation:"Forberedelse",meeting:"Møde",supervision:"Tilsyn / gårdvagt",administration:"Administration",other:"Andet arbejde"}[value]||value);
const currentSchoolYear=()=>{const n=new Date(),year=n.getFullYear();return n.getMonth()>=7?`${year}/${year+1}`:`${year-1}/${year}`};
const defaultYearDates=()=>{const n=new Date(),startYear=n.getMonth()>=7?n.getFullYear():n.getFullYear()-1;return{start:`${startYear}-08-01`,end:`${startYear+1}-07-31`}};

export default function WorkTimePanel({selectedDate,viewedUserId,currentUserId,viewedName,isAdmin,onChanged}:Props){
 const[profile,setProfile]=useState<Profile|null>(null);
 const[weekEntries,setWeekEntries]=useState<Entry[]>([]);
 const[yearEntries,setYearEntries]=useState<Entry[]>([]);
 const[schoolId,setSchoolId]=useState<number|null>(null);
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");
 const[showAdd,setShowAdd]=useState(false);
 const[showNorm,setShowNorm]=useState(false);
 const[workDate,setWorkDate]=useState(selectedDate);
 const[from,setFrom]=useState("08:00"),[to,setTo]=useState("08:30"),[category,setCategory]=useState("preparation"),[note,setNote]=useState("");
 const[saving,setSaving]=useState(false);
 const defaults=defaultYearDates();
 const[normYear,setNormYear]=useState(currentSchoolYear()),[periodStart,setPeriodStart]=useState(defaults.start),[periodEnd,setPeriodEnd]=useState(defaults.end),[annualHours,setAnnualHours]=useState(""),[weeklyHours,setWeeklyHours]=useState(""),[employment,setEmployment]=useState("");

 const monday=useMemo(()=>mondayOf(selectedDate),[selectedDate]);
 const sunday=useMemo(()=>{const d=new Date(monday);d.setDate(d.getDate()+6);return d},[monday]);
 const canEdit=viewedUserId===currentUserId||isAdmin;

 async function load(){
  if(!viewedUserId)return;
  setLoading(true);setError("");
  const weekStart=iso(monday),weekEnd=iso(sunday);
  const[pRes,wRes,mRes]=await Promise.all([
   supabase.from("staff_work_profiles").select("id,school_id,user_id,school_year,period_start,period_end,annual_target_minutes,weekly_target_minutes,employment_percent").eq("user_id",viewedUserId).lte("period_start",selectedDate).gte("period_end",selectedDate).order("period_start",{ascending:false}).limit(1).maybeSingle(),
   supabase.from("work_time_entries").select("id,work_date,starts_at,ends_at,category,note").eq("user_id",viewedUserId).gte("work_date",weekStart).lte("work_date",weekEnd).order("work_date").order("starts_at"),
   supabase.from("school_memberships").select("school_id").eq("user_id",currentUserId).eq("active",true).in("role",["teacher","admin","leader"]).limit(1).maybeSingle()
  ]);
  const p=(pRes.data||null) as Profile|null;setProfile(p);setWeekEntries((wRes.data||[]) as Entry[]);setSchoolId(mRes.data?.school_id?Number(mRes.data.school_id):null);
  if(p){
   const{data,error:e}=await supabase.from("work_time_entries").select("id,work_date,starts_at,ends_at,category,note").eq("user_id",viewedUserId).gte("work_date",p.period_start).lte("work_date",p.period_end).order("work_date");
   setYearEntries((data||[]) as Entry[]);if(e)setError(e.message);
   setNormYear(p.school_year);setPeriodStart(p.period_start);setPeriodEnd(p.period_end);setAnnualHours((p.annual_target_minutes/60).toString());setWeeklyHours(p.weekly_target_minutes?(p.weekly_target_minutes/60).toString():"");setEmployment(p.employment_percent?.toString()||"");
  }else setYearEntries([]);
  const problem=pRes.error||wRes.error||mRes.error;if(problem)setError(problem.message||"Arbejdstiden kunne ikke hentes helt.");
  setLoading(false);
 }
 useEffect(()=>{setWorkDate(selectedDate)},[selectedDate]);
 useEffect(()=>{load()},[viewedUserId,selectedDate]);

 const weekMinutes=weekEntries.reduce((s,e)=>s+mins(e.starts_at,e.ends_at),0);
 const yearMinutes=yearEntries.reduce((s,e)=>s+mins(e.starts_at,e.ends_at),0);
 const weekBalance=profile?.weekly_target_minutes!=null?weekMinutes-profile.weekly_target_minutes:null;

 async function addEntry(){
  if(!canEdit||!workDate||!from||!to||mins(from,to)<=0)return;
  setSaving(true);setError("");
  const{error:e}=await supabase.rpc("create_work_time_entry",{p_user_id:viewedUserId,p_work_date:workDate,p_starts_at:from,p_ends_at:to,p_category:category,p_note:note.trim()||null});
  if(e)setError(e.message);else{setNote("");setShowAdd(false);await load();onChanged?.()}
  setSaving(false);
 }
 async function removeEntry(id:number){
  if(!canEdit||!window.confirm("Slet denne arbejdstidsregistrering?"))return;
  const{error:e}=await supabase.rpc("delete_work_time_entry",{p_entry_id:id});if(e)setError(e.message);else{await load();onChanged?.()}
 }
 async function saveNorm(){
  if(!isAdmin||!schoolId||!normYear.trim()||!periodStart||!periodEnd)return;
  const annual=Number(annualHours),weekly=weeklyHours.trim()?Number(weeklyHours):null,employmentValue=employment.trim()?Number(employment):null;
  if(!annual||annual<=0||periodEnd<periodStart){setError("Kontrollér årsnorm og periode.");return}
  setSaving(true);setError("");
  const payload={school_id:schoolId,user_id:viewedUserId,school_year:normYear.trim(),period_start:periodStart,period_end:periodEnd,annual_target_minutes:Math.round(annual*60),weekly_target_minutes:weekly&&weekly>0?Math.round(weekly*60):null,employment_percent:employmentValue&&employmentValue>0?employmentValue:null,updated_at:new Date().toISOString()};
  const{error:e}=await supabase.from("staff_work_profiles").upsert(payload,{onConflict:"school_id,user_id,school_year"});
  if(e)setError(e.message);else{setShowNorm(false);await load();onChanged?.()}
  setSaving(false);
 }

 return <section style={{marginTop:14,background:"white",border:"1px solid #ddd9d0",borderRadius:16,padding:16}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><p style={eyebrow}>ARBEJDSTID</p><h2 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"4px 0 0"}}>{viewedName}</h2></div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{isAdmin&&<button type="button" onClick={()=>setShowNorm(v=>!v)} style={secondary}>{showNorm?"Luk norm":"Indstil årsnorm"}</button>}{canEdit&&<button type="button" onClick={()=>setShowAdd(v=>!v)} style={primary}>{showAdd?"Luk":"+ Registrér arbejdstid"}</button>}</div></div>
  {loading?<p style={{color:"#777"}}>Henter arbejdstid…</p>:<><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8,marginTop:12}}><div style={stat}><small>DENNE UGE</small><strong>{fmt(weekMinutes)}</strong>{weekBalance!=null&&<span style={{color:weekBalance<0?"#8a5448":"#496b58",fontWeight:800}}>{weekBalance===0?"På uge-normen":`${fmt(weekBalance)} ift. uge-norm`}</span>}</div><div style={stat}><small>ÅR TIL DATO</small><strong>{fmt(yearMinutes)}</strong>{profile?<span>{fmt(profile.annual_target_minutes)} årsramme</span>:<span>Årsnorm er ikke sat endnu</span>}</div>{profile&&<div style={stat}><small>PERIODE</small><strong>{profile.school_year}</strong><span>{new Date(profile.period_start+"T12:00:00").toLocaleDateString("da-DK")} – {new Date(profile.period_end+"T12:00:00").toLocaleDateString("da-DK")}</span></div>}</div>
   {error&&<div style={{marginTop:10,padding:"10px 12px",background:"#fff3cd",borderRadius:8,color:"#765b29"}}>{error}</div>}
   {showNorm&&isAdmin&&<div style={formBox}><strong>Årsnorm for {viewedName}</strong><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8,marginTop:8}}><label style={label}>Skoleår<input value={normYear} onChange={e=>setNormYear(e.target.value)} style={input}/></label><label style={label}>Fra<input type="date" value={periodStart} onChange={e=>setPeriodStart(e.target.value)} style={input}/></label><label style={label}>Til<input type="date" value={periodEnd} onChange={e=>setPeriodEnd(e.target.value)} style={input}/></label><label style={label}>Årsnorm, timer<input type="number" step="0.25" min="1" value={annualHours} onChange={e=>setAnnualHours(e.target.value)} style={input}/></label><label style={label}>Uge-norm, timer <small>(valgfrit)</small><input type="number" step="0.25" min="1" value={weeklyHours} onChange={e=>setWeeklyHours(e.target.value)} style={input}/></label><label style={label}>Ansættelse % <small>(valgfrit)</small><input type="number" step="0.1" min="1" max="100" value={employment} onChange={e=>setEmployment(e.target.value)} style={input}/></label></div><button type="button" disabled={saving||!annualHours} onClick={saveNorm} style={{...primary,marginTop:10}}>{saving?"Gemmer…":"Gem norm"}</button></div>}
   {showAdd&&canEdit&&<div style={formBox}><strong>Registrér en arbejdsblok</strong><p style={{margin:"4px 0 8px",color:"#717771",fontSize:13}}>Du kan lave flere blokke samme dag — fx forberedelse om morgenen og igen om aftenen.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:8}}><label style={label}>Dato<input type="date" value={workDate} onChange={e=>setWorkDate(e.target.value)} style={input}/></label><label style={label}>Fra<input type="time" value={from} onChange={e=>setFrom(e.target.value)} style={input}/></label><label style={label}>Til<input type="time" value={to} onChange={e=>setTo(e.target.value)} style={input}/></label><label style={label}>Type<select value={category} onChange={e=>setCategory(e.target.value)} style={input}><option value="preparation">Forberedelse</option><option value="teaching">Undervisning</option><option value="meeting">Møde</option><option value="supervision">Tilsyn / gårdvagt</option><option value="administration">Administration</option><option value="other">Andet arbejde</option></select></label></div><label style={{...label,marginTop:8}}>Note <small>(valgfrit)</small><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Fx årsplan, rettearbejde eller forældrekontakt" style={input}/></label><button type="button" disabled={saving||mins(from,to)<=0} onClick={addEntry} style={{...primary,marginTop:10}}>{saving?"Gemmer…":"Gem arbejdsblok"}</button></div>}
   <div style={{marginTop:12}}><strong style={{fontSize:13}}>Registreret denne uge</strong>{weekEntries.length===0?<p style={{color:"#7d827d",fontSize:13,margin:"6px 0 0"}}>Ingen arbejdsblokke er registreret endnu.</p>:<div style={{display:"grid",gap:6,marginTop:7}}>{weekEntries.map(e=><div key={e.id} style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",padding:"8px 10px",background:"#eef3f5",border:"1px solid #dbe4e8",borderRadius:8}}><div><strong style={{fontSize:12}}>{new Date(e.work_date+"T12:00:00").toLocaleDateString("da-DK",{weekday:"short",day:"numeric",month:"short"})} · {e.starts_at.slice(0,5)}–{e.ends_at.slice(0,5)}</strong><small style={{display:"block",color:"#637078",marginTop:2}}>{categoryLabel(e.category)}{e.note?` · ${e.note}`:""}</small></div>{canEdit&&<button type="button" onClick={()=>removeEntry(e.id)} style={deleteButton}>Slet</button>}</div>)}</div>}</div>
  </>}
 </section>;
}

const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const primary:React.CSSProperties={border:0,borderRadius:8,padding:"9px 12px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={border:"1px solid #d8d5cd",borderRadius:8,padding:"9px 12px",background:"white",color:"#365044",fontWeight:900,cursor:"pointer"};
const stat:React.CSSProperties={background:"#f7f6f2",border:"1px solid #e2ded5",borderRadius:10,padding:"11px 12px",display:"grid",gap:3};
const formBox:React.CSSProperties={marginTop:12,padding:13,background:"#f7f5ef",border:"1px solid #e2ded5",borderRadius:10};
const label:React.CSSProperties={fontSize:12,fontWeight:800};
const input:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",marginTop:4,padding:"8px 9px",border:"1px solid #d8d5cd",borderRadius:7,background:"white",font:"inherit"};
const deleteButton:React.CSSProperties={border:"1px solid #e0c8c3",background:"white",color:"#8a463c",borderRadius:7,padding:"5px 7px",fontSize:11,fontWeight:900,cursor:"pointer"};
