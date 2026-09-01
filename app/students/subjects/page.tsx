"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type Klass={id:number;name:string;school_id:number|null};
type Subject={id:number;name:string;slug:string};
type Room={id:number;class_id:number;subject_id:number;title:string|null;intro:string|null;active:boolean};
type RoomTeacher={class_subject_id:number;user_id:string};

const slugify=(value:string)=>value.trim().toLowerCase().replace(/[^a-z0-9æøå]+/g,"-").replace(/^-+|-+$/g,"");
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};

export default function ClassSubjectRooms(){
 const search=useSearchParams();
 const classId=Number(search.get("class"));
 const[ready,setReady]=useState(false),[klass,setKlass]=useState<Klass|null>(null),[subjects,setSubjects]=useState<Subject[]>([]),[rooms,setRooms]=useState<Room[]>([]),[teachers,setTeachers]=useState<RoomTeacher[]>([]),[userId,setUserId]=useState(""),[admin,setAdmin]=useState(false),[name,setName]=useState(""),[saving,setSaving]=useState(false),[message,setMessage]=useState("");

 const load=async(uid?:string)=>{
  if(!Number.isFinite(classId)||classId<=0){setMessage("Vælg en klasse først.");setReady(true);return}
  const[cRes,sRes,rRes,tRes]=await Promise.all([
   supabase.from("classes").select("id,name,school_id").eq("id",classId).maybeSingle(),
   supabase.from("subjects").select("id,name,slug").eq("active",true).order("name"),
   supabase.from("class_subjects").select("id,class_id,subject_id,title,intro,active").eq("class_id",classId).eq("active",true).order("id"),
   supabase.from("class_subject_teachers").select("class_subject_id,user_id")
  ]);
  if(cRes.error||!cRes.data){setMessage("Klassen kunne ikke hentes.");setReady(true);return}
  setKlass(cRes.data as Klass);setSubjects((sRes.data||[]) as Subject[]);setRooms((rRes.data||[]) as Room[]);setTeachers((tRes.data||[]) as RoomTeacher[]);if(uid)setUserId(uid);setReady(true);
 };

 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();const user=data.session?.user;if(!user){location.replace("/");return}setUserId(user.id);setAdmin(hasRole(user,"admin"));await load(user.id)})()},[classId]);

 const existingSubjectIds=useMemo(()=>new Set(rooms.map(r=>r.subject_id)),[rooms]);
 const available=subjects.filter(s=>!existingSubjectIds.has(s.id));
 const subjectName=(id:number)=>subjects.find(s=>s.id===id)?.name||"Fag";
 const canEdit=(roomId:number)=>admin||teachers.some(t=>t.class_subject_id===roomId&&t.user_id===userId);

 const createExisting=async(subject:Subject)=>{
  if(!klass?.school_id)return;
  setSaving(true);setMessage("");
  const{error}=await supabase.from("class_subjects").insert({school_id:klass.school_id,class_id:klass.id,subject_id:subject.id,title:subject.name});
  if(error)setMessage(error.message);else await load();setSaving(false);
 };

 const createNew=async()=>{
  const clean=name.trim(),slug=slugify(clean);if(!clean||!slug||!klass?.school_id)return;
  setSaving(true);setMessage("");
  let subject=subjects.find(s=>s.slug===slug)||null;
  if(!subject){
   const{data,error}=await supabase.from("subjects").insert({school_id:klass.school_id,name:clean,slug,created_by:userId}).select("id,name,slug").single();
   if(error){setMessage(error.message);setSaving(false);return}
   subject=data as Subject;
  }
  if(existingSubjectIds.has(subject.id)){setMessage("Klassen har allerede dette fagrum.");setSaving(false);return}
  const{error}=await supabase.from("class_subjects").insert({school_id:klass.school_id,class_id:klass.id,subject_id:subject.id,title:subject.name});
  if(error)setMessage(error.message);else{setName("");await load()}
  setSaving(false);
 };

 if(!ready)return <main style={{padding:50}}>Henter faglokaler…</main>;
 if(!klass)return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:40}}><section style={{...card,maxWidth:700,margin:"auto"}}>{message||"Klassen kunne ikke åbnes."}</section></main>;

 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1050,margin:"auto"}}><Link href={`/students?class=${klass.id}`} style={{color:"#e7ddd0",fontWeight:800,textDecoration:"none"}}>← {klass.name}</Link><p style={{fontSize:11,fontWeight:900,letterSpacing:1.5,opacity:.65,margin:"20px 0 5px"}}>KLASSEVÆRELSET</p><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"0 0 5px"}}>Faglokaler</h1><p style={{margin:0,opacity:.78}}>{klass.name} · hvert fag kan indrettes forskelligt af faglærerne.</p></div></header>

  <section style={{maxWidth:1050,margin:"auto",padding:"30px 24px 80px"}}>
   {message&&<div style={{padding:"12px 14px",background:"#fff3cd",borderRadius:10,marginBottom:14}}>{message}</div>}
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14}}>
    {rooms.map(room=><Link key={room.id} href={`/students/subjects/${room.id}`} style={{...card,textDecoration:"none",color:"inherit",minHeight:155,display:"block"}}><small style={{fontWeight:900,color:"#718077"}}>{canEdit(room.id)?"DIT FAGLOKALE":"FAGLOKALE"}</small><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"8px 0 7px"}}>{room.title||subjectName(room.subject_id)}</h2><p style={{color:"#707670",lineHeight:1.45,minHeight:42,margin:"0 0 14px"}}>{room.intro||"Faglokalet er klar til at blive indrettet."}</p><strong style={{color:"#486b59"}}>Åbn faglokale →</strong></Link>)}
    {rooms.length===0&&<section style={card}><strong>Ingen faglokaler endnu.</strong><p style={{color:"#707670"}}>Opret det første nedenfor.</p></section>}
   </div>

   <section style={{...card,marginTop:22,background:"#eef2ed"}}><p style={{fontSize:11,fontWeight:900,letterSpacing:1.4,color:"#718077",margin:0}}>INDRET KLASSEN</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0"}}>Tilføj faglokale</h2><p style={{color:"#6e766f",margin:"0 0 16px"}}>Brug et fag skolen allerede har, eller opret et nyt fag. Den lærer der opretter rummet bliver automatisk faglærer på det.</p>
    {available.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>{available.map(subject=><button key={subject.id} disabled={saving} onClick={()=>createExisting(subject)} style={secondary}>+ {subject.name}</button>)}</div>}
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nyt fag, fx Engelsk" style={{flex:"1 1 240px",padding:"11px 12px",border:"1px solid #cbc7bd",borderRadius:8,fontSize:15}}/><button disabled={saving||!name.trim()} onClick={createNew} style={{...primary,opacity:saving||!name.trim()?.5:1}}>{saving?"Opretter…":"Opret faglokale"}</button></div>
   </section>
  </section>
 </main>;
}

const primary:React.CSSProperties={border:0,borderRadius:9,padding:"11px 15px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={border:"1px solid #c8d2ca",borderRadius:9,padding:"9px 12px",background:"white",color:"#365044",fontWeight:800,cursor:"pointer"};
