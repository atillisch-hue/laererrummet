"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {useParams} from "next/navigation";
import {supabase} from "../../../../../lib/supabase";
import SubjectRoomTeachers from "../SubjectRoomTeachers";

type Room={id:number;class_id:number;subject_id:number;title:string|null};
type Klass={id:number;name:string};
type Subject={id:number;name:string};

export default function SubjectRoomUsers(){
 const params=useParams<{roomId:string}>();
 const roomId=Number(params.roomId);
 const[room,setRoom]=useState<Room|null>(null),[klass,setKlass]=useState<Klass|null>(null),[subject,setSubject]=useState<Subject|null>(null),[ready,setReady]=useState(false),[error,setError]=useState("");
 useEffect(()=>{(async()=>{
  if(!Number.isFinite(roomId)||roomId<=0){setError("Fagrummet er ugyldigt.");setReady(true);return}
  const{data:r,error:e}=await supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("id",roomId).maybeSingle();
  if(e||!r){setError("Fagrummet kunne ikke åbnes.");setReady(true);return}
  setRoom(r as Room);
  const[c,s]=await Promise.all([supabase.from("classes").select("id,name").eq("id",r.class_id).maybeSingle(),supabase.from("subjects").select("id,name").eq("id",r.subject_id).maybeSingle()]);
  setKlass((c.data||null) as Klass|null);setSubject((s.data||null) as Subject|null);setReady(true);
 })()},[roomId]);
 if(!ready)return <main style={{padding:50}}>Åbner deltagere…</main>;
 if(!room)return <main style={shell}><section style={{...card,maxWidth:720,margin:"auto"}}><h1>Deltagere kunne ikke åbnes</h1><p>{error}</p><Link href="/teacher-dashboard" style={link}>← Klasser</Link></section></main>;
 return <main style={shell}><section style={{maxWidth:900,margin:"auto"}}>
  <Link href={`/students/subjects/${room.id}`} style={link}>← Til {room.title||subject?.name||"fagrummet"}</Link>
  <p style={{...eyebrow,marginTop:28}}>{(klass?.name||"KLASSE").toUpperCase()} · {(subject?.name||"FAG").toUpperCase()}</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:40,margin:"6px 0 8px"}}>Deltagere</h1>
  <p style={{fontSize:17,color:"#68716c",lineHeight:1.55,maxWidth:720,marginBottom:22}}>Her styrer du, hvilke lærere der kan indrette og redigere dette fagrum. Eleverne følger automatisk klassen og de opgaver, der tildeles; deres adgang ændres ikke her.</p>
  <SubjectRoomTeachers roomId={room.id}/>
 </section></main>;
}

const shell:React.CSSProperties={minHeight:"100vh",background:"#f5f3ee",padding:"34px 24px 80px",color:"#26342e"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:22};
const link:React.CSSProperties={color:"#526b60",fontWeight:850,textDecoration:"none"};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077"};