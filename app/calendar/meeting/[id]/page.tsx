"use client";

import Link from "next/link";
import {useEffect,useState,use} from "react";
import {supabase} from "../../../../lib/supabase";

type Meeting={id:number;school_id:number;title:string;meeting_type:string;starts_at:string;ends_at:string|null;location:string|null;agenda:string|null;minutes:string|null;internal_notes:string|null;status:string;created_by:string;student_id:number|null;meeting_leader_user_id:string|null;minute_taker_user_id:string|null};
type Action={id:number;title:string;due_date:string|null;completed:boolean;responsible_user_id:string|null};
type Decision={id:number;text:string};
type User={user_id:string;display_name:string;role:string};
type Participant={id:number;user_id:string|null;external_name:string|null;external_role:string|null;access_type:string};
type Student={id:number;name:string;class_id:number};
type Guardian={user_id:string;display_name:string;relation:string|null};
type Room={id:number;name:string};
type Booking={id:number;room_id:number|null};

const meetingTypes=["Elevmøde","Netværksmøde","Teammøde","Personalemøde","Bestyrelsesmøde","AMR/TR-møde","Andet"];
const toLocalInput=(value:string|null)=>{if(!value)return"";const d=new Date(value),p=(n:number)=>String(n).padStart(2,"0");return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};
const isStudentMeeting=(type:string)=>type==="Elevmøde"||type==="Netværksmøde";

