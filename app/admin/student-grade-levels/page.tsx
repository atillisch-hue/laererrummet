"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../../lib/supabase";
import {hasRole} from "../../../lib/roles";

type ClassRow={id:number;name:string;school_id:number};
type Student={id:number;name:string;class_id:number|null;grade_level:number|null};

const gradeOptions=Array.from({length:11},(_,grade)=>grade);
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:20};

export default function StudentGradeLevels(){
 const[ready,setReady]=useState(false);
 const[classes,setClasses]=useState<ClassRow[]>([]);
 const[students,setStudents]=useState<Student[]>([]);
 const[classId,setClassId]=useState<number|"">("");
 const[savingId,setSavingId]=useState<number|null>(null);
 const[message,setMessage]=useState("");
 const[error,setError]=useState("");

 async function load(){
  setError("");
  const{data:session}=await supabase.auth.getSession();
  const user=session.session?.user;
  if(!user||!hasRole(user,"admin")){window.location.replace("/admin");return}

  const{data:membership,error:membershipError}=await supabase.from("school_memberships").select("school_id").eq("user_id",user.id).eq("role","admin").eq("active",true).limit(1).maybeSingle();
  if(membershipError||!membership?.school_id){setError(membershipError?.message||"Din administratorkonto er ikke knyttet til en aktiv skole.");setReady(true);return}

  const[cRes,sRes]=await Promise.all([
   supabase.from("classes").select("id,name,school_id").eq("school_id",membership.school_id).order("name"),
   supabase.from("students").select("id,name,class_id,grade_level").order("name")
  ]);
  if(cRes.error||sRes.error){setError(cRes.error?.message||sRes.error?.message||"Data kunne ikke hentes.");setReady(true);return}

  const ownClasses=(cRes.data||[]) as ClassRow[];
  const ownIds=new Set(ownClasses.map(c=>c.id));
  const ownStudents=((sRes.data||[]) as Student[]).filter(student=>student.class_id!==null&&ownIds.has(Number(student.class_id)));
  setClasses(ownClasses);setStudents(ownStudents);
  setClassId(current=>current&&ownIds.has(Number(current))?current:(ownClasses[0]?.id||""));
  setReady(true);
 }

 useEffect(()=>{load()},[]);

 const shown=useMemo(()=>students.filter(student=>Number(student.class_id)===Number(classId)),[students,classId]);
 const missing=students.filter(student=>student.grade_level===null).length;

 async function saveGrade(student:Student,value:string){
  setSavingId(student.id);setMessage("");
  const grade=value===""?null:Number(value);
  const{error:updateError}=await supabase.from("students").update({grade_level:grade}).eq("id",student.id);
  if(updateError){setMessage(`Kunne ikke gemme ${student.name}: ${updateError.message}`)}else{
   setStudents(current=>current.map(item=>item.id===student.id?{...item,grade_level:grade}:item));
   setMessage(`✓ Klassetrin gemt for ${student.name}.`);
  }
  setSavingId(null);
 }

 if(!ready)return <main style={{padding:50}}>Henter elever…</main>;

 return <main style={{minHeight:"100vh",background:"#f5f2ea",color:"#26342e"}}>
  <header style={{background:"#486b59",color:"white",padding:"18px 6vw"}}><div style={{maxWidth:1050,margin:"0 auto",display:"flex",justifyContent:"space-between",gap:16,alignItems:"center"}}><div><strong style={{fontSize:22}}>Elevklassetrin</strong><small style={{display:"block",opacity:.82}}>Grundlag for trinpasset grammatik og differentiering</small></div><Link href="/admin" style={{color:"white",textDecoration:"none",border:"1px solid rgba(255,255,255,.5)",padding:"8px 12px",borderRadius:8}}>← Administration</Link></div></header>
  <section style={{maxWidth:1050,margin:"0 auto",padding:"38px 24px 80px"}}>
   <p className="eyebrow">DIFFERENTIERING</p><h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"7px 0"}}>Klassetrin pr. elev</h1>
   <p style={{maxWidth:780,color:"#667069",fontSize:17,lineHeight:1.55}}>Klassetrin ligger på eleven — ikke kun på klassen. Derfor kan en blandet klasse fx have elever fra 7., 8. og 9. klasse, mens grammatikken automatisk vælger passende opgaver til hver elev.</p>
   <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"18px 0 24px"}}><span style={{padding:"7px 10px",borderRadius:999,background:missing?"#fff0d8":"#e7eee9",fontWeight:800,fontSize:13}}>{missing?`${missing} elev${missing===1?"":"er"} mangler klassetrin`:"Alle elever har klassetrin ✓"}</span><span style={{padding:"7px 10px",borderRadius:999,background:"#edf1ec",fontWeight:800,fontSize:13}}>Udfordring kan gå ét klassetrin over</span></div>
   {error&&<div style={{padding:14,background:"#fff0ed",border:"1px solid #c96b5c",borderRadius:9,color:"#7b2f25",fontWeight:700}}>{error}</div>}
   {message&&<div style={{padding:12,background:message.startsWith("✓")?"#e7eee9":"#fff0ed",borderRadius:9,fontWeight:700,marginBottom:14}}>{message}</div>}
   {classes.length>1&&<label style={{display:"block",maxWidth:310,fontWeight:800,marginBottom:16}}>Vis klasse<select value={classId} onChange={event=>setClassId(Number(event.target.value))} style={{display:"block",width:"100%",marginTop:6,padding:"10px 12px",border:"1px solid #ccc",borderRadius:8,background:"white"}}>{classes.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>}
   <section style={card}><div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,flexWrap:"wrap"}}><div><p className="eyebrow" style={{marginBottom:4}}>ELEVER</p><h2 style={{fontFamily:"Georgia,serif",margin:0}}>{classes.find(row=>row.id===Number(classId))?.name||"Klasse"}</h2></div><small style={{color:"#777"}}>Ændringer gemmes med det samme</small></div>
    {shown.length===0?<p style={{color:"#777"}}>Ingen elever i denne klasse.</p>:<div style={{display:"grid",gap:8,marginTop:16}}>{shown.map(student=><div key={student.id} style={{display:"grid",gridTemplateColumns:"minmax(180px,1fr) minmax(150px,220px)",gap:12,alignItems:"center",padding:"11px 12px",border:"1px solid #e3dfd7",borderRadius:9,background:student.grade_level===null?"#fffaf0":"#faf9f6"}}><div><strong>{student.name}</strong>{student.grade_level===null&&<small style={{display:"block",color:"#9a6d2f",fontWeight:700}}>Klassetrin mangler</small>}</div><select aria-label={`Klassetrin for ${student.name}`} disabled={savingId===student.id} value={student.grade_level??""} onChange={event=>saveGrade(student,event.target.value)} style={{padding:"9px 10px",border:"1px solid #ccc",borderRadius:8,background:"white",fontWeight:700}}><option value="">Ikke angivet</option>{gradeOptions.map(grade=><option key={grade} value={grade}>{grade}. klasse</option>)}</select></div>)}</div>}
   </section>
   <div style={{...card,marginTop:16,background:"#edf1ec"}}><strong>Sådan bruges klassetrinnet i grammatik</strong><p style={{margin:"7px 0 0",lineHeight:1.55,color:"#59645d"}}>1.–2. klasse får konkrete ord- og handlingsopgaver. 3.–4. klasse får begyndende ordklasse- og sætningsanalyse. 5.–6. klasse får mere systematik, sætningsled og tegnsætning. 7.–9. klasse får hele analyse-, korrektur- og sproglig-effektlaget. Klassetrinnet er et udgangspunkt — ikke et loft.</p></div>
  </section>
 </main>;
}
