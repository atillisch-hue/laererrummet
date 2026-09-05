"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type PersonnelGroup="teacher"|"pedagogue"|"substitute"|"administration"|"other";
type Staff={user_id:string;display_name:string;abbreviation:string|null;personnel_group:PersonnelGroup;roles:string[];active:boolean};
type Filter="all"|"teacher"|"pedagogue"|"leadership"|"substitute"|"administration"|"other";

const roleOptions=[
 {id:"teacher",label:"Læreradgang"},
 {id:"staff",label:"Personaleadgang"},
 {id:"leader",label:"Ledelse"},
 {id:"admin",label:"Admin"},
 {id:"board",label:"Bestyrelse"},
 {id:"parent",label:"Forælder"}
];
const roleLabels:Record<string,string>=Object.fromEntries(roleOptions.map(r=>[r.id,r.label]));
const personnelOptions:{id:PersonnelGroup;label:string;hint:string}[]=[
 {id:"teacher",label:"Lærer",hint:"Forkortelsen er typisk 2 bogstaver, fx AT."},
 {id:"pedagogue",label:"Pædagog",hint:"Forkortelsen er typisk 3 bogstaver."},
 {id:"substitute",label:"Vikar",hint:"Forkortelsen er typisk 3 bogstaver."},
 {id:"administration",label:"Administration",hint:"Kontor, sekretariat og øvrig administration."},
 {id:"other",label:"Andet personale",hint:"Medarbejdere, der ikke passer i de øvrige grupper."}
];
const personnelLabels:Record<PersonnelGroup,string>=Object.fromEntries(personnelOptions.map(p=>[p.id,p.label])) as Record<PersonnelGroup,string>;
const filters:{id:Filter;label:string}[]=[
 {id:"all",label:"Alle"},{id:"teacher",label:"Lærere"},{id:"pedagogue",label:"Pædagoger"},{id:"leadership",label:"Ledelse"},{id:"substitute",label:"Vikarer"},{id:"administration",label:"Administration"},{id:"other",label:"Andre"}
];
const box={background:"white",border:"1px solid #dedbd2",borderRadius:14,padding:20};
const MIN_PASSWORD_LENGTH=12;

function defaultAccess(group:PersonnelGroup){return group==="teacher"?"teacher":"staff"}
function normalizeAbbreviation(value:string){return value.trim().toUpperCase()}

