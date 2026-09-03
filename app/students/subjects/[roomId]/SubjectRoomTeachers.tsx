"use client";

import {useEffect,useState} from "react";
import {supabase} from "../../../../lib/supabase";

type Teacher={user_id:string;display_name:string;selected:boolean};

export default function SubjectRoomTeachers({roomId}:{roomId:number}){
 const[teachers,setTeachers]=useState<Teacher[]>([]),[selected,setSelected]=useState<string[]>([]),[open,setOpen]=useState(false),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
 async function load(){
  const{data,error}=await supabase.rpc("class_subject_teacher_directory",{p_class_subject_id:roomId});
  if(error){setMessage(error.message);return}
  const rows=(data||[]) as Teacher[];setTeachers(rows);setSelected(rows.filter(t=>t.selected).map(t=>t.user_id));
 }
 useEffect(()=>{load()},[roomId]);
 const toggle=(id:string)=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 async function save(){
  if(!selected.length){setMessage("Faglokalet skal have mindst én faglærer.");return}
  setSaving(true);setMessage("");
  const{error}=await supabase.rpc("update_class_subject_teachers",{p_class_subject_id:roomId,p_teacher_ids:selected});
  if(error){setMessage(error.message);setSaving(false);return}
  await load();setOpen(false);setSaving(false);setMessage("Faglærere gemt ✓");
 }
 const linked=teachers.filter(t=>t.selected);
 const preview=linked.slice(0,3).map(t=>t.display_name).join(" · ");
 const extra=Math.max(0,linked.length-3);
 return <section style={card}>
  <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}>
   <div style={{minWidth:0}}><small style={eyebrow}>FAGLÆRERE</small><div style={{marginTop:3,fontSize:13,color:"#59655e",fontWeight:750,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:650}}>{linked.length?`${preview}${extra?` · +${extra} flere`:""}`:"Ingen faglærere"}</div></div>
   <button type="button" onClick={()=>setOpen(v=>!v)} style={button}>{open?"Luk":"Redigér"}</button>
  </div>
  {open&&<div style={{borderTop:"1px solid #dfdcd4",marginTop:12,paddingTop:12}}><p style={{fontSize:13,color:"#6e756f",marginTop:0}}>Vælg de lærere, der må indrette faglokalet og arbejde med fagets indhold. Der skal altid være mindst én.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:7}}>{teachers.map(t=><label key={t.user_id} style={{display:"flex",gap:8,alignItems:"center",padding:"9px 10px",background:selected.includes(t.user_id)?"#e7eee9":"white",border:"1px solid #ddd9d0",borderRadius:8,cursor:"pointer"}}><input type="checkbox" checked={selected.includes(t.user_id)} onChange={()=>toggle(t.user_id)}/><strong style={{fontSize:13,overflow:"hidden",textOverflow:"ellipsis"}}>{t.display_name}</strong></label>)}</div><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:11}}><button type="button" disabled={saving||!selected.length} onClick={save} style={{...button,background:"#365044",color:"white",borderColor:"#365044"}}>{saving?"Gemmer…":"Gem faglærere"}</button><button type="button" onClick={()=>{setSelected(teachers.filter(t=>t.selected).map(t=>t.user_id));setOpen(false);setMessage("")}} style={button}>Annullér</button></div></div>}
  {message&&<div style={{fontSize:12,fontWeight:800,color:message.includes("✓")?"#486b59":"#8a3c34",marginTop:9}}>{message}</div>}
 </section>
}

const card:React.CSSProperties={background:"#f8f7f2",border:"1px solid #ddd9d0",borderRadius:10,padding:"10px 12px"};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,color:"#718077",letterSpacing:.8};
const button:React.CSSProperties={border:"1px solid #cdc9c0",background:"white",borderRadius:8,padding:"6px 9px",fontWeight:800,cursor:"pointer",color:"#365044",fontSize:12};
