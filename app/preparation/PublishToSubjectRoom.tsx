"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";

type Klass={id:number;name:string};
type Subject={id:number;name:string};
type Room={id:number;class_id:number;subject_id:number;title:string|null};
type RoomTeacher={class_subject_id:number;user_id:string};
type ItemType="post"|"section"|"link"|"material";

const input:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"11px 12px",border:"1px solid #cbc7bd",borderRadius:8,font:"inherit",background:"white"};

export default function PublishToSubjectRoom(){
 const[rooms,setRooms]=useState<Room[]>([]),[classes,setClasses]=useState<Klass[]>([]),[subjects,setSubjects]=useState<Subject[]>([]),[roomTeachers,setRoomTeachers]=useState<RoomTeacher[]>([]),[userId,setUserId]=useState(""),[admin,setAdmin]=useState(false),[roomId,setRoomId]=useState<number|"">(""),[type,setType]=useState<ItemType>("post"),[title,setTitle]=useState(""),[body,setBody]=useState(""),[url,setUrl]=useState(""),[visible,setVisible]=useState(true),[saving,setSaving]=useState(false),[message,setMessage]=useState("");

 useEffect(()=>{(async()=>{
  const{data:auth}=await supabase.auth.getSession();const user=auth.session?.user;if(!user)return;
  setUserId(user.id);setAdmin(hasRole(user,"admin"));
  const[r,c,s,t]=await Promise.all([
   supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("active",true),
   supabase.from("classes").select("id,name").order("name"),
   supabase.from("subjects").select("id,name").eq("active",true).order("name"),
   supabase.from("class_subject_teachers").select("class_subject_id,user_id")
  ]);
  setRooms((r.data||[]) as Room[]);setClasses((c.data||[]) as Klass[]);setSubjects((s.data||[]) as Subject[]);setRoomTeachers((t.data||[]) as RoomTeacher[]);
 })()},[]);

 const editable=useMemo(()=>rooms.filter(r=>admin||roomTeachers.some(t=>t.class_subject_id===r.id&&t.user_id===userId)),[rooms,roomTeachers,userId,admin]);
 const roomLabel=(room:Room)=>`${classes.find(c=>c.id===room.class_id)?.name||"Klasse"} · ${room.title||subjects.find(s=>s.id===room.subject_id)?.name||"Fag"}`;

 async function publish(){
  if(!roomId||(!title.trim()&&!body.trim()&&!url.trim()))return;
  setSaving(true);setMessage("");
  const{data:last,error:lastError}=await supabase.from("subject_room_items").select("position").eq("class_subject_id",roomId).order("position",{ascending:false}).limit(1).maybeSingle();
  if(lastError){setMessage(`Kunne ikke finde placering: ${lastError.message}`);setSaving(false);return}
  const nextPosition=(typeof last?.position==="number"?last.position:-1)+1;
  const{error}=await supabase.from("subject_room_items").insert({class_subject_id:roomId,item_type:type,title:title.trim()||null,body:body.trim()||null,url:url.trim()||null,position:nextPosition,visible_to_students:visible});
  if(error)setMessage(`Kunne ikke sende: ${error.message}`);else{setMessage("Sendt til faglokalet ✓");setTitle("");setBody("");setUrl("")}
  setSaving(false);
 }

 return <section style={{marginTop:18,background:"#fff",border:"1px solid #dfdcd4",borderRadius:14,padding:20}}>
  <p style={{fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#65766d",margin:"0 0 5px"}}>FRA FORBEREDELSEN TIL KLASSEN</p>
  <h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"0 0 6px"}}>Send til et faglokale</h2>
  <p style={{color:"#687068",margin:"0 0 16px",lineHeight:1.5}}>Lav et hurtigt opslag, materiale eller link her og læg det direkte ind i klassens faglokale. Du ser kun de rum, du selv må redigere.</p>

  {editable.length===0?<div style={{padding:"12px 14px",background:"#f5f3ee",borderRadius:9,color:"#687068"}}>Du har endnu ingen faglokaler, du kan redigere. Opret et under Klasseværelset først.</div>:<>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
    <label style={{fontWeight:800}}>Faglokale<select value={roomId} onChange={e=>setRoomId(e.target.value?Number(e.target.value):"")} style={{...input,marginTop:6}}><option value="">Vælg klasse og fag</option>{editable.sort((a,b)=>roomLabel(a).localeCompare(roomLabel(b),"da")).map(r=><option key={r.id} value={r.id}>{roomLabel(r)}</option>)}</select></label>
    <label style={{fontWeight:800}}>Type<select value={type} onChange={e=>setType(e.target.value as ItemType)} style={{...input,marginTop:6}}><option value="post">Opslag</option><option value="section">Sektion</option><option value="material">Materiale</option><option value="link">Link</option></select></label>
   </div>
   <label style={{fontWeight:800,display:"block",marginTop:10}}>Titel<input value={title} onChange={e=>setTitle(e.target.value)} style={{...input,marginTop:6}} placeholder="Fx Læs til torsdag"/></label>
   <label style={{fontWeight:800,display:"block",marginTop:10}}>Tekst<textarea value={body} onChange={e=>setBody(e.target.value)} rows={5} style={{...input,marginTop:6}} placeholder="Skriv det, eleverne skal se…"/></label>
   {(type==="link"||type==="material")&&<label style={{fontWeight:800,display:"block",marginTop:10}}>Link<input value={url} onChange={e=>setUrl(e.target.value)} style={{...input,marginTop:6}} placeholder="https://…"/></label>}
   <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap",marginTop:13}}><label style={{display:"flex",gap:8,alignItems:"center",fontWeight:800}}><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/> Synligt for elever</label><button disabled={saving||!roomId||(!title.trim()&&!body.trim()&&!url.trim())} onClick={publish} style={{border:0,borderRadius:9,padding:"11px 15px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer",opacity:saving||!roomId?0.55:1}}>{saving?"Sender…":"Send til faglokale →"}</button></div>
  </>}
  {message&&<div style={{marginTop:12,padding:"10px 12px",borderRadius:8,background:message.includes("✓")?"#e7eee9":"#fff3cd",fontWeight:700}}>{message}</div>}
 </section>;
}
