"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {danishGenreByName,type DanishGenre} from "../../lib/danishGenreCatalog";

type Student={id:number;name:string;class_id:number};
type SchoolClass={id:number;name:string};
type Assignment={id:number;title:string;type:string;class_id:number;class_subject_id:number|null;instructions:string|null};
type AssignmentStudent={assignment_id:number;student_id:number};
type Draft={student_id:number;assignment_id:number;content:string[]};
type Feedback={student_id:number;assignment_id:number;text:string};
type SubjectRoom={id:number;class_id:number;subject_id:number;title:string|null};
type Subject={id:number;name:string};

const resolveGenre=(name:string):DanishGenre|undefined=>{
 if(name==="Artikel")return danishGenreByName("Artikel")||danishGenreByName("Nyhedsartikel");
 if(name==="Fortælling")return danishGenreByName("Novelle");
 return danishGenreByName(name);
};

export default function TeacherOverview(){
 const[loading,setLoading]=useState(true);
 const[error,setError]=useState("");
 const[classes,setClasses]=useState<SchoolClass[]>([]);
 const[students,setStudents]=useState<Student[]>([]);
 const[assignments,setAssignments]=useState<Assignment[]>([]);
 const[assignmentStudents,setAssignmentStudents]=useState<AssignmentStudent[]>([]);
 const[drafts,setDrafts]=useState<Draft[]>([]);
 const[feedback,setFeedback]=useState<Feedback[]>([]);
 const[selectedClass,setSelectedClass]=useState<number|null>(null);
 const[selectedAssignment,setSelectedAssignment]=useState<number|null>(null);
 const[selectedStudent,setSelectedStudent]=useState<number|null>(null);
 const[feedbackText,setFeedbackText]=useState("");
 const[feedbackStatus,setFeedbackStatus]=useState("");
 const[subjectRoom,setSubjectRoom]=useState<SubjectRoom|null>(null);
 const[subjectName,setSubjectName]=useState("");

 useEffect(()=>{void load()},[]);
 useEffect(()=>{
  const row=feedback.find(x=>x.student_id===selectedStudent&&x.assignment_id===selectedAssignment);
  setFeedbackText(row?.text||"");setFeedbackStatus("");
 },[selectedStudent,selectedAssignment,feedback]);

 async function load(){
  setLoading(true);setError("");
  const{data:session}=await supabase.auth.getSession();
  if(!session.session){setError("Du skal være logget ind som lærer for at se denne side.");setLoading(false);return}
  const params=new URLSearchParams(window.location.search);
  const requestedClass=Number(params.get("class"));
  const requestedRoom=Number(params.get("subject"));
  const[c,s,a,links,d,f]=await Promise.all([
   supabase.from("classes").select("id,name").order("id"),
   supabase.from("students").select("id,name,class_id").order("name"),
   supabase.from("assignments").select("id,title,type,class_id,class_subject_id,instructions").order("id",{ascending:false}),
   supabase.from("assignment_students").select("assignment_id,student_id"),
   supabase.from("drafts").select("student_id,assignment_id,content"),
   supabase.from("feedback").select("student_id,assignment_id,text")
  ]);
  const firstError=c.error||s.error||a.error||links.error||d.error||f.error;
  if(firstError){setError(firstError.message||"Kunne ikke hente data.");setLoading(false);return}

  const classRows=(c.data||[]) as SchoolClass[];
  setClasses(classRows);setStudents((s.data||[]) as Student[]);setAssignments((a.data||[]) as Assignment[]);
  setAssignmentStudents((links.data||[]) as AssignmentStudent[]);
  setDrafts((d.data||[]).map(x=>({...x,content:Array.isArray(x.content)?x.content:[]})) as Draft[]);
  setFeedback((f.data||[]) as Feedback[]);

  let initialClass=classRows.some(x=>x.id===requestedClass)?requestedClass:(classRows[0]?.id||null);
  let validRoom:SubjectRoom|null=null;
  let roomSubjectName="";
  if(Number.isFinite(requestedRoom)&&requestedRoom>0){
   const{data:r}=await supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("id",requestedRoom).maybeSingle();
   if(r){
    validRoom=r as SubjectRoom;initialClass=validRoom.class_id;
    const{data:subject}=await supabase.from("subjects").select("id,name").eq("id",validRoom.subject_id).maybeSingle();
    roomSubjectName=(subject as Subject|null)?.name||validRoom.title||"Fag";
   }
  }
  setSubjectRoom(validRoom);setSubjectName(roomSubjectName);setSelectedClass(initialClass);setSelectedAssignment(null);setSelectedStudent(null);setLoading(false);
 }

 const subjectRoomId=subjectRoom?.id||null;
 const classStudents=useMemo(()=>students.filter(s=>s.class_id===selectedClass),[students,selectedClass]);
 const classAssignments=useMemo(()=>assignments.filter(a=>a.class_id===selectedClass&&(!subjectRoomId||a.class_subject_id===subjectRoomId)),[assignments,selectedClass,subjectRoomId]);
 const activeAssignment=classAssignments.find(a=>a.id===selectedAssignment);
 const activeStudent=students.find(s=>s.id===selectedStudent);
 const activeDraft=drafts.find(d=>d.assignment_id===selectedAssignment&&d.student_id===selectedStudent);
 const currentClass=classes.find(c=>c.id===selectedClass);

 function recipients(assignmentId:number){
  const ids=assignmentStudents.filter(x=>x.assignment_id===assignmentId).map(x=>x.student_id);
  return ids.length?classStudents.filter(s=>ids.includes(s.id)):classStudents;
 }
 function filledCount(studentId:number,assignmentId:number){return drafts.find(x=>x.student_id===studentId&&x.assignment_id===assignmentId)?.content.filter(x=>x?.trim()).length||0}
 function genreFor(assignment:Assignment|undefined){return assignment?resolveGenre(assignment.type):undefined}
 function progress(studentId:number,assignmentId:number){
  const count=filledCount(studentId,assignmentId),assignment=assignments.find(x=>x.id===assignmentId),total=genreFor(assignment)?.structure.length||0;
  if(!count)return "Ikke startet";
  if(total&&count>=total)return "Færdig ✓";
  return total?`${count} af ${total} felter`:`${count} ${count===1?"felt":"felter"} skrevet`;
 }
 async function saveFeedback(){
  if(!selectedStudent||!selectedAssignment)return;
  setFeedbackStatus("Gemmer…");const text=feedbackText.trim();
  const{error:e}=await supabase.from("feedback").upsert({student_id:selectedStudent,assignment_id:selectedAssignment,text,updated_at:new Date().toISOString()},{onConflict:"student_id,assignment_id"});
  if(e){setFeedbackStatus("Kunne ikke gemme");return}
  setFeedback(old=>[...old.filter(x=>!(x.student_id===selectedStudent&&x.assignment_id===selectedAssignment)),{student_id:selectedStudent,assignment_id:selectedAssignment,text}]);
  setFeedbackStatus("Gemt ✓");
 }

 if(loading)return <main style={{padding:40}}>Henter lærerens overblik…</main>;
 const createHref=subjectRoomId?`/create-assignment?class=${selectedClass||""}&subject=${subjectRoomId}`:`/create-assignment?class=${selectedClass||""}`;
 const backHref=subjectRoomId?`/students/subjects/${subjectRoomId}`:selectedClass?`/students?class=${selectedClass}`:"/students";
 return <main style={shell}><div style={{maxWidth:1180,margin:"0 auto"}}>
  <header style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"center",marginBottom:24,flexWrap:"wrap"}}>
   <div><p style={eyebrow}>{subjectRoomId?`${(currentClass?.name||"KLASSE").toUpperCase()} · ${(subjectName||"FAG").toUpperCase()}`:"KLASSEVÆRELSET · LÆRER"}</p><h1 style={h1}>{subjectRoomId?`${subjectName||"Fag"} · opgaver & besvarelser`:"Skriftlige opgaver"}</h1><p style={muted}>{subjectRoomId?"Kun opgaver, elevtekster og feedback fra dette faglokale.":"Se status, åbn elevens tekst og giv feedback samme sted."}</p></div>
   <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>void load()} style={button}>↻ Opdater</button><Link href={createHref} style={primaryLink}>+ Opret opgave</Link><Link href={backHref} style={buttonLink}>← {subjectRoomId?"Faglokalet":"Klasseværelset"}</Link></div>
  </header>
  {error?<section style={box}><strong>{error}</strong></section>:<>
   {!subjectRoomId&&<section style={{...box,padding:16,marginBottom:18}}><label style={{fontWeight:800}}>Klasse <select value={selectedClass||""} onChange={e=>{setSelectedClass(Number(e.target.value));setSelectedAssignment(null);setSelectedStudent(null)}} style={select}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></section>}
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(330px,1fr))",gap:18,alignItems:"start"}}>
    <section style={box}><p style={eyebrow}>OPGAVER{subjectRoomId?" I FAGET":""}</p><h2 style={h2}>Senest tildelt</h2>{classAssignments.map(a=><AssignmentButton key={a.id} assignment={a} recipients={recipients(a.id)} selected={selectedAssignment===a.id} specific={assignmentStudents.some(x=>x.assignment_id===a.id)} filledCount={filledCount} progress={progress} onClick={()=>{setSelectedAssignment(a.id);setSelectedStudent(null)}}/>)}{!classAssignments.length&&<p style={muted}>Der er ingen opgaver {subjectRoomId?"i dette faglokale":"i denne klasse"} endnu.</p>}</section>
    <section style={box}>{activeAssignment?<AssignmentDetail assignment={activeAssignment} students={recipients(activeAssignment.id)} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent} activeStudent={activeStudent} activeDraft={activeDraft} progress={progress} filledCount={filledCount} genre={genreFor(activeAssignment)} feedbackText={feedbackText} setFeedbackText={setFeedbackText} feedbackStatus={feedbackStatus} setFeedbackStatus={setFeedbackStatus} saveFeedback={saveFeedback}/>:<><p style={eyebrow}>ELEVSTATUS</p><h2 style={h2}>Vælg en opgave</h2><p style={muted}>Tryk på en opgave til venstre. Så får du elever og besvarelser frem med det samme.</p></>}</section>
   </div>
  </>}
 </div></main>;
}

