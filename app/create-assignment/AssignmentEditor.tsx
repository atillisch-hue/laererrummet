"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";
import {danishGenres,danishGenreCategories,danishGenreByName,type DanishGenre,type DanishGenreCategory} from "../../lib/danishGenreCatalog";
import {genericAssignmentTemplates,mathAssignmentTemplates,type AssignmentKind,type AssignmentTemplate} from "../../lib/subjectAssignmentCatalog";

type ClassRow={id:number;name:string};
type Student={id:number;name:string;class_id:number|null};
type Room={id:number;class_id:number;subject_id:number;title:string|null};
type Subject={id:number;name:string;slug:string};
type RoomTeacher={class_subject_id:number;user_id:string};
type ExistingAssignment={id:number;title:string;instructions:string|null;type:string;class_id:number;class_subject_id:number|null;subject_id:number|null;assignment_kind:AssignmentKind};

const input:React.CSSProperties={boxSizing:"border-box",display:"block",width:"100%",marginTop:7,padding:11,border:"1px solid #d8d5cd",borderRadius:8,background:"white",font:"inherit"};
const small:React.CSSProperties={fontSize:12,color:"#707670"};
const panel:React.CSSProperties={background:"white",border:"1px solid #dedbd3",borderRadius:14,padding:18,marginBottom:14};

const legacyGenre=(type:string):DanishGenre|undefined=>{
 if(type==="Artikel")return danishGenres.find(g=>g.id==="artikel")||danishGenres.find(g=>g.id==="nyhedsartikel");
 if(type==="Fortælling")return danishGenres.find(g=>g.id==="novelle");
 return danishGenreByName(type);
};

function assignmentKindForSubject(slug:string|undefined):AssignmentKind{
 if(slug==="dansk")return "danish_writing";
 if(slug==="matematik")return "math_task";
 return "generic";
}

