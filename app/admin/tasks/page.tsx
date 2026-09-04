"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type Staff={user_id:string;display_name:string;role:string};
type StaffTask={id:number;school_id:number;title:string;description:string|null;due_date:string|null;created_by:string;created_at:string};
type Assignee={task_id:number;user_id:string;completed:boolean;completed_at:string|null};

export default function AdminTasks(){
 const[ready,setReady]=useState(false),[staff,setStaff]=useState<Staff[]>([]),[tasks,setTasks]=useState<StaffTask[]>([]),[assignees,setAssignees]=useState<Assignee[]>([]),[error,setError]=useState("");
 const[showCreate,setShowCreate]=useState(false),[showDone,setShowDone]=useState(false),[saving,setSaving]=useState(false);
 const[title,setTitle]=useState(""),[description,setDescription]=useState(""),[dueDate,setDueDate]=useState(""),[selected,setSelected]=useState<string[]>([]);

 async function load(){
  const[sRes,tRes,aRes]=await Promise.all([
   supabase.rpc("get_internal_staff_directory"),
   supabase.from("staff_tasks").select("id,school_id,title,description,due_date,created_by,created_at").order("created_at",{ascending:false}),
   supabase.from("staff_task_assignees").select("task_id,user_id,completed,completed_at")
  ]);
  const byId=new Map<string,Staff>();
  for(const row of (sRes.data||[]) as Staff[]){if(!["teacher","admin","leader"].includes(row.role))continue;if(!byId.has(row.user_id))byId.set(row.user_id,row)}
  setStaff(Array.from(byId.values()).sort((a,b)=>a.display_name.localeCompare(b.display_name,"da")));
  setTasks((tRes.data||[]) as StaffTask[]);setAssignees((aRes.data||[]) as Assignee[]);
  const problem=sRes.error||tRes.error||aRes.error;setError(problem?.message||"");
 }

 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();const user=data.session?.user;if(!user){location.replace("/");return}if(!hasRole(user,"admin")){location.replace("/noticeboard");return}await load();setReady(true)})()},[]);

 const name=(id:string)=>staff.find(x=>x.user_id===id)?.display_name||"Medarbejder";
 const taskAssignees=(id:number)=>assignees.filter(x=>x.task_id===id);
 const taskDone=(id:number)=>{const rows=taskAssignees(id);return rows.length>0&&rows.every(x=>x.completed)};
 const shown=useMemo(()=>tasks.filter(t=>showDone||!taskDone(t.id)),[tasks,assignees,showDone]);
 const openCount=tasks.filter(t=>!taskDone(t.id)).length;

 function togglePerson(id:string){setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])}
 async function createTask(){
  if(!title.trim()||selected.length===0||saving)return;
  setSaving(true);setError("");
  const{error:e}=await supabase.rpc("admin_create_staff_task",{p_title:title.trim(),p_description:description.trim()||null,p_due_date:dueDate||null,p_user_ids:selected});
  if(e)setError(e.message);else{setTitle("");setDescription("");setDueDate("");setSelected([]);setShowCreate(false);await load()}
  setSaving(false);
 }
 async function removeTask(id:number){
  if(!confirm("Slet denne personaleopgave for alle modtagere?"))return;
  const{error:e}=await supabase.rpc("admin_delete_staff_task",{p_task_id:id});if(e)setError(e.message);else await load();
 }

 if(!ready)return <main style={{padding:50}}>Henter personaleopgaver…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#486b59",color:"white",padding:"20px 6vw"}}><div style={{maxWidth:1050,margin:"auto",display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><small style={{opacity:.75,fontWeight:900}}>ADMINISTRATION · PERSONALE</small><h1 style={{fontFamily:"Georgia,serif",fontSize:30,margin:"4px 0"}}>Personaleopgaver</h1></div><Link href="/admin" style={{color:"white",fontWeight:800}}>← Administration</Link></div></header>
  <section style={{maxWidth:1050,margin:"auto",padding:"36px 24px 80px"}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"end",flexWrap:"wrap"}}><div><p style={eyebrow}>OPGAVEOVERSIGT</p><h2 style={{fontFamily:"Georgia,serif",fontSize:32,margin:"5px 0"}}>Hvem skal gøre hvad?</h2><p style={{color:"#687068",maxWidth:700,lineHeight:1.55,margin:"6px 0 0"}}>Tildel én opgave til én eller flere medarbejdere. Hver medarbejder markerer sin egen opgave som udført, og du kan følge status her.</p></div><button onClick={()=>setShowCreate(v=>!v)} style={primary}>{showCreate?"Luk":"+ Tildel opgave"}</button></div>

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:20}}><div style={stat}><small>ÅBNE OPGAVER</small><strong>{openCount}</strong></div><div style={stat}><small>PERSONALE</small><strong>{staff.length}</strong></div><div style={stat}><small>TILDELINGER</small><strong>{assignees.filter(x=>!x.completed).length} åbne</strong></div></div>

   {showCreate&&<section style={{...card,marginTop:18,background:"#eef2ed"}}><h3 style={{fontFamily:"Georgia,serif",marginTop:0}}>Ny personaleopgave</h3><div style={{display:"grid",gap:10}}><label style={label}>Opgave<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} maxLength={240} placeholder="Fx Forbered oplæg til forældremøde" style={field}/></label><label style={label}>Beskrivelse <span style={{fontWeight:500}}>(valgfri)</span><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={3} placeholder="Det vigtigste medarbejderen skal vide…" style={field}/></label><label style={{...label,maxWidth:280}}>Deadline <span style={{fontWeight:500}}>(valgfri)</span><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={field}/></label><div><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><strong style={{fontSize:13}}>Tildel til</strong><div style={{display:"flex",gap:6}}><button type="button" onClick={()=>setSelected(staff.map(x=>x.user_id))} style={smallButton}>Vælg alle</button><button type="button" onClick={()=>setSelected([])} style={smallButton}>Ryd</button></div></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:7,marginTop:8}}>{staff.map(person=><label key={person.user_id} style={choice(selected.includes(person.user_id))}><input type="checkbox" checked={selected.includes(person.user_id)} onChange={()=>togglePerson(person.user_id)}/><span><strong>{person.display_name}</strong><small style={{display:"block",color:"#737b75",marginTop:2}}>{person.role==="teacher"?"Lærer":"Ledelse"}</small></span></label>)}</div></div><button disabled={!title.trim()||selected.length===0||saving} onClick={createTask} style={{...primary,opacity:!title.trim()||selected.length===0||saving?.5:1,justifySelf:"start"}}>{saving?"Tildeler…":`Tildel til ${selected.length||0} medarbejder${selected.length===1?"":"e"}`}</button></div></section>}

   {error&&<div style={{...card,marginTop:16,background:"#fff3cd",color:"#765b29"}}>{error}</div>}
   <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}><label style={{fontWeight:800,color:"#657169"}}><input type="checkbox" checked={showDone} onChange={e=>setShowDone(e.target.checked)} style={{marginRight:7}}/>Vis afsluttede opgaver</label></div>

   {shown.length===0&&!error?<div style={{...card,marginTop:14}}><strong>Ingen åbne personaleopgaver.</strong><p style={{color:"#707670",marginBottom:0}}>Når ledelsen tildeler en opgave, vil den kunne følges her.</p></div>:<div style={{display:"grid",gap:12,marginTop:14}}>{shown.map(task=>{const rows=taskAssignees(task.id),done=taskDone(task.id),overdue=!!task.due_date&&!done&&task.due_date<today();return <article key={task.id} style={{...card,opacity:done?.65:1}}><div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start"}}><div style={{minWidth:0}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}><strong style={{fontSize:18,textDecoration:done?"line-through":"none"}}>{task.title}</strong>{done&&<span style={donePill}>Alle færdige ✓</span>}</div>{task.description&&<p style={{color:"#687068",margin:"7px 0",lineHeight:1.5}}>{task.description}</p>}{task.due_date&&<div style={{fontSize:13,fontWeight:850,color:overdue?"#a44438":"#657169"}}>{overdue?"Overskredet · ":"Deadline · "}{new Date(task.due_date+"T12:00:00").toLocaleDateString("da-DK")}</div>}</div><button onClick={()=>removeTask(task.id)} style={deleteButton}>Slet</button></div><div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:13}}>{rows.map(row=><span key={row.user_id} style={row.completed?completePerson:openPerson}>{row.completed?"✓ ":"○ "}{name(row.user_id)}</span>)}</div></article>})}</div>}
  </section>
 </main>;
}

const today=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:"17px 18px"};
const stat:React.CSSProperties={...card,display:"grid",gap:4};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const label:React.CSSProperties={fontWeight:850,fontSize:13};
const field:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:"10px 11px",border:"1px solid #cbc7be",borderRadius:8,font:"inherit",background:"white"};
const primary:React.CSSProperties={border:0,borderRadius:9,padding:"10px 14px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const smallButton:React.CSSProperties={border:"1px solid #c7cdc8",borderRadius:7,padding:"6px 8px",background:"white",color:"#365044",fontWeight:800,cursor:"pointer",fontSize:11};
const deleteButton:React.CSSProperties={...smallButton,color:"#8a3e36",flex:"0 0 auto"};
const choice=(on:boolean):React.CSSProperties=>({display:"flex",alignItems:"center",gap:9,padding:"9px 10px",background:on?"#e4ece7":"white",border:`1px solid ${on?"#aebfb4":"#d8d5cd"}`,borderRadius:8,cursor:"pointer"});
const completePerson:React.CSSProperties={padding:"6px 9px",borderRadius:999,background:"#e6eee8",color:"#486b59",fontWeight:850,fontSize:12};
const openPerson:React.CSSProperties={padding:"6px 9px",borderRadius:999,background:"#f3eee4",color:"#7b6848",fontWeight:850,fontSize:12};
const donePill:React.CSSProperties={...completePerson,fontSize:11};
