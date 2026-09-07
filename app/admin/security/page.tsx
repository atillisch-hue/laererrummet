"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type AuditEvent={id:number;school_id:number;actor_user_id:string|null;actor_name:string;action:string;entity_type:string;entity_id:string|null;metadata:Record<string,unknown>;created_at:string};
type DirectoryUser={id:string;email:string;roles:unknown};
type Student={id:number;name:string};
type RetentionRow={category:string;record_count:number;oldest_at:string|null;newest_at:string|null;policy_status:string;readiness:string;retention_anchor:string;note:string};
type RetentionPreview={category:string;cutoff_at:string;candidate_count:number;oldest_candidate_at:string|null;newest_candidate_at:string|null;readiness:string;note:string};

const roleLabel:Record<string,string>={teacher:"Lærer",staff:"Personale",leader:"Ledelse",admin:"Admin",parent:"Forælder",board:"Bestyrelse",student:"Elev"};
const actionLabel:Record<string,string>={
 user_roles_replaced:"Roller ændret",
 user_access_status_changed:"Adgangsstatus ændret",
 parent_student_linked:"Forælder koblet til elev",
 parent_student_unlinked:"Forælder fjernet fra elev",
 student_access_issued:"Elevkode oprettet",
 student_access_rotated:"Elevkode fornyet",
 schedule_published:"Skema publiceret",
 school_file_uploaded:"Dokument uploadet",
 school_file_deleted:"Dokument slettet",
 school_file_archived:"Dokument arkiveret",
 school_file_unarchived:"Dokument gendannet fra arkiv",
 school_file_metadata_updated:"Dokumentoplysninger ændret",
 school_file_accessed:"Dokument tilgået"
};

const shell:React.CSSProperties={maxWidth:1100,margin:"auto",padding:"38px 24px 80px"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:17};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};

function formatDate(value:string|null){
 if(!value)return "Ingen data";
 return new Date(value).toLocaleDateString("da-DK",{dateStyle:"medium"});
}