export default function MeetingPage({params}:{params:Promise<{id:string}>}){
 const{id}=use(params),meetingId=Number(id);
 const[meeting,setMeeting]=useState<Meeting|null>(null);
 const[agenda,setAgenda]=useState("");
 const[minutes,setMinutes]=useState("");
 const[internalNotes,setInternalNotes]=useState("");
 const[actions,setActions]=useState<Action[]>([]);
 const[decisions,setDecisions]=useState<Decision[]>([]);
 const[participants,setParticipants]=useState<Participant[]>([]);
 const[directory,setDirectory]=useState<User[]>([]);
 const[staffDirectory,setStaffDirectory]=useState<User[]>([]);
 const[students,setStudents]=useState<Student[]>([]);
 const[guardians,setGuardians]=useState<Guardian[]>([]);
 const[rooms,setRooms]=useState<Room[]>([]);
 const[newAction,setNewAction]=useState("");
 const[responsible,setResponsible]=useState("");
 const[due,setDue]=useState("");
 const[decision,setDecision]=useState("");
 const[saving,setSaving]=useState(false);
 const[error,setError]=useState("");
 const[savedNotice,setSavedNotice]=useState("");
 const[canManage,setCanManage]=useState(false);
 const[canEditContent,setCanEditContent]=useState(false);
 const[editing,setEditing]=useState(false);
 const[title,setTitle]=useState("");
 const[meetingType,setMeetingType]=useState("");
 const[startsAt,setStartsAt]=useState("");
 const[endsAt,setEndsAt]=useState("");
 const[roomId,setRoomId]=useState<number|"">("");
 const[status,setStatus]=useState("planned");
 const[editStudentId,setEditStudentId]=useState<number|"">("");
 const[selectedInternal,setSelectedInternal]=useState<string[]>([]);
 const[selectedGuardians,setSelectedGuardians]=useState<string[]>([]);
 const[externalName,setExternalName]=useState("");
 const[externalRole,setExternalRole]=useState("");
 const[meetingLeader,setMeetingLeader]=useState("");
 const[minuteTaker,setMinuteTaker]=useState("");
 const[editingActionId,setEditingActionId]=useState<number|null>(null);
 const[editActionTitle,setEditActionTitle]=useState("");
 const[editActionResponsible,setEditActionResponsible]=useState("");
 const[editActionDue,setEditActionDue]=useState("");
 const[editingDecisionId,setEditingDecisionId]=useState<number|null>(null);
 const[editDecisionText,setEditDecisionText]=useState("");

 async function fetchGuardians(studentId:number|null,selected:string[]=[]){
  if(!studentId){setGuardians([]);setSelectedGuardians([]);return}
  const{data}=await supabase.rpc("get_student_guardians",{p_student_id:studentId});
  setGuardians((data||[]) as Guardian[]);setSelectedGuardians(selected);
 }

 async function load(){
  const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user)return;
  const[m,a,d,p,u,staff,studentRows,roomRows,booking]=await Promise.all([
   supabase.from("calendar_meetings").select("*").eq("id",meetingId).single(),
   supabase.from("meeting_actions").select("id,title,due_date,completed,responsible_user_id").eq("meeting_id",meetingId).order("created_at"),
   supabase.from("meeting_decisions").select("id,text").eq("meeting_id",meetingId).order("created_at"),
   supabase.from("meeting_participants").select("id,user_id,external_name,external_role,access_type").eq("meeting_id",meetingId),
   supabase.rpc("get_meeting_user_directory"),
   supabase.rpc("get_internal_staff_directory"),
   supabase.rpc("get_internal_student_directory"),
   supabase.from("school_rooms").select("id,name").eq("active",true).order("name"),
   supabase.from("resource_bookings").select("id,room_id").eq("meeting_id",meetingId).limit(1).maybeSingle()
  ]);
  if(m.error){setError("Du har ikke adgang til mødet, eller mødet findes ikke.");return}
  const row=m.data as Meeting,people=(p.data||[]) as Participant[];
  const admin=await supabase.from("school_memberships").select("user_id").eq("school_id",row.school_id).eq("user_id",user.id).eq("role","admin").eq("active",true).limit(1).maybeSingle();
  const manages=row.created_by===user.id||!!admin.data;
  const internalParticipant=people.some(x=>x.access_type==="internal"&&x.user_id===user.id);
  setCanManage(manages);setCanEditContent(manages||internalParticipant);
  setMeeting(row);setAgenda(row.agenda||"");setMinutes(row.minutes||"");setInternalNotes(row.internal_notes||"");
  setTitle(row.title);setMeetingType(row.meeting_type);setStartsAt(toLocalInput(row.starts_at));setEndsAt(toLocalInput(row.ends_at));setStatus(row.status);setEditStudentId(row.student_id||"");setMeetingLeader(row.meeting_leader_user_id||"");setMinuteTaker(row.minute_taker_user_id||"");setRoomId((booking.data as Booking|null)?.room_id||"");
  setActions((a.data||[]) as Action[]);setDecisions((d.data||[]) as Decision[]);setParticipants(people);setDirectory((u.data||[]) as User[]);setStaffDirectory((staff.data||[]) as User[]);setStudents((studentRows.data||[]) as Student[]);setRooms((roomRows.data||[]) as Room[]);
  const internal=people.filter(x=>x.access_type==="internal"&&x.user_id).map(x=>x.user_id!) ,guardianIds=people.filter(x=>x.access_type==="guardian"&&x.user_id).map(x=>x.user_id!),external=people.find(x=>x.access_type==="external");
  setSelectedInternal(internal);setExternalName(external?.external_name||"");setExternalRole(external?.external_role||"");
  await fetchGuardians(row.student_id,guardianIds);
  setError("");
 }

 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session){window.location.href="/?teacher=1";return}await load()})()},[meetingId]);
 const nameFor=(id:string|null)=>directory.find(u=>u.user_id===id)?.display_name||staffDirectory.find(u=>u.user_id===id)?.display_name||"Deltager";
 const toggleInternal=(id:string)=>{setSelectedInternal(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);if(selectedInternal.includes(id)){if(meetingLeader===id)setMeetingLeader("");if(minuteTaker===id)setMinuteTaker("")}};
 const toggleGuardian=(id:string)=>setSelectedGuardians(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 async function changeStudent(value:number|""){setEditStudentId(value);setSelectedGuardians([]);await fetchGuardians(value?Number(value):null,[])}
 const bookedStaffIds=meeting?Array.from(new Set([meeting.created_by,...selectedInternal])):selectedInternal;

 async function saveSetup(){
  if(!canManage||!title.trim()||!startsAt||!endsAt)return;
  const start=new Date(startsAt),end=new Date(endsAt);
  if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<=start){setError("Sluttidspunktet skal ligge efter starttidspunktet.");return}
  setSaving(true);setError("");setSavedNotice("");
  const{error:e}=await supabase.rpc("update_meeting_setup_atomic",{
   p_meeting_id:meetingId,p_title:title.trim(),p_meeting_type:meetingType,p_starts_at:start.toISOString(),p_ends_at:end.toISOString(),p_room_id:roomId||null,p_status:status,p_student_id:isStudentMeeting(meetingType)&&editStudentId?Number(editStudentId):null,p_internal_user_ids:selectedInternal,p_guardian_user_ids:isStudentMeeting(meetingType)?selectedGuardians:[],p_external_name:externalName.trim()||null,p_external_role:externalRole.trim()||null,p_meeting_leader_user_id:meetingLeader||null,p_minute_taker_user_id:minuteTaker||null
  });
  if(e)setError(e.message);else{setEditing(false);await load();setSavedNotice("Mødeopsætningen er gemt ✓")}
  setSaving(false);
 }
 async function saveNotes(){
  if(!canEditContent)return;
  setSaving(true);setError("");setSavedNotice("");
  const{data:savedAt,error:e}=await supabase.rpc("save_meeting_notes",{p_meeting_id:meetingId,p_agenda:agenda,p_minutes:minutes,p_internal_notes:internalNotes});
  if(e)setError(e.message);else{await load();const when=savedAt?new Date(savedAt).toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"}):"";setSavedNotice(`Dagsorden, referat og interne noter er gemt ✓${when?` · ${when}`:""}`)}
  setSaving(false);
 }
 async function removeMeeting(){if(!canManage)return;if(!window.confirm("Slet mødet permanent? Deltagere, bookinger, beslutninger og handlinger knyttet til mødet bliver også slettet."))return;setSaving(true);const{error:e}=await supabase.from("calendar_meetings").delete().eq("id",meetingId);if(e){setError(e.message);setSaving(false);return}window.location.replace("/calendar")}
 async function addAction(){if(!canEditContent||!newAction.trim())return;const{data:{user}}=await supabase.auth.getUser();const{error:e}=await supabase.from("meeting_actions").insert({meeting_id:meetingId,title:newAction.trim(),due_date:due||null,responsible_user_id:responsible||null,created_by:user?.id});if(e){setError(e.message);return}setNewAction("");setDue("");setResponsible("");setSavedNotice("Handlingen er oprettet ✓");await load()}
 async function toggleAction(a:Action){if(!canEditContent)return;const{error:e}=await supabase.from("meeting_actions").update({completed:!a.completed,completed_at:!a.completed?new Date().toISOString():null}).eq("id",a.id);if(e)setError(e.message);else await load()}
 function startEditAction(a:Action){setEditingActionId(a.id);setEditActionTitle(a.title);setEditActionResponsible(a.responsible_user_id||"");setEditActionDue(a.due_date||"")}
 async function saveActionEdit(id:number){if(!canEditContent||!editActionTitle.trim())return;const{error:e}=await supabase.from("meeting_actions").update({title:editActionTitle.trim(),responsible_user_id:editActionResponsible||null,due_date:editActionDue||null}).eq("id",id);if(e){setError(e.message);return}setEditingActionId(null);setSavedNotice("Handlingen er gemt ✓");await load()}
 async function removeAction(id:number){if(!canEditContent||!window.confirm("Vil du slette denne handling?"))return;const{error:e}=await supabase.from("meeting_actions").delete().eq("id",id);if(e)setError(e.message);else await load()}
 async function addDecision(){if(!canEditContent||!decision.trim())return;const{data:{user}}=await supabase.auth.getUser();if(!user)return;const{error:e}=await supabase.from("meeting_decisions").insert({meeting_id:meetingId,text:decision.trim(),created_by:user.id});if(e){setError(e.message);return}setDecision("");setSavedNotice("Beslutningen er gemt ✓");await load()}
 function startEditDecision(d:Decision){setEditingDecisionId(d.id);setEditDecisionText(d.text)}
 async function saveDecisionEdit(id:number){if(!canEditContent||!editDecisionText.trim())return;const{error:e}=await supabase.from("meeting_decisions").update({text:editDecisionText.trim()}).eq("id",id);if(e){setError(e.message);return}setEditingDecisionId(null);setSavedNotice("Beslutningen er gemt ✓");await load()}
 async function removeDecision(id:number){if(!canEditContent||!window.confirm("Vil du slette denne beslutning?"))return;const{error:e}=await supabase.from("meeting_decisions").delete().eq("id",id);if(e)setError(e.message);else await load()}

 if(error&&!meeting)return <main style={shell}><Link href="/calendar">← Kalender</Link><h1>{error}</h1></main>;
 if(!meeting)return <main style={shell}>Åbner møderummet…</main>;
 const dt=new Date(meeting.starts_at),staff=participants.filter(p=>p.user_id&&p.access_type==="internal"),guardianParticipants=participants.filter(p=>p.user_id&&p.access_type==="guardian"),external=participants.filter(p=>p.access_type==="external");

 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"22px 28px"}}><div style={{maxWidth:1000,margin:"auto"}}><div style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"center",flexWrap:"wrap"}}><div style={{display:"flex",gap:15}}><Link href="/calendar" style={topLink}>← Kalender</Link><Link href="/archive" style={topLink}>Arkiv</Link></div>{canManage&&<div style={{display:"flex",gap:8}}><button onClick={()=>setEditing(v=>!v)} style={headerButton}>{editing?"Luk redigering":"Redigér møde"}</button><button onClick={removeMeeting} disabled={saving} style={{...headerButton,borderColor:"#d8a7a0",color:"#ffe8e4"}}>Slet møde</button></div>}</div><small style={{display:"block",marginTop:20,opacity:.7,fontWeight:900}}>{meeting.meeting_type.toUpperCase()}</small><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"4px 0 7px"}}>{meeting.title}</h1><span>{dt.toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · {dt.toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}{meeting.location?` · ${meeting.location}`:""}</span></div></header>

  <section style={shell}>
   {error&&<div style={warning}>{error}</div>}
   {savedNotice&&<div style={success}>{savedNotice}</div>}
   {editing&&canManage&&<section style={{...card,marginBottom:16,border:"1px solid #b9cabb",background:"#f7faf7"}}><p style={eyebrow}>REDIGÉR HELE MØDET</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10,marginTop:12}}><label style={labelStyle}>Titel<input value={title} onChange={e=>setTitle(e.target.value)} style={input}/></label><label style={labelStyle}>Type<select value={meetingType} onChange={e=>{setMeetingType(e.target.value);if(!isStudentMeeting(e.target.value)){setEditStudentId("");setSelectedGuardians([]);setGuardians([])}}} style={input}>{Array.from(new Set([...meetingTypes,meetingType])).map(x=><option key={x}>{x}</option>)}</select></label><label style={labelStyle}>Start<input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} style={input}/></label><label style={labelStyle}>Slut<input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} style={input}/></label><label style={labelStyle}>Lokale<select value={roomId} onChange={e=>setRoomId(e.target.value?Number(e.target.value):"")} style={input}><option value="">Intet lokale / andet sted</option>{rooms.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label><label style={labelStyle}>Status<select value={status} onChange={e=>setStatus(e.target.value)} style={input}><option value="planned">Planlagt</option><option value="completed">Afsluttet</option><option value="cancelled">Aflyst</option></select></label></div>

    {isStudentMeeting(meetingType)&&<div style={editSection}><p style={eyebrow}>MØDET HANDLER OM</p><select value={editStudentId} onChange={e=>changeStudent(e.target.value?Number(e.target.value):"")} style={input}><option value="">Vælg elev</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>{editStudentId&&<><p style={{...eyebrow,marginTop:14}}>FORÆLDRE / VÆRGER</p>{guardians.length?<div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:8}}>{guardians.map(g=><label key={g.user_id} style={choice(selectedGuardians.includes(g.user_id))}><input type="checkbox" checked={selectedGuardians.includes(g.user_id)} onChange={()=>toggleGuardian(g.user_id)}/><span>{g.display_name}{g.relation?` · ${g.relation}`:""}</span></label>)}</div>:<p style={hint}>Ingen værger med login er koblet til eleven.</p>}</>}</div>}

    <div style={editSection}><p style={eyebrow}>PERSONALE</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:7,marginTop:8}}>{staffDirectory.filter(u=>u.user_id!==meeting.created_by).map(u=><label key={u.user_id} style={choice(selectedInternal.includes(u.user_id))}><input type="checkbox" checked={selectedInternal.includes(u.user_id)} onChange={()=>toggleInternal(u.user_id)}/><span>{u.display_name}</span></label>)}</div><small style={{display:"block",marginTop:8,color:"#707670"}}>Mødeopretteren er altid booket med og kan ikke fjernes fra sit eget møde.</small><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginTop:12}}><label style={labelStyle}>Mødeleder<select value={meetingLeader} onChange={e=>setMeetingLeader(e.target.value)} style={input}><option value="">Ikke valgt</option>{bookedStaffIds.map(id=><option key={id} value={id}>{nameFor(id)}</option>)}</select></label><label style={labelStyle}>Referent<select value={minuteTaker} onChange={e=>setMinuteTaker(e.target.value)} style={input}><option value="">Ikke valgt</option>{bookedStaffIds.map(id=><option key={id} value={id}>{nameFor(id)}</option>)}</select></label></div></div>

    <div style={editSection}><p style={eyebrow}>EKSTERN DELTAGER</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8}}><input value={externalName} onChange={e=>setExternalName(e.target.value)} placeholder="Navn (valgfrit)" style={input}/><input value={externalRole} onChange={e=>setExternalRole(e.target.value)} placeholder="Fx PPR-psykolog" style={input}/></div></div>
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><button onClick={saveSetup} disabled={saving||!title.trim()||!startsAt||!endsAt} style={secondary}>{saving?"Gemmer og kontrollerer booking…":"Gem hele mødet"}</button><button onClick={()=>{setEditing(false);load()}} style={cancelButton}>Annullér</button></div>
   </section>}

   <section style={{...card,marginBottom:16}}><p style={eyebrow}>DELTAGERE & ADGANG</p><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}><span style={chip}>Mødeopretter · {nameFor(meeting.created_by)}</span>{staff.map(p=><span key={p.id} style={chip}>{nameFor(p.user_id)} · personale</span>)}{guardianParticipants.map(p=><span key={p.id} style={{...chip,background:"#f4ead8"}}>{nameFor(p.user_id)} · forælder</span>)}{external.map(p=><span key={p.id} style={{...chip,background:"#eee9df"}}>{p.external_name}{p.external_role?` · ${p.external_role}`:""} · ekstern</span>)}</div>{(meeting.meeting_leader_user_id||meeting.minute_taker_user_id)&&<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14}}>{meeting.meeting_leader_user_id&&<span style={roleChip}><b>Mødeleder</b> · {nameFor(meeting.meeting_leader_user_id)}</span>}{meeting.minute_taker_user_id&&<span style={roleChip}><b>Referent</b> · {nameFor(meeting.minute_taker_user_id)}</span>}</div>}{meeting.student_id&&<small style={{display:"block",marginTop:10,color:"#707670"}}>Mødet er koblet til en elev. Eleven har ikke adgang til mødet.</small>}</section>

   <section style={card}><p style={eyebrow}>DELES MED INVITEREDE DELTAGERE</p><h2 style={h2}>Dagsorden</h2><textarea disabled={!canEditContent} value={agenda} onChange={e=>setAgenda(e.target.value)} placeholder="Hvad skal vi omkring?" style={{...textarea,background:canEditContent?"white":"#f4f3ef"}}/><h2 style={h2}>Officielt referat</h2><p style={hint}>Dette er den del af mødet, som inviterede forældre senere kan få adgang til i deres arkiv.</p><textarea disabled={!canEditContent} value={minutes} onChange={e=>setMinutes(e.target.value)} placeholder="Beslutninger, aftaler og det officielle referat…" style={{...textarea,minHeight:210,background:canEditContent?"white":"#f4f3ef"}}/><div style={internalBox}><p style={eyebrow}>KUN INTERNT</p><h2 style={h2}>Interne noter</h2><p style={hint}>Arbejdsnoter til personale. De indgår ikke i forældrevisningen.</p><textarea disabled={!canEditContent} value={internalNotes} onChange={e=>setInternalNotes(e.target.value)} placeholder="Interne observationer og arbejdsnoter…" style={{...textarea,minHeight:160,marginBottom:0,background:canEditContent?"white":"#e8e9e5"}}/></div>{canEditContent&&<button onClick={saveNotes} disabled={saving} style={{...primary,marginTop:16}}>{saving?"Gemmer…":"Gem dagsorden & referat"}</button>}</section>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16,marginTop:16}}>
    <section style={card}><h2 style={h2}>Beslutninger</h2>{decisions.map(d=>editingDecisionId===d.id?<div key={d.id} style={row}><textarea value={editDecisionText} onChange={e=>setEditDecisionText(e.target.value)} style={{...textarea,minHeight:75,marginBottom:8}}/><div style={{display:"flex",gap:6}}><button onClick={()=>saveDecisionEdit(d.id)} style={smallPrimary}>Gem</button><button onClick={()=>setEditingDecisionId(null)} style={smallButton}>Annullér</button></div></div>:<article key={d.id} style={row}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><span>✓ {d.text}</span>{canEditContent&&<div style={{display:"flex",gap:5}}><button onClick={()=>startEditDecision(d)} style={smallButton}>Redigér</button><button onClick={()=>removeDecision(d.id)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div>}</div></article>)}{!decisions.length&&<p style={hint}>Ingen beslutninger endnu.</p>}{canEditContent&&<><textarea value={decision} onChange={e=>setDecision(e.target.value)} placeholder="Hvad besluttede I?" style={{...textarea,minHeight:80,marginTop:12}}/><button onClick={addDecision} style={secondary}>+ Tilføj beslutning</button></>}</section>

    <section style={card}><h2 style={h2}>Handlinger</h2><p style={hint}>Vælger du en ansvarlig, vises handlingen automatisk på personens forside. Adgang til hele mødet gives separat via deltagerlisten.</p>{actions.map(a=>editingActionId===a.id?<div key={a.id} style={row}><input value={editActionTitle} onChange={e=>setEditActionTitle(e.target.value)} style={input}/><select value={editActionResponsible} onChange={e=>setEditActionResponsible(e.target.value)} style={input}><option value="">Ingen ansvarlig valgt</option>{staffDirectory.map(p=><option key={p.user_id} value={p.user_id}>{p.display_name}</option>)}</select><input type="date" value={editActionDue} onChange={e=>setEditActionDue(e.target.value)} style={input}/><div style={{display:"flex",gap:6,marginTop:8}}><button onClick={()=>saveActionEdit(a.id)} style={smallPrimary}>Gem</button><button onClick={()=>setEditingActionId(null)} style={smallButton}>Annullér</button></div></div>:<article key={a.id} style={{...row,opacity:a.completed?0.65:1}}><div style={{display:"flex",gap:9,alignItems:"start"}}><button onClick={()=>toggleAction(a)} disabled={!canEditContent} aria-label={a.completed?"Markér som ikke færdig":"Markér som færdig"} style={{border:0,background:"transparent",padding:0,cursor:canEditContent?"pointer":"default",fontSize:17}}>{a.completed?"☑":"☐"}</button><div style={{flex:1,textDecoration:a.completed?"line-through":"none"}}><strong>{a.title}</strong>{a.responsible_user_id&&<small style={{display:"block",marginTop:3}}>Ansvarlig: {nameFor(a.responsible_user_id)}</small>}{a.due_date&&<small style={{display:"block",marginTop:3}}>Deadline {new Date(a.due_date+"T12:00").toLocaleDateString("da-DK")}</small>}</div>{canEditContent&&<div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}><button onClick={()=>startEditAction(a)} style={smallButton}>Redigér</button><button onClick={()=>removeAction(a.id)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div>}</div></article>)}{!actions.length&&<p style={hint}>Ingen handlinger endnu.</p>}{canEditContent&&<><input value={newAction} onChange={e=>setNewAction(e.target.value)} placeholder="Hvad skal gøres?" style={input}/><select value={responsible} onChange={e=>setResponsible(e.target.value)} style={input}><option value="">Ingen ansvarlig valgt</option>{staffDirectory.map(p=><option key={p.user_id} value={p.user_id}>{p.display_name}</option>)}</select><input type="date" value={due} onChange={e=>setDue(e.target.value)} style={input}/><button onClick={addAction} style={secondary}>+ Tilføj handling</button></>}</section>
   </div>
  </section>
 </main>;
}

