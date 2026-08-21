"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { hasRole } from "../../../lib/roles";

type Student={id:number;name:string;class_id:number};
type Klass={id:number;name:string};
type Abs={id:number;student_id:number;absence_date:string;status:string;note:string|null};
const TYPES=[{value:"sick",label:"Syg"},{value:"unexcused",label:"Ulovligt fravær"},{value:"excused",label:"Lovligt fravær"},{value:"left_early",label:"Gået tidligt"},{value:"late",label:"Forsent fremmøde"}];
const label=(s:string)=>TYPES.find(x=>x.value===s)?.label||(s==="absent"?"Fravær":s);

export default function StudentAbsence(){
 const[ready,setReady]=useState(false),[student,setStudent]=useState<Student|null>(null),[klass,setKlass]=useState<Klass|null>(null),[rows,setRows]=useState<Abs[]>([]);
 useEffect(()=>{(async()=>{
  const{data:s}=await supabase.auth.getSession();const user=s.session?.user;if(!user){location.replace("/");return}
  const id=Number(new URLSearchParams(location.search).get("id"));if(!id){location.replace("/students");return}
  const{data:st}=await supabase.from("students").select("id,name,class_id").eq("id",id).single();if(!st){setReady(true);return}
  const admin=hasRole(user,"admin");let ok=admin;if(!admin){const{data:tc}=await supabase.from("teacher_classes").select("class_id").eq("teacher_id",user.id).eq("class_id",st.class_id).maybeSingle();ok=!!tc}
  if(!ok){location.replace("/students");return}
  const[{data:c},{data:a}]=await Promise.all([supabase.from("classes").select("id,name").eq("id",st.class_id).single(),supabase.from("student_absence").select("*").eq("student_id",id).order("absence_date",{ascending:false})]);
  setStudent(st);setKlass(c);setRows((a||[])as Abs[]);setReady(true);
 })()},[]);
 const stats=useMemo(()=>TYPES.map(t=>({label:t.label,count:rows.filter(r=>r.status===t.value).length})),[rows]);
 if(!ready)return <main style={{padding:50}}>Henter fravær…</main>;
 if(!student)return <main style={{padding:50}}>Eleven kunne ikke findes.</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e",padding:"42px 24px 80px"}}><section style={{maxWidth:1000,margin:"0 auto"}}>
  <Link href={`/student-profile?id=${student.id}`} style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← Til {student.name}</Link>
  <p style={{fontSize:11,fontWeight:800,letterSpacing:1.7,color:"#718077",marginTop:38}}>FRAVÆR · {klass?.name?.toUpperCase()}</p>
  <h1 style={{fontFamily:"Georgia,serif",fontSize:42,margin:"8px 0"}}>{student.name}</h1><p style={{color:"#707670",marginBottom:30}}>Fraværshistorik og overblik</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginBottom:26}}>{stats.map(x=><article key={x.label} style={{background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:18}}><strong style={{fontFamily:"Georgia,serif",fontSize:30}}>{x.count}</strong><div style={{color:"#687068",marginTop:5}}>{x.label}</div></article>)}</div>
  <section style={{background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:22}}><h2 style={{fontFamily:"Georgia,serif",marginTop:0}}>Registreringer</h2>{rows.map(r=><div key={r.id} style={{borderTop:"1px solid #eee",padding:"14px 0"}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><strong>{label(r.status)}</strong><span style={{color:"#707670"}}>{new Date(r.absence_date+"T12:00:00").toLocaleDateString("da-DK")}</span></div>{r.note&&<div style={{marginTop:6,color:"#59645e"}}>Note: {r.note}</div>}</div>)}{!rows.length&&<p style={{color:"#777"}}>Ingen fraværsregistreringer endnu.</p>}</section>
 </section></main>;
}