function AssignmentButton({assignment,recipients,selected,specific,filledCount,progress,onClick}:{assignment:Assignment;recipients:Student[];selected:boolean;specific:boolean;filledCount:(studentId:number,assignmentId:number)=>number;progress:(studentId:number,assignmentId:number)=>string;onClick:()=>void}){
 const started=recipients.filter(s=>filledCount(s.id,assignment.id)>0).length,finished=recipients.filter(s=>progress(s.id,assignment.id)==="Færdig ✓").length;
 return <button onClick={onClick} style={{width:"100%",textAlign:"left",padding:14,marginBottom:9,border:selected?"2px solid #758b79":"1px solid #dedbd2",borderRadius:10,background:selected?"#f1f4ef":"#fff",cursor:"pointer"}}><strong style={{display:"block",fontSize:16}}>{assignment.title}</strong><span style={{display:"block",marginTop:5,color:"#68746c",fontSize:13}}>{assignment.type} · {specific?`${recipients.length} ${recipients.length===1?"elev":"elever"}`:"Hele klassen"}</span><span style={{display:"block",marginTop:4,fontSize:12,fontWeight:700,color:"#55705d"}}>{started}/{recipients.length} i gang{finished?` · ${finished} færdig${finished===1?"":"e"}`:""}</span></button>;
}

