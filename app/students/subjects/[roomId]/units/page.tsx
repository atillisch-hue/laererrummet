"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {supabase} from "../../../../../lib/supabase";
import {hasRole} from "../../../../../lib/roles";

type Room={id:number;class_id:number;subject_id:number;title:string|null};
type Unit={id:number;title:string;driving_question:string|null;summary:string|null;learning_goals:string[];start_date:string|null;end_date:string|null;status:"planned"|"active"|"completed"|"archived";visible_to_students:boolean;visible_to_guardians:boolean;position:number};
type Assignment={id:number;title:string;type:string};
type LinkRow={subject_unit_id:number;assignment_id:number;position:number};
type Form={title:string;question:string;summary:string;goals:string;start:string;end:string;status:Unit["status"];students:boolean;guardians:boolean};
const blank:Form={title:"",question:"",summary:"",goals:"",start:"",end:"",status:"planned",students:false,guardians:false};
const statuses:Record<Unit["status"],string>={planned:"Planlagt",active:"I gang",completed:"Afsluttet",archived:"Arkiveret"};

export default function UnitsPage(){
 const roomId=Number(useParams<{roomId:string}>().roomId);
 const[ready,setReady]=useState(false),[room,setRoom]=useState<Room|null>(null),[className,setClassName]=useState(""),[subjectName,setSubjectName]=useState(""),[units,setUnits]=useState<Unit[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[links,setLinks]=useState<LinkRow[]>([]),[canEdit,setCanEdit]=useState(false),[form,setForm]=useState<Form>(blank),[editing,setEditing]=useState<number|null>(null),[showForm,setShowForm]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState("");

 async function load(){
  const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user){location.replace("/?teacher=1");return}
  const[r,u,a,t]=await Promise.all([
   supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("id",roomId).eq("active",true).maybeSingle(),
   supabase.from("subject_units").select("id,title,driving_question,summary,learning_goals,start_date,end_date,status,visible_to_students,visible_to_guardians,position").eq("class_subject_id",roomId).order("start_date",{ascending:true,nullsFirst:false}).order("position"),
   supabase.from("assignments").select("id,title,type").eq("class_subject_id",roomId).order("id",{ascending:false}),
   supabase.from("class_subject_teachers").select("user_id").eq("class_subject_id",roomId).eq("user_id",user.id).maybeSingle()
  ]);
  if(r.error||!r.data){setMessage("Du har ikke adgang til faglokalet.");setReady(true);return}
  const rr=r.data as Room,uu=(u.data||[]) as Unit[];
  const[c,s,l]=await Promise.all([
   supabase.from("classes").select("name").eq("id",rr.class_id).maybeSingle(),
   supabase.from("subjects").select("name").eq("id",rr.subject_id).maybeSingle(),
   uu.length?supabase.from("subject_unit_assignments").select("subject_unit_id,assignment_id,position").in("subject_unit_id",uu.map(x=>x.id)):Promise.resolve({data:[]})
  ]);
  setRoom(rr);setUnits(uu);setAssignments((a.data||[]) as Assignment[]);setLinks((l.data||[]) as LinkRow[]);setClassName(String(c.data?.name||""));setSubjectName(String(s.data?.name||""));setCanEdit(hasRole(user,"admin")||!!t.data);setReady(true);
 }
 useEffect(()=>{if(Number.isFinite(roomId)&&roomId>0)load();else{setMessage("Faglokalet er ugyldigt.");setReady(true)}},[roomId]);

 function begin(unit?:Unit){if(unit){setEditing(unit.id);setForm({title:unit.title,question:unit.driving_question||"",summary:unit.summary||"",goals:(unit.learning_goals||[]).join("\n"),start:unit.start_date||"",end:unit.end_date||"",status:unit.status,students:unit.visible_to_students,guardians:unit.visible_to_guardians})}else{setEditing(null);setForm(blank)}setShowForm(true);setMessage("")}
 function cancel(){setShowForm(false);setEditing(null);setForm(blank)}
 async function save(){
  if(!canEdit||!form.title.trim()||saving)return;if(form.start&&form.end&&form.end<form.start){setMessage("Slutdato kan ikke ligge før startdato.");return}
  setSaving(true);setMessage("");const payload={class_subject_id:roomId,title:form.title.trim(),driving_question:form.question.trim()||null,summary:form.summary.trim()||null,learning_goals:form.goals.split("\n").map(x=>x.trim()).filter(Boolean),start_date:form.start||null,end_date:form.end||null,status:form.status,visible_to_students:form.students,visible_to_guardians:form.guardians,position:editing?units.find(x=>x.id===editing)?.position||0:units.length};
  const res=editing?await supabase.from("subject_units").update(payload).eq("id",editing):await supabase.from("subject_units").insert(payload);setSaving(false);
  if(res.error){setMessage(res.error.message);return}cancel();setMessage("Forløbet er gemt ✓");await load();
 }
 async function remove(unit:Unit){if(!canEdit||!confirm(`Slet forløbet “${unit.title}”? Opgaverne bevares.`))return;const{error}=await supabase.from("subject_units").delete().eq("id",unit.id);if(error)setMessage(error.message);else{setMessage("Forløbet er slettet.");await load()}}
 async function attach(unitId:number,assignmentId:number){if(!assignmentId)return;const{error}=await supabase.from("subject_unit_assignments").insert({subject_unit_id:unitId,assignment_id:assignmentId,position:links.filter(x=>x.subject_unit_id===unitId).length});if(error)setMessage(error.message);else await load()}
 async function detach(unitId:number,assignmentId:number){const{error}=await supabase.from("subject_unit_assignments").delete().eq("subject_unit_id",unitId).eq("assignment_id",assignmentId);if(error)setMessage(error.message);else await load()}

 if(!ready)return <main style={{padding:50}}>Åbner forløb…</main>;
 if(!room)return <main style={{padding:50}}><h1>Forløb kunne ikke åbnes</h1><p>{message}</p></main>;
 const shown=units.filter(x=>x.status!=="archived"),archived=units.filter(x=>x.status==="archived");
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1080,margin:"auto"}}><Link href={`/students/subjects/${room.id}`} style={{color:"#e7ddd0",fontWeight:850,textDecoration:"none"}}>← {room.title||subjectName||"Faglokalet"}</Link><p style={{fontSize:11,fontWeight:900,letterSpacing:1.3,opacity:.68,margin:"18px 0 0"}}>{className.toUpperCase()} · {subjectName.toUpperCase()}</p><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"5px 0"}}>Forløb & årsplan</h1><p style={{margin:0,opacity:.8,maxWidth:760,lineHeight:1.5}}>Planlæg forløbene én gang. Årsplanen er tidslinjen over de samme levende forløb — med mål og opgaver samlet samme sted.</p></div></header>
  <section style={{maxWidth:1080,margin:"auto",padding:"26px 24px 80px"}}>
   {message&&<div style={{padding:"10px 12px",borderRadius:9,marginBottom:12,background:message.includes("✓")?"#e6eee8":"#fff3cd"}}>{message}</div>}
   <section style={{...card,display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap",background:"#eef2ed"}}><div><small style={eyebrow}>ÅRSPLAN SOM ARBEJDSFLADE</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:22,marginTop:4}}>{shown.length} aktive/planlagte forløb</strong><span style={muted}>Datoer er valgfrie. Et forløb kan godt leve uden en fast periode.</span></div>{canEdit&&<button onClick={()=>begin()} style={primary}>+ Nyt forløb</button>}</section>

   {showForm&&canEdit&&<section style={{...card,marginTop:14}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><div><small style={eyebrow}>{editing?"REDIGÉR":"NYT FORLØB"}</small><h2 style={{fontFamily:"Georgia,serif",margin:"4px 0"}}>{editing?"Opdatér forløbet":"Byg forløbet"}</h2></div><button onClick={cancel} style={secondary}>Luk</button></div><div style={grid}><Field label="Titel"><input value={form.title} onChange={e=>setForm(x=>({...x,title:e.target.value}))} style={input} placeholder="Fx Er du ægte?"/></Field><Field label="Styrende spørgsmål"><input value={form.question} onChange={e=>setForm(x=>({...x,question:e.target.value}))} style={input} placeholder="Fx Hvad gør et menneske ægte?"/></Field><Field label="Startdato"><input type="date" value={form.start} onChange={e=>setForm(x=>({...x,start:e.target.value}))} style={input}/></Field><Field label="Slutdato"><input type="date" value={form.end} onChange={e=>setForm(x=>({...x,end:e.target.value}))} style={input}/></Field><Field label="Status"><select value={form.status} onChange={e=>setForm(x=>({...x,status:e.target.value as Unit["status"]}))} style={input}>{Object.entries(statuses).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field></div><Field label="Kort beskrivelse"><textarea rows={4} value={form.summary} onChange={e=>setForm(x=>({...x,summary:e.target.value}))} style={input}/></Field><Field label="Læringsmål — ét pr. linje"><textarea rows={5} value={form.goals} onChange={e=>setForm(x=>({...x,goals:e.target.value}))} style={input}/></Field><div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:12}}><label style={check}><input type="checkbox" checked={form.students} onChange={e=>setForm(x=>({...x,students:e.target.checked}))}/> Må vises til elever</label><label style={check}><input type="checkbox" checked={form.guardians} onChange={e=>setForm(x=>({...x,guardians:e.target.checked}))}/> Må vises til forældre</label></div><small style={{...muted,display:"block",marginTop:6}}>Synlighedsvalgene gemmes nu; portalvisningen kobles på bagefter.</small><button disabled={saving||!form.title.trim()} onClick={save} style={{...primary,marginTop:14,opacity:(saving||!form.title.trim())?.55:1}}>{saving?"Gemmer…":"Gem forløb"}</button></section>}

   <div style={{display:"grid",gap:14,marginTop:15}}>{shown.length?shown.map(u=><UnitCard key={u.id} unit={u} assignments={assignments} links={links} canEdit={canEdit} edit={()=>begin(u)} remove={()=>remove(u)} attach={id=>attach(u.id,id)} detach={id=>detach(u.id,id)}/>):<section style={card}><h2 style={{fontFamily:"Georgia,serif",margin:"0 0 6px"}}>Årsplanen er tom endnu</h2><p style={muted}>Opret det første forløb — kort eller langt. Det kan ændres undervejs.</p></section>}</div>
   {archived.length>0&&<details style={{marginTop:22}}><summary style={{cursor:"pointer",fontWeight:900}}>Arkiverede forløb ({archived.length})</summary><div style={{display:"grid",gap:12,marginTop:10}}>{archived.map(u=><UnitCard key={u.id} unit={u} assignments={assignments} links={links} canEdit={canEdit} edit={()=>begin(u)} remove={()=>remove(u)} attach={id=>attach(u.id,id)} detach={id=>detach(u.id,id)}/>)}</div></details>}
  </section>
 </main>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label style={{display:"block",fontSize:12,fontWeight:900,color:"#53645b",marginTop:10}}>{label}{children}</label>}
function UnitCard({unit,assignments,links,canEdit,edit,remove,attach,detach}:{unit:Unit;assignments:Assignment[];links:LinkRow[];canEdit:boolean;edit:()=>void;remove:()=>void;attach:(id:number)=>void;detach:(id:number)=>void}){
 const linkRows=links.filter(x=>x.subject_unit_id===unit.id).sort((a,b)=>a.position-b.position),linked=linkRows.map(x=>assignments.find(a=>a.id===x.assignment_id)).filter(Boolean) as Assignment[],available=assignments.filter(a=>!linkRows.some(x=>x.assignment_id===a.id));
 const period=unit.start_date||unit.end_date?`${unit.start_date?date(unit.start_date):"?"} → ${unit.end_date?date(unit.end_date):"?"}`:"Ingen fast periode";
 return <article style={{...card,borderLeft:unit.status==="active"?"5px solid #486b59":"1px solid #ddd9d0"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Tag>{statuses[unit.status]}</Tag><Tag>{period}</Tag>{unit.visible_to_students&&<Tag>Elev</Tag>}{unit.visible_to_guardians&&<Tag>Forælder</Tag>}</div><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"8px 0 3px"}}>{unit.title}</h2>{unit.driving_question&&<p style={{fontWeight:850,color:"#4d6257",margin:"6px 0"}}>“{unit.driving_question}”</p>}{unit.summary&&<p style={{...muted,maxWidth:760}}>{unit.summary}</p>}</div>{canEdit&&<div style={{display:"flex",gap:7}}><button onClick={edit} style={secondary}>Redigér</button><button onClick={remove} style={danger}>Slet</button></div>}</div>{unit.learning_goals.length>0&&<div style={{marginTop:12}}><small style={eyebrow}>MÅL</small><ul style={{margin:"5px 0 0",paddingLeft:20,lineHeight:1.55}}>{unit.learning_goals.map((x,i)=><li key={i}>{x}</li>)}</ul></div>}<div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #e3dfd7"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><strong>{linked.length?`${linked.length} opgave${linked.length===1?"":"r"} i forløbet`:"Ingen opgaver koblet endnu"}</strong>{canEdit&&available.length>0&&<select defaultValue="" onChange={e=>{const id=Number(e.target.value);if(id)attach(id);e.currentTarget.value=""}} style={{...input,width:"auto",minWidth:220,marginTop:0}}><option value="">+ Kobl opgave…</option>{available.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select>}</div>{linked.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center",marginTop:7,padding:"8px 10px",background:"#faf9f6",borderRadius:8,border:"1px solid #e5e1d8"}}><span><strong>{a.title}</strong><small style={{display:"block",color:"#777"}}>{a.type}</small></span>{canEdit&&<button onClick={()=>detach(a.id)} style={mini}>Fjern kobling</button>}</div>)}</div></article>;
}
function Tag({children}:{children:React.ReactNode}){return <span style={{fontSize:10,fontWeight:900,padding:"4px 7px",borderRadius:999,background:"#e7ece7",color:"#526359"}}>{children}</span>}
function date(v:string){return new Date(`${v}T12:00:00`).toLocaleDateString("da-DK",{day:"numeric",month:"short"})}
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:18};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10};
const input:React.CSSProperties={boxSizing:"border-box",display:"block",width:"100%",marginTop:5,padding:"9px 10px",border:"1px solid #d5d1c7",borderRadius:8,background:"white",font:"inherit"};
const primary:React.CSSProperties={padding:"9px 12px",border:0,borderRadius:8,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={padding:"7px 9px",border:"1px solid #d5d1c7",borderRadius:8,background:"white",color:"#526159",fontWeight:850,cursor:"pointer"};
const danger:React.CSSProperties={...secondary,border:"1px solid #dfb8b2",background:"#fff3ef",color:"#8a3c34"};
const mini:React.CSSProperties={...secondary,padding:"5px 7px",fontSize:11};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.1,color:"#718077"};
const muted:React.CSSProperties={fontSize:12,color:"#6b756f",lineHeight:1.5,margin:"6px 0 0"};
const check:React.CSSProperties={display:"flex",gap:7,alignItems:"center",fontWeight:800,fontSize:13};
