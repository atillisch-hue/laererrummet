"use client";

import Link from "next/link";
import {useParams} from "next/navigation";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";

type ItemType="post"|"section"|"link"|"material"|"note";
type RoomItem={id:number;class_subject_id:number;item_type:ItemType;title:string|null;body:string|null;url:string|null;visible_to_students?:boolean};
type Assignment={id:number;title:string;type:string;instructions:string|null;class_subject_id:number|null};
type Room={id:number;title:string|null;subject_id:number};
type Subject={id:number;name:string};
type UnitItemLink={subject_room_item_id:number;position:number};
type LinkedResource=
 |{link_id:number;kind:"item";source_id:number;source_label:string;item_type:ItemType;title:string|null;body:string|null;url:string|null}
 |{link_id:number;kind:"assignment";source_id:number;assignment_type:string;title:string;instructions:string|null};
type ResourcePayload={ok?:boolean;resources?:LinkedResource[]};

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:22};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"10px 11px",border:"1px solid #d8d5cd",borderRadius:8,font:"inherit",background:"white"};
const typeLabel:Record<ItemType,string>={post:"Opslag",section:"Sektion",link:"Link",material:"Materiale",note:"Lærernote"};

export default function LessonResources({lessonId,classId,classSubjectId,canEdit}:{lessonId:number|null;classId:number;classSubjectId?:number|null;canEdit:boolean}){
 const params=useParams<{scheduleId:string}>();
 const scheduleId=Number(params.scheduleId);
 const[resolvedClassSubjectId,setResolvedClassSubjectId]=useState<number|null>(classSubjectId??null);
 const[resources,setResources]=useState<LinkedResource[]>([]),[unitMaterials,setUnitMaterials]=useState<RoomItem[]>([]),[items,setItems]=useState<RoomItem[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[rooms,setRooms]=useState<Room[]>([]),[subjects,setSubjects]=useState<Subject[]>([]),[choice,setChoice]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false);

 const load=async()=>{
  if(!lessonId){setResources([]);setUnitMaterials([]);return}
  const[resourceRes,lessonRes]=await Promise.all([
   supabase.rpc("get_lesson_resources",{p_lesson_instance_id:lessonId}),
   supabase.from("lesson_instances").select("subject_unit_id").eq("id",lessonId).maybeSingle()
  ]);
  if(resourceRes.error){setResources([]);setMessage(resourceRes.error.message)}else{const payload=resourceRes.data as ResourcePayload|null;setResources(payload?.ok&&Array.isArray(payload.resources)?payload.resources:[])}
  const unitId=typeof lessonRes.data?.subject_unit_id==="number"?lessonRes.data.subject_unit_id:null;
  if(!unitId){setUnitMaterials([]);return}
  const linkRes=await supabase.from("subject_unit_items").select("subject_room_item_id,position").eq("subject_unit_id",unitId).order("position").order("id");
  if(linkRes.error){setUnitMaterials([]);setMessage(linkRes.error.message);return}
  const unitLinks=(linkRes.data||[]) as UnitItemLink[],ids=unitLinks.map(x=>x.subject_room_item_id);
  if(!ids.length){setUnitMaterials([]);return}
  const itemRes=await supabase.from("subject_room_items").select("id,class_subject_id,item_type,title,body,url,visible_to_students").in("id",ids);
  if(itemRes.error){setUnitMaterials([]);setMessage(itemRes.error.message);return}
  const rows=(itemRes.data||[]) as RoomItem[];
  setUnitMaterials(unitLinks.map(link=>rows.find(item=>item.id===link.subject_room_item_id)).filter(Boolean) as RoomItem[]);
 };

 useEffect(()=>{load()},[lessonId]);
 useEffect(()=>{
  if(typeof classSubjectId==="number"){setResolvedClassSubjectId(classSubjectId);return}
  if(!Number.isFinite(scheduleId)||scheduleId<=0){setResolvedClassSubjectId(null);return}
  let active=true;
  supabase.from("schedule_entries").select("class_subject_id").eq("id",scheduleId).maybeSingle().then(({data})=>{if(active)setResolvedClassSubjectId(typeof data?.class_subject_id==="number"?data.class_subject_id:null)});
  return()=>{active=false};
 },[classSubjectId,scheduleId]);
 useEffect(()=>{if(!canEdit)return;(async()=>{
  const roomQuery=supabase.from("class_subjects").select("id,title,subject_id").eq("active",true);
  const [r,s,a]=await Promise.all([
   resolvedClassSubjectId?roomQuery.eq("id",resolvedClassSubjectId):roomQuery.eq("class_id",classId),
   supabase.from("subjects").select("id,name").eq("active",true),
   supabase.from("assignments").select("id,title,type,instructions,class_subject_id").eq("class_id",classId).order("id",{ascending:false})
  ]);
  const roomRows=(r.data||[]) as Room[];setRooms(roomRows);setSubjects((s.data||[]) as Subject[]);setAssignments((a.data||[]) as Assignment[]);
  const roomIds=roomRows.map(x=>x.id);
  if(roomIds.length){
   const i=await supabase.from("subject_room_items").select("id,class_subject_id,item_type,title,body,url,visible_to_students").in("class_subject_id",roomIds).order("position").order("created_at");
   setItems((i.data||[]) as RoomItem[]);
  }else setItems([]);
 })()},[classId,resolvedClassSubjectId,canEdit]);

 const roomLabel=(roomId:number)=>{const r=rooms.find(x=>x.id===roomId);return r?.title||subjects.find(s=>s.id===r?.subject_id)?.name||"Fag"};
 const linkedItemIds=new Set(resources.filter((x):x is Extract<LinkedResource,{kind:"item"}>=>x.kind==="item").map(x=>x.source_id));
 const linkedAssignmentIds=new Set(resources.filter((x):x is Extract<LinkedResource,{kind:"assignment"}>=>x.kind==="assignment").map(x=>x.source_id));
 const options=[
  ...items.filter(i=>!linkedItemIds.has(i.id)).map(i=>({value:`item:${i.id}`,label:`${roomLabel(i.class_subject_id)} · ${i.title||typeLabel[i.item_type]}`})),
  ...assignments.filter(a=>!linkedAssignmentIds.has(a.id)&&(!resolvedClassSubjectId||!a.class_subject_id||a.class_subject_id===resolvedClassSubjectId)).map(a=>({value:`assignment:${a.id}`,label:`Opgave · ${a.title}`}))
 ].sort((a,b)=>a.label.localeCompare(b.label,"da"));

 async function add(){
  if(!lessonId||!choice)return;const[kind,idText]=choice.split(":");const id=Number(idText);if(!id)return;
  setSaving(true);setMessage("");
  const result=kind==="item"
   ?await supabase.from("lesson_resource_links").insert({lesson_instance_id:lessonId,subject_room_item_id:id,assignment_id:null,position:resources.length})
   :await supabase.from("lesson_resource_links").insert({lesson_instance_id:lessonId,subject_room_item_id:null,assignment_id:id,position:resources.length});
  if(result.error)setMessage(result.error.message);else{setChoice("");setMessage("Koblet til lektionen ✓");await load()}
  setSaving(false);
 }
 async function addUnitMaterial(id:number){
  if(!lessonId||linkedItemIds.has(id)||saving)return;setSaving(true);setMessage("");
  const{error}=await supabase.from("lesson_resource_links").insert({lesson_instance_id:lessonId,subject_room_item_id:id,assignment_id:null,position:resources.length});
  if(error)setMessage(error.message);else{setMessage("Forløbsmaterialet er koblet til timen ✓");await load()}
  setSaving(false);
 }
 async function addAllUnitMaterials(){
  if(!lessonId||saving)return;
  const missing=unitMaterials.filter(item=>!linkedItemIds.has(item.id));
  if(!missing.length)return;setSaving(true);setMessage("");
  const rows=missing.map((item,index)=>({lesson_instance_id:lessonId,subject_room_item_id:item.id,assignment_id:null,position:resources.length+index}));
  const{error}=await supabase.from("lesson_resource_links").insert(rows);
  if(error)setMessage(error.message);else{setMessage(`${missing.length} forløbsmateriale${missing.length===1?"":"r"} koblet til timen ✓`);await load()}
  setSaving(false);
 }
 async function remove(id:number){if(!confirm("Fjern koblingen fra denne lektion? Originalmaterialet eller opgaven bliver ikke slettet."))return;setSaving(true);const{error}=await supabase.from("lesson_resource_links").delete().eq("id",id);if(error)setMessage(error.message);else{setMessage("Fjernet fra lektionen ✓");await load()}setSaving(false)}

 const missingUnitMaterials=unitMaterials.filter(item=>!linkedItemIds.has(item.id));
 return <section style={card}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><strong style={{fontSize:15}}>Koblede materialer og opgaver</strong><p style={{fontSize:13,color:"#747b75",margin:"5px 0 0",lineHeight:1.45}}>De her ting er knyttet til netop denne lektion. Indholdet bliver ikke kopieret.</p></div>{lessonId&&<small style={{fontWeight:900,color:"#718077"}}>{resources.length} KOBLET</small>}</div>

  {!lessonId?<div style={{marginTop:14,padding:"12px 13px",background:"#f5f3ee",borderRadius:9,color:"#687068"}}>Gem lektionen én gang, før du kobler materialer til den.</div>:<>
   {unitMaterials.length>0&&<div style={{marginTop:14,padding:"13px 14px",borderRadius:10,background:"#eef2ed",border:"1px solid #d8e0d9"}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start",flexWrap:"wrap"}}><div><small style={{fontWeight:900,color:"#65766d",letterSpacing:.7}}>FRA FORLØBET</small><strong style={{display:"block",marginTop:3}}>Materialer læreren allerede har samlet i forløbet</strong></div>{canEdit&&missingUnitMaterials.length>1&&<button disabled={saving} onClick={addAllUnitMaterials} style={unitAction}>Kobl alle {missingUnitMaterials.length} til timen</button>}</div><div style={{display:"grid",gap:7,marginTop:10}}>{unitMaterials.map(item=>{const linked=linkedItemIds.has(item.id);return <div key={`unit-${item.id}`} style={{padding:"9px 10px",background:"white",border:"1px solid #d9dfda",borderRadius:8,display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><span><small style={{fontWeight:900,color:"#718077"}}>{typeLabel[item.item_type].toUpperCase()}{item.visible_to_students?" · ELEVSYNLIGT":" · KUN PERSONALE"}</small><strong style={{display:"block",marginTop:2}}>{item.title||typeLabel[item.item_type]}</strong>{item.url&&<a href={item.url} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:4,color:"#486b59",fontWeight:850,fontSize:12}}>Åbn →</a>}</span>{linked?<span style={doneTag}>I timen ✓</span>:canEdit?<button disabled={saving} onClick={()=>addUnitMaterial(item.id)} style={unitAction}>Kobl til timen</button>:null}</div>})}</div></div>}

   {resources.length===0?<div style={{marginTop:14,padding:"12px 13px",background:"#f8f7f3",borderRadius:9,color:"#687068"}}>Der er endnu ikke koblet materiale eller opgaver til denne time.</div>:<div style={{display:"grid",gap:9,marginTop:14}}>{resources.map(r=>r.kind==="item"?<article key={`i-${r.link_id}`} style={{padding:"12px 13px",border:"1px solid #e0ddd5",borderRadius:10,background:"#fbfaf7",position:"relative"}}>{canEdit&&<button onClick={()=>remove(r.link_id)} aria-label="Fjern fra lektionen" style={removeButton}>Fjern fra lektionen</button>}<small style={{fontWeight:900,color:"#718077",paddingRight:120,display:"block"}}>{r.source_label.toUpperCase()} · {typeLabel[r.item_type].toUpperCase()}</small>{r.title&&<strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:4,paddingRight:120}}>{r.title}</strong>}{r.body&&<p style={{margin:"7px 0 0",lineHeight:1.5,color:"#5f675f",whiteSpace:"pre-wrap"}}>{r.body}</p>}{r.url&&<a href={r.url} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:8,color:"#486b59",fontWeight:900}}>Åbn →</a>}</article>:<article key={`a-${r.link_id}`} style={{padding:"12px 13px",border:"1px solid #d7dfd8",borderRadius:10,background:"#eef3ee",position:"relative"}}>{canEdit&&<button onClick={()=>remove(r.link_id)} aria-label="Fjern fra lektionen" style={removeButton}>Fjern fra lektionen</button>}<small style={{fontWeight:900,color:"#65766d",paddingRight:120,display:"block"}}>OPGAVE · {r.assignment_type.toUpperCase()}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:4,paddingRight:120}}>{r.title}</strong>{r.instructions&&<p style={{margin:"7px 0 0",lineHeight:1.5,color:"#5f675f"}}>{r.instructions}</p>}{canEdit&&<Link href={`/teacher-overview?class=${classId}`} style={{display:"inline-block",marginTop:8,color:"#486b59",fontWeight:900,textDecoration:"none"}}>Se opgaven →</Link>}</article>)}</div>}

   {canEdit&&<div style={{borderTop:"1px solid #e1ded7",marginTop:15,paddingTop:14}}><label style={{fontWeight:800,fontSize:13}}>Tilføj fra {resolvedClassSubjectId?"faglokalet":"klassens faglokaler"} eller opgaver<select value={choice} onChange={e=>setChoice(e.target.value)} style={{...input,marginTop:6}}><option value="">Vælg materiale eller opgave</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><button disabled={!choice||saving} onClick={add} style={{marginTop:9,border:0,borderRadius:8,padding:"9px 12px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer",opacity:!choice||saving?0.55:1}}>{saving?"Gemmer…":"Kobl til lektionen"}</button></div>}
  </>}
  {message&&<div style={{marginTop:10,fontSize:13,fontWeight:800,color:message.includes("✓")?"#486b59":"#8b342e"}}>{message}</div>}
 </section>;
}

const removeButton:React.CSSProperties={position:"absolute",right:9,top:9,border:"1px solid #d7d2c8",background:"white",borderRadius:7,padding:"5px 7px",fontSize:11,fontWeight:800,cursor:"pointer",color:"#7d453d"};
const unitAction:React.CSSProperties={border:"1px solid #bfcac1",borderRadius:7,padding:"6px 8px",background:"white",color:"#486b59",fontWeight:850,fontSize:11,cursor:"pointer"};
const doneTag:React.CSSProperties={padding:"5px 7px",borderRadius:999,background:"#e6efe7",color:"#506958",fontWeight:900,fontSize:10,whiteSpace:"nowrap"};
