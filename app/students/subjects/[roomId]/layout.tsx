"use client";

import Link from "next/link";
import {useEffect,useState,type ReactNode} from "react";
import {useParams} from "next/navigation";
import {supabase} from "../../../../lib/supabase";

type Room={id:number;class_id:number;subject_id:number};
type Subject={id:number;name:string};

export default function SubjectRoomLayout({children}:{children:ReactNode}){
 const params=useParams<{roomId:string}>();
 const roomId=Number(params.roomId);
 const[room,setRoom]=useState<Room|null>(null),[subject,setSubject]=useState<Subject|null>(null);
 useEffect(()=>{(async()=>{
  if(!Number.isFinite(roomId)||roomId<=0)return;
  const{data:r}=await supabase.from("class_subjects").select("id,class_id,subject_id").eq("id",roomId).maybeSingle();
  if(!r)return;setRoom(r as Room);
  const{data:s}=await supabase.from("subjects").select("id,name").eq("id",r.subject_id).maybeSingle();setSubject((s||null) as Subject|null);
 })()},[roomId]);
 const isDanish=(subject?.name||"").trim().toLowerCase()==="dansk";
 return <>
  {room&&<div style={{background:"#edf1ec",borderBottom:"1px solid #d5ddd6"}}><div style={{maxWidth:1050,margin:"auto",padding:"9px 24px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><strong style={{fontSize:12,color:"#65766d",marginRight:3}}>Fagets værktøjer</strong><Link href={`/teacher-overview?class=${room.class_id}`} style={tool}>Opgaver & besvarelser</Link>{isDanish&&<Link href={`/grammar?mode=assign&class=${room.class_id}`} style={tool}>Grammatik</Link>}<Link href={`/create-assignment?class=${room.class_id}&subject=${room.id}`} style={tool}>+ Ny opgave</Link></div></div>}
  {children}
 </>;
}
const tool:React.CSSProperties={textDecoration:"none",color:"#365044",background:"white",border:"1px solid #ccd6ce",borderRadius:8,padding:"6px 9px",fontSize:12,fontWeight:850};
