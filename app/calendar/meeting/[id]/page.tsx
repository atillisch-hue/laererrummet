"use client";

import Link from "next/link";
import {useEffect,useState,use} from "react";
import {supabase} from "../../../../lib/supabase";

type Meeting={id:number;school_id:number;title:string;meeting_type:string;starts_at:string;ends_at:string|null;location:string|null;agenda:string|null;minutes:string|null;internal_notes:string|null;status:string;created_by:string;student_id:number|null;meeting_leader_user_id:string|null;minute_taker_user_id:string|null};
type Action={id:number;title:string;due_date:string|null;completed:boolean;responsible_user_id:string|null};
type Decision={id:number;text:string};
type User={user_id:string;display_name:string;role:string};
type Participant={id:number;user_id:string|null;external_name:string|null;external_role:string|null;access_type:string};

const toLocalInput=(value:string|null)=>{if(!value)return"";const d=new Date(value),p=(n:number)=>String(n).padStart(2,"0");return`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`};

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
 const[newAction,setNewAction]=useState("");
 const[responsible,setResponsible]=useState("");
 const[due,setDue]=useState("");
 const[decision,setDecision]=useState("");
 const[saving,setSaving]=useState(false);
 const[error,setError]=useState("");
 const[canManage,setCanManage]=useState(false);
 const[editing,setEditing]=useState(false);
 const[title,setTitle]=useState("");
 const[meetingType,setMeetingType]=useState("");
 const[startsAt,setStartsAt]=useState("");
 const[endsAt,setEndsAt]=useState("");
 const[location,setLocation]=useState("");
 const[status,setStatus]=useState("planned");
 const[editingActionId,setEditingActionId]=useState<number|null>(null);
 const[editActionTitle,setEditActionTitle]=useState("");
 const[editActionResponsible,setEditActionResponsible]=useState("");
 const[editActionDue,setEditActionDue]=useState("");
 const[editingDecisionId,setEditingDecisionId]=useState<number|null>(null);
 const[editDecisionText,setEditDecisionText]=useState("");

 async function load(){
  const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user)return;
  const[m,a,d,p,u]=await Promise.all([
   supabase.from("calendar_meetings").select("*").eq("id",meetingId).single(),
   supabase.from("meeting_actions").select("id,title,due_date,completed,responsible_user_id").eq("meeting_id",meetingId).order("created_at"),
   supabase.from("meeting_decisions").select("id,text").eq("meeting_id",meetingId).order("created_at"),
   supabase.from("meeting_participants").select("id,user_id,external_name,external_role,access_type").eq("meeting_id",meetingId),
   supabase.rpc("get_meeting_user_directory")
  ]);
  if(m.error){setError("Du har ikke adgang til mødet, eller mødet findes ikke.");return}
  const row=m.data as Meeting;
  const admin=await supabase.from("school_memberships").select("user_id").eq("school_id",row.school_id).eq("user_id",user.id).eq("role","admin").eq("active",true).limit(1).maybeSingle();
  setCanManage(row.created_by===user.id||!!admin.data);
  setMeeting(row);setAgenda(row.agenda||"");setMinutes(row.minutes||"");setInternalNotes(row.internal_notes||"");setTitle(row.title);setMeetingType(row.meeting_type);setStartsAt(toLocalInput(row.starts_at));setEndsAt(toLocalInput(row.ends_at));setLocation(row.location||"");setStatus(row.status);
  setActions((a.data||[]) as Action[]);setDecisions((d.data||[]) as Decision[]);setParticipants((p.data||[]) as Participant[]);setDirectory((u.data||[]) as User[]);setError("");
 }
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session){window.location.href="/?teacher=1";return}await load()})()},[meetingId]);
 const nameFor=(id:string|null)=>directory.find(u=>u.user_id===id)?.display_name||"Deltager";

 async function saveDetails(){
  if(!canManage||!title.trim()||!startsAt)return;
  const start=new Date(startsAt),end=endsAt?new Date(endsAt):null;
  if(Number.isNaN(start.getTime())||(end&&Number.isNaN(end.getTime()))){setError("Dato eller tidspunkt er ugyldigt.");return}
  if(end&&end<=start){setError("Sluttidspunktet skal ligge efter starttidspunktet.");return}
  setSaving(true);setError("");
  const{error:e}=await supabase.from("calendar_meetings").update({title:title.trim(),meeting_type:meetingType.trim()||"Møde",starts_at:start.toISOString(),ends_at:end?.toISOString()||null,location:location.trim()||null,status}).eq("id",meetingId);
  if(e)setError(e.message);else{setEditing(false);await load()}
  setSaving(false);
 }
 async function saveNotes(){
  setSaving(true);setError("");
  const{error:e}=await supabase.from("calendar_meetings").update({agenda,minutes,internal_notes:internalNotes}).eq("id",meetingId);
  if(e)setError("Du har ikke ret til at gemme ændringer på dette møde.");else await load();
  setSaving(false);
 }
 async function removeMeeting(){
  if(!canManage)return;
  if(!window.confirm("Slet mødet permanent? Deltagere, bookinger, beslutninger og handlinger knyttet til mødet bliver også slettet."))return;
  setSaving(true);setError("");
  const{error:e}=await supabase.from("calendar_meetings").delete().eq("id",meetingId);
  if(e){setError(e.message);setSaving(false);return}
  window.location.replace("/calendar");
 }
 async function addAction(){
  if(!newAction.trim())return;
  const{data:{user}}=await supabase.auth.getUser();
  const{error:e}=await supabase.from("meeting_actions").insert({meeting_id:meetingId,title:newAction.trim(),due_date:due||null,responsible_user_id:responsible||null,created_by:user?.id});
  if(e){setError(e.message);return}
  setNewAction("");setDue("");setResponsible("");await load();
 }
 async function toggleAction(a:Action){
  if(!canManage)return;
  const{error:e}=await supabase.from("meeting_actions").update({completed:!a.completed,completed_at:!a.completed?new Date().toISOString():null}).eq("id",a.id);
  if(e)setError(e.message);else await load();
 }
 function startEditAction(a:Action){setEditingActionId(a.id);setEditActionTitle(a.title);setEditActionResponsible(a.responsible_user_id||"");setEditActionDue(a.due_date||"")}
 async function saveActionEdit(id:number){
  if(!editActionTitle.trim())return;
  const{error:e}=await supabase.from("meeting_actions").update({title:editActionTitle.trim(),responsible_user_id:editActionResponsible||null,due_date:editActionDue||null}).eq("id",id);
  if(e){setError(e.message);return}
  setEditingActionId(null);await load();
 }
 async function removeAction(id:number){
  if(!window.confirm("Vil du slette denne handling?"))return;
  const{error:e}=await supabase.from("meeting_actions").delete().eq("id",id);
  if(e)setError(e.message);else await load();
 }
 async function addDecision(){
  if(!decision.trim())return;
  const{data:{user}}=await supabase.auth.getUser();if(!user)return;
  const{error:e}=await supabase.from("meeting_decisions").insert({meeting_id:meetingId,text:decision.trim(),created_by:user.id});
  if(e){setError(e.message);return}
  setDecision("");await load();
 }
 function startEditDecision(d:Decision){setEditingDecisionId(d.id);setEditDecisionText(d.text)}
 async function saveDecisionEdit(id:number){
  if(!editDecisionText.trim())return;
  const{error:e}=await supabase.from("meeting_decisions").update({text:editDecisionText.trim()}).eq("id",id);
  if(e){setError(e.message);return}
  setEditingDecisionId(null);await load();
 }
 async function removeDecision(id:number){
  if(!window.confirm("Vil du slette denne beslutning?"))return;
  const{error:e}=await supabase.from("meeting_decisions").delete().eq("id",id);
  if(e)setError(e.message);else await load();
 }

 if(error&&!meeting)return <main style={shell}><Link href="/calendar">← Kalender</Link><h1>{error}</h1></main>;
 if(!meeting)return <main style={shell}>Åbner møderummet…</main>;
 const dt=new Date(meeting.starts_at),staff=participants.filter(p=>p.user_id&&p.access_type==="internal"),guardians=participants.filter(p=>p.user_id&&p.access_type==="guardian"),external=participants.filter(p=>p.access_type==="external");

 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"22px 28px"}}><div style={{maxWidth:1000,margin:"auto"}}><div style={{display:"flex",justifyContent:"space-between",gap:15,alignItems:"center",flexWrap:"wrap"}}><div style={{display:"flex",gap:15}}><Link href="/calendar" style={topLink}>← Kalender</Link><Link href="/archive" style={topLink}>Arkiv</Link></div>{canManage&&<div style={{display:"flex",gap:8}}><button onClick={()=>setEditing(v=>!v)} style={headerButton}>{editing?"Luk redigering":"Redigér møde"}</button><button onClick={removeMeeting} disabled={saving} style={{...headerButton,borderColor:"#d8a7a0",color:"#ffe8e4"}}>Slet møde</button></div>}</div><small style={{display:"block",marginTop:20,opacity:.7,fontWeight:900}}>{meeting.meeting_type.toUpperCase()}</small><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"4px 0 7px"}}>{meeting.title}</h1><span>{dt.toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} · {dt.toLocaleTimeString("da-DK",{hour:"2-digit",minute:"2-digit"})}{meeting.location?` · ${meeting.location}`:""}</span></div></header>
  <section style={shell}>
   {editing&&canManage&&<section style={{...card,marginBottom:16,border:"1px solid #b9cabb",background:"#f7faf7"}}><p style={eyebrow}>REDIGÉR MØDE</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10,marginTop:12}}><label style={labelStyle}>Titel<input value={title} onChange={e=>setTitle(e.target.value)} style={input}/></label><label style={labelStyle}>Type<input value={meetingType} onChange={e=>setMeetingType(e.target.value)} style={input}/></label><label style={labelStyle}>Start<input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} style={input}/></label><label style={labelStyle}>Slut<input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} style={input}/></label><label style={labelStyle}>Lokale / sted<input value={location} onChange={e=>setLocation(e.target.value)} style={input}/></label><label style={labelStyle}>Status<select value={status} onChange={e=>setStatus(e.target.value)} style={input}><option value="planned">Planlagt</option><option value="completed">Afsluttet</option><option value="cancelled">Aflyst</option></select></label></div><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><button onClick={saveDetails} disabled={saving||!title.trim()||!startsAt} style={secondary}>{saving?"Gemmer…":"Gem ændringer"}</button><button onClick={()=>{setEditing(false);setTitle(meeting.title);setMeetingType(meeting.meeting_type);setStartsAt(toLocalInput(meeting.starts_at));setEndsAt(toLocalInput(meeting.ends_at));setLocation(meeting.location||"");setStatus(meeting.status)}} style={cancelButton}>Annuller</button></div></section>}

   <section style={{...card,marginBottom:16}}><p style={eyebrow}>DELTAGERE & ADGANG</p><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}><span style={chip}>Mødeopretter · intern</span>{staff.map(p=><span key={p.id} style={chip}>{nameFor(p.user_id)} · personale</span>)}{guardians.map(p=><span key={p.id} style={{...chip,background:"#f4ead8"}}>{nameFor(p.user_id)} · forælder</span>)}{external.map(p=><span key={p.id} style={{...chip,background:"#eee9df"}}>{p.external_name}{p.external_role?` · ${p.external_role}`:""} · ekstern</span>)}</div>{(meeting.meeting_leader_user_id||meeting.minute_taker_user_id)&&<div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:14}}>{meeting.meeting_leader_user_id&&<span style={roleChip}><b>Mødeleder</b> · {nameFor(meeting.meeting_leader_user_id)}</span>}{meeting.minute_taker_user_id&&<span style={roleChip}><b>Referent</b> · {nameFor(meeting.minute_taker_user_id)}</span>}</div>}{meeting.student_id&&<small style={{display:"block",marginTop:10,color:"#707670"}}>Mødet er koblet til en elev. Eleven har ikke adgang til mødet.</small>}</section>

   <section style={card}><p style={eyebrow}>DELES MED INVITEREDE DELTAGERE</p><h2 style={h2}>Dagsorden</h2><textarea disabled={!canManage} value={agenda} onChange={e=>setAgenda(e.target.value)} placeholder="Hvad skal vi omkring?" style={textarea}/><h2 style={h2}>Officielt referat</h2><p style={hint}>Dette er den del af mødet, som inviterede forældre senere kan få adgang til i deres arkiv.</p><textarea disabled={!canManage} value={minutes} onChange={e=>setMinutes(e.target.value)} placeholder="Beslutninger, aftaler og det officielle referat…" style={{...textarea,minHeight:210}}/><div style={internalBox}><p style={eyebrow}>KUN INTERNT</p><h2 style={h2}>Interne noter</h2><p style={hint}>Arbejdsnoter til personale. De indgår ikke i forældrevisningen.</p><textarea disabled={!canManage} value={internalNotes} onChange={e=>setInternalNotes(e.target.value)} placeholder="Interne observationer og arbejdsnoter…" style={{...textarea,minHeight:160,marginBottom:0}}/></div>{canManage&&<button onClick={saveNotes} disabled={saving} style={{...primary,marginTop:16}}>{saving?"Gemmer…":"Gem mødenoter"}</button>}{error&&<p style={{color:"#9b3b32",fontWeight:700}}>{error}</p>}</section>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16,marginTop:16}}>
    <section style={card}><h2 style={h2}>Beslutninger</h2>{decisions.map(d=>editingDecisionId===d.id?<div key={d.id} style={row}><textarea value={editDecisionText} onChange={e=>setEditDecisionText(e.target.value)} style={{...textarea,minHeight:75,marginBottom:8}}/><div style={{display:"flex",gap:6}}><button onClick={()=>saveDecisionEdit(d.id)} style={smallPrimary}>Gem</button><button onClick={()=>setEditingDecisionId(null)} style={smallButton}>Annullér</button></div></div>:<article key={d.id} style={row}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><span>✓ {d.text}</span>{canManage&&<div style={{display:"flex",gap:5}}><button onClick={()=>startEditDecision(d)} style={smallButton}>Redigér</button><button onClick={()=>removeDecision(d.id)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div>}</div></article>)}{!decisions.length&&<p style={hint}>Ingen beslutninger endnu.</p>}{canManage&&<><textarea value={decision} onChange={e=>setDecision(e.target.value)} placeholder="Hvad besluttede I?" style={{...textarea,minHeight:80,marginTop:12}}/><button onClick={addDecision} style={secondary}>+ Tilføj beslutning</button></>}</section>

    <section style={card}><h2 style={h2}>Handlinger</h2>{actions.map(a=>editingActionId===a.id?<div key={a.id} style={row}><input value={editActionTitle} onChange={e=>setEditActionTitle(e.target.value)} style={input}/><select value={editActionResponsible} onChange={e=>setEditActionResponsible(e.target.value)} style={input}><option value="">Ingen ansvarlig valgt</option>{staff.map(p=><option key={p.id} value={p.user_id||""}>{nameFor(p.user_id)}</option>)}</select><input type="date" value={editActionDue} onChange={e=>setEditActionDue(e.target.value)} style={input}/><div style={{display:"flex",gap:6,marginTop:8}}><button onClick={()=>saveActionEdit(a.id)} style={smallPrimary}>Gem</button><button onClick={()=>setEditingActionId(null)} style={smallButton}>Annullér</button></div></div>:<article key={a.id} style={{...row,opacity:a.completed?.65:1}}><div style={{display:"flex",gap:9,alignItems:"start"}}><button onClick={()=>toggleAction(a)} disabled={!canManage} aria-label={a.completed?"Markér som ikke færdig":"Markér som færdig"} style={{border:0,background:"transparent",padding:0,cursor:canManage?"pointer":"default",fontSize:17}}>{a.completed?"☑":"☐"}</button><div style={{flex:1,textDecoration:a.completed?"line-through":"none"}}><strong>{a.title}</strong>{a.responsible_user_id&&<small style={{display:"block",marginTop:3}}>Ansvarlig: {nameFor(a.responsible_user_id)}</small>}{a.due_date&&<small style={{display:"block",marginTop:3}}>Deadline {new Date(a.due_date+"T12:00").toLocaleDateString("da-DK")}</small>}</div>{canManage&&<div style={{display:"flex",gap:5,flexWrap:"wrap",justifyContent:"flex-end"}}><button onClick={()=>startEditAction(a)} style={smallButton}>Redigér</button><button onClick={()=>removeAction(a.id)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div>}</div></article>)}{!actions.length&&<p style={hint}>Ingen handlinger endnu.</p>}{canManage&&<><input value={newAction} onChange={e=>setNewAction(e.target.value)} placeholder="Hvad skal gøres?" style={input}/><select value={responsible} onChange={e=>setResponsible(e.target.value)} style={input}><option value="">Ingen ansvarlig valgt</option>{staff.map(p=><option key={p.id} value={p.user_id||""}>{nameFor(p.user_id)}</option>)}</select><input type="date" value={due} onChange={e=>setDue(e.target.value)} style={input}/><button onClick={addAction} style={secondary}>+ Tilføj handling</button></>}</section>
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
