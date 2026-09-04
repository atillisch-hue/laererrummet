"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";
import {recurrenceLabel,type RecurrencePattern} from "../../../lib/scheduleRecurrence";

type EntryKind="lesson"|"assembly"|"break"|"duty"|"other";
type Klass={id:number;name:string};
type ClassSubject={id:number;class_id:number;title:string};
type Teacher={id:string;email:string;roles:string[];initials?:string};
type Entry={id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;class_subject_id:number|null;entry_kind:EntryKind;recurrence_pattern:RecurrencePattern;schedule_version_id:number};
type LinkRow={schedule_entry_id:number;teacher_id:string};
type DayOption={value:number;label:string};
type SchoolYear={id:number;label:string};
type ScheduleVersion={id:number;name:string;status:"draft"|"published"|"archived"};

const days:DayOption[]=[
 {value:1,label:"Mandag"},{value:2,label:"Tirsdag"},{value:3,label:"Onsdag"},{value:4,label:"Torsdag"},{value:5,label:"Fredag"},{value:6,label:"Lørdag"},{value:0,label:"Søndag"}
];
const activities=["Samling","Pause","Gårdvagt"];
const recurrenceOptions:{value:RecurrencePattern;label:string}[]=[{value:"weekly",label:"Hver uge"},{value:"odd",label:"Ulige uger"},{value:"even",label:"Lige uger"}];
const kindFor=(subject:string):EntryKind=>subject==="Samling"?"assembly":subject==="Pause"?"break":subject==="Gårdvagt"?"duty":"lesson";
const kindLabel=(kind:EntryKind)=>({lesson:"Undervisning",assembly:"Samling",break:"Pause",duty:"Gårdvagt",other:"Aktivitet"}[kind]);
const tone=(s:string)=>{s=s.toLowerCase();if(s.includes("dansk"))return"#e8d9c5";if(s.includes("mat"))return"#d9e5d8";if(s.includes("engelsk"))return"#dbe4ec";if(s.includes("tysk"))return"#e5ddeb";if(s.includes("samling"))return"#f2dfb8";if(s.includes("pause"))return"#e7e7e3";if(s.includes("gårdvagt"))return"#dfe9df";if(s.includes("natur"))return"#dce8d2";if(s.includes("samfund"))return"#d9e7e4";return"#eee9df"};
const field:React.CSSProperties={padding:9,border:"1px solid #d2cec5",borderRadius:8,background:"white",minWidth:0};
const smallButton:React.CSSProperties={border:"1px solid #d0ccc3",borderRadius:7,padding:"6px 9px",background:"white",color:"#526159",fontSize:11,fontWeight:800,cursor:"pointer"};

