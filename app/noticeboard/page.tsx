"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";
import {scheduleOccursOn,type RecurrencePattern} from "../../lib/scheduleRecurrence";
import MeetingActionInbox from "../MeetingActionInbox";
import NoticeboardDayOverview from "../NoticeboardDayOverview";

type Audience="teacher"|"parent"|"board"|"admin"|"student";
type Note={id:string;text:string;author_email:string;author_id:string;created_at:string;audiences:Audience[]};
type EntryKind="lesson"|"assembly"|"break"|"duty"|"other";
type Entry={id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null;entry_kind:EntryKind;recurrence_pattern:RecurrencePattern};
type ScheduleTeacher={schedule_entry_id:number;teacher_id:string};
type Klass={id:number;name:string};
type Profile={user_id:string;initials:string|null};
type Assignment={id:number;schedule_entry_id:number;assignment_date:string;absent_teacher_id:string;substitute_teacher_id:string;substitute_plan:string|null};
type CalendarMeeting={id:number;title:string;starts_at:string;ends_at:string|null};
type AbsentStaff={user_id:string;display_name:string;initials:string|null};
type FileRow={id:string;noticeboard_post_id:string;display_name:string;object_path:string;mime_type:string|null;size_bytes:number|null};
type EventKind="pedagogical"|"special_week"|"project"|"trip"|"event"|"other";
type CalendarEvent={date:string;label:string;kind:EventKind};
type ClosedDay={date:string;label:string};
type WeekMark={key:string;kind:"closed"|EventKind;label:string;dates:string[]};

