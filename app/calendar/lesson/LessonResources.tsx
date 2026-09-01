"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";

type ItemType="post"|"section"|"link"|"material"|"note";
type RoomItem={id:number;class_subject_id:number;item_type:ItemType;title:string|null;body:string|null;url:string|null};
type Assignment={id:number;title:string;type:string;instructions:string|null;class_subject_id:number|null};
type Room={id:number;title:string|null;subject_id:number};
type Subject={id:number;name:string};
type LinkedResource=
 |{link_id:number;kind:"item";source_id:number;source_label:string;item_type:ItemType;title:string|null;body:string|null;url:string|null}
 |{link_id:number;kind:"assignment";source_id:number;assignment_type:string;title:string;instructions:string|null};
type ResourcePayload={ok?:boolean;resources?:LinkedResource[]};

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:22};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"10px 11px",border:"1px solid #d8d5cd",borderRadius:8,font:"inherit",background:"white"};
const typeLabel:Record<ItemType,string>={post:"Opslag",section:"Sektion",link:"Link",material:"Materiale",note:"Lærernote"};

export default function LessonResources({lessonId,classId,classSubjectId,canEdit}:{lessonId:number|null;classId:number;classSubjectId?:number|null;canEdit:boolean}){
 const[resources,setResources]=useState<LinkedResource[]>([]),[items,setItems]=useState<RoomItem[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[rooms,setRooms]=useState<Room[]>([]),[subjects,setSubjects]=useState<Subject[]>([]),[choice,setChoice]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false);

 const load=async()=>{
  if(!lessonId){setResources([]);return}
  const{data,error}=await supabase.rpc("get_lesson_resources",{p_lesson_instance_id:lessonId});
  if(error){setResources([]);setMessage(error.message);return}
  const payload=data as ResourcePayload|null;
  setResources(payload?.ok&&Array.isArray(payload.resources)?payload.resources:[]);
 };

 useEffect(()=>{load()},[lessonId]);
 useEffect(()=>{if(!canEdit)return;(async()=>{
  const roomQuery=supabase.from("class_subjects").select("id,title,subject_id").eq("active",true);
  const [r,s,a]=await Promise.all([
   classSubjectId?roomQuery.eq("id",classSubjectId):roomQuery.eq("class_id",classId),
   supabase.from("subjects").select("id,name").eq("active",true),
   supabase.from("assignments").select("id,title,type,instructions,class_subject_id").eq("class_id",classId).order("id",{ascending:false})
  ]);
  const roomRows=(r.data||[]) as Room[];setRooms(roomRows);setSubjects((s.data||[]) as Subject[]);setAssignments((a.data||[]) as Assignment[]);
  const roomIds=roomRows.map(x=>x.id);
  if(roomIds.length){
   const i=await supabase.from("subject_room_items").select("id,class_subject_id,item_type,title,body,url").in("class_subject_id",roomIds).order("position").order("created_at");
   setItems((i.data||[]) as RoomItem[]);
  }else setItems([]);
 })()},[classId,classSubjectId,canEdit]);

 const roomLabel=(roomId:number)=>{const r=rooms.find(x=>x.id===roomId);return r?.title||subjects.find(s=>s.id===r?.subject_id)?.name||"Fag"};
 const linkedItemIds=new Set(resources.filter((x):x is Extract<LinkedResource,{kind:"item"}>=>x.kind==="item").map(x=>x.source_id));
 const linkedAssignmentIds=new Set(resources.filter((x):x is Extract<LinkedResource,{kind:"assignment"}>=>x.kind==="assignment").map(x=>x.source_id));
 const options=[
  ...items.filter(i=>!linkedItemIds.has(i.id)).map(i=>({value:`item:${i.id}`,label:`${roomLabel(i.class_subject_id)} · ${i.title||typeLabel[i.item_type]}`})),
  ...assignments.filter(a=>!linkedAssignmentIds.has(a.id)&&(!classSubjectId||!a.class_subject_id||a.class_subject_id===classSubjectId)).map(a=>({value:`assignment:${a.id}`,label:`Opgave · ${a.title}`}))
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
 async function remove(id:number){setSaving(true);const{error}=await supabase.from("lesson_resource_links").delete().eq("id",id);if(error)setMessage(error.message);else await load();setSaving(false)}

 return <section style={card}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><strong style={{fontSize:15}}>Koblede materialer og opgaver</strong><p style={{fontSize:13,color:"#747b75",margin:"5px 0 0",lineHeight:1.45}}>De her ting er knyttet til netop denne lektion. Indholdet bliver ikke kopieret.</p></div>{lessonId&&<small style={{fontWeight:900,color:"#718077"}}>{resources.length} KOBLET</small>}</div>

  {!lessonId?<div style={{marginTop:14,padding:"12px 13px",background:"#f5f3ee",borderRadius:9,color:"#687068"}}>Gem lektionen én gang, før du kobler materialer til den.</div>:<>
   {resources.length===0?<div style={{marginTop:14,padding:"12px 13px",background:"#f8f7f3",borderRadius:9,color:"#687068"}}>Der er endnu ikke koblet materiale eller opgaver til denne time.</div>:<div style={{display:"grid",gap:9,marginTop:14}}>{resources.map(r=>r.kind==="item"?<article key={`i-${r.link_id}`} style={{padding:"12px 13px",border:"1px solid #e0ddd5",borderRadius:10,background:"#fbfaf7",position:"relative"}}>{canEdit&&<button onClick={()=>remove(r.link_id)} aria-label="Fjern fra lektionen" style={removeButton}>×</button>}<small style={{fontWeight:900,color:"#718077"}}>{r.source_label.toUpperCase()} · {typeLabel[r.item_type].toUpperCase()}</small>{r.title&&<strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:4}}>{r.title}</strong>}{r.body&&<p style={{margin:"7px 0 0",lineHeight:1.5,color:"#5f675f",whiteSpace:"pre-wrap"}}>{r.body}</p>}{r.url&&<a href={r.url} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:8,color:"#486b59",fontWeight:900}}>Åbn →</a>}</article>:<article key={`a-${r.link_id}`} style={{padding:"12px 13px",border:"1px solid #d7dfd8",borderRadius:10,background:"#eef3ee",position:"relative"}}>{canEdit&&<button onClick={()=>remove(r.link_id)} aria-label="Fjern fra lektionen" style={removeButton}>×</button>}<small style={{fontWeight:900,color:"#65766d"}}>OPGAVE · {r.assignment_type.toUpperCase()}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:4}}>{r.title}</strong>{r.instructions&&<p style={{margin:"7px 0 0",lineHeight:1.5,color:"#5f675f"}}>{r.instructions}</p>}{canEdit&&<Link href={`/teacher-overview?class=${classId}`} style={{display:"inline-block",marginTop:8,color:"#486b59",fontWeight:900,textDecoration:"none"}}>Se opgaven →</Link>}</article>)}</div>}

   {canEdit&&<div style={{borderTop:"1px solid #e1ded7",marginTop:15,paddingTop:14}}><label style={{fontWeight:800,fontSize:13}}>Tilføj fra {classSubjectId?"faglokalet":"klassens faglokaler"} eller opgaver<select value={choice} onChange={e=>setChoice(e.target.value)} style={{...input,marginTop:6}}><option value="">Vælg materiale eller opgave</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><button disabled={!choice||saving} onClick={add} style={{marginTop:9,border:0,borderRadius:8,padding:"9px 12px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer",opacity:!choice||saving?0.55:1}}>{saving?"Gemmer…":"Kobl til lektionen"}</button></div>}
  </>}
  {message&&<div style={{marginTop:10,fontSize:13,fontWeight:800,color:message.includes("✓")?"#486b59":"#8b342e"}}>{message}</div>}
 </section>;
}

const removeButton:React.CSSProperties={position:"absolute",right:8,top:7,border:0,background:"transparent",fontSize:18,cursor:"pointer",color:"#687068"};
