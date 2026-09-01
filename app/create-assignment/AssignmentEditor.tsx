"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {useSearchParams} from "next/navigation";
import {supabase} from "../../lib/supabase";
import {hasRole} from "../../lib/roles";
import {danishGenres,danishGenreCategories,danishGenreByName,type DanishGenre,type DanishGenreCategory} from "../../lib/danishGenreCatalog";

type ClassRow={id:number;name:string};
type Student={id:number;name:string;class_id:number|null};
type Room={id:number;class_id:number;subject_id:number;title:string|null};
type Subject={id:number;name:string};
type RoomTeacher={class_subject_id:number;user_id:string};
type ExistingAssignment={id:number;title:string;instructions:string|null;type:string;class_id:number;class_subject_id:number|null};

const input:React.CSSProperties={boxSizing:"border-box",display:"block",width:"100%",marginTop:7,padding:11,border:"1px solid #d8d5cd",borderRadius:8,background:"white",font:"inherit"};
const small:React.CSSProperties={fontSize:12,color:"#707670"};

const legacyGenre=(type:string):DanishGenre|undefined=>{
 if(type==="Artikel")return danishGenres.find(g=>g.id==="artikel")||danishGenres.find(g=>g.id==="nyhedsartikel");
 if(type==="Fortælling")return danishGenres.find(g=>g.id==="novelle");
 return danishGenreByName(type);
};