const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const noteColors=["#fff2a8","#f8d7c4","#dcefcf","#dce8f7","#f1d9ee"];
const audienceOptions:{id:Audience;label:string}[]=[{id:"teacher",label:"Lærere"},{id:"student",label:"Elever"},{id:"parent",label:"Forældre"},{id:"board",label:"Bestyrelse"},{id:"admin",label:"Admin"}];
const allowedExtensions=new Set(["pdf","doc","docx","xls","xlsx","ppt","pptx","txt","csv","jpg","jpeg","png","webp"]);
const mimeByExtension:Record<string,string>={pdf:"application/pdf",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xls:"application/vnd.ms-excel",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",ppt:"application/vnd.ms-powerpoint",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",txt:"text/plain",csv:"text/csv",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp"};
function extension(name:string){return name.split(".").pop()?.toLowerCase()||""}
function safeFileName(name:string){return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(-170)||"fil"}
function mondayFor(date:string){const d=new Date(date+"T12:00:00"),day=d.getDay()||7;d.setDate(d.getDate()-(day-1));return d}
function fileSize(size:number|null){if(size===null)return"";if(size<1024*1024)return`${Math.max(1,Math.round(size/1024))} KB`;return`${(size/(1024*1024)).toFixed(1)} MB`}
function eventTypeLabel(kind:"closed"|EventKind){return({pedagogical:"Pædagogisk dag",special_week:"Specialuge",project:"Projekt-/faguge",trip:"Lejrskole/tur",event:"Arrangement",other:"Andet",closed:"Lukket"} as Record<string,string>)[kind]||"Skolekalender"}
function shortDay(date:string){return new Date(date+"T12:00:00").toLocaleDateString("da-DK",{weekday:"short"}).replace(".","")}

export default function Noticeboard(){
 const[ready,setReady]=useState(false),[email,setEmail]=useState(""),[userId,setUserId]=useState(""),[isAdmin,setIsAdmin]=useState(false);
 const[text,setText]=useState(""),[notes,setNotes]=useState<Note[]>([]),[attachments,setAttachments]=useState<Record<string,FileRow[]>>({}),[selectedFiles,setSelectedFiles]=useState<File[]>([]);
 const[dbReady,setDbReady]=useState(true),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const[allEntries,setAllEntries]=useState<Entry[]>([]),[scheduleTeachers,setScheduleTeachers]=useState<ScheduleTeacher[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[meetings,setMeetings]=useState<CalendarMeeting[]>([]);
 const[classes,setClasses]=useState<Klass[]>([]),[profiles,setProfiles]=useState<Profile[]>([]),[staffAbsent,setStaffAbsent]=useState<AbsentStaff[]>([]);
 const[calendarEvents,setCalendarEvents]=useState<CalendarEvent[]>([]),[closedDays,setClosedDays]=useState<ClosedDay[]>([]);
 const[selectedDate,setSelectedDate]=useState(()=>iso(new Date())),[showComposer,setShowComposer]=useState(false),[audiences,setAudiences]=useState<Audience[]>(["teacher"]);
 const[editingId,setEditingId]=useState<string|null>(null),[editText,setEditText]=useState(""),[editAudiences,setEditAudiences]=useState<Audience[]>([]);

 const loadNotes=async()=>{
  const{data,error}=await supabase.from("noticeboard_posts").select("id,text,author_email,author_id,created_at,audiences").contains("audiences",["teacher"]).order("created_at",{ascending:false});
  if(error){setDbReady(false);return}
  const rows=(data||[]) as Note[];setDbReady(true);setNotes(rows);
  if(!rows.length){setAttachments({});return}
  const{data:fileData}=await supabase.from("school_files").select("id,noticeboard_post_id,display_name,object_path,mime_type,size_bytes").eq("area","noticeboard").in("noticeboard_post_id",rows.map(x=>x.id)).order("created_at");
  const grouped:Record<string,FileRow[]>={};for(const file of (fileData||[]) as FileRow[]){(grouped[file.noticeboard_post_id]||=[]).push(file)}setAttachments(grouped);
 };

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();if(!data.session){location.href="/?teacher=1";return}
  const user=data.session.user;setEmail(user.email||"");setUserId(user.id);setIsAdmin(hasRole(user,"admin"));
  const[eRes,stRes,cRes,pRes,aRes,mRes,smRes]=await Promise.all([
   supabase.from("schedule_entries").select("id,class_id,weekday,start_time,end_time,subject,room,entry_kind,recurrence_pattern"),
   supabase.from("schedule_teachers").select("schedule_entry_id,teacher_id").eq("teacher_id",user.id),
   supabase.from("classes").select("id,name"),
   supabase.from("user_profiles").select("user_id,initials"),
   supabase.from("substitute_assignments").select("id,schedule_entry_id,assignment_date,absent_teacher_id,substitute_teacher_id,substitute_plan"),
   supabase.from("calendar_meetings").select("id,title,starts_at,ends_at"),
   supabase.from("school_memberships").select("school_id").eq("user_id",user.id).eq("active",true).in("role",["teacher","admin"]).limit(1).maybeSingle()
  ]);
  setAllEntries((eRes.data||[]) as Entry[]);setScheduleTeachers((stRes.data||[]) as ScheduleTeacher[]);setClasses((cRes.data||[]) as Klass[]);setProfiles((pRes.data||[]) as Profile[]);setAssignments((aRes.data||[]) as Assignment[]);setMeetings((mRes.data||[]) as CalendarMeeting[]);
  if(smRes.data?.school_id){const{data:settings}=await supabase.from("school_settings").select("calendar_events,closed_days").eq("school_id",smRes.data.school_id).maybeSingle();setCalendarEvents(Array.isArray(settings?.calendar_events)?settings.calendar_events as CalendarEvent[]:[]);setClosedDays(Array.isArray(settings?.closed_days)?settings.closed_days as ClosedDay[]:[])}
  await loadNotes();setReady(true);
 })()},[]);

 useEffect(()=>{if(!ready)return;(async()=>{const{data,error}=await supabase.rpc("staff_absence_summary",{p_date:selectedDate});setStaffAbsent(error?[]:(data||[]) as AbsentStaff[])})()},[selectedDate,ready]);

 const toggleAudience=(a:Audience)=>setAudiences(v=>v.includes(a)?v.filter(x=>x!==a):[...v,a]);
 const toggleEditAudience=(a:Audience)=>setEditAudiences(v=>v.includes(a)?v.filter(x=>x!==a):[...v,a]);
 const chooseFiles=(files:FileList|null)=>{const picked=Array.from(files||[]).slice(0,5);const invalid=picked.find(f=>f.size>20*1024*1024||!allowedExtensions.has(extension(f.name)));if(invalid){setMessage(`Filen ${invalid.name} kan ikke vedhæftes. Brug Word, PDF, Office, tekst eller et billede på højst 20 MB.`);return}setMessage("");setSelectedFiles(picked)};
 const add=async()=>{
  if((!text.trim()&&!selectedFiles.length)||!userId||audiences.length===0||busy)return;setBusy(true);setMessage("");
  const fallbackText=text.trim()||`Dokument: ${selectedFiles[0]?.name||"vedhæftet fil"}`;
  const{data:post,error:postError}=await supabase.from("noticeboard_posts").insert({text:fallbackText,author_email:email,author_id:userId,audiences}).select("id,school_id").single();
  if(postError||!post){setDbReady(false);setMessage("Opslaget kunne ikke gemmes.");setBusy(false);return}
  const uploaded:string[]=[];
  for(const file of selectedFiles){const ext=extension(file.name),mime=file.type||mimeByExtension[ext],path=`school-${post.school_id}/noticeboard/${post.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;const{error:metaError}=await supabase.from("school_files").insert({school_id:post.school_id,area:"noticeboard",object_path:path,display_name:file.name,mime_type:mime,size_bytes:file.size,created_by:userId,noticeboard_post_id:post.id});if(metaError){if(uploaded.length)await supabase.storage.from("school-files").remove(uploaded);await supabase.from("noticeboard_posts").delete().eq("id",post.id);setMessage(`Opslaget blev ikke oprettet, fordi ${file.name} ikke kunne registreres sikkert.`);setBusy(false);return}const{error:uploadError}=await supabase.storage.from("school-files").upload(path,file,{contentType:mime,upsert:false});if(uploadError){await supabase.from("school_files").delete().eq("object_path",path);if(uploaded.length)await supabase.storage.from("school-files").remove(uploaded);await supabase.from("noticeboard_posts").delete().eq("id",post.id);setMessage(`Upload af ${file.name} mislykkedes. Ingen dele af opslaget blev gemt.`);setBusy(false);return}uploaded.push(path)}
  setText("");setSelectedFiles([]);setAudiences(["teacher"]);setShowComposer(false);await loadNotes();setBusy(false);
 };
 const openFile=async(file:FileRow)=>{const{data,error}=await supabase.storage.from("school-files").createSignedUrl(file.object_path,120);if(error||!data?.signedUrl){setMessage("Dokumentet kunne ikke åbnes lige nu.");return}window.open(data.signedUrl,"_blank","noopener,noreferrer")};
 const beginEdit=(n:Note)=>{setEditingId(n.id);setEditText(n.text);setEditAudiences(n.audiences||["teacher"])};
 const cancelEdit=()=>{setEditingId(null);setEditText("");setEditAudiences([])};
 const saveEdit=async()=>{if(!editingId||(!editText.trim()&&!(attachments[editingId]?.length))||editAudiences.length===0)return;setBusy(true);const{error}=await supabase.from("noticeboard_posts").update({text:editText.trim()||"Vedhæftet dokument",audiences:editAudiences}).eq("id",editingId);if(!error){cancelEdit();await loadNotes()}else setDbReady(false);setBusy(false)};
 const remove=async(id:string)=>{if(!window.confirm("Slet opslaget og dets vedhæftede dokumenter permanent?"))return;setMessage("");const paths=(attachments[id]||[]).map(x=>x.object_path);if(paths.length){const{error}=await supabase.storage.from("school-files").remove(paths);if(error){setMessage("Dokumenterne kunne ikke slettes sikkert. Opslaget er derfor bevaret.");return}}await supabase.from("noticeboard_posts").delete().eq("id",id);if(editingId===id)cancelEdit();await loadNotes()};

 const selected=new Date(selectedDate+"T12:00:00"),isToday=selectedDate===iso(new Date());
 const regularIds=useMemo(()=>new Set(scheduleTeachers.map(x=>x.schedule_entry_id)),[scheduleTeachers]);
 const weekDays=useMemo(()=>{const monday=mondayFor(selectedDate);return Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setDate(d.getDate()+i);return d})},[selectedDate]);
 const schoolMark=(date:string):({date:string;label:string;kind:"closed"|EventKind}|null)=>{const closed=closedDays.find(x=>x.date===date);if(closed)return{date,label:closed.label||"Lukket",kind:"closed"};return calendarEvents.find(x=>x.date===date)||null};
 const weekMarks=useMemo(()=>{const grouped=new Map<string,WeekMark>();for(const d of weekDays){const date=iso(d),mark=schoolMark(date);if(!mark)continue;const key=`${mark.kind}:${mark.label}`,current=grouped.get(key)||{key,kind:mark.kind,label:mark.label,dates:[]};current.dates.push(date);grouped.set(key,current)}return [...grouped.values()]},[weekDays,calendarEvents,closedDays]);
 const dayLoad=(date:Date)=>{const s=iso(date),weekday=date.getDay();const regular=allEntries.filter(e=>regularIds.has(e.id)&&e.weekday===weekday&&scheduleOccursOn(e.recurrence_pattern,s)).length;const sub=assignments.filter(a=>a.assignment_date===s&&a.substitute_teacher_id===userId&&!regularIds.has(a.schedule_entry_id)).length;const meetingCount=meetings.filter(m=>m.starts_at.slice(0,10)===s).length;return regular+sub+meetingCount};
 const moveDay=(n:number)=>{const d=new Date(selectedDate+"T12:00:00");d.setDate(d.getDate()+n);setSelectedDate(iso(d))};

 if(!ready)return <main style={{padding:50}}>Åbner Opslagstavlen…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1100,margin:"auto",display:"flex",alignItems:"center",gap:14}}><span style={{display:"grid",placeItems:"center",width:46,height:46,borderRadius:12,background:"#dfa94f",color:"#243d33",fontSize:22}}>✦</span><div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:28}}>Opslagstavlen</strong><small style={{opacity:.75}}>Det første du ser, når du møder ind</small></div></div></header>
  <section style={{maxWidth:1120,margin:"auto",padding:"28px 26px 60px"}}>
   <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12,marginBottom:18}}>
    <NoticeboardDayOverview selectedDate={selectedDate} onMoveDay={moveDay} onToday={()=>setSelectedDate(iso(new Date()))}/>
    <article style={overviewCard}><p style={eyebrow}>KALENDER</p><h2 style={overviewTitle}>Denne uge</h2><div style={{display:"grid",gridTemplateColumns:"repeat(7,minmax(30px,1fr))",gap:3,marginTop:11}}>{weekDays.map(d=>{const s=iso(d),active=s===selectedDate,count=dayLoad(d),mark=schoolMark(s);return <button key={s} title={mark?`${eventTypeLabel(mark.kind)} · ${mark.label}`:undefined} onClick={()=>setSelectedDate(s)} style={{border:active?"2px solid #486b59":"1px solid #ddd9d0",background:active?"#e7eee9":mark?.kind==="closed"?"#f5e9dc":mark?"#f0f2e6":"#faf9f6",borderRadius:8,padding:"7px 1px",cursor:"pointer",color:"#26342e",minWidth:0}}><small style={{display:"block",fontWeight:900,textTransform:"uppercase",fontSize:8}}>{d.toLocaleDateString("da-DK",{weekday:"short"}).replace(".","")}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:18,margin:"2px 0"}}>{d.getDate()}</strong><span style={{fontSize:8,color:mark?"#6e654a":"#69716c",fontWeight:mark?900:500}}>{mark?"●":count?String(count):"ro"}</span></button>})}</div>{weekMarks.length>0&&<div style={{display:"grid",gap:4,marginTop:9}}>{weekMarks.slice(0,3).map(mark=><div key={mark.key} style={{padding:"5px 7px",borderRadius:7,background:mark.kind==="closed"?"#f5e9dc":"#f0f2e6",fontSize:10,color:"#58645d"}}><strong>{eventTypeLabel(mark.kind)}</strong> · {mark.label}<span style={{color:"#7a807b"}}> · {shortDay(mark.dates[0])}{mark.dates.length>1?`–${shortDay(mark.dates.at(-1)! )}`:""}</span></div>)}{weekMarks.length>3&&<small style={{color:"#7a817c"}}>+ {weekMarks.length-3} flere markeringer</small>}</div>}<Link href={`/calendar?date=${selectedDate}`} style={cardLink}>Se hele ugen →</Link></article>
    <article style={overviewCard}><div style={{display:"flex",justifyContent:"space-between",gap:9,alignItems:"start"}}><div><p style={eyebrow}>PERSONALE</p><h2 style={overviewTitle}>Fravær</h2></div>{isAdmin&&<Link href="/admin/absence/staff" style={{...cardLink,marginTop:0,fontSize:11}}>Administrér →</Link>}</div>{staffAbsent.length===0?<div style={okBox}>✓ Ingen registreret fravær</div>:<div style={{display:"grid",gap:6,marginTop:10}}>{staffAbsent.slice(0,6).map(person=><div key={person.user_id} style={{display:"flex",gap:8,alignItems:"center",padding:"7px 9px",borderRadius:8,background:"#f7f3ed"}}><span aria-hidden="true" style={{width:28,height:28,borderRadius:999,display:"grid",placeItems:"center",background:"#e9dfd2",fontWeight:900,fontSize:11}}>{person.initials||person.display_name.slice(0,2).toUpperCase()}</span><strong style={{fontSize:13}}>{person.display_name}</strong></div>)}{staffAbsent.length>6&&<small>+ {staffAbsent.length-6} flere</small>}</div>}<p style={{fontSize:11,color:"#7a817c",lineHeight:1.4,margin:"10px 0 0"}}>Her vises kun, hvem der er fraværende – ikke årsagen.</p></article>
   </section>
   <MeetingActionInbox/>
   {message&&<div style={{marginBottom:14,padding:12,background:"#fff3cd",borderRadius:9,color:"#715827",fontWeight:800}}>{message}</div>}
   {!dbReady&&<div style={{marginBottom:14,padding:12,background:"#fff3cd",borderRadius:9}}>Opslagstavlen kunne ikke hente databasen.</div>}
   <section style={{marginTop:24}}><div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:12,marginBottom:12}}><button onClick={()=>setShowComposer(v=>!v)} style={newPostButton}>{showComposer?"Luk":"+ Nyt opslag"}</button></div>
    {showComposer&&<div style={composer}><textarea autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="Skriv dit opslag – eller vedhæft et dokument…" maxLength={2000} style={{width:"100%",minHeight:90,padding:12,border:"1px solid #d8d5cd",borderRadius:8,boxSizing:"border-box",fontSize:15}}/><div style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) minmax(240px,1fr)",gap:16,marginTop:12}}><div><strong style={{fontSize:13}}>Hvem skal se opslaget?</strong><div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:8}}>{audienceOptions.map(a=><label key={a.id} style={{display:"flex",gap:6,alignItems:"center",padding:"7px 9px",border:"1px solid #d8d5cd",borderRadius:8,background:audiences.includes(a.id)?"#e7eee9":"#fff",cursor:"pointer",fontSize:12}}><input type="checkbox" checked={audiences.includes(a.id)} onChange={()=>toggleAudience(a.id)}/>{a.label}</label>)}</div></div><div><strong style={{fontSize:13}}>Vedhæft dokumenter <span style={{fontWeight:500}}>(valgfrit)</span></strong><label style={{display:"block",marginTop:8,padding:"10px 11px",border:"1px dashed #aeb7af",borderRadius:8,background:"#faf9f6",cursor:"pointer",fontSize:12}}><input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp" onChange={e=>chooseFiles(e.target.files)} style={{display:"none"}}/>📎 Vælg Word, PDF, Office eller billeder · maks. 5 filer</label>{selectedFiles.length>0&&<div style={{display:"grid",gap:4,marginTop:7}}>{selectedFiles.map(f=><span key={`${f.name}-${f.size}`} style={{fontSize:11,color:"#59655e"}}>• {f.name} · {fileSize(f.size)}</span>)}</div>}</div></div><div style={{display:"flex",justifyContent:"flex-end"}}><button onClick={add} disabled={(!text.trim()&&!selectedFiles.length)||busy||!dbReady||audiences.length===0} style={{...postButton,opacity:((!text.trim()&&!selectedFiles.length)||busy||audiences.length===0)?0.5:1}}>{busy?"Gemmer sikkert…":"Sæt på opslagstavlen"}</button></div></div>}
    <div style={corkboard}>{notes.length===0?<div style={{padding:16,background:"#fff2a8",width:190,minHeight:150}}>Der er ingen opslag endnu.</div>:<div style={{display:"flex",flexWrap:"wrap",gap:22,alignItems:"flex-start"}}>{notes.map((n,i)=>{const manage=n.author_id===userId||isAdmin,editing=editingId===n.id,files=attachments[n.id]||[];return <article key={n.id} style={{background:noteColors[i%noteColors.length],padding:"18px 16px 14px",width:225,minHeight:190,boxSizing:"border-box",position:"relative",boxShadow:"2px 5px 10px rgba(50,35,20,.24)",transform:editing?"none":`rotate(${[-1.4,.8,-.5,1.2][i%4]}deg)`,display:"flex",flexDirection:"column"}}>{editing?<><textarea value={editText} onChange={e=>setEditText(e.target.value)} maxLength={2000} style={{width:"100%",minHeight:85,boxSizing:"border-box",padding:8,resize:"vertical"}}/><small style={{fontWeight:900,marginTop:8}}>Målgruppe</small><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>{audienceOptions.map(a=><label key={a.id} style={{fontSize:10,display:"flex",gap:3,alignItems:"center"}}><input type="checkbox" checked={editAudiences.includes(a.id)} onChange={()=>toggleEditAudience(a.id)}/>{a.label}</label>)}</div><div style={{display:"flex",gap:6,marginTop:10}}><button onClick={saveEdit} disabled={busy||(!editText.trim()&&!files.length)||editAudiences.length===0} style={smallAction}>Gem</button><button onClick={cancelEdit} style={smallAction}>Annuller</button></div></>:<><p style={{margin:"0 0 10px",fontSize:15,lineHeight:1.4,whiteSpace:"pre-wrap",flex:files.length?"0 0 auto":1}}>{n.text}</p>{files.length>0&&<div style={{display:"grid",gap:5,margin:"2px 0 12px"}}>{files.map(file=><button key={file.id} onClick={()=>openFile(file)} style={{border:"1px solid rgba(55,70,60,.2)",background:"rgba(255,255,255,.5)",borderRadius:7,padding:"7px 8px",textAlign:"left",cursor:"pointer",color:"#31473d"}}><strong style={{display:"block",fontSize:11,overflow:"hidden",textOverflow:"ellipsis"}}>📎 {file.display_name}</strong>{file.size_bytes!==null&&<small>{fileSize(file.size_bytes)}</small>}</button>)}</div>}<small style={{borderTop:"1px solid rgba(50,50,40,.16)",paddingTop:7,color:"#62645d",fontSize:11,marginTop:"auto"}}>{n.author_email.split("@")[0]} · {new Date(n.created_at).toLocaleString("da-DK")}</small>{manage&&<div style={{display:"flex",gap:6,marginTop:8}}><button onClick={()=>beginEdit(n)} style={smallAction}>Redigér</button><button onClick={()=>remove(n.id)} style={{...smallAction,color:"#7b342d"}}>Slet</button></div>}</>}</article>})}</div>}</div>
   </section>
  </section>
 </main>;
}
const overviewCard:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:"16px 17px",minHeight:170,display:"flex",flexDirection:"column"};
const overviewTitle:React.CSSProperties={fontFamily:"Georgia,serif",margin:"4px 0 0",fontSize:23};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:0,textTransform:"uppercase"};
const okBox:React.CSSProperties={marginTop:11,padding:"10px 11px",background:"#e7eee9",borderRadius:9,color:"#456052",fontSize:13,fontWeight:850};
const cardLink:React.CSSProperties={display:"inline-block",marginTop:"auto",paddingTop:11,color:"#365044",fontWeight:850,textDecoration:"none",fontSize:12};
const newPostButton:React.CSSProperties={padding:"10px 15px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const composer:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:16,marginBottom:14};
const postButton:React.CSSProperties={marginTop:12,padding:"10px 15px",border:0,borderRadius:8,background:"#dfa94f",color:"#243d33",fontWeight:900,cursor:"pointer"};
const corkboard:React.CSSProperties={background:"#b98552",backgroundImage:"radial-gradient(rgba(84,50,25,.15) 1px, transparent 1px)",backgroundSize:"7px 7px",border:"10px solid #8b5e34",borderRadius:12,padding:"24px",minHeight:230};
const smallAction:React.CSSProperties={border:"1px solid rgba(60,60,50,.25)",borderRadius:6,padding:"5px 7px",background:"rgba(255,255,255,.55)",fontSize:10,fontWeight:900,cursor:"pointer",color:"#3d4a43"};
