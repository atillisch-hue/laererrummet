"use client";

import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";

const areas=[
 {icon:"Aa",title:"Ordklasser",text:"Navneord, udsagnsord, tillægsord, stedord, biord og de øvrige ordklasser.",topics:["Navneord","Udsagnsord","Tillægsord","Stedord","Biord"]},
 {icon:"S",title:"Sætninger",text:"Arbejd med hvordan sætninger er bygget op, og hvilken funktion ordene har.",topics:["Grundled og udsagnsled","Genstandsled","Omsagnsled","Hel- og ledsætninger"]},
 {icon:",",title:"Komma",text:"Træn komma med forklaringer, eksempler og opgaver i stigende sværhedsgrad.",topics:["Komma mellem helsætninger","Komma ved ledsætninger","Kommaøvelser"]},
 {icon:"✎",title:"Sprog der virker",text:"Fra grammatisk form til funktion og effekt i elevernes egne tekster.",topics:["Form → funktion → effekt","Præcise verber","Variation i sætninger","Sproglig effekt"]}
];
const levels=[{id:"basis",title:"Basis"},{id:"traening",title:"Træning"},{id:"udfordring",title:"Udfordring"}];

type ClassRow={id:number;name:string};
type Student={id:number;name:string;class_id:number|string|null};
type GrammarAssignment={id:number;class_id:number;title:string;area:string;topic:string;level:string;created_at:string};
type Recipient={grammar_assignment_id:number;student_id:number};
type AttemptRef={grammar_assignment_id:number};
type AnswerDetail={question?:string;answer?:string;studentAnswer?:string;correctAnswer?:string;correct?:boolean;explanation?:string};
type Result={student_id:number;student_name:string;completed:boolean;score:number|null;max_score:number|null;completed_at:string|null;answers?:Record<string,string|AnswerDetail>|null};

const button=(active:boolean):React.CSSProperties=>({padding:"10px 13px",borderRadius:8,border:"1px solid #526b60",background:active?"#526b60":"white",color:active?"white":"#26342e",fontWeight:800,cursor:"pointer"});
const smallButton:React.CSSProperties={padding:"6px 9px",border:"1px solid #d4d0c7",borderRadius:8,background:"white",color:"#526159",fontWeight:800,cursor:"pointer",fontSize:12};
const field:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",marginTop:6,padding:"10px 11px",border:"1px solid #d8d5cd",borderRadius:8,background:"white"};