export default function AssignmentEditor(){
 const search=useSearchParams();
 const editId=Number(search.get("edit"))||0;
 const editing=editId>0;
 const[ready,setReady]=useState(false),[classes,setClasses]=useState<ClassRow[]>([]),[students,setStudents]=useState<Student[]>([]),[rooms,setRooms]=useState<Room[]>([]),[subjects,setSubjects]=useState<Subject[]>([]),[roomTeachers,setRoomTeachers]=useState<RoomTeacher[]>([]),[userId,setUserId]=useState(""),[admin,setAdmin]=useState(false),[error,setError]=useState("");
 const[classId,setClassId]=useState<number|"">(""),[roomId,setRoomId]=useState<number|"">(""),[title,setTitle]=useState(""),[instructions,setInstructions]=useState(""),[genreId,setGenreId]=useState("debatindlaeg"),[category,setCategory]=useState<DanishGenreCategory>("Opinion"),[saving,setSaving]=useState(false),[recipientMode,setRecipientMode]=useState<"class"|"students">("class"),[selected,setSelected]=useState<number[]>([]);

 useEffect(()=>{(async()=>{
  const{data:s}=await supabase.auth.getSession();const user=s.session?.user;if(!user){window.location.href="/?teacher=1";return}
  setUserId(user.id);const isAdmin=hasRole(user,"admin");setAdmin(isAdmin);
  const[c,st,r,sub,rt]=await Promise.all([
   supabase.from("classes").select("id,name").order("id"),
   supabase.from("students").select("id,name,class_id").order("name"),
   supabase.from("class_subjects").select("id,class_id,subject_id,title").eq("active",true),
   supabase.from("subjects").select("id,name").eq("active",true),
   supabase.from("class_subject_teachers").select("class_subject_id,user_id")
  ]);
  const classRows=(c.data||[]) as ClassRow[],roomRows=(r.data||[]) as Room[],teacherRows=(rt.data||[]) as RoomTeacher[];
  setClasses(classRows);setStudents((st.data||[]) as Student[]);setRooms(roomRows);setSubjects((sub.data||[]) as Subject[]);setRoomTeachers(teacherRows);

  if(editing){
   const[a,rec]=await Promise.all([
    supabase.from("assignments").select("id,title,instructions,type,class_id,class_subject_id").eq("id",editId).maybeSingle(),
    supabase.from("assignment_students").select("student_id").eq("assignment_id",editId)
   ]);
   if(a.error||!a.data){setError("Du har ikke adgang til opgaven, eller opgaven findes ikke.");setReady(true);return}
   const row=a.data as ExistingAssignment,found=legacyGenre(row.type);
   setClassId(row.class_id);setRoomId(row.class_subject_id||"");setTitle(row.title);setInstructions(row.instructions||"");
   if(found){setGenreId(found.id);setCategory(found.category)}
   const ids=(rec.data||[]).map(x=>Number(x.student_id));setSelected(ids);setRecipientMode(ids.length?"students":"class");
   setReady(true);return;
  }

  const requestedClass=Number(search.get("class")),requestedRoom=Number(search.get("subject"));
  const allowedRequestedRoom=roomRows.find(x=>x.id===requestedRoom&&(isAdmin||teacherRows.some(t=>t.class_subject_id===x.id&&t.user_id===user.id)));
  const initialClass=allowedRequestedRoom?.class_id||(classRows.some(x=>x.id===requestedClass)?requestedClass:classRows[0]?.id);
  if(initialClass)setClassId(initialClass);
  if(allowedRequestedRoom&&allowedRequestedRoom.class_id===initialClass)setRoomId(allowedRequestedRoom.id);
  setReady(true);
 })()},[search,editId,editing]);

 const genre=useMemo(()=>danishGenres.find(g=>g.id===genreId)||danishGenres[0],[genreId]);
 const categoryGenres=useMemo(()=>danishGenres.filter(g=>g.category===category),[category]);
 const classStudents=students.filter(s=>s.class_id===Number(classId));
 const editableRooms=useMemo(()=>rooms.filter(r=>r.class_id===Number(classId)&&(admin||roomTeachers.some(t=>t.class_subject_id===r.id&&t.user_id===userId)||editing&&r.id===Number(roomId))),[rooms,classId,admin,roomTeachers,userId,editing,roomId]);
 const roomLabel=(room:Room)=>room.title||subjects.find(s=>s.id===room.subject_id)?.name||"Fag";
 function toggle(id:number){setSelected(x=>x.includes(id)?x.filter(v=>v!==id):[...x,id])}
 function chooseCategory(c:DanishGenreCategory){setCategory(c);const first=danishGenres.find(g=>g.category===c);if(first)setGenreId(first.id)}

 async function save(){
  if(!title.trim()||!instructions.trim()||!classId||(recipientMode==="students"&&!selected.length))return;
  setSaving(true);setError("");
  if(editing){
   const{error:e}=await supabase.rpc("update_assignment_and_recipients",{p_assignment_id:editId,p_title:title.trim(),p_instructions:instructions.trim(),p_type:genre.name,p_class_subject_id:roomId||null,p_student_ids:recipientMode==="students"?selected:null});
   if(e){setSaving(false);setError(e.message);return}
   window.location.href=roomId?`/students/subjects/${roomId}`:`/teacher-overview?class=${classId}`;return;
  }
  const{data:a,error:e}=await supabase.from("assignments").insert({title:title.trim(),instructions:instructions.trim(),type:genre.name,class_id:classId,class_subject_id:roomId||null}).select("id").single();
  if(e){setSaving(false);setError(e.message);return}
  if(recipientMode==="students"){
   const{error:linkError}=await supabase.from("assignment_students").insert(selected.map(student_id=>({assignment_id:a.id,student_id})));
   if(linkError){await supabase.from("assignments").delete().eq("id",a.id);setSaving(false);setError("Opgaven kunne ikke kobles til eleverne: "+linkError.message);return}
  }
  window.location.href=roomId?`/students/subjects/${roomId}`:"/preparation";
 }

 async function removeAssignment(){
  if(!editing)return;
  if(!window.confirm("Slet opgaven permanent? Elevtildelinger, kladder, feedback og koblinger til lektioner bliver også slettet."))return;
  setSaving(true);setError("");
  const{error:e}=await supabase.from("assignments").delete().eq("id",editId);
  if(e){setSaving(false);setError(e.message);return}
  window.location.replace(roomId?`/students/subjects/${roomId}`:`/teacher-overview?class=${classId}`);
 }

 const disabled=saving||!title.trim()||!instructions.trim()||!classId||(recipientMode==="students"&&!selected.length);
 if(!ready)return <main style={{padding:50}}>Henter opgaver…</main>;
 if(error&&!classId)return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:50,color:"#26342e"}}><h1>Opgaven kunne ikke åbnes</h1><p>{error}</p><Link href="/teacher-dashboard">← Klasseværelset</Link></main>;
 const backHref=roomId?`/students/subjects/${roomId}`:editing&&classId?`/teacher-overview?class=${classId}`:"/preparation";
 const currentRoom=editableRooms.find(r=>r.id===Number(roomId));

 return <main style={{minHeight:"100vh",background:"#f5f3ee",padding:"28px 24px 80px",color:"#26342e"}}><section style={{maxWidth:1040,margin:"0 auto"}}>
  <Link href={backHref} style={{color:"#526b60",fontWeight:800,textDecoration:"none"}}>← {roomId&&currentRoom?`Til ${roomLabel(currentRoom)}`:editing?"Til opgaver":"Til Forberedelsen"}</Link>
  <div style={{margin:"25px 0 18px",display:"flex",justifyContent:"space-between",alignItems:"start",gap:14,flexWrap:"wrap"}}><div><p className="eyebrow" style={{margin:"0 0 5px"}}>OPGAVE</p><h1 style={{margin:0}}>{editing?"Redigér opgave":"Lav og send en opgave"}</h1><p style={{color:"#707670",margin:"7px 0 0",maxWidth:720}}>Vælg teksttype, skriv opgaveformuleringen og vælg modtagere. Eleven får genretilpasset skrivehjælp automatisk.</p></div>{editing&&<button onClick={removeAssignment} disabled={saving} style={danger}>Slet opgave</button>}</div>
  {error&&<div style={{padding:"11px 13px",background:"#fff1ed",border:"1px solid #e5c7c0",borderRadius:9,color:"#8a3e36",marginBottom:14}}>{error}</div>}

  <section style={{background:"white",border:"1px solid #dedbd3",borderRadius:14,padding:18,marginBottom:14}}><p style={{fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:"0 0 9px"}}>TEKSTTYPE / GENRE</p><div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{danishGenreCategories.map(c=><button type="button" key={c} onClick={()=>chooseCategory(c)} style={{padding:"8px 11px",borderRadius:999,border:category===c?"2px solid #526b60":"1px solid #d8d5cd",background:category===c?"#edf1ec":"white",fontWeight:800,cursor:"pointer"}}>{c}</button>)}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(175px,1fr))",gap:8,marginTop:12}}>{categoryGenres.map(g=><button type="button" key={g.id} onClick={()=>setGenreId(g.id)} style={{textAlign:"left",padding:13,borderRadius:10,border:genre.id===g.id?"2px solid #526b60":"1px solid #dedbd3",background:genre.id===g.id?"#edf1ec":"#faf9f6",cursor:"pointer"}}><strong>{g.name}</strong><span style={{display:"block",...small,marginTop:4}}>{g.structure.length} skrivefelter</span></button>)}</div></section>

  <div style={{display:"grid",gridTemplateColumns:"minmax(0,1.25fr) minmax(280px,.75fr)",gap:14}}>
   <div style={{background:"white",border:"1px solid #dfdcd4",borderRadius:13,padding:20}}>
    <label style={{display:"block",fontWeight:800,fontSize:13}}>Titel<input autoFocus value={title} onChange={e=>setTitle(e.target.value)} placeholder={`Fx ${genre.name} om kunstig intelligens`} style={input}/></label>
    <label style={{display:"block",fontWeight:800,fontSize:13,marginTop:16}}>Opgaveformulering<textarea value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Skriv hvad eleven skal undersøge, skrive eller producere." rows={5} style={{...input,lineHeight:1.5,resize:"vertical"}}/><span style={{display:"block",fontWeight:400,...small,marginTop:5}}>Det er denne tekst, eleven ser, når opgaven åbnes.</span></label>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginTop:16}}><label style={{fontWeight:800,fontSize:13}}>Klasse<select disabled={editing} value={classId} onChange={e=>{setClassId(Number(e.target.value));setSelected([]);setRoomId("")}} style={{...input,opacity:editing?.7:1}}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>{editing&&<small style={{display:"block",fontWeight:400,...small,marginTop:4}}>Klassen låses på eksisterende opgaver for at beskytte elevbesvarelser.</small>}</label><label style={{fontWeight:800,fontSize:13}}>Faglokale <span style={{fontWeight:400,color:"#777"}}>(valgfrit)</span><select value={roomId} onChange={e=>setRoomId(e.target.value?Number(e.target.value):"")} style={input}><option value="">Ingen fagtilknytning</option>{editableRooms.map(r=><option key={r.id} value={r.id}>{roomLabel(r)}</option>)}</select></label></div>
    <div style={{marginTop:16}}><strong style={{fontSize:13}}>Modtagere</strong><div style={{display:"flex",gap:7,marginTop:7,flexWrap:"wrap"}}><button type="button" onClick={()=>{setRecipientMode("class");setSelected([])}} style={modeButton(recipientMode==="class")}>Hele klassen</button><button type="button" onClick={()=>setRecipientMode("students")} style={modeButton(recipientMode==="students")}>Udvalgte elever</button></div></div>
    {recipientMode==="students"&&<div style={{marginTop:13,padding:12,background:"#f7f4ed",borderRadius:9}}>{classStudents.length?<div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{classStudents.map(s=><button type="button" key={s.id} onClick={()=>toggle(s.id)} style={{padding:"7px 10px",borderRadius:999,border:selected.includes(s.id)?"2px solid #526b60":"1px solid #d8d5cd",background:selected.includes(s.id)?"#edf1ec":"white",fontWeight:700,cursor:"pointer"}}>{selected.includes(s.id)?"✓ ":""}{s.name}</button>)}</div>:<span>Der er ingen elever i klassen endnu.</span>}</div>}
    <button disabled={disabled} onClick={save} style={{marginTop:20,padding:"12px 17px",border:0,borderRadius:9,background:"#365044",color:"white",fontWeight:900,fontSize:15,opacity:disabled?0.55:1,cursor:saving?"wait":"pointer"}}>{saving?"Gemmer…":editing?"Gem ændringer":"Tildel opgave nu →"}</button>
   </div>

   <aside style={{background:"#e8eee9",border:"1px solid #d4ddd6",borderRadius:13,padding:18,alignSelf:"start"}}><p style={{fontSize:11,fontWeight:900,letterSpacing:1.2,color:"#65766d",margin:"0 0 4px"}}>ELEVEN FÅR</p><h2 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"0 0 7px"}}>{genre.name}</h2><p style={{fontSize:13,lineHeight:1.5,margin:"0 0 9px"}}><b>Formål:</b> {genre.purpose}</p><p style={{fontSize:13,lineHeight:1.5,margin:"0 0 13px"}}><b>Modtager:</b> {genre.audience}</p><div style={{display:"grid",gap:7}}>{genre.structure.map((x,i)=><div key={`${genre.id}-${i}`} style={{display:"grid",gridTemplateColumns:"25px 1fr",gap:8,alignItems:"start",fontSize:13,lineHeight:1.35}}><span style={{display:"grid",placeItems:"center",width:22,height:22,borderRadius:999,background:"white",fontWeight:900,color:"#526b60"}}>{i+1}</span><span>{x}</span></div>)}</div><div style={{marginTop:14,paddingTop:12,borderTop:"1px solid #cfd9d1"}}><strong style={{fontSize:12}}>Tjekliste</strong>{genre.checklist.map(x=><div key={x} style={{fontSize:12,marginTop:5}}>□ {x}</div>)}</div>{roomId&&currentRoom&&<div style={{marginTop:15,paddingTop:12,borderTop:"1px solid #cfd9d1"}}><small style={{fontWeight:900,color:"#65766d"}}>FAGLOKALE</small><strong style={{display:"block",marginTop:4}}>{roomLabel(currentRoom)}</strong></div>}</aside>
  </div>
 </section></main>;
}

const modeButton=(active:boolean):React.CSSProperties=>({padding:"10px 13px",borderRadius:8,border:"1px solid #526b60",background:active?"#526b60":"white",color:active?"white":"#26342e",fontWeight:800,cursor:"pointer"});
const danger:React.CSSProperties={border:"1px solid #d9aaa3",borderRadius:9,padding:"9px 12px",background:"white",color:"#8a3e36",fontWeight:900,cursor:"pointer"};