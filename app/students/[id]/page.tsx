"use client";

import Link from "next/link";
import {use,useEffect,useState} from "react";
import {supabase} from "../../../lib/supabase";
import LearningProfile from "./learning-profile";
import MathLearningProfile from "./math-learning-profile";

type Student={id:number;name:string;class_id:number|null};
type Meeting={id:number;title:string;meeting_type:string;starts_at:string;status:string;minutes:string|null};
type Absence={id:number;absence_date:string;status:string;note:string|null;source?:string};
type Handover={id:number;handover_date:string;category:string;message:string;author_email:string;created_at:string};

const absenceLabel=(s:string)=>({sick:"Syg",unexcused:"Ulovligt fravær",excused:"Lovligt fravær",left_early:"Gået tidligt",late:"Forsinket"}[s]||s);
const handoverLabel=(s:string)=>({practical:"Praktisk",teaching:"Undervisning",student:"Elev",substitute:"Til næste lærer/vikar"}[s]||s);

export default function StudentOverview({params}:{params:Promise<{id:string}>}){
 const{id}=use(params),studentId=Number(id);
 const[student,setStudent]=useState<Student|null>(null),[meetings,setMeetings]=useState<Meeting[]>([]),[absence,setAbsence]=useState<Absence[]>([]),[handovers,setHandovers]=useState<Handover[]>([]),[activeActions,setActiveActions]=useState(0),[ready,setReady]=useState(false),[error,setError]=useState("");

 useEffect(()=>{(async()=>{
  const{data}=await supabase.auth.getSession();if(!data.session){location.replace("/?teacher=1");return}
  const[s,m,a,h,p]=await Promise.all([
   supabase.from("students").select("id,name,class_id").eq("id",studentId).single(),
   supabase.from("calendar_meetings").select("id,title,meeting_type,starts_at,status,minutes").eq("student_id",studentId).order("starts_at",{ascending:false}),
   supabase.from("student_absence").select("id,absence_date,status,note,source").eq("student_id",studentId).order("absence_date",{ascending:false}).limit(100),
   supabase.from("class_handover").select("id,handover_date,category,message,author_email,created_at").eq("student_id",studentId).order("created_at",{ascending:false}).limit(50),
   supabase.from("student_action_plans").select("id").eq("student_id",studentId).eq("status","active").maybeSingle()
  ]);
  if(s.error)setError("Eleven kunne ikke hentes.");else setStudent(s.data as Student);
  if(!m.error)setMeetings((m.data||[]) as Meeting[]);
  if(!a.error)setAbsence((a.data||[]) as Absence[]);
  if(!h.error)setHandovers((h.data||[]) as Handover[]);
  if(p.data){const{count}=await supabase.from("student_plan_actions").select("id",{count:"exact",head:true}).eq("plan_id",p.data.id).eq("status","active");setActiveActions(count||0)}
  setReady(true);
 })()},[studentId]);

 if(!ready)return <main style={shell}>Henter elevens overblik…</main>;
 if(error||!student)return <main style={shell}><Link href="/students">← Elever</Link><h1>{error}</h1></main>;
 const latestAbsence=absence.slice(0,5),latestHandovers=handovers.slice(0,5);

 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"22px 32px"}}><div style={{maxWidth:950,margin:"auto"}}><Link href={`/students${student.class_id?`?class=${student.class_id}`:""}`} style={topLink}>← Klassen</Link><p style={{fontSize:11,fontWeight:900,letterSpacing:1.4,opacity:.7,margin:"22px 0 3px"}}>ELEVOVERBLIK · PERSONALE</p><h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:0}}>{student.name}</h1></div></header>
  <section style={shell}>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:24}}>
    <div style={smallCard}><small style={eyebrow}>FRAVÆR</small><strong style={bigNumber}>{absence.length}</strong><span style={hint}>registreringer i historikken</span></div>
    <div style={smallCard}><small style={eyebrow}>MØDER</small><strong style={bigNumber}>{meetings.length}</strong><span style={hint}>møder koblet til eleven</span></div>
    <div style={smallCard}><small style={eyebrow}>OVERLEVERING</small><strong style={bigNumber}>{handovers.length}</strong><span style={hint}>elevspecifikke beskeder</span></div>
    <Link href={`/students/${studentId}/action-plan`} style={{...smallCard,textDecoration:"none",color:"inherit"}}><small style={eyebrow}>HANDLEPLAN</small><strong style={bigNumber}>{activeActions}</strong><span style={hint}>aktive indsatser · åbn handleplan →</span></Link>
   </div>

   <LearningProfile studentId={studentId}/>
   {student.class_id&&<MathLearningProfile studentId={studentId} classId={student.class_id}/>}

   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:16,marginBottom:16}}>
    <section style={card}><p style={eyebrow}>FRAVÆRSHISTORIK</p><h2 style={h2}>Seneste registreringer</h2>{latestAbsence.length?latestAbsence.map(a=><div key={a.id} style={row}><div><strong>{absenceLabel(a.status)}</strong><small style={meta}>{new Date(a.absence_date+"T12:00").toLocaleDateString("da-DK",{day:"numeric",month:"long",year:"numeric"})}{a.source==="parent"?" · meldt af forælder":""}</small></div>{a.note&&<span style={hint}>{a.note}</span>}</div>):<p style={hint}>Ingen fraværsregistreringer.</p>}<Link href={`/students?class=${student.class_id||""}`} style={actionLink}>Åbn klassens fravær →</Link></section>
    <section style={card}><p style={eyebrow}>OVERLEVERING</p><h2 style={h2}>Det kolleger har noteret</h2>{latestHandovers.length?latestHandovers.map(h=><div key={h.id} style={row}><div><strong>{handoverLabel(h.category)}</strong><small style={meta}>{new Date(h.handover_date+"T12:00").toLocaleDateString("da-DK")} · {h.author_email.split("@")[0]}</small></div><span style={hint}>{h.message}</span></div>):<p style={hint}>Ingen elevspecifikke overleveringer.</p>}<Link href={`/students?class=${student.class_id||""}`} style={actionLink}>Åbn klassens overlevering →</Link></section>
   </div>

   <section style={card}><p style={eyebrow}>MØDER & REFERATER</p><h2 style={h2}>Mødehistorik om {student.name}</h2><p style={hint}>Møderne vises automatisk her, når eleven er koblet til mødet. Det giver ikke eleven adgang til mødet.</p>{meetings.length?<div style={{display:"grid",gap:10,marginTop:18}}>{meetings.map(m=>{const dt=new Date(m.starts_at);return <Link key={m.id} href={`/calendar/meeting/${m.id}`} style={meetingCard}><div><small style={eyebrow}>{m.meeting_type.toUpperCase()}</small><h3 style={{fontFamily:"Georgia,serif",fontSize:21,margin:"5px 0"}}>{m.title}</h3><span style={hint}>{dt.toLocaleDateString("da-DK",{day:"numeric",month:"long",year:"numeric"})} · {m.minutes?"Referat gemt":"Referat mangler"}</span></div><strong style={{color:"#526b60"}}>Åbn →</strong></Link>})}</div>:<div style={{...smallCard,marginTop:18}}>Der er endnu ingen møder koblet til eleven.</div>}</section>
  </section>
 </main>
}

const shell:React.CSSProperties={maxWidth:950,margin:"auto",padding:"32px 24px 70px"};
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:22};
const smallCard:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:11,padding:16};
const meetingCard:React.CSSProperties={display:"flex",justifyContent:"space-between",alignItems:"center",gap:14,textDecoration:"none",color:"inherit",padding:"15px 16px",background:"#faf9f6",borderRadius:10};
const row:React.CSSProperties={display:"grid",gap:5,padding:"11px 0",borderTop:"1px solid #eee"};
const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:26,margin:"6px 0 12px"};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const hint:React.CSSProperties={color:"#707670",fontSize:14,lineHeight:1.5};
const meta:React.CSSProperties={display:"block",color:"#718077",marginTop:3};
const bigNumber:React.CSSProperties={display:"block",fontFamily:"Georgia,serif",fontSize:32,margin:"6px 0 2px"};
const actionLink:React.CSSProperties={display:"inline-block",marginTop:12,color:"#526b60",fontWeight:800,textDecoration:"none"};
const topLink:React.CSSProperties={color:"white",textDecoration:"none",fontWeight:800};
