"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type AuditEvent={id:number;school_id:number;actor_user_id:string|null;actor_name:string;action:string;entity_type:string;entity_id:string|null;metadata:Record<string,unknown>;created_at:string};
type DirectoryUser={id:string;email:string;roles:unknown};
type Student={id:number;name:string};

const roleLabel:Record<string,string>={teacher:"Lærer",staff:"Personale",leader:"Ledelse",admin:"Admin",parent:"Forælder",board:"Bestyrelse",student:"Elev"};
const actionLabel:Record<string,string>={
 user_roles_replaced:"Roller ændret",
 user_access_status_changed:"Adgangsstatus ændret",
 parent_student_linked:"Forælder koblet til elev",
 parent_student_unlinked:"Forælder fjernet fra elev",
 student_access_issued:"Elevkode oprettet",
 student_access_rotated:"Elevkode fornyet",
 schedule_published:"Skema publiceret"
};

const shell:React.CSSProperties={maxWidth:1100,margin:"auto",padding:"38px 24px 80px"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:17};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};

export default function SecurityHistoryPage(){
 const[ready,setReady]=useState(false),[events,setEvents]=useState<AuditEvent[]>([]),[users,setUsers]=useState<DirectoryUser[]>([]),[students,setStudents]=useState<Student[]>([]),[error,setError]=useState("");

 useEffect(()=>{let live=true;(async()=>{
  const{data}=await supabase.auth.getSession();const user=data.session?.user;
  if(!user){location.replace("/");return}
  if(!hasRole(user,"admin")){location.replace("/admin");return}
  const[auditRes,userRes,studentRes]=await Promise.all([
   supabase.rpc("admin_security_audit_events",{p_limit:250}),
   supabase.rpc("admin_user_directory"),
   supabase.from("students").select("id,name").order("name")
  ]);
  if(!live)return;
  if(auditRes.error)setError("Sikkerhedsloggen kunne ikke hentes.");
  setEvents((auditRes.data||[]) as AuditEvent[]);
  setUsers((userRes.data||[]) as DirectoryUser[]);
  setStudents((studentRes.data||[]) as Student[]);
  setReady(true);
 })();return()=>{live=false}},[]);

 const userMap=useMemo(()=>new Map(users.map(user=>[user.id,user.email])),[users]);
 const studentMap=useMemo(()=>new Map(students.map(student=>[student.id,student.name])),[students]);
 const describe=(event:AuditEvent)=>{
  const meta=event.metadata||{};
  if(event.action==="user_roles_replaced"){
   const target=String(meta.target_user_id||event.entity_id||"");
   const oldRoles=Array.isArray(meta.old_roles)?meta.old_roles.map(r=>roleLabel[String(r)]||String(r)).join(", "):"—";
   const newRoles=Array.isArray(meta.new_roles)?meta.new_roles.map(r=>roleLabel[String(r)]||String(r)).join(", "):"—";
   return `${userMap.get(target)||"Bruger"}: ${oldRoles} → ${newRoles}`;
  }
  if(event.action==="user_access_status_changed"){
   const target=String(meta.target_user_id||event.entity_id||"");
   return `${userMap.get(target)||"Bruger"}: ${meta.new_active?"adgang aktiveret":"adgang deaktiveret"}`;
  }
  if(event.action==="parent_student_linked"||event.action==="parent_student_unlinked"){
   const studentId=Number(meta.student_id);const parentId=String(meta.parent_user_id||"");
   return `${studentMap.get(studentId)||`Elev #${studentId}`} · ${userMap.get(parentId)||"forældrekonto"}`;
  }
  if(event.action==="student_access_issued"||event.action==="student_access_rotated"){
   const studentId=Number(meta.student_id||event.entity_id);
   return `${studentMap.get(studentId)||`Elev #${studentId}`} · ${meta.code_length?`${meta.code_length} tegn`:"sikker elevadgang"}`;
  }
  if(event.action==="schedule_published"){
   const date=typeof meta.effective_from==="string"?new Date(`${meta.effective_from}T12:00:00`).toLocaleDateString("da-DK"):null;
   return `Skemaversion ${String(meta.schedule_version_id||event.entity_id||"")}${date?` · gælder fra ${date}`:""}`;
  }
  return "Sikkerhedsrelevant ændring";
 };

 if(!ready)return <main style={shell}>Henter sikkerhedshistorik…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"22px 6vw"}}><div style={{maxWidth:1100,margin:"auto",display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap"}}><div><small style={{fontWeight:900,letterSpacing:1.3}}>ADMINISTRATION · SIKKERHED</small><h1 style={{fontFamily:"Georgia,serif",fontSize:35,margin:"5px 0 0"}}>Sikkerhed & historik</h1></div><Link href="/admin" style={{color:"white",fontWeight:850,textDecoration:"none"}}>← Administration</Link></div></header>
  <section style={shell}>
   <section style={{...card,background:"#e9eee9"}}><p style={eyebrow}>APPEND-ONLY</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0 7px"}}>Vigtige ændringer kan spores</h2><p style={{margin:0,color:"#59655e",lineHeight:1.55}}>Loggen registrerer udvalgte sikkerhedsrelevante ændringer med aktør og tidspunkt. Den kan ikke redigeres eller slettes gennem appen og gemmer aldrig adgangskoder, elevkoder, kode-hashes, beskedindhold eller følsomme noter.</p></section>
   {error&&<div style={{...card,marginTop:14,background:"#fff0ed",color:"#7b3b32",fontWeight:800}}>{error}</div>}
   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"end",marginTop:24,flexWrap:"wrap"}}><div><p style={eyebrow}>HISTORIK</p><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"5px 0 0"}}>Seneste sikkerhedshændelser</h2></div><span style={{fontSize:12,color:"#687068",fontWeight:800}}>{events.length} vist</span></div>
   <div style={{display:"grid",gap:9,marginTop:13}}>{events.length===0?<section style={card}><strong>Ingen hændelser endnu</strong><p style={{margin:"5px 0 0",color:"#687068"}}>Sikkerhedsloggen er ny og registrerer hændelser fra nu af.</p></section>:events.map(event=><article key={event.id} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><small style={{fontWeight:900,letterSpacing:.8,color:"#607269"}}>{actionLabel[event.action]?.toUpperCase()||event.action.toUpperCase()}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:5}}>{describe(event)}</strong><small style={{display:"block",marginTop:6,color:"#707870"}}>Udført af {event.actor_name||"Ukendt/system"}</small></div><time style={{fontSize:12,color:"#737a74",whiteSpace:"nowrap"}} dateTime={event.created_at}>{new Date(event.created_at).toLocaleString("da-DK",{dateStyle:"medium",timeStyle:"short"})}</time></div></article>)}</div>
  </section>
 </main>;
}