export default function SecurityHistoryPage(){
 const[ready,setReady]=useState(false),[events,setEvents]=useState<AuditEvent[]>([]),[users,setUsers]=useState<DirectoryUser[]>([]),[students,setStudents]=useState<Student[]>([]),[retention,setRetention]=useState<RetentionRow[]>([]),[schoolId,setSchoolId]=useState<number|null>(null),[error,setError]=useState("");
 const[previewCategory,setPreviewCategory]=useState(""),[previewDate,setPreviewDate]=useState(""),[preview,setPreview]=useState<RetentionPreview|null>(null),[previewing,setPreviewing]=useState(false),[previewError,setPreviewError]=useState("");

 useEffect(()=>{let live=true;(async()=>{
  const{data}=await supabase.auth.getSession();const user=data.session?.user;
  if(!user){location.replace("/");return}
  if(!hasRole(user,"admin")){location.replace("/admin");return}
  const membershipRes=await supabase.from("school_memberships").select("school_id").eq("user_id",user.id).eq("role","admin").eq("active",true).order("school_id").limit(1).maybeSingle();
  const activeSchoolId=membershipRes.data?.school_id?Number(membershipRes.data.school_id):null;
  setSchoolId(activeSchoolId);
  const[auditRes,userRes,studentRes,retentionRes]=await Promise.all([
   supabase.rpc("admin_security_audit_events",{p_limit:250}),
   supabase.rpc("admin_user_directory"),
   supabase.from("students").select("id,name").order("name"),
   activeSchoolId?supabase.rpc("admin_retention_inventory",{p_school_id:activeSchoolId}):Promise.resolve({data:[],error:null})
  ]);
  if(!live)return;
  if(auditRes.error)setError("Sikkerhedsloggen kunne ikke hentes.");
  if(retentionRes.error)setError(current=>current||"Dataopbevarings-overblikket kunne ikke hentes.");
  setEvents((auditRes.data||[]) as AuditEvent[]);
  setUsers((userRes.data||[]) as DirectoryUser[]);
  setStudents((studentRes.data||[]) as Student[]);
  const retentionRows=(retentionRes.data||[]) as RetentionRow[];
  setRetention(retentionRows);
  const firstReady=retentionRows.find(row=>row.readiness==="ready_for_policy");
  if(firstReady)setPreviewCategory(firstReady.category);
  setReady(true);
 })();return()=>{live=false}},[]);

 const userMap=useMemo(()=>new Map(users.map(user=>[user.id,user.email])),[users]);
 const studentMap=useMemo(()=>new Map(students.map(student=>[student.id,student.name])),[students]);
 const previewableCategories=useMemo(()=>retention.filter(row=>row.readiness==="ready_for_policy").map(row=>row.category),[retention]);
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
  if(event.action.startsWith("school_file_")){
   const kind=String(meta.access_kind||"");
   return `${actionLabel[event.action]||"Dokumenthændelse"}${kind?` · ${kind==="download"?"download":"åbning"}`:""}`;
  }
  return "Sikkerhedsrelevant ændring";
 };

 const runPreview=async()=>{
  if(!schoolId||!previewCategory||!previewDate)return;
  setPreviewing(true);setPreview(null);setPreviewError("");
  const cutoff=new Date(`${previewDate}T00:00:00`).toISOString();
  const{data,error:rpcError}=await supabase.rpc("admin_retention_preview",{p_school_id:schoolId,p_category:previewCategory,p_cutoff_at:cutoff});
  if(rpcError)setPreviewError("Simuleringen kunne ikke gennemføres. Kontroller MFA-sessionen og prøv igen.");
  else setPreview(((data||[])[0]||null) as RetentionPreview|null);
  setPreviewing(false);
 };

 if(!ready)return <main style={shell}>Henter sikkerhedshistorik…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"22px 6vw"}}><div style={{maxWidth:1100,margin:"auto",display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap"}}><div><small style={{fontWeight:900,letterSpacing:1.3}}>ADMINISTRATION · SIKKERHED</small><h1 style={{fontFamily:"Georgia,serif",fontSize:35,margin:"5px 0 0"}}>Sikkerhed & historik</h1></div><Link href="/admin" style={{color:"white",fontWeight:850,textDecoration:"none"}}>← Administration</Link></div></header>
  <section style={shell}>
   <section style={{...card,background:"#e9eee9"}}><p style={eyebrow}>APPEND-ONLY</p><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"6px 0 7px"}}>Vigtige ændringer kan spores</h2><p style={{margin:0,color:"#59655e",lineHeight:1.55}}>Loggen registrerer udvalgte sikkerhedsrelevante ændringer med aktør og tidspunkt. Den kan ikke redigeres eller slettes gennem appen og gemmer aldrig adgangskoder, elevkoder, kode-hashes, beskedindhold eller følsomme noter.</p></section>
   {error&&<div style={{...card,marginTop:14,background:"#fff0ed",color:"#7b3b32",fontWeight:800}}>{error}</div>}

   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"end",marginTop:26,flexWrap:"wrap"}}><div><p style={eyebrow}>DATAOPBEVARING</p><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"5px 0 0"}}>Hvad gemmer skolen?</h2></div><span style={{fontSize:12,color:"#687068",fontWeight:800}}>Kun overblik · ingen automatisk sletning</span></div>
   <section style={{...card,marginTop:12,background:"#fff8e8"}}><strong>Opbevaringsfrister er endnu ikke fastlagt</strong><p style={{margin:"6px 0 0",color:"#6b675e",lineHeight:1.5}}>Klasseværelset viser her datakategorier, antal og alder, men sletter ikke noget automatisk. Frister skal først besluttes og dokumenteres af skolen pr. datatype. En grøn markering betyder kun, at kategorien allerede har en sikker dato, som en fremtidig regel kan beregnes fra.</p></section>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:10,marginTop:10}}>{retention.map(row=>{const lifecycleReady=row.readiness==="ready_for_policy";return <article key={row.category} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><strong style={{fontFamily:"Georgia,serif",fontSize:18}}>{row.category}</strong><span style={{fontSize:10,fontWeight:900,borderRadius:999,padding:"4px 7px",background:lifecycleReady?"#e9eee9":"#fff3df",color:lifecycleReady?"#365044":"#7a5a24",whiteSpace:"nowrap"}}>{lifecycleReady?"KLAR TIL REGEL":"LIVSCYKLUS MANGLER"}</span></div><div style={{fontSize:28,fontWeight:900,marginTop:12}}>{row.record_count}</div><small style={{display:"block",color:"#687068",marginTop:2}}>poster</small><dl style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"5px 9px",fontSize:12,margin:"13px 0 0",color:"#667068"}}><dt>Ældste</dt><dd style={{margin:0,fontWeight:800}}>{formatDate(row.oldest_at)}</dd><dt>Nyeste</dt><dd style={{margin:0,fontWeight:800}}>{formatDate(row.newest_at)}</dd><dt>Grundlag</dt><dd style={{margin:0,fontWeight:800}}>{row.retention_anchor}</dd><dt>Frist</dt><dd style={{margin:0,fontWeight:800}}>Ikke fastlagt</dd></dl></article>})}</div>

   <section style={{...card,marginTop:14,border:"1px solid #cfd8d0"}}><p style={eyebrow}>DRY-RUN</p><h3 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"5px 0 7px"}}>Simulér en skæringsdato</h3><p style={{margin:"0 0 14px",color:"#647068",lineHeight:1.5}}>Dette er kun en optælling. Der findes ingen sletteknap, og simuleringen ændrer ingen data.</p><div style={{display:"flex",gap:10,alignItems:"end",flexWrap:"wrap"}}><label style={{display:"grid",gap:5,fontSize:12,fontWeight:850}}>Datakategori<select value={previewCategory} onChange={event=>{setPreviewCategory(event.target.value);setPreview(null)}} style={{minWidth:230,padding:"9px 10px",border:"1px solid #cfcac0",borderRadius:8,background:"white"}}>{previewableCategories.map(category=><option key={category} value={category}>{category}</option>)}</select></label><label style={{display:"grid",gap:5,fontSize:12,fontWeight:850}}>Hypotetisk skæringsdato<input type="date" value={previewDate} onChange={event=>{setPreviewDate(event.target.value);setPreview(null)}} style={{padding:"8px 10px",border:"1px solid #cfcac0",borderRadius:8}}/></label><button type="button" onClick={runPreview} disabled={!previewCategory||!previewDate||previewing} style={{padding:"10px 14px",border:0,borderRadius:8,background:"#486b59",color:"white",fontWeight:900,cursor:previewCategory&&previewDate&&!previewing?"pointer":"not-allowed",opacity:previewCategory&&previewDate?1:.55}}>{previewing?"Beregner…":"Vis kandidater"}</button></div>{previewError&&<p style={{margin:"12px 0 0",color:"#8a4339",fontWeight:800}}>{previewError}</p>}{preview&&<div style={{marginTop:14,padding:14,borderRadius:10,background:"#eef2ee"}}><strong style={{fontFamily:"Georgia,serif",fontSize:20}}>{preview.candidate_count} poster ville være kandidater</strong><p style={{margin:"6px 0 0",color:"#5f6a63"}}>Fra {formatDate(preview.oldest_candidate_at)} til {formatDate(preview.newest_candidate_at)} · før {formatDate(preview.cutoff_at)}.</p><p style={{margin:"6px 0 0",fontSize:12,color:"#687068"}}>{preview.note}</p><strong style={{display:"block",marginTop:9,fontSize:11,color:"#775f2e"}}>SIMULERING · INGEN DATA ER SLETTET</strong></div>}</section>

   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"end",marginTop:30,flexWrap:"wrap"}}><div><p style={eyebrow}>HISTORIK</p><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"5px 0 0"}}>Seneste sikkerhedshændelser</h2></div><span style={{fontSize:12,color:"#687068",fontWeight:800}}>{events.length} vist</span></div>
   <div style={{display:"grid",gap:9,marginTop:13}}>{events.length===0?<section style={card}><strong>Ingen hændelser endnu</strong><p style={{margin:"5px 0 0",color:"#687068"}}>Sikkerhedsloggen er ny og registrerer hændelser fra nu af.</p></section>:events.map(event=><article key={event.id} style={card}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><small style={{fontWeight:900,letterSpacing:.8,color:"#607269"}}>{actionLabel[event.action]?.toUpperCase()||event.action.toUpperCase()}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:19,marginTop:5}}>{describe(event)}</strong><small style={{display:"block",marginTop:6,color:"#707870"}}>Udført af {event.actor_name||"Ukendt/system"}</small></div><time style={{fontSize:12,color:"#737a74",whiteSpace:"nowrap"}} dateTime={event.created_at}>{new Date(event.created_at).toLocaleString("da-DK",{dateStyle:"medium",timeStyle:"short"})}</time></div></article>)}</div>
  </section>
 </main>;
}
