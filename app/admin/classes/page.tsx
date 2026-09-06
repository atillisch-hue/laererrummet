"use client";

import Link from "next/link";
import {useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";
import {generateStudentAccessCode} from "../../../lib/studentAccessCode";

type Klass={id:number;name:string;school_id:number};
type Student={id:number;name:string;class_id:number|null;grade_level:number|null};
type AccessStatus={student_id:number;needs_rotation:boolean;code_length:number|null;updated_at:string|null};

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};
const field:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"10px 11px",border:"1px solid #d5d1c8",borderRadius:8,background:"white",font:"inherit"};
const button:React.CSSProperties={border:0,borderRadius:8,padding:"9px 12px",background:"#365044",color:"white",fontWeight:900,cursor:"pointer"};
const secondary:React.CSSProperties={border:"1px solid #d2cdc3",borderRadius:8,padding:"8px 10px",background:"white",color:"#365044",fontWeight:850,cursor:"pointer",textDecoration:"none"};

export default function ClassesAdminPage(){
 const[ready,setReady]=useState(false),[schoolId,setSchoolId]=useState<number|null>(null),[classes,setClasses]=useState<Klass[]>([]),[students,setStudents]=useState<Student[]>([]),[accessStatus,setAccessStatus]=useState<AccessStatus[]>([]),[message,setMessage]=useState(""),[error,setError]=useState("");
 const[className,setClassName]=useState(""),[studentName,setStudentName]=useState(""),[studentClass,setStudentClass]=useState<number|"">("");
 const[editingClass,setEditingClass]=useState<number|null>(null),[editClassName,setEditClassName]=useState("");
 const[editingStudent,setEditingStudent]=useState<number|null>(null),[editStudentName,setEditStudentName]=useState(""),[editStudentClass,setEditStudentClass]=useState<number|"">("");

 async function load(sid?:number|null){
  const target=sid??schoolId;if(!target)return;setError("");
  const classRes=await supabase.from("classes").select("id,name,school_id").eq("school_id",target).order("name");
  if(classRes.error){setError(classRes.error.message);return}
  const rows=(classRes.data||[]) as Klass[];setClasses(rows);
  const ids=rows.map(row=>row.id);
  const accessPromise=supabase.rpc("admin_student_access_status",{p_school_id:target});
  if(!ids.length){const accessRes=await accessPromise;setStudents([]);setAccessStatus(accessRes.error?[]:(accessRes.data||[]) as AccessStatus[]);return}
  const[studentRes,accessRes]=await Promise.all([
   supabase.from("students").select("id,name,class_id,grade_level").in("class_id",ids).order("name"),
   accessPromise
  ]);
  if(studentRes.error){setError(studentRes.error.message);return}
  setStudents((studentRes.data||[]) as Student[]);
  if(accessRes.error)setError("Elevadgangens sikkerhedsstatus kunne ikke hentes.");
  setAccessStatus(accessRes.error?[]:(accessRes.data||[]) as AccessStatus[]);
 }
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();const user=data.session?.user;if(!user||!hasRole(user,"admin")){location.replace("/");return}const{data:membership,error:membershipError}=await supabase.from("school_memberships").select("school_id").eq("user_id",user.id).eq("role","admin").eq("active",true).limit(1).maybeSingle();if(membershipError||!membership?.school_id){setError(membershipError?.message||"Din administratorkonto er ikke knyttet til en aktiv skole.");setReady(true);return}setSchoolId(membership.school_id);await load(membership.school_id);setReady(true)})()},[]);

 async function addClass(){if(!schoolId||!className.trim())return;const{error}=await supabase.from("classes").insert({name:className.trim(),school_id:schoolId});setMessage(error?`Klassen kunne ikke oprettes: ${error.message}`:"Klassen er oprettet.");if(!error){setClassName("");await load()}}
 async function saveClass(id:number){if(!editClassName.trim())return;const{error}=await supabase.from("classes").update({name:editClassName.trim()}).eq("id",id);setMessage(error?`Klassen kunne ikke gemmes: ${error.message}`:"Klassen er gemt.");if(!error){setEditingClass(null);await load()}}
 async function deleteClass(klass:Klass){const count=students.filter(student=>student.class_id===klass.id).length;if(count){setMessage(`Flyt først klassens ${count} elev${count===1?"":"er"}, før klassen slettes.`);return}if(!confirm(`Slet den tomme klasse ${klass.name}?`))return;const{error}=await supabase.from("classes").delete().eq("id",klass.id);setMessage(error?error.message:`${klass.name} er slettet.`);if(!error)await load()}
 async function addStudent(){if(!schoolId||!studentName.trim()||!studentClass)return;let code:string;try{code=generateStudentAccessCode()}catch{setMessage("Der kunne ikke oprettes en sikker elevkode i denne browser.");return}const{data,error}=await supabase.rpc("admin_create_student",{p_school_id:schoolId,p_class_id:Number(studentClass),p_name:studentName.trim(),p_access_code:code,p_grade_level:null});setMessage(error||!data?.ok?`Eleven kunne ikke oprettes: ${error?.message||"Ukendt fejl"}`:`${studentName.trim()} er oprettet. Elevkoden er ${code}. Gem eller udlever den nu — den kan ikke vises igen.`);if(!error&&data?.ok){setStudentName("");await load()}}
 async function saveStudent(id:number){if(!editStudentName.trim()||!editStudentClass)return;const{error}=await supabase.from("students").update({name:editStudentName.trim(),class_id:Number(editStudentClass)}).eq("id",id);setMessage(error?`Eleven kunne ikke gemmes: ${error.message}`:"Eleven er gemt.");if(!error){setEditingStudent(null);await load()}}
 async function rotateCode(student:Student){
  if(!confirm(`Lav en ny sikker elevkode til ${student.name}? Den gamle kode og aktive elevsessioner lukkes med det samme.`))return;
  let code:string;try{code=generateStudentAccessCode()}catch{setMessage("Der kunne ikke oprettes en sikker elevkode i denne browser.");return}
  const{data,error}=await supabase.rpc("admin_rotate_student_access_code",{p_student_id:student.id,p_access_code:code});
  setMessage(error||!data?.ok?`Ny kode kunne ikke oprettes: ${error?.message||"Ukendt fejl"}`:`Ny elevkode til ${student.name}: ${code}. Gem eller udlever den nu — den kan ikke vises igen. Den gamle kode og eksisterende elevsessioner er lukket.`);
  if(!error&&data?.ok)await load();
 }

 if(!ready)return <main style={{padding:50}}>Henter klasser og elever…</main>;
 const needsRotation=accessStatus.filter(status=>status.needs_rotation);
 const statusByStudent=new Map(accessStatus.map(status=>[status.student_id,status]));
 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}><header style={{background:"#486b59",color:"white",padding:"20px 6vw"}}><div style={{maxWidth:1100,margin:"auto",display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div><small style={{fontWeight:900,letterSpacing:1.3}}>ADMINISTRATION · SKOLEN</small><h1 style={{fontFamily:"Georgia,serif",fontSize:36,margin:"5px 0 0"}}>Klasser & elever</h1></div><Link href="/admin" style={{color:"white",fontWeight:800,textDecoration:"none"}}>← Administration</Link></div></header><section style={{maxWidth:1100,margin:"auto",padding:"34px 24px 80px"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"start",flexWrap:"wrap"}}><div><p style={eyebrow}>GRUNDSTRUKTUR</p><h2 style={h2}>Klasser først — elever bagefter</h2><p style={muted}>Her administrerer du kun skolens klasser og elever. Loginroller, medarbejdere og forældreadgang ligger under Personer & adgang.</p></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/admin/student-grade-levels" style={secondary}>Klassetrin & differentiering</Link><Link href="/admin/teacher-classes" style={secondary}>Undervisere & klasser</Link></div></div>
  {error&&<div style={{...card,marginTop:18,background:"#fff0ed",color:"#7b2f25"}}>{error}</div>}{message&&<div style={{padding:12,background:"#e7eee9",borderRadius:9,marginTop:18,fontWeight:800,whiteSpace:"pre-wrap"}}>{message}</div>}

  <section style={{...card,marginTop:18,background:needsRotation.length?"#fff4e8":"#edf4ee",borderColor:needsRotation.length?"#e6b985":"#bad0be"}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"start",flexWrap:"wrap"}}><div><p style={eyebrow}>ELEVADGANG · SIKKERHED</p><h3 style={{...h3,marginBottom:7}}>{needsRotation.length?`${needsRotation.length} elevkode${needsRotation.length===1?" skal":"r skal"} fornyes`:"Alle elevkoder er opdateret"}</h3><p style={{...muted,margin:0}}>{needsRotation.length?"De markerede elever bruger ældre korte koder. Skift dem én elev ad gangen, og udlever den nye kode med det samme. Klasseværelset kan ikke læse koden tilbage bagefter.":"Alle registrerede elevkoder bruger den nuværende sikre kodeform og behøver ikke rotation."}</p></div><strong style={{fontSize:30,fontFamily:"Georgia,serif",color:needsRotation.length?"#8a542e":"#456052"}}>{accessStatus.length-needsRotation.length}/{accessStatus.length}</strong></div>
   {needsRotation.length>0&&<p style={{margin:"11px 0 0",fontSize:12,color:"#735b45"}}>Der findes med vilje ingen “skift alle”-knap: en ny kode bør først aktiveres, når den kan udleveres sikkert til den konkrete elev.</p>}
  </section>

  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14,marginTop:20}}><section style={card}><p style={eyebrow}>NY KLASSE</p><h3 style={h3}>Opret klasse</h3><input value={className} onChange={e=>setClassName(e.target.value)} placeholder="Fx 7.–9. klasse" style={field}/><button onClick={addClass} disabled={!className.trim()} style={{...button,marginTop:9,opacity:!className.trim()?.5:1}}>+ Opret klasse</button></section><section style={card}><p style={eyebrow}>NY ELEV</p><h3 style={h3}>Opret elev</h3><input value={studentName} onChange={e=>setStudentName(e.target.value)} placeholder="Elevens navn" style={field}/><select value={studentClass} onChange={e=>setStudentClass(e.target.value?Number(e.target.value):"")} style={{...field,marginTop:8}}><option value="">Vælg klasse</option>{classes.map(klass=><option key={klass.id} value={klass.id}>{klass.name}</option>)}</select><button onClick={addStudent} disabled={!studentName.trim()||!studentClass} style={{...button,marginTop:9,opacity:!studentName.trim()||!studentClass?.5:1}}>+ Opret elev</button></section></div>

  <section style={{...card,marginTop:18}}><p style={eyebrow}>KLASSER</p><h3 style={h3}>{classes.length} klasse{classes.length===1?"":"r"}</h3><div style={{display:"grid",gap:8}}>{classes.map(klass=>{const count=students.filter(student=>student.class_id===klass.id).length;return <article key={klass.id} style={row}>{editingClass===klass.id?<div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"center",width:"100%"}}><input value={editClassName} onChange={e=>setEditClassName(e.target.value)} style={{...field,flex:"1 1 220px"}}/><button onClick={()=>saveClass(klass.id)} style={button}>Gem</button><button onClick={()=>setEditingClass(null)} style={secondary}>Annullér</button></div>:<><div><strong>{klass.name}</strong><small style={meta}>{count} elev{count===1?"":"er"}</small></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button onClick={()=>{setEditingClass(klass.id);setEditClassName(klass.name)}} style={secondary}>Redigér</button><button onClick={()=>deleteClass(klass)} style={{...secondary,color:"#8a453b"}}>Slet</button></div></>}</article>})}{classes.length===0&&<p style={muted}>Ingen klasser endnu.</p>}</div></section>

  <section style={{...card,marginTop:18}}><p style={eyebrow}>ELEVER</p><h3 style={h3}>{students.length} elever</h3><div style={{display:"grid",gap:8}}>{students.map(student=>{const access=statusByStudent.get(student.id);return <article key={student.id} style={row}>{editingStudent===student.id?<div style={{display:"grid",gap:7,width:"100%"}}><div style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) minmax(180px,260px)",gap:8}}><input value={editStudentName} onChange={e=>setEditStudentName(e.target.value)} style={field}/><select value={editStudentClass} onChange={e=>setEditStudentClass(e.target.value?Number(e.target.value):"")} style={field}>{classes.map(klass=><option key={klass.id} value={klass.id}>{klass.name}</option>)}</select></div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button onClick={()=>saveStudent(student.id)} style={button}>Gem</button><button onClick={()=>rotateCode(student)} style={secondary}>Lav sikker ny elevkode</button><button onClick={()=>setEditingStudent(null)} style={secondary}>Annullér</button></div><small style={meta}>Elevkoden kan ikke læses tilbage. En ny kode erstatter den gamle og lukker eksisterende elevsessioner.</small></div>:<><div><div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}><strong>{student.name}</strong>{access?.needs_rotation&&<span style={{padding:"3px 7px",borderRadius:999,background:"#f6dfc7",color:"#7b4c2d",fontSize:10,fontWeight:900}}>KODE SKAL FORNYES</span>}{access&&!access.needs_rotation&&<span style={{padding:"3px 7px",borderRadius:999,background:"#e1eee3",color:"#456052",fontSize:10,fontWeight:900}}>SIKKER KODE</span>}</div><small style={meta}>{classes.find(klass=>klass.id===student.class_id)?.name||"Ingen klasse"}{student.grade_level!==null?` · ${student.grade_level}. klasse`:" · klassetrin ikke angivet"}{access?.code_length?` · kode ${access.code_length} tegn`:""}</small></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{access?.needs_rotation&&<button onClick={()=>rotateCode(student)} style={{...secondary,borderColor:"#d39a62",color:"#7b4c2d"}}>Lav ny kode</button>}<button onClick={()=>{setEditingStudent(student.id);setEditStudentName(student.name);setEditStudentClass(student.class_id??"")}} style={secondary}>Redigér</button></div></>}</article>})}</div></section>
 </section></main>;
}

const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:30,margin:"5px 0 8px"};const h3:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:23,margin:"5px 0 12px"};const muted:React.CSSProperties={color:"#687068",lineHeight:1.5,maxWidth:760};const row:React.CSSProperties={display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",padding:"11px 12px",border:"1px solid #e3dfd7",borderRadius:9,background:"#faf9f6",flexWrap:"wrap"};const meta:React.CSSProperties={display:"block",marginTop:3,color:"#747b75",fontSize:12};