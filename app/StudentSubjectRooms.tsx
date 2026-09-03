"use client";

import {useEffect,useState} from "react";
import {studentSupabase} from "../lib/studentSupabase";

type Item={id:number;item_type:"post"|"section"|"link"|"material";title:string|null;body:string|null;url:string|null;position:number};
type Assignment={id:number;title:string;type:string;instructions:string|null};
type Room={id:number;subject_id:number;subject_name:string;title:string;intro:string|null;items:Item[];assignments:Assignment[]};
type Payload={ok?:boolean;error?:string;rooms?:Room[]};
type TrainingAssignment={id:number;title:string;subject_id:string;area_id:string;skill_id:string;level_id:string;target_grade:number|null;started:boolean;attempts:number;best_score:number|null;max_score:number|null;mastered:boolean};

const card:React.CSSProperties={background:"#fff",border:"1px solid #d8d5cd",borderRadius:14,padding:20,color:"#26342e"};
const labels:Record<Item["item_type"],string>={post:"Opslag",section:"Sektion",link:"Link",material:"Materiale"};
const subjectLabel=(id:string)=>id==="matematik"?"Matematik":id==="dansk-grammatik"?"Dansk · grammatik":id;

export default function StudentSubjectRooms({sessionToken}:{sessionToken:string}){
 const[rooms,setRooms]=useState<Room[]>([]);
 const[trainingAssignments,setTrainingAssignments]=useState<TrainingAssignment[]>([]);
 const[openRoom,setOpenRoom]=useState<number|null>(null);
 const[loading,setLoading]=useState(true);

 useEffect(()=>{
  let active=true;
  (async()=>{
   if(!sessionToken){if(active){setRooms([]);setTrainingAssignments([]);setLoading(false)}return}
   const[roomResponse,trainingResponse]=await Promise.all([
    studentSupabase.rpc("student_session_subject_rooms",{p_session_token:sessionToken}),
    studentSupabase.rpc("student_session_training_assignments",{p_session_token:sessionToken})
   ]);
   if(!active)return;
   const payload=roomResponse.data as Payload|null;
   setRooms(!roomResponse.error&&payload?.ok&&Array.isArray(payload.rooms)?payload.rooms:[]);
   setTrainingAssignments(!trainingResponse.error&&trainingResponse.data?.ok&&Array.isArray(trainingResponse.data.assignments)?trainingResponse.data.assignments:[]);
   setLoading(false);
  })();
  return()=>{active=false};
 },[sessionToken]);

 if(loading)return <section style={{margin:"28px 0 34px"}}><p className="eyebrow">DINE FAG</p><div style={card}>Henter faglokaler…</div></section>;
 if(rooms.length===0&&trainingAssignments.length===0)return null;

 const trainingBlock=trainingAssignments.length>0&&<section style={{margin:"18px 0 24px"}}>
  <p className="eyebrow">MÅLRETTET TRÆNING FRA DIN LÆRER</p>
  <div style={{display:"grid",gap:9,marginTop:10}}>{trainingAssignments.map(a=><button key={`training-${a.id}`} onClick={()=>window.location.href=`/student-assigned-training?assignment=${a.id}`} style={{...card,textAlign:"left",cursor:"pointer",font:"inherit",display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:12,alignItems:"center",background:a.mastered?"#edf5ef":"#fff"}}>
   <span><small style={{display:"block",fontWeight:900,color:"#718077",letterSpacing:.7}}>{subjectLabel(a.subject_id).toUpperCase()}</small><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:20,marginTop:4}}>{a.title}</strong><small style={{display:"block",color:"#707670",marginTop:4}}>{a.skill_id} · {a.level_id}{a.target_grade!==null?` · ${a.target_grade}. kl. niveau`:""}{a.started&&a.max_score?` · bedste ${a.best_score}/${a.max_score}`:""}</small></span>
   <b style={{color:"#526b60"}}>{a.mastered?"Mestret ✓":a.started?"Fortsæt →":"Start →"}</b>
  </button>)}</div>
 </section>;

 const current=rooms.find(r=>r.id===openRoom)||null;
 if(current)return <section style={{margin:"28px 0 34px"}}>
  <button className="back" onClick={()=>setOpenRoom(null)}>← Dine fag</button>
  <p className="eyebrow">{current.subject_name.toUpperCase()}</p>
  <h2 style={{fontFamily:"Georgia,serif",fontSize:32,margin:"7px 0"}}>{current.title}</h2>
  {current.intro&&<p style={{color:"#667068",fontSize:16,lineHeight:1.55,margin:"0 0 18px"}}>{current.intro}</p>}

  {current.assignments.length>0&&<section style={{margin:"18px 0 22px"}}>
   <p className="eyebrow">OPGAVER I FAGET</p>
   <div style={{display:"grid",gap:9,marginTop:10}}>
    {current.assignments.map(a=><button key={a.id} onClick={()=>window.location.href=`/student-assignment/${a.id}`} style={{...card,textAlign:"left",cursor:"pointer",font:"inherit",display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:12,alignItems:"center"}}>
     <span><strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:20}}>{a.title}</strong><small style={{display:"block",color:"#707670",marginTop:4}}>{a.type}{current.subject_name.toLowerCase()==="dansk"?" · Skrivehjælp følger med":""}</small></span>
     <b style={{color:"#526b60"}}>Åbn →</b>
    </button>)}
   </div>
  </section>}

  <div style={{display:"grid",gap:12}}>
   {current.items.length===0&&current.assignments.length===0?<div style={card}><strong>Der er ikke lagt noget ind endnu.</strong></div>:current.items.map(item=><article key={item.id} style={{...card,background:item.item_type==="section"?"#e9eee9":"#fff"}}>
    <small style={{fontWeight:900,color:"#718077",letterSpacing:.7}}>{labels[item.item_type].toUpperCase()}</small>
    {item.title&&<h3 style={{fontFamily:"Georgia,serif",fontSize:item.item_type==="section"?25:21,margin:"7px 0"}}>{item.title}</h3>}
    {item.body&&<p style={{whiteSpace:"pre-wrap",lineHeight:1.6,color:"#555f58",margin:"7px 0"}}>{item.body}</p>}
    {item.url&&<a href={item.url} target="_blank" rel="noreferrer" style={{display:"inline-block",marginTop:8,color:"#486b59",fontWeight:900}}>Åbn →</a>}
   </article>)}
  </div>
 </section>;

 return <section style={{margin:"28px 0 34px"}}>
  {trainingBlock}
  {rooms.length>0&&<><p className="eyebrow">DINE FAG</p>
  <h2 style={{fontFamily:"Georgia,serif",fontSize:28,margin:"7px 0"}}>Gå ind i dit faglokale</h2>
  <p style={{color:"#707670",marginTop:0}}>Her ligger det, dine lærere har gjort klar til din klasse.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginTop:16}}>
   {rooms.map(room=><button key={room.id} onClick={()=>setOpenRoom(room.id)} style={{...card,textAlign:"left",cursor:"pointer",font:"inherit"}}>
    <small style={{fontWeight:900,color:"#718077"}}>{room.subject_name.toUpperCase()}</small>
    <strong style={{display:"block",fontFamily:"Georgia,serif",fontSize:23,margin:"7px 0 5px"}}>{room.title}</strong>
    <span style={{display:"block",fontSize:14,lineHeight:1.45,color:"#707670",minHeight:40}}>{room.intro||"Åbn faglokalet og se materialer, opslag og opgaver."}</span>
    <small style={{display:"block",marginTop:9,color:"#7a817b",fontWeight:800}}>{room.assignments.length} opgave{room.assignments.length===1?"":"r"}</small>
    <b style={{display:"block",marginTop:10,color:"#526b60"}}>Åbn →</b>
   </button>)}
  </div></>}
 </section>;
}