export default function StaffAdminPage(){
 const[ready,setReady]=useState(false),[schoolId,setSchoolId]=useState<number|null>(null),[staff,setStaff]=useState<Staff[]>([]),[message,setMessage]=useState(""),[error,setError]=useState("");
 const[search,setSearch]=useState(""),[filter,setFilter]=useState<Filter>("all"),[showCreate,setShowCreate]=useState(false),[creating,setCreating]=useState(false);
 const[newName,setNewName]=useState(""),[newAbbreviation,setNewAbbreviation]=useState(""),[newPersonnelGroup,setNewPersonnelGroup]=useState<PersonnelGroup>("teacher"),[newEmail,setNewEmail]=useState(""),[newPassword,setNewPassword]=useState(""),[newRoles,setNewRoles]=useState<string[]>(["teacher"]);
 const[editing,setEditing]=useState<string|null>(null),[editName,setEditName]=useState(""),[editAbbreviation,setEditAbbreviation]=useState(""),[editPersonnelGroup,setEditPersonnelGroup]=useState<PersonnelGroup>("teacher"),[editRoles,setEditRoles]=useState<string[]>([]),[editActive,setEditActive]=useState(true),[saving,setSaving]=useState(false);

 async function api(path:string,method:string,body:any){
  const{data}=await supabase.auth.getSession();const token=data.session?.access_token;
  if(!token)throw new Error("Din session er udløbet. Log ind igen.");
  const res=await fetch(path,{method,headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(body)});
  const result=await res.json();if(!res.ok)throw new Error(result.error||"Handlingen mislykkedes.");return result;
 }

 async function load(sid?:number|null){
  const target=sid??schoolId;if(!target)return;
  setError("");
  const{data,error:loadError}=await supabase.rpc("admin_staff_directory_for_school_v2",{p_school_id:target});
  if(loadError){setError(loadError.message);return}
  setStaff(((data||[]) as any[]).map(row=>({...row,roles:Array.isArray(row.roles)?row.roles:[],personnel_group:(row.personnel_group||"teacher") as PersonnelGroup,active:row.active!==false})));
 }

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();const user=data.session?.user;
  if(!user||!hasRole(user,"admin")){window.location.replace("/");return}
  const{data:membership,error:membershipError}=await supabase.from("school_memberships").select("school_id").eq("user_id",user.id).eq("role","admin").eq("active",true).limit(1).maybeSingle();
  if(membershipError||!membership?.school_id){setError(membershipError?.message||"Din administratorkonto er ikke knyttet til en aktiv skole.");setReady(true);return}
  setSchoolId(membership.school_id);await load(membership.school_id);setReady(true);
 })()},[]);

 function setCreateGroup(group:PersonnelGroup){
  setNewPersonnelGroup(group);
  setNewRoles(current=>{
   const extras=current.filter(role=>role!=="teacher"&&role!=="staff");
   return [defaultAccess(group),...extras];
  });
 }
 function toggleNewRole(role:string){setNewRoles(current=>current.includes(role)?current.filter(r=>r!==role):[...current,role])}
 function toggleEditRole(role:string){setEditRoles(current=>current.includes(role)?current.filter(r=>r!==role):[...current,role])}

 async function createStaff(e:React.FormEvent){
  e.preventDefault();if(!schoolId)return;
  const abbreviation=normalizeAbbreviation(newAbbreviation);
  if(!newName.trim()||abbreviation.length<2||abbreviation.length>4||!newEmail.trim()||newPassword.length<MIN_PASSWORD_LENGTH||!newRoles.length){setMessage(`Udfyld navn, forkortelse, mail, mindst én adgangsrolle og en midlertidig kode på mindst ${MIN_PASSWORD_LENGTH} tegn.`);return}
  setCreating(true);setMessage("");
  try{
   await api("/api/admin/create-user","POST",{school_id:schoolId,email:newEmail,password:newPassword,roles:newRoles,display_name:newName.trim(),abbreviation,personnel_group:newPersonnelGroup});
   setMessage(`${abbreviation} · ${newName.trim()} er oprettet.`);setNewName("");setNewAbbreviation("");setNewEmail("");setNewPassword("");setNewPersonnelGroup("teacher");setNewRoles(["teacher"]);setShowCreate(false);await load();
  }catch(e:any){setMessage(e.message||"Medarbejderen kunne ikke oprettes.")}finally{setCreating(false)}
 }

 function startEdit(member:Staff){
  setEditing(member.user_id);setEditName(member.display_name||"");setEditAbbreviation(member.abbreviation||"");setEditPersonnelGroup(member.personnel_group);setEditRoles([...member.roles]);setEditActive(member.active);setMessage("");
 }

 async function saveEdit(){
  if(!editing||!schoolId)return;const abbreviation=normalizeAbbreviation(editAbbreviation);
  if(!editName.trim()||abbreviation.length<2||abbreviation.length>4||!editRoles.length){setMessage("Navn, forkortelse og mindst én adgangsrolle skal være udfyldt.");return}
  setSaving(true);setMessage("");
  try{
   await api("/api/admin/manage-user","PATCH",{id:editing,school_id:schoolId,roles:editRoles,disabled:!editActive,staff_profile:{display_name:editName.trim(),abbreviation,personnel_group:editPersonnelGroup}});
   setMessage(`${abbreviation} · ${editName.trim()} er gemt.`);setEditing(null);await load();
  }catch(e:any){setMessage(e.message||"Medarbejderen kunne ikke gemmes.")}finally{setSaving(false)}
 }

 const shown=useMemo(()=>staff.filter(member=>{
  const q=search.trim().toLowerCase();
  const matchesSearch=!q||(member.display_name||"").toLowerCase().includes(q)||(member.abbreviation||"").toLowerCase().includes(q);
  const matchesFilter=filter==="all"||filter==="leadership"?filter==="all"||member.roles.includes("leader"):member.personnel_group===filter;
  return matchesSearch&&matchesFilter;
 }),[staff,search,filter]);

 if(!ready)return <main style={{padding:50}}>Henter personale…</main>;
 const missingAbbreviation=staff.filter(s=>s.active&&!s.abbreviation).length;

 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#486b59",color:"white",padding:"20px 6vw"}}><div style={{maxWidth:1120,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",gap:16}}><div><small style={{fontWeight:800,letterSpacing:1.5}}>KLASSEVÆRELSET · PERSONER</small><h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"5px 0 0"}}>Personale</h1></div><Link href="/admin" style={{color:"white",textDecoration:"none",border:"1px solid rgba(255,255,255,.5)",padding:"9px 13px",borderRadius:8}}>← Administration</Link></div></header>
  <section style={{maxWidth:1120,margin:"0 auto",padding:"34px 24px 70px"}}>
   <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:22}}><span style={{padding:"8px 12px",borderRadius:999,background:"#486b59",color:"white",fontWeight:850,fontSize:13}}>Personaleprofiler</span><Link href="/admin/people" style={{padding:"8px 12px",borderRadius:999,background:"#fff",border:"1px solid #d8d3c8",color:"#506158",fontWeight:800,fontSize:13,textDecoration:"none"}}>Personer & adgang</Link><Link href="/admin/classes" style={{padding:"8px 12px",borderRadius:999,background:"#fff",border:"1px solid #d8d3c8",color:"#506158",fontWeight:800,fontSize:13,textDecoration:"none"}}>Klasser & elever</Link></div>
   <div style={{display:"flex",justifyContent:"space-between",gap:18,alignItems:"start",flexWrap:"wrap"}}><div><p className="eyebrow">PERSONALEKATALOG</p><h2 style={{fontFamily:"Georgia,serif",fontSize:32,margin:"7px 0"}}>Én person, én profil</h2><p style={{fontSize:17,color:"#667068",maxWidth:760,lineHeight:1.55,margin:0}}>Mailen bruges til login. I skolens daglige arbejde vises medarbejderens forkortelse og navn. Personalegruppe beskriver jobbet; adgangsroller bestemmer, hvad personen må se og gøre.</p></div><button onClick={()=>setShowCreate(v=>!v)} style={{padding:"11px 15px",fontWeight:850}}>{showCreate?"Luk":"+ Opret medarbejder"}</button></div>

   {error&&<div style={{...box,borderColor:"#c96b5c",color:"#7b2f25",marginTop:20}}>Personale kunne ikke hentes: {error}</div>}
   {message&&<div style={{padding:14,background:"#e7eee9",borderRadius:9,fontWeight:700,marginTop:20}}>{message}</div>}
   {missingAbbreviation>0&&<div style={{padding:14,background:"#fff6df",border:"1px solid #e1c77f",borderRadius:9,marginTop:20,color:"#715d28"}}><strong>{missingAbbreviation} aktiv{missingAbbreviation===1?" medarbejder mangler":"e medarbejdere mangler"} forkortelse.</strong> Åbn profilen og angiv den korrekte skoleforkortelse i stedet for at lade systemet gætte.</div>}

   {showCreate&&<form onSubmit={createStaff} style={{...box,marginTop:22}}><h3 style={{fontFamily:"Georgia,serif",fontSize:23,marginTop:0}}>Opret medarbejder</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}><label><strong>Navn</strong><input required value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Ane Tillisch" style={{display:"block",width:"100%",boxSizing:"border-box",padding:11,marginTop:6}}/></label><label><strong>Forkortelse</strong><input required value={newAbbreviation} onChange={e=>setNewAbbreviation(e.target.value.toUpperCase())} maxLength={4} placeholder={newPersonnelGroup==="teacher"?"AT":"ATI"} style={{display:"block",width:"100%",boxSizing:"border-box",padding:11,marginTop:6,textTransform:"uppercase"}}/></label><label><strong>Personalegruppe</strong><select value={newPersonnelGroup} onChange={e=>setCreateGroup(e.target.value as PersonnelGroup)} style={{display:"block",width:"100%",padding:11,marginTop:6}}>{personnelOptions.map(p=><option value={p.id} key={p.id}>{p.label}</option>)}</select></label></div><small style={{display:"block",color:"#747970",marginTop:8}}>{personnelOptions.find(p=>p.id===newPersonnelGroup)?.hint}</small><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12,marginTop:16}}><label><strong>Arbejdsmail / login</strong><input type="email" required value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="navn@skole.dk" style={{display:"block",width:"100%",boxSizing:"border-box",padding:11,marginTop:6}}/></label><label><strong>Midlertidig adgangskode</strong><input type="password" required minLength={MIN_PASSWORD_LENGTH} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder={`Mindst ${MIN_PASSWORD_LENGTH} tegn`} style={{display:"block",width:"100%",boxSizing:"border-box",padding:11,marginTop:6}}/></label></div><div style={{marginTop:17}}><strong>Adgangsroller</strong><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>{roleOptions.map(r=><label key={r.id} style={{display:"flex",gap:7,alignItems:"center",padding:"8px 11px",background:newRoles.includes(r.id)?"#e3ece5":"#faf8f3",border:"1px solid #ddd8cd",borderRadius:9}}><input type="checkbox" checked={newRoles.includes(r.id)} onChange={()=>toggleNewRole(r.id)}/>{r.label}</label>)}</div><small style={{display:"block",color:"#747970",marginTop:7}}>Pædagoger og vikarer får som udgangspunkt almindelig personaleadgang — ikke automatisk læreradgang.</small></div><button disabled={creating} style={{marginTop:18,padding:"10px 16px"}}>{creating?"Opretter…":"Opret medarbejder"}</button></form>}

   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap",margin:"30px 0 13px"}}><div><h3 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"0 0 5px"}}>Medarbejdere <span style={{fontSize:17,color:"#788078"}}>({staff.filter(s=>s.active).length} aktive)</span></h3><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{filters.map(f=><button key={f.id} onClick={()=>setFilter(f.id)} style={{padding:"6px 9px",fontSize:12,fontWeight:800,borderRadius:999,border:"1px solid #d7d2c7",background:filter===f.id?"#486b59":"#fff",color:filter===f.id?"white":"#506158"}}>{f.label}</button>)}</div></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Søg navn eller forkortelse…" style={{padding:"11px 13px",border:"1px solid #d8d4ca",borderRadius:8,minWidth:250}}/></div>

   <div style={{display:"grid",gap:10}}>{shown.map(member=><article key={member.user_id} style={{...box,padding:16,opacity:member.active?1:.64}}><div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:14,minWidth:0}}><div style={{width:54,height:54,borderRadius:12,background:member.abbreviation?"#486b59":"#eee5d5",color:member.abbreviation?"white":"#8a6d3b",display:"grid",placeItems:"center",fontWeight:900,fontSize:18,letterSpacing:.5,flex:"0 0 auto"}}>{member.abbreviation||"—"}</div><div style={{minWidth:0}}><strong style={{fontSize:18}}>{member.display_name}</strong><div style={{color:"#687068",fontSize:13,marginTop:3}}>{personnelLabels[member.personnel_group]||member.personnel_group} · {member.active?"Aktiv":"Inaktiv"}</div><div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:7}}>{member.roles.map(r=><span key={r} style={{background:"#edf1ed",borderRadius:999,padding:"3px 8px",fontSize:11,fontWeight:750}}>{roleLabels[r]||r}</span>)}</div></div></div><button onClick={()=>startEdit(member)} style={{padding:"8px 12px"}}>Åbn profil</button></div>{editing===member.user_id&&<div style={{marginTop:17,paddingTop:17,borderTop:"1px solid #eee",display:"grid",gap:14}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}><label><strong>Navn</strong><input value={editName} onChange={e=>setEditName(e.target.value)} style={{display:"block",width:"100%",boxSizing:"border-box",padding:10,marginTop:6}}/></label><label><strong>Forkortelse</strong><input value={editAbbreviation} onChange={e=>setEditAbbreviation(e.target.value.toUpperCase())} maxLength={4} placeholder={editPersonnelGroup==="teacher"?"AT":"ATI"} style={{display:"block",width:"100%",boxSizing:"border-box",padding:10,marginTop:6,textTransform:"uppercase"}}/></label><label><strong>Personalegruppe</strong><select value={editPersonnelGroup} onChange={e=>setEditPersonnelGroup(e.target.value as PersonnelGroup)} style={{display:"block",width:"100%",padding:10,marginTop:6}}>{personnelOptions.map(p=><option value={p.id} key={p.id}>{p.label}</option>)}</select></label></div><div><strong>Roller & adgang</strong><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:8}}>{roleOptions.map(r=><label key={r.id} style={{display:"flex",gap:7,alignItems:"center",padding:"8px 11px",background:editRoles.includes(r.id)?"#e3ece5":"#faf8f3",border:"1px solid #ddd8cd",borderRadius:9}}><input type="checkbox" checked={editRoles.includes(r.id)} onChange={()=>toggleEditRole(r.id)}/>{r.label}</label>)}</div></div><label style={{display:"flex",gap:8,alignItems:"center"}}><input type="checkbox" checked={editActive} onChange={e=>setEditActive(e.target.checked)}/><strong>Aktiv på skolen</strong></label><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={saveEdit} disabled={saving}>{saving?"Gemmer…":"Gem profil"}</button><button onClick={()=>setEditing(null)}>Annuller</button><Link href="/admin/people" style={{fontSize:13,alignSelf:"center",color:"#486b59"}}>Kontoadgang / nulstil kode →</Link></div></div>}</article>)}{!shown.length&&!error&&<div style={box}>Ingen medarbejdere matcher filteret.</div>}</div>
  </section>
 </main>;
}