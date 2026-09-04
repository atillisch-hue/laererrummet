"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";

type SchoolYear={id:number;school_id:number;label:string;period_start:string;period_end:string;teaching_start:string|null;teaching_end:string|null;status:"draft"|"active"|"archived"};
type StaffDirectory={user_id:string;abbreviation:string|null;personnel_group:string};
type UserProfile={user_id:string;display_name:string;active:boolean};
type WorkProfile={user_id:string;annual_target_minutes:number;weekly_target_minutes:number|null;employment_percent:number|null};
type Allocation={id:number;user_id:string;category:string;title:string;planned_minutes:number;notes:string|null;active:boolean};
type Requirement={id:number;class_subject_id:number;weekly_minutes:number;notes:string|null};
type ScheduleVersion={id:number;name:string;status:"draft"|"published"|"archived";effective_from:string|null;effective_to:string|null;created_at:string};
type Klass={id:number;name:string};
type ClassSubject={id:number;class_id:number;title:string};
type CalendarEvent={id:number;closes_school:boolean;event_kind:string};
type StaffRow=StaffDirectory&{display_name:string;active:boolean;work?:WorkProfile;allocated_minutes:number};

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"10px 11px",border:"1px solid #d3cfc5",borderRadius:8,background:"white",font:"inherit"};
const label:React.CSSProperties={display:"grid",gap:5,fontSize:12,fontWeight:850};
const primary:React.CSSProperties={border:0,borderRadius:8,padding:"10px 14px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={border:"1px solid #d3cfc5",borderRadius:8,padding:"9px 12px",background:"white",color:"#365044",fontWeight:850,cursor:"pointer"};
const categories=[["preparation","Forberedelse"],["meeting","Møder"],["duty","Tilsyn / vagter"],["leadership","Ledelse"],["amr","AMR"],["tr","TR"],["reading_specialist","Læsevejleder"],["project","Projekt"],["administration","Administration"],["other","Andet"]] as const;
const categoryLabel=(value:string)=>categories.find(([id])=>id===value)?.[1]||value;
const hours=(minutes:number)=>`${(minutes/60).toLocaleString("da-DK",{maximumFractionDigits:1})} t`;
const dateText=(value:string|null)=>value?new Date(value+"T12:00:00").toLocaleDateString("da-DK"):"—";
const statusLabel=(value:string)=>({draft:"Kladde",published:"Publiceret",archived:"Arkiveret",active:"Aktivt"}[value]||value);

export default function PlanningPage(){
 const[ready,setReady]=useState(false),[schoolId,setSchoolId]=useState<number|null>(null),[year,setYear]=useState<SchoolYear|null>(null);
 const[staff,setStaff]=useState<StaffRow[]>([]),[allocations,setAllocations]=useState<Allocation[]>([]),[requirements,setRequirements]=useState<Requirement[]>([]),[versions,setVersions]=useState<ScheduleVersion[]>([]),[classes,setClasses]=useState<Klass[]>([]),[subjects,setSubjects]=useState<ClassSubject[]>([]),[calendarEvents,setCalendarEvents]=useState<CalendarEvent[]>([]);
 const[error,setError]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false);
 const[allocationUser,setAllocationUser]=useState(""),[allocationCategory,setAllocationCategory]=useState("preparation"),[allocationTitle,setAllocationTitle]=useState(""),[allocationHours,setAllocationHours]=useState(""),[allocationNotes,setAllocationNotes]=useState("");
 const[requirementSubject,setRequirementSubject]=useState<number|"">(""),[requirementMinutes,setRequirementMinutes]=useState(""),[requirementNotes,setRequirementNotes]=useState("");

 async function load(targetSchoolId?:number|null){
  const sid=targetSchoolId??schoolId;if(!sid)return;
  setError("");
  const{data:y,error:yErr}=await supabase.from("school_years").select("id,school_id,label,period_start,period_end,teaching_start,teaching_end,status").eq("school_id",sid).eq("status","active").limit(1).maybeSingle();
  if(yErr||!y){setYear(null);setError(yErr?.message||"Skolen har ikke et aktivt skoleår endnu.");return}
  const activeYear=y as SchoolYear;setYear(activeYear);
  const[cRes,dRes,uRes,wRes,aRes,rRes,vRes,eRes]=await Promise.all([
   supabase.from("classes").select("id,name").eq("school_id",sid).order("name"),
   supabase.from("staff_directory_profiles").select("user_id,abbreviation,personnel_group").eq("school_id",sid),
   supabase.from("user_profiles").select("user_id,display_name,active"),
   supabase.from("staff_work_profiles").select("user_id,annual_target_minutes,weekly_target_minutes,employment_percent").eq("school_year_id",activeYear.id),
   supabase.from("staff_year_allocations").select("id,user_id,category,title,planned_minutes,notes,active").eq("school_year_id",activeYear.id).eq("active",true).order("title"),
   supabase.from("teaching_requirements").select("id,class_subject_id,weekly_minutes,notes").eq("school_year_id",activeYear.id),
   supabase.from("school_schedule_versions").select("id,name,status,effective_from,effective_to,created_at").eq("school_year_id",activeYear.id).order("created_at",{ascending:false}),
   supabase.from("school_year_calendar_events").select("id,closes_school,event_kind").eq("school_year_id",activeYear.id)
  ]);
  const classRows=(cRes.data||[]) as Klass[];setClasses(classRows);
  let subjectRows:ClassSubject[]=[];let subjectError:string|null=null;
  if(classRows.length){
   const sRes=await supabase.from("class_subjects").select("id,class_id,title").in("class_id",classRows.map(c=>c.id)).eq("active",true).order("title");
   subjectRows=(sRes.data||[]) as ClassSubject[];subjectError=sRes.error?.message||null;
  }
  setSubjects(subjectRows);
  const profiles=new Map(((uRes.data||[]) as UserProfile[]).map(p=>[p.user_id,p]));
  const work=new Map(((wRes.data||[]) as WorkProfile[]).map(p=>[p.user_id,p]));
  const alloc=(aRes.data||[]) as Allocation[];setAllocations(alloc);
  const allocated=new Map<string,number>();for(const row of alloc)allocated.set(row.user_id,(allocated.get(row.user_id)||0)+row.planned_minutes);
  const staffRows=((dRes.data||[]) as StaffDirectory[]).map(d=>({...d,display_name:profiles.get(d.user_id)?.display_name||d.abbreviation||"Medarbejder",active:profiles.get(d.user_id)?.active!==false,work:work.get(d.user_id),allocated_minutes:allocated.get(d.user_id)||0})).filter(x=>x.active).sort((a,b)=>(a.abbreviation||a.display_name).localeCompare(b.abbreviation||b.display_name,"da"));
  setStaff(staffRows);if(!allocationUser&&staffRows[0])setAllocationUser(staffRows[0].user_id);
  setRequirements((rRes.data||[]) as Requirement[]);setVersions((vRes.data||[]) as ScheduleVersion[]);setCalendarEvents((eRes.data||[]) as CalendarEvent[]);
  if(requirementSubject===""&&subjectRows[0])setRequirementSubject(subjectRows[0].id);
  const problem=cRes.error||dRes.error||uRes.error||wRes.error||aRes.error||rRes.error||vRes.error||eRes.error;
  if(problem||subjectError)setError(problem?.message||subjectError||"");
 }

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();const user=data.session?.user;if(!user){location.replace("/");return}
  const{data:membership,error:membershipError}=await supabase.from("school_memberships").select("school_id,role").eq("user_id",user.id).eq("active",true).in("role",["admin","leader"]).limit(1).maybeSingle();
  if(membershipError||!membership?.school_id){location.replace("/noticeboard");return}
  setSchoolId(Number(membership.school_id));await load(Number(membership.school_id));setReady(true);
 })()},[]);

 const classNames=useMemo(()=>new Map(classes.map(c=>[c.id,c.name])),[classes]);
 const subjectMap=useMemo(()=>new Map(subjects.map(s=>[s.id,s])),[subjects]);
 const totalAllocation=allocations.reduce((sum,a)=>sum+a.planned_minutes,0);
 const weeklyTeaching=requirements.reduce((sum,r)=>sum+r.weekly_minutes,0);
 const normSet=staff.filter(s=>s.work).length;
 const closedDays=calendarEvents.filter(e=>e.closes_school).length;
 const published=versions.find(v=>v.status==="published");
 const currentVersion=published||versions.find(v=>v.status==="draft")||versions[0];

 async function addAllocation(e:React.FormEvent){
  e.preventDefault();if(!year||!allocationUser||!allocationTitle.trim())return;
  const h=Number(allocationHours);if(!Number.isFinite(h)||h<0){setMessage("Timer skal være 0 eller mere.");return}
  setSaving(true);setMessage("");
  const{error:e1}=await supabase.from("staff_year_allocations").insert({school_year_id:year.id,user_id:allocationUser,category:allocationCategory,title:allocationTitle.trim(),planned_minutes:Math.round(h*60),notes:allocationNotes.trim()||null});
  if(e1)setMessage(e1.message);else{setAllocationTitle("");setAllocationHours("");setAllocationNotes("");setMessage("Opgaven er lagt i årets ressourceplan ✓");await load()}
  setSaving(false);
 }
 async function removeAllocation(id:number){if(!confirm("Fjern denne opgave fra årets ressourceplan?"))return;const{error:e}=await supabase.from("staff_year_allocations").delete().eq("id",id);if(e)setMessage(e.message);else await load()}
 async function saveRequirement(e:React.FormEvent){
  e.preventDefault();if(!year||requirementSubject==="")return;const m=Number(requirementMinutes);if(!Number.isFinite(m)||m<=0){setMessage("Angiv undervisningsbehovet i minutter pr. uge.");return}
  setSaving(true);setMessage("");
  const{error:e1}=await supabase.from("teaching_requirements").upsert({school_year_id:year.id,class_subject_id:Number(requirementSubject),weekly_minutes:Math.round(m),notes:requirementNotes.trim()||null},{onConflict:"school_year_id,class_subject_id"});
  if(e1)setMessage(e1.message);else{setRequirementMinutes("");setRequirementNotes("");setMessage("Undervisningsbehovet er gemt ✓");await load()}
  setSaving(false);
 }
 async function removeRequirement(id:number){if(!confirm("Fjern dette undervisningsbehov?"))return;const{error:e}=await supabase.from("teaching_requirements").delete().eq("id",id);if(e)setMessage(e.message);else await load()}
 async function publishVersion(id:number){if(!confirm("Publicér denne skemaversion? En tidligere publiceret version arkiveres automatisk."))return;const{error:e}=await supabase.rpc("publish_schedule_version",{p_version_id:id,p_effective_from:null});if(e)setMessage(e.message);else{setMessage("Skemaversionen er publiceret ✓");await load()}}

 if(!ready)return <main style={{padding:50}}>Henter skoleårsplanlægning…</main>;
 if(!year)return <main style={{minHeight:"100vh",background:"#f5f2ea",padding:40}}><section style={{...card,maxWidth:720,margin:"auto"}}><h1>Skoleårsplanlægningen kunne ikke åbnes</h1><p>{error||"Aktivt skoleår mangler."}</p><Link href="/admin">← Administration</Link></section></main>;

 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#486b59",color:"white",padding:"20px 6vw"}}><div style={{maxWidth:1180,margin:"auto",display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,flexWrap:"wrap"}}><div><small style={{fontWeight:900,letterSpacing:1.5}}>LEDELSE · SKOLEÅR</small><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"5px 0 0"}}>Skoleårsplanlægning {year.label}</h1></div><Link href="/admin" style={{color:"white"}}>← Administration</Link></div></header>
  <section style={{maxWidth:1180,margin:"auto",padding:"34px 24px 80px"}}>
   <p style={{maxWidth:850,fontSize:17,color:"#626b64",lineHeight:1.55}}>Her samles de data, som senere skal drive skema, norm, opgavefordeling, vikarer og Min dag. Ressourceperioden og elevernes undervisningsperiode er bevidst adskilt.</p>
   {error&&<div style={{padding:13,background:"#fff0ed",border:"1px solid #d29b90",borderRadius:9,color:"#7b2f25",margin:"16px 0"}}>{error}</div>}{message&&<div style={{padding:13,background:"#e7eee9",borderRadius:9,fontWeight:750,margin:"16px 0"}}>{message}</div>}

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(185px,1fr))",gap:12,marginTop:24}}>
    <section style={card}><small style={eyebrow}>RESSOURCEPERIODE</small><strong style={big}>{dateText(year.period_start)}</strong><span>til {dateText(year.period_end)}</span></section>
    <section style={card}><small style={eyebrow}>UNDERVISNING</small><strong style={big}>{dateText(year.teaching_start)}</strong><span>til {dateText(year.teaching_end)}</span></section>
    <section style={card}><small style={eyebrow}>NORM SAT</small><strong style={big}>{normSet}/{staff.length}</strong><span>aktive medarbejdere</span></section>
    <section style={card}><small style={eyebrow}>ØVRIGE OPGAVER</small><strong style={big}>{hours(totalAllocation)}</strong><span>planlagt i året</span></section>
    <section style={card}><small style={eyebrow}>UNDERVISNINGSBEHOV</small><strong style={big}>{hours(weeklyTeaching)}</strong><span>pr. uge</span></section>
    <section style={card}><small style={eyebrow}>ÅRSKALENDER</small><strong style={big}>{calendarEvents.length}</strong><span>{closedDays} lukkedage/markeringer</span></section>
   </div>

   <section style={{...card,marginTop:18}}><div style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"start",flexWrap:"wrap"}}><div><small style={eyebrow}>SKEMAVERSION</small><h2 style={heading}>{currentVersion?.name||"Ingen skemaversion"}</h2><p style={muted}>{currentVersion?`${statusLabel(currentVersion.status)} · gælder fra ${dateText(currentVersion.effective_from)}`:"Opret en skemaversion før skemalægningen starter."}</p></div><Link href="/admin/schedule" style={{...secondary,textDecoration:"none"}}>Åbn skema →</Link></div>{versions.length>0&&<div style={{display:"grid",gap:7,marginTop:12}}>{versions.map(v=><div key={v.id} style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",padding:"10px 12px",background:"#f7f5ef",borderRadius:9}}><div><strong>{v.name}</strong><small style={{display:"block",color:"#727a73"}}>{statusLabel(v.status)}{v.effective_from?` · ${dateText(v.effective_from)}`:""}</small></div>{v.status==="draft"&&<button type="button" style={secondary} onClick={()=>publishVersion(v.id)}>Publicér</button>}</div>)}</div>}</section>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18,marginTop:18,alignItems:"start"}}>
    <section style={card}><small style={eyebrow}>PERSONALERESSOURCER</small><h2 style={heading}>Norm og øvrige opgaver</h2><p style={muted}>Undervisningen beregnes senere fra det versionerede skema. Her ligger de øvrige timer/akkorder, som også skal bruge af årsrammen.</p><div style={{overflowX:"auto",marginTop:14}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:610}}><thead><tr>{["Medarbejder","Ansættelse","Årsramme","Øvrige opgaver"].map(x=><th key={x} style={th}>{x}</th>)}</tr></thead><tbody>{staff.map(s=><tr key={s.user_id}><td style={td}><strong>{s.abbreviation||"—"} · {s.display_name}</strong><small style={{display:"block",color:"#7a807a"}}>{s.personnel_group}</small></td><td style={td}>{s.work?.employment_percent?`${s.work.employment_percent}%`:"—"}</td><td style={td}>{s.work?hours(s.work.annual_target_minutes):"Ikke sat"}</td><td style={td}>{hours(s.allocated_minutes)}</td></tr>)}</tbody></table>{!staff.length&&<p style={muted}>Der er endnu ingen personaleprofiler at planlægge på.</p>}</div><Link href="/calendar" style={{display:"inline-block",marginTop:13,color:"#365044",fontWeight:850}}>Åbn årsnorm & arbejdstid →</Link></section>

    <form onSubmit={addAllocation} style={card}><small style={eyebrow}>OPGAVE / AKKORD</small><h2 style={{...heading,fontSize:22}}>Tilføj årsopgave</h2><div style={{display:"grid",gap:10,marginTop:12}}><label style={label}>Medarbejder<select style={input} value={allocationUser} onChange={e=>setAllocationUser(e.target.value)}>{staff.map(s=><option key={s.user_id} value={s.user_id}>{s.abbreviation||"—"} · {s.display_name}</option>)}</select></label><label style={label}>Type<select style={input} value={allocationCategory} onChange={e=>setAllocationCategory(e.target.value)}>{categories.map(([id,text])=><option key={id} value={id}>{text}</option>)}</select></label><label style={label}>Opgave<input style={input} maxLength={200} value={allocationTitle} onChange={e=>setAllocationTitle(e.target.value)} placeholder="Fx AMR, læsevejleder eller skole-hjem"/></label><label style={label}>Planlagte timer<input style={input} type="number" min="0" step="0.25" value={allocationHours} onChange={e=>setAllocationHours(e.target.value)}/></label><label style={label}>Note <small>(valgfrit)</small><textarea style={{...input,minHeight:72}} maxLength={4000} value={allocationNotes} onChange={e=>setAllocationNotes(e.target.value)}/></label><button disabled={saving||!allocationUser||!allocationTitle.trim()} style={primary}>{saving?"Gemmer…":"Tilføj til ressourceplan"}</button></div></form>
   </div>

   {allocations.length>0&&<section style={{...card,marginTop:18}}><small style={eyebrow}>PLANLAGTE OPGAVER</small><div style={{display:"grid",gap:7,marginTop:10}}>{allocations.map(a=>{const s=staff.find(x=>x.user_id===a.user_id);return <div key={a.id} style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",padding:"9px 11px",background:"#f7f5ef",borderRadius:8}}><div><strong>{a.title}</strong><small style={{display:"block",color:"#707870"}}>{s?.abbreviation||s?.display_name||"Medarbejder"} · {categoryLabel(a.category)} · {hours(a.planned_minutes)}</small></div><button style={secondary} type="button" onClick={()=>removeAllocation(a.id)}>Fjern</button></div>})}</div></section>}

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18,marginTop:18,alignItems:"start"}}>
    <section style={card}><small style={eyebrow}>UNDERVISNINGSBEHOV</small><h2 style={heading}>Hvad skal skolen levere?</h2><p style={muted}>Behov gemmes som minutter pr. uge. Næste lag sammenholder dem med den valgte skemaversion og viser mangler, overbookinger og konsekvens for medarbejdernes norm.</p><div style={{display:"grid",gap:7,marginTop:12}}>{requirements.map(r=>{const s=subjectMap.get(r.class_subject_id);return <div key={r.id} style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",padding:"10px 12px",background:"#f7f5ef",borderRadius:8}}><div><strong>{s?`${classNames.get(s.class_id)||"Klasse"} · ${s.title}`:`Fag #${r.class_subject_id}`}</strong><small style={{display:"block",color:"#707870"}}>{r.weekly_minutes} min/uge · {hours(r.weekly_minutes)}</small></div><button type="button" style={secondary} onClick={()=>removeRequirement(r.id)}>Fjern</button></div>})}{!requirements.length&&<p style={muted}>Intet undervisningsbehov er lagt ind endnu.</p>}</div></section>
    <form onSubmit={saveRequirement} style={card}><small style={eyebrow}>TILFØJ BEHOV</small><h2 style={{...heading,fontSize:22}}>Klasse og fag</h2><div style={{display:"grid",gap:10,marginTop:12}}><label style={label}>Fag<select style={input} value={requirementSubject} onChange={e=>setRequirementSubject(e.target.value?Number(e.target.value):"")}><option value="">Vælg fag</option>{subjects.map(s=><option key={s.id} value={s.id}>{classNames.get(s.class_id)||"Klasse"} · {s.title}</option>)}</select></label><label style={label}>Minutter pr. uge<input style={input} type="number" min="1" max="10080" step="5" value={requirementMinutes} onChange={e=>setRequirementMinutes(e.target.value)} placeholder="Fx 225"/></label><label style={label}>Note <small>(valgfrit)</small><textarea style={{...input,minHeight:72}} maxLength={4000} value={requirementNotes} onChange={e=>setRequirementNotes(e.target.value)}/></label><button disabled={saving||requirementSubject===""||!requirementMinutes} style={primary}>{saving?"Gemmer…":"Gem undervisningsbehov"}</button></div></form>
   </div>

   <section style={{...card,marginTop:18,background:"#eef2ec"}}><small style={eyebrow}>NÆSTE BEREGNINGSLAG</small><h2 style={heading}>Fra plan til konsekvens</h2><p style={{...muted,maxWidth:900}}>Når undervisningsbehov og øvrige opgaver ligger her, kan næste trin beregne: dækkes alle fag? Hvem er over/under sin årsramme? Hvor opstår lærer-, lokale- eller tidskonflikter? Og hvad ændrer sig, hvis en skemabrik flyttes? Det bliver én beregningsmotor, som både lederens planlægning, kalenderen og Min dag kan læse fra.</p></section>
  </section>
 </main>;
}

const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.35,color:"#718077"};
const big:React.CSSProperties={display:"block",fontFamily:"Georgia,serif",fontSize:25,color:"#294a3c",margin:"7px 0 3px"};
const heading:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0"};
const muted:React.CSSProperties={color:"#697169",lineHeight:1.5,margin:"5px 0 0"};
const th:React.CSSProperties={textAlign:"left",fontSize:11,letterSpacing:.5,color:"#66736b",borderBottom:"1px solid #ddd9d0",padding:"8px 10px"};
const td:React.CSSProperties={borderBottom:"1px solid #eeeae2",padding:"10px",fontSize:13};