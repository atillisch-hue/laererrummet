"use client";

import {useEffect,useState} from "react";
import {supabase} from "../lib/supabase";
import {studentSupabase} from "../lib/studentSupabase";
import {hasRole} from "../lib/roles";
import {trainingCatalog} from "../lib/trainingCatalog";
import {clearStudentSession,getStudentSessionToken,storeStudentSession} from "../lib/studentSession";
import StudentSubjectRooms from "./StudentSubjectRooms";

type StaffRole="teacher"|"admin"|"parent"|"board";
type Assignment={id:number;title:string;type:string;instructions?:string};
type GrammarAssignment={id:number;title:string;area:string;topic:string;level:string};
type StudentData={ok?:boolean;student?:{id:number;name:string;class_id:number};class?:{id:number;name:string};assignments?:Assignment[]};

export default function HomeClient(){
 const[ready,setReady]=useState(false);
 const[studentMode,setStudentMode]=useState(false);
 const[teacher,setTeacher]=useState<string|null>(null);
 const[staffLogin,setStaffLogin]=useState<StaffRole|null>(null);
 const[email,setEmail]=useState("");
 const[password,setPassword]=useState("");
 const[loginError,setLoginError]=useState("");
 const[studentId,setStudentId]=useState<number|null>(null);
 const[studentCode,setStudentCode]=useState("");
 const[studentSessionToken,setStudentSessionToken]=useState("");
 const[studentError,setStudentError]=useState("");
 const[studentClassName,setStudentClassName]=useState("");
 const[studentName,setStudentName]=useState("");
 const[assignments,setAssignments]=useState<Assignment[]>([]);
 const[grammarAssignments,setGrammarAssignments]=useState<GrammarAssignment[]>([]);

 async function hydrateStudent(token:string){
  const{data,error}=await studentSupabase.rpc("student_session_data",{p_session_token:token});
  const sd=data as StudentData|null;
  if(error||!sd?.ok||!sd.student||!sd.class)return false;
  setStudentMode(true);setStudentSessionToken(token);setStudentId(sd.student.id);setStudentName(sd.student.name);setStudentClassName(sd.class.name);
  setAssignments((sd.assignments||[]).map(a=>({id:a.id,title:a.title,type:a.type,instructions:a.instructions||""})));
  const{data:grammarData}=await studentSupabase.rpc("student_session_grammar_assignments",{p_session_token:token});
  setGrammarAssignments(grammarData?.ok?(grammarData.assignments||[]):[]);
  return true;
 }

 useEffect(()=>{
  let cancelled=false;
  (async()=>{
   const{data}=await supabase.auth.getSession();const session=data.session;if(cancelled)return;
   setTeacher(session?.user.email||null);
   const query=new URLSearchParams(window.location.search);
   if(session&&query.get("teacher")==="1"){window.location.replace("/noticeboard");return}
   const wantsStudent=query.get("student")==="1",token=getStudentSessionToken();
   if(wantsStudent||token)setStudentMode(true);
   if(token){const ok=await hydrateStudent(token);if(!ok){clearStudentSession();setStudentSessionToken("");setStudentId(null)}}
   if(!cancelled)setReady(true);
  })();
  const{data:listener}=supabase.auth.onAuthStateChange((_event,session)=>setTeacher(session?.user.email||null));
  return()=>{cancelled=true;listener.subscription.unsubscribe()};
 },[]);

 async function staffSignIn(e:React.FormEvent){
  e.preventDefault();setLoginError("");
  const{data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
  if(error){setLoginError("Mail eller adgangskode er forkert.");return}
  const user=data.user;
  if(staffLogin==="admin"){if(!hasRole(user,"admin")){await supabase.auth.signOut();setLoginError("Denne konto har ikke administratoradgang.");return}window.location.href="/admin";return}
  if(staffLogin==="parent"){if(!hasRole(user,"parent")){await supabase.auth.signOut();setLoginError("Denne konto har ikke forældreadgang.");return}window.location.href="/parent";return}
  if(staffLogin==="board"){if(!hasRole(user,"board")){await supabase.auth.signOut();setLoginError("Denne konto har ikke bestyrelsesadgang.");return}window.location.href="/board";return}
  if(!hasRole(user,"teacher")&&!hasRole(user,"admin")){await supabase.auth.signOut();setLoginError("Denne konto har ikke læreradgang.");return}
  window.location.href="/noticeboard";
 }

 async function studentLogin(e:React.FormEvent){
  e.preventDefault();setStudentError("");const code=studentCode.trim().toUpperCase();if(!code)return;
  const{data,error}=await studentSupabase.rpc("student_start_session",{p_access_code:code});
  if(error||!data?.ok||!data.session_token||!data.student_id){setStudentError(data?.error==="rate_limited"?"Der har været mange loginforsøg. Vent lidt og prøv igen.":"Koden blev ikke genkendt. Prøv igen.");return}
  const token=String(data.session_token);storeStudentSession(token,Number(data.student_id));
  const ok=await hydrateStudent(token);if(!ok){clearStudentSession();setStudentError("Klasseværelset kunne ikke åbnes. Prøv igen.");return}
  setStudentCode("");
 }

 async function studentLogout(){
  const token=studentSessionToken||getStudentSessionToken();
  if(token){try{await studentSupabase.rpc("student_end_session",{p_session_token:token})}catch{}}
  clearStudentSession();setStudentId(null);setStudentSessionToken("");setAssignments([]);setGrammarAssignments([]);setStudentName("");setStudentClassName("");setStudentMode(false);
 }

 if(!ready)return <main className="login"><div className="loginCard"><h1>Klasseværelset</h1><p>Henter Klasseværelset…</p></div></main>;

 if(staffLogin&&!teacher){
  const isAdmin=staffLogin==="admin",isParent=staffLogin==="parent",isBoard=staffLogin==="board";
  return <main className="login"><div className="loginCard">
   <button className="back" onClick={()=>{setStaffLogin(null);setLoginError("")}}>← Tilbage</button>
   <div className="brand loginBrand"><span>✦</span><div><strong>Klasseværelset</strong><small>{isAdmin?"Sikker administratoradgang":isParent?"Sikker forældreadgang":isBoard?"Sikker bestyrelsesadgang":"Sikker læreradgang"}</small></div></div>
   <p className="eyebrow">{isAdmin?"ADMINISTRATORLOGIN":isParent?"FORÆLDRELOGIN":isBoard?"BESTYRELSESLOGIN":"LÆRERLOGIN"}</p><h1>Log ind</h1>
   <form onSubmit={staffSignIn}><label style={formLabel}>E-mail</label><input style={formInput} type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="din@email.dk"/><label style={formLabel}>Adgangskode</label><input style={formInput} type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/>{loginError&&<p style={{color:"#9b3b32",fontWeight:700}}>{loginError}</p>}<button className="primary" type="submit">Log ind →</button></form>
  </div></main>;
 }

 if(!studentMode)return <main className="login"><div className="loginCard">
  <div className="brand loginBrand"><span>✦</span><div><strong>Klasseværelset</strong><small>Et roligt sted til læring og skrivning</small></div></div>
  <p className="eyebrow">VÆLG INDGANG</p><h1>Velkommen</h1><p>Vælg hvordan du vil åbne Klasseværelset.</p>
  <div className="roleGrid">
   <button onClick={()=>teacher?window.location.href="/noticeboard":setStaffLogin("teacher")}><b>✎</b><strong>Jeg er lærer</strong><small>{teacher?"Fortsæt til Opslagstavlen":"Sikker adgang med e-mail og kode"}</small></button>
   <button onClick={()=>setStudentMode(true)}><b>◎</b><strong>Jeg er elev</strong><small>Log ind med din personlige kode</small></button>
   <button onClick={()=>setStaffLogin("parent")}><b>⌂</b><strong>Jeg er forælder</strong><small>Følg dit barns skolehverdag</small></button>
   <button onClick={()=>teacher?window.location.href="/admin":setStaffLogin("admin")}><b>⚙</b><strong>Jeg er administrator</strong><small>Skemaer, fravær og skolens opsætning</small></button>
   <button onClick={()=>setStaffLogin("board")}><b>§</b><strong>Jeg er bestyrelsesmedlem</strong><small>Møder, dokumenter og beslutninger</small></button>
  </div>
 </div></main>;

 if(!studentId)return <main className="login"><div className="loginCard">
  <button className="back" onClick={()=>{setStudentMode(false);setStudentError("")}}>← Tilbage</button>
  <div className="brand loginBrand"><span>✦</span><div><strong>Klasseværelset</strong><small>Elevadgang</small></div></div>
  <p className="eyebrow">ELEVLOGIN</p><h1>Din personlige kode</h1><p>Skriv den kode, du har fået af din lærer. Koden bruges kun til at åbne din elevsession.</p>
  <form onSubmit={studentLogin}><label style={formLabel}>Elevkode</label><input style={{...formInput,fontSize:18,letterSpacing:2,textTransform:"uppercase"}} autoFocus required value={studentCode} onChange={e=>setStudentCode(e.target.value)} placeholder="Skriv din kode" autoComplete="off"/>{studentError&&<p style={{color:"#9b3b32",fontWeight:700}}>{studentError}</p>}<button className="primary" type="submit">Åbn mit Klasseværelse →</button></form>
 </div></main>;

 const grammar=trainingCatalog.find(s=>s.id==="dansk-grammatik"),math=trainingCatalog.find(s=>s.id==="matematik");
 return <main className="studentShell">
  <header className="studentTop"><div className="brand"><span>✦</span><div><strong>Klasseværelset</strong><small>{studentClassName}</small></div></div><button onClick={studentLogout}>{studentName} · Log ud</button></header>
  <section className="studentContent">
   <p className="eyebrow">HEJ {studentName.toUpperCase()}</p><h1>Dit Klasseværelse</h1><p>Her finder du dine fag, det læreren har sendt til dig og træning du selv kan vælge.</p>
   <StudentSubjectRooms sessionToken={studentSessionToken}/>

   <section style={{margin:"28px 0 34px"}}><p className="eyebrow">FRA DIN LÆRER</p>
    {grammarAssignments.length===0&&assignments.length===0?<div style={whiteCard}><strong>Du har ikke fået nye opgaver.</strong><p style={{margin:"6px 0 0",color:"#707670"}}>Du kan stadig åbne dine fag eller træne selv.</p></div>:<div className="studentAssignments">
     {grammarAssignments.map(g=><button key={`g-${g.id}`} onClick={()=>window.location.href=`/student-grammar?assignment=${g.id}`}><span>✓</span><div><strong>{g.title}</strong><small>Grammatik · {g.area} · {g.topic}</small></div><b>Start →</b></button>)}
     {assignments.map(a=><button key={a.id} onClick={()=>window.location.href=`/student-assignment/${a.id}`}><span>▤</span><div><strong>{a.title}</strong><small>{a.type} · Skrivehjælp følger med</small></div><b>Åbn →</b></button>)}
    </div>}
   </section>

   <section><p className="eyebrow">TRÆN SELV</p><h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"7px 0"}}>Hvad vil du øve?</h2><p style={{color:"#707670",marginTop:0}}>Du må altid træne videre, også når læreren ikke har sendt en opgave.</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14,marginTop:18}}>
     {grammar&&<button onClick={()=>window.location.href="/student-training?subject=dansk-grammatik"} style={trainingCard}><span style={{fontSize:26}}>Aa</span><strong style={trainingTitle}>Grammatik</strong><small style={trainingDescription}>{grammar.description}</small><b style={trainingAction}>Vælg træning →</b></button>}
     {math&&<button onClick={()=>window.location.href="/student-training?subject=matematik"} style={trainingCard}><span style={{fontSize:26}}>∑</span><strong style={trainingTitle}>Matematik</strong><small style={trainingDescription}>{math.description}</small><b style={trainingAction}>Vælg træning →</b></button>}
    </div>
   </section>
  </section>
 </main>;
}

const formLabel:React.CSSProperties={display:"block",fontSize:12,fontWeight:900,margin:"14px 0 5px"};
const formInput:React.CSSProperties={width:"100%",boxSizing:"border-box",padding:"12px",border:"1px solid #d8d5cd",borderRadius:8,font:"inherit"};
const whiteCard:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:13,padding:18,marginTop:12};
const trainingCard:React.CSSProperties={display:"grid",gap:7,textAlign:"left",padding:20,border:"1px solid #ddd9d0",borderRadius:14,background:"white",cursor:"pointer",color:"#26342e"};
const trainingTitle:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:22};
const trainingDescription:React.CSSProperties={color:"#707670",lineHeight:1.45};
const trainingAction:React.CSSProperties={color:"#526b60",marginTop:5};