export default function Schedule(){
 const[ready,setReady]=useState(false);
 const[schoolYear,setSchoolYear]=useState<SchoolYear|null>(null);
 const[version,setVersion]=useState<ScheduleVersion|null>(null);
 const[classes,setClasses]=useState<Klass[]>([]);
 const[classSubjects,setClassSubjects]=useState<ClassSubject[]>([]);
 const[teachers,setTeachers]=useState<Teacher[]>([]);
 const[entries,setEntries]=useState<Entry[]>([]);
 const[links,setLinks]=useState<LinkRow[]>([]);
 const[classId,setClassId]=useState<number|"">("");
 const[selected,setSelected]=useState<string[]>([]);
 const[weekday,setWeekday]=useState(1);
 const[start,setStart]=useState("08:00");
 const[end,setEnd]=useState("08:45");
 const[subject,setSubject]=useState("Samling");
 const[room,setRoom]=useState("");
 const[recurrence,setRecurrence]=useState<RecurrencePattern>("weekly");
 const[msg,setMsg]=useState("");
 const[editingId,setEditingId]=useState<number|null>(null);
 const[editClassId,setEditClassId]=useState<number|"">("");
 const[editTeachers,setEditTeachers]=useState<string[]>([]);
 const[editWeekday,setEditWeekday]=useState(1);
 const[editStart,setEditStart]=useState("08:00");
 const[editEnd,setEditEnd]=useState("08:45");
 const[editSubject,setEditSubject]=useState("Samling");
 const[editRoom,setEditRoom]=useState("");
 const[editRecurrence,setEditRecurrence]=useState<RecurrencePattern>("weekly");
 const[savingEdit,setSavingEdit]=useState(false);

 const initials=(t:Teacher)=>t.initials?.trim()||t.email.split("@")[0].slice(0,3).toUpperCase();
 const optionsForClass=(cid:number|"")=>{
  if(cid==="")return activities;
  const fag=classSubjects.filter(cs=>cs.class_id===Number(cid)).map(cs=>cs.title);
  return [...new Set([...fag,...activities])];
 };

 async function load(){
  setMsg("");
  const{data:sessionData}=await supabase.auth.getSession();
  const user=sessionData.session?.user;
  if(!user)return;
  const{data:membership,error:membershipError}=await supabase.from("school_memberships").select("school_id").eq("user_id",user.id).eq("active",true).eq("role","admin").limit(1).maybeSingle();
  if(membershipError||!membership?.school_id){setMsg(membershipError?.message||"Aktiv admin-tilknytning mangler.");return}
  const schoolId=Number(membership.school_id);
  const{data:y,error:yErr}=await supabase.from("school_years").select("id,label").eq("school_id",schoolId).eq("status","active").limit(1).maybeSingle();
  if(yErr||!y){setMsg(yErr?.message||"Aktivt skoleår mangler.");return}
  const activeYear=y as SchoolYear;setSchoolYear(activeYear);
  const{data:v,error:vErr}=await supabase.from("school_schedule_versions").select("id,name,status").eq("school_year_id",activeYear.id).eq("status","draft").order("created_at",{ascending:false}).limit(1).maybeSingle();
  if(vErr||!v){setVersion(null);setMsg(vErr?.message||"Der findes ingen redigerbar skemakladde for skoleåret.");return}
  const draft=v as ScheduleVersion;setVersion(draft);

  const[c,u,p]=await Promise.all([
   supabase.from("classes").select("id,name").eq("school_id",schoolId).order("name"),
   supabase.rpc("admin_user_directory"),
   supabase.from("user_profiles").select("user_id,initials")
  ]);
  const classRows=(c.data||[]) as Klass[];
  let subjectRows:ClassSubject[]=[];
  let subjectError:string|null=null;
  if(classRows.length){
   const cs=await supabase.from("class_subjects").select("id,class_id,title").in("class_id",classRows.map(x=>x.id)).eq("active",true).order("title");
   subjectRows=(cs.data||[]) as ClassSubject[];subjectError=cs.error?.message||null;
  }
  const e=await supabase.from("schedule_entries").select("id,class_id,weekday,start_time,end_time,subject,room,class_subject_id,entry_kind,recurrence_pattern,schedule_version_id").eq("schedule_version_id",draft.id).order("weekday").order("start_time");
  const entryRows=(e.data||[]) as Entry[];
  let linkRows:LinkRow[]=[];let linkError:string|null=null;
  if(entryRows.length){
   const l=await supabase.from("schedule_teachers").select("schedule_entry_id,teacher_id").in("schedule_entry_id",entryRows.map(x=>x.id));
   linkRows=(l.data||[]) as LinkRow[];linkError=l.error?.message||null;
  }
  const profiles=new Map((p.data||[]).map((x:{user_id:string;initials:string|null})=>[x.user_id,x.initials||""]));
  const us=((u.data||[]) as Teacher[]).map(x=>({...x,roles:Array.isArray(x.roles)?x.roles:[],initials:profiles.get(x.id)||""})).filter(x=>x.roles.some(role=>["teacher","staff","admin","leader"].includes(role)));
  setClasses(classRows);setClassSubjects(subjectRows);setEntries(entryRows);setTeachers(us);setLinks(linkRows);
  const nextClass=classId===""&&classRows[0]?classRows[0].id:classId;
  if(classId===""&&classRows[0])setClassId(classRows[0].id);
  if(nextClass!==""){
   const opts=[...new Set([...subjectRows.filter(cs=>cs.class_id===Number(nextClass)).map(cs=>cs.title),...activities])];
   if(!opts.includes(subject))setSubject(opts[0]||"Samling");
  }
  const err=c.error||u.error||p.error||e.error;if(err||subjectError||linkError)setMsg(err?.message||subjectError||linkError||"");
 }
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session?.user||!hasRole(data.session.user,"admin")){location.replace("/");return}await load();setReady(true)})()},[]);
 const toggle=(id:string)=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 const toggleEditTeacher=(id:string)=>setEditTeachers(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 const chooseClass=(raw:string)=>{const next=raw?Number(raw):"";setClassId(next);if(next!==""){const opts=optionsForClass(next);if(!opts.includes(subject))setSubject(opts[0]||"Samling")}};
 const chooseEditClass=(raw:string)=>{const next=raw?Number(raw):"";setEditClassId(next);if(next!==""){const opts=optionsForClass(next);if(!opts.includes(editSubject))setEditSubject(opts[0]||"Samling")}};

 async function saveInitials(t:Teacher,value:string){const v=value.trim().toUpperCase();const{error}=await supabase.from("user_profiles").upsert({user_id:t.id,initials:v,updated_at:new Date().toISOString()},{onConflict:"user_id"});if(error)setMsg(error.message);else await load()}
 async function add(e:React.FormEvent){
  e.preventDefault();if(!version||classId===""||!subject){setMsg("Vælg klasse og fag/aktivitet.");return}
  const entry_kind=kindFor(subject);const requiresStaff=entry_kind!=="break";
  if(requiresStaff&&selected.length===0){setMsg("Vælg mindst én medarbejder.");return}if(start>=end){setMsg("Sluttidspunktet skal ligge efter starttidspunktet.");return}
  const classSubject=entry_kind==="lesson"?classSubjects.find(cs=>cs.class_id===Number(classId)&&cs.title===subject):undefined;
  if(entry_kind==="lesson"&&!classSubject){setMsg("Undervisning skal vælges fra klassens aktive fag.");return}
  const{error}=await supabase.rpc("admin_create_schedule_entry_v2",{
   p_schedule_version_id:version.id,p_class_id:Number(classId),p_weekday:weekday,p_start_time:start,p_end_time:end,p_subject:subject,p_entry_kind:entry_kind,p_room:room,p_teacher_ids:selected,p_recurrence_pattern:recurrence,p_class_subject_id:classSubject?.id??null
  });
  if(error){setMsg(error.message);return}
  setMsg(`${kindLabel(entry_kind)} er lagt i ${version.name} · ${recurrenceLabel(recurrence).toLowerCase()}.`);setRoom("");await load();
 }
 function startEditEntry(entry:Entry){setEditingId(entry.id);setEditClassId(entry.class_id);setEditWeekday(entry.weekday);setEditStart(entry.start_time.slice(0,5));setEditEnd(entry.end_time.slice(0,5));setEditSubject(entry.subject);setEditRoom(entry.room||"");setEditRecurrence(entry.recurrence_pattern||"weekly");setEditTeachers(links.filter(l=>l.schedule_entry_id===entry.id).map(l=>l.teacher_id));setMsg("")}
 async function saveEntryEdit(){
  if(editingId===null||editClassId===""||!editSubject)return;if(editStart>=editEnd){setMsg("Sluttidspunktet skal ligge efter starttidspunktet.");return}
  const entry_kind=kindFor(editSubject);if(entry_kind!=="break"&&editTeachers.length===0){setMsg("Vælg mindst én medarbejder.");return}
  const classSubject=entry_kind==="lesson"?classSubjects.find(cs=>cs.class_id===Number(editClassId)&&cs.title===editSubject):undefined;
  if(entry_kind==="lesson"&&!classSubject){setMsg("Undervisning skal være koblet til et aktivt klassefag.");return}
  setSavingEdit(true);setMsg("");
  const{error}=await supabase.rpc("admin_update_schedule_entry_v2",{p_entry_id:editingId,p_class_id:Number(editClassId),p_weekday:editWeekday,p_start_time:editStart,p_end_time:editEnd,p_subject:editSubject,p_entry_kind:entry_kind,p_room:editRoom,p_teacher_ids:editTeachers,p_recurrence_pattern:editRecurrence,p_class_subject_id:classSubject?.id??null});
  if(error)setMsg(error.message);else{setMsg("Skemabrikken er opdateret i kladden ✓");setEditingId(null);await load()}setSavingEdit(false);
 }
 async function remove(id:number){if(!confirm("Vil du slette denne skemabrik fra kladden?"))return;const{error}=await supabase.rpc("admin_delete_schedule_entry_v2",{p_entry_id:id});setMsg(error?error.message:"Skemabrikken er slettet fra kladden.");if(!error){if(editingId===id)setEditingId(null);await load()}}

 if(!ready)return<main style={{padding:50}}>Henter skema…</main>;
 const shown=entries.filter(x=>x.class_id===Number(classId));
 const subjectOptions=optionsForClass(classId);
 const editSubjectOptions=[...new Set([...optionsForClass(editClassId),editSubject])];
 const createRequiresStaff=kindFor(subject)!=="break";
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#486b59",color:"white",padding:"18px 6vw"}}><div style={{maxWidth:1100,margin:"auto",display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><strong style={{fontSize:22}}>Administration · Skemaer</strong><Link href="/admin" style={{color:"white"}}>← Administration</Link></div></header>
  <section style={{maxWidth:1100,margin:"auto",padding:"42px 24px"}}>
   <p className="eyebrow">SKEMA</p><h1 style={{fontFamily:"Georgia,serif",fontSize:40}}>Klassernes skema</h1><p style={{color:"#687068"}}>Undervisning, samling, pauser, vagter og weekendaktiviteter kan ligge i samme skema. Editorens ændringer rammer kun den aktive kladde.</p>
   {version&&<div style={{padding:13,background:"#eef2ec",border:"1px solid #d7ddd7",borderRadius:10,margin:"16px 0",display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><div><strong>{version.name}</strong><small style={{display:"block",color:"#667168"}}>Skoleår {schoolYear?.label||"—"} · redigerbar kladde</small></div><Link href="/admin/planning" style={{color:"#365044",fontWeight:850}}>Se konsekvenser →</Link></div>}
   {msg&&<div style={{padding:12,background:"#e7eee9",borderRadius:9,margin:"18px 0"}}>{msg}</div>}
   <section style={{background:"white",padding:20,border:"1px solid #ddd9d0",borderRadius:14,marginBottom:18}}><strong>Lærerinitialer</strong><div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:10}}>{teachers.map(t=><label key={t.id} style={{display:"flex",alignItems:"center",gap:6}}><span>{t.email}</span><input defaultValue={initials(t)} maxLength={5} onBlur={e=>saveInitials(t,e.target.value)} style={{width:58,padding:7,textTransform:"uppercase"}}/></label>)}</div></section>
   <form onSubmit={add} style={{background:"white",padding:22,border:"1px solid #ddd9d0",borderRadius:14,display:"grid",gap:14}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(145px,1fr))",gap:10}}>
     <select value={classId} onChange={e=>chooseClass(e.target.value)} style={field}><option value="">Vælg klasse</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
     <select value={subject} onChange={e=>setSubject(e.target.value)} style={field}>{subjectOptions.map(s=><option key={s}>{s}</option>)}</select>
     <select value={weekday} onChange={e=>setWeekday(Number(e.target.value))} style={field}>{days.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}</select>
     <select value={recurrence} onChange={e=>setRecurrence(e.target.value as RecurrencePattern)} style={field}>{recurrenceOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
     <input type="time" value={start} onChange={e=>setStart(e.target.value)} style={field}/><input type="time" value={end} onChange={e=>setEnd(e.target.value)} style={field}/><input value={room} onChange={e=>setRoom(e.target.value)} placeholder="Lokale (valgfrit)" style={field}/>
    </div>
    <small style={{color:"#747b75"}}>Undervisningsfag hentes fra klassens aktive fagopsætning. Samling, pause og gårdvagt er aktiviteter og behøver ikke et klassefag.</small>
    <div><strong>Vælg medarbejder(e){!createRequiresStaff&&<span style={{fontWeight:500,color:"#778078"}}> · valgfrit for pause</span>}</strong><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>{teachers.map(t=><label key={t.id} style={{padding:"9px 12px",border:"1px solid #d8d5cd",borderRadius:9,background:selected.includes(t.id)?"#e2ebe5":"#faf9f6",cursor:"pointer"}}><input type="checkbox" checked={selected.includes(t.id)} onChange={()=>toggle(t.id)} style={{marginRight:7}}/>{initials(t)}</label>)}</div></div>
    <button type="submit" disabled={!version||!classes.length||(createRequiresStaff&&!selected.length)}>+ Tilføj til kladden</button>
   </form>
   <div style={{marginTop:28,display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(205px,1fr))",gap:14}}>{days.map(d=><section key={d.value} style={{background:"white",border:"1px solid #ddd9d0",borderRadius:12,padding:16}}><h2 style={{fontFamily:"Georgia,serif",fontSize:20}}>{d.label}</h2>{shown.filter(x=>x.weekday===d.value).map(x=>{const tids=links.filter(l=>l.schedule_entry_id===x.id).map(l=>teachers.find(t=>t.id===l.teacher_id)).filter((t):t is Teacher=>Boolean(t));const editing=editingId===x.id;return <div key={x.id} style={{background:tone(x.subject),borderRadius:8,padding:10,marginTop:8}}>{editing?<div style={{display:"grid",gap:8}}>
    <small style={{fontWeight:900,color:"#667168"}}>REDIGÉR SKEMABRIK · KLADDE</small>
    <select value={editClassId} onChange={e=>chooseEditClass(e.target.value)} style={field}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
    <select value={editSubject} onChange={e=>setEditSubject(e.target.value)} style={field}>{editSubjectOptions.map(s=><option key={s}>{s}</option>)}</select>
    <select value={editWeekday} onChange={e=>setEditWeekday(Number(e.target.value))} style={field}>{days.map(day=><option key={day.value} value={day.value}>{day.label}</option>)}</select>
    <select value={editRecurrence} onChange={e=>setEditRecurrence(e.target.value as RecurrencePattern)} style={field}>{recurrenceOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}><input type="time" value={editStart} onChange={e=>setEditStart(e.target.value)} style={field}/><input type="time" value={editEnd} onChange={e=>setEditEnd(e.target.value)} style={field}/></div>
    <input value={editRoom} onChange={e=>setEditRoom(e.target.value)} placeholder="Lokale" style={field}/>
    <div><small style={{fontWeight:900}}>Medarbejdere</small><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>{teachers.map(t=><label key={t.id} style={{padding:"6px 8px",border:"1px solid #d8d5cd",borderRadius:7,background:editTeachers.includes(t.id)?"#e2ebe5":"white",cursor:"pointer",fontSize:11,fontWeight:800}}><input type="checkbox" checked={editTeachers.includes(t.id)} onChange={()=>toggleEditTeacher(t.id)} style={{marginRight:5}}/>{initials(t)}</label>)}</div></div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button type="button" onClick={saveEntryEdit} disabled={savingEdit||(kindFor(editSubject)!=="break"&&!editTeachers.length)} style={{...smallButton,background:"#365044",color:"white",borderColor:"#365044"}}>{savingEdit?"Gemmer…":"Gem"}</button><button type="button" onClick={()=>setEditingId(null)} style={smallButton}>Annullér</button><button type="button" onClick={()=>remove(x.id)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div>
   </div>:<><div style={{display:"flex",gap:6,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}><small style={{fontWeight:900,color:"#667168"}}>{kindLabel(x.entry_kind).toUpperCase()}{x.entry_kind==="lesson"&&x.class_subject_id?" · FAGKOBLET":""}</small><small style={{fontWeight:900,color:"#5e6d64",background:"rgba(255,255,255,.55)",borderRadius:999,padding:"3px 6px"}}>{recurrenceLabel(x.recurrence_pattern).toUpperCase()}</small></div><strong style={{display:"block",marginTop:4}}>{x.start_time.slice(0,5)}–{x.end_time.slice(0,5)} · {x.subject}</strong><small style={{display:"block",color:"#555"}}>{tids.map(initials).join(" + ")||"Ingen medarbejder"}{x.room?` · ${x.room}`:""}</small><div style={{display:"flex",gap:6,marginTop:7}}><button type="button" onClick={()=>startEditEntry(x)} style={smallButton}>Redigér</button><button type="button" onClick={()=>remove(x.id)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div></>}</div>})}{!shown.some(x=>x.weekday===d.value)&&<small style={{color:"#888"}}>Ingen timer eller aktiviteter</small>}</section>)}</div>
  </section>
 </main>;
}
