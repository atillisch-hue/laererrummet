"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {scheduleOccursOn,type RecurrencePattern} from "../../lib/scheduleRecurrence";
import WeekScheduleView from "./WeekScheduleView";

type Meeting={id:number;title:string;meeting_type:string;starts_at:string;ends_at:string|null;location:string|null;student_id:number|null};
type DirectoryUser={user_id:string;display_name:string;role:string};
type Student={id:number;name:string;class_id:number};
type Guardian={user_id:string;display_name:string;relation:string|null};
type Room={id:number;name:string};
type DbError={code?:string;message?:string;details?:string|null;hint?:string|null};
type ScheduleEntry={id:number;weekday:number;start_time:string;end_time:string;recurrence_pattern:RecurrencePattern};
type ScheduleTeacher={schedule_entry_id:number;teacher_id:string};
type Busy={user_id:string;starts_at:string;ends_at:string;busy_type:string};
type FreeSlot={start:string;end:string};

const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const types=["Elevmøde","Netværksmøde","Teammøde","Personalemøde","Bestyrelsesmøde","AMR/TR-møde","Andet"];
const roleName=(r:string)=>({teacher:"Lærer",admin:"Ledelse",leader:"Ledelse",board:"Bestyrelse"}[r]||r);
const dbError=(step:string,e:DbError|null|undefined)=>!e?`${step}: ukendt databasefejl`:`${step}: ${e.code?`[${e.code}] `:""}${e.message||"databasefejl"}${e.details?` · ${e.details}`:""}${e.hint?` · Hint: ${e.hint}`:""}`;
const minutes=(value:string)=>{const[h,m]=value.split(":").map(Number);return h*60+m};
const hhmm=(value:number)=>`${String(Math.floor(value/60)).padStart(2,"0")}:${String(value%60).padStart(2,"0")}`;

