"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";

type Room={id:number;class_id:number;subject_id:number;title:string|null};
type Unit={id:number;class_subject_id:number;title:string;driving_question:string|null;start_date:string|null;end_date:string|null;status:"planned"|"active"|"completed"|"archived"};
type Klass={id:number;name:string};
type Subject={id:number;name:string};
type UnitLink={subject_unit_id:number};
type Lesson={subject_unit_id:number|null};
type RoomOption={id:number;className:string;subjectName:string;label:string};
type NewUnitForm={roomId:string;title:string;question:string;start:string;end:string};

type UnitSummary={unit:Unit;room:Room;className:string;subjectName:string;assignments:number;materials:number;lessons:number};
const statusLabel:Record<Unit["status"],string>={planned:"Planlagt",active:"I gang",completed:"Afsluttet",archived:"Arkiveret"};
const blankForm:NewUnitForm={roomId:"",title:"",question:"",start:"",end:""};

export default function ActiveSubjectUnits(){
 const[loading,setLoading]=useState(true),[units,setUnits]=useState<UnitSummary[]>([]),[rooms,setRooms]=useState<Room[]>([]),[roomOptions,setRoomOptions]=useState<RoomOption[]>([]),[message,setMessage]=useState("");
 const[showCreate,setShowCreate]=useState(false),[creating,setCreating]=useState(false),[form,setForm]=useState<NewUnitForm>(blankForm);
 useEffect(()=>{let active=true;(async()=>{
  const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user)return;
  const isAdmin=hasRole(user,"admin");
  const teacherRes=isAdmin?null:await supabase.from("class_subject_teachers").select("class_subject_id").eq("user_id",user.id);
  if(!active)return;
  const assignedIds=isAdmin?[]:(teacherRes?.data||[]).map(x=>Number(x.class_subject_id)).filter(Boolean);
  if(!isAdmin&&!assignedIds.length){setRooms([]);setRoomOptions([]);setUnits([]);setLoading(false);return}
  let roomQuery=supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("active",true);
  if(!isAdmin)roomQuery=roomQuery.in("id",assignedIds);
  const roomRes=await roomQuery.order("class_id");if(!active)return;
  if(roomRes.error){setMessage("Forløbene kunne ikke hentes lige nu.");setLoading(false);return}
  const roomRows=(roomRes.data||[]) as Room[];setRooms(roomRows);
  if(!roomRows.length){setRoomOptions([]);setLoading(false);return}
  const roomIds=roomRows.map(x=>x.id),classIds=Array.from(new Set(roomRows.map(x=>x.class_id))),subjectIds=Array.from(new Set(roomRows.map(x=>x.subject_id)));
  const[unitRes,classRes,subjectRes]=await Promise.all([
   supabase.from("subject_units").select("id,class_subject_id,title,driving_question,start_date,end_date,status").in("class_subject_id",roomIds).in("status",["active","planned"]).order("start_date",{ascending:true,nullsFirst:false}).order("position"),
   supabase.from("classes").select("id,name").in("id",classIds),
   supabase.from("subjects").select("id,name").in("id",subjectIds)
  ]);if(!active)return;
  if(unitRes.error||classRes.error||subjectRes.error){setMessage("Forløbene kunne ikke hentes helt.");setLoading(false);return}
  const unitRows=(unitRes.data||[]) as Unit[],classes=(classRes.data||[]) as Klass[],subjects=(subjectRes.data||[]) as Subject[];
  const options=roomRows.map(room=>{const className=classes.find(c=>c.id===room.class_id)?.name||"Klasse",subjectName=room.title||subjects.find(s=>s.id===room.subject_id)?.name||"Fag";return{id:room.id,className,subjectName,label:`${className} · ${subjectName}`}}).sort((a,b)=>a.label.localeCompare(b.label,"da"));
  setRoomOptions(options);
  if(!unitRows.length){setUnits([]);setLoading(false);return}
  const unitIds=unitRows.map(x=>x.id);
  const[aRes,mRes,lRes]=await Promise.all([
   supabase.from("subject_unit_assignments").select("subject_unit_id").in("subject_unit_id",unitIds),
   supabase.from("subject_unit_items").select("subject_unit_id").in("subject_unit_id",unitIds),
   supabase.from("lesson_instances").select("subject_unit_id").in("subject_unit_id",unitIds)
  ]);if(!active)return;
  const assignmentLinks=(aRes.data||[]) as UnitLink[],materialLinks=(mRes.data||[]) as UnitLink[],lessonLinks=(lRes.data||[]) as Lesson[];
  const summaries=unitRows.map(unit=>{const room=roomRows.find(r=>r.id===unit.class_subject_id)!;return{unit,room,className:classes.find(c=>c.id===room.class_id)?.name||"Klasse",subjectName:room.title||subjects.find(s=>s.id===room.subject_id)?.name||"Fag",assignments:assignmentLinks.filter(x=>x.subject_unit_id===unit.id).length,materials:materialLinks.filter(x=>x.subject_unit_id===unit.id).length,lessons:lessonLinks.filter(x=>x.subject_unit_id===unit.id).length}}).sort((a,b)=>a.unit.status===b.unit.status?(a.unit.start_date||"9999").localeCompare(b.unit.start_date||"9999"):a.unit.status==="active"?-1:1);
  setUnits(summaries);setLoading(false);
 })();return()=>{active=false}},[]);

 const activeCount=units.filter(x=>x.unit.status==="active").length;
 const shown=useMemo(()=>units.slice(0,6),[units]);
 const selectedRoom=roomOptions.find(x=>String(x.id)===form.roomId)||null;
 const beginCreate=()=>{setForm(x=>({...x,roomId:x.roomId||String(roomOptions[0]?.id||"")}));setShowCreate(true);setMessage("")};
 const cancelCreate=()=>{setShowCreate(false);setForm(blankForm);setMessage("")};
 const createUnit=async()=>{
  const roomId=Number(form.roomId);if(!roomId||!form.title.trim()||creating)return;
  if(form.start&&form.end&&form.end<form.start){setMessage("Slutdato kan ikke ligge før startdato.");return}
  setCreating(true);setMessage("");
  const position=units.filter(x=>x.room.id===roomId).length;
  const{data,error}=await supabase.from("subject_units").insert({class_subject_id:roomId,title:form.title.trim(),driving_question:form.question.trim()||null,start_date:form.start||null,end_date:form.end||null,status:"planned",learning_goals:[],visible_to_students:false,visible_to_guardians:false,position}).select("id").single();
  if(error||!data){setMessage(error?.message||"Forløbet kunne ikke oprettes.");setCreating(false);return}
  window.location.href=`/students/subjects/${roomId}/units`;
 };

 if(loading)return <section style={{...panel,marginTop:18}}>Henter dine forløb…</section>;
 return <section id="forloeb" style={{...panel,marginTop:18}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><p style={eyebrow}>FORTSÆT ARBEJDET</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"5px 0 4px"}}>Mine forløb</h2><p style={{color:"#687068",lineHeight:1.5,margin:0,maxWidth:720}}>{activeCount?`${activeCount} forløb er markeret som i gang. `:""}Her ligger kun det, du selv har valgt at samle digitalt.</p></div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>{rooms.length>0&&<span style={countChip}>{units.length}</span>}{rooms.length>0&&!showCreate&&<button type="button" onClick={beginCreate} style={createButton}>+ Start nyt forløb</button>}</div></div>
  {showCreate&&<section style={createPanel}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><p style={eyebrow}>NYT FORLØB</p><h3 style={{fontFamily:"Georgia,serif",fontSize:21,margin:"5px 0 3px"}}>Start med det vigtigste</h3><p style={{margin:0,color:"#687068",fontSize:13,lineHeight:1.45}}>Du kan tilføje mål, materialer, opgaver, lektioner og synlighed bagefter.</p></div><button type="button" onClick={cancelCreate} style={secondaryButton}>Luk</button></div><div style={formGrid}><label style={label}>Klasse og fag<select value={form.roomId} onChange={e=>setForm(x=>({...x,roomId:e.target.value}))} style={input}>{roomOptions.map(room=><option key={room.id} value={room.id}>{room.label}</option>)}</select></label><label style={label}>Titel<input autoFocus value={form.title} onChange={e=>setForm(x=>({...x,title:e.target.value}))} style={input} placeholder="Fx Er du ægte?"/></label><label style={label}>Start <small style={optional}>(valgfrit)</small><input type="date" value={form.start} onChange={e=>setForm(x=>({...x,start:e.target.value}))} style={input}/></label><label style={label}>Slut <small style={optional}>(valgfrit)</small><input type="date" value={form.end} onChange={e=>setForm(x=>({...x,end:e.target.value}))} style={input}/></label></div><label style={label}>Styrende spørgsmål <small style={optional}>(valgfrit)</small><input value={form.question} onChange={e=>setForm(x=>({...x,question:e.target.value}))} style={input} placeholder="Fx Hvornår er noget ægte?"/></label>{selectedRoom&&<small style={{display:"block",marginTop:8,color:"#687068"}}>Oprettes i {selectedRoom.className} · {selectedRoom.subjectName}. Elev- og forældresynlighed er slået fra fra start.</small>}<button type="button" disabled={creating||!form.roomId||!form.title.trim()} onClick={createUnit} style={{...createButton,marginTop:11,opacity:creating||!form.roomId||!form.title.trim()?0.55:1}}>{creating?"Opretter…":"Opret og fortsæt →"}</button></section>}
  {message&&<div style={{marginTop:12,padding:"9px 10px",background:"#fff3cd",borderRadius:8,color:"#765b29",fontSize:12,fontWeight:800}}>{message}</div>}
  {!units.length?<div style={{marginTop:13,padding:"12px 13px",background:"#f8f7f3",borderRadius:9,color:"#687068"}}>{rooms.length?"Du har ingen aktive eller planlagte onlineforløb endnu. Start et her, når det giver mening at samle arbejdet digitalt.":"Når du får et faglokale, kan du samle onlineforløb her."}</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:9,marginTop:13}}>{shown.map(({unit,room,className,subjectName,assignments,materials,lessons})=><Link key={unit.id} href={`/students/subjects/${room.id}/units`} style={{textDecoration:"none",color:"inherit",padding:"12px 13px",border:"1px solid #dfe1da",borderRadius:10,background:unit.status==="active"?"#eef2ed":"#faf9f6"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><span><small style={{fontWeight:900,color:"#718077",letterSpacing:.6}}>{className.toUpperCase()} · {subjectName.toUpperCase()}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:4}}>{unit.title}</strong>{unit.driving_question&&<small style={{display:"block",marginTop:4,color:"#667168",lineHeight:1.4}}>“{unit.driving_question}”</small>}</span><span style={unit.status==="active"?activeTag:plannedTag}>{statusLabel[unit.status]}</span></div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:9}}>{lessons>0&&<span style={smallTag}>{lessons} lektion{lessons===1?"":"er"}</span>}{materials>0&&<span style={smallTag}>{materials} materiale{materials===1?"":"r"}</span>}{assignments>0&&<span style={smallTag}>{assignments} opgave{assignments===1?"":"r"}</span>}{lessons+materials+assignments===0&&<span style={smallTag}>Klar til at bygge videre</span>}</div><strong style={{display:"block",marginTop:9,color:"#486b59",fontSize:12}}>Fortsæt →</strong></Link>)}</div>}
  {units.length>shown.length&&<small style={{display:"block",marginTop:9,color:"#747b75"}}>+ {units.length-shown.length} flere forløb i dine faglokaler</small>}
 </section>;
}