export default function GrammarPage(){
 const[ready,setReady]=useState(false);
 const[selected,setSelected]=useState<number|null>(null);
 const[topic,setTopic]=useState("");
 const[level,setLevel]=useState("traening");
 const[classes,setClasses]=useState<ClassRow[]>([]);
 const[students,setStudents]=useState<Student[]>([]);
 const[classId,setClassId]=useState<number|"">("");
 const[recipientMode,setRecipientMode]=useState<"class"|"students">("class");
 const[selectedStudents,setSelectedStudents]=useState<number[]>([]);
 const[assignments,setAssignments]=useState<GrammarAssignment[]>([]);
 const[recipients,setRecipients]=useState<Recipient[]>([]);
 const[lockedIds,setLockedIds]=useState<Set<number>>(()=>new Set());
 const[saving,setSaving]=useState(false);
 const[message,setMessage]=useState("");
 const[openAssignment,setOpenAssignment]=useState<number|null>(null);
 const[openStudent,setOpenStudent]=useState<number|null>(null);
 const[results,setResults]=useState<Result[]>([]);
 const[resultsLoading,setResultsLoading]=useState(false);
 const[editId,setEditId]=useState<number|null>(null);
 const[editArea,setEditArea]=useState("");
 const[editTopic,setEditTopic]=useState("");
 const[editLevel,setEditLevel]=useState("traening");
 const[editClassId,setEditClassId]=useState<number|"">("");
 const[editRecipientMode,setEditRecipientMode]=useState<"class"|"students">("class");
 const[editStudents,setEditStudents]=useState<number[]>([]);

 const classStudents=useMemo(()=>students.filter(s=>Number(s.class_id)===Number(classId)),[students,classId]);
 const editClassStudents=useMemo(()=>students.filter(s=>Number(s.class_id)===Number(editClassId)),[students,editClassId]);

 async function loadAssignments(id:number){
  const{data,error}=await supabase.from("grammar_assignments").select("id,class_id,title,area,topic,level,created_at").eq("class_id",id).order("created_at",{ascending:false});
  if(error){setAssignments([]);setMessage(error.message);return}
  const rows=(data||[]) as GrammarAssignment[];setAssignments(rows);
  const ids=rows.map(x=>x.id);
  if(!ids.length){setRecipients([]);setLockedIds(new Set());return}
  const[r,a]=await Promise.all([
   supabase.from("grammar_assignment_students").select("grammar_assignment_id,student_id").in("grammar_assignment_id",ids),
   supabase.from("grammar_attempts").select("grammar_assignment_id").in("grammar_assignment_id",ids)
  ]);
  setRecipients((r.data||[]) as Recipient[]);
  setLockedIds(new Set(((a.data||[]) as AttemptRef[]).map(x=>Number(x.grammar_assignment_id))));
 }

 useEffect(()=>{(async()=>{
  const{data:s}=await supabase.auth.getSession();if(!s.session){window.location.href="/?teacher=1";return}
  const[c,st]=await Promise.all([
   supabase.from("classes").select("id,name").order("id"),
   supabase.from("students").select("id,name,class_id").order("name")
  ]);
  const rows=(c.data||[]) as ClassRow[];setClasses(rows);setStudents((st.data||[]) as Student[]);
  if(rows[0]){setClassId(rows[0].id);await loadAssignments(rows[0].id)}
  setReady(true);
 })()},[]);

 const toggleStudent=(id:number)=>setSelectedStudents(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id]);
 const toggleEditStudent=(id:number)=>setEditStudents(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id]);
 const chooseArea=(i:number)=>{setSelected(selected===i?null:i);setTopic("");setMessage("")};
 async function changeClass(id:number){setClassId(id);setSelectedStudents([]);setOpenAssignment(null);setOpenStudent(null);setResults([]);setEditId(null);setMessage("");await loadAssignments(id)}

 async function createAssignment(){
  if(selected===null||!topic||!classId||(recipientMode==="students"&&!selectedStudents.length))return;
  setSaving(true);setMessage("");
  const area=areas[selected].title,levelTitle=levels.find(l=>l.id===level)?.title||level,title=`${topic} · ${levelTitle}`;
  const{data:a,error}=await supabase.from("grammar_assignments").insert({class_id:classId,area,topic,level,title}).select("id").single();
  if(error){setMessage(`Kunne ikke oprette: ${error.message}`);setSaving(false);return}
  if(recipientMode==="students"){
   const{error:linkError}=await supabase.from("grammar_assignment_students").insert(selectedStudents.map(student_id=>({grammar_assignment_id:a.id,student_id})));
   if(linkError){await supabase.from("grammar_assignments").delete().eq("id",a.id);setMessage(`Kunne ikke vælge elever: ${linkError.message}`);setSaving(false);return}
  }
  setMessage(`✓ ${title} er tildelt ${recipientMode==="class"?"hele klassen":selectedStudents.length+" elev"+(selectedStudents.length===1?"":"er")}.`);
  await loadAssignments(Number(classId));setSaving(false);
 }

 function startEdit(a:GrammarAssignment){
  if(lockedIds.has(a.id))return;
  const rs=recipients.filter(r=>r.grammar_assignment_id===a.id).map(r=>r.student_id);
  setEditId(a.id);setEditArea(a.area);setEditTopic(a.topic);setEditLevel(a.level);setEditClassId(a.class_id);setEditRecipientMode(rs.length?"students":"class");setEditStudents(rs);setMessage("");
 }
 async function saveEdit(a:GrammarAssignment){
  if(!editArea||!editTopic||!editLevel||!editClassId||(editRecipientMode==="students"&&!editStudents.length))return;
  const levelTitle=levels.find(l=>l.id===editLevel)?.title||editLevel,title=`${editTopic} · ${levelTitle}`;
  setSaving(true);setMessage("");
  const{error}=await supabase.rpc("update_grammar_assignment_atomic",{
   p_assignment_id:a.id,p_class_id:Number(editClassId),p_area:editArea,p_topic:editTopic,p_level:editLevel,p_title:title,p_student_ids:editRecipientMode==="students"?editStudents:null
  });
  if(error)setMessage(error.message);else{setMessage("✓ Grammatiktildelingen er opdateret.");setEditId(null);if(Number(editClassId)!==Number(classId))await changeClass(Number(editClassId));else await loadAssignments(Number(classId))}
  setSaving(false);
 }
 async function removeAssignment(a:GrammarAssignment){
  if(lockedIds.has(a.id)){setMessage("Tildelingen har elevbesvarelser og er derfor låst som historik.");return}
  if(!confirm("Vil du slette grammatiktildelingen?"))return;
  const{error}=await supabase.from("grammar_assignments").delete().eq("id",a.id);
  if(error)setMessage(error.message);else{if(openAssignment===a.id){setOpenAssignment(null);setResults([])}setEditId(null);await loadAssignments(Number(classId))}
 }

 async function showResults(id:number){
  if(openAssignment===id){setOpenAssignment(null);setOpenStudent(null);setResults([]);return}
  setOpenAssignment(id);setOpenStudent(null);setResultsLoading(true);
  const{data,error}=await supabase.rpc("teacher_grammar_results",{p_assignment_id:id});
  setResults(error||!data?.ok?[]:(data.results||[]));setResultsLoading(false);
 }

 const renderAnswer=(i:string,value:string|AnswerDetail)=>{
  if(typeof value==="string")return <div key={i} style={{display:"grid",gridTemplateColumns:"70px 1fr",gap:10,padding:"8px 10px",background:"white",borderRadius:8,border:"1px solid #e5e1d8"}}><span style={{fontSize:12,fontWeight:800,color:"#777"}}>Opgave {Number(i)+1}</span><span style={{fontWeight:700}}>{value}</span></div>;
  const d=value as AnswerDetail,studentAnswer=d.studentAnswer??d.answer;
  return <div key={i} style={{padding:"12px 13px",background:"white",borderRadius:9,border:`1px solid ${d.correct===false?"#dfc6c0":"#d9e2d8"}`}}><div style={{display:"flex",gap:8,alignItems:"center",marginBottom:7}}><strong style={{color:d.correct===false?"#9a4e43":"#42614f"}}>{d.correct===false?"✕ Forkert":"✓ Rigtigt"}</strong><span style={{fontSize:12,color:"#777"}}>Opgave {Number(i)+1}</span></div>{d.question&&<div style={{fontWeight:800,marginBottom:8}}>{d.question}</div>}<div style={{fontSize:13,lineHeight:1.5}}><span style={{color:"#777"}}>Elevens svar: </span><strong>{studentAnswer||"—"}</strong></div>{d.correct===false&&d.correctAnswer&&<div style={{fontSize:13,lineHeight:1.5,marginTop:3}}><span style={{color:"#777"}}>Korrekt svar: </span><strong>{d.correctAnswer}</strong></div>}{d.explanation&&<div style={{fontSize:13,lineHeight:1.45,marginTop:7,paddingTop:7,borderTop:"1px solid #eeeae2",color:"#59615c"}}>{d.explanation}</div>}</div>;
 };

 if(!ready)return <main style={{padding:50}}>Åbner grammatik…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"30px 24px 80px",color:"#26342e"}}><section style={{maxWidth:1080,margin:"0 auto"}}>
  <a href="/preparation" style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← Til Forberedelsen</a>
  <p className="eyebrow" style={{marginTop:28}}>TRÆNINGSOPGAVE</p><h1 style={{marginBottom:8}}>Tildel noget nu</h1><p style={{fontSize:17,color:"#707670",maxWidth:760,lineHeight:1.5,marginTop:0}}>Vælg område, emne, niveau og hvem der skal have det. Ubesvarede tildelinger kan redigeres eller slettes bagefter.</p>

  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginTop:25}}>{areas.map((a,i)=><button key={a.title} onClick={()=>chooseArea(i)} style={{background:selected===i?"#edf1ec":"white",border:selected===i?"2px solid #526b60":"1px solid #dfdcd4",borderRadius:13,padding:19,textAlign:"left",cursor:"pointer",minHeight:155}}><span style={{fontFamily:"Georgia,serif",fontWeight:800,fontSize:18,color:"#365044"}}>{a.icon}</span><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:21,marginTop:12,color:"#27352d"}}>{a.title}</strong><span style={{display:"block",color:"#727772",lineHeight:1.4,marginTop:6,fontSize:14}}>{a.text}</span></button>)}</div>

  {selected!==null&&<div style={panel}><strong>1. Vælg emne</strong><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>{areas[selected].topics.map(t=><button key={t} onClick={()=>setTopic(t)} style={{...smallButton,border:topic===t?"2px solid #526b60":"1px solid #d8d5cd",background:topic===t?"#edf1ec":"#fff"}}>{t}</button>)}</div></div>}
  {topic&&<div style={panel}><strong>2. Vælg niveau</strong><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:10}}>{levels.map(l=><button key={l.id} onClick={()=>setLevel(l.id)} style={button(level===l.id)}>{l.title}</button>)}</div><div style={{marginTop:18,paddingTop:18,borderTop:"1px solid #ebe7de"}}><strong>3. Hvem skal have den?</strong><div style={{display:"flex",gap:10,alignItems:"end",flexWrap:"wrap",marginTop:10}}><label style={{fontWeight:800,fontSize:13}}>Klasse<select value={classId} onChange={e=>changeClass(Number(e.target.value))} style={{...field,minWidth:210}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button onClick={()=>{setRecipientMode("class");setSelectedStudents([])}} style={button(recipientMode==="class")}>Hele klassen</button><button onClick={()=>setRecipientMode("students")} style={button(recipientMode==="students")}>Udvalgte elever</button></div>{recipientMode==="students"&&<div style={{marginTop:12}}>{classStudents.length?<div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{classStudents.map(s=><button key={s.id} onClick={()=>toggleStudent(s.id)} style={{...smallButton,border:selectedStudents.includes(s.id)?"2px solid #526b60":"1px solid #d8d5cd",borderRadius:999,background:selectedStudents.includes(s.id)?"#edf1ec":"white"}}>{selectedStudents.includes(s.id)?"✓ ":""}{s.name}</button>)}</div>:<p style={{margin:"8px 0 0",color:"#8a5d2d",fontWeight:700}}>Der er ingen elever registreret i denne klasse endnu.</p>}</div>}<div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginTop:18}}><button disabled={saving||(recipientMode==="students"&&!selectedStudents.length)} onClick={createAssignment} style={{padding:"12px 18px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,cursor:saving?"wait":"pointer",opacity:saving||(recipientMode==="students"&&!selectedStudents.length)?0.55:1}}>{saving?"Tildeler…":"Tildel nu →"}</button></div></div></div>}
  {message&&<div style={{marginTop:14,padding:"11px 13px",background:message.startsWith("✓")?"#e7eee9":"#fff3cd",borderRadius:9,fontWeight:800}}>{message}</div>}

  <div style={{...panel,marginTop:24}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,flexWrap:"wrap"}}><div><p className="eyebrow" style={{marginBottom:5}}>OPFØLGNING</p><h2 style={{fontFamily:"Georgia,serif",margin:0,fontSize:25}}>Senest tildelt</h2></div><span style={{fontSize:13,color:"#747a75"}}>Besvarede tildelinger låses som historik</span></div>
   {assignments.length===0?<p style={{color:"#777"}}>Ingen grammatikopgaver tildelt endnu.</p>:<div style={{display:"grid",gap:9,marginTop:15}}>{assignments.slice(0,10).map(a=>{
    const locked=lockedIds.has(a.id),editing=editId===a.id,assignedTo=recipients.filter(r=>r.grammar_assignment_id===a.id).map(r=>r.student_id);
    return <article key={a.id} style={{border:"1px solid #e4e0d8",borderRadius:10,background:openAssignment===a.id?"#edf1ec":"#faf9f6",padding:13}}>
     {editing&&!locked?<div style={{display:"grid",gap:9}}><strong>Redigér grammatiktildeling</strong><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}><label style={{fontWeight:800,fontSize:12}}>Område<select value={editArea} onChange={e=>{setEditArea(e.target.value);setEditTopic("")}} style={field}>{areas.map(x=><option key={x.title} value={x.title}>{x.title}</option>)}</select></label><label style={{fontWeight:800,fontSize:12}}>Emne<select value={editTopic} onChange={e=>setEditTopic(e.target.value)} style={field}><option value="">Vælg emne</option>{(areas.find(x=>x.title===editArea)?.topics||[]).map(x=><option key={x}>{x}</option>)}</select></label><label style={{fontWeight:800,fontSize:12}}>Niveau<select value={editLevel} onChange={e=>setEditLevel(e.target.value)} style={field}>{levels.map(x=><option key={x.id} value={x.id}>{x.title}</option>)}</select></label><label style={{fontWeight:800,fontSize:12}}>Klasse<select value={editClassId} onChange={e=>{setEditClassId(Number(e.target.value));setEditStudents([]);setEditRecipientMode("class")}} style={field}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label></div><div><strong style={{fontSize:12}}>Modtagere</strong><div style={{display:"flex",gap:7,flexWrap:"wrap",marginTop:7}}><button onClick={()=>{setEditRecipientMode("class");setEditStudents([])}} style={button(editRecipientMode==="class")}>Hele klassen</button><button onClick={()=>setEditRecipientMode("students")} style={button(editRecipientMode==="students")}>Udvalgte elever</button></div>{editRecipientMode==="students"&&<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>{editClassStudents.map(s=><button key={s.id} onClick={()=>toggleEditStudent(s.id)} style={{...smallButton,borderRadius:999,background:editStudents.includes(s.id)?"#edf1ec":"white",border:editStudents.includes(s.id)?"2px solid #526b60":"1px solid #d8d5cd"}}>{editStudents.includes(s.id)?"✓ ":""}{s.name}</button>)}</div>}</div><div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button onClick={()=>saveEdit(a)} disabled={saving||!editTopic||(editRecipientMode==="students"&&!editStudents.length)} style={{...smallButton,background:"#365044",color:"white",borderColor:"#365044"}}>{saving?"Gemmer…":"Gem"}</button><button onClick={()=>setEditId(null)} style={smallButton}>Annullér</button><button onClick={()=>removeAssignment(a)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></div></div>:<>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><button onClick={()=>showResults(a.id)} style={{flex:"1 1 360px",border:0,background:"transparent",padding:0,textAlign:"left",cursor:"pointer",color:"inherit"}}><strong style={{display:"block",fontSize:15}}>{a.title}</strong><span style={{fontSize:12,color:"#737873"}}>{a.area} · {assignedTo.length?`${assignedTo.length} udvalgte elever`:"Hele klassen"}</span></button><div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>{locked?<span style={{fontSize:11,fontWeight:900,color:"#8a6e42",background:"#f7edd7",padding:"5px 8px",borderRadius:999}}>LÅST · HAR BESVARELSER</span>:<><button onClick={()=>startEdit(a)} style={smallButton}>Redigér</button><button onClick={()=>removeAssignment(a)} style={{...smallButton,color:"#8a3c34"}}>Slet</button></>}<button onClick={()=>showResults(a.id)} style={smallButton}>{openAssignment===a.id?"Luk status ↑":"Se status →"}</button></div></div>
      {openAssignment===a.id&&<div style={{padding:"14px 2px 2px",borderTop:"1px solid #dedfd9",marginTop:12}}>{resultsLoading?<p>Henter status…</p>:results.length===0?<p style={{color:"#777"}}>Ingen elevstatus endnu.</p>:<><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}><span style={statusChip}>{results.filter(r=>r.completed).length} færdige</span><span style={statusChip}>{results.filter(r=>!r.completed).length} mangler</span><span style={statusChip}>{results.length} tildelt</span></div><div style={{display:"grid",gap:7}}>{results.map(r=><div key={r.student_id} style={{background:"white",border:"1px solid #e3dfd7",borderRadius:9,padding:"10px 12px"}}><button onClick={()=>setOpenStudent(openStudent===r.student_id?null:r.student_id)} style={{width:"100%",display:"flex",justifyContent:"space-between",gap:10,border:0,background:"transparent",padding:0,textAlign:"left",cursor:"pointer",color:"inherit"}}><strong>{r.student_name}</strong><span style={{fontWeight:800,color:r.completed?"#526b60":"#8a6e42"}}>{r.completed?`${r.score??0}/${r.max_score??0}`:"Mangler"}</span></button>{openStudent===r.student_id&&r.answers&&<div style={{display:"grid",gap:7,marginTop:10,paddingTop:10,borderTop:"1px solid #eee"}}>{Object.entries(r.answers).map(([i,v])=>renderAnswer(i,v))}</div>}</div>)}</div></>}</div>}
     </>}
    </article>;
   })}</div>}
  </div>
 </section></main>;
}

const panel:React.CSSProperties={marginTop:16,background:"white",border:"1px solid #dfdcd4",borderRadius:13,padding:20};
const statusChip:React.CSSProperties={padding:"6px 9px",borderRadius:999,background:"#f2eee5",fontSize:12,fontWeight:800};
