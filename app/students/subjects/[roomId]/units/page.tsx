"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {supabase} from "../../../../../lib/supabase";
import {hasRole} from "../../../../../lib/roles";

type Room={id:number;class_id:number;subject_id:number;title:string|null};
type Klass={id:number;name:string};
type Subject={id:number;name:string};
type Unit={id:number;class_subject_id:number;title:string;driving_question:string|null;summary:string|null;learning_goals:string[];start_date:string|null;end_date:string|null;status:"planned"|"active"|"completed"|"archived";visible_to_students:boolean;visible_to_guardians:boolean;position:number};
type Assignment={id:number;title:string;type:string};
type UnitAssignment={subject_unit_id:number;assignment_id:number;position:number};

type FormState={title:string;drivingQuestion:string;summary:string;goals:string;startDate:string;endDate:string;status:Unit["status"];visibleStudents:boolean;visibleGuardians:boolean};
const emptyForm:FormState={title:"",drivingQuestion:"",summary:"",goals:"",startDate:"",endDate:"",status:"planned",visibleStudents:false,visibleGuardians:false};
const statusLabel:Record<Unit["status"],string>={planned:"Planlagt",active:"I gang",completed:"Afsluttet",archived:"Arkiveret"};

export default function SubjectUnitsPage(){
 const params=useParams<{roomId:string}>(),roomId=Number(params.roomId);
 const[ready,setReady]=useState(false),[room,setRoom]=useState<Room|null>(null),[klass,setKlass]=useState<Klass|null>(null),[subject,setSubject]=useState<Subject|null>(null),[units,setUnits]=useState<Unit[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[links,setLinks]=useState<UnitAssignment[]>([]),[canEdit,setCanEdit]=useState(false),[form,setForm]=useState<FormState>(emptyForm),[editingId,setEditingId]=useState<number|null>(null),[showForm,setShowForm]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState("");

 const load=async()=>{
  if(!Number.isFinite(roomId)||roomId<=0){setMessage("Faglokalet er ugyldigt.");setReady(true);return}
  const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user){window.location.replace("/?teacher=1");return}
  const[rRes,uRes,aRes,tRes]=await Promise.all([
   supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("id",roomId).eq("active",true).maybeSingle(),
   supabase.from("subject_units").select("id,class_subject_id,title,driving_question,summary,learning_goals,start_date,end_date,status,visible_to_students,visible_to_guardians,position").eq("class_subject_id",roomId).order("start_date",{ascending:true,nullsFirst:false}).order("position"),
   supabase.from("assignments").select("id,title,type").eq("class_subject_id",roomId).order("id",{ascending:false}),
   supabase.from("class_subject_teachers").select("user_id").eq("class_subject_id",roomId).eq("user_id",user.id).maybeSingle()
  ]);
  if(rRes.error||!rRes.data){setMessage("Du har ikke adgang til faglokalet.");setReady(true);return}
  const r=rRes.data as Room,unitRows=(uRes.data||[]) as Unit[];
  const[cRes,sRes,lRes]=await Promise.all([
   supabase.from("classes").select("id,name").eq("id",r.class_id).maybeSingle(),
   supabase.from("subjects").select("id,name").eq("id",r.subject_id).maybeSingle(),
   unitRows.length?supabase.from("subject_unit_assignments").select("subject_unit_id,assignment_id,position").in("subject_unit_id",unitRows.map(x=>x.id)):Promise.resolve({data:[],error:null})
  ]);
  setRoom(r);setKlass((cRes.data||null) as Klass|null);setSubject((sRes.data||null) as Subject|null);setUnits(unitRows);setAssignments((aRes.data||[]) as Assignment[]);setLinks((lRes.data||[]) as UnitAssignment[]);setCanEdit(hasRole(user,"admin")||!!tRes.data);setReady(true);
 };
 useEffect(()=>{load()},[roomId]);

 const activeUnits=useMemo(()=>units.filter(x=>x.status!=="archived"),[units]);
 const archived=useMemo(()=>units.filter(x=>x.status==="archived"),[units]);
 const linkedFor=(unitId:number)=>links.filter(x=>x.subject_unit_id===unitId).sort((a,b)=>a.position-b.position).map(link=>assignments.find(a=>a.id===link.assignment_id)).filter(Boolean) as Assignment[];
 const availableFor=(unitId:number)=>assignments.filter(a=>!links.some(l=>l.subject_unit_id===unitId&&l.assignment_id===a.id));

 function openNew(){setEditingId(null);setForm(emptyForm);setShowForm(true);setMessage("")}
 function openEdit(unit:Unit){setEditingId(unit.id);setForm({title:unit.title,drivingQuestion:unit.driving_question||"",summary:unit.summary||"",goals:(unit.learning_goals||[]).join("\n"),startDate:unit.start_date||"",endDate:unit.end_date||"",status:unit.status,visibleStudents:unit.visible_to_students,visibleGuardians:unit.visible_to_guardians});setShowForm(true);setMessage("")}
 function closeForm(){setShowForm(false);setEditingId(null);setForm(emptyForm)}

 async function saveUnit(){
  if(!canEdit||!form.title.trim()||saving)return;
  if(form.startDate&&form.endDate&&form.endDate<form.startDate){setMessage("Slutdato kan ikke ligge før startdato.");return}
  setSaving(true);setMessage("");
  const payload={class_subject_id:roomId,title:form.title.trim(),driving_question:form.drivingQuestion.trim()||null,summary:form.summary.trim()||null,learning_goals:form.goals.split("\n").map(x=>x.trim()).filter(Boolean),start_date:form.startDate||null,end_date:form.endDate||null,status:form.status,visible_to_students:form.visibleStudents,visible_to_guardians:form.visibleGuardians,position:editingId?units.find(x=>x.id===editingId)?.position||0:units.length};
  const result=editingId?await supabase.from("subject_units").update(payload).eq("id",editingId):await supabase.from("subject_units").insert(payload);
  if(result.error)setMessage(result.error.message);else{setMessage(editingId?"Forløbet er opdateret ✓":"Forløbet er oprettet ✓");closeForm();await load()}
  setSaving(false);
 }
 async function removeUnit(unit:Unit){if(!canEdit||!window.confirm(`Slet forløbet “${unit.title}”? Opgaverne slettes ikke — kun koblingen til forløbet.`))return;setSaving(true);const{error}=await supabase.from("subject_units").delete().eq("id",unit.id);if(error)setMessage(error.message);else{setMessage("Forløbet er slettet.");await load()}setSaving(false)}
 async function linkAssignment(unitId:number,assignmentId:number){if(!canEdit||!assignmentId)return;const pos=links.filter(x=>x.subject_unit_id===unitId).length;const{error}=await supabase.from("subject_unit_assignments").insert({subject_unit_id:unitId,assignment_id:assignmentId,position:pos});if(error)setMessage(error.message);else await load()}
 async function unlinkAssignment(unitId:number,assignmentId:number){if(!canEdit)return;const{error}=await supabase.from("subject_unit_assignments").delete().eq("subject_unit_id",unitId).eq("assignment_id",assignmentId);if(error)setMessage(error.message);else await load()}

 if(!ready)return <main style={{padding:50}}>Åbner forløb…</main>;
 if(!room)return <main style={{padding:50}}><h1>Forløb kunne ikke åbnes</h1><p>{message}</p></main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1080,margin:"auto"}}><Link href={`/students/subjects/${room.id}`} style={{color:"#e7ddd0",fontWeight:850,textDecoration:"none"}}>← {room.title||subject?.name||"Faglokalet"}</Link><p style={topEyebrow}>{klass?.name?.toUpperCase()} · {subject?.name?.toUpperCase()}</p><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"5px 0"}}>Forløb & årsplan</h1><p style={{margin:0,opacity:.8,maxWidth:760,lineHeight:1.5}}>Planlæg forløbene én gang. Årsplanen er tidslinjen over de samme levende forløb — med mål og opgaver samlet samme sted.</p></div></header>
  <section style={{maxWidth:1080,margin:"auto",padding:"26px 24px 80px"}}>
   {message&&<div style={{padding:"10px 12px",borderRadius:9,marginBottom:12,background:message.includes("✓")?"#e6eee8":"#fff3cd"}}>{message}</div>}
   <section style={{...card,display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap",background:"#eef2ed"}}><div><small style={eyebrow}>ÅRSPLAN SOM ARBEJDSFLADE</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:22,marginTop:4}}>{activeUnits.length} aktive/planlagte forløb</strong><span style={{fontSize:12,color:"#6b756f"}}>Datoer er valgfrie. Et forløb kan godt leve uden en fast kalenderperiode.</span></div>{canEdit&&<button onClick={openNew} style={primary}>+ Nyt forløb</button>}</section>

   {showForm&&canEdit&&<section style={{...card,marginTop:14}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}><div><small style={eyebrow}>{editingId?"REDIGÉR":"NYT FORLØB"}</small><h2 style={{fontFamily:"Georgia,serif",margin:"4px 0 0"}}>{editingId?"Opdatér forløbet":"Byg forløbet"}</h2></div><button onClick={closeForm} style={secondary}>Luk</button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,marginTop:15}}><label style={label}>Titel<input value={form.title} onChange={e=>setForm(x=>({...x,title:e.target.value}))} style={input} placeholder="Fx Er du ægte?"/></label><label style={label}>Styrende spørgsmål<input value={form.drivingQuestion} onChange={e=>setForm(x=>({...x,drivingQuestion:e.target.value}))} style={input} placeholder="Fx Hvad gør et menneske ægte?"/></label><label style={label}>Startdato<input type="date" value={form.startDate} onChange={e=>setForm(x=>({...x,startDate:e.target.value}))} style={input}/></label><label style={label}>Slutdato<input type="date" value={form.endDate} onChange={e=>setForm(x=>({...x,endDate:e.target.value}))} style={input}/></label><label style={label}>Status<select value={form.status} onChange={e=>setForm(x=>({...x,status:e.target.value as Unit["status"]}))} style={input}>{Object.entries(statusLabel).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div><label style={{...label,display:"block",marginTop:12}}>Kort beskrivelse<textarea value={form.summary} onChange={e=>setForm(x=>({...x,summary:e.target.value}))} rows={4} style={input} placeholder="Hvad arbejder klassen med, og hvorfor?"/></label><label style={{...label,display:"block",marginTop:12}}>Læringsmål — ét pr. linje<textarea value={form.goals} onChange={e=>setForm(x=>({...x,goals:e.target.value}))} rows={5} style={input} placeholder={"Eleven kan bruge tekstspor som belæg\nEleven kan skrive til en tydelig modtager"}/></label><div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:13}}><label style={checkLabel}><input type="checkbox" checked={form.visibleStudents} onChange={e=>setForm(x=>({...x,visibleStudents:e.target.checked}))}/> Må vises til elever</label><label style={checkLabel}><input type="checkbox" checked={form.visibleGuardians} onChange={e=>setForm(x=>({...x,visibleGuardians:e.target.checked}))}/> Må vises til forældre</label></div><small style={{display:"block",color:"#757d77",marginTop:6}}>Synlighedsvalgene gemmes nu; elev-/forældrevisningen kobles på som næste lag.</small><button disabled={saving||!form.title.trim()} onClick={saveUnit} style={{...primary,marginTop:15,opacity:saving||!form.title.trim()?.55:1}}>{saving?"Gemmer…":editingId?"Gem ændringer":"Opret forløb"}</button></section>}

   <div style={{display:"grid",gap:14,marginTop:16}}>{activeUnits.length?activeUnits.map(unit=><UnitCard key={unit.id} unit={unit} linked={linkedFor(unit.id)} available={availableFor(unit.id)} canEdit={canEdit} onEdit={()=>openEdit(unit)} onDelete={()=>removeUnit(unit)} onLink={id=>linkAssignment(unit.id,id)} onUnlink={id=>unlinkAssignment(unit.id,id)}/>):<section style={card}><h2 style={{fontFamily:"Georgia,serif",margin:"0 0 6px"}}>Årsplanen er tom endnu</h2><p style={{color:"#717871",margin:0}}>Opret det første forløb. Det kan være et kort miniforløb eller et længere tema — perioder og mål kan ændres undervejs.</p></section>}</div>

   {archived.length>0&&<details style={{marginTop:22}}><summary style={{cursor:"pointer",fontWeight:900,color:"#66726b"}}>Arkiverede forløb ({archived.length})</summary><div style={{display:"grid",gap:10,marginTop:10}}>{archived.map(unit=><UnitCard key={unit.id} unit={unit} linked={linkedFor(unit.id)} available={availableFor(unit.id)} canEdit={canEdit} onEdit={()=>openEdit(unit)} onDelete={()=>removeUnit(unit)} onLink={id=>linkAssignment(unit.id,id)} onUnlink={id=>unlinkAssignment(unit.id,id)}/>)}</div></details>}
  </section>
 </main>;
}

