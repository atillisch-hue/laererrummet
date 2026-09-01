"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";
import MeetingActionInbox from "../MeetingActionInbox";

type Audience="teacher"|"parent"|"board"|"admin"|"student";
type Note={id:string;text:string;author_email:string;author_id:string;created_at:string;audiences:Audience[]};
type Entry={id:number;class_id:number;weekday:number;start_time:string;end_time:string;subject:string;room:string|null};
type Klass={id:number;name:string};
type Profile={user_id:string;initials:string|null};
type Assignment={id:number;schedule_entry_id:number;assignment_date:string;absent_teacher_id:string;substitute_teacher_id:string;substitute_plan:string|null};
type ScheduleItem={entry:Entry;substitute:boolean;absentId:string;assignment?:Assignment};

const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const noteColors=["#fff2a8","#f8d7c4","#dcefcf","#dce8f7","#f1d9ee"];
const audienceOptions:{id:Audience;label:string}[]=[
 {id:"teacher",label:"Lærere"},{id:"student",label:"Elever"},{id:"parent",label:"Forældre"},{id:"board",label:"Bestyrelse"},{id:"admin",label:"Admin"}
];

export default function Noticeboard(){
 const[ready,setReady]=useState(false);
 const[email,setEmail]=useState("");
 const[userId,setUserId]=useState("");
 const[isAdmin,setIsAdmin]=useState(false);
 const[text,setText]=useState("");
 const[notes,setNotes]=useState<Note[]>([]);
 const[dbReady,setDbReady]=useState(true);
 const[busy,setBusy]=useState(false);
 const[allEntries,setAllEntries]=useState<Entry[]>([]);
 const[assignments,setAssignments]=useState<Assignment[]>([]);
 const[classes,setClasses]=useState<Klass[]>([]);
 const[profiles,setProfiles]=useState<Profile[]>([]);
 const[selectedDate,setSelectedDate]=useState(()=>iso(new Date()));
 const[showComposer,setShowComposer]=useState(false);
 const[audiences,setAudiences]=useState<Audience[]>(["teacher"]);
 const[planDrafts,setPlanDrafts]=useState<Record<number,string>>({});
 const[savingPlan,setSavingPlan]=useState<number|null>(null);
 const[editingId,setEditingId]=useState<string|null>(null);
 const[editText,setEditText]=useState("");
 const[editAudiences,setEditAudiences]=useState<Audience[]>([]);

 const loadNotes=async()=>{
  const{data,error}=await supabase.from("noticeboard_posts").select("id,text,author_email,author_id,created_at,audiences").contains("audiences",["teacher"]).order("created_at",{ascending:false});
  if(error){setDbReady(false);return}
  setDbReady(true);setNotes((data||[]) as Note[]);
 };
 const loadAssignments=async()=>{
  const{data}=await supabase.from("substitute_assignments").select("id,schedule_entry_id,assignment_date,absent_teacher_id,substitute_teacher_id,substitute_plan");
  setAssignments((data||[]) as Assignment[]);
 };

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();
  if(!data.session){location.href="/?teacher=1";return}
  const user=data.session.user;
  setEmail(user.email||"");setUserId(user.id);setIsAdmin(hasRole(user,"admin"));
  const[eRes,cRes,pRes,aRes]=await Promise.all([
   supabase.from("schedule_entries").select("id,class_id,weekday,start_time,end_time,subject,room"),
   supabase.from("classes").select("id,name"),
   supabase.from("user_profiles").select("user_id,initials"),
   supabase.from("substitute_assignments").select("id,schedule_entry_id,assignment_date,absent_teacher_id,substitute_teacher_id,substitute_plan")
  ]);
  setAllEntries((eRes.data||[]) as Entry[]);setClasses((cRes.data||[]) as Klass[]);setProfiles((pRes.data||[]) as Profile[]);setAssignments((aRes.data||[]) as Assignment[]);
  await loadNotes();setReady(true);
 })()},[]);

 const toggleAudience=(a:Audience)=>setAudiences(v=>v.includes(a)?v.filter(x=>x!==a):[...v,a]);
 const toggleEditAudience=(a:Audience)=>setEditAudiences(v=>v.includes(a)?v.filter(x=>x!==a):[...v,a]);
 const add=async()=>{
  if(!text.trim()||!userId||audiences.length===0)return;
  setBusy(true);
  const{error}=await supabase.from("noticeboard_posts").insert({text:text.trim(),author_email:email,author_id:userId,audiences});
  if(!error){setText("");setAudiences(["teacher"]);setShowComposer(false);await loadNotes()}else setDbReady(false);
  setBusy(false);
 };
 const beginEdit=(n:Note)=>{setEditingId(n.id);setEditText(n.text);setEditAudiences(n.audiences||["teacher"])};
 const cancelEdit=()=>{setEditingId(null);setEditText("");setEditAudiences([])};
 const saveEdit=async()=>{
  if(!editingId||!editText.trim()||editAudiences.length===0)return;
  setBusy(true);
  const{error}=await supabase.from("noticeboard_posts").update({text:editText.trim(),audiences:editAudiences}).eq("id",editingId);
  if(!error){cancelEdit();await loadNotes()}else setDbReady(false);
  setBusy(false);
 };
 const remove=async(id:string)=>{if(!window.confirm("Slet opslaget permanent?"))return;await supabase.from("noticeboard_posts").delete().eq("id",id);if(editingId===id)cancelEdit();await loadNotes()};
 const savePlan=async(a:Assignment)=>{
  setSavingPlan(a.id);
  const value=(planDrafts[a.id]??a.substitute_plan??"").trim();
  const{error}=await supabase.from("substitute_assignments").update({substitute_plan:value||null}).eq("id",a.id).eq("absent_teacher_id",userId);
  if(!error)await loadAssignments();setSavingPlan(null);
 };

 const className=(id:number)=>classes.find(c=>c.id===id)?.name||"Klasse";
 const teacherName=(id:string)=>profiles.find(p=>p.user_id===id)?.initials?.trim()?.toUpperCase()||"kollega";
 const selected=new Date(selectedDate+"T12:00:00");
 const isToday=selectedDate===iso(new Date());
 const absentSelected:ScheduleItem[]=assignments.filter(a=>a.assignment_date===selectedDate&&a.absent_teacher_id===userId).map(a=>({entry:allEntries.find(e=>e.id===a.schedule_entry_id),substitute:false,absentId:a.absent_teacher_id,assignment:a})).filter(x=>x.entry) as ScheduleItem[];
 const substituteSelected:ScheduleItem[]=assignments.filter(a=>a.assignment_date===selectedDate&&a.substitute_teacher_id===userId).map(a=>({entry:allEntries.find(e=>e.id===a.schedule_entry_id),substitute:true,absentId:a.absent_teacher_id,assignment:a})).filter(x=>x.entry) as ScheduleItem[];
 const selectedItems=[...absentSelected,...substituteSelected].sort((a,b)=>a.entry.start_time.localeCompare(b.entry.start_time));
 const moveDay=(n:number)=>{const d=new Date(selectedDate+"T12:00:00");d.setDate(d.getDate()+n);setSelectedDate(iso(d))};
 const selectedLabel=selected.toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long"});

 if(!ready)return <main style={{padding:50}}>Åbner Opslagstavlen…</main>;

 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}>
   <div style={{maxWidth:1100,margin:"auto",display:"flex",alignItems:"center",gap:14}}>
    <span style={{display:"grid",placeItems:"center",width:46,height:46,borderRadius:12,background:"#dfa94f",color:"#243d33",fontSize:22}}>✦</span>
    <div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:28}}>Opslagstavlen</strong><small style={{opacity:.75}}>Det første du ser, når du møder ind</small></div>
   </div>
  </header>

  <section style={{maxWidth:1000,margin:"auto",padding:"32px 26px 60px"}}>
   <section style={{background:"white",border:"1px solid #ddd9d0",borderRadius:16,padding:"20px 22px",marginBottom:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}}>
     <div><p style={{fontSize:11,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0,textTransform:"uppercase"}}>{isToday?"I DAG · ":""}{selectedLabel}</p><h2 style={{fontFamily:"Georgia,serif",margin:"5px 0 0",fontSize:27}}>Dagens overblik</h2></div>
     <div style={{display:"flex",gap:7}}><button onClick={()=>moveDay(-1)}>←</button>{!isToday&&<button onClick={()=>setSelectedDate(iso(new Date()))}>I dag</button>}<button onClick={()=>moveDay(1)}>→</button></div>
    </div>
    {selectedItems.length===0?<div style={{marginTop:15,padding:"13px 15px",background:"#e7eee9",borderRadius:10,color:"#456052"}}><strong>✓ Ingen ændringer {isToday?"i dag":"denne dag"}</strong></div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:10,marginTop:15}}>
     {selectedItems.map((item,i)=>{const x=item.entry,a=item.assignment;return <article key={`${item.substitute?"v":"f"}-${x.id}-${i}`} style={{background:item.substitute?"#e7eee9":"#f3e8d8",border:"1px solid #d2b88e",borderRadius:10,padding:14}}><strong>{item.substitute?"VIKARTIME":"FRAVÆR"} · {x.start_time.slice(0,5)}–{x.end_time.slice(0,5)}</strong><div style={{fontFamily:"Georgia,serif",fontSize:19,marginTop:4}}>{x.subject}</div><small>{className(x.class_id)}{item.substitute?` · for ${teacherName(item.absentId)}`:""}</small>{item.substitute&&a?.substitute_plan&&<div style={{marginTop:9,padding:9,background:"rgba(255,255,255,.7)",borderRadius:7}}><strong>Vikarplan</strong><div>{a.substitute_plan}</div></div>}{!item.substitute&&a&&<div style={{marginTop:9}}><textarea value={planDrafts[a.id]??a.substitute_plan??""} onChange={e=>setPlanDrafts(v=>({...v,[a.id]:e.target.value}))} placeholder="Vikarplan…" style={{width:"100%",boxSizing:"border-box",minHeight:70}}/><button onClick={()=>savePlan(a)} disabled={savingPlan===a.id}>{savingPlan===a.id?"Gemmer…":"Gem vikarplan"}</button></div>}</article>})}
    </div>}
    <div style={{marginTop:15}}><Link href="/calendar" style={{color:"#365044",fontWeight:800,textDecoration:"none"}}>Åbn hele arbejdsdagen i Kalender →</Link></div>
   </section>

   <MeetingActionInbox/>

   {!dbReady&&<div style={{marginTop:18,padding:14,background:"#fff3cd",borderRadius:10}}>Opslagstavlen kunne ikke hente databasen.</div>}

   <section style={{marginTop:30}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:12,marginBottom:12}}><button onClick={()=>setShowComposer(v=>!v)} style={{padding:"10px 15px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"}}>{showComposer?"Luk":"+ Nyt opslag"}</button></div>
    {showComposer&&<div style={{background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:16,marginBottom:14}}><textarea autoFocus value={text} onChange={e=>setText(e.target.value)} placeholder="Skriv dit opslag…" maxLength={2000} style={{width:"100%",minHeight:100,padding:12,border:"1px solid #d8d5cd",borderRadius:8,boxSizing:"border-box",fontSize:15}}/><div style={{marginTop:12}}><strong style={{fontSize:13}}>Hvem skal se opslaget?</strong><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>{audienceOptions.map(a=><label key={a.id} style={{display:"flex",gap:6,alignItems:"center",padding:"8px 10px",border:"1px solid #d8d5cd",borderRadius:8,background:audiences.includes(a.id)?"#e7eee9":"#fff",cursor:"pointer"}}><input type="checkbox" checked={audiences.includes(a.id)} onChange={()=>toggleAudience(a.id)}/>{a.label}</label>)}</div></div><div style={{display:"flex",justifyContent:"flex-end"}}><button onClick={add} disabled={!text.trim()||busy||!dbReady||audiences.length===0} style={{marginTop:12,padding:"10px 15px",border:0,borderRadius:8,background:"#dfa94f",color:"#243d33",fontWeight:900}}>{busy?"Sætter op…":"Sæt på opslagstavlen"}</button></div></div>}
    <div style={{background:"#b98552",backgroundImage:"radial-gradient(rgba(84,50,25,.15) 1px, transparent 1px)",backgroundSize:"7px 7px",border:"10px solid #8b5e34",borderRadius:12,padding:"24px",minHeight:230}}>{notes.length===0?<div style={{padding:16,background:"#fff2a8",width:190,minHeight:190}}>Der er ingen opslag endnu.</div>:<div style={{display:"flex",flexWrap:"wrap",gap:22,alignItems:"flex-start"}}>{notes.map((n,i)=>{const manage=n.author_id===userId||isAdmin,editing=editingId===n.id;return <article key={n.id} style={{background:noteColors[i%noteColors.length],padding:"18px 16px 14px",width:210,minHeight:190,boxSizing:"border-box",position:"relative",boxShadow:"2px 5px 10px rgba(50,35,20,.24)",transform:editing?"none":`rotate(${[-1.4,.8,-.5,1.2][i%4]}deg)`,display:"flex",flexDirection:"column"}}>{editing?<><textarea value={editText} onChange={e=>setEditText(e.target.value)} maxLength={2000} style={{width:"100%",minHeight:100,boxSizing:"border-box",padding:8,resize:"vertical"}}/><small style={{fontWeight:900,marginTop:8}}>Målgruppe</small><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:5}}>{audienceOptions.map(a=><label key={a.id} style={{fontSize:10,display:"flex",gap:3,alignItems:"center"}}><input type="checkbox" checked={editAudiences.includes(a.id)} onChange={()=>toggleEditAudience(a.id)}/>{a.label}</label>)}</div><div style={{display:"flex",gap:6,marginTop:10}}><button onClick={saveEdit} disabled={busy||!editText.trim()||editAudiences.length===0} style={smallAction}>Gem</button><button onClick={cancelEdit} style={smallAction}>Annuller</button></div></>:<><p style={{margin:"0 0 12px",fontSize:15,lineHeight:1.4,whiteSpace:"pre-wrap",flex:1}}>{n.text}</p><small style={{borderTop:"1px solid rgba(50,50,40,.16)",paddingTop:7,color:"#62645d",fontSize:11}}>{n.author_email.split("@")[0]} · {new Date(n.created_at).toLocaleString("da-DK")}</small>{manage&&<div style={{display:"flex",gap:6,marginTop:8}}><button onClick={()=>beginEdit(n)} style={smallAction}>Redigér</button><button onClick={()=>remove(n.id)} style={{...smallAction,color:"#7b342d"}}>Slet</button></div>}</>}</article>})}</div>}</div>
   </section>
  </section>
 </main>;
}

const smallAction:React.CSSProperties={border:"1px solid rgba(60,60,50,.25)",borderRadius:6,padding:"5px 7px",background:"rgba(255,255,255,.55)",fontSize:10,fontWeight:900,cursor:"pointer",color:"#3d4a43"};
