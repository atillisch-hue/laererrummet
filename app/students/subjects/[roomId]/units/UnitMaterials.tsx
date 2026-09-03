"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../../../lib/supabase";

type ItemType="post"|"section"|"link"|"material"|"note";
type RoomItem={id:number;item_type:ItemType;title:string|null;body:string|null;url:string|null;visible_to_students:boolean;position:number};
type UnitItemLink={id:number;subject_unit_id:number;subject_room_item_id:number;position:number};

type Props={unitId:number;roomId:number;canEdit:boolean};
const labels:Record<ItemType,string>={post:"Opslag",section:"Sektion",link:"Link",material:"Materiale",note:"Lærernote"};
const input:React.CSSProperties={boxSizing:"border-box",padding:"8px 9px",border:"1px solid #d5d1c7",borderRadius:8,background:"white",font:"inherit"};

export default function UnitMaterials({unitId,roomId,canEdit}:Props){
 const[items,setItems]=useState<RoomItem[]>([]),[links,setLinks]=useState<UnitItemLink[]>([]),[choice,setChoice]=useState(""),[saving,setSaving]=useState(false),[message,setMessage]=useState("");

 async function load(){
  const[itemRes,linkRes]=await Promise.all([
   supabase.from("subject_room_items").select("id,item_type,title,body,url,visible_to_students,position").eq("class_subject_id",roomId).neq("item_type","note").order("position").order("created_at"),
   supabase.from("subject_unit_items").select("id,subject_unit_id,subject_room_item_id,position").eq("subject_unit_id",unitId).order("position").order("id")
  ]);
  if(itemRes.error||linkRes.error){setMessage((itemRes.error||linkRes.error)?.message||"Materialerne kunne ikke hentes.");return}
  setItems((itemRes.data||[]) as RoomItem[]);setLinks((linkRes.data||[]) as UnitItemLink[]);
 }
 useEffect(()=>{load()},[unitId,roomId]);

 const linked=useMemo(()=>links.map(link=>({link,item:items.find(item=>item.id===link.subject_room_item_id)})).filter((x):x is {link:UnitItemLink;item:RoomItem}=>!!x.item),[links,items]);
 const linkedIds=useMemo(()=>new Set(links.map(x=>x.subject_room_item_id)),[links]);
 const available=useMemo(()=>items.filter(x=>!linkedIds.has(x.id)),[items,linkedIds]);

 async function add(){
  const id=Number(choice);if(!canEdit||!id||saving)return;setSaving(true);setMessage("");
  const{error}=await supabase.from("subject_unit_items").insert({subject_unit_id:unitId,subject_room_item_id:id,position:links.length});
  if(error)setMessage(error.message);else{setChoice("");setMessage("Materialet er koblet til forløbet ✓");await load()}
  setSaving(false);
 }
 async function remove(linkId:number){
  if(!canEdit||saving||!confirm("Fjern materialet fra forløbet? Originalen bliver i faglokalet."))return;setSaving(true);setMessage("");
  const{error}=await supabase.from("subject_unit_items").delete().eq("id",linkId);
  if(error)setMessage(error.message);else{setMessage("Koblingen er fjernet ✓");await load()}
  setSaving(false);
 }

 return <div style={{borderTop:"1px solid #e4e0d7",paddingTop:10,marginTop:10}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",flexWrap:"wrap"}}><div><small style={eyebrow}>MATERIALER I FORLØBET</small><strong style={{display:"block",marginTop:3}}>{linked.length?`${linked.length} materiale${linked.length===1?"":"r"} koblet`:"Ingen materialer koblet endnu"}</strong></div>{canEdit&&available.length>0&&<div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}><select value={choice} onChange={e=>setChoice(e.target.value)} style={{...input,minWidth:230}}><option value="">+ Vælg fra faglokalet…</option>{available.map(item=><option key={item.id} value={item.id}>{item.title||labels[item.item_type]}</option>)}</select><button disabled={!choice||saving} onClick={add} style={{...smallButton,opacity:(!choice||saving)?0.55:1}}>{saving?"Gemmer…":"Kobl"}</button></div>}</div>
  {linked.length>0&&<div style={{display:"grid",gap:7,marginTop:9}}>{linked.map(({link,item})=><div key={link.id} style={{padding:"9px 10px",background:"#f7f7f3",border:"1px solid #e4e0d7",borderRadius:9}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"start"}}><span><small style={{fontWeight:900,color:"#718077"}}>{labels[item.item_type].toUpperCase()} · {item.visible_to_students?"ELEVSYNLIGT":"KUN PERSONALE"}</small><strong style={{display:"block",marginTop:2}}>{item.title||labels[item.item_type]}</strong>{item.body&&<small style={{display:"block",color:"#707870",marginTop:3,lineHeight:1.4}}>{item.body.length>140?`${item.body.slice(0,140)}…`:item.body}</small>}{item.url&&<a href={item.url} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:4,color:"#486b59",fontWeight:850,fontSize:12}}>Åbn →</a>}</span>{canEdit&&<button disabled={saving} onClick={()=>remove(link.id)} style={removeButton}>Fjern</button>}</div></div>)}</div>}
  {canEdit&&items.length===0&&<small style={{display:"block",marginTop:7,color:"#747b75"}}>Læg først et materiale eller link i faglokalet. Lærernoter vises med vilje ikke her.</small>}
  {message&&<small style={{display:"block",marginTop:7,fontWeight:800,color:message.includes("✓")?"#486b59":"#8b342e"}}>{message}</small>}
 </div>;
}

const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.1,color:"#718077"};
const smallButton:React.CSSProperties={padding:"8px 10px",border:0,borderRadius:8,background:"#486b59",color:"white",fontWeight:900,cursor:"pointer"};
const removeButton:React.CSSProperties={padding:"5px 7px",border:"1px solid #d9d5cc",borderRadius:7,background:"white",color:"#7d453d",fontWeight:800,fontSize:11,cursor:"pointer"};
