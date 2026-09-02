"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {danishGenreByName,type DanishGenre} from "../../lib/danishGenreCatalog";

type Student={id:number;name:string;class_id:number};
type SchoolClass={id:number;name:string};
type Assignment={id:number;title:string;type:string;class_id:number;class_subject_id:number|null;instructions?:string|null};
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

const box:React.CSSProperties={background:"#fff",border:"1px solid #e3e0d8",borderRadius:14,padding:22,boxShadow:"0 3px 14px rgba(0,0,0,.04)"};
const actionLink:React.CSSProperties={background:"#fff",border:"1px solid #d8d5cd",padding:"10px 14px",borderRadius:9,color:"#27352d",textDecoration:"none",fontWeight:700};

export default function TeacherOverview(){
 const[loading,setLoading]=useState(true),[error,setError]=useState("");
 const[classes,setClasses]=useState<SchoolClass[]>([]),[students,setStudents]=useState<Student[]>([]),[assignments,setAssignments]=useState<Assignment[]>([]),[assignmentStudents,setAssignmentStudents]=useState<AssignmentStudent[]>([]),[drafts,setDrafts]=useState<Draft[]>([]),[feedback,setFeedback]=useState<Feedback[]>([]);
 const[selectedClass,setSelectedClass]=useState<number|null>(null),[selectedAssignment,setSelectedAssignment]=useState<number|null>(null),[selectedStudent,setSelectedStudent]=useState<number|null>(null),[feedbackText,setFeedbackText]=useState(""),[feedbackStatus,setFeedbackStatus]=useState("");
 const[subjectRoomId,setSubjectRoomId]=useState<number|null>(null),[subjectRoom,setSubjectRoom]=useState<SubjectRoom|null>(null),[subjectName,setSubjectName]=useState("");

 useEffect(()=>{load()},[]);
 useEffect(()=>{const f=feedback.find(x=>x.student_id===selectedStudent&&x.assignment_id===selectedAssignment);setFeedbackText(f?.text||"");setFeedbackStatus("")},[selectedStudent,selectedAssignment,feedback]);

 async function load(){
  setLoading(true);setError("");
  const{data:session}=await supabase.auth.getSession();
  if(!session.session){setError("Du skal være logget ind som lærer for at se denne side.");setLoading(false);return}
  const params=new URLSearchParams(window.location.search),requestedClass=Number(params.get("class")),requestedRoom=Number(params.get("subject"));
  const[{data:c,error:ce},{data:s,error:se},{data:a,error:ae},{data:links,error:le},{data:d,error:de},{data:f,error:fe}]=await Promise.all([
   supabase.from("classes").select("id,name").order("id"),
   supabase.from("students").select("id,name,class_id").order("name"),
   supabase.from("assignments").select("id,title,type,class_id,class_subject_id,instructions").order("id",{ascending:false}),
   supabase.from("assignment_students").select("assignment_id,student_id"),
   supabase.from("drafts").select("student_id,assignment_id,content"),
   supabase.from("feedback").select("student_id,assignment_id,text")
  ]);
  if(ce||se||ae||le||de||fe){setError((ce||se||ae||le||de||fe)?.message||"Kunne ikke hente data.");setLoading(false);return}
  const classRows=(c||[]) as SchoolClass[];
  setClasses(classRows);setStudents((s||[]) as Student[]);setAssignments((a||[]) as Assignment[]);setAssignmentStudents((links||[]) as AssignmentStudent[]);setDrafts((d||[]).map(x=>({...x,content:Array.isArray(x.content)?x.content:[]})) as Draft[]);setFeedback((f||[]) as Feedback[]);

  let initialClass=classRows.some(x=>x.id===requestedClass)?requestedClass:(classRows[0]?.id||null),validRoom:SubjectRoom|null=null;
  if(Number.isFinite(requestedRoom)&&requestedRoom>0){
   const{data:r}=await supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("id",requestedRoom).maybeSingle();
   if(r){validRoom=r as SubjectRoom;initialClass=validRoom.class_id;const{data:sub}=await supabase.from("subjects").select("id,name").eq("id",validRoom.subject_id).maybeSingle();setSubjectName((sub as Subject|null)?.name||validRoom.title||"Fag")}
  }
  setSubjectRoom(validRoom);setSubjectRoomId(validRoom?.id||null);setSelectedClass(initialClass);setSelectedAssignment(null);setSelectedStudent(null);setLoading(false);
 }

 const classAssignments=useMemo(()=>assignments.filter(a=>a.class_id===selectedClass&&(!subjectRoomId||a.class_subject_id===subjectRoomId)),[assignments,selectedClass,subjectRoomId]);
 const classStudents=useMemo(()=>students.filter(s=>s.class_id===selectedClass),[students,selectedClass]);
 const activeAssignment=classAssignments.find(a=>a.id===selectedAssignment);
 const activeStudent=students.find(s=>s.id===selectedStudent);
 const activeDraft=drafts.find(d=>d.assignment_id===selectedAssignment&&d.student_id===selectedStudent);
 const currentClass=classes.find(c=>c.id===selectedClass);

 function recipients(assignmentId:number){const ids=assignmentStudents.filter(x=>x.assignment_id===assignmentId).map(x=>x.student_id);return ids.length?classStudents.filter(s=>ids.includes(s.id)):classStudents}
 function filledCount(studentId:number,assignmentId:number){return drafts.find(x=>x.student_id===studentId&&x.assignment_id===assignmentId)?.content.filter(x=>x?.trim()).length||0}
 function genreFor(a:Assignment|undefined){return a?resolveGenre(a.type):undefined}
 function progress(studentId:number,assignmentId:number){const n=filledCount(studentId,assignmentId),assignment=assignments.find(x=>x.id===assignmentId),total=genreFor(assignment)?.structure.length||0;if(!n)return"Ikke startet";if(total&&n>=total)return"Færdig ✓";return total?`${n} af ${total} felter`:`${n} ${n===1?"felt":"felter"} skrevet`}
 async function saveFeedback(){if(!selectedStudent||!selectedAssignment)return;setFeedbackStatus("Gemmer…");const text=feedbackText.trim();const{error:e}=await supabase.from("feedback").upsert({student_id:selectedStudent,assignment_id:selectedAssignment,text,updated_at:new Date().toISOString()},{onConflict:"student_id,assignment_id"});if(e){setFeedbackStatus("Kunne ikke gemme");return}setFeedback(o=>[...o.filter(x=>!(x.student_id===selectedStudent&&x.assignment_id===selectedAssignment)),{student_id:selectedStudent,assignment_id:selectedAssignment,text}]);setFeedbackStatus("Gemt ✓")}

 if(loading)return <main style={{padding:40,fontFamily:"Arial,sans-serif"}}>Henter lærerens overblik…</main>;
 const createHref=subjectRoomId?`/create-assignment?class=${selectedClass||""}&subject=${subjectRoomId}`:`/create-assignment?class=${selectedClass||""}`;
 const backHref=subjectRoomId?`/students/subjects/${subjectRoomId}`:selectedClass?`/students?class=${selectedClass}`:"/students";
 const pageTitle=subjectRoomId?`${subjectName||subjectRoom?.title||"Fag"} · opgaver & besvarelser`:"Skriftlige opgaver";
 return <main style={{minHeight:"100vh",background:"#f7f5ef",padding:"28px clamp(18px,4vw,60px)",fontFamily:"Arial,sans-serif",color:"#27352d"}}><div style={{maxWidth:1180,margin:"0 auto"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:20,alignItems:"center",marginBottom:24,flexWrap:"wrap"}}><div><div style={{fontSize:12,fontWeight:800,letterSpacing:2,color:"#6c806f"}}>{subjectRoomId?`${(currentClass?.name||"KLASSE").toUpperCase()} · ${(subjectName||"FAG").toUpperCase()}`:"KLASSEVÆRELSET · LÆRER"}</div><h1 style={{fontFamily:"Georgia,serif",fontSize:40,margin:"7px 0"}}>{pageTitle}</h1><p style={{margin:0,color:"#657068"}}>{subjectRoomId?"Kun opgaver, elevtekster og feedback fra dette faglokale.":"Se status, åbn elevens tekst og giv feedback samme sted."}</p></div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button onClick={load} style={{...actionLink,cursor:"pointer"}}>↻ Opdater</button><Link href={createHref} style={{...actionLink,background:"#435c4a",borderColor:"#435c4a",color:"#fff",fontWeight:800}}>+ Opret opgave</Link><Link href={backHref} style={actionLink}>← {subjectRoomId?"Faglokalet":"Klasseværelset"}</Link></div></div>
  {error?<div style={box}><strong>{error}</strong></div>:<>
   {!subjectRoomId&&<div style={{...box,marginBottom:18,padding:16}}><label style={{fontWeight:800,marginRight:12}}>Klasse</label><select value={selectedClass||""} onChange={e=>{setSelectedClass(Number(e.target.value));setSelectedAssignment(null);setSelectedStudent(null)}} style={{padding:10,border:"1px solid #d8d5cd",borderRadius:8,minWidth:220}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>}
   <div style={{display:"grid",gridTemplateColumns:"minmax(280px,.78fr) minmax(420px,1.22fr)",gap:18,alignItems:"start"}}>
    <section style={box}><div style={{fontSize:12,fontWeight:800,letterSpacing:1.5,color:"#6c806f"}}>OPGAVER{subjectRoomId?" I FAGET":""}</div><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"7px 0 16px"}}>Senest tildelt</h2>{classAssignments.map(a=>{const r=recipients(a.id),started=r.filter(s=>filledCount(s.id,a.id)>0).length,finished=r.filter(s=>progress(s.id,a.id)==="Færdig ✓").length,specific=assignmentStudents.some(x=>x.assignment_id===a.id);return <button key={a.id} onClick={()=>{setSelectedAssignment(a.id);setSelectedStudent(null)}} style={{width:"100%",textAlign:"left",padding:14,marginBottom:9,border:selectedAssignment===a.id?"2px solid #758b79":"1px solid #dedbd2",borderRadius:10,background:selectedAssignment===a.id?"#f1f4ef":"#fff",cursor:"pointer"}}><strong style={{display:"block",fontSize:16}}>{a.title}</strong><span style={{display:"block",marginTop:5,color:"#68746c",fontSize:13}}>{a.type} · {specific?`${r.length} ${r.length===1?"elev":"elever"}`:"Hele klassen"}</span><span style={{display:"block",marginTop:4,fontSize:12,fontWeight:700,color:"#55705d"}}>{started}/{r.length} i gang{finished?` · ${finished} færdig${finished===1?"":"e"}`:""}</span></button>})}{!classAssignments.length&&<p>Der er ingen opgaver {subjectRoomId?"i dette faglokale":"i denne klasse"} endnu.</p>}</section>
    <section style={box}>{!activeAssignment?<><div style={{fontSize:12,fontWeight:800,letterSpacing:1.5,color:"#6c806f"}}>ELEVSTATUS</div><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"7px 0"}}>Vælg en opgave</h2><p>Tryk på en opgave til venstre. Så får du elever og besvarelser frem med det samme.</p></>:<AssignmentDetail assignment={activeAssignment} students={recipients(activeAssignment.id)} selectedStudent={selectedStudent} setSelectedStudent={setSelectedStudent} activeStudent={activeStudent} activeDraft={activeDraft} progress={progress} filledCount={filledCount} genre={genreFor(activeAssignment)} feedbackText={feedbackText} setFeedbackText={setFeedbackText} feedbackStatus={feedbackStatus} setFeedbackStatus={setFeedbackStatus} saveFeedback={saveFeedback}/>}</section>
   </div>
  </>}
 </div></main>;
}

