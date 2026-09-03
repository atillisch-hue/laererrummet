"use client";

import {useEffect,useState} from "react";
import {usePathname} from "next/navigation";
import {supabase} from "../../../../lib/supabase";

type Teacher={user_id:string;display_name:string;selected:boolean};

export default function SubjectRoomTeachers({roomId}:{roomId:number}){
 const pathname=usePathname();
 const management=pathname.endsWith("/users");
 const[teachers,setTeachers]=useState<Teacher[]>([]),[selected,setSelected]=useState<string[]>([]),[saving,setSaving]=useState(false),[message,setMessage]=useState("");
 async function load(){
  const{data,error}=await supabase.rpc("class_subject_teacher_directory",{p_class_subject_id:roomId});
  if(error){setMessage(error.message);return}
  const rows=(data||[]) as Teacher[];setTeachers(rows);setSelected(rows.filter(t=>t.selected).map(t=>t.user_id));
 }
 useEffect(()=>{if(management)load()},[roomId,management]);
 const toggle=(id:string)=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 async function save(){
  if(!selected.length){setMessage("Faglokalet skal have mindst én faglærer.");return}
  setSaving(true);setMessage("");
  const{error}=await supabase.rpc("update_class_subject_teachers",{p_class_subject_id:roomId,p_teacher_ids:selected});
  if(error){setMessage(error.message);setSaving(false);return}
  await load();setSaving(false);setMessage("Brugere gemt ✓");
 }
 if(!management)return null;
 const activeCount=teachers.filter(t=>selected.includes(t.user_id)).length;
 return <section style={card}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",gap:14,flexWrap:"wrap"}}><div><small style={eyebrow}>BRUGERE</small><h2 style={{fontFamily:"Georgia,serif",fontSize:26,margin:"5px 0"}}>Hvem må indrette faglokalet?</h2><p style={{fontSize:14,color:"#68716c",lineHeight:1.5,margin:"6px 0 0",maxWidth:680}}>Vælg de lærere, der skal kunne redigere faglokalet, lægge materialer ind og arbejde med fagets indhold. Du kan ændre listen når som helst.</p></div><span style={countChip}>{activeCount} valgt{activeCount===1?"":"e"}</span></div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8,marginTop:18}}>{teachers.map(t=>{const active=selected.includes(t.user_id);return <label key={t.user_id} style={{display:"flex",gap:10,alignItems:"center",padding:"12px 13px",background:active?"#e7eee9":"white",border:active?"2px solid #526b60":"1px solid #ddd9d0",borderRadius:10,cursor:"pointer"}}><input type="checkbox" checked={active} onChange={()=>toggle(t.user_id)}/><strong style={{fontSize:14,overflow:"hidden",textOverflow:"ellipsis"}}>{t.display_name}</strong></label>})}</div>
  <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap",marginTop:18}}><button type="button" disabled={saving||!selected.length} onClick={save} style={{...button,background:"#365044",color:"white",borderColor:"#365044",opacity:saving||!selected.length?.7:1}}>{saving?"Gemmer…":"Gem brugere"}</button>{message&&<span style={{fontSize:13,fontWeight:800,color:message.includes("✓")?"#486b59":"#8a3c34"}}>{message}</span>}</div>
 </section>
}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:22};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,color:"#718077",letterSpacing:1};
const countChip:React.CSSProperties={padding:"6px 9px",borderRadius:999,background:"#edf1ec",color:"#526b60",fontSize:11,fontWeight:900};
const button:React.CSSProperties={border:"1px solid #cdc9c0",background:"white",borderRadius:8,padding:"10px 13px",fontWeight:850,cursor:"pointer",color:"#365044",fontSize:13};
