"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type User={id:string;email:string;roles:string[]};

export default function BoardUsersPage(){
 const[ready,setReady]=useState(false),[schoolId,setSchoolId]=useState<number|null>(null),[users,setUsers]=useState<User[]>([]),[message,setMessage]=useState("");
 async function load(){const{data,error}=await supabase.rpc("admin_user_directory");if(error){setMessage("Brugerne kunne ikke hentes: "+error.message);return}setUsers(((data||[]) as any[]).map(x=>({...x,roles:Array.isArray(x.roles)?x.roles:[]})))}
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();const user=data.session?.user;if(!user||!hasRole(user,"admin")){window.location.replace("/");return}const{data:m}=await supabase.from("school_memberships").select("school_id").eq("user_id",user.id).eq("role","admin").eq("active",true).limit(1).maybeSingle();setSchoolId(m?.school_id||null);await load();setReady(true)})()},[]);
 async function setBoard(user:User,enabled:boolean){
  const roles=enabled?Array.from(new Set([...user.roles,"board"])):user.roles.filter(r=>r!=="board");
  const{data}=await supabase.auth.getSession();const token=data.session?.access_token;if(!token){setMessage("Din session er udløbet. Log ind igen.");return}
  const body=!enabled&&roles.length===0?{id:user.id,school_id:schoolId,disabled:true}:{id:user.id,school_id:schoolId,roles};
  const res=await fetch("/api/admin/manage-user",{method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(body)});const result=await res.json();if(!res.ok){setMessage(result.error||"Rollen kunne ikke gemmes.");return}
  setMessage(enabled?`${user.email} er nu bestyrelsesmedlem.`:roles.length?`Bestyrelsesrollen er fjernet fra ${user.email}.`:`Bestyrelsesrollen var brugerens sidste rolle. Skoleadgangen er derfor deaktiveret, mens historikken er bevaret.`);await load()
 }
 if(!ready)return <main style={{padding:50}}>Henter brugere…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}><header style={{background:"#486b59",color:"white",padding:"18px 6vw"}}><div style={{maxWidth:1000,margin:"auto",display:"flex",justifyContent:"space-between",alignItems:"center"}}><strong style={{fontSize:22}}>Administration · Bestyrelsen</strong><Link href="/admin" style={{color:"white",textDecoration:"none"}}>← Administration</Link></div></header><section style={{maxWidth:1000,margin:"auto",padding:"48px 24px"}}><p style={{fontSize:11,fontWeight:800,letterSpacing:1.7,color:"#718077"}}>ROLLER</p><h1 style={{fontFamily:"Georgia,serif",fontSize:42,margin:"8px 0"}}>Bestyrelsesmedlemmer</h1><p style={{fontSize:18,color:"#687068",maxWidth:720,lineHeight:1.5}}>Tildel eller fjern bestyrelsesadgang på eksisterende brugere. En bruger kan godt have flere roller samtidig. Hvis den sidste rolle fjernes, deaktiveres skoleadgangen i stedet for at kontoen slettes.</p>{message&&<div style={{margin:"20px 0",padding:14,background:"#e7eee9",borderRadius:9,fontWeight:700}}>{message}</div>}<div style={{background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:24,marginTop:28}}>{users.map(u=>{const board=u.roles.includes("board");return <div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:18,padding:"15px 0",borderTop:"1px solid #eee",flexWrap:"wrap"}}><div><strong>{u.email}</strong><small style={{display:"block",color:"#777",marginTop:4}}>{u.roles.length?u.roles.join(" · "):"Ingen roller"}</small></div><label style={{display:"flex",alignItems:"center",gap:9,fontWeight:700,cursor:"pointer"}}><input type="checkbox" checked={board} onChange={e=>setBoard(u,e.target.checked)}/> Bestyrelsesmedlem</label></div>})}</div></section></main>
}