export default function CalendarPage(){
 const[ready,setReady]=useState(false);
 const[currentUserId,setCurrentUserId]=useState("");
 const[viewedUserId,setViewedUserId]=useState("");
 const[date,setDate]=useState(()=>iso(new Date()));
 const[meetings,setMeetings]=useState<Meeting[]>([]);
 const[directory,setDirectory]=useState<DirectoryUser[]>([]);
 const[rooms,setRooms]=useState<Room[]>([]);
 const[roomId,setRoomId]=useState<number|"">("");
 const[students,setStudents]=useState<Student[]>([]);
 const[studentId,setStudentId]=useState<number|"">("");
 const[guardians,setGuardians]=useState<Guardian[]>([]);
 const[selectedGuardians,setSelectedGuardians]=useState<string[]>([]);
 const[selected,setSelected]=useState<string[]>([]);
 const[meetingLeader,setMeetingLeader]=useState("");
 const[minuteTaker,setMinuteTaker]=useState("");
 const[externalName,setExternalName]=useState("");
 const[externalRole,setExternalRole]=useState("");
 const[agendaDraft,setAgendaDraft]=useState("");
 const[internalNotesDraft,setInternalNotesDraft]=useState("");
 const[open,setOpen]=useState(false);
 const[title,setTitle]=useState("");
 const[type,setType]=useState("Netværksmøde");
 const[time,setTime]=useState("13:00");
 const[endTime,setEndTime]=useState("14:00");
 const[saving,setSaving]=useState(false);
 const[formError,setFormError]=useState("");
 const[scheduleEntries,setScheduleEntries]=useState<ScheduleEntry[]>([]);
 const[scheduleTeachers,setScheduleTeachers]=useState<ScheduleTeacher[]>([]);
 const[freeSlots,setFreeSlots]=useState<FreeSlot[]>([]);
 const[availabilityLoading,setAvailabilityLoading]=useState(false);

 async function load(){
  const[meetingResult,staffResult,studentResult,roomResult,entryResult,teacherResult]=await Promise.all([
   supabase.from("calendar_meetings").select("id,title,meeting_type,starts_at,ends_at,location,student_id").order("starts_at"),
   supabase.rpc("get_internal_staff_directory"),
   supabase.rpc("get_internal_student_directory"),
   supabase.from("school_rooms").select("id,name").eq("active",true).order("name"),
   supabase.from("schedule_entries").select("id,weekday,start_time,end_time,recurrence_pattern"),
   supabase.from("schedule_teachers").select("schedule_entry_id,teacher_id")
  ]);
  setMeetings((meetingResult.data||[]) as Meeting[]);
  setDirectory((staffResult.data||[]) as DirectoryUser[]);
  setStudents((studentResult.data||[]) as Student[]);
  setRooms((roomResult.data||[]) as Room[]);
  setScheduleEntries((entryResult.data||[]) as ScheduleEntry[]);
  setScheduleTeachers((teacherResult.data||[]) as ScheduleTeacher[]);
  const errors=[meetingResult.error&&dbError("Møder",meetingResult.error),staffResult.error&&dbError("Personale",staffResult.error),studentResult.error&&dbError("Elever",studentResult.error),roomResult.error&&dbError("Lokaler",roomResult.error),entryResult.error&&dbError("Skema",entryResult.error),teacherResult.error&&dbError("Skemalærere",teacherResult.error)].filter(Boolean);
  setFormError(errors.length?`Noget kunne ikke hentes helt. ${errors.join(" · ")}`:"");
 }

 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session){window.location.href="/?teacher=1";return}const uid=data.session.user.id;setCurrentUserId(uid);setViewedUserId(uid);await load();setReady(true)})()},[]);
 useEffect(()=>{(async()=>{setSelectedGuardians([]);if(!studentId){setGuardians([]);return}const{data}=await supabase.rpc("get_student_guardians",{p_student_id:studentId});setGuardians((data||[]) as Guardian[])})()},[studentId]);

 const studentMeeting=type==="Elevmøde"||type==="Netværksmøde";
 const selectedDateLabel=new Date(date+"T12:00:00").toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long"});
 const bookedPeople=useMemo(()=>Array.from(new Set([currentUserId,...selected].filter(Boolean))),[currentUserId,selected]);
 const currentName=directory.find(u=>u.user_id===currentUserId)?.display_name||"Dig";
 const viewedName=directory.find(u=>u.user_id===viewedUserId)?.display_name||(viewedUserId===currentUserId?currentName:"Kollega");
 const currentRole=directory.find(u=>u.user_id===currentUserId)?.role||"teacher";
 const isAdmin=currentRole==="admin"||currentRole==="leader";

 function toggleUser(id:string){setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);if(selected.includes(id)){if(meetingLeader===id)setMeetingLeader("");if(minuteTaker===id)setMinuteTaker("")}}
 function toggleGuardian(id:string){setSelectedGuardians(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])}

 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!open||bookedPeople.length===0){setFreeSlots([]);return}
   const duration=minutes(endTime)-minutes(time);
   if(duration<=0||duration>360){setFreeSlots([]);return}
   setAvailabilityLoading(true);
   const dayStart=new Date(`${date}T00:00:00`),dayEnd=new Date(`${date}T23:59:59`);
   const{data,error}=await supabase.rpc("staff_busy_intervals",{p_user_ids:bookedPeople,p_start:dayStart.toISOString(),p_end:dayEnd.toISOString()});
   if(!active)return;
   if(error){setFreeSlots([]);setAvailabilityLoading(false);return}
   const busy=(data||[]) as Busy[];
   const weekday=new Date(`${date}T12:00:00`).getDay();
   const entryById=new Map(scheduleEntries.map(e=>[e.id,e]));
   const scheduleByUser=new Map<string,ScheduleEntry[]>();
   for(const row of scheduleTeachers){if(!bookedPeople.includes(row.teacher_id))continue;const entry=entryById.get(row.schedule_entry_id);if(!entry||entry.weekday!==weekday||!scheduleOccursOn(entry.recurrence_pattern,date))continue;const list=scheduleByUser.get(row.teacher_id)||[];list.push(entry);scheduleByUser.set(row.teacher_id,list)}
   const busyByUser=new Map<string,Busy[]>();for(const row of busy){const list=busyByUser.get(row.user_id)||[];list.push(row);busyByUser.set(row.user_id,list)}
   const candidates:FreeSlot[]=[];
   const searchStart=7*60,searchEnd=18*60;
   const now=new Date();
   for(let start=searchStart;start+duration<=searchEnd;start+=15){
    const end=start+duration,startDate=new Date(`${date}T${hhmm(start)}:00`),endDate=new Date(`${date}T${hhmm(end)}:00`);
    if(date===iso(now)&&startDate.getTime()<now.getTime())continue;
    const free=bookedPeople.every(userId=>{
     const scheduleConflict=(scheduleByUser.get(userId)||[]).some(e=>start<minutes(e.end_time)&&end>minutes(e.start_time));
     if(scheduleConflict)return false;
     return !(busyByUser.get(userId)||[]).some(b=>startDate.getTime()<new Date(b.ends_at).getTime()&&endDate.getTime()>new Date(b.starts_at).getTime());
    });
    if(free)candidates.push({start:hhmm(start),end:hhmm(end)});
    if(candidates.length>=8)break;
   }
   setFreeSlots(candidates);setAvailabilityLoading(false);
  })();
  return()=>{active=false};
 },[open,bookedPeople,date,time,endTime,scheduleEntries,scheduleTeachers]);

 async function createMeeting(){
  if(!title.trim())return;
  const start=new Date(`${date}T${time}:00`),end=new Date(`${date}T${endTime}:00`);
  if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<=start){setFormError("Sluttid skal være efter starttid.");return}
  setSaving(true);setFormError("");
  const{data:meetingId,error}=await supabase.rpc("create_meeting_atomic",{
   p_title:title.trim(),p_meeting_type:type,p_starts_at:start.toISOString(),p_ends_at:end.toISOString(),p_room_id:roomId||null,
   p_student_id:studentMeeting&&studentId?Number(studentId):null,p_internal_user_ids:selected,p_guardian_user_ids:studentMeeting?selectedGuardians:[],
   p_external_name:externalName.trim()||null,p_external_role:externalRole.trim()||null,p_meeting_leader_user_id:meetingLeader||null,p_minute_taker_user_id:minuteTaker||null,
   p_agenda:agendaDraft.trim()||null,p_internal_notes:internalNotesDraft.trim()||null
  });
  if(error||!meetingId){setFormError(error?.message||"Mødet kunne ikke oprettes.");setSaving(false);return}
  window.location.href=`/calendar/meeting/${meetingId}`;
 }

 if(!ready)return <main style={{padding:50}}>Åbner kalenderen…</main>;

 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1200,margin:"auto"}}><small style={{opacity:.7,fontWeight:800}}>ARBEJDSUGE</small><h1 style={{fontFamily:"Georgia,serif",margin:"4px 0",fontSize:36}}>Kalender</h1><p style={{margin:"6px 0 0",opacity:.78}}>Skema, møder, kolleger og arbejdsdag samlet ét sted.</p></div></header>

  <section style={{maxWidth:1200,margin:"auto",padding:"24px 24px 70px"}}>
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:14,flexWrap:"wrap",marginBottom:14}}>
    <div><p style={eyebrow}>VALGT DAG</p><h2 style={{fontFamily:"Georgia,serif",fontSize:24,margin:"4px 0 0",textTransform:"capitalize"}}>{selectedDateLabel}</h2></div>
    <div style={{display:"flex",alignItems:"end",gap:8,flexWrap:"wrap"}}>
     <label style={{...label,marginTop:0,minWidth:220}}>Personale<select value={viewedUserId} onChange={e=>setViewedUserId(e.target.value)} style={{...input,marginTop:4}}><option value={currentUserId}>Mit skema · {currentName}</option>{directory.filter(u=>u.user_id!==currentUserId&&["teacher","admin","leader"].includes(u.role)).map(u=><option key={u.user_id} value={u.user_id}>{u.display_name} · {roleName(u.role)}</option>)}</select></label>
     {isAdmin&&<Link href="/admin/absence" style={secondary}>Personale-fravær</Link>}
     <button onClick={()=>setOpen(v=>!v)} style={primary}>{open?"Luk mødeformular":"+ Opret møde"}</button>
    </div>
   </div>

   {formError&&<div style={warning}>{formError}</div>}
   <WeekScheduleView selectedDate={date} onSelectDate={setDate} viewedUserId={viewedUserId} currentUserId={currentUserId} viewedName={viewedName} meetings={meetings}/>

   {open&&<section style={{...card,marginTop:16}}>
    <p style={eyebrow}>NYT MØDE · {selectedDateLabel.toUpperCase()}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>
     <label style={label}>Mødetype<select value={type} onChange={e=>{setType(e.target.value);if(e.target.value!=="Elevmøde"&&e.target.value!=="Netværksmøde")setStudentId("")}} style={input}>{types.map(t=><option key={t}>{t}</option>)}</select></label>
     <label style={label}>Titel<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Fx Teamstatus" style={input}/></label>
     <label style={label}>Fra<input type="time" value={time} onChange={e=>setTime(e.target.value)} style={input}/></label>
     <label style={label}>Til<input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} style={input}/></label>
     <label style={label}>Lokale<select value={roomId} onChange={e=>setRoomId(e.target.value?Number(e.target.value):"")} style={input}><option value="">Intet lokale / andet sted</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
    </div>

    {studentMeeting&&<div style={section}><p style={eyebrow}>MØDET HANDLER OM</p><select value={studentId} onChange={e=>setStudentId(e.target.value?Number(e.target.value):"")} style={input}><option value="">Vælg elev (eleven får ikke adgang)</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>{studentId&&<><p style={{...eyebrow,marginTop:16}}>FORÆLDRE / VÆRGER</p>{guardians.length?<div style={{display:"grid",gap:7,marginTop:8}}>{guardians.map(g=><label key={g.user_id} style={choice(selectedGuardians.includes(g.user_id))}><input type="checkbox" checked={selectedGuardians.includes(g.user_id)} onChange={()=>toggleGuardian(g.user_id)}/><span><strong>{g.display_name}</strong>{g.relation&&<small> · {g.relation}</small>}</span></label>)}</div>:<p style={muted}>Der er endnu ingen forældre med login koblet til eleven.</p>}<small style={{display:"block",color:"#707670",marginTop:8}}>Valgte forældre får adgang til officielt mødemateriale, aldrig interne noter.</small></>}</div>}

    <div style={section}><p style={eyebrow}>BOOK PERSONALE</p><div style={{padding:"9px 11px",background:"#e7eee9",borderRadius:8,marginTop:8,fontSize:13}}><strong>{currentName}</strong> · du er automatisk med som mødeopretter</div>{directory.filter(u=>u.user_id!==currentUserId&&["teacher","admin","leader"].includes(u.role)).length?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:7,marginTop:8}}>{directory.filter(u=>u.user_id!==currentUserId&&["teacher","admin","leader"].includes(u.role)).map(u=><label key={u.user_id} style={choice(selected.includes(u.user_id))}><input type="checkbox" checked={selected.includes(u.user_id)} onChange={()=>toggleUser(u.user_id)}/><span><strong>{u.display_name}</strong> <small style={muted}>· {roleName(u.role)}</small></span></label>)}</div>:<p style={muted}>Der er endnu ikke andre aktive personer i personalekataloget.</p>}
     <div style={{marginTop:14,padding:"12px 13px",background:"#f7f5ef",border:"1px solid #e2ded5",borderRadius:10}}><strong style={{fontSize:13}}>Fælles ledige tider</strong><small style={{display:"block",color:"#707670",marginTop:3}}>Forslag mellem kl. 07 og 18 ud fra de valgtes skema, møder og fravær. Andres mødeindhold vises ikke.</small>{availabilityLoading?<div style={{marginTop:9,color:"#707670"}}>Finder tider…</div>:freeSlots.length?<div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:9}}>{freeSlots.map(slot=><button key={slot.start} type="button" onClick={()=>{setTime(slot.start);setEndTime(slot.end)}} style={slotButton}>{slot.start}–{slot.end}</button>)}</div>:<div style={{marginTop:9,color:"#8b6d46",fontWeight:800,fontSize:13}}>Ingen fælles ledig tid fundet i dette tidsrum.</div>}</div>
     {bookedPeople.length>0&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginTop:14}}><label style={label}>Mødeleder<select value={meetingLeader} onChange={e=>setMeetingLeader(e.target.value)} style={input}><option value="">Ikke valgt</option>{bookedPeople.map(id=><option key={id} value={id}>{directory.find(u=>u.user_id===id)?.display_name||currentName}</option>)}</select></label><label style={label}>Referent<select value={minuteTaker} onChange={e=>setMinuteTaker(e.target.value)} style={input}><option value="">Ikke valgt</option>{bookedPeople.map(id=><option key={id} value={id}>{directory.find(u=>u.user_id===id)?.display_name||currentName}</option>)}</select></label></div>}
    </div>

    <div style={section}><p style={eyebrow}>DAGSORDEN</p><label style={label}>Start dagsordenen <span style={{fontWeight:500,color:"#707670"}}>(valgfrit)</span><textarea value={agendaDraft} onChange={e=>setAgendaDraft(e.target.value)} rows={4} placeholder={"Fx:\n1. Kort status\n2. Hvad fungerer lige nu?\n3. Aftaler og næste skridt"} style={{...input,resize:"vertical",lineHeight:1.5}}/></label><label style={{...label,marginTop:14}}>Interne forberedelsesnoter <span style={{fontWeight:500,color:"#707670"}}>(valgfrit)</span><textarea value={internalNotesDraft} onChange={e=>setInternalNotesDraft(e.target.value)} rows={3} placeholder="Noter kun til personale – deles ikke med forældre eller eksterne deltagere." style={{...input,resize:"vertical",lineHeight:1.5}}/></label></div>

    <div style={section}><p style={eyebrow}>EKSTERN DELTAGER</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}><input value={externalName} onChange={e=>setExternalName(e.target.value)} placeholder="Navn (valgfrit)" style={input}/><input value={externalRole} onChange={e=>setExternalRole(e.target.value)} placeholder="Fx PPR-psykolog" style={input}/></div></div>
    <button disabled={!title.trim()||saving} onClick={createMeeting} style={{...primary,width:"100%",marginTop:18,opacity:title.trim()&&!saving?1:.45}}>{saving?"Opretter mødet…":"Opret og åbn møde →"}</button>
   </section>}
  </section>
 </main>;
}

const primary:React.CSSProperties={border:0,borderRadius:9,padding:"11px 15px",background:"#dfa94f",color:"#243d33",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={border:"1px solid #d8d5cd",borderRadius:9,padding:"10px 13px",background:"white",color:"#365044",fontWeight:900,textDecoration:"none",whiteSpace:"nowrap"};
const slotButton:React.CSSProperties={border:"1px solid #9fb3a7",borderRadius:8,padding:"7px 9px",background:"white",color:"#365044",fontWeight:900,cursor:"pointer"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:18};
const warning:React.CSSProperties={marginBottom:16,padding:16,background:"#fff3cd",borderRadius:11};
const label:React.CSSProperties={display:"block",fontWeight:800,fontSize:13,marginTop:10};
const input:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:10,border:"1px solid #d8d5cd",borderRadius:8,background:"white",font:"inherit"};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const section:React.CSSProperties={marginTop:18,paddingTop:15,borderTop:"1px solid #e2ded5"};
const muted:React.CSSProperties={color:"#707670"};
const choice=(on:boolean):React.CSSProperties=>({display:"flex",alignItems:"center",gap:10,padding:"9px 10px",background:on?"#edf1ec":"#faf9f6",borderRadius:8,cursor:"pointer"});
