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

type UnitSummary={unit:Unit;room:Room;className:string;subjectName:string;assignments:number;materials:number;lessons:number};
const statusLabel:Record<Unit["status"],string>={planned:"Planlagt",active:"I gang",completed:"Afsluttet",archived:"Arkiveret"};

export default function ActiveSubjectUnits(){
 const[loading,setLoading]=useState(true),[units,setUnits]=useState<UnitSummary[]>([]),[rooms,setRooms]=useState<Room[]>([]),[message,setMessage]=useState("");
 useEffect(()=>{let active=true;(async()=>{
  const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user)return;
  const isAdmin=hasRole(user,"admin");
  const teacherRes=isAdmin?null:await supabase.from("class_subject_teachers").select("class_subject_id").eq("user_id",user.id);
  if(!active)return;
  const assignedIds=isAdmin?[]:(teacherRes?.data||[]).map(x=>Number(x.class_subject_id)).filter(Boolean);
  if(!isAdmin&&!assignedIds.length){setRooms([]);setUnits([]);setLoading(false);return}
  let roomQuery=supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("active",true);
  if(!isAdmin)roomQuery=roomQuery.in("id",assignedIds);
  const roomRes=await roomQuery.order("class_id");if(!active)return;
  if(roomRes.error){setMessage("Forløbene kunne ikke hentes lige nu.");setLoading(false);return}
  const roomRows=(roomRes.data||[]) as Room[];setRooms(roomRows);
  if(!roomRows.length){setLoading(false);return}
  const roomIds=roomRows.map(x=>x.id),classIds=Array.from(new Set(roomRows.map(x=>x.class_id))),subjectIds=Array.from(new Set(roomRows.map(x=>x.subject_id)));
  const[unitRes,classRes,subjectRes]=await Promise.all([
   supabase.from("subject_units").select("id,class_subject_id,title,driving_question,start_date,end_date,status").in("class_subject_id",roomIds).in("status",["active","planned"]).order("start_date",{ascending:true,nullsFirst:false}).order("position"),
   supabase.from("classes").select("id,name").in("id",classIds),
   supabase.from("subjects").select("id,name").in("id",subjectIds)
  ]);if(!active)return;
  if(unitRes.error||classRes.error||subjectRes.error){setMessage("Forløbene kunne ikke hentes helt.");setLoading(false);return}
  const unitRows=(unitRes.data||[]) as Unit[];
  if(!unitRows.length){setUnits([]);setLoading(false);return}
  const unitIds=unitRows.map(x=>x.id);
  const[aRes,mRes,lRes]=await Promise.all([
   supabase.from("subject_unit_assignments").select("subject_unit_id").in("subject_unit_id",unitIds),
   supabase.from("subject_unit_items").select("subject_unit_id").in("subject_unit_id",unitIds),
   supabase.from("lesson_instances").select("subject_unit_id").in("subject_unit_id",unitIds)
  ]);if(!active)return;
  const assignmentLinks=(aRes.data||[]) as UnitLink[],materialLinks=(mRes.data||[]) as UnitLink[],lessonLinks=(lRes.data||[]) as Lesson[];
  const classes=(classRes.data||[]) as Klass[],subjects=(subjectRes.data||[]) as Subject[];
  const summaries=unitRows.map(unit=>{const room=roomRows.find(r=>r.id===unit.class_subject_id)!;return{unit,room,className:classes.find(c=>c.id===room.class_id)?.name||"Klasse",subjectName:room.title||subjects.find(s=>s.id===room.subject_id)?.name||"Fag",assignments:assignmentLinks.filter(x=>x.subject_unit_id===unit.id).length,materials:materialLinks.filter(x=>x.subject_unit_id===unit.id).length,lessons:lessonLinks.filter(x=>x.subject_unit_id===unit.id).length}}).sort((a,b)=>a.unit.status===b.unit.status?(a.unit.start_date||"9999").localeCompare(b.unit.start_date||"9999"):a.unit.status==="active"?-1:1);
  setUnits(summaries);setLoading(false);
 })();return()=>{active=false}},[]);

 const activeCount=units.filter(x=>x.unit.status==="active").length;
 const shown=useMemo(()=>units.slice(0,6),[units]);
 if(loading)return <section style={{...panel,marginTop:18}}>Henter dine forløb…</section>;
 return <section id="forloeb" style={{...panel,marginTop:18}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><p style={eyebrow}>FORTSÆT ARBEJDET</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"5px 0 4px"}}>Mine forløb</h2><p style={{color:"#687068",lineHeight:1.5,margin:0,maxWidth:720}}>{activeCount?`${activeCount} forløb er markeret som i gang. `:""}Her ligger kun det, du selv har valgt at samle digitalt.</p></div>{rooms.length>0&&<span style={countChip}>{units.length}</span>}</div>
  {message&&<div style={{marginTop:12,padding:"9px 10px",background:"#fff3cd",borderRadius:8,color:"#765b29",fontSize:12,fontWeight:800}}>{message}</div>}
  {!units.length?<div style={{marginTop:13,padding:"12px 13px",background:"#f8f7f3",borderRadius:9,color:"#687068"}}>{rooms.length?"Du har ingen aktive eller planlagte onlineforløb endnu. Det er helt fint — forløb er kun til det, der giver mening at samle her.":"Når du får et faglokale, kan du samle onlineforløb her."}</div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:9,marginTop:13}}>{shown.map(({unit,room,className,subjectName,assignments,materials,lessons})=><Link key={unit.id} href={`/students/subjects/${room.id}/units`} style={{textDecoration:"none",color:"inherit",padding:"12px 13px",border:"1px solid #dfe1da",borderRadius:10,background:unit.status==="active"?"#eef2ed":"#faf9f6"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><span><small style={{fontWeight:900,color:"#718077",letterSpacing:.6}}>{className.toUpperCase()} · {subjectName.toUpperCase()}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:4}}>{unit.title}</strong>{unit.driving_question&&<small style={{display:"block",marginTop:4,color:"#667168",lineHeight:1.4}}>“{unit.driving_question}”</small>}</span><span style={unit.status==="active"?activeTag:plannedTag}>{statusLabel[unit.status]}</span></div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:9}}>{lessons>0&&<span style={smallTag}>{lessons} lektion{lessons===1?"":"er"}</span>}{materials>0&&<span style={smallTag}>{materials} materiale{materials===1?"":"r"}</span>}{assignments>0&&<span style={smallTag}>{assignments} opgave{assignments===1?"":"r"}</span>}{lessons+materials+assignments===0&&<span style={smallTag}>Klar til at bygge videre</span>}</div><strong style={{display:"block",marginTop:9,color:"#486b59",fontSize:12}}>Fortsæt →</strong></Link>)}</div>}
  {units.length>shown.length&&<small style={{display:"block",marginTop:9,color:"#747b75"}}>+ {units.length-shown.length} flere forløb i dine faglokaler</small>}
 </section>;
}

const panel:React.CSSProperties={background:"white",border:"1px solid #dfdcd4",borderRadius:14,padding:"18px 20px"};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:0};
const countChip:React.CSSProperties={minWidth:30,height:30,borderRadius:999,display:"grid",placeItems:"center",background:"#edf1ec",color:"#486b59",fontWeight:900,fontSize:12};
const activeTag:React.CSSProperties={fontSize:9,fontWeight:900,padding:"4px 6px",borderRadius:999,background:"#dce9df",color:"#4b6655",whiteSpace:"nowrap"};
const plannedTag:React.CSSProperties={...activeTag,background:"#eeeae1",color:"#76694f"};
const smallTag:React.CSSProperties={fontSize:9,fontWeight:850,padding:"3px 5px",borderRadius:999,background:"white",border:"1px solid #dde0d9",color:"#667168"};