function AssignmentDetail({assignment,students,selectedStudent,setSelectedStudent,activeStudent,activeDraft,progress,genre,feedbackText,setFeedbackText,feedbackStatus,setFeedbackStatus,saveFeedback}:{assignment:Assignment;students:Student[];selectedStudent:number|null;setSelectedStudent:(id:number)=>void;activeStudent:Student|undefined;activeDraft:Draft|undefined;progress:(studentId:number,assignmentId:number)=>string;filledCount:(studentId:number,assignmentId:number)=>number;genre:DanishGenre|undefined;feedbackText:string;setFeedbackText:(v:string)=>void;feedbackStatus:string;setFeedbackStatus:(v:string)=>void;saveFeedback:()=>void}){
 return <><div style={{fontSize:12,fontWeight:800,letterSpacing:1.5,color:"#6c806f"}}>{assignment.type.toUpperCase()}</div><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"7px 0 8px"}}>{assignment.title}</h2>{assignment.instructions&&<div style={{background:"#f4f2ec",borderRadius:9,padding:"11px 13px",marginBottom:14,lineHeight:1.45,fontSize:14,whiteSpace:"pre-wrap"}}><strong>Opgaveformulering: </strong>{assignment.instructions}</div>}{genre&&<div style={{background:"#eef2ec",borderRadius:9,padding:"10px 12px",marginBottom:14,fontSize:13,lineHeight:1.45}}><strong>{genre.category} · {genre.name}</strong><span style={{display:"block",marginTop:3}}>{genre.purpose}</span></div>}<div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:15}}><span style={{background:"#eef2ec",padding:"6px 9px",borderRadius:999,fontSize:12,fontWeight:800}}>{students.filter(s=>filledCount(s.id,assignment.id)>0).length} i gang</span><span style={{background:"#f3f0e9",padding:"6px 9px",borderRadius:999,fontSize:12,fontWeight:800}}>{students.filter(s=>filledCount(s.id,assignment.id)===0).length} ikke startet</span></div><div style={{display:"grid",gridTemplateColumns:"minmax(175px,.6fr) minmax(260px,1.4fr)",gap:16}}><div>{students.map(s=>{const status=progress(s.id,assignment.id);return <button key={s.id} onClick={()=>setSelectedStudent(s.id)} style={{width:"100%",textAlign:"left",padding:11,marginBottom:7,border:selectedStudent===s.id?"2px solid #758b79":"1px solid #dedbd2",borderRadius:9,background:selectedStudent===s.id?"#f1f4ef":"#fff",cursor:"pointer"}}><strong>{s.name}</strong><small style={{display:"block",marginTop:3,color:status==="Færdig ✓"?"#55705d":"#68746c",fontWeight:status==="Færdig ✓"?800:400}}>{status}</small></button>})}</div><div style={{background:"#faf9f5",borderRadius:10,padding:16,minHeight:250}}>{!activeStudent?<p style={{margin:0}}>Vælg en elev for at åbne besvarelsen.</p>:<><div style={{display:"flex",justifyContent:"space-between",gap:12,marginBottom:14,alignItems:"baseline"}}><h3 style={{margin:0,fontSize:21}}>{activeStudent.name}</h3><span style={{fontSize:12,fontWeight:800,color:"#55705d"}}>{progress(activeStudent.id,assignment.id)}</span></div>{!activeDraft||!activeDraft.content.some(x=>x?.trim())?<p>Eleven har ikke skrevet noget endnu.</p>:activeDraft.content.map((text,i)=>text?.trim()?<div key={i} style={{marginBottom:12,background:"#fff",border:"1px solid #ebe7de",borderRadius:9,padding:13}}><strong style={{fontSize:12,color:"#6c806f"}}>{genre?.structure[i]||`Felt ${i+1}`}</strong><p style={{whiteSpace:"pre-wrap",lineHeight:1.55,margin:"5px 0 0"}}>{text}</p></div>:null)}<div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #dedbd2"}}><label style={{display:"block",fontWeight:800,marginBottom:7}}>Feedback til eleven</label><textarea value={feedbackText} onChange={e=>{setFeedbackText(e.target.value);setFeedbackStatus("")}} placeholder="Skriv din feedback her…" style={{width:"100%",minHeight:105,padding:11,border:"1px solid #d8d5cd",borderRadius:9,resize:"vertical",font:"inherit",boxSizing:"border-box"}}/><div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"flex-end",marginTop:9}}>{feedbackStatus&&<span style={{fontSize:13,fontWeight:700,color:feedbackStatus.includes("Gemt")?"#55705d":"#7b6754"}}>{feedbackStatus}</span>}<button onClick={saveFeedback} style={{border:0,borderRadius:9,background:"#435c4a",color:"#fff",padding:"10px 16px",fontWeight:800,cursor:"pointer"}}>Gem feedback</button></div></div></>}</div></div></>;
}
