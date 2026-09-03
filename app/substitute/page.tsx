"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {supabase} from "../../lib/supabase";

type Row={
 assignment_id:number;school_id:number;schedule_entry_id:number;assignment_date:string;start_time:string;end_time:string;subject:string;room:string|null;class_id:number;class_name:string;substitute_plan:string|null;lesson_instance_id:number|null;subject_unit_title:string|null;attendance_checked_at:string|null;resource_count:number;
 handover_done:string|null;handover_not_done:string|null;handover_note:string|null;handover_updated_at:string|null;
};
type Draft={done:string;notDone:string;note:string};

const iso=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const dateLabel=(date:string)=>new Date(`${date}T12:00:00`).toLocaleDateString("da-DK",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const minutes=(value:string)=>{const[h,m]=value.slice(0,5).split(":").map(Number);return h*60+m};
const hrefFor=(row:Row)=>`/calendar/lesson/${row.schedule_entry_id}?date=${row.assignment_date}`;

export default function SubstitutePage(){
 const[date,setDate]=useState(()=>iso(new Date()));
 const[rows,setRows]=useState<Row[]>([]);
 const[drafts,setDrafts]=useState<Record<number,Draft>>({});
 const[messages,setMessages]=useState<Record<number,string>>({});
 const[saving,setSaving]=useState<number|null>(null);
 const[ready,setReady]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const[clock,setClock]=useState(()=>new Date());

 async function load(target=date){
  setLoading(true);setError("");
  const{data,error:e}=await supabase.rpc("substitute_day_workspace",{p_date:target});
  if(e){setError(e.message);setRows([])}
  else{
   const next=(data||[]) as Row[];
   setRows(next);
   setDrafts(Object.fromEntries(next.map(row=>[row.assignment_id,{done:row.handover_done||"",notDone:row.handover_not_done||"",note:row.handover_note||""}])));
  }
  setLoading(false);
 }
 useEffect(()=>{(async()=>{const{data}=await supabase.auth.getSession();if(!data.session){location.replace("/");return}await load(date);setReady(true)})()},[]);
 useEffect(()=>{const id=window.setInterval(()=>setClock(new Date()),30000);return()=>window.clearInterval(id)},[]);

 async function move(amount:number){const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+amount);const next=iso(d);setDate(next);setMessages({});await load(next)}
 async function today(){const next=iso(new Date());setDate(next);setClock(new Date());setMessages({});await load(next)}
 function setDraft(id:number,key:keyof Draft,value:string){setDrafts(v=>({...v,[id]:{...(v[id]||{done:"",notDone:"",note:""}),[key]:value}}));setMessages(v=>({...v,[id]:""}))}
 async function saveHandover(row:Row){
  if(saving!==null)return;
  const draft=drafts[row.assignment_id]||{done:"",notDone:"",note:""};
  setSaving(row.assignment_id);setMessages(v=>({...v,[row.assignment_id]:"Gemmer…"}));
  const{error:e}=await supabase.rpc("save_substitute_handover",{p_assignment_id:row.assignment_id,p_done:draft.done||null,p_not_done:draft.notDone||null,p_note:draft.note||null});
  if(e)setMessages(v=>({...v,[row.assignment_id]:`Kunne ikke gemme: ${e.message}`}));
  else{await load(date);setMessages(v=>({...v,[row.assignment_id]:"Overleveringen er gemt ✓"}))}
  setSaving(null);
 }

 const todayDate=iso(clock);
 const nowMinutes=clock.getHours()*60+clock.getMinutes();
 const live=useMemo(()=>{
  if(date!==todayDate)return{current:null as Row|null,next:null as Row|null};
  const current=rows.find(row=>nowMinutes>=minutes(row.start_time)&&nowMinutes<minutes(row.end_time))||null;
  const next=rows.find(row=>minutes(row.start_time)>nowMinutes)||null;
  return{current,next};
 },[rows,date,todayDate,nowMinutes]);

 if(!ready)return <main style={{padding:50}}>Åbner vikar-mode…</main>;
 return <main style={{minHeight:"100vh",background:"#f5f3ee",color:"#26342e"}}>
  <header style={{background:"#243d33",color:"white",padding:"24px 28px"}}><div style={{maxWidth:900,margin:"auto"}}><small style={{fontWeight:900,letterSpacing:1.4,opacity:.7}}>VIKAR-MODE</small><h1 style={{fontFamily:"Georgia,serif",fontSize:38,margin:"5px 0"}}>Min vikardag</h1><p style={{margin:0,opacity:.8}}>Kun det, du skal bruge til de timer, du er tildelt.</p></div></header>
  <section style={{maxWidth:900,margin:"auto",padding:"28px 24px 70px"}}>
   <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:18}}><div><p style={eyebrow}>VALGT DAG</p><h2 style={{fontFamily:"Georgia,serif",margin:"4px 0 0",textTransform:"capitalize"}}>{dateLabel(date)}</h2></div><div style={{display:"flex",gap:7}}><button onClick={()=>move(-1)} style={nav}>←</button><button onClick={today} style={nav}>I dag</button><button onClick={()=>move(1)} style={nav}>→</button></div></div>

   {date===todayDate&&!loading&&!error&&rows.length>0&&<section style={{...card,marginBottom:15,background:"#e9f0ea",borderColor:"#cbd8cd"}}>
    {live.current?<><small style={liveTag}>NU</small><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"8px 0 4px"}}>{live.current.start_time.slice(0,5)}–{live.current.end_time.slice(0,5)} · {live.current.subject}</h2><p style={{margin:"0 0 12px",color:"#5f6c64"}}>{live.current.class_name}{live.current.room?` · ${live.current.room}`:""}</p><Link href={hrefFor(live.current)} style={primary}>Åbn timen nu →</Link>{live.next&&<p style={{fontSize:12,color:"#6b756f",margin:"12px 0 0"}}><strong>Næste:</strong> {live.next.start_time.slice(0,5)} · {live.next.subject} · {live.next.class_name}</p>}</>:live.next?<><small style={liveTag}>NÆSTE</small><h2 style={{fontFamily:"Georgia,serif",fontSize:27,margin:"8px 0 4px"}}>{live.next.start_time.slice(0,5)}–{live.next.end_time.slice(0,5)} · {live.next.subject}</h2><p style={{margin:"0 0 12px",color:"#5f6c64"}}>{live.next.class_name}{live.next.room?` · ${live.next.room}`:""}</p><Link href={hrefFor(live.next)} style={primary}>Åbn næste time →</Link></>:<><small style={doneTag}>DAGEN ER DÆKKET</small><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"8px 0 4px"}}>Dine vikartimer er slut for i dag</h2><p style={{margin:0,color:"#657069"}}>Tjek gerne, at fremmøde og overlevering er gemt på de timer, hvor det er relevant.</p></>}
   </section>}

   {error&&<div style={{...card,background:"#fff3cd",color:"#765b29"}}>Vikardagen kunne ikke hentes: {error}</div>}
   {loading?<div style={card}>Henter dine vikartimer…</div>:rows.length===0&&!error?<section style={card}><strong>Ingen vikartimer denne dag.</strong><p style={{color:"#707670",marginBottom:0}}>Når ledelsen tildeler dig en vikartime, dukker den automatisk op her.</p></section>:<div style={{display:"grid",gap:12}}>{rows.map(row=>{
    const href=hrefFor(row),isNow=live.current?.assignment_id===row.assignment_id,isNext=!live.current&&live.next?.assignment_id===row.assignment_id;
    const draft=drafts[row.assignment_id]||{done:"",notDone:"",note:""};
    const saved=!!row.handover_updated_at;
    return <article key={row.assignment_id} style={{...card,borderColor:isNow?"#91ad98":isNext?"#b9c9bb":"#ddd9d0",boxShadow:isNow?"0 0 0 2px rgba(72,107,89,.08)":"none"}}>
     <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start",flexWrap:"wrap"}}><div><div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}><small style={eyebrow}>{row.start_time.slice(0,5)}–{row.end_time.slice(0,5)} · {row.subject.toUpperCase()}</small>{isNow&&<span style={liveTag}>NU</span>}{isNext&&<span style={nextTag}>NÆSTE</span>}</div><h2 style={{fontFamily:"Georgia,serif",fontSize:25,margin:"5px 0"}}>{row.class_name}</h2><div style={{color:"#707670",fontSize:13}}>{row.room?`Lokale ${row.room}`:"Intet lokale angivet"}{row.subject_unit_title?` · ${row.subject_unit_title}`:""}</div></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{row.resource_count>0&&<span style={chip}>{row.resource_count} materiale{row.resource_count===1?"":"r"}</span>}{row.attendance_checked_at?<span style={doneChip}>Fremmøde ført ✓</span>:<span style={attentionChip}>Fremmøde mangler</span>}{saved&&<span style={doneChip}>Overlevering gemt ✓</span>}</div></div>
     <section style={{marginTop:15,padding:"13px 14px",borderRadius:10,background:"#eef2ed",border:"1px solid #d8e0d9"}}><small style={eyebrow}>VIKARPLAN</small>{row.substitute_plan?<p style={{whiteSpace:"pre-wrap",lineHeight:1.55,margin:"7px 0 0"}}>{row.substitute_plan}</p>:<p style={{color:"#747b75",margin:"7px 0 0"}}>Der er ikke skrevet en særskilt vikarplan. Åbn lektionen for lærerens plan og materialer.</p>}</section>
     <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}><Link href={href} style={primary}>Åbn lektion →</Link><Link href={`/calendar?date=${row.assignment_date}`} style={secondary}>Åbn kalender</Link></div>

     <details style={{marginTop:15,borderTop:"1px solid #e5e1d8",paddingTop:13}}>
      <summary style={{cursor:"pointer",fontWeight:900,color:"#486b59"}}>Overlever til læreren {saved?"✓":""}</summary>
      <div style={{marginTop:12,padding:"14px",borderRadius:10,background:"#faf8f3",border:"1px solid #e3ddd1"}}>
       <p style={{fontSize:13,color:"#6d736e",lineHeight:1.5,margin:"0 0 12px"}}>En kort note er nok. Skriv det, der hjælper læreren videre. Undgå følsomme elevoplysninger her — brug elevens sikre profil, hvis noget skal dokumenteres om en bestemt elev.</p>
       <div style={{display:"grid",gap:10}}>
        <label style={label}>Det nåede vi<textarea value={draft.done} onChange={e=>setDraft(row.assignment_id,"done",e.target.value)} rows={3} maxLength={5000} placeholder="Fx Vi nåede kapitel 4 og den fælles opsamling." style={field}/></label>
        <label style={label}>Det nåede vi ikke<textarea value={draft.notDone} onChange={e=>setDraft(row.assignment_id,"notDone",e.target.value)} rows={3} maxLength={5000} placeholder="Fx Gruppeopgaven blev ikke færdig og kan fortsættes næste gang." style={field}/></label>
        <label style={label}>Vigtigt til læreren <span style={{fontWeight:500}}>(valgfri)</span><textarea value={draft.note} onChange={e=>setDraft(row.assignment_id,"note",e.target.value)} rows={3} maxLength={5000} placeholder="Fx Klassen havde brug for ekstra tid til instruktionen." style={field}/></label>
       </div>
       <div style={{display:"flex",gap:9,alignItems:"center",flexWrap:"wrap",marginTop:11}}><button type="button" onClick={()=>saveHandover(row)} disabled={saving===row.assignment_id} style={{...saveButton,opacity:saving===row.assignment_id?.55:1}}>{saving===row.assignment_id?"Gemmer…":"Gem overlevering"}</button>{row.handover_updated_at&&<small style={{color:"#69736d",fontWeight:800}}>Senest gemt {new Date(row.handover_updated_at).toLocaleString("da-DK",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</small>}</div>
       {messages[row.assignment_id]&&<div style={{marginTop:9,fontSize:13,fontWeight:800,color:messages[row.assignment_id].startsWith("Kunne")?"#8a453b":"#4d6657"}}>{messages[row.assignment_id]}</div>}
      </div>
     </details>
    </article>})}</div>}
   <section style={{...card,marginTop:18,background:"#f0ede6"}}><small style={eyebrow}>ADGANG</small><p style={{margin:"7px 0 0",lineHeight:1.5,color:"#626a63"}}>Vikar-mode viser kun dine egne tildelte vikartimer. Inde i lektionen kan du se lærerens plan og materialer og føre fremmøde, men du kan ikke omskrive lærerens forberedelse.</p></section>
  </section>
 </main>;
}
const card:React.CSSProperties={background:"white",border:"1px solid #ddd9d0",borderRadius:14,padding:18};
const eyebrow:React.CSSProperties={fontSize:10,fontWeight:900,letterSpacing:1.2,color:"#718077",margin:0};
const nav:React.CSSProperties={border:"1px solid #cbc7be",background:"white",borderRadius:8,padding:"8px 11px",fontWeight:850,color:"#365044",cursor:"pointer"};
const chip:React.CSSProperties={padding:"5px 7px",borderRadius:999,background:"#eef1ed",fontSize:10,fontWeight:900,color:"#59675f"};
const doneChip:React.CSSProperties={...chip,background:"#e3eee5",color:"#46614d"};
const attentionChip:React.CSSProperties={...chip,background:"#f4eee0",color:"#75623f"};
const liveTag:React.CSSProperties={...chip,background:"#365044",color:"white",letterSpacing:.6};
const nextTag:React.CSSProperties={...chip,background:"#dfe9e1",color:"#486b59",letterSpacing:.6};
const doneTag:React.CSSProperties={...chip,background:"#e7eee9",color:"#53675b",letterSpacing:.6};
const primary:React.CSSProperties={display:"inline-block",padding:"10px 13px",borderRadius:8,background:"#365044",color:"white",fontWeight:900,textDecoration:"none",fontSize:12};
const secondary:React.CSSProperties={...primary,background:"white",color:"#365044",border:"1px solid #c9d2cc"};
const label:React.CSSProperties={fontSize:12,fontWeight:900,color:"#4f5c54"};
const field:React.CSSProperties={display:"block",width:"100%",boxSizing:"border-box",marginTop:5,padding:"10px 11px",border:"1px solid #d4d0c7",borderRadius:8,font:"inherit",background:"white",resize:"vertical"};
const saveButton:React.CSSProperties={border:0,borderRadius:8,padding:"10px 13px",background:"#486b59",color:"white",fontWeight:900,cursor:"pointer"};
