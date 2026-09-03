"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";
import {danishCompetencyAreas,danishGradeBand,danishSkillsForGrade,type DanishCompetencyArea} from "../../lib/danishCompetencyCatalog";

type Klass={id:number;name:string};
type Subject={id:number;slug:string;name:string};
type Room={id:number;class_id:number;subject_id:number;active:boolean};

export default function DanishWorkspace(){
 const[ready,setReady]=useState(false),[classes,setClasses]=useState<Klass[]>([]),[classId,setClassId]=useState<number|"">(""),[room,setRoom]=useState<Room|null>(null),[grade,setGrade]=useState<number|"">(""),[message,setMessage]=useState("");

 useEffect(()=>{(async()=>{
  const{data:auth}=await supabase.auth.getSession();if(!auth.session){window.location.replace("/?teacher=1");return}
  const params=new URLSearchParams(window.location.search),wanted=Number(params.get("class")||0);
  const{data,error}=await supabase.from("classes").select("id,name").order("name");
  const rows=(data||[]) as Klass[];setClasses(rows);if(error)setMessage(error.message);
  const initial=rows.some(x=>x.id===wanted)?wanted:(rows[0]?.id||"");setClassId(initial);setReady(true);
 })()},[]);

 useEffect(()=>{(async()=>{
  setRoom(null);if(!classId)return;
  const{data:subject}=await supabase.from("subjects").select("id,slug,name").eq("slug","dansk").eq("active",true).limit(1).maybeSingle();
  if(!subject)return;
  const s=subject as Subject;
  const{data}=await supabase.from("class_subjects").select("id,class_id,subject_id,active").eq("class_id",classId).eq("subject_id",s.id).eq("active",true).limit(1).maybeSingle();
  setRoom((data||null) as Room|null);
 })()},[classId]);

 const selectedClass=classes.find(x=>x.id===classId)||null;
 const selectedGrade=grade===""?null:Number(grade);
 const writingHref=room?`/create-assignment?class=${classId}&subject=${room.id}`:`/students/subjects?class=${classId}`;
 const analysisHref=room?`/create-assignment?class=${classId}&subject=${room.id}&kind=analysis`:`/students/subjects?class=${classId}`;
 const cards=useMemo(()=>danishCompetencyAreas,[]);

 if(!ready)return <main style={{padding:50}}>Åbner Dansk…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 32px"}}><div style={{maxWidth:1140,margin:"auto"}}><small style={{fontWeight:900,opacity:.72}}>DANSK</small><h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"5px 0"}}>Dansk-værktøjer</h1><p style={{margin:"6px 0 0",opacity:.8,maxWidth:760,lineHeight:1.5}}>Læsning, fortolkning, fremstilling, kommunikation, sprog og prøveforberedelse samlet som ét fagligt arbejdsrum.</p></div></header>
  <section style={{maxWidth:1140,margin:"auto",padding:"26px 24px 80px"}}>
   {message&&<div style={{padding:"10px 12px",background:"#fff3cd",borderRadius:9,marginBottom:12}}>{message}</div>}
   <section style={{...card,display:"flex",justifyContent:"space-between",gap:14,alignItems:"end",flexWrap:"wrap"}}><div style={{display:"flex",gap:10,alignItems:"end",flexWrap:"wrap"}}><label style={label}>Klasse<select value={classId} onChange={e=>{const id=e.target.value?Number(e.target.value):"";setClassId(id);if(id)window.history.replaceState({},"",`/danish?class=${id}`)}} style={input}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label style={label}>Se progression for<select value={grade} onChange={e=>setGrade(e.target.value?Number(e.target.value):"")} style={input}><option value="">Alle klassetrin</option>{Array.from({length:10},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}. klasse</option>)}</select></label></div><div><small style={{display:"block",color:"#737a74",marginBottom:5}}>{selectedGrade==null?"Hele progressionen":danishGradeBand(selectedGrade)}</small>{classId&&<Link href={`/students/class-learning-profile?class=${classId}`} style={secondaryLink}>Dansk-overblik →</Link>}</div></section>

   <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12,marginTop:14}}>
    <ActionCard title="Skriveopgave" text={room?`Byg en genreopgave til ${selectedClass?.name||"klassen"} med elevens skrivehjælp tilpasset klassetrin.`:"Dansk-faglokalet skal være oprettet, før opgaven kan kobles sikkert til faget."} href={writingHref} action={room?"+ Ny dansk-opgave":"Åbn faglokaler"}/>
    <ActionCard title="Tekstarbejde & analyse" text={room?"Tildel tekstnært arbejde med fx personer, miljø, fortæller, komposition, virkemidler, argumentation eller fortolkning. Stilladset tilpasses den enkelte elev.":"Dansk-faglokalet skal være oprettet, før tekstarbejdet kan tildeles sikkert."} href={analysisHref} action={room?"+ Nyt tekstarbejde":"Åbn faglokaler"}/>
    <ActionCard title="Grammatik & sprog" text="Tildel målrettet grammatik, retskrivning, tegnsætning og tekstgrammatik med klassetrinsprogression." href="/grammar?mode=assign" action="Åbn træning"/>
    <ActionCard title="Læseprøve & strategier" text="Tildel niveaudelt læseprøve 6.–9. klasse og brug strategiprofilen til målrettet opfølgning." href="/grammar/laeseproeve" action="Åbn læsning"/>
    <ActionCard title="Retskrivningsprøve" text="Træn de prøve-lignende retskrivningsformer med eller uden tid på valgt niveau." href="/grammar/retskrivningsproeve" action="Åbn retskrivning"/>
   </section>

   <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:12,flexWrap:"wrap",marginTop:28}}><div><p style={eyebrow}>FAGLIGT KORT</p><h2 style={{fontFamily:"Georgia,serif",fontSize:30,margin:"4px 0 0"}}>Hvad træner vi i Dansk?</h2></div><small style={{color:"#747a75",maxWidth:430,lineHeight:1.45}}>Klassetrin er Klasseværelsets pædagogiske progression og bruges som støtte — ikke som en hård lås eller en officiel kravtabel.</small></div>
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(330px,1fr))",gap:13,marginTop:13}}>{cards.map(area=><CompetencyCard key={area.id} area={area} grade={selectedGrade}/>)}</div>
  </section>
 </main>;
}