function UnitCard({unit,linked,available,canEdit,onEdit,onDelete,onLink,onUnlink}:{unit:Unit;linked:Assignment[];available:Assignment[];canEdit:boolean;onEdit:()=>void;onDelete:()=>void;onLink:(id:number)=>void;onUnlink:(id:number)=>void}){
 const period=unit.start_date||unit.end_date?[unit.start_date?formatDate(unit.start_date):"?",unit.end_date?formatDate(unit.end_date):"?"].join(" → "):"Ingen fast periode";
 return <article style={{...card,borderLeft:unit.status==="active"?"5px solid #486b59":"1px solid #ddd9d0"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:12,flexWrap:"wrap"}}><div><div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}><span style={statusTag}>{statusLabel[unit.status]}</span><span style={periodTag}>{period}</span>{unit.visible_to_students&&<span style={visibilityTag}>Elev</span>}{unit.visible_to_guardians&&<span style={visibilityTag}>Forælder</span>}</div><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"8px 0 3px"}}>{unit.title}</h2>{unit.driving_question&&<p style={{fontWeight:850,color:"#4d6257",margin:"6px 0"}}>“{unit.driving_question}”</p>}{unit.summary&&<p style={{color:"#68716b",lineHeight:1.5,margin:"7px 0 0",maxWidth:760}}>{unit.summary}</p>}</div>{canEdit&&<div style={{display:"flex",gap:7}}><button onClick={onEdit} style={secondary}>Redigér</button><button onClick={onDelete} style={danger}>Slet</button></div>}</div>
 {unit.learning_goals?.length>0&&<div style={{marginTop:14}}><small style={eyebrow}>MÅL</small><ul style={{margin:"6px 0 0",paddingLeft:20,lineHeight:1.55}}>{unit.learning_goals.map((g,i)=><li key={`${g}-${i}`}>{g}</li>)}</ul></div>}
 <div style={{marginTop:15,paddingTop:14,borderTop:"1px solid #e4e0d7"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><div><small style={eyebrow}>OPGAVER I FORLØBET</small><strong style={{display:"block",marginTop:3}}>{linked.length?`${linked.length} koblet`:"Ingen opgaver koblet endnu"}</strong></div>{canEdit&&available.length>0&&<select defaultValue="" onChange={e=>{const id=Number(e.target.value);if(id){onLink(id);e.currentTarget.value=""}}} style={{...input,width:"auto",marginTop:0,minWidth:230}}><option value="">+ Kobl eksisterende opgave…</option>{available.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select>}</div>{linked.length>0&&<div style={{display:"grid",gap:7,marginTop:10}}>{linked.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",padding:"9px 10px",background:"#faf9f6",border:"1px solid #e4e0d7",borderRadius:9}}><span><strong>{a.title}</strong><small style={{display:"block",color:"#747b75",marginTop:2}}>{a.type}</small></span>{canEdit&&<button onClick={()=>onUnlink(a.id)} style={mini}>Fjern kobling</button>}</div>)}</div>}</div>
 </article>;
}

function formatDate(value:string){return new Date(`${value}T12:00:00`).toLocaleDateString("da-DK",{day:"numeric",month:"short",year:"numeric"})}
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:18};
const topEyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,opacity:.68,margin:"18px 0 0"};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.1,color:"#718077"};
const label:React.CSSProperties={fontSize:12,fontWeight:900,color:"#53645b"};
const input:React.CSSProperties={boxSizing:"border-box",display:"block",width:"100%",marginTop:5,padding:"9px 10px",border:"1px solid #d5d1c7",borderRadius:8,background:"white",font:"inherit"};
const primary:React.CSSProperties={padding:"9px 12px",border:0,borderRadius:8,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={padding:"8px 10px",border:"1px solid #d5d1c7",borderRadius:8,background:"white",color:"#526159",fontWeight:850,cursor:"pointer"};
const danger:React.CSSProperties={...secondary,border:"1px solid #dfb8b2",background:"#fff3ef",color:"#8a3c34"};
const mini:React.CSSProperties={padding:"5px 7px",border:"1px solid #d9d5cc",borderRadius:7,background:"white",color:"#67716b",fontWeight:800,fontSize:11,cursor:"pointer"};
const checkLabel:React.CSSProperties={display:"flex",gap:7,alignItems:"center",fontWeight:800,fontSize:13};
const statusTag:React.CSSProperties={fontSize:10,fontWeight:900,padding:"4px 7px",borderRadius:999,background:"#e3ece5",color:"#486252"};
const periodTag:React.CSSProperties={...statusTag,background:"#eeeae1",color:"#76694f"};
const visibilityTag:React.CSSProperties={...statusTag,background:"#eef0f3",color:"#596676"};
