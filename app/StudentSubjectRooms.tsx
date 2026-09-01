"use client";

import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";

type Item={id:number;item_type:"post"|"section"|"link"|"material";title:string|null;body:string|null;url:string|null;position:number};
type Room={id:number;subject_id:number;subject_name:string;title:string;intro:string|null;items:Item[]};
type Payload={ok?:boolean;error?:string;rooms?:Room[]};

const card:React.CSSProperties={background:"#fff",border:"1px solid #d8d5cd",borderRadius:14,padding:20,color:"#26342e"};
const labels:Record<Item["item_type"],string>={post:"Opslag",section:"Sektion",link:"Link",material:"Materiale"};

export default function StudentSubjectRooms({sessionToken}:{sessionToken:string}){
 const[rooms,setRooms]=useState<Room[]>([]);
 const[openRoom,setOpenRoom]=useState<number|null>(null);
 const[loading,setLoading]=useState(true);

 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!sessionToken){if(active){setRooms([]);setLoading(false)}return}
   const{data,error}=await supabase.rpc("student_session_subject_rooms",{p_session_token:sessionToken});
   if(!active)return;
   const payload=data as Payload|null;
   setRooms(!error&&payload?.ok&&Array.isArray(payload.rooms)?payload.rooms:[]);
   setLoading(false);
  })();
  return()=>{active=false};
 },[sessionToken]);

 if(loading)return <section style={{margin:"28px 0 34px"}}><p className="eyebrow">DINE FAG</p><div style={card}>Henter faglokaler…</div></section>;
 if(rooms.length===0)return null;

 const current=rooms.find(r=>r.id===openRoom)||null;
 if(current)return <section style={{margin:"28px 0 34px"}}>
  <button className="back" onClick={()=>setOpenRoom(null)}>← Dine fag</button>
  <p className="eyebrow">{current.subject_name.toUpperCase()}</p>
  <h2 style={{fontFamily:"Georgia,serif",fontSize:32,margin:"7px 0"}}>{current.title}</h2>
  {current.intro&&<p style={{color:"#667068",fontSize:16,lineHeight:1.55,margin:"0 0 18px"}}>{current.intro}</p>}
  <div style={{display:"grid",gap:12}}>
   {current.items.length===0?<div style={card}><strong>Der er ikke lagt noget ind endnu.</strong></div>:current.items.map(item=><article key={item.id} style={{...card,background:item.item_type==="section"?"#e9eee9":"#fff"}}>
    <small style={{fontWeight:900,color:"#718077",letterSpacing:.7}}>{labels[item.item_type].toUpperCase()}</small>
    {item.title&&<h3 style={{fontFamily:"Georgia,serif",fontSize:item.item_type==="section"?25:21,margin:"7px 0"}}>{item.title}</h3>}
    {item.body&&<p style={{whiteSpace:"pre-wrap",lineHeight:1.6,color:"#555f58",margin:"7px 0"}}>{item.body}</p>}
    {item.url&&<a href={item.url} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:8,color:"#486b59",fontWeight:900}}>Åbn →</a>}
   </article>)}
  </div>
 </section>;

 return <section style={{margin:"28px 0 34px"}}>
  <p className="eyebrow">DINE FAG</p>
  <h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"7px 0"}}>Gå ind i dit faglokale</h2>
  <p style={{color:"#707670",marginTop:0}}>Her ligger det, dine lærere har gjort klar til din klasse.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginTop:16}}>
   {rooms.map(room=><button key={room.id} onClick={()=>setOpenRoom(room.id)} style={{...card,textAlign:"left",cursor:"pointer",font:"inherit"}}>
    <small style={{fontWeight:900,color:"#718077"}}>{room.subject_name.toUpperCase()}</small>
    <strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:23,margin:"7px 0 5px"}}>{room.title}</strong>
    <span style={{display:"block",fontSize:14,lineHeight:1.45,color:"#707670",minHeight:40}}>{room.intro||"Åbn faglokalet og se materialer og opslag."}</span>
    <b style={{display:"block",marginTop:13,color:"#526b60"}}>Åbn →</b>
   </button>)}
  </div>
 </section>;
}