function AssignmentDetail({assignment,students,selectedStudent,setSelectedStudent,activeStudent,activeDraft,progress,filledCount,genre,feedbackText,setFeedbackText,feedbackStatus,setFeedbackStatus,saveFeedback}:{assignment:Assignment;students:Student[];selectedStudent:number|null;setSelectedStudent:(id:number)=>void;activeStudent:Student|undefined;activeDraft:Draft|undefined;progress:(studentId:number,assignmentId:number)=>string;filledCount:(studentId:number,assignmentId:number)=>number;genre:DanishGenre|undefined;feedbackText:string;setFeedbackText:(value:string)=>void;feedbackStatus:string;setFeedbackStatus:(value:string)=>void;saveFeedback:()=>void}){
 return <><p style={eyebrow}>{assignment.type.toUpperCase()}</p><h2 style={h2}>{assignment.title}</h2>{assignment.instructions&&<div style={instruction}><strong>Opgaveformulering: </strong>{assignment.instructions}</div>}{genre&&<div style={genreBox}><strong>{genre.category} · {genre.name}</strong><span style={{display:"block",marginTop:3}}>{genre.purpose}</span></div>}
  <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:15}}><span style={pill}>{students.filter(s=>filledCount(s.id,assignment.id)>0).length} i gang</span><span style={{...pill,background:"#f3f0e9"}}>{students.filter(s=>filledCount(s.id,assignment.id)===0).length} ikke startet</span></div>
  <div style={{display:"grid",gridTemplateColumns:"minmax(160px,.6fr) minmax(240px,1.4fr)",gap:16}}><div>{students.map(s=>{const status=progress(s.id,assignment.id);return <button key={s.id} onClick={()=>setSelectedStudent(s.id)} style={{width:"100%",textAlign:"left",padding:11,marginBottom:7,border:selectedStudent===s.id?"2px solid #758b79":"1px solid #dedbd2",borderRadius:9,background:selectedStudent===s.id?"#f1f4ef":"#fff",cursor:"pointer"}}><strong>{s.name}</strong><small style={{display:"block",marginTop:3,color:"#68746c"}}>{status}</small></button>})}</div>
   <div style={{background:"#faf9f5",borderRadius:10,padding:16,minHeight:250}}>{!activeStudent?<p style={muted}>Vælg en elev for at åbne besvarelsen.</p>:<><div style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:14}}><h3 style={{margin:0}}>{activeStudent.name}</h3><span style={{fontSize:12,fontWeight:800,color:"#55705d"}}>{progress(activeStudent.id,assignment.id)}</span></div>{!activeDraft||!activeDraft.content.some(x=>x?.trim())?<p style={muted}>Eleven har ikke skrevet noget endnu.</p>:activeDraft.content.map((text,index)=>text?.trim()?<div key={index} style={draftBox}><strong style={{fontSize:12,color:"#6c806f"}}>{genre?.structure[index]||`Felt ${index+1}`}</strong><p style={{whiteSpace:"pre-wrap",lineHeight:1.55,margin:"5px 0 0"}}>{text}</p></div>:null)}<div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #dedbd2"}}><label style={{display:"block",fontWeight:800,marginBottom:7}}>Feedback til eleven</label><textarea value={feedbackText} onChange={e=>{setFeedbackText(e.target.value);setFeedbackStatus("")}} placeholder="Skriv din feedback her…" style={textarea}/><div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"flex-end",marginTop:9}}>{feedbackStatus&&<span style={{fontSize:13,fontWeight:700,color:feedbackStatus.includes("Gemt")?"#55705d":"#7b6754"}}>{feedbackStatus}</span>}<button onClick={saveFeedback} style={primary}>Gem feedback</button></div></div></>}</div>
  </div>
 </>;
}