const panel:React.CSSProperties={background:"white",border:"1px solid #dfdcd4",borderRadius:14,padding:"18px 20px"};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:0};
const countChip:React.CSSProperties={minWidth:30,height:30,borderRadius:999,display:"grid",placeItems:"center",background:"#edf1ec",color:"#486b59",fontWeight:900,fontSize:12};
const activeTag:React.CSSProperties={fontSize:9,fontWeight:900,padding:"4px 6px",borderRadius:999,background:"#dce9df",color:"#4b6655",whiteSpace:"nowrap"};
const plannedTag:React.CSSProperties={...activeTag,background:"#eeeae1",color:"#76694f"};
const smallTag:React.CSSProperties={fontSize:9,fontWeight:850,padding:"3px 5px",borderRadius:999,background:"white",border:"1px solid #dde0d9",color:"#667168"};
const createButton:React.CSSProperties={padding:"9px 12px",border:0,borderRadius:8,background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondaryButton:React.CSSProperties={padding:"7px 9px",border:"1px solid #d5d1c7",borderRadius:8,background:"white",color:"#486b59",fontWeight:850,cursor:"pointer"};
const createPanel:React.CSSProperties={marginTop:13,padding:"14px 15px",border:"1px solid #d7dfd8",borderRadius:11,background:"#eef2ed"};
const formGrid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:9};
const label:React.CSSProperties={display:"block",fontSize:12,fontWeight:900,marginTop:10};
const optional:React.CSSProperties={fontWeight:500,color:"#7b817c"};
const input:React.CSSProperties={boxSizing:"border-box",display:"block",width:"100%",marginTop:5,padding:"9px 10px",border:"1px solid #d5d1c7",borderRadius:8,background:"white",font:"inherit",color:"#26342e"};
