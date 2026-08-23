"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";

type Klass={id:number;name:string};
type TeacherClass={teacher_id:string;class_id:number};
const workspaceStyle=(active=false)=>({padding:"10px 14px",borderRadius:9,textDecoration:"none",fontWeight:800 as const,border:active?"1px solid #dfa94f":"1px solid rgba(255,255,255,.22)",background:active?"#dfa94f":"transparent",color:active?"#243d33":"white"});

export default function TeacherDashboard(){
 const[classes,setClasses]=useState<Klass[]>([]),[teacherClasses,setTeacherClasses]=useState<TeacherClass[]>([]),[email,setEmail]=useState("");
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();const user=data.session?.user;if(!user){window.location.href="/?teacher=1";return}setEmail((user.email||"").toLowerCase());const[cRes,tcRes]=await Promise.all([supabase.from("classes").select("id,name").order("name"),supabase.from("teacher_classes").select("teacher_id,class_id").eq("teacher_id",user.id)]);setClasses((cRes.data||[]) as Klass[]);setTeacherClasses((tcRes.data||[]) as TeacherClass[])})()},[]);
 const myClasses=classes.filter(c=>teacherClasses.some(tc=>tc.class_id===c.id));
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"22px 32px"}}><div style={{maxWidth:1180,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",gap:20,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:14}}><span style={{display:"grid",placeItems:"center",width:46,height:46,borderRadius:12,background:"#dfa94f",color:"#243d33",fontSize:22}}>✦</span><div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:25}}>Klasseværelset</strong><small style={{opacity:.75}}>Lærerens undervisningsrum</small></div></div><nav style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/noticeboard" style={workspaceStyle()}>Opslagstavlen</Link><span style={workspaceStyle(true)}>Klasseværelset</span><Link href="/teacher-room" style={workspaceStyle()}>Lærerværelset</Link><Link href="/preparation" style={workspaceStyle()}>Forberedelsen</Link></nav></div></header>
  <section style={{maxWidth:1180,margin:"0 auto",padding:"34px 24px 80px"}}>
   <p style={{fontSize:11,fontWeight:800,letterSpacing:1.7,color:"#718077",marginBottom:8}}>MINE KLASSER</p>
   <h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"0 0 8px"}}>Dine klasser</h1>
   <p style={{fontSize:17,color:"#707670",margin:"0 0 24px"}}>Vælg den klasse, du skal arbejde med.</p>
   {myClasses.length===0?<section style={{background:"#fff",border:"1px solid #ddd9d0",borderRadius:16,padding:24}}><p style={{color:"#707670",margin:0}}>Du er endnu ikke tilknyttet nogen klasser på {email||"din lærerkonto"}.</p></section>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,maxWidth:820}}>{myClasses.map(c=><Link key={c.id} href={`/students?class=${c.id}`} style={{padding:"20px 22px",minHeight:92,borderRadius:14,background:"#fff",border:"1px solid #d8d5cd",color:"#365044",textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"space-between",gap:16}}><div><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:24}}>{c.name}</strong><span style={{display:"block",marginTop:6,fontSize:13,color:"#707670"}}>Fravær, elever og undervisning</span></div><span style={{fontSize:24}}>→</span></Link>)}</div>}
  </section>
 </main>
}
