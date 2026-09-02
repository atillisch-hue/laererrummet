"use client";

import {FormEvent,useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type Meeting={id:number;title:string;meeting_date:string;start_time:string|null;location:string|null;agenda:string|null;minutes:string|null};
type Decision={id:number;meeting_id:number;decision:string;responsible:string|null;due_date:string|null;completed:boolean};

export default function BoardMeetingsPage(){
 const[ready,setReady]=useState(false),[meetings,setMeetings]=useState<Meeting[]>([]),[decisions,setDecisions]=useState<Decision[]>([]),[schoolId,setSchoolId]=useState<number|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const[title,setTitle]=useState("Bestyrelsesmøde"),[date,setDate]=useState(""),[time,setTime]=useState("19:00"),[meetingLocation,setMeetingLocation]=useState(""),[agenda,setAgenda]=useState("");
 const[minutesDraft,setMinutesDraft]=useState<Record<number,string>>({}),[decisionDraft,setDecisionDraft]=useState<Record<number,string>>({}),[responsibleDraft,setResponsibleDraft]=useState<Record<number,string>>({}),[dueDraft,setDueDraft]=useState<Record<number,string>>({});
 const[editingMeeting,setEditingMeeting]=useState<number|null>(null),[editTitle,setEditTitle]=useState(""),[editDate,setEditDate]=useState(""),[editTime,setEditTime]=useState(""),[editLocation,setEditLocation]=useState(""),[editAgenda,setEditAgenda]=useState("");
 const[editingDecision,setEditingDecision]=useState<number|null>(null),[editDecision,setEditDecision]=useState(""),[editResponsible,setEditResponsible]=useState(""),[editDue,setEditDue]=useState("");

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();const user=data.session?.user;
  if(!user){window.location.href="/";return}
  if(!hasRole(user,"board")){window.location.href="/noticeboard";return}
  const{data:membership,error}=await supabase.from("school_memberships").select("school_id").eq("user_id",user.id).eq("role","board").eq("active",true).limit(1).maybeSingle();
  if(error||!membership?.school_id){setMessage("Din bestyrelsesrolle er ikke knyttet til en aktiv skole.");setReady(true);return}
  setSchoolId(Number(membership.school_id));await load();setReady(true);
 })()},[]);

 async function load(){
  const[m,d]=await Promise.all([
   supabase.from("board_meetings").select("id,title,meeting_date,start_time,location,agenda,minutes").order("meeting_date",{ascending:false}).order("start_time",{ascending:false}),
   supabase.from("board_decisions").select("id,meeting_id,decision,responsible,due_date,completed").order("created_at",{ascending:true})
  ]);
  if(m.error||d.error)setMessage("Bestyrelsesmøderne kunne ikke hentes.");
  setMeetings((m.data||[]) as Meeting[]);setDecisions((d.data||[]) as Decision[]);
  const drafts:Record<number,string>={};((m.data||[]) as Meeting[]).forEach(x=>drafts[x.id]=x.minutes||"");setMinutesDraft(drafts);
 }

 async function add(e:FormEvent){
  e.preventDefault();if(!date||!title.trim()||!schoolId)return;setBusy(true);setMessage("");
  const{error}=await supabase.from("board_meetings").insert({school_id:schoolId,title:title.trim(),meeting_date:date,start_time:time||null,location:meetingLocation.trim()||null,agenda:agenda.trim()||null});
  setBusy(false);if(error){setMessage("Mødet kunne ikke gemmes: "+error.message);return}
  setMeetingLocation("");setAgenda("");setDate("");setMessage("Mødet er oprettet ✓");await load();
 }
 function startMeetingEdit(m:Meeting){setEditingMeeting(m.id);setEditTitle(m.title);setEditDate(m.meeting_date);setEditTime(m.start_time?.slice(0,5)||"");setEditLocation(m.location||"");setEditAgenda(m.agenda||"");setMessage("")}
 async function saveMeeting(id:number){
  if(!editTitle.trim()||!editDate)return;setBusy(true);
  const{error}=await supabase.from("board_meetings").update({title:editTitle.trim(),meeting_date:editDate,start_time:editTime||null,location:editLocation.trim()||null,agenda:editAgenda.trim()||null,updated_at:new Date().toISOString()}).eq("id",id);
  setBusy(false);if(error){setMessage(error.message);return}setEditingMeeting(null);setMessage("Mødet er opdateret ✓");await load();
 }
 async function saveMinutes(id:number){const{error}=await supabase.from("board_meetings").update({minutes:(minutesDraft[id]||"").trim()||null,updated_at:new Date().toISOString()}).eq("id",id);if(error)setMessage(error.message);else{setMessage("Referatet er gemt ✓");await load()}}
 async function removeMeeting(id:number){if(!confirm("Vil du slette mødet? Tilknyttede beslutninger slettes også."))return;const{error}=await supabase.from("board_meetings").delete().eq("id",id);if(error)setMessage(error.message);else{setMessage("Mødet er slettet.");if(editingMeeting===id)setEditingMeeting(null);await load()}}

 async function addDecision(meetingId:number){const text=(decisionDraft[meetingId]||"").trim();if(!text)return;const{error}=await supabase.from("board_decisions").insert({meeting_id:meetingId,decision:text,responsible:(responsibleDraft[meetingId]||"").trim()||null,due_date:dueDraft[meetingId]||null});if(error){setMessage(error.message);return}setDecisionDraft(x=>({...x,[meetingId]:""}));setResponsibleDraft(x=>({...x,[meetingId]:""}));setDueDraft(x=>({...x,[meetingId]:""}));setMessage("Beslutningen er tilføjet ✓");await load()}
 function startDecisionEdit(d:Decision){setEditingDecision(d.id);setEditDecision(d.decision);setEditResponsible(d.responsible||"");setEditDue(d.due_date||"");setMessage("")}
 async function saveDecision(id:number){if(!editDecision.trim())return;const{error}=await supabase.from("board_decisions").update({decision:editDecision.trim(),responsible:editResponsible.trim()||null,due_date:editDue||null}).eq("id",id);if(error)setMessage(error.message);else{setEditingDecision(null);setMessage("Beslutningen er opdateret ✓");await load()}}
 async function toggleDecision(d:Decision){const{error}=await supabase.from("board_decisions").update({completed:!d.completed}).eq("id",d.id);if(error)setMessage(error.message);else await load()}
 async function removeDecision(id:number){if(!confirm("Vil du slette denne beslutning/opgave?"))return;const{error}=await supabase.from("board_decisions").delete().eq("id",id);if(error)setMessage(error.message);else{if(editingDecision===id)setEditingDecision(null);setMessage("Beslutningen er slettet.");await load()}}

 const today=new Date().toISOString().slice(0,10),upcoming=meetings.filter(m=>m.meeting_date>=today).sort((a,b)=>a.meeting_date.localeCompare(b.meeting_date)),previous=meetings.filter(m=>m.meeting_date<today);
 const meetingCard=(m:Meeting)=>{
  const edit=editingMeeting===m.id;
  return <article key={m.id} style={{...panel,marginBottom:16}}>
   {edit?<div style={{display:"grid",gap:12}}><p style={eyebrow}>REDIGÉR MØDE</p><div style={grid}><label style={label}>Titel<input style={input} value={editTitle} onChange={e=>setEditTitle(e.target.value)}/></label><label style={label}>Dato<input style={input} type="date" value={editDate} onChange={e=>setEditDate(e.target.value)}/></label><label style={label}>Tid<input style={input} type="time" value={editTime} onChange={e=>setEditTime(e.target.value)}/></label><label style={label}>Sted<input style={input} value={editLocation} onChange={e=>setEditLocation(e.target.value)}/></label></div><label style={label}>Dagsorden<textarea style={{...input,minHeight:130}} value={editAgenda} onChange={e=>setEditAgenda(e.target.value)}/></label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>saveMeeting(m.id)} disabled={busy} style={smallButton}>{busy?"Gemmer…":"Gem møde"}</button><button onClick={()=>setEditingMeeting(null)} style={secondaryButton}>Annullér</button><button onClick={()=>removeMeeting(m.id)} style={deleteButton}>Slet møde</button></div></div>:<>
    <div style={{display:"flex",justifyContent:"space-between",gap:18,flexWrap:"wrap"}}><div><p style={eyebrow}>{new Date(m.meeting_date+"T12:00:00").toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).toUpperCase()}</p><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"5px 0"}}>{m.title}</h2><p style={{color:"#687068",margin:"5px 0"}}>{m.start_time?`Kl. ${m.start_time.slice(0,5)}`:""}{m.location?` · ${m.location}`:""}</p></div><div style={{display:"flex",gap:7,alignItems:"start"}}><button onClick={()=>startMeetingEdit(m)} style={secondaryButton}>Redigér</button><button onClick={()=>removeMeeting(m.id)} style={deleteButton}>Slet</button></div></div>
    <section style={section}><strong>Dagsorden</strong><div style={body}>{m.agenda||"Der er ikke tilføjet en dagsorden endnu."}</div></section>
    <section style={section}><strong>Referat</strong><textarea style={{...input,minHeight:140,marginTop:10}} value={minutesDraft[m.id]||""} onChange={e=>setMinutesDraft(x=>({...x,[m.id]:e.target.value}))} placeholder="Skriv referatet fra mødet…"/><button onClick={()=>saveMinutes(m.id)} style={smallButton}>Gem referat</button></section>
    <section style={section}><strong>Beslutninger & opfølgning</strong><div style={{marginTop:10}}>{decisions.filter(d=>d.meeting_id===m.id).map(d=>{const decisionEdit=editingDecision===d.id;return <div key={d.id} style={{padding:"10px 0",borderBottom:"1px solid #eeeae2"}}>{decisionEdit?<div style={{display:"grid",gridTemplateColumns:"minmax(220px,2fr) minmax(150px,1fr) minmax(150px,1fr)",gap:8}}><input style={input} value={editDecision} onChange={e=>setEditDecision(e.target.value)} placeholder="Beslutning"/><input style={input} value={editResponsible} onChange={e=>setEditResponsible(e.target.value)} placeholder="Ansvarlig"/><input style={input} type="date" value={editDue} onChange={e=>setEditDue(e.target.value)}/><div style={{gridColumn:"1 / -1",display:"flex",gap:7,flexWrap:"wrap"}}><button onClick={()=>saveDecision(d.id)} style={smallButton}>Gem beslutning</button><button onClick={()=>setEditingDecision(null)} style={secondaryButton}>Annullér</button><button onClick={()=>removeDecision(d.id)} style={deleteButton}>Slet</button></div></div>:<div style={{display:"flex",gap:10,alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap"}}><label style={{display:"flex",gap:10,alignItems:"flex-start",flex:"1 1 300px"}}><input type="checkbox" checked={d.completed} onChange={()=>toggleDecision(d)}/><div><span style={{textDecoration:d.completed?"line-through":"none",fontWeight:700}}>{d.decision}</span>{(d.responsible||d.due_date)&&<small style={{display:"block",color:"#777",marginTop:3}}>{d.responsible?`Ansvarlig: ${d.responsible}`:""}{d.responsible&&d.due_date?" · ":""}{d.due_date?`Frist: ${new Date(d.due_date+"T12:00:00").toLocaleDateString("da-DK")}`:""}</small>}</div></label><div style={{display:"flex",gap:6}}><button onClick={()=>startDecisionEdit(d)} style={secondaryButton}>Redigér</button><button onClick={()=>removeDecision(d.id)} style={deleteButton}>Slet</button></div></div>}</div>})}{decisions.filter(d=>d.meeting_id===m.id).length===0&&<p style={{color:"#8a8f89"}}>Ingen beslutninger registreret endnu.</p>}</div><div style={{display:"grid",gridTemplateColumns:"minmax(220px,2fr) minmax(150px,1fr) minmax(150px,1fr) auto",gap:8,marginTop:14}}><input style={input} value={decisionDraft[m.id]||""} onChange={e=>setDecisionDraft(x=>({...x,[m.id]:e.target.value}))} placeholder="Beslutning eller opgave"/><input style={input} value={responsibleDraft[m.id]||""} onChange={e=>setResponsibleDraft(x=>({...x,[m.id]:e.target.value}))} placeholder="Ansvarlig"/><input style={input} type="date" value={dueDraft[m.id]||""} onChange={e=>setDueDraft(x=>({...x,[m.id]:e.target.value}))}/><button onClick={()=>addDecision(m.id)} style={{...smallButton,marginTop:0}}>Tilføj</button></div></section>
   </>}
  </article>;
 };

 if(!ready)return <main style={{padding:50}}>Henter møder…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e",paddingBottom:60}}><section style={{maxWidth:1100,margin:"auto",padding:"42px 24px"}}><p style={eyebrow}>MØDER · REFERATER · BESLUTNINGER</p><h1 style={h1}>Bestyrelsesmøder</h1><p style={lead}>Hele mødearbejdet samlet ét sted – fra dagsorden til referat, beslutninger og opfølgning. Alle objekter kan redigeres eller slettes bagefter.</p>{message&&<div style={{marginTop:18,padding:12,background:"#e7eee9",borderRadius:9,fontWeight:700}}>{message}</div>}{schoolId&&<form onSubmit={add} style={panel}><p style={eyebrow}>OPRET MØDE</p><div style={grid}><label style={label}>Titel<input style={input} value={title} onChange={e=>setTitle(e.target.value)}/></label><label style={label}>Dato<input style={input} type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label style={label}>Tid<input style={input} type="time" value={time} onChange={e=>setTime(e.target.value)}/></label><label style={label}>Sted<input style={input} value={meetingLocation} onChange={e=>setMeetingLocation(e.target.value)} placeholder="Fx lærerværelset"/></label></div><label style={{...label,marginTop:14}}>Dagsorden<textarea style={{...input,minHeight:140}} value={agenda} onChange={e=>setAgenda(e.target.value)} placeholder={'1. Godkendelse af dagsorden\n2. Nyt fra skolelederen\n3. Økonomi\n4. Eventuelt'}/></label><button disabled={busy} style={button}>{busy?"Gemmer…":"Opret møde →"}</button></form>}<h2 style={sectionTitle}>Kommende møder</h2>{upcoming.length?upcoming.map(meetingCard):<p style={{color:"#777"}}>Ingen kommende møder.</p>}<h2 style={sectionTitle}>Tidligere møder</h2>{previous.length?previous.map(meetingCard):<p style={{color:"#777"}}>Ingen tidligere møder endnu.</p>}</section></main>;
}

const eyebrow:React.CSSProperties={fontSize:11,fontWeight:800,letterSpacing:1.7,color:"#718077",marginBottom:5};
const h1:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:44,margin:"7px 0 10px"};
const lead:React.CSSProperties={fontSize:18,color:"#687068",lineHeight:1.55,maxWidth:760};
const panel:React.CSSProperties={background:"white",border:"1px solid #dedbd2",borderRadius:14,padding:24,marginTop:28};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:14};
const label:React.CSSProperties={display:"flex",flexDirection:"column",gap:7,fontWeight:700};
const input:React.CSSProperties={boxSizing:"border-box",width:"100%",padding:"11px 12px",border:"1px solid #d6d2c9",borderRadius:8,font:"inherit",background:"#fff",minWidth:0};
const button:React.CSSProperties={marginTop:18,padding:"12px 18px",border:0,borderRadius:8,background:"#243d33",color:"white",fontWeight:800,cursor:"pointer"};
const smallButton:React.CSSProperties={marginTop:10,padding:"9px 12px",border:0,borderRadius:8,background:"#486b59",color:"white",fontWeight:800,cursor:"pointer"};
const secondaryButton:React.CSSProperties={padding:"7px 10px",border:"1px solid #d1cdc4",borderRadius:8,background:"white",color:"#526159",fontWeight:800,cursor:"pointer",fontSize:12};
const deleteButton:React.CSSProperties={padding:"7px 10px",border:"1px solid #e1c9c4",borderRadius:8,background:"white",color:"#9a463c",cursor:"pointer",fontWeight:800,fontSize:12};
const section:React.CSSProperties={borderTop:"1px solid #e4e0d8",marginTop:18,paddingTop:18};
const body:React.CSSProperties={whiteSpace:"pre-wrap",lineHeight:1.65,marginTop:10,color:"#4e5852"};
const sectionTitle:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:30,margin:"38px 0 4px"};
