"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";

type LinkRow={id:number;lesson_instance_id:number;subject_room_item_id:number|null;assignment_id:number|null;position:number};
type RoomItem={id:number;class_subject_id:number;item_type:"post"|"section"|"link"|"material"|"note";title:string|null;body:string|null;url:string|null};
type Assignment={id:number;title:string;type:string;instructions:string|null;class_subject_id:number|null};
type Room={id:number;title:string|null;subject_id:number};
type Subject={id:number;name:string};

type Resource=
 |{kind:"item";link:LinkRow;item:RoomItem;label:string}
 |{kind:"assignment";link:LinkRow;assignment:Assignment};

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:15,padding:22};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"10px 11px",border:"1px solid #d8d5cd",borderRadius:8,font:"inherit",background:"white"};
const typeLabel:Record<RoomItem["item_type"],string>={post:"Opslag",section:"Sektion",link:"Link",material:"Materiale",note:"Lærernote"};

export default function LessonResources({lessonId,classId,canEdit}:{lessonId:number|null;classId:number;canEdit:boolean}){
 const[links,setLinks]=useState<LinkRow[]>([]),[items,setItems]=useState<RoomItem[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[rooms,setRooms]=useState<Room[]>([]),[subjects,setSubjects]=useState<Subject[]>([]),[choice,setChoice]=useState(""),[message,setMessage]=useState(""),[saving,setSaving]=useState(false);

 const load=async()=>{
  if(!lessonId){setLinks([]);return}
  const l=await supabase.from("lesson_resource_links").select("id,lesson_instance_id,subject_room_item_id,assignment_id,position").eq("lesson_instance_id",lessonId).order("position").order("id");
  const linkRows=(l.data||[]) as LinkRow[];setLinks(linkRows);
  const itemIds=linkRows.map(x=>x.subject_room_item_id).filter((x):x is number=>typeof x==="number");
  const assignmentIds=linkRows.map(x=>x.assignment_id).filter((x):x is number=>typeof x==="number");
  const [i,a]=await Promise.all([
   itemIds.length?supabase.from("subject_room_items").select("id,class_subject_id,item_type,title,body,url").in("id",itemIds):Promise.resolve({data:[]}),
   assignmentIds.length?supabase.from("assignments").select("id,title,type,instructions,class_subject_id").in("id",assignmentIds):Promise.resolve({data:[]})
  ]);
  setItems((i.data||[]) as RoomItem[]);setAssignments((a.data||[]) as Assignment[]);
 };

 useEffect(()=>{load()},[lessonId]);
 useEffect(()=>{if(!canEdit)return;(async()=>{
  const [r,s,i,a]=await Promise.all([
   supabase.from("class_subjects").select("id,title,subject_id").eq("class_id",classId).eq("active",true),
   supabase.from("subjects").select("id,name").eq("active",true),
   supabase.from("subject_room_items").select("id,class_subject_id,item_type,title,body,url"),
   supabase.from("assignments").select("id,title,type,instructions,class_subject_id").eq("class_id",classId).order("id",{ascending:false})
  ]);
  const roomRows=(r.data||[]) as Room[];setRooms(roomRows);setSubjects((s.data||[]) as Subject[]);
  const roomIds=new Set(roomRows.map(x=>x.id));setItems(current=>mergeItems(current,((i.data||[]) as RoomItem[]).filter(x=>roomIds.has(x.class_subject_id))));setAssignments(current=>mergeAssignments(current,(a.data||[]) as Assignment[]));
 })()},[classId,canEdit]);

 const roomLabel=(roomId:number)=>{const r=rooms.find(x=>x.id===roomId);return r?.title||subjects.find(s=>s.id===r?.subject_id)?.name||"Fag"};
 const linkedItemIds=new Set(links.map(x=>x.subject_room_item_id).filter(Boolean));
 const linkedAssignmentIds=new Set(links.map(x=>x.assignment_id).filter(Boolean));
 const resources=useMemo<Resource[]>(()=>links.map(link=>{
  if(link.subject_room_item_id){const item=items.find(x=>x.id===link.subject_room_item_id);return item?{kind:"item" as const,link,item,label:roomLabel(item.class_subject_id)}:null}
  if(link.assignment_id){const assignment=assignments.find(x=>x.id===link.assignment_id);return assignment?{kind:"assignment" as const,link,assignment}:null}
  return null;
 }).filter((x):x is Resource=>!!x),[links,items,assignments,rooms,subjects]);

 const options=[
  ...items.filter(i=>rooms.some(r=>r.id===i.class_subject_id)&&!linkedItemIds.has(i.id)).map(i=>({value:`item:${i.id}`,label:`${roomLabel(i.class_subject_id)} · ${i.title||typeLabel[i.item_type]}`})),
  ...assignments.filter(a=>!linkedAssignmentIds.has(a.id)).map(a=>({value:`assignment:${a.id}`,label:`Opgave · ${a.title}`}))
 ].sort((a,b)=>a.label.localeCompare(b.label,"da"));

 async function add(){
  if(!lessonId||!choice)return;const[kind,idText]=choice.split(":");const id=Number(idText);if(!id)return;
  setSaving(true);setMessage("");
  const payload=kind==="item"?{lesson_instance_id:lessonId,subject_room_item_id:id,position:links.length}:{lesson_instance_id:lessonId,assignment_id:id,position:links.length};
  const{error}=await supabase.from("lesson_resource_links").insert(payload);
  if(error)setMessage(error.message);else{setChoice("");setMessage("Koblet til lektionen ✓");await load()}
  setSaving(false);
 }
 async function remove(id:number){setSaving(true);const{error}=await supabase.from("lesson_resource_links").delete().eq("id",id);if(error)setMessage(error.message);else await load();setSaving(false)}

 return <section style={card}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><strong style={{fontSize:15}}>Koblede materialer og opgaver</strong><p style={{fontSize:13,color:"#747b75",margin:"5px 0 0",lineHeight:1.45}}>De her ting er knyttet til netop denne lektion. Indholdet bliver ikke kopieret.</p></div>{lessonId&&<small style={{fontWeight:900,color:"#718077"}}>{resources.length} KOBLET</small>}</div>

  {!lessonId?<div style={{marginTop:14,padding:"12px 13px",background:"#f5f3ee",borderRadius:9,color:"#687068"}}>Gem lektionen én gang, før du kobler materialer til den.</div>:<>
   {resources.length===0?<div style={{marginTop:14,padding:"12px 13px",background:"#f8f7f3",borderRadius:9,color:"#687068"}}>Der er endnu ikke koblet materiale eller opgaver til denne time.</div>:<div style={{display:"grid",gap:9,marginTop:14}}>{resources.map(r=>r.kind==="item"?<article key={`i-${r.link.id}`} style={{padding:"12px 13px",border:"1px solid #e0ddd5",borderRadius:10,background:"#fbfaf7",position:"relative"}}>{canEdit&&<button onClick={()=>remove(r.link.id)} aria-label="Fjern fra lektionen" style={removeButton}>×</button>}<small style={{fontWeight:900,color:"#718077"}}>{r.label.toUpperCase()} · {typeLabel[r.item.item_type].toUpperCase()}</small>{r.item.title&&<strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:4}}>{r.item.title}</strong>}{r.item.body&&<p style={{margin:"7px 0 0",lineHeight:1.5,color:"#5f675f",whiteSpace:"pre-wrap"}}>{r.item.body}</p>}{r.item.url&&<a href={r.item.url} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:8,color:"#486b59",fontWeight:900}}>Åbn →</a>}</article>:<article key={`a-${r.link.id}`} style={{padding:"12px 13px",border:"1px solid #d7dfd8",borderRadius:10,background:"#eef3ee",position:"relative"}}>{canEdit&&<button onClick={()=>remove(r.link.id)} aria-label="Fjern fra lektionen" style={removeButton}>×</button>}<small style={{fontWeight:900,color:"#65766d"}}>OPGAVE · {r.assignment.type.toUpperCase()}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:4}}>{r.assignment.title}</strong>{r.assignment.instructions&&<p style={{margin:"7px 0 0",lineHeight:1.5,color:"#5f675f"}}>{r.assignment.instructions}</p>}<Link href={`/teacher-overview?class=${classId}`} style={{display:"inline-block",marginTop:8,color:"#486b59",fontWeight:900,textDecoration:"none"}}>Se opgaven →</Link></article>)}</div>}

   {canEdit&&<div style={{borderTop:"1px solid #e1ded7",marginTop:15,paddingTop:14}}><label style={{fontWeight:800,fontSize:13}}>Tilføj fra klassens faglokaler eller opgaver<select value={choice} onChange={e=>setChoice(e.target.value)} style={{...input,marginTop:6}}><option value="">Vælg materiale eller opgave</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label><button disabled={!choice||saving} onClick={add} style={{marginTop:9,border:0,borderRadius:8,padding:"9px 12px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer",opacity:!choice||saving?0.55:1}}>{saving?"Gemmer…":"Kobl til lektionen"}</button></div>}
  </>}
  {message&&<div style={{marginTop:10,fontSize:13,fontWeight:800,color:message.includes("✓")?"#486b59":"#8b342e"}}>{message}</div>}
 </section>;
}

const removeButton:React.CSSProperties={position:"absolute",right:8,top:7,border:0,background:"transparent",fontSize:18,cursor:"pointer",color:"#687068"};
function mergeItems(a:RoomItem[],b:RoomItem[]){const map=new Map(a.map(x=>[x.id,x]));b.forEach(x=>map.set(x.id,x));return [...map.values()]}
function mergeAssignments(a:Assignment[],b:Assignment[]){const map=new Map(a.map(x=>[x.id,x]));b.forEach(x=>map.set(x.id,x));return [...map.values()]}