function ActionCard({title,text,href,action}:{title:string;text:string;href:string;action:string}){return <article style={card}><h2 style={{fontFamily:"Georgia,serif",fontSize:22,margin:"0 0 6px"}}>{title}</h2><p style={{color:"#6c746e",fontSize:14,lineHeight:1.5,minHeight:63,margin:"0 0 12px"}}>{text}</p><Link href={href} style={primaryLink}>{action} →</Link></article>}

function CompetencyCard({area,grade}:{area:DanishCompetencyArea;grade:number|null}){
 const skills=danishSkillsForGrade(area,grade),live=skills.filter(x=>x.status==="live").length;
 return <article style={card}><div style={{display:"flex",gap:10,alignItems:"start"}}><span style={{display:"grid",placeItems:"center",width:39,height:39,borderRadius:10,background:"#edf1ec",fontWeight:900,color:"#365044"}}>{area.icon}</span><div><h3 style={{fontFamily:"Georgia,serif",fontSize:22,margin:0}}>{area.title}</h3><p style={{color:"#707670",fontSize:13,lineHeight:1.45,margin:"5px 0"}}>{area.description}</p></div></div><div style={{display:"grid",gap:7,marginTop:12}}>{skills.map(skill=><div key={skill.id} style={{padding:"9px 10px",border:"1px solid #e3dfd6",borderRadius:9,background:skill.status==="live"?"#f8faf7":"#faf8f3"}}><div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"start"}}><strong style={{fontSize:13}}>{skill.title}</strong><span style={skill.status==="live"?liveTag:buildTag}>{skill.status==="live"?"AKTIV":"UNDER UDBYGNING"}</span></div><small style={{display:"block",color:"#737a74",marginTop:3,lineHeight:1.4}}>{skill.description}{grade==null&&<span> · fra ca. {skill.minGrade}. kl.</span>}</small>{skill.href&&skill.status==="live"&&<Link href={skill.href} style={{display:"inline-block",marginTop:5,color:"#365044",fontSize:12,fontWeight:900,textDecoration:"none"}}>Åbn →</Link>}</div>)}</div><small style={{display:"block",marginTop:10,color:"#7a817a"}}>{live}/{skills.length} viste færdigheder har allerede et aktivt værktøj.</small></article>;
}

const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:17};
const label:React.CSSProperties={fontSize:12,fontWeight:900,color:"#56655d"};
const input:React.CSSProperties={display:"block",marginTop:5,padding:"9px 10px",border:"1px solid #d5d1c7",borderRadius:8,background:"white",font:"inherit",minWidth:175};
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:1.3,color:"#718077",margin:0};
const primaryLink:React.CSSProperties={display:"inline-flex",padding:"9px 11px",borderRadius:8,background:"#365044",color:"white",fontWeight:900,textDecoration:"none",fontSize:13};
const secondaryLink:React.CSSProperties={display:"inline-flex",padding:"9px 11px",borderRadius:8,border:"1px solid #d5d1c7",background:"white",color:"#365044",fontWeight:900,textDecoration:"none",fontSize:13};
const liveTag:React.CSSProperties={fontSize:8,fontWeight:900,letterSpacing:.6,padding:"3px 5px",borderRadius:999,background:"#e1eee5",color:"#476452",whiteSpace:"nowrap"};
const buildTag:React.CSSProperties={...liveTag,background:"#f1ece0",color:"#806b43"};
