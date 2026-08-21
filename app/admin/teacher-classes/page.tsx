"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type Klass={id:number;name:string};
type User={id:string;email:string;roles:string[]};
type TeacherClass={teacher_id:string;class_id:number};

export default function TeacherClassesPage(){
 const[ready,setReady]=useState(false),[classes,setClasses]=useState<Klass[]>([]),[teachers,setTeachers]=useState<User[]>([]),[links,setLinks]=useState<TeacherClass[]>([]),[message,setMessage]=useState("");
 async function load(){
  const[c,u,t]=await Promise.all([supabase.from("classes").select("id,name").order("name"),supabase.rpc("admin_user_directory"),supabase.from("teacher_classes").select("teacher_id,class_id")]);
  if(c.error||u.error||t.error){setMessage(`Kunne ikke hente data: ${c.error?.message||u.error?.message||t.error?.message}`);return}
  setClasses((c.data||[]) as Klass[]);
  const users=((u.data||[]) as any[]).map(x=>({...x,roles:Array.isArray(x.roles)?x.roles:[]}));
  setTeachers(users.filter(x=>x.roles.includes("teacher")||x.roles.includes("admin")));
  setLinks((t.data||[]) as TeacherClass[]);
 }
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();const user=data.session?.user;if(!user||!hasRole(user,"admin")){window.location.replace("/");return}await load();setReady(true)})()},[]);
 async function toggle(teacherId:string,classId:number){
  const exists=links.some(x=>x.teacher_id===teacherId&&x.class_id===classId);
  const res=exists?await supabase.from("teacher_classes").delete().eq("teacher_id",teacherId).eq("class_id",classId):await supabase.from("teacher_classes").insert({teacher_id:teacherId,class_id:classId});
  if(res.error){setMessage(`Kunne ikke gemme: ${res.error.message}`);return}
  setMessage("Klassetilknytningen er gemt.");await load();
 }
 if(!ready)return <main style={{padding:50}}>Henter klassetilknytninger…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#486b59",color:"white",padding:"18px 6vw"}}><div style={{maxWidth:1100,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><strong style={{fontSize:22}}>Administration · Lærere & klasser</strong><small style={{display:"block",opacity:.8}}>Tilknyt undervisere til skolens klasser</small></div><Link href="/admin" style={{color:"white",textDecoration:"none",border:"1px solid rgba(255,255,255,.5)",padding:"8px 12px",borderRadius:8}}>← Administration</Link></div></header>
  <section style={{maxWidth:1100,margin:"0 auto",padding:"42px 24px"}}><p className="eyebrow">SKOLESTRUKTUR</p><h1 style={{fontFamily:"Georgia,serif",fontSize:40,margin:"8px 0"}}>Lærere & klasser</h1><p style={{color:"#687068",fontSize:17,maxWidth:760}}>Sæt flueben ved de klasser, den enkelte lærer er tilknyttet. En klasse kan have flere lærere, og en lærer kan være tilknyttet flere klasser.</p>{message&&<div style={{margin:"18px 0",padding:14,background:"#e7eee9",borderRadius:9,fontWeight:700}}>{message}</div>}
  <div style={{display:"grid",gap:16,marginTop:28}}>{teachers.map(t=><article key={t.id} style={{background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:22}}><strong style={{fontSize:18}}>{t.email}</strong><div style={{display:"flex",gap:18,flexWrap:"wrap",marginTop:16}}>{classes.map(c=><label key={c.id} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",padding:"8px 12px",background:"#f7f4ed",borderRadius:8}}><input type="checkbox" checked={links.some(x=>x.teacher_id===t.id&&x.class_id===c.id)} onChange={()=>toggle(t.id,c.id)}/><span>{c.name}</span></label>)}</div></article>)}</div>
  {!teachers.length&&<p>Der er endnu ingen lærere.</p>}
  </section>
 </main>
}
