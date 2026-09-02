"use client";

import Link from "next/link";
import {useEffect,useState,type ReactNode} from "react";
import {supabase} from "../../lib/supabase";

type Room={id:number;class_id:number;subject_id:number;title:string|null};
type Subject={id:number;name:string};
type Klass={id:number;name:string};

export default function GrammarLayout({children}:{children:ReactNode}){
 const[room,setRoom]=useState<Room|null>(null),[subject,setSubject]=useState<Subject|null>(null),[klass,setKlass]=useState<Klass|null>(null);
 useEffect(()=>{(async()=>{
  const roomId=Number(new URLSearchParams(window.location.search).get("room"));
  if(!Number.isFinite(roomId)||roomId<=0)return;
  const{data:r}=await supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("id",roomId).maybeSingle();
  if(!r)return;
  const current=r as Room;setRoom(current);
  const[s,c]=await Promise.all([
   supabase.from("subjects").select("id,name").eq("id",current.subject_id).maybeSingle(),
   supabase.from("classes").select("id,name").eq("id",current.class_id).maybeSingle()
  ]);
  setSubject((s.data||null) as Subject|null);setKlass((c.data||null) as Klass|null);
 })()},[]);
 const roomSuffix=room?`?class=${room.class_id}&room=${room.id}`:"";
 return <>
  <div style={{background:"#263f35",color:"white"}}><div style={{maxWidth:1100,margin:"auto",padding:"9px 24px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><strong style={{fontSize:12,marginRight:4}}>Grammatik & sprog</strong><Link href={`/grammar${roomSuffix}`} style={navLink}>Træningsopgaver</Link><Link href={`/grammar/retskrivningsproeve${roomSuffix}`} style={navLink}>Træn retskrivningsprøven</Link></div></div>
  {room&&<div style={{background:"#edf1ec",borderBottom:"1px solid #d5ddd6"}}><div style={{maxWidth:1100,margin:"auto",padding:"9px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}><div><strong style={{fontSize:12,color:"#365044"}}>{klass?.name||"Klasse"} · {subject?.name||room.title||"Dansk"}</strong><span style={{fontSize:12,color:"#718077"}}> · Grammatik</span></div><Link href={`/students/subjects/${room.id}`} style={{textDecoration:"none",color:"#365044",background:"white",border:"1px solid #ccd6ce",borderRadius:8,padding:"6px 9px",fontSize:12,fontWeight:850}}>← Tilbage til {subject?.name||room.title||"faglokalet"}</Link></div></div>}
  {children}
 </>;
}

const navLink:React.CSSProperties={textDecoration:"none",color:"white",border:"1px solid rgba(255,255,255,.35)",borderRadius:999,padding:"5px 9px",fontSize:12,fontWeight:800};