export default function AssignmentEditor(){
 const search=useSearchParams();
 const editId=Number(search.get("edit"))||0;
 const editing=editId>0;
 const[ready,setReady]=useState(false),[classes,setClasses]=useState<ClassRow[]>([]),[students,setStudents]=useState<Student[]>([]),[rooms,setRooms]=useState<Room[]>([]),[subjects,setSubjects]=useState<Subject[]>([]),[roomTeachers,setRoomTeachers]=useState<RoomTeacher[]>([]),[userId,setUserId]=useState(""),[admin,setAdmin]=useState(false),[error,setError]=useState("");
 const[classId,setClassId]=useState<number|"">(""),[roomId,setRoomId]=useState<number|"">(""),[title,setTitle]=useState(""),[instructions,setInstructions]=useState(""),[genreId,setGenreId]=useState("debatindlaeg"),[category,setCategory]=useState<DanishGenreCategory>("Opinion"),[templateId,setTemplateId]=useState(""),[saving,setSaving]=useState(false),[recipientMode,setRecipientMode]=useState<"class"|"students">("class"),[selected,setSelected]=useState<number[]>([]);

 useEffect(()=>{(async()=>{
  const{data:s}=await supabase.auth.getSession();const user=s.session?.user;if(!user){window.location.href="/?teacher=1";return}
  setUserId(user.id);const isAdmin=hasRole(user,"admin");setAdmin(isAdmin);
  const[c,st,r,sub,rt]=await Promise.all([
   supabase.from("classes").select("id,name").order("id"),
   supabase.from("students").select("id,name,class_id").order("name"),
   supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("active",true),
   supabase.from("subjects").select("id,name,slug").eq("active",true),
   supabase.from("class_subject_teachers").select("class_subject_id,user_id")
  ]);
  const classRows=(c.data||[]) as ClassRow[],roomRows=(r.data||[]) as Room[],subjectRows=(sub.data||[]) as Subject[],teacherRows=(rt.data||[]) as RoomTeacher[];
  setClasses(classRows);setStudents((st.data||[]) as Student[]);setRooms(roomRows);setSubjects(subjectRows);setRoomTeachers(teacherRows);
  const canUse=(room:Room)=>isAdmin||teacherRows.some(t=>t.class_subject_id===room.id&&t.user_id===user.id);

  if(editing){
   const[a,rec]=await Promise.all([
    supabase.from("assignments").select("id,title,instructions,type,class_id,class_subject_id,subject_id,assignment_kind").eq("id",editId).maybeSingle(),
    supabase.from("assignment_students").select("student_id").eq("assignment_id",editId)
   ]);
   if(a.error||!a.data){setError("Du har ikke adgang til opgaven, eller opgaven findes ikke.");setReady(true);return}
   const row=a.data as ExistingAssignment;
   const inferredRoom=row.class_subject_id?roomRows.find(x=>x.id===row.class_subject_id):roomRows.find(x=>x.class_id===row.class_id&&x.subject_id===row.subject_id&&canUse(x));
   setClassId(row.class_id);setRoomId(inferredRoom?.id||"");setTitle(row.title);setInstructions(row.instructions||"");
   const found=legacyGenre(row.type);if(found){setGenreId(found.id);setCategory(found.category)}
   const templatePool=row.assignment_kind==="math_task"?mathAssignmentTemplates:genericAssignmentTemplates;
   const existingTemplate=templatePool.find(t=>t.name===row.type||t.id===row.type);setTemplateId(existingTemplate?.id||templatePool[0]?.id||"");
   const ids=(rec.data||[]).map(x=>Number(x.student_id));setSelected(ids);setRecipientMode(ids.length?"students":"class");
   if(!inferredRoom)setError("Opgaven mangler et aktivt faglokale. Vælg eller opret et faglokale i samme fag, før den kan gemmes igen.");
   setReady(true);return;
  }

  const requestedClass=Number(search.get("class")),requestedRoom=Number(search.get("subject"));
  const allowedRequestedRoom=roomRows.find(x=>x.id===requestedRoom&&canUse(x));
  const initialClass=allowedRequestedRoom?.class_id||(classRows.some(x=>x.id===requestedClass)?requestedClass:classRows[0]?.id);
  if(initialClass)setClassId(initialClass);
  if(allowedRequestedRoom&&allowedRequestedRoom.class_id===initialClass)setRoomId(allowedRequestedRoom.id);
  setReady(true);
 })()},[search,editId,editing]);

 const classStudents=students.filter(s=>s.class_id===Number(classId));
 const editableRooms=useMemo(()=>rooms.filter(r=>r.class_id===Number(classId)&&(admin||roomTeachers.some(t=>t.class_subject_id===r.id&&t.user_id===userId)||editing&&r.id===Number(roomId))),[rooms,classId,admin,roomTeachers,userId,editing,roomId]);
 const currentRoom=editableRooms.find(r=>r.id===Number(roomId))||rooms.find(r=>r.id===Number(roomId));
 const currentSubject=subjects.find(s=>s.id===currentRoom?.subject_id);
 const subjectSlug=currentSubject?.slug;
 const assignmentKind=assignmentKindForSubject(subjectSlug);
 const roomLabel=(room:Room)=>room.title||subjects.find(s=>s.id===room.subject_id)?.name||"Fag";
 const genre=useMemo(()=>danishGenres.find(g=>g.id===genreId)||danishGenres[0],[genreId]);
 const categoryGenres=useMemo(()=>danishGenres.filter(g=>g.category===category),[category]);
 const templatePool=subjectSlug==="matematik"?mathAssignmentTemplates:subjectSlug&&subjectSlug!=="dansk"?genericAssignmentTemplates:[];
 const template:AssignmentTemplate|null=templatePool.find(t=>t.id===templateId)||templatePool[0]||null;
 const taskType=assignmentKind==="danish_writing"?genre.name:template?.name||"Opgave";

 useEffect(()=>{
  if(subjectSlug==="matematik"&&!mathAssignmentTemplates.some(t=>t.id===templateId))setTemplateId(mathAssignmentTemplates[0].id);
  if(subjectSlug&&subjectSlug!=="dansk"&&subjectSlug!=="matematik"&&!genericAssignmentTemplates.some(t=>t.id===templateId))setTemplateId(genericAssignmentTemplates[0].id);
 },[subjectSlug,templateId]);

 function toggle(id:number){setSelected(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id])}
 function chooseCategory(c:DanishGenreCategory){setCategory(c);const first=danishGenres.find(g=>g.category===c);if(first)setGenreId(first.id)}
 function changeClass(next:number){setClassId(next);setSelected([]);setRoomId("");setTemplateId("");setError("")}
 function changeRoom(next:number){setRoomId(next);setTemplateId("");setError("")}

 async function save(){
  if(!title.trim()||!instructions.trim()||!classId||!roomId||(recipientMode==="students"&&!selected.length)||saving)return;
  setSaving(true);setError("");
  const recipients=recipientMode==="students"?selected:null;
  if(editing){
   const{data,error:e}=await supabase.rpc("update_assignment_and_recipients_v2",{p_assignment_id:editId,p_title:title.trim(),p_instructions:instructions.trim(),p_type:taskType,p_class_subject_id:Number(roomId),p_assignment_kind:assignmentKind,p_student_ids:recipients});
   if(e||!data?.ok){setSaving(false);setError(e?.message||data?.error||"Opgaven kunne ikke gemmes.");return}
   window.location.href=`/students/subjects/${roomId}`;return;
  }
  const{data,error:e}=await supabase.rpc("create_assignment_and_recipients_v2",{p_class_subject_id:Number(roomId),p_title:title.trim(),p_instructions:instructions.trim(),p_type:taskType,p_assignment_kind:assignmentKind,p_student_ids:recipients});
  if(e||!data?.ok){setSaving(false);setError(e?.message||data?.error||"Opgaven kunne ikke oprettes.");return}
  window.location.href=`/students/subjects/${roomId}`;
 }

 async function removeAssignment(){
  if(!editing)return;
  if(!window.confirm("Slet opgaven permanent? Elevtildelinger, kladder, feedback og koblinger til lektioner bliver også slettet."))return;
  setSaving(true);setError("");
  const{error:e}=await supabase.from("assignments").delete().eq("id",editId);
  if(e){setSaving(false);setError(e.message);return}
  window.location.replace(roomId?`/students/subjects/${roomId}`:`/teacher-overview?class=${classId}`);
 }

 const disabled=saving||!title.trim()||!instructions.trim()||!classId||!roomId||(recipientMode==="students"&&!selected.length);
 if(!ready)return <main style={{padding:50}}>Henter opgaver…</main>;
 if(error&&!classId)return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:50,color:"#26342e"}}><h1>Opgaven kunne ikke åbnes</h1><p>{error}</p><Link href="/teacher-dashboard">← Klasseværelset</Link></main>;
 const backHref=roomId?`/students/subjects/${roomId}`:editing&&classId?`/teacher-overview?class=${classId}`:"/preparation";
 const heading=subjectSlug==="dansk"?"Danskopgave":subjectSlug==="matematik"?"Matematikopgave":currentSubject?`${currentSubject.name}-opgave`:"Ny opgave";
 const helper=subjectSlug==="dansk"?"Vælg en dansk teksttype. Eleven får genretilpasset skrivehjælp.":subjectSlug==="matematik"?"Vælg en matematisk arbejdsform. Eleven får felter, der gør metode, beregning og ræsonnement synligt.":"Vælg en faglig arbejdsform, der passer til opgaven.";

 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"28px 24px 80px",color:"#26342e"}}><section style={{maxWidth:1040,margin:"0 auto"}}>
  <Link href={backHref} style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← {roomId&&currentRoom?`Til ${roomLabel(currentRoom)}`:editing?"Til opgaver":"Til Forberedelsen"}</Link>
  <div style={{margin:"25px 0 18px",display:"flex",justifyContent:"space-between",alignItems:"start",gap:14,flexWrap:"wrap"}}><div><p className="eyebrow" style={{margin:"0 0 5px"}}>{currentSubject?.name?.toUpperCase()||"OPGAVE"}</p><h1 style={{margin:0}}>{editing?`Redigér ${heading.toLowerCase()}`:heading}</h1><p style={{color:"#707670",margin:"7px 0 0",maxWidth:760}}>{helper}</p></div>{editing&&<button onClick={removeAssignment} disabled={saving} style={danger}>Slet opgave</button>}</div>
  {error&&<div style={{padding:"11px 13px",background:"#fff1ed",border:"1px solid #e5c7c0",borderRadius:9,color:"#8a3e36",marginBottom:14}}>{error}</div>}

  <section style={panel}><p style={{fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:"0 0 9px"}}>1. FAG</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12}}><label style={{fontWeight:800,fontSize:13}}>Klasse<select disabled={editing} value={classId} onChange={e=>changeClass(Number(e.target.value))} style={{...input,opacity:editing?.7:1}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label style={{fontWeight:800,fontSize:13}}>Faglokale<select disabled={editing&&Boolean(roomId)} value={roomId} onChange={e=>changeRoom(Number(e.target.value))} style={{...input,opacity:editing&&roomId?.7:1}}><option value="">Vælg fag…</option>{editableRooms.map(r=><option key={r.id} value={r.id}>{roomLabel(r)}</option>)}</select></label></div>{!editableRooms.length&&<p style={{...small,marginBottom:0,color:"#8a5a38"}}>Der er ikke et faglokale, du kan redigere, i denne klasse. Opret/tilknyt faglokalet først — nye opgaver kan ikke længere være fagløse.</p>}{currentSubject&&<div style={{marginTop:12,padding:"10px 12px",borderRadius:9,background:"#edf1ec",fontWeight:850}}>✓ Opgaven bliver gemt som <strong>{currentSubject.name}</strong>. Klasseværelset blokerer fagligt forkerte kombinationer i databasen.</div>}</section>

  {subjectSlug==="dansk"&&<section style={panel}><p style={{fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:"0 0 9px"}}>2. TEKSTTYPE / GENRE</p><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{danishGenreCategories.map(c=><button type="button" key={c} onClick={()=>chooseCategory(c)} style={{padding:"8px 11px",borderRadius:999,border:category===c?"2px solid #526b60":"1px solid #d8d5cd",background:category===c?"#edf1ec":"white",fontWeight:800,cursor:"pointer"}}>{c}</button>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:8,marginTop:12}}>{categoryGenres.map(g=><button type="button" key={g.id} onClick={()=>setGenreId(g.id)} style={{textAlign:"left",padding:13,borderRadius:10,border:genre.id===g.id?"2px solid #526b60":"1px solid #dedbd3",background:genre.id===g.id?"#edf1ec":"#faf9f6",cursor:"pointer"}}><strong>{g.name}</strong><span style={{display:"block",...small,marginTop:4}}>{g.structure.length} skrivefelter</span></button>)}</div></section>}

  {subjectSlug&&subjectSlug!=="dansk"&&<section style={panel}><p style={{fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:"0 0 9px"}}>2. OPGAVETYPE</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:9}}>{templatePool.map(t=><button type="button" key={t.id} onClick={()=>setTemplateId(t.id)} style={{textAlign:"left",padding:14,borderRadius:10,border:template?.id===t.id?"2px solid #526b60":"1px solid #dedbd3",background:template?.id===t.id?"#edf1ec":"#faf9f6",cursor:"pointer",color:"inherit"}}><strong style={{display:"block"}}>{t.name}</strong><span style={{display:"block",...small,marginTop:5,lineHeight:1.4}}>{t.description}</span></button>)}</div></section>}

  <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.25fr) minmax(280px,.75fr)",gap:14}}>
   <div style={{background:"white",border:"1px solid #dfdcd4",borderRadius:13,padding:20}}>
    <p style={{fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:"0 0 13px"}}>3. OPGAVEN</p>
    <label style={{display:"block",fontWeight:800,fontSize:13}}>Titel<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder={subjectSlug==="matematik"?"Fx Design den billigste skoleudflugt":`Fx ${taskType} om kunstig intelligens`} style={input}/></label>
    <label style={{display:"block",fontWeight:800,fontSize:13,marginTop:16}}>Opgaveformulering<textarea value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Skriv hvad eleven skal undersøge, løse, skrive eller producere." rows={6} style={{...input,lineHeight:1.5,resize:"vertical"}}/><span style={{display:"block",fontWeight:400,...small,marginTop:5}}>Det er denne tekst, eleven ser, når opgaven åbnes.</span></label>
    <div style={{marginTop:18}}><strong style={{fontSize:13}}>4. Modtagere</strong><div style={{display:"flex",gap:7,marginTop:7,flexWrap:"wrap"}}><button type="button" onClick={()=>{setRecipientMode("class");setSelected([])}} style={modeButton(recipientMode==="class")}>Hele klassen</button><button type="button" onClick={()=>setRecipientMode("students")} style={modeButton(recipientMode==="students")}>Udvalgte elever</button></div></div>
    {recipientMode==="students"&&<div style={{marginTop:13,padding:12,background:"#f7f4ed",borderRadius:9}}>{classStudents.length?<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{classStudents.map(s=><button type="button" key={s.id} onClick={()=>toggle(s.id)} style={{padding:"7px 10px",borderRadius:999,border:selected.includes(s.id)?"2px solid #526b60":"1px solid #d8d5cd",background:selected.includes(s.id)?"#edf1ec":"white",fontWeight:700,cursor:"pointer"}}>{selected.includes(s.id)?"✓ ":""}{s.name}</button>)}</div>:<span>Der er ingen elever i klassen endnu.</span>}</div>}
    <button disabled={disabled} onClick={save} style={{marginTop:20,padding:"12px 17px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,fontSize:15,opacity:disabled?0.55:1,cursor:saving?"wait":"pointer"}}>{saving?"Gemmer…":editing?"Gem ændringer":"Tildel opgave nu →"}</button>
   </div>

   <aside style={{background:"#e8eee9",border:"1px solid #d4ddd6",borderRadius:13,padding:18,alignSelf:"start"}}><p style={{fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#65766d",margin:"0 0 4px"}}>ELEVEN FÅR</p><h2 style={{fontFamily:"Georgia,serif",fontSize:23,margin:"5px 0"}}>{taskType}</h2>{assignmentKind==="danish_writing"?<><p style={{...small,lineHeight:1.5}}><strong>Formål:</strong> {genre.purpose}</p><p style={{...small,lineHeight:1.5}}><strong>Modtager:</strong> {genre.audience}</p><strong style={{display:"block",marginTop:14}}>Skrivefelter</strong><ol style={{paddingLeft:20,...small,lineHeight:1.7}}>{genre.structure.map(x=><li key={x}>{x}</li>)}</ol></>:template?<><p style={{...small,lineHeight:1.5}}>{template.description}</p><div style={{padding:10,borderRadius:9,background:"white",fontSize:12,lineHeight:1.45}}><strong>Arbejdsråd:</strong> {template.coach}</div><strong style={{display:"block",marginTop:14}}>Arbejdsfelter</strong><ol style={{paddingLeft:20,...small,lineHeight:1.7}}>{template.structure.map(x=><li key={x}>{x}</li>)}</ol></>:<p style={small}>Vælg først et faglokale.</p>}</aside>
  </div>
 </section></main>;
}

const modeButton=(active:boolean):React.CSSProperties=>({padding:"8px 11px",borderRadius:8,border:active?"2px solid #526b60":"1px solid #d8d5cd",background:active?"#edf1ec":"white",fontWeight:800,cursor:"pointer"});
const danger:React.CSSProperties={padding:"8px 11px",borderRadius:8,border:"1px solid #dfb8b2",background:"#fff3ef",color:"#8a3c34",fontWeight:850,cursor:"pointer"};