const shell:React.CSSProperties={maxWidth:1000,margin:"auto",padding:"28px 24px 70px"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};
const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:25,margin:"7px 0 8px"};
const textarea:React.CSSProperties={width:"100%",boxSizing:"border-box",minHeight:120,padding:12,border:"1px solid #d8d5cd",borderRadius:9,fontSize:15,lineHeight:1.5,resize:"vertical",marginBottom:16,background:"white"};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:11,border:"1px solid #d8d5cd",borderRadius:8,marginTop:6,background:"white"};
const labelStyle:React.CSSProperties={fontSize:13,fontWeight:900,color:"#4d5c53"};
const primary:React.CSSProperties={border:0,borderRadius:9,padding:"11px 15px",background:"#dfa94f",color:"#243d33",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={...primary,background:"#365044",color:"white",marginTop:10};
const cancelButton:React.CSSProperties={border:"1px solid #cfcac0",borderRadius:9,padding:"10px 14px",background:"white",color:"#59645e",fontWeight:900,cursor:"pointer",marginTop:10};
const headerButton:React.CSSProperties={border:"1px solid rgba(255,255,255,.45)",borderRadius:8,padding:"7px 10px",background:"transparent",color:"white",fontWeight:900,cursor:"pointer"};
const row:React.CSSProperties={display:"block",padding:"10px 11px",background:"#f5f3ee",borderRadius:8,marginTop:7,color:"#26342e"};
const hint:React.CSSProperties={color:"#707670",fontSize:14,lineHeight:1.5};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const chip:React.CSSProperties={padding:"7px 10px",background:"#e7eee9",borderRadius:20,fontSize:13,fontWeight:800};
const roleChip:React.CSSProperties={padding:"8px 11px",background:"#f4ead8",borderRadius:8,fontSize:13};
const topLink:React.CSSProperties={color:"white",textDecoration:"none",fontWeight:800};
const internalBox:React.CSSProperties={marginTop:8,padding:17,background:"#f0f1ed",border:"1px solid #d9ddd6",borderRadius:11};
const smallButton:React.CSSProperties={border:"1px solid #d2cec5",borderRadius:7,padding:"5px 8px",background:"white",color:"#526159",fontSize:11,fontWeight:800,cursor:"pointer"};
const smallPrimary:React.CSSProperties={...smallButton,background:"#365044",color:"white",borderColor:"#365044"};
const warning:React.CSSProperties={marginBottom:16,padding:13,background:"#fff3cd",borderRadius:9,color:"#7c5d24",fontWeight:700};
const success:React.CSSProperties={marginBottom:16,padding:13,background:"#e7eee9",borderRadius:9,color:"#365044",fontWeight:800};
const editSection:React.CSSProperties={marginTop:14,paddingTop:14,borderTop:"1px solid #dce2dc"};
const choice=(selected:boolean):React.CSSProperties=>({display:"flex",gap:7,alignItems:"center",padding:"8px 10px",border:selected?"2px solid #526b60":"1px solid #d8d5cd",borderRadius:8,background:selected?"#edf1ec":"white",fontWeight:800,cursor:"pointer"});