const shell:React.CSSProperties={minHeight:"100vh",background:"#f7f5ef",padding:"28px clamp(18px,4vw,60px)",color:"#27352d"};
const box:React.CSSProperties={background:"#fff",border:"1px solid #e3e0d8",borderRadius:14,padding:22,boxShadow:"0 3px 14px rgba(0,0,0,.04)"};
const eyebrow:React.CSSProperties={fontSize:12,fontWeight:800,letterSpacing:1.5,color:"#6c806f",margin:"0 0 7px"};
const h1:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:40,margin:"7px 0"};
const h2:React.CSSProperties={fontFamily:"Georgia,serif",fontSize:27,margin:"7px 0 16px"};
const muted:React.CSSProperties={margin:"5px 0",color:"#657068",lineHeight:1.5};
const button:React.CSSProperties={background:"#fff",border:"1px solid #d8d5cd",padding:"10px 14px",borderRadius:9,color:"#27352d",fontWeight:700,cursor:"pointer"};
const buttonLink:React.CSSProperties={...button,textDecoration:"none",display:"inline-flex",alignItems:"center"};
const primary:React.CSSProperties={border:0,borderRadius:9,background:"#435c4a",color:"#fff",padding:"10px 16px",fontWeight:800,cursor:"pointer"};
const primaryLink:React.CSSProperties={...primary,textDecoration:"none",display:"inline-flex",alignItems:"center"};
const select:React.CSSProperties={marginLeft:10,padding:10,border:"1px solid #d8d5cd",borderRadius:8,minWidth:220};
const instruction:React.CSSProperties={background:"#f4f2ec",borderRadius:9,padding:"11px 13px",marginBottom:14,lineHeight:1.45,fontSize:14,whiteSpace:"pre-wrap"};
const genreBox:React.CSSProperties={background:"#eef2ec",borderRadius:9,padding:"10px 12px",marginBottom:14,fontSize:13,lineHeight:1.45};
const pill:React.CSSProperties={background:"#eef2ec",padding:"6px 9px",borderRadius:999,fontSize:12,fontWeight:800};
const draftBox:React.CSSProperties={marginBottom:12,background:"#fff",border:"1px solid #ebe7de",borderRadius:9,padding:13};
const textarea:React.CSSProperties={width:"100%",minHeight:105,padding:11,border:"1px solid #d8d5cd",borderRadius:9,resize:"vertical",font:"inherit",boxSizing:"border-box"};
